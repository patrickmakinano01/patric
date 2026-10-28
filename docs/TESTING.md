# Testing

Run: `node tests/fsa.test.js` (no dependencies; 10 tests, all passing).

## Automated tests (`tests/fsa.test.js`)
| Test | Verifies |
|---|---|
| basic terms | "The chairman said he would go." gives `chairman`, `he` |
| word boundaries | no hits in "other", "there", "chairmanship"; `she` found in "She left." |
| case-insensitive, original text kept | "STEWARDESS" matched, original casing kept |
| longest phrase wins | `his or her`, `ladies and gentlemen` win over their parts |
| whitespace and hyphen variants | multiple spaces/newline inside a phrase; non-breaking hyphen in `man-made` |
| punctuation adjacent | `(he), "she"; him.` all recognized |
| positions | match offsets index the correct text |
| neutral text | no matches in neutral text |
| requirement examples | every lexicon term has at least one alternative |
| trace | the inspector's trace accepts a lexicon term |

## Manual checks (see `samples/README.md` for expected counts)
- Open each file in `samples/` through the browser: `.txt`, `.docx`, `.pdf` give the same counts;
  unsupported files show the right message.
- Highlight view, replacement popover (keeps capitalization and rescans), FSA inspector,
  report download/copy, dark/light themes.

## Requirement traceability
| Requirement | Evidence |
|---|---|
| 1. Upload .txt/.docx/.pdf | `readFile()` in `app.js`; `samples/` files |
| 2. FSA scanning | `fsa.js`; automated tests |
| 3. Predefined term list + alternatives | `lexicon.js` |
| 4. Report with occurrences and replacements | Report tab (`buildReport()`) |
| 5. Neutral message | green banner, report |