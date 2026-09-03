from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session

from app.models import Document, Chunk

# Il modello viene caricato una sola volta e riutilizzato (è lento da caricare)
_embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=100,
)


def extract_text_by_page(file_path: str) -> list[tuple[int, str]]:
    """Restituisce una lista di (numero_pagina, testo) per ogni pagina del PDF."""
    reader = PdfReader(file_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages.append((i + 1, text))  # pagine numerate da 1, non da 0
    return pages


def ingest_pdf(file_path: str, filename: str, db: Session) -> Document:
    """Elabora un PDF: estrae testo, crea chunk, genera embedding, salva tutto nel DB."""
    pages = extract_text_by_page(file_path)

    document = Document(filename=filename, num_pages=len(pages))
    db.add(document)
    db.flush()  # per ottenere document.id senza fare commit definitivo

    for page_number, page_text in pages:
        chunks_text = _splitter.split_text(page_text)
        if not chunks_text:
            continue

        embeddings = _embedding_model.encode(chunks_text)

        for chunk_text, embedding in zip(chunks_text, embeddings):
            chunk = Chunk(
                document_id=document.id,
                page_number=page_number,
                content=chunk_text,
                embedding=embedding.tolist(),
            )
            db.add(chunk)

    db.commit()
    db.refresh(document)
    return document