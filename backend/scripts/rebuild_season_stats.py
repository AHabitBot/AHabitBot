import asyncio

from backend.database.database import (
    close_db,
    connect_db,
)
from backend.repositories.leaderboard.season_stats_repository import (
    rebuild_user_season_stats,
)


async def main() -> None:
    await connect_db()

    try:
        rebuilt_rows = (
            await rebuild_user_season_stats()
        )

        print(
            "Сезонная статистика пересобрана"
        )

        print(
            f"Создано строк: {rebuilt_rows}"
        )

    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(
        main()
    )