#!/usr/bin/env python3
"""
manage.py — ERP system management script

Usage:
  python manage.py <command> [options]

Commands:
  setup            First-time setup (Docker + init data)
  deploy           Update code + backup + migrate DB (safe)
  deploy-fresh     ⚠️  WIPE data + load init_data.sql
  build            Build Docker images only
  stop             Stop all services
  restart          Restart all services
  status           Show running status and health
  backup           Backup database to backups/
  restore <file>   Restore database from backup
  restore-append   Append data from SQL file without wiping
  migrate          Apply incremental DB migrations
  update-init      Snapshot current DB to init_data.sql
  export-clean     Export clean init_data.sql (master only)
  logs             Tail live logs from all services
  list-backups     List available backup files
  build-apk        📱 Build Android APK via Capacitor + Gradle
  build-appimage   🖥️  Build Linux AppImage via Tauri
  build-exe        🪟 Build Windows EXE via Tauri

Options:
  --yes, -y        Skip confirmation prompts (use with caution)
  --verbose, -v    Show detailed command output

Examples:
  python manage.py setup
  python manage.py backup
  python manage.py restore backup_20260329_120000.sql
  python manage.py deploy
  python manage.py deploy --yes
"""

from __future__ import annotations

import argparse
import datetime
import logging
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, NoReturn

logging.basicConfig(
    format="%(message)s",
    level=logging.INFO,
)
log = logging.getLogger("manage")


# ─── Config ─────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Settings:
    compose_file: Path = field(default_factory=lambda: Path(__file__).parent / "docker-compose.yml")
    backup_dir: Path = field(default_factory=lambda: Path(__file__).parent / "backups")
    backup_retention: int = 10
    db_service: str = "db"
    backend_service: str = "backend"
    frontend_service: str = "frontend"
    db_name: str = "inventory_db"
    db_user: str = "postgres"
    health_url: str = "http://localhost:8080/api/health"
    init_sql: Path = field(default_factory=lambda: Path(__file__).parent / "data" / "sql" / "init_data.sql")
    migrate_py: Path = field(default_factory=lambda: Path(__file__).parent / "scripts" / "migrate.py")
    frontend_dir: Path = field(default_factory=lambda: Path(__file__).parent / "frontend")
    verbose: bool = False


# ─── Docker helpers ────────────────────────────────────────────────────────


class Docker:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._base = ["docker", "compose", "-f", str(settings.compose_file)]

    def _run(
        self,
        args: list[str],
        *,
        capture: bool = False,
        input_data: str | None = None,
        check: bool = True,
        desc: str = "",
    ) -> subprocess.CompletedProcess:
        cmd = self._base + args
        if self.settings.verbose and desc:
            log.info("  $ %s", " ".join(str(a) for a in cmd))
        kwargs: dict = {}
        if capture or input_data is not None:
            kwargs["capture_output"] = True
            kwargs["text"] = True
        if input_data is not None:
            kwargs["input"] = input_data
        result = subprocess.run(cmd, check=False, **kwargs)
        if check and result.returncode != 0:
            msg = desc or "docker compose command failed"
            stderr = (result.stderr or "").strip()[:500]
            log.error("❌ %s (exit %d)", msg, result.returncode)
            if stderr:
                log.error("   %s", stderr)
            sys.exit(1)
        return result

    def up(self, *extra: str) -> None:
        self._run(["up", "-d", *extra], desc="Starting services")

    def stop(self, *services: str) -> None:
        self._run(["stop", *services], desc="Stopping services")

    def start(self, *services: str) -> None:
        self._run(["start", *services], desc="Starting services")

    def restart(self) -> None:
        self._run(["restart"], desc="Restarting services")

    def build(self) -> None:
        self._run(["build"], desc="Building images")

    def down(self, *extra: str) -> None:
        self._run(["down", *extra], desc="Tearing down containers")

    def ps(self) -> None:
        self._run(["ps"], desc=None)

    def logs(self, *extra: str) -> None:
        self._run(["logs", *extra], desc=None)

    def exec_db(
        self,
        cmd: list[str],
        *,
        input_data: str | None = None,
        capture: bool = False,
        check: bool = True,
    ) -> subprocess.CompletedProcess:
        return self._run(
            ["exec", "-T", self.settings.db_service, *cmd],
            input_data=input_data,
            capture=capture,
            check=check,
            desc=f"Running on db: {' '.join(cmd)}",
        )

    def exec_backend(
        self,
        cmd: list[str],
        *,
        input_data: str | None = None,
        capture: bool = False,
        check: bool = True,
    ) -> subprocess.CompletedProcess:
        return self._run(
            ["exec", "-T", self.settings.backend_service, *cmd],
            input_data=input_data,
            capture=capture,
            check=check,
            desc=f"Running on backend: {' '.join(cmd)}",
        )

    def pg_dump(self, extra_args: list[str] | None = None) -> bytes:
        result = self._run(
            [
                "exec", "-T", self.settings.db_service, "pg_dump",
                "-U", self.settings.db_user, "--no-password",
                self.settings.db_name,
                *(extra_args or []),
            ],
            capture=True,
            desc="Dumping database",
            check=True,
        )
        return result.stdout.encode("utf-8") if isinstance(result.stdout, str) else result.stdout

    def health_check(self, timeout: int = 5) -> bool:
        try:
            r = subprocess.run(
                ["curl", "-sf", self.settings.health_url],
                capture_output=True, text=True, timeout=timeout,
            )
            return r.returncode == 0 and "ok" in r.stdout
        except Exception:
            return False

    def require_db_running(self) -> None:
        if not self.health_check():
            log.error("❌ System is not running. Start it with: python manage.py setup")
            sys.exit(1)

    def wait_for_health(self, timeout: int = 60) -> None:
        for _ in range(timeout // 2):
            if self.health_check():
                return
            time.sleep(2)
        log.error("❌ Health check timed out after %ds", timeout)
        sys.exit(1)


# ─── Commands ──────────────────────────────────────────────────────────────


def cmd_build(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Build Docker images without deploying."""
    log.info("🔨 Building images...")
    docker.build()
    log.info("✅ Build complete.")


def cmd_setup(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """First-time setup: check Docker, build images, start services."""
    log.info("🔧 Running first-time setup...")

    if not shutil.which("docker"):
        log.error("❌ docker not found in PATH. Install Docker first.")
        sys.exit(1)

    init_path = settings.init_sql
    if not init_path.exists():
        log.warning("⚠️  No init_data.sql found — starting with empty database.")

    docker.up("--build")
    docker.wait_for_health()

    log.info("✅ Setup complete!")
    log.info("🌐 http://localhost")
    log.info("👤 ammar / changeme")
    _show_status(docker)


def cmd_deploy(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Update code while preserving data."""
    if not opts.yes:
        _confirm("🚀 Deploy? (auto-backup will run first)")

    log.info("💾 Backing up current data...")
    _run_backup(settings, docker)
    log.info("🔨 Building new images...")
    docker.build()
    log.info("▶️  Restarting services...")
    docker.up()
    log.info("⏳ Waiting for DB...")
    time.sleep(8)
    _maybe_run_migrations(settings)
    log.info("✅ Deployed successfully.")
    _show_status(docker)


def cmd_deploy_fresh(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Wipe data and reload from init_data.sql. For new machines or resets."""
    if not opts.yes:
        _confirm("⚠️  This will WIPE ALL DATA and load init_data.sql from repo")

    if not settings.init_sql.exists():
        log.error("❌ init_data.sql not found in repo root.")
        sys.exit(1)

    log.info("🗑️  Removing volumes...")
    docker.down("-v")
    log.info("🔨 Building images...")
    docker.build()
    log.info("▶️  Starting (init_data.sql loads automatically)...")
    docker.up()
    docker.wait_for_health()
    log.info("✅ Fresh deploy complete — data loaded from init_data.sql.")
    _show_status(docker)


def cmd_stop(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Stop all services."""
    log.info("🛑 Stopping all services...")
    docker.stop()
    log.info("✅ Stopped.")


def cmd_restart(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Restart all services."""
    log.info("🔄 Restarting all services...")
    docker.restart()
    _show_status(docker)


def cmd_status(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Show container status and health."""
    _show_status(docker)


def cmd_backup(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Backup database to backups/ directory."""
    _run_backup(settings, docker)


def cmd_restore(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Restore database from a backup file. WIPES existing data."""
    path = _resolve_backup_path(settings, opts.file)
    if not path:
        _list_backups(settings)
        sys.exit(1)

    if not opts.yes:
        _confirm(f"⚠️  This will OVERWRITE ALL data with {path.name}")

    log.info("📥 Restoring from %s...", path)
    docker.stop(settings.backend_service, settings.frontend_service)
    docker.exec_db(["psql", "-U", settings.db_user, "-c", f"DROP DATABASE IF EXISTS {settings.db_name};"])
    docker.exec_db(["psql", "-U", settings.db_user, "-c", f"CREATE DATABASE {settings.db_name};"])

    content = _decode_sql_bytes(path.read_bytes())
    result = docker.exec_db(
        ["psql", "-U", settings.db_user, settings.db_name],
        input_data=content, capture=True, check=False,
    )
    _warn_restore_errors(result.stderr)
    docker.start(settings.backend_service, settings.frontend_service)
    log.info("✅ Restore complete.")
    _show_status(docker)


def cmd_restore_append(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Append data from SQL file without wiping existing data."""
    path = _resolve_backup_path(settings, opts.file)
    if not path:
        log.error("❌ File not found: %s", opts.file)
        sys.exit(1)

    if not opts.yes:
        _confirm(f"Append data from {path.name} to existing DB?")

    log.info("📥 Appending from %s...", path)
    raw_sql = path.read_text(encoding="utf-8")
    safe_sql = (
        "SET session_replication_role = replica;\n"
        + raw_sql
        + "\nSET session_replication_role = DEFAULT;\n"
        + f"""
INSERT INTO users (id, username, full_name, hashed_password, role, is_active)
VALUES (gen_random_uuid(), 'admin', 'مدير النظام',
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', true)
ON CONFLICT (username) DO NOTHING;
"""
    )
    result = docker.exec_db(
        ["psql", "-U", settings.db_user, settings.db_name],
        input_data=safe_sql, capture=True, check=False,
    )
    errors = [
        l for l in result.stderr.splitlines()
        if "ERROR" in l and "duplicate" not in l.lower() and "already exists" not in l
    ]
    if errors:
        log.warning("⚠️  Warnings:\n%s", "\n".join(errors[:10]))
    else:
        log.info("✅ Append complete.")


def cmd_migrate(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Apply incremental DB migrations (safe, idempotent)."""
    _maybe_run_migrations(settings)


def cmd_update_init(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Snapshot current DB state into init_data.sql."""
    docker.require_db_running()
    log.info("📸 Snapshotting current DB to init_data.sql...")
    raw = docker.pg_dump(["--no-owner", "--no-acl"])
    settings.init_sql.write_bytes(raw)
    lines = raw.decode("utf-8").count("\n")
    log.info("✅ init_data.sql updated (%s lines)", f"{lines:,}")


def cmd_export_clean(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Export clean init_data.sql — master data only, no transactions."""
    docker.require_db_running()

    master_tables = [
        "users", "warehouses", "categories", "subcategories",
        "suppliers", "customers", "payment_wallets", "safes",
        "store_settings", "hr_employees", "hr_settings", "financial_categories",
    ]

    log.info("📦 Exporting clean init_data.sql...")

    schema = docker.pg_dump(["--schema-only", "--no-owner", "--no-acl"]).decode("utf-8")
    parts: list[str] = [schema, "\n"]

    for tbl in master_tables:
        r = docker.exec_db(
            [
                "pg_dump", "-U", settings.db_user, "-d", settings.db_name,
                "--data-only", "--no-owner", "--no-acl", f"--table={tbl}",
            ],
            capture=True,
        )
        parts.append(r.stdout or "")

    r = docker.exec_db(
        [
            "pg_dump", "-U", settings.db_user, "-d", settings.db_name,
            "--data-only", "--no-owner", "--no-acl", "--table=products",
        ],
        capture=True,
    )
    parts.append(r.stdout or "")
    parts.append("\n-- Reset all products to untracked\nUPDATE products SET stock_status='untracked';\n")

    sql = "".join(parts)
    settings.init_sql.write_text(sql, encoding="utf-8")
    log.info("✅ Clean init_data.sql exported (%s lines)", f"{sql.count(chr(10)):,}")
    log.info("   Products: untracked | Transactions: empty")


def cmd_logs(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Tail live logs from all services."""
    log.info("📋 Press Ctrl+C to exit")
    try:
        docker.logs("--tail=50", "-f")
    except KeyboardInterrupt:
        pass


def cmd_list_backups(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """List available backup files."""
    _list_backups(settings)


# ─── App build commands ────────────────────────────────────────────────────


def _npm_run(settings: Settings, script: str) -> None:
    log.info("⚡ npm run %s", script)
    result = subprocess.run(
        ["npm", "run", script],
        cwd=str(settings.frontend_dir),
    )
    if result.returncode != 0:
        log.error("❌ npm run %s failed (exit %d)", script, result.returncode)
        sys.exit(1)


def _gradle_build(settings: Settings, task: str) -> None:
    android_dir = settings.frontend_dir / "android"
    if not android_dir.exists():
        log.error("❌ Android project not found at %s", android_dir)
        log.error("   Run: cd frontend && npx cap add android")
        sys.exit(1)
    log.info("🏗️  Running gradle %s...", task)
    gradlew = android_dir / "gradlew"
    if not gradlew.exists():
        log.error("❌ gradlew not found in %s", android_dir)
        sys.exit(1)
    result = subprocess.run([str(gradlew), task], cwd=str(android_dir))
    if result.returncode != 0:
        log.error("❌ Gradle %s failed (exit %d)", task, result.returncode)
        sys.exit(1)


def cmd_build_apk(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Build Android APK via Capacitor + Gradle."""
    if not shutil.which("npm"):
        log.error("❌ npm not found in PATH")
        sys.exit(1)

    if not opts.no_icons:
        log.info("🎨 Generating app icons from store logo...")
        _npm_run(settings, "generate-icons")

    log.info("🔨 Building frontend...")
    _npm_run(settings, "build")

    log.info("📱 Syncing Capacitor Android...")
    _npm_run(settings, "cap:sync")

    flavor = "release" if opts.release else "debug"
    output_dir = f"app/build/outputs/apk/{flavor}/"
    log.info("🏗️  Building %s APK...", flavor)
    _gradle_build(settings, f"assemble{flavor.capitalize()}")

    apk_dir = settings.frontend_dir / "android" / output_dir
    apks = list(apk_dir.glob("*.apk"))
    if apks:
        log.info("✅ APK ready: %s", apks[0])
        size_mb = apks[0].stat().st_size / (1024 * 1024)
        log.info("   Size: %.1f MB", size_mb)
        # Copy to project root for easy access
        dst = Path.cwd() / apks[0].name
        import shutil as _shutil
        _shutil.copy2(apks[0], dst)
        log.info("   Copied to: %s", dst)
    else:
        log.warning("⚠️  No APK found in %s", apk_dir)
    log.info("✅ Build complete.")


def cmd_build_appimage(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Build Linux AppImage via Tauri."""
    if not shutil.which("npm"):
        log.error("❌ npm not found in PATH")
        sys.exit(1)

    if not opts.no_icons:
        log.info("🎨 Generating app icons from store logo...")
        _npm_run(settings, "generate-icons")

    log.info("🔨 Building frontend + Tauri bundle...")
    _npm_run(settings, "build:desktop")

    tauri_dir = settings.frontend_dir / "src-tauri" / "target" / "release" / "bundle"
    log.info("")
    log.info("✅ Desktop build complete.")
    log.info("   Check %s for artifacts.", tauri_dir)
    if tauri_dir.exists():
        for f in sorted(tauri_dir.rglob("*")):
            if f.is_file() and f.suffix in (".AppImage", ".deb", ".exe", ".msi", ".dmg"):
                size_mb = f.stat().st_size / (1024 * 1024)
                log.info("   📦 %s  (%.1f MB)", f.name, size_mb)


def cmd_build_exe(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Build Windows EXE via Tauri."""
    cmd_build_appimage(settings, docker, opts)


def cmd_cron(settings: Settings, docker: Docker, opts: argparse.Namespace) -> None:
    """Run scheduled background automation jobs."""
    job = getattr(opts, "job", None)
    lines = [
        "import asyncio",
        "import main",
        "from app.db.base import AsyncSessionLocal",
        "from app.modules.automation_worker.runner import run_all_jobs, run_job",
        "",
        "async def run():",
        "    async with AsyncSessionLocal() as db:",
    ]
    if job:
        lines.append(f"        res = await run_job('{job}', db)")
        lines.append("        print('Job Result:', res)")
    else:
        lines.append("        results = await run_all_jobs(db)")
        lines.append("        for r in results:")
        lines.append("            msg = r.get('message') or r.get('error')")
        lines.append("            print(f'[{r[\"status\"].upper()}] {r[\"title\"]} ({r[\"duration_ms\"]}ms): {msg}')")
    lines.append("")
    lines.append("asyncio.run(run())")
    script = "\n".join(lines)
    log.info("⚡ Executing background automation jobs in backend container...")
    docker.exec_backend(["python3", "-c", script])



# ─── Internal helpers ──────────────────────────────────────────────────────


def _run_backup(settings: Settings, docker: Docker) -> Path:
    settings.backup_dir.mkdir(exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    out = settings.backup_dir / f"backup_{ts}.sql"

    docker.require_db_running()
    log.info("💾 Creating backup → %s", out)

    raw = docker.pg_dump()
    out.write_bytes(raw)
    size_kb = out.stat().st_size // 1024
    log.info("✅ Backup saved: %s (%s KB)", out, f"{size_kb:,}")

    # Prune old backups
    backups = sorted(settings.backup_dir.glob("backup_*.sql"))
    for old in backups[:-settings.backup_retention]:
        old.unlink()
        log.info("🧹 Pruned old backup: %s", old.name)

    return out


def _resolve_backup_path(settings: Settings, name: str | None) -> Path | None:
    if not name:
        return None
    p = Path(name)
    if p.exists():
        return p.resolve()
    alt = settings.backup_dir / name
    if alt.exists():
        return alt.resolve()
    return None


def _list_backups(settings: Settings) -> None:
    backups = sorted(settings.backup_dir.glob("backup_*.sql")) if settings.backup_dir.exists() else []
    if not backups:
        log.info("No backups found in %s", settings.backup_dir)
        return
    log.info("Available backups:")
    for b in backups:
        size = b.stat().st_size // 1024
        log.info("  %s  (%s KB)", b.name, f"{size:,}")


def _show_status(docker: Docker) -> None:
    log.info("")
    log.info("=== Container Status ===")
    docker.ps()
    log.info("")
    if docker.health_check():
        log.info("✅ System is UP — %s", docker.settings.health_url)
    else:
        log.warning("⚠️  Health check failed — system may still be starting")


def _warn_restore_errors(stderr: str) -> None:
    errors = [
        l for l in stderr.splitlines()
        if "ERROR" in l and "already exists" not in l
    ]
    if errors:
        log.warning("⚠️  Warnings during restore:\n%s", "\n".join(errors[:5]))


def _decode_sql_bytes(raw: bytes) -> str:
    if raw[:2] in (b"\xff\xfe", b"\xfe\xff"):
        encoding = "utf-16-le" if raw[:2] == b"\xff\xfe" else "utf-16-be"
        return raw.decode(encoding)
    return raw.decode("utf-8", errors="replace")


def _maybe_run_migrations(settings: Settings) -> None:
    if not settings.migrate_py.exists():
        log.info("ℹ️  No migrate.py found — skipping migrations.")
        return
    import importlib.util
    spec = importlib.util.spec_from_file_location("migrate", settings.migrate_py)
    if spec and spec.loader:
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        mod.run()
        log.info("✅ Migrations applied.")


def _confirm(msg: str) -> None:
    resp = input(f"{msg}\nType 'yes' to confirm: ").strip().lower()
    if resp != "yes":
        log.info("Cancelled.")
        sys.exit(0)


# ─── CLI entry point ───────────────────────────────────────────────────────


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="manage.py",
        description="ERP system management script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python manage.py setup\n"
            "  python manage.py backup\n"
            "  python manage.py restore backup_20260329_120000.sql\n"
            "  python manage.py deploy --yes\n"
        ),
    )
    parser.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompts")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed command output")

    subparsers = parser.add_subparsers(dest="command", metavar="<command>", required=True)

    for cmd_name, meta in COMMANDS.items():
        fn, help_text = meta["fn"], meta["help"]
        sub = subparsers.add_parser(cmd_name, help=help_text, description=help_text)
        sub.set_defaults(fn=fn)
        if cmd_name in ("restore", "restore-append"):
            sub.add_argument("file", nargs="?", help="Backup filename (in backups/ or full path)")
        if cmd_name in ("build-apk",):
            sub.add_argument("--release", action="store_true", help="Build release APK (requires signing)")
        if cmd_name in ("build-apk", "build-appimage", "build-exe"):
            sub.add_argument("--no-icons", action="store_true", help="Skip icon generation from settings")
        if cmd_name == "cron":
            sub.add_argument("--job", help="Specific automation job to execute (e.g. auto_close_shifts, generate_daily_metrics_digest)")
            sub.add_argument("--run-all", action="store_true", help="Execute all registered background jobs")

    return parser


def main() -> None:
    parser = _build_parser()
    opts = parser.parse_args()

    settings = Settings(verbose=opts.verbose)
    docker = Docker(settings)

    if opts.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    opts.fn(settings, docker, opts)


COMMANDS: dict[str, dict] = {
    "setup":         {"fn": cmd_setup,         "help": "First-time setup: check Docker, build, start services"},
    "deploy":        {"fn": cmd_deploy,        "help": "Update code + backup + migrate DB (safe)"},
    "build":         {"fn": cmd_build,         "help": "Build Docker images without deploying"},
    "deploy-fresh":  {"fn": cmd_deploy_fresh,  "help": "⚠️  WIPE data + load init_data.sql from repo"},
    "stop":          {"fn": cmd_stop,          "help": "Stop all services"},
    "restart":       {"fn": cmd_restart,       "help": "Restart all services"},
    "status":        {"fn": cmd_status,        "help": "Show running status and health"},
    "backup":        {"fn": cmd_backup,        "help": "Backup database to backups/"},
    "restore":       {"fn": cmd_restore,       "help": "Restore database from a backup file (WIPES data)"},
    "restore-append":{"fn": cmd_restore_append,"help": "Append data from SQL file without wiping"},
    "migrate":       {"fn": cmd_migrate,       "help": "Apply incremental DB migrations (safe, idempotent)"},
    "update-init":   {"fn": cmd_update_init,   "help": "Snapshot current DB to init_data.sql"},
    "export-clean":  {"fn": cmd_export_clean,  "help": "Export clean init_data.sql — master data only"},
    "logs":          {"fn": cmd_logs,          "help": "Tail live logs from all services"},
    "list-backups":  {"fn": cmd_list_backups,  "help": "List available backup files"},
    "build-apk":     {"fn": cmd_build_apk,     "help": "Build Android APK via Capacitor + Gradle"},
    "build-appimage":{"fn": cmd_build_appimage,"help": "Build Linux AppImage via Tauri"},
    "build-exe":     {"fn": cmd_build_exe,     "help": "Build Windows EXE via Tauri"},
    "cron":          {"fn": cmd_cron,          "help": "Execute background automation & cron jobs"},
}


if __name__ == "__main__":
    main()
