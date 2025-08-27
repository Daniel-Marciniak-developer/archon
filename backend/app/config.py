from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    app_env: str = Field(default="development", env="APP_ENV")
    debug: bool = Field(default=True, env="DEBUG")
    database_url: str = Field(default="postgresql://archon_user:archon_password@postgres:5432/archon_dev", env="DATABASE_URL_DEV")

    jwt_secret_key: str = Field(default="dev-secret-key", env="JWT_SECRET_KEY")
    github_client_id: Optional[str] = Field(default=None, env="GITHUB_CLIENT_ID")
    github_client_secret: Optional[str] = Field(default=None, env="GITHUB_CLIENT_SECRET")
    github_redirect_uri: Optional[str] = Field(default=None, env="GITHUB_REDIRECT_URI")
    production_domain: Optional[str] = Field(default=None, env="PRODUCTION_DOMAIN")
    stack_auth_project_id: Optional[str] = Field(default=None, env="STACK_AUTH_PROJECT_ID")
    stack_auth_publishable_key: Optional[str] = Field(default=None, env="STACK_AUTH_PUBLISHABLE_CLIENT_KEY")
    stack_auth_secret_key: Optional[str] = Field(default=None, env="STACK_AUTH_SECRET_SERVER_KEY")
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"
    @property
    def is_development(self) -> bool:
        return self.app_env == "development"
    @property
    def github_oauth_configured(self) -> bool:
        return bool(
            self.github_client_id and 
            self.github_client_secret and 
            self.github_redirect_uri
        )
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"
settings = Settings()
