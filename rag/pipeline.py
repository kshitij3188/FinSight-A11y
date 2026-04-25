from pathlib import Path
from functools import lru_cache

from langsmith import traceable

CHROMA_PATH = Path(__file__).parent.parent / "chroma_db"
BGE_MODEL = "BAAI/bge-base-en-v1.5"
BGE_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "


@lru_cache(maxsize=1)
def _load():
    try:
        import chromadb
        from sentence_transformers import SentenceTransformer
    except ImportError as e:
        raise RuntimeError("Run: pip install -r requirements.txt") from e

    if not CHROMA_PATH.exists():
        raise RuntimeError("ChromaDB not found. Run: python rag/ingest.py first.")

    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    collection = client.get_collection("bunq_docs")
    model = SentenceTransformer(BGE_MODEL)
    return collection, model


@traceable(
    run_type="retriever",
    name="rag_retrieve",
    metadata={"model": "BAAI/bge-base-en-v1.5", "store": "chromadb", "component": "rag"},
)
def retrieve(query: str, k: int = 5, category_filter: str | None = None) -> list[str]:
    collection, model = _load()
    embedding = model.encode(BGE_QUERY_PREFIX + query).tolist()

    where = {"category": category_filter} if category_filter else None
    results = collection.query(
        query_embeddings=[embedding],
        n_results=k,
        where=where,
        include=["documents", "metadatas"],
    )
    return results["documents"][0]
