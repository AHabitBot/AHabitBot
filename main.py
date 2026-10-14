import asyncio

from aiogram import (
    Bot,
    Dispatcher,
)

from config import BOT_TOKEN

from backend.database.database import (
    connect_db,
    close_db,
)

from backend.handlers.start import (
    router as start_router,
)

from backend.services.settings import (
    run_reminder_loop,
)

from backend.services.habits.habit_reminder_service import (
    run_habit_reminder_loop,
)


async def main() -> None:
    bot = Bot(
        token=BOT_TOKEN
    )

    dp = Dispatcher()

    dp.include_router(
        start_router
    )

    reminder_task = None
    habit_reminder_task = None

    try:
        await connect_db()

        print(
            "✅ База данных подключена"
        )


        # =================================================
        # ЗАПУСК НАПОМИНАНИЙ
        # =================================================

        reminder_task = (
            asyncio.create_task(
                run_reminder_loop(
                    bot
                )
            )
        )

        print(
            "✅ Сервис напоминаний запущен"
        )

        # Напоминания по конкретным привычкам работают
        # независимо от напоминаний в настройках.
        habit_reminder_task = asyncio.create_task(
            run_habit_reminder_loop(bot)
        )

        print(
            "✅ Сервис напоминаний привычек запущен"
        )

        print(
            "✅ AI Habit Bot запущен"
        )


        # =================================================
        # TELEGRAM POLLING
        # =================================================

        await dp.start_polling(
            bot
        )


    finally:

        # =================================================
        # ОСТАНОВКА НАПОМИНАНИЙ
        # =================================================

        if reminder_task is not None:
            reminder_task.cancel()

            try:
                await reminder_task

            except asyncio.CancelledError:
                pass


        # =================================================
        # ОСТАНОВКА НАПОМИНАНИЙ ПРИВЫЧЕК
        # =================================================

        if habit_reminder_task is not None:
            habit_reminder_task.cancel()

            try:
                await habit_reminder_task

            except asyncio.CancelledError:
                pass


        # =================================================
        # ЗАКРЫТИЕ БД И TELEGRAM SESSION
        # =================================================

        await close_db()

        await bot.session.close()


        print(
            "⛔ AI Habit Bot остановлен"
        )


if __name__ == "__main__":
    asyncio.run(
        main()
    )