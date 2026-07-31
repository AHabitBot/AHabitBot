import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

from fastapi import HTTPException, status

from config import BOT_TOKEN


INIT_DATA_MAX_AGE_SECONDS = 86400


def validate_telegram_init_data(
    init_data: str,
) -> dict:
    if not BOT_TOKEN:
        raise RuntimeError(
            "BOT_TOKEN отсутствует в .env"
        )

    if not init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Отсутствуют данные авторизации Telegram",
        )

    parsed_data = dict(
        parse_qsl(
            init_data,
            keep_blank_values=True,
        )
    )

    received_hash = parsed_data.pop(
        "hash",
        None,
    )

    if not received_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="В Telegram initData отсутствует hash",
        )

    data_check_string = "\n".join(
        f"{key}={value}"
        for key, value in sorted(
            parsed_data.items()
        )
    )

    secret_key = hmac.new(
        key=b"WebAppData",
        msg=BOT_TOKEN.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()

    calculated_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        calculated_hash,
        received_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительная подпись Telegram",
        )

    auth_date_raw = parsed_data.get(
        "auth_date"
    )

    try:
        auth_date = int(auth_date_raw)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Некорректная дата авторизации Telegram",
        )

    current_time = int(time.time())

    if (
        current_time - auth_date
        > INIT_DATA_MAX_AGE_SECONDS
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Данные авторизации Telegram устарели",
        )

    user_raw = parsed_data.get("user")

    if not user_raw:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telegram не передал данные пользователя",
        )

    try:
        telegram_user = json.loads(
            user_raw
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Некорректные данные пользователя Telegram",
        )

    if not telegram_user.get("id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telegram ID пользователя отсутствует",
        )

    return telegram_user