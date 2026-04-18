"""
URL-safe slug: Latin [a-z0-9-] only. Cyrillic → Latin; Latin accents stripped.
Optional trailing -YYYY-MM-DD is preserved; if missing, today's date (UTC) is appended.
"""
import re
import unicodedata
from datetime import datetime, timezone

_LATIN1 = {
    "ß": "ss",
    "æ": "ae",
    "œ": "oe",
    "ø": "o",
    "ð": "d",
    "þ": "th",
}

_CYR = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "ts",
    "ч": "ch",
    "ш": "sh",
    "щ": "sch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
    "і": "i",
    "ї": "yi",
    "є": "ye",
    "ґ": "g",
    "ў": "u",
}

_TAIL_DATE = re.compile(r"^(.+)-(\d{4}-\d{2}-\d{2})$")


def _transliterate_to_latin_chunk(text: str) -> str:
    raw = unicodedata.normalize("NFKD", text.strip())
    raw = "".join(c for c in raw if unicodedata.category(c) != "Mn")
    parts_out: list[str] = []
    for ch in raw:
        lo = ch.lower()
        if lo in _CYR:
            parts_out.append(_CYR[lo])
        elif lo in _LATIN1:
            parts_out.append(_LATIN1[lo])
        elif ch.isascii() and ch.isalnum():
            parts_out.append(lo)
        elif ch in " \t\n\r-_":
            parts_out.append(" ")
        else:
            parts_out.append(" ")
    s = "".join(parts_out)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def normalize_blog_slug(slug_or_title: str, max_words: int = 8) -> str:
    """Public slug for blog posts: latin slug + optional -YYYY-MM-DD suffix."""
    text = (slug_or_title or "").strip()
    if not text:
        return ""

    m = _TAIL_DATE.match(text)
    if m:
        core_raw, date_suf = m.group(1), m.group(2)
    else:
        core_raw, date_suf = text, None

    core = _transliterate_to_latin_chunk(core_raw)
    words = [w for w in core.split("-") if w][:max_words]
    core_slug = "-".join(words)

    if date_suf:
        return f"{core_slug}-{date_suf}" if core_slug else date_suf

    d = datetime.now(timezone.utc)
    ds = f"{d.year}-{d.month:02d}-{d.day:02d}"
    if core_slug:
        return f"{core_slug}-{ds}"
    return ds
