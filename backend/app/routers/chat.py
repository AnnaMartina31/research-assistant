from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.rag import ask_question, ask_question_stream

router = APIRouter(prefix="/chat", tags=["chat"])


class AskRequest(BaseModel):
    question: str


@router.post("/ask")
def ask(request: AskRequest, db: Session = Depends(get_db)):
    return ask_question(request.question, db)


@router.post("/ask-stream")
def ask_stream(request: AskRequest, db: Session = Depends(get_db)):
    return StreamingResponse(
        ask_question_stream(request.question, db),
        media_type="text/event-stream",
    )