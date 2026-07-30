import asyncio

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import Message

from config import BOT_TOKEN


bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: Message):
    await message.answer("AI Habit Bot запущен 🚀")


async def main():
    print("✅ AI Habit Bot запущен")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())