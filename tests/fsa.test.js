// Run: node tests/fsa.test.js   (no dependencies)
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
const root = path.join(__dirname, "..");
const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
for (const f of ["lexicon.js", "fsa.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
const { LEXICON, TermAutomaton } = ctx.window;
const fsa = new TermAutomaton(Object.keys(LEXICON));
const same = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
const terms = (t) => fsa.findAll(t).map((m) => m.term);

const tests = {
  "basic terms"() { same(terms("The chairman said he would go."), ["chairman", "he"]); },
  "word boundaries"() {
    same(terms("other there chairmanship"), []);
    same(terms("She left."), ["she"]);
  },
  "case-insensitive, original text kept"() {
    const m = fsa.findAll("STEWARDESS");
    assert.strictEqual(m[0].term, "stewardess"); assert.strictEqual(m[0].text, "STEWARDESS");
  },
  "longest phrase wins"() {
    same(terms("his or her"), ["his or her"]);
    same(terms("Ladies and gentlemen"), ["ladies and gentlemen"]);
  },
  "whitespace and hyphen variants"() {
    same(terms("his  or\nher"), ["his or her"]);
    same(terms("man‑made"), ["man-made"]);
  },
  "punctuation adjacent"() { same(terms('(he), "she"; him.'), ["he", "she", "him"]); },
  "positions index the real text"() {
    const t = "A policeman ran."; const m = fsa.findAll(t)[0];
    assert.strictEqual(t.slice(m.start, m.end), "policeman");
  },
  "neutral text has no matches"() { assert.strictEqual(fsa.findAll("The chairperson said they would go.").length, 0); },
  "requirement examples have alternatives"() {
    same(LEXICON.he, ["they"]); assert.ok(LEXICON.chairman.includes("chairperson"));
    assert.ok(LEXICON.stewardess.includes("flight attendant"));
  },
  "trace accepts a lexicon term"() {
    const last = fsa.trace("chairman").pop(); assert.ok(last.accept.includes("chairman"));
  },
};
let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log("PASS  " + name); } catch (e) { failed++; console.log("FAIL  " + name + "\n      " + e.message); }
}
console.log(`\n${Object.keys(tests).length - failed}/${Object.keys(tests).length} passed; automaton has ${fsa.numStates} states`);
process.exit(failed ? 1 : 0);
