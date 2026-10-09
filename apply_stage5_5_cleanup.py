from pathlib import Path
ROOT = Path(__file__).resolve().parent
FILES = ['backend/services/stats/season_history_service.py', 'backend/services/leaderboard/season_results_service.py', 'backend/services/leaderboard/season_service.py', 'backend/repositories/leaderboard/season_results_repository.py']
for rel in FILES:
    p = ROOT / rel
    if p.is_file():
        p.unlink()
        print('Removed:', rel)
    else:
        print('Already absent:', rel)
