import json
import os
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.services.rag import retrieve_relevant_chunks

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/research_assistant")
KS = (1, 3, 5)


def ranked_pages(chunks):
    """Elenco (filename, pagina) deduplicato, in ordine di rilevanza."""
    seen, out = set(), []
    for c in chunks:
        key = (c.filename, c.page_number)
        if key not in seen:
            seen.add(key)
            out.append(key)
    return out


def main(path):
    questions = json.loads(Path(path).read_text(encoding="utf-8"))
    session = sessionmaker(bind=create_engine(DB_URL))()

    hits = {k: 0 for k in KS}
    rr_sum = 0.0
    misses = []

    for q in questions:
        chunks = retrieve_relevant_chunks(q["question"], session, top_k=max(KS) * 3)
        ranking = ranked_pages(chunks)
        pages = q.get("pages") or [q["page"]]
        targets = {(q["filename"], p) for p in pages}
        ranks = [i + 1 for i, key in enumerate(ranking) if key in targets]
        rank = min(ranks) if ranks else None
        print(f"rank={rank}  {q['question'][:70]}")

        if rank:
            rr_sum += 1 / rank
            for k in KS:
                if rank <= k:
                    hits[k] += 1
        else:
            misses.append(q["question"])

    n = len(questions)
    print(f"\nDomande: {n}")
    for k in KS:
        print(f"Hit rate@{k}: {hits[k] / n:.2%}")
    print(f"MRR: {rr_sum / n:.3f}")
    if misses:
        print("\nNon trovate:")
        for m in misses:
            print(" -", m)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "eval/questions.json")