import edge_tts

VOICE = "en-GB-SoniaNeural"


async def synthesize(text: str) -> bytes:
    communicate = edge_tts.Communicate(text, voice=VOICE)
    chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    return b"".join(chunks)
