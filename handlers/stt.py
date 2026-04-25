import os

from groq import Groq

_client = None


def _get_client() -> Groq:
    global _client
    if not _client:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client


def transcribe(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    client = _get_client()
    transcription = client.audio.transcriptions.create(
        file=(filename, audio_bytes, "audio/webm"),
        model="whisper-large-v3-turbo",
        response_format="text",
        language="en",
    )
    return transcription.strip()
