# User Guide

Open `patch-standalone.html` (double-click), or serve the folder and visit <http://localhost:8000>.
1. **Load text.** Drag a file onto the dashed box, click *browse*, or paste/type into the editor.
   Supported: `.txt`, `.docx`, `.pdf`.
2. **Check the banner.** Blue = waiting, amber = terms found (with count), green =
   "No predefined gender-specific terms were detected."
3. **Highlighted view.** After uploading, the document switches to *Highlighted*. Click any
   highlighted term to see alternatives, then click one to replace it. Use *Edit* to type freely;
   results refresh automatically.
4. **Summary tab.** Each found term with its count and suggestions. Click a term to jump to its
   occurrences (click again for the next one).
5. **Report tab.** Full text report. *Download report* saves a `.txt`; *Copy* copies it.
6. **FSA inspector tab.** Type any word or phrase to see the automaton's state path and whether it
   is accepted. Green states are accepting.
7. **Samples, Undo, Accept all.** *Samples* loads an example. Click a suggestion chip in the Summary tab to replace every occurrence of that term; *Accept all suggestions* uses the first suggestion for every term. *Undo* (or Ctrl+Z) reverts. Ctrl+O opens a file; you can drop a file anywhere on the Document card.
8. **Clear** resets everything (Undo brings it back).

Notes: runs entirely in the browser; nothing is uploaded. `.docx`/`.pdf` readers load from a CDN,
so internet is needed for those two formats. Dark mode follows your system setting.

## Troubleshooting
| Problem | Fix |
|---|---|
| PDF/Word upload fails in browser | Check internet, or serve the folder with `python -m http.server 8000` |
| "No text could be extracted" | The PDF is a scan (images); run OCR first |
| `.doc` rejected | Open in Word, Save As `.docx` |
| A term isn't flagged | Add it to the lexicon (see DESIGN.md §4) |
