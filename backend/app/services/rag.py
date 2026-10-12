import re
import os
import ollama
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.ingestion import _embedding_model

OLLAMA_MODEL = "phi3"
TOP_K = 5

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
_ollama_client = ollama.Client(host=OLLAMA_HOST)


def retrieve_relevant_chunks(question: str, db: Session, top_k: int = TOP_K):
    """Trova i chunk più simili semanticamente alla domanda."""
    query_embedding = _embedding_model.encode(question).tolist()

    query = text("""
        SELECT chunks.id, chunks.content, chunks.page_number,
               documents.filename,
               chunks.embedding <=> CAST(:query_embedding AS vector) AS distance
        FROM chunks
        JOIN documents ON documents.id = chunks.document_id
        ORDER BY distance
        LIMIT :top_k
    """)

    result = db.execute(query, {"query_embedding": query_embedding, "top_k": top_k})
    return result.fetchall()


def retrieve_hybrid(question: str, db: Session, top_k: int = TOP_K, pool: int = 30, rrf_k: int = 60):
    """Fonde ricerca vettoriale e full-text (OR) con Reciprocal Rank Fusion."""
    query_embedding = _embedding_model.encode(question).tolist()

    words = re.sub(r"[^A-Za-z0-9 ]", " ", question).split()
    or_query = " | ".join(w for w in words if len(w) > 2)

    vector_rows = db.execute(text("""
        SELECT chunks.id FROM chunks
        ORDER BY chunks.embedding <=> CAST(:q AS vector)
        LIMIT :pool
    """), {"q": query_embedding, "pool": pool}).fetchall()

    fts_rows = []
    if or_query:
        fts_rows = db.execute(text("""
            SELECT chunks.id FROM chunks
            WHERE to_tsvector('english', chunks.content) @@ to_tsquery('english', :tsq)
            ORDER BY ts_rank(to_tsvector('english', chunks.content), to_tsquery('english', :tsq)) DESC
            LIMIT :pool
        """), {"tsq": or_query, "pool": pool}).fetchall()

    scores = {}
    for rank, row in enumerate(vector_rows, start=1):
        scores[row.id] = scores.get(row.id, 0) + 1 / (rrf_k + rank)
    for rank, row in enumerate(fts_rows, start=1):
        scores[row.id] = scores.get(row.id, 0) + 1 / (rrf_k + rank)

    best_ids = sorted(scores, key=scores.get, reverse=True)[:top_k]
    if not best_ids:
        return []

    rows = db.execute(text("""
        SELECT chunks.id, chunks.content, chunks.page_number, documents.filename
        FROM chunks JOIN documents ON documents.id = chunks.document_id
        WHERE chunks.id = ANY(:ids)
    """), {"ids": best_ids}).fetchall()
    by_id = {r.id: r for r in rows}
    return [by_id[i] for i in best_ids]


def build_prompt(question: str, chunks) -> str:
    """Costruisce il prompt con il contesto recuperato."""
    context_blocks = []
    for chunk in chunks:
        context_blocks.append(
            f"[Fonte: {chunk.filename}, pagina {chunk.page_number}]\n{chunk.content}"
        )
    context = "\n\n".join(context_blocks)

    return f"""Rispondi alla domanda usando SOLO le informazioni nel contesto seguente.
Se il contesto non contiene informazioni sufficienti, dillo chiaramente invece di inventare.

IMPORTANTE: Non includere riferimenti a fonti, nomi di file o numeri di pagina nel testo della tua risposta. Scrivi solo la risposta in linguaggio naturale, le fonti verranno mostrate separatamente dall'applicazione.

Contesto:
{context}

Domanda: {question}

Risposta (senza citazioni di fonti nel testo):"""


def deduplicate_sources(chunks) -> list[dict]:
    """Rimuove duplicati fonte+pagina, mantenendo l'ordine di rilevanza."""
    seen = set()
    sources = []
    for chunk in chunks:
        key = (chunk.filename, chunk.page_number)
        if key not in seen:
            seen.add(key)
            sources.append({"filename": chunk.filename, "page": chunk.page_number})
    return sources


def ask_question(question: str, db: Session) -> dict:
    """Pipeline completa: retrieval ibrido + generazione risposta."""
    chunks = retrieve_hybrid(question, db)

    if not chunks:
        return {
            "answer": "Non ho trovato documenti indicizzati per rispondere a questa domanda.",
            "sources": [],
        }

    prompt = build_prompt(question, chunks)

    response = _ollama_client.chat(
        model=OLLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )

    answer = response["message"]["content"].strip()
    sources = deduplicate_sources(chunks)

    return {"answer": answer, "sources": sources}