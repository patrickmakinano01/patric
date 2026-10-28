# Patch

*Gender-neutral language recognizer, by Patrick.*

Patch is a web application that uses a **finite state automaton (FSA)** to recognize gender-specific
terms in text documents and suggest gender-neutral alternatives. Everything runs in the browser;
documents are never uploaded.

## Run it

Option 1: open `patch-standalone.html` (double-click). It is a single self-contained file.

Option 2: serve the folder: `python -m http.server 8000` then open <http://localhost:8000>.

Drop a `.txt`, `.docx` or `.pdf` file, or paste text. Click a highlighted term to replace it.
`.docx` and `.pdf` reading uses the *mammoth* and *pdf.js* libraries from a CDN, so those two
formats need an internet connection.

## Files

```
index.html               page structure
style.css                visual design
app.js                   UI logic: analysis, highlighting, replace, report, file reading, FSA inspector
fsa.js                   the finite state automaton (Aho-Corasick DFA)
lexicon.js               gender-specific terms -> neutral alternatives
patch-standalone.html  index.html with CSS and JS inlined (one file)
tests/fsa.test.js        automated tests for the automaton (node tests/fsa.test.js)
samples/                 test files in every format, with expected results
docs/                    USER_GUIDE.md, DESIGN.md, TESTING.md
gender-neutral-recognizer.zip   archive of the earlier version (with the Python app)
```

If you edit `style.css`, `app.js` or the lexicon, `patch-standalone.html` must be regenerated.

## Requirements coverage
| # | Requirement | Where |
|---|---|---|
| 1 | Upload .txt, .docx, .pdf | `readFile()` in `app.js` |
| 2 | Scan using finite state automata | `fsa.js` |
| 3 | Predefined gender-specific terms with neutral alternatives | `lexicon.js` |
| 4 | Report of occurrences and suggested replacements | `buildReport()` in `app.js` |
| 5 | "No predefined gender-specific terms were detected." when nothing found | banner and report |

See [docs/DESIGN.md](docs/DESIGN.md) for how the automaton works.