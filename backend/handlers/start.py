from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

from backend.services.users import register_user

router = Router()


@router.message(CommandStart())
async def start_handler(message: Message):
    await register_user(message.from_user)

    await message.answer(
        "Добро пожаловать!"
    )