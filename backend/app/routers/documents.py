import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Document
from app.services.ingestion import ingest_pdf

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.get("")
def list_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).order_by(Document.id).all()
    return [
        {"id": d.id, "filename": d.filename, "num_pages": d.num_pages}
        for d in documents
    ]


@router.post("/upload")
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    document = ingest_pdf(str(file_path), file.filename, db)

    return {
        "id": document.id,
        "filename": document.filename,
        "num_pages": document.num_pages,
    }