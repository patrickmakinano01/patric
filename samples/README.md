# Test files

Files for trying Patch with every supported format. Drop one on the page, or click *browse*.
All counts below were checked by reading each file's text back out and running it through the automaton.

## Supported formats

| File | Expected result |
|---|---|
| `txt/biased.txt` | 12 occurrences, 11 distinct terms |
| `txt/neutral.txt` | 0 occurrences, message "No predefined gender-specific terms were detected." |
| `txt/speech.txt` | 12 occurrences, 12 distinct terms (includes `ladies and gentlemen`, `boys and girls`, `his or her`, `man-made`) |
| `txt/edge-cases.txt` | 8 occurrences, 7 distinct terms. See *Edge cases* below |
| `docx/biased.docx` | same as `txt/biased.txt`: 12 occurrences, 11 distinct |
| `docx/neutral.docx` | 0 occurrences, neutral message |
| `docx/edge-cases.docx` | same as `txt/edge-cases.txt`: 8 occurrences, 7 distinct |
| `pdf/biased.pdf` | same as `txt/biased.txt`: 12 occurrences, 11 distinct |
| `pdf/neutral.pdf` | 0 occurrences, neutral message |
| `pdf/multipage-biased.pdf` | two pages, 23 occurrences, 21 distinct terms (tests reading across pages) |

`.docx` and `.pdf` need an internet connection, because their readers load from a CDN.

## Files that should be rejected

| File | Expected message |
|---|---|
| `unsupported/legacy-format.doc` | "Legacy .doc isn't supported. Save it as .docx in Word and try again." |
| `unsupported/notes.md` | "Unsupported file type ".md". Use .txt, .docx or .pdf." |
| `unsupported/data.csv` | "Unsupported file type ".csv". Use .txt, .docx or .pdf." |
| `unsupported/empty.txt` | "The file is empty. It contains no text to check." |

The file dialog hides other file types, so drop these onto the page (or switch the dialog to "All files").
`legacy-format.doc` is plain text with a `.doc` name. It only tests the message, because the app decides by
the file extension.

## Edge cases (`txt/edge-cases.txt`)
- **Must not be flagged:** `other`, `there`, `the`, `theme`, `chairmanship`, `shelter`, `history`,
  `whisper`, `mother`, `together`. A term is only matched as a whole word.
- **Must be flagged:** `(He)`, `"she"`, `him`, `HIS OR HER`, `STEWARDESS`, `Chairman`. Case and punctuation do not matter,
  and the original casing is kept on replace.
- **Variants:** `his     or` + line break + `her` counts as one `his or her`, and `man‑made` with a
  non-breaking hyphen counts as `man-made`.

## Quick things to try
1. Open `txt/biased.txt`, replace each highlighted term (Highlighted view, click a term) and the banner should turn green.
2. Open the same text as `.docx` and `.pdf` and confirm the counts match.
3. Open `pdf/multipage-biased.pdf` and confirm occurrences from page two are found (`headmaster`, `waitress`, `congresswoman`...).
4. On the **Report** tab, download the report and check that each line and column points at the right word.

| `txt/repeated-case.txt` | 4 occurrences of one term: `chairman` in four capitalizations (`chairman`, `Chairman`, `CHAIRMAN`, `chairman`) |
