import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

# interpolate=False — в bcrypt-хеше есть символы $, их не нужно считать подстановками
load_dotenv(Path(__file__).resolve().parent.parent / ".env", interpolate=False)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data.db")
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "")

# Админка: логин и пароль только из окружения / .env — не храните их в репозитории.
# Рекомендуется ADMIN_PASSWORD_HASH (bcrypt), см. scripts/hash_admin_password.py (pip install bcrypt)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "").strip()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")  # только для локальной разработки
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "").strip()
