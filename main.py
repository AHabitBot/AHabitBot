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

from backend.services.leaderboard import (
    run_rank_snapshot_loop,
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
    rank_snapshot_task = None

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

        # =================================================
        # SNAPSHOT ПОЗИЦИЙ РЕЙТИНГА
        # =================================================

        rank_snapshot_task = (
            asyncio.create_task(
                run_rank_snapshot_loop()
            )
        )

        print(
            "✅ Сервис позиций рейтинга запущен"
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
        # ОСТАНОВКА SNAPSHOT РЕЙТИНГА
        # =================================================

        if rank_snapshot_task is not None:
            rank_snapshot_task.cancel()

            try:
                await rank_snapshot_task

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