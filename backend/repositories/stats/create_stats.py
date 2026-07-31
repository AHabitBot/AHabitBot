from backend.database.database import get_connection


async def create_stats(user_id: int) -> None:
    async with get_connection() as connection:
        await connection.execute(
            """
            INSERT INTO user_stats (
                user_id
            )
            VALUES ($1)
            """,
            user_id,
        )