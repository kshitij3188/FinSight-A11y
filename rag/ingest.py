"""
RUN THIS LOCALLY ONCE before starting the server.
Indexes all 697 bunq docs into ChromaDB.

Usage:
    cd bunq_files
    python rag/ingest.py

Takes ~3-5 minutes. Progress shown. Safe to re-run (clears and rebuilds).
"""

import sys
from pathlib import Path

try:
    import chromadb
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Missing deps. Run: pip install -r requirements.txt")
    sys.exit(1)

DOCS_ROOT = Path(__file__).parent.parent
CHROMA_PATH = DOCS_ROOT / "chroma_db"
CHUNK_SIZE = 400   # words per chunk
OVERLAP = 40       # word overlap between chunks


def chunk_text(text: str) -> list[str]:
    words = text.split()
    if not words:
        return []
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + CHUNK_SIZE])
        if chunk.strip():
            chunks.append(chunk)
        i += CHUNK_SIZE - OVERLAP
    return chunks


def ingest():
    print("Loading embedding model (first run downloads ~430MB)...")
    model = SentenceTransformer("BAAI/bge-base-en-v1.5")

    print(f"Connecting to ChromaDB at {CHROMA_PATH}...")
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))

    # Clear existing collection so re-runs are safe
    try:
        client.delete_collection("bunq_docs")
        print("Cleared existing collection.")
    except Exception:
        pass

    collection = client.get_or_create_collection(
        "bunq_docs",
        metadata={"hnsw:space": "cosine"},
    )

    md_files = list(DOCS_ROOT.rglob("*.md"))
    # Skip any files inside rag/ or handlers/
    md_files = [f for f in md_files if "chroma_db" not in str(f)]
    print(f"Found {len(md_files)} markdown files.")

    all_docs, all_ids, all_metas = [], [], []
    skipped = 0

    for idx, filepath in enumerate(md_files):
        try:
            text = filepath.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            skipped += 1
            continue

        # Strip frontmatter / source lines to reduce noise
        lines = [l for l in text.splitlines() if not l.startswith("Source:")]
        clean_text = "\n".join(lines).strip()
        if not clean_text:
            skipped += 1
            continue

        # Relative path for metadata
        rel = filepath.relative_to(DOCS_ROOT)
        category = rel.parts[0] if len(rel.parts) > 1 else "root"

        chunks = chunk_text(clean_text)
        safe_rel = str(rel).replace("/", "__").replace("\\", "__").replace(" ", "_")
        for c_idx, chunk in enumerate(chunks):
            doc_id = f"{safe_rel}__{c_idx}"
            all_docs.append(chunk)
            all_ids.append(doc_id)
            all_metas.append({"source": str(rel), "category": category})

        if (idx + 1) % 50 == 0:
            print(f"  Processed {idx + 1}/{len(md_files)} files ({len(all_docs)} chunks so far)...")

    print(f"\nEmbedding {len(all_docs)} chunks (this takes the longest)...")

    BATCH = 256
    for i in range(0, len(all_docs), BATCH):
        batch_docs = all_docs[i : i + BATCH]
        batch_ids = all_ids[i : i + BATCH]
        batch_metas = all_metas[i : i + BATCH]

        embeddings = model.encode(batch_docs, show_progress_bar=False).tolist()
        collection.add(documents=batch_docs, ids=batch_ids, metadatas=batch_metas, embeddings=embeddings)

        pct = min(100, int((i + BATCH) / len(all_docs) * 100))
        print(f"  Embedded {min(i + BATCH, len(all_docs))}/{len(all_docs)} chunks ({pct}%)...")

    print(f"\nDone! {collection.count()} chunks stored in ChromaDB.")
    print(f"Skipped {skipped} files.")
    print("\nNow run: uvicorn app:app --reload")


if __name__ == "__main__":
    ingest()
