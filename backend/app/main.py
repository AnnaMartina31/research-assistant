from fastapi import FastAPI

app = FastAPI(title="Research Assistant API")

@app.get("/health")
def health_check():
    return {"status": "ok"}