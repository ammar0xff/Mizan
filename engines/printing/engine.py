"""Vendora Print Management Engine implementation.

Handles template loading, variable interpolation, paper formatting,
and thermal/document print job generation.
"""
from __future__ import annotations

import html
import json
from datetime import datetime
from pathlib import Path
from typing import Any

ENGINE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = ENGINE_DIR / "templates"
CONFIG_FILE = ENGINE_DIR / "config.json"


class PrintEngine:
    """Core Print Management Engine."""

    def __init__(self, templates_dir: Path = TEMPLATES_DIR, config_file: Path = CONFIG_FILE) -> None:
        self.templates_dir = templates_dir
        self.config_file = config_file
        self._config = self._load_config()

    def _load_config(self) -> dict[str, Any]:
        if self.config_file.exists():
            try:
                return json.loads(self.config_file.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {}

    @property
    def config(self) -> dict[str, Any]:
        return self._config

    @property
    def paper_profiles(self) -> dict[str, Any]:
        return self._config.get("paper_profiles", {})

    def get_template_path(self, category: str, name: str) -> Path:
        """category is 'documents' or 'tickets'."""
        filename = name if name.endswith(".html") else f"{name}.html"
        return self.templates_dir / category / filename

    def list_templates(self) -> dict[str, list[str]]:
        """List all available templates under documents and tickets."""
        result: dict[str, list[str]] = {"documents": [], "tickets": []}
        docs_dir = self.templates_dir / "documents"
        if docs_dir.exists():
            result["documents"] = [f.stem for f in docs_dir.glob("*.html")]

        tickets_dir = self.templates_dir / "tickets"
        if tickets_dir.exists():
            result["tickets"] = [f.stem for f in tickets_dir.glob("*.html")]

        return result

    @staticmethod
    def escape(val: Any) -> str:
        return html.escape(str(val)) if val is not None else ""

    @staticmethod
    def ar_num(val: Any, decimals: int = 2) -> str:
        try:
            v = float(val)
            formatted = f"{v:,.{decimals}f}"
            trans = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")
            return formatted.translate(trans)
        except Exception:
            return str(val) if val is not None else ""

    @staticmethod
    def ar_currency(val: Any, currency: str = "ج.م", decimals: int = 2) -> str:
        return f"{PrintEngine.ar_num(val, decimals)} {currency}"

    @staticmethod
    def fmt_date(val: Any) -> str:
        try:
            return datetime.fromisoformat(str(val)).strftime("%d / %m / %Y")
        except Exception:
            return str(val) if val else ""

    @staticmethod
    def fmt_datetime(val: Any) -> str:
        try:
            dt = datetime.fromisoformat(str(val))
            return dt.strftime("%d/%m/%Y  %I:%M %p").replace("AM", "ص").replace("PM", "م")
        except Exception:
            return str(val) if val else ""

    def render_template(self, category: str, name: str, context: dict[str, Any]) -> str:
        """Render an HTML template with context variables and engine helpers."""
        tpl_path = self.get_template_path(category, name)
        if not tpl_path.exists():
            raise FileNotFoundError(f"Template not found at {tpl_path}")

        raw = tpl_path.read_text(encoding="utf-8")

        # Context helpers
        ctx = {
            "currency": self._config.get("default_currency", "ج.م"),
            "now": datetime.now().strftime("%Y-%m-%d %H:%M"),
            **context,
        }

        # Simple string replacement for tags {{ key }}
        rendered = raw
        for key, val in ctx.items():
            if isinstance(val, (str, int, float, bool)):
                rendered = rendered.replace(f"{{{{ {key} }}}}", str(val))
                rendered = rendered.replace(f"{{{{{key}}}}}", str(val))

        return rendered


print_engine = PrintEngine()
