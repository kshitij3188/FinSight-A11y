import edge_tts
from langsmith import traceable

VOICE = "en-GB-SoniaNeural"


@traceable(
    run_type="tool",
    name="tts_synthesize",
    metadata={"voice": "en-GB-SoniaNeural", "provider": "edge-tts-microsoft", "cost": "free", "component": "tts"},
)
async def synthesize(text: str) -> bytes:
    communicate = edge_tts.Communicate(text, voice=VOICE)
    chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    return b"".join(chunks)
