"""Pluggable Module Loader & Auto-Discovery Engine for Vendora ERP.

Scans the `modules/` directory, discovers self-contained modules via `manifest.json`,
manages module-level configuration schemas & persistence, and dynamically registers
API routers.
"""
from __future__ import annotations

import importlib
import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.settings import StoreSetting

logger = logging.getLogger("vendora.modules")

MODULES_DIR = Path(__file__).resolve().parent


@dataclass
class SettingField:
    key: str
    label: str
    type: str  # "boolean", "number", "string", "select"
    default: Any
    description: str = ""
    options: list[str] | None = None


@dataclass
class ModuleManifest:
    id: str
    name: str
    name_en: str
    category: str
    version: str
    icon: str
    description: str
    target_business_types: list[str] = field(default_factory=list)
    dependencies: list[str] = field(default_factory=list)
    is_core: bool = False
    is_installed: bool = False
    badge: str | None = None
    nav_items: list[dict[str, Any]] = field(default_factory=list)
    settings_schema: list[SettingField] = field(default_factory=list)


class ModuleRegistry:
    def __init__(self, modules_dir: Path = MODULES_DIR) -> None:
        self.modules_dir = modules_dir
        self._manifests: dict[str, ModuleManifest] = {}
        self._routers: dict[str, APIRouter] = {}
        self._discovered = False

    def discover_modules(self) -> dict[str, ModuleManifest]:
        """Scan directory for modules with manifest.json and load them."""
        if self._discovered:
            return self._manifests

        for entry in self.modules_dir.iterdir():
            if not entry.is_dir() or entry.name.startswith(("_", ".")):
                continue

            manifest_file = entry / "manifest.json"
            if not manifest_file.exists():
                continue

            try:
                data = json.loads(manifest_file.read_text(encoding="utf-8"))
                fields_raw = data.get("settings_schema", [])
                settings_schema = [
                    SettingField(
                        key=f["key"],
                        label=f.get("label", f["key"]),
                        type=f.get("type", "string"),
                        default=f.get("default"),
                        description=f.get("description", ""),
                        options=f.get("options"),
                    )
                    for f in fields_raw
                ]

                manifest = ModuleManifest(
                    id=data["id"],
                    name=data["name"],
                    name_en=data.get("name_en", data["name"]),
                    category=data.get("category", "general"),
                    version=data.get("version", "1.0.0"),
                    icon=data.get("icon", "Blocks"),
                    description=data.get("description", ""),
                    target_business_types=data.get("target_business_types", []),
                    dependencies=data.get("dependencies", []),
                    is_core=data.get("is_core", False),
                    badge=data.get("badge"),
                    nav_items=data.get("nav_items", []),
                    settings_schema=settings_schema,
                )
                self._manifests[manifest.id] = manifest
                logger.info("Discovered module: %s v%s", manifest.id, manifest.version)

                # Dynamically load router.py if present
                router_file = entry / "router.py"
                if router_file.exists():
                    try:
                        mod = importlib.import_module(f"app.modules.{entry.name}.router")
                        if hasattr(mod, "router") and isinstance(mod.router, APIRouter):
                            self._routers[manifest.id] = mod.router
                            logger.info("Mounted router for module: %s", manifest.id)
                    except Exception as err:
                        logger.error("Failed to load router for module %s: %s", manifest.id, err)

            except Exception as err:
                logger.error("Failed to parse module manifest at %s: %s", manifest_file, err)

        self._discovered = True
        return self._manifests

    def get_categories(self) -> list[dict[str, Any]]:
        """Load and return category definitions from categories.json in the modules directory."""
        categories_file = self.modules_dir / "categories.json"
        if categories_file.exists():
            try:
                data = json.loads(categories_file.read_text(encoding="utf-8"))
                return data.get("categories", [])
            except Exception as err:
                logger.error("Failed to load categories.json: %s", err)
        return []

    def get_manifest(self, module_id: str) -> ModuleManifest | None:
        if not self._discovered:
            self.discover_modules()
        return self._manifests.get(module_id)

    def get_all_manifests(self) -> list[ModuleManifest]:
        if not self._discovered:
            self.discover_modules()
        return list(self._manifests.values())

    def get_routers(self) -> dict[str, APIRouter]:
        if not self._discovered:
            self.discover_modules()
        return self._routers

    async def get_settings(self, db: AsyncSession, module_id: str) -> dict[str, Any]:
        """Get the schema and current values for a module's settings."""
        manifest = self.get_manifest(module_id)
        if not manifest:
            raise KeyError(f"Module '{module_id}' not found")

        # Build defaults from schema
        defaults = {field.key: field.default for field in manifest.settings_schema}

        # Query database for saved settings
        key = f"mod_settings_{module_id}"
        stmt = select(StoreSetting).where(StoreSetting.key == key)
        result = await db.execute(stmt)
        row = result.scalar_one_or_none()

        saved_values: dict[str, Any] = {}
        if row and row.value:
            try:
                saved_values = json.loads(row.value)
            except Exception:
                saved_values = {}

        # Merge defaults with saved values
        merged_values = {**defaults, **saved_values}

        return {
            "module_id": module_id,
            "module_name": manifest.name,
            "schema": [asdict(f) for f in manifest.settings_schema],
            "values": merged_values,
        }

    async def save_settings(
        self, db: AsyncSession, module_id: str, new_values: dict[str, Any]
    ) -> dict[str, Any]:
        """Validate and persist updated settings for a module."""
        manifest = self.get_manifest(module_id)
        if not manifest:
            raise KeyError(f"Module '{module_id}' not found")

        # Filter and validate against schema keys
        valid_keys = {f.key for f in manifest.settings_schema}
        clean_values = {k: v for k, v in new_values.items() if k in valid_keys}

        key = f"mod_settings_{module_id}"
        stmt = select(StoreSetting).where(StoreSetting.key == key)
        result = await db.execute(stmt)
        row = result.scalar_one_or_none()

        if row:
            row.value = json.dumps(clean_values, ensure_ascii=False)
        else:
            db.add(StoreSetting(key=key, value=json.dumps(clean_values, ensure_ascii=False)))

        await db.commit()
        return await self.get_settings(db, module_id)


# Global registry singleton
registry = ModuleRegistry()
