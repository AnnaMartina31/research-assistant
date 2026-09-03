from fastapi import FastAPI

from app.routers import documents, chat

app = FastAPI(title="Research Assistant API")

app.include_router(documents.router)
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
