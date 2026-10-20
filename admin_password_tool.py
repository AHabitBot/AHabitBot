"""Generate scrypt password hash without importing the application."""
import getpass
import hashlib
import secrets
password = getpass.getpass("New AHabit Admin password: ")
if len(password) < 12:
    raise SystemExit("Use at least 12 characters")
salt = secrets.token_bytes(16)
value = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
print("AHABIT_ADMIN_PASSWORD_HASH=scrypt$" + salt.hex() + "$" + value.hex())
