# Design Document

## 1. Objective
Recognize and validate gender-specific language in documents using finite state automata, and
propose gender-neutral alternatives.

## 2. Architecture
```
 file (.txt/.docx/.pdf) --> Reader --> plain text --> FSA scanner --> matches
                                                                         |
                                  lexicon (term -> alternatives) --------+--> Report / UI
```
| Component | File |
|---|---|
| Document readers | `readFile()` in `app.js` |
| Lexicon | `lexicon.js` |
| Automaton | `fsa.js` |
| Analysis and report | `app.js` |
| UI | `index.html`, `style.css` |

Readers: `.txt` is read as text; `.docx` through *mammoth*; `.pdf` through *pdf.js* (both loaded from a
CDN). Legacy `.doc` is rejected with a message to save as `.docx`.
## 3. The finite state automaton

### 3.1 Formal definition
The recognizer is a deterministic finite automaton **M = (Q, Σ, δ, q0, F)**:

- **Σ** – the input alphabet: characters of the (normalized) text.
- **Q** – states of a trie built from the lexicon. Each state represents a prefix of one or more
  terms. `q0` (the root) is the empty prefix.
- **δ : Q × Σ → Q** – the transition function. Trie edges give the forward moves; for any
  character with no edge, δ follows *failure links* to the longest proper suffix that is also a
  prefix of some term (Aho-Corasick construction). This makes δ total, so the machine never needs
  to back up in the input.
- **q0** – the start state.
- **F** – accepting states: states where a lexicon term ends, plus states whose failure chain
  reaches such a state (a term is a suffix of what was just read).

Example fragment for the terms `he`, `she`, `his`:
```
q0 --h--> q1 --e--> q2 (accept: "he")
q0 --s--> q3 --h--> q4 --e--> q5 (accept: "she", and "he" via failure link to q2)
q1 --i--> q6 --s--> q7 (accept: "his")
```
The prebuilt automaton has 373 states for the supplied lexicon.

### 3.2 Scanning algorithm
1. **Normalize**: lowercase; collapse any whitespace run (spaces, tabs, line breaks) to one space;
   unify Unicode dashes (e.g. non-breaking hyphen) to `-` and curly quotes to `'`. An index map
   keeps each normalized position linked to its original position so results point at the real text.
2. **Run**: start in `q0`; for each character apply δ once. Whenever the new state is accepting,
   record each term that ends here (candidate match).
3. **Word-boundary check**: reject candidates immediately preceded or followed by a letter, digit
   or apostrophe. This stops `he` matching inside `the`, `she`, `there`, and `chairman` inside
   `chairmanship`.
4. **Resolve overlaps**: sort candidates by start position, longest first, and keep
   non-overlapping ones. So `his or her` wins over `his` + `her`; `ladies and gentlemen` wins over
   `gentlemen`.

Complexity: O(n + z) for text length n and z candidate matches – independent of lexicon size once
built. Construction is O(total length of terms).

### 3.3 Why an FSA
A hand-written loop of `text.contains(term)` would work but rescans the text once per term. The
automaton reads each character exactly once and shows the automata-theory concept directly (the
"FSA inspector" tab displays the state path for any input).

## 4. Lexicon
About 60 entries across pronouns (`he`, `she`, `his or her`…), occupations (`chairman`,
`stewardess`, `policeman`…), and general terms (`mankind`, `man-made`, `manpower`…). Each term maps
to one or more neutral alternatives. To extend it, add entries to `lexicon.js`.

Deliberately excluded: titles such as *Mr/Mrs/Ms* and *sir/madam* – they cause frequent false
positives (e.g. "MS") and have no universally accepted replacement.

## 5. Report
- Summary table: term, count, suggested alternatives (sorted by frequency).
- Occurrence list: line, column, matched text, suggestion and surrounding context.
- If no matches: the message **"No predefined gender-specific terms were detected."**
- Extras: click a highlight to replace it (capitalization preserved), download/copy report.

## 6. Limitations
- Matching is lexical, not grammatical. `her` can be "them" or "their" depending on use, so both
  are suggested; `man` as a verb or in names is not handled (and `man` alone is not in the lexicon).
- Words in other languages, slang and context-dependent bias are out of scope.
- Scanned (image-only) PDFs contain no text and cannot be read without OCR.
- Legacy binary `.doc` files are not supported.
