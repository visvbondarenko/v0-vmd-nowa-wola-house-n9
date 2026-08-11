// Typographic look-alikes that arrive via copy-paste from Word / Google Docs /
// PDFs. Their autocorrect turns the hyphen in a postal code into U+2011
// NON-BREAKING HYPHEN precisely so "05-500" can't wrap across a line — visually
// identical in an admin input, but a different character to every consumer
// downstream (dane.gov.pl, search, string comparison).
//
// Only characters that *mean* a hyphen or a space are folded. En and em dashes
// are deliberately left alone: they're legitimate punctuation in the prose
// fields (descriptions, about text) and folding them would corrupt real content.
const HYPHEN_LOOKALIKES = /[‐‑‒−]/g // ‐ ‑ ‒ −
const SPACE_LOOKALIKES = /[   ]/g // NBSP, narrow NBSP, figure space

// For structured, machine-read values only — postal codes, street names, house
// numbers, identifiers. Never apply to prose.
export function normalizeStructuredText(v: string): string {
  return v
    .replace(HYPHEN_LOOKALIKES, '-')
    .replace(SPACE_LOOKALIKES, ' ')
    .trim()
}
