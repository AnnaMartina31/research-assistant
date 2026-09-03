import ollama
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.ingestion import _embedding_model

OLLAMA_MODEL = "phi3"
TOP_K = 5  # quanti chunk recuperare per rispondere


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
Cita sempre la fonte (nome file, pagina) per ogni affermazione importante.

Contesto:
{context}

Domanda: {question}

Risposta:"""


def ask_question(question: str, db: Session) -> dict:
    """Pipeline completa: retrieval + generazione risposta."""
    chunks = retrieve_relevant_chunks(question, db)

    if not chunks:
        return {
            "answer": "Non ho trovato documenti indicizzati per rispondere a questa domanda.",
            "sources": [],
        }

    prompt = build_prompt(question, chunks)

    response = ollama.chat(
        model=OLLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )

    answer = response["message"]["content"]

    sources = [
        {"filename": chunk.filename, "page": chunk.page_number}
        for chunk in chunks
    ]

    return {"answer": answer, "sources": sources}