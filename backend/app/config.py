from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    ollama_model: str = "phi3"

    class Config:
        env_file = ".env"

settings = Settings()