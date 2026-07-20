import bleach


def sanitize_text(text: str) -> str:
    """
    Remove potentially dangerous HTML/JS.
    """
    return bleach.clean(
        text,
        tags=[],
        attributes={},
        strip=True,
    )