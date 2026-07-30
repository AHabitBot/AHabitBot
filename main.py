import asyncio

from aiogram import Bot, Dispatcher

from config import BOT_TOKEN
from database.database import connect_db, close_db
from handlers.start import router as start_router


async def main() -> None:
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()

    dp.include_router(start_router)

    try:
        await connect_db()

        print("✅ База данных подключена")
        print("✅ AI Habit Bot запущен")

        await dp.start_polling(bot)

    finally:
        await close_db()
        await bot.session.close()

        print("⛔ AI Habit Bot остановлен")


if __name__ == "__main__":
    asyncio.run(main())