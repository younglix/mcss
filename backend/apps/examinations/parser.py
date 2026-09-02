"""Free-text question parser. Deterministic regex, not AI — the format is
rigid and cheap to validate exactly, and a teacher needs instant, reliable
per-block feedback on a typo, not a probabilistic read of their intent."""

import re

_QUESTION_RE = re.compile(r"Question:\s*(.+)")
_OPTION_RE = {L: re.compile(rf"^{L}\)\s*(.+)$", re.MULTILINE) for L in "ABCD"}
_ANSWER_RE = re.compile(r"Answer:\s*([ABCD])")


def parse_questions(raw: str):
    """Returns (parsed, errors). `parsed` is a list of
    {text, option_a..option_d, correct_option} dicts ready to save as
    Question rows. `errors` is a list of human-readable per-block messages —
    a malformed block is skipped, not guessed at."""
    blocks = [b for b in re.split(r"\n\s*\n", raw.strip()) if b.strip()]
    parsed, errors = [], []

    for i, block in enumerate(blocks, 1):
        q_match = _QUESTION_RE.search(block)
        if not q_match:
            errors.append(f"Question block {i} is missing a 'Question:' line.")
            continue

        options = {}
        missing = []
        for letter, pattern in _OPTION_RE.items():
            m = pattern.search(block)
            if m:
                options[letter] = m.group(1).strip()
            else:
                missing.append(letter)
        if missing:
            errors.append(f"Question block {i} is missing option(s) {', '.join(missing)} — need exactly 'A)'–'D)'.")
            continue

        ans_match = _ANSWER_RE.search(block)
        if not ans_match:
            errors.append(f"Question block {i} is missing an 'Answer: <A-D>' line.")
            continue

        parsed.append({
            "text": q_match.group(1).strip(),
            "option_a": options["A"], "option_b": options["B"],
            "option_c": options["C"], "option_d": options["D"],
            "correct_option": ans_match.group(1).strip(),
        })

    return parsed, errors
