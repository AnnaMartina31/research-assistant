from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.rag import ask_question

router = APIRouter(prefix="/chat", tags=["chat"])


class AskRequest(BaseModel):
    question: str


@router.post("/ask")
def ask(request: AskRequest, db: Session = Depends(get_db)):
    return ask_question(request.question, db)