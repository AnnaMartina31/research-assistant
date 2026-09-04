import io
from pathlib import Path

from reportlab.pdfgen import canvas


def make_test_pdf(path: Path, text: str = "Questo e' un documento di test."):
    """Crea un PDF minimale valido per i test, senza dipendere da file esterni."""
    c = canvas.Canvas(str(path))
    c.drawString(100, 750, text)
    c.save()


def test_upload_valid_pdf(client, tmp_path):
    pdf_path = tmp_path / "test.pdf"
    make_test_pdf(pdf_path)

    with open(pdf_path, "rb") as f:
        response = client.post(
            "/documents/upload",
            files={"file": ("test.pdf", f, "application/pdf")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.pdf"
    assert data["num_pages"] == 1
    assert "id" in data


def test_upload_creates_chunks_in_db(client, tmp_path, db_session):
    from app.models import Chunk

    pdf_path = tmp_path / "test.pdf"
    make_test_pdf(pdf_path, text="Il gatto nero dorme sul divano rosso.")

    with open(pdf_path, "rb") as f:
        response = client.post(
            "/documents/upload",
            files={"file": ("test.pdf", f, "application/pdf")},
        )

    document_id = response.json()["id"]
    chunks = db_session.query(Chunk).filter(Chunk.document_id == document_id).all()

    assert len(chunks) > 0
    assert "gatto" in chunks[0].content.lower()
    