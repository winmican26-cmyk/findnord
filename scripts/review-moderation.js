// NM-A17: a deliberately simple, hand-rolled abuse filter for review text --
// no new npm dependency, no third-party moderation service. This is a
// starting point suitable for a prototype, not a production-grade solution
// (see EVIDENCE.md's residual risks: no obfuscation/leet-speak handling, no
// non-English coverage, a small fixed word list). Word-boundary matching so
// a blocked word only matches whole words (e.g. "assassin" is not flagged
// just because it contains "ass").
const BLOCKED_WORDS = ["fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "piss"];

// Every match is replaced with asterisks of the same length (never simply
// deleted -- that would shift surrounding punctuation/spacing in confusing
// ways) -- this is what "abusive words must be deleted by default" means in
// practice: the abusive word itself never survives into stored/displayed text.
// Matches the word STEM plus any trailing word characters (`\w*`), not just
// the exact bare word, so common inflections ("fucking", "asses", "bitches")
// are caught too -- a bare `\bword\b` match would miss all of those.
function cleanReviewText(text) {
  let cleaned = text;
  let matched = false;
  BLOCKED_WORDS.forEach((word) => {
    const pattern = new RegExp(`\\b${word}\\w*`, "gi");
    if (pattern.test(cleaned)) matched = true;
    cleaned = cleaned.replace(pattern, (match) => "*".repeat(match.length));
  });
  return { cleaned, matched };
}

module.exports = { cleanReviewText, BLOCKED_WORDS };
