// Finite state automaton (DFA) for multi-term recognition.
//
// The lexicon is compiled into a trie (the states), completed with failure
// links (Aho-Corasick) so that delta(state, char) is defined for every
// state. Scanning is one left-to-right pass: one transition per character.
// A state is accepting when it (or a suffix state) ends a lexicon term.
// Word boundaries are checked on acceptance, so "he" is not reported
// inside "the" / "she" and "chairman" not inside "chairmanship".
(function () {
  const isWordChar = (c) => /[\p{L}\p{N}']/u.test(c);

  // Lowercase; collapse whitespace runs to one space; unify dashes/quotes.
  // Returns [normalized, idx] where idx[i] = original index of norm[i].
  function normalize(text) {
    const out = [], idx = [];
    let i = 0;
    while (i < text.length) {
      const c = text[i];
      if (/\s/.test(c)) {
        let j = i;
        while (j < text.length && /\s/.test(text[j])) j++;
        out.push(" "); idx.push(i); i = j; continue;
      }
      if ("‐‑‒–—−".includes(c)) out.push("-");
      else if (c === "’" || c === "‘") out.push("'");
      else out.push(c.toLowerCase().length === 1 ? c.toLowerCase() : c);
      idx.push(i); i++;
    }
    idx.push(text.length);
    return [out.join(""), idx];
  }

  class TermAutomaton {
    constructor(terms) {
      this.goto = [new Map()];   // transition edges of the trie
      this.out = [null];         // term accepted exactly at this state
      for (const t of terms) this._insert(t.toLowerCase());
      this._build();
    }
    _insert(term) {
      let s = 0;
      for (const ch of term) {
        let n = this.goto[s].get(ch);
        if (n === undefined) {
          this.goto.push(new Map()); this.out.push(null);
          n = this.goto.length - 1; this.goto[s].set(ch, n);
        }
        s = n;
      }
      this.out[s] = term;
    }
    _build() {
      const n = this.goto.length;
      this.fail = new Array(n).fill(0);
      this.dict = new Array(n).fill(null); // nearest accepting suffix state
      const q = [...this.goto[0].values()];
      while (q.length) {
        const s = q.shift();
        for (const [ch, t] of this.goto[s]) {
          let f = this.fail[s];
          while (f && !this.goto[f].has(ch)) f = this.fail[f];
          this.fail[t] = this.goto[f].get(ch) ?? 0;
          q.push(t);
        }
        const f = this.fail[s];
        this.dict[s] = this.out[f] ? f : this.dict[f];
      }
    }
    get numStates() { return this.goto.length; }

    // delta(state, ch)
    step(state, ch) {
      while (state && !this.goto[state].has(ch)) state = this.fail[state];
      return this.goto[state].get(ch) ?? 0;
    }
    *_accepting(state) {
      let s = this.out[state] ? state : this.dict[state];
      while (s) { yield this.out[s]; s = this.dict[s]; }
    }

    // Run the machine over a word, recording each state (for the inspector).
    trace(word) {
      const [norm] = normalize(word);
      let state = 0;
      const steps = [{ ch: null, state: 0, accept: this.out[0] }];
      for (const ch of norm) {
        state = this.step(state, ch);
        steps.push({ ch, state, accept: [...this._accepting(state)] });
      }
      return steps;
    }

    // Non-overlapping matches: leftmost, then longest.
    findAll(text) {
      const [norm, idx] = normalize(text);
      const raw = [];
      let state = 0;
      for (let i = 0; i < norm.length; i++) {
        state = this.step(state, norm[i]);
        for (const term of this._accepting(state)) {
          const a = i - term.length + 1, b = i + 1;
          if (a > 0 && isWordChar(norm[a - 1])) continue;
          if (b < norm.length && isWordChar(norm[b])) continue;
          raw.push([a, b, term]);
        }
      }
      raw.sort((x, y) => x[0] - y[0] || (y[1] - y[0]) - (x[1] - x[0]));
      const matches = [];
      let lastEnd = -1;
      for (const [a, b, term] of raw) {
        if (a < lastEnd) continue;
        const s = idx[a], e = idx[b];
        matches.push({ start: s, end: e, term, text: text.slice(s, e) });
        lastEnd = b;
      }
      return matches;
    }
  }
  window.TermAutomaton = TermAutomaton;
})();
