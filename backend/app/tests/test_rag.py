from unittest.mock import patch

from app.models import Document, Chunk
from app.services.ingestion import _embedding_model
from app.services.rag import retrieve_relevant_chunks, deduplicate_sources, ask_question


def _add_document_with_chunk(db_session, filename: str, page: int, content: str):
    """Helper: crea un documento con un chunk e il suo embedding, salvati nel DB di test."""
    document = Document(filename=filename, num_pages=page)
    db_session.add(document)
    db_session.flush()

    embedding = _embedding_model.encode(content).tolist()
    chunk = Chunk(
        document_id=document.id,
        page_number=page,
        content=content,
        embedding=embedding,
    )
    db_session.add(chunk)
    db_session.commit()
    return document, chunk


def test_retrieve_relevant_chunks_finds_similar_content(db_session):
    _add_document_with_chunk(
        db_session, "animali.pdf", 1, "Il gatto e' un animale domestico molto diffuso."
    )
    _add_document_with_chunk(
        db_session, "cucina.pdf", 1, "La ricetta della carbonara richiede uova e guanciale."
    )

    results = retrieve_relevant_chunks("Parlami dei gatti", db_session, top_k=1)

    assert len(results) == 1
    assert results[0].filename == "animali.pdf"


def test_retrieve_relevant_chunks_empty_db_returns_nothing(db_session):
    results = retrieve_relevant_chunks("Qualsiasi domanda", db_session, top_k=5)
    assert results == []


def test_deduplicate_sources_removes_duplicates():
    class FakeChunk:
        def __init__(self, filename, page_number):
            self.filename = filename
            self.page_number = page_number

    chunks = [
        FakeChunk("doc.pdf", 1),
        FakeChunk("doc.pdf", 1),
        FakeChunk("doc.pdf", 2),
    ]

    sources = deduplicate_sources(chunks)

    assert len(sources) == 2
    assert sources[0] == {"filename": "doc.pdf", "page": 1}
    assert sources[1] == {"filename": "doc.pdf", "page": 2}


def test_ask_question_with_no_documents_returns_fallback_message(db_session):
    result = ask_question("Domanda a caso", db_session)

    assert result["sources"] == []
    assert "non ho trovato" in result["answer"].lower()


@patch("app.services.rag.ollama.chat")
def test_ask_question_calls_llm_and_returns_sources(mock_ollama_chat, db_session):
    _add_document_with_chunk(
        db_session, "scienza.pdf", 3, "La fotosintesi avviene nei cloroplasti delle piante."
    )

    mock_ollama_chat.return_value = {
        "message": {"content": "La fotosintesi e' un processo biologico."}
    }

    result = ask_question("Cos'e' la fotosintesi?", db_session)

    assert result["answer"] == "La fotosintesi e' un processo biologico."
    assert result["sources"] == [{"filename": "scienza.pdf", "page": 3}]
    mock_ollama_chat.assert_called_once()