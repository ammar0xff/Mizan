"""Point of Sale (POS) Module Models."""
from app.models.shift import Shift
from app.modules.pos_hardware.models import PosHardwareProfile

__all__ = [
    "Shift",
    "PosHardwareProfile",
]
