from litestar import get


@get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
