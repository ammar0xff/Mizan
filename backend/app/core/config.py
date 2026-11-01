import warnings

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    APP_ENV: str = "development"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    UPLOAD_DIR: str = "./uploads"
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost",
        "https://eg-co.duckdns.org",
        "https://ammar0xff.github.io",
        "https://mizan-app-liart.vercel.app",
    ]
    IS_PRODUCTION: bool = False
    # ⚠️ CORS_ORIGINS must NOT contain wildcard ("*") when credentials are enabled

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    def model_post_init(self, __context):
        if self.SECRET_KEY in ("change-this-in-production-use-random-32-chars", "super-secret-inventory-erp-key-2026-change-in-production"):
            if self.is_production:
                raise RuntimeError("SECRET_KEY must be set to a random value in production! Run: openssl rand -hex 32")
            warnings.warn("SECRET_KEY is still a placeholder! Set a real key via SECRET_KEY env var for production.", stacklevel=2)

    class Config:
        env_file = ".env"


settings = Settings()
