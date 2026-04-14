#!/usr/bin/env python3
"""Печатает bcrypt-хеш для переменной ADMIN_PASSWORD_HASH в .env"""
import getpass
import sys

try:
    import bcrypt
except ImportError:
    print("Установите зависимости: pip install bcrypt", file=sys.stderr)
    sys.exit(1)

pw = getpass.getpass("Новый пароль админки: ")
pw2 = getpass.getpass("Повторите пароль: ")
if pw != pw2:
    print("Пароли не совпадают.", file=sys.stderr)
    sys.exit(1)
if not pw.strip():
    print("Пустой пароль не допускается.", file=sys.stderr)
    sys.exit(1)
raw = pw.encode("utf-8")
if len(raw) > 72:
    print("Пароль длиннее 72 байт в UTF-8 — bcrypt такое не принимает, сократите пароль.", file=sys.stderr)
    sys.exit(1)
hashed = bcrypt.hashpw(raw, bcrypt.gensalt()).decode("ascii")
print()
print("Добавьте в .env (одна строка, без кавычек):")
print(f"ADMIN_PASSWORD_HASH={hashed}")
