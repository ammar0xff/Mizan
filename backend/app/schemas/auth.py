from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str
    tenant_slug: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    full_name: str = ""
    role: str
