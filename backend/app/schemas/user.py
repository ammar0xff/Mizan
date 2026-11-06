import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

_VALID_ROLES = {"admin", "manager", "cashier", "storekeeper", "accountant", "doctor", "nurse", "receptionist", "lab_tech", "pharmacist"}


class UserCreate(BaseModel):
    username: str
    full_name: str
    role: str = "cashier"
    password: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in _VALID_ROLES:
            raise ValueError(f"role must be one of: {', '.join(sorted(_VALID_ROLES))}")
        return v


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=128)
    role: str | None = None
    is_manager: bool | None = None
    default_warehouse_id: str | None = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str | None) -> str | None:
        if v is not None and v not in _VALID_ROLES:
            raise ValueError(f"role must be one of: {', '.join(sorted(_VALID_ROLES))}")
        return v


class SetUserWarehouses(BaseModel):
    warehouse_ids: list[str] = []


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class PasswordReset(BaseModel):
    password: str = Field(..., min_length=8)


class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
