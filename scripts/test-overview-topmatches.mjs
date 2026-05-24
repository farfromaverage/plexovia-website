/**
 * Unit test: overview API topMatches score ordering
 *
 * Proves that collecting first 5 from unsorted input produces wrong top matches.
 * Run: node scripts/test-overview-topmatches.mjs
 */

// ----- Test data: 10 matches with scores in shuffled order -----
const matches = [
  { score: 55 }, { score: 98 }, { score: 60 }, { score: 91 }, { score: 42 },
  { score: 88 }, { score: 75 }, { score: 96 }, { score: 50 }, { score: 85 },
];

// ----- Bug reproduction: current logic (first 5, then sort) -----
function currentTopMatches() {
  const topMatches = [];
  matches.forEach(m => {
    if (topMatches.length < 5) {
      topMatches.push({ score: m.score });
    }
  });
  topMatches.sort((a, b) => b.score - a.score);
  return topMatches.map(m => m.score);
}

// ----- Expected: top 5 by score -----
const expected = [98, 96, 91, 88, 85];

// ----- Test 1: Current logic FAILS -----
const bugResult = currentTopMatches();
const bugPass = JSON.stringify(bugResult) === JSON.stringify(expected);
console.log(`\n[BUG]  Current logic (first-5-then-sort): ${bugResult}`);
console.log(`[BUG]  Expected:                       ${expected}`);
console.log(`[BUG]  ${bugPass ? 'PASS (unexpected!)' : 'FAIL — bug confirmed'}`);

// ----- Fix: collect all, sort, slice top 5 -----
function fixedTopMatches() {
  const topMatches = [];
  matches.forEach(m => {
    topMatches.push({ score: m.score });
  });
  topMatches.sort((a, b) => b.score - a.score);
  if (topMatches.length > 5) topMatches.length = 5;
  return topMatches.map(m => m.score);
}

// ----- Test 2: Fixed logic PASSES -----
const fixResult = fixedTopMatches();
const fixPass = JSON.stringify(fixResult) === JSON.stringify(expected);
console.log(`\n[FIX]  Fixed logic (all-sort-slice):  ${fixResult}`);
console.log(`[FIX]  Expected:                       ${expected}`);
console.log(`[FIX]  ${fixPass ? 'PASS' : 'FAIL'}`);

// ----- Edge case: fewer than 5 matches -----
const fewMatches = [{ score: 30 }, { score: 70 }];
function fixedTopMatchesFew(input) {
  const topMatches = [];
  input.forEach(m => topMatches.push({ score: m.score }));
  topMatches.sort((a, b) => b.score - a.score);
  if (topMatches.length > 5) topMatches.length = 5;
  return topMatches.map(m => m.score);
}
const fewResult = fixedTopMatchesFew(fewMatches);
const fewExpected = [70, 30];
const fewPass = JSON.stringify(fewResult) === JSON.stringify(fewExpected);
console.log(`\n[EDGE] Fewer than 5: ${fewResult}`);
console.log(`[EDGE] Expected:      ${fewExpected}`);
console.log(`[EDGE] ${fewPass ? 'PASS' : 'FAIL'}`);

// ----- Summary -----
const allPass = fixPass && fewPass;
console.log(`\n${allPass ? '=== ALL TESTS PASS ===' : '=== SOME TESTS FAILED ==='}`);
process.exit(allPass ? 0 : 1);
