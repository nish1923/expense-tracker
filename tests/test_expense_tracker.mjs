// Automated Test Suite for Student Expense Tracker
import assert from "node:assert";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { addExpenseToState, calculateTotals } = require("../script.js");

console.log("=== Student Expense Tracker Verification Suite ===\n");

// Test 1: Empty state initial calculation
{
  const metrics = calculateTotals([]);
  assert.strictEqual(metrics.total, 0);
  assert.strictEqual(metrics.count, 0);
  assert.strictEqual(metrics.highest, 0);
  console.log("✓ Test 1 Passed: Empty state returns zero totals");
}

// Test 2: Adding valid expense items
{
  let state = [];
  state = addExpenseToState(state, "Canteen Lunch", 80, "Food & Dining");
  state = addExpenseToState(state, "Metro Card Recharge", 250, "Transportation");
  state = addExpenseToState(state, "Engineering Notebook", 120, "Books & Study");

  assert.strictEqual(state.length, 3);
  const metrics = calculateTotals(state);
  assert.strictEqual(metrics.total, 450);
  assert.strictEqual(metrics.count, 3);
  assert.strictEqual(metrics.highest, 250);
  console.log("✓ Test 2 Passed: Adding multiple categorized expenses aggregates correctly (₹450 total, ₹250 max)");
}

// Test 3: Validation rejection (empty desc, negative amount, zero amount)
{
  let state = [];
  state = addExpenseToState(state, "", 100, "Food");
  state = addExpenseToState(state, "Valid Name", 0, "Food");
  state = addExpenseToState(state, "Invalid Negative", -50, "Food");
  state = addExpenseToState(state, "NaN value", "not_a_number", "Food");

  assert.strictEqual(state.length, 0, "All invalid records should be rejected");
  console.log("✓ Test 3 Passed: Rejection of empty descriptions, zero amounts, and negative numbers");
}

// Test 4: Deletion recalculation
{
  let state = [
    { id: "1", desc: "A", amount: 100 },
    { id: "2", desc: "B", amount: 300 }
  ];
  state = state.filter(x => x.id !== "1");
  const metrics = calculateTotals(state);
  assert.strictEqual(metrics.total, 300);
  assert.strictEqual(metrics.count, 1);
  assert.strictEqual(metrics.highest, 300);
  console.log("✓ Test 4 Passed: Deletion recalculates metrics correctly");
}

console.log("\n=======================================================");
console.log("ALL 4 EXPENSE TRACKER VERIFICATION TESTS PASSED!");
console.log("=======================================================\n");
