from fastapi import APIRouter
from pydantic import BaseModel
from backend.api.dependencies import CurrentUser
from backend.services.development import development_service as service

router=APIRouter(prefix='/api/development',tags=['development'])
class Start(BaseModel):
    direction:str
    key:str
    cycle:int
class Confirmation(BaseModel):
    is_confirmed:bool
@router.get('')
async def get_development(user:CurrentUser):
    return await service.state(user['id'])
@router.post('/start')
async def start_research(payload:Start,user:CurrentUser):
    return await service.start(user['id'],payload.direction,payload.key,payload.cycle)
@router.put('/{habit_id}/confirmation')
async def confirm_research(habit_id:int,payload:Confirmation,user:CurrentUser):
    return await service.confirm(user['id'],habit_id,payload.is_confirmed)
@router.post('/{habit_id}/improve')
async def improve_research(habit_id:int,user:CurrentUser):
    return await service.finish(user['id'],habit_id)

@router.post('/{habit_id}/cancel')
async def cancel_research(habit_id:int,user:CurrentUser):
    return await service.cancel(user['id'],habit_id)
