"""
Configuration file for Flask application
Contains database URI, secret keys, and other app settings
"""
import os
from dotenv import load_dotenv

load_dotenv()


def _build_sqlalchemy_database_uri() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        if database_url.startswith("postgres://"):
            return database_url.replace("postgres://", "postgresql://", 1)
        return database_url

    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")

    if db_name and db_user and db_password:
        return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    base_dir = os.path.abspath(os.path.dirname(__file__))
    return f"sqlite:///{os.path.join(base_dir, 'estate.db')}"

class Config:
    """Main configuration class"""
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = _build_sqlalchemy_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET = os.getenv("JWT_SECRET", "jwt-secret-key-change-in-production")
    JWT_EXPIRATION_HOURS = 24
