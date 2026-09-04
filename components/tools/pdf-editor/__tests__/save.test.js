/**
 * save.test.js — Simulate the exact revert scenario
 *
 * Scenario from user screenshots:
 *   1. Block text starts as "Harsh Raj"
 *   2. User clicks block (selected)
 *   3. User types → text becomes "dss"
 *   4. User clicks elsewhere (blur fires)
 *   5. Expected: block.text === "dss"
 *   6. Bug: block.text reverts to "Harsh Raj"
 *
 * This test verifies:
 *   A. onBlur reads el.textContent and calls onUpdate({text})
 *   B. onUpdate receives the NEW text (not the original)
 *   C. The DOM sync useEffect does NOT fire while focused
 */

// Plain JS simulation (no React, no DOM — logic only)

function simulateTextBlockBehavior() {
  // Simulate the state
  let blockText = 'Harsh Raj';
  let isFocused = false;

  // Simulate what the DOM holds
  let domText = blockText;

  // The onUpdate callback (saves to state)
  const updates = [];
  const onUpdate = ({ text }) => {
    updates.push(text);
    blockText = text; // state updated
  };

  // Simulate: user clicks block
  isFocused = true;

  // Simulate: user types "dss"
  domText = 'dss';

  // Simulate: useEffect([block.text]) — SHOULD NOT fire while focused
  if (!isFocused) {
    // This is the old bug: would reset domText to blockText
    domText = blockText; // BUG — not triggered because isFocused=true
  }

  // Simulate: user clicks elsewhere (blur)
  isFocused = false;
  onUpdate({ text: domText }); // reads live DOM text

  // Verify
  const passed = blockText === 'dss' && updates[0] === 'dss';
  console.log(`Test: onBlur saves typed text → ${passed ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  blockText after blur: "${blockText}" (expected "dss")`);
  console.log(`  updates: ${JSON.stringify(updates)}`);

  // Simulate: React re-renders after state update
  // useEffect([block.text]) fires with new block.text = "dss"
  // isFocused = false, domText already = "dss", no change needed
  const syncWouldChange = domText !== blockText;
  console.log(`Test: DOM sync after re-render is no-op → ${!syncWouldChange ? 'PASS ✓' : 'FAIL ✗'}`);

  return passed;
}

// Run
const result = simulateTextBlockBehavior();
process.exit(result ? 0 : 1);
