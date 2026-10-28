(function () {
  const NEUTRAL = "No predefined gender-specific terms were detected.";
  const $ = (id) => document.getElementById(id);
  const fsa = new TermAutomaton(Object.keys(LEXICON));

  const editor = $("editor"), viewer = $("viewer"), banner = $("banner"), pop = $("pop");
  let matches = [], source = "(pasted text)", cycle = {}, timer = null, history = [""];
  const SAMPLES = {
    biased: "The chairman told the stewardess that he would call his wife about the businessman's request.\n\nEvery policeman and fireman must report his hours. The manpower shortage affects mankind, and the salesman said the guys on the team are doing a great job.\n\nLadies and gentlemen, welcome.",
    neutral: "The chairperson told the flight attendant that they would call their partner about the businessperson's request.\n\nEvery police officer and firefighter must report their hours. The workforce shortage affects humankind, and the salesperson said everyone on the team is doing a great job.",
    speech: "Ladies and gentlemen, boys and girls, thank you for joining us. Our spokesman and the headmistress will explain how each freshman can contact his or her advisor.",
  };
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2200);
  }
  function pushHistory() {
    if (history[history.length - 1] !== editor.value) history.push(editor.value);
    if (history.length > 100) history.shift();
    $("undoBtn").disabled = history.length < 2;
  }
  function setText(v) { editor.value = v; pushHistory(); analyze(); }
  function undo() {
    if (history.length < 2) return;
    history.pop(); editor.value = history[history.length - 1];
    $("undoBtn").disabled = history.length < 2; analyze();
  }
  // apply replacements ({m, alt}); work from the end so offsets stay valid
  function applyReplacements(list) {
    let v = editor.value;
    [...list].sort((a, b) => b.m.start - a.m.start).forEach(({ m, alt }) => {
      v = v.slice(0, m.start) + matchCase(m.text, alt) + v.slice(m.end);
    });
    setText(v); return list.length;
  }

  $("statStates").textContent = fsa.numStates;

  // ---------- banner ----------
  function setBanner(kind, msg) { banner.className = "banner " + kind; banner.textContent = msg; }

  // ---------- analysis ----------
  function analyze() {
    const text = editor.value;
    matches = fsa.findAll(text);
    cycle = {};
    const summary = new Map();
    for (const m of matches) summary.set(m.term, (summary.get(m.term) || 0) + 1);

    $("statTotal").textContent = matches.length;
    $("statDistinct").textContent = summary.size;
    const words = (text.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
    $("wc").textContent = words + (words === 1 ? " word" : " words") + " · " + text.length + " characters";
    let flagged = 0; for (const m of matches) flagged += (m.text.match(/\S+/g) || []).length;
    $("statScore").textContent = !words ? "–" : matches.length ? Math.min(99, Math.max(0, Math.round(100 - (flagged / words) * 200))) + "%" : "100%";
    $("fixAllBtn").hidden = !matches.length;

    if (!text.trim()) setBanner("info", "Upload a document or paste text to begin.");
    else if (!matches.length) setBanner("ok", NEUTRAL);
    else setBanner("warn", `Found ${matches.length} gender-specific term${matches.length > 1 ? "s" : ""}. Click a highlight to replace it.`);

    renderSummary(summary);
    renderViewer(text);
    $("report").textContent = buildReport(text, summary);
  }

  function renderSummary(summary) {
    const body = $("summary"); body.textContent = "";
    const empty = $("summaryEmpty");
    empty.textContent = editor.value.trim() ? NEUTRAL : "No results yet.";
    $("summaryTable").hidden = !summary.size;
    empty.hidden = summary.size > 0; empty.style.display = summary.size ? "none" : "";
    [...summary].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([term, n]) => {
      const tr = document.createElement("tr");
      const t = document.createElement("td"); t.className = "term"; t.textContent = term;
      const c = document.createElement("td"); c.className = "num"; c.textContent = n;
      const a = document.createElement("td"); const alts = document.createElement("div"); alts.className = "alts";
      for (const alt of LEXICON[term]) {
        const b = document.createElement("button"); b.className = "chip"; b.textContent = alt; b.title = "Replace every occurrence";
        b.onclick = (e) => { e.stopPropagation(); const k = applyReplacements(matches.filter((m) => m.term === term).map((m) => ({ m, alt }))); toast(`Replaced ${k} × ${term}`); };
        alts.append(b);
      }
      a.append(alts); tr.append(t, c, a);
      tr.addEventListener("click", () => jumpTo(term));
      body.append(tr);
    });
  }

  function renderViewer(text) {
    viewer.textContent = "";
    let pos = 0;
    matches.forEach((m, i) => {
      viewer.append(text.slice(pos, m.start));
      const mk = document.createElement("mark");
      mk.textContent = m.text; mk.dataset.i = i; mk.title = "Click for suggestions";
      viewer.append(mk); pos = m.end;
    });
    viewer.append(text.slice(pos));
  }

  function jumpTo(term) {
    showView(true);
    const idxs = matches.map((m, i) => [m, i]).filter(([m]) => m.term === term).map(([, i]) => i);
    const k = ((cycle[term] ?? -1) + 1) % idxs.length;
    cycle[term] = k;
    viewer.querySelectorAll("mark.sel").forEach((e) => e.classList.remove("sel"));
    const el = viewer.querySelector(`mark[data-i="${idxs[k]}"]`);
    el.classList.add("sel");
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  // ---------- report ----------
  function lineCol(text, pos) {
    const before = text.slice(0, pos);
    const line = before.split("\n").length;
    return [line, pos - (before.lastIndexOf("\n") + 1) + 1];
  }
  function buildReport(text, summary) {
    if (!text.trim() || !matches.length) return text.trim() ? NEUTRAL : "";
    const L = ["GENDER-NEUTRAL LANGUAGE REPORT", "Source: " + source, "=".repeat(60),
      `Gender-specific terms found: ${matches.length} (${summary.size} distinct)`, "",
      "Term".padEnd(22) + "Count".padStart(6) + "  Suggested alternative(s)", "-".repeat(60)];
    [...summary].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .forEach(([t, n]) => L.push(t.padEnd(22) + String(n).padStart(6) + "  " + LEXICON[t].join(", ")));
    L.push("", "Occurrences", "-".repeat(60));
    for (const m of matches) {
      const [ln, col] = lineCol(text, m.start);
      const ctx = text.slice(Math.max(0, m.start - 25), m.end + 25).replace(/\n/g, " ");
      L.push(`Line ${ln}, col ${col}: "${m.text}" -> ${LEXICON[m.term].join(" / ")}`, `    ...${ctx}...`);
    }
    return L.join("\n");
  }

  // ---------- replace popover ----------
  function matchCase(orig, repl) {
    if (orig.length > 1 && orig === orig.toUpperCase() && /[A-Z]/.test(orig)) return repl.toUpperCase();
    if (/^[A-Z]/.test(orig)) return repl[0].toUpperCase() + repl.slice(1);
    return repl;
  }
  viewer.addEventListener("click", (e) => {
    const mk = e.target.closest("mark");
    if (!mk) return hidePop();
    const m = matches[+mk.dataset.i];
    pop.textContent = "";
    const t = document.createElement("div"); t.className = "pop-title";
    t.textContent = `Replace "${m.text}" with:`; pop.append(t);
    for (const alt of LEXICON[m.term]) {
      const b = document.createElement("button"); b.textContent = matchCase(m.text, alt);
      b.onclick = () => {
        hidePop(); applyReplacements([{ m, alt }]);
      };
      pop.append(b);
    }
    const r = mk.getBoundingClientRect();
    pop.hidden = false;
    pop.style.left = Math.min(r.left + scrollX, innerWidth - 200) + "px";
    pop.style.top = r.bottom + scrollY + 6 + "px";
    e.stopPropagation();
  });
  function hidePop() { pop.hidden = true; }
  document.addEventListener("click", (e) => { if (!pop.contains(e.target)) hidePop(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hidePop(); });

  // ---------- view toggle ----------
  function showView(highlighted) {
    editor.hidden = highlighted; viewer.hidden = !highlighted; $("viewHint").hidden = !highlighted;
    $("tabEdit").classList.toggle("active", !highlighted);
    $("tabView").classList.toggle("active", highlighted);
    hidePop();
  }
  $("tabEdit").onclick = () => showView(false);
  $("tabView").onclick = () => showView(true);
  editor.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { analyze(); pushHistory(); }, 300); source = "(pasted text)"; $("fileName").hidden = true; });

  // ---------- results tabs ----------
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
    document.querySelectorAll(".pane").forEach((p) => (p.hidden = p.id !== t.dataset.pane));
  }));

  // ---------- file reading ----------
  async function readFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "txt") return file.text();
    if (ext === "docx") {
      if (!window.mammoth) throw new Error("DOCX reader failed to load (check your internet connection).");
      return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
    }
    if (ext === "pdf") {
      if (!window.pdfjsLib) throw new Error("PDF reader failed to load (check your internet connection).");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const c = await (await pdf.getPage(i)).getTextContent();
        let line = "", out = "";
        for (const it of c.items) { line += it.str; if (it.hasEOL) { out += line + "\n"; line = ""; } else if (it.str && !/\s$/.test(it.str)) line += " "; }
        pages.push(out + line);
      }
      return pages.join("\n\n");
    }
    if (ext === "doc") throw new Error("Legacy .doc isn't supported. Save it as .docx in Word and try again.");
    throw new Error(`Unsupported file type ".${ext}". Use .txt, .docx or .pdf.`);
  }
  async function loadFile(file) {
    if (!file) return;
    try {
      setBanner("info", "Reading " + file.name + "…");
      const text = await readFile(file);
      editor.value = text; source = file.name; pushHistory();
      $("fileName").textContent = "Loaded: " + file.name; $("fileName").hidden = false;
      if (!text.trim()) { analyze(); return setBanner("err", file.name.toLowerCase().endsWith(".pdf") ? "No text could be extracted (scanned PDF?)." : "The file is empty. It contains no text to check."); }
      analyze(); showView(true);
    } catch (err) { setBanner("err", err.message); }
  }
  const drop = $("drop");
  $("file").addEventListener("change", (e) => { loadFile(e.target.files[0]); e.target.value = ""; });
  drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("file").click(); } });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => loadFile(e.dataTransfer.files[0]));

  // ---------- report actions ----------
  $("dlBtn").onclick = () => {
    const txt = $("report").textContent; if (!txt) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = "gender-neutral-report.txt"; a.click(); URL.revokeObjectURL(a.href);
  };
  $("copyBtn").onclick = () => navigator.clipboard?.writeText($("report").textContent);
  $("clearBtn").onclick = () => { $("fileName").hidden = true; source = "(pasted text)"; showView(false); setText(""); };
  $("undoBtn").onclick = undo;
  $("fixAllBtn").onclick = () => {
    const k = applyReplacements(matches.map((m) => ({ m, alt: LEXICON[m.term][0] })));
    toast(`${k} replacement${k > 1 ? "s" : ""} made · Undo to revert`);
  };
  $("sampleSel").onchange = (e) => {
    const s = e.target.value; if (!s) return;
    source = "(sample: " + s + ")"; $("fileName").hidden = true; setText(SAMPLES[s]); showView(true); e.target.value = "";
  };
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") { e.preventDefault(); $("file").click(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && document.activeElement !== editor) { e.preventDefault(); undo(); }
  });
  // drop anywhere on the document card
  const card = drop.closest(".card"); let depth = 0;
  card.addEventListener("dragenter", (e) => { e.preventDefault(); depth++; card.classList.add("over"); });
  card.addEventListener("dragover", (e) => e.preventDefault());
  card.addEventListener("dragleave", () => { if (--depth <= 0) { depth = 0; card.classList.remove("over"); } });
  card.addEventListener("drop", (e) => { e.preventDefault(); depth = 0; card.classList.remove("over"); if (!e.target.closest("#drop")) loadFile(e.dataTransfer.files[0]); });

  // ---------- FSA inspector ----------
  function inspect() {
    const word = $("fsaInput").value;
    const box = $("fsaTrace"); box.textContent = "";
    const steps = fsa.trace(word);
    steps.forEach((s, i) => {
      if (i) {
        const ar = document.createElement("span"); ar.className = "arrow";
        ar.textContent = "—" + (s.ch === " " ? "␣" : s.ch) + "→"; box.append(ar);
      }
      const st = document.createElement("span");
      const acc = s.accept && s.accept.length;
      st.className = "st" + (acc ? " accept" : ""); st.textContent = "q" + s.state; box.append(st);
    });
    const last = steps[steps.length - 1];
    const v = $("fsaVerdict");
    if (last.accept && last.accept.length) {
      const t = last.accept[0];
      v.textContent = `Accepted: "${t}" is a gender-specific term → ${LEXICON[t].join(" / ")}`;
      v.style.color = "var(--ok-ink)";
    } else {
      v.textContent = word.trim() ? "Not accepted: not a term in the lexicon." : "";
      v.style.color = "var(--muted)";
    }
  }
  $("fsaInput").addEventListener("input", inspect);

  // theme toggle
  $("themeBtn").onclick = () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("patch-theme", next); } catch (e) {}
  };

  inspect(); analyze();
})();
