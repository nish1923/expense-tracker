// Automated Verification Suite for Student Expense Tracker
import assert from "node:assert";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  STORAGE_KEY,
  addExpenseToState,
  deleteExpenseFromState,
  calculateTotals,
  createExpenseItemElement
} = require("../script.js");

console.log("=== Student Expense Tracker Verification Suite ===\n");

// Test 1: Empty state initial calculation
{
  const metrics = calculateTotals([]);
  assert.strictEqual(metrics.total, 0);
  assert.strictEqual(metrics.count, 0);
  assert.strictEqual(metrics.highest, 0);
  console.log("PASS: Empty state returns zero totals");
}

// Test 2: Adding valid expense items and aggregate calculations
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
  console.log("PASS: Adding valid items calculates metrics accurately");
}

// Test 3: Validation rejection (empty description, negative amount, zero amount, NaN, Infinity)
{
  let state = [];
  state = addExpenseToState(state, "", 100, "Food");
  state = addExpenseToState(state, "   ", 100, "Food");
  state = addExpenseToState(state, "Zero Amount", 0, "Food");
  state = addExpenseToState(state, "Negative Amount", -50, "Food");
  state = addExpenseToState(state, "Non-number", "invalid", "Food");
  state = addExpenseToState(state, "Infinite Amount", Infinity, "Food");

  assert.strictEqual(state.length, 0, "All invalid records must be rejected");
  console.log("PASS: Input validation rejects invalid descriptions and non-positive/infinite amounts");
}

// Test 4: Deletion behavior and metrics recalculation
{
  let state = [];
  state = addExpenseToState(state, "Item Alpha", 100, "Other");
  state = addExpenseToState(state, "Item Beta", 300, "Other");
  const idToDelete = state[0].id;

  state = deleteExpenseFromState(state, idToDelete);
  assert.strictEqual(state.length, 1);
  const metrics = calculateTotals(state);
  assert.strictEqual(metrics.total, 100);
  assert.strictEqual(metrics.count, 1);
  assert.strictEqual(metrics.highest, 100);
  console.log("PASS: Deletion removes target item and updates metrics");
}

// Test 5: In-memory state storage of HTML/script payloads
{
  let state = [];
  const payload = "<script>alert('xss')</script>";
  state = addExpenseToState(state, payload, 99, "Other");

  assert.strictEqual(state.length, 1);
  assert.strictEqual(state[0].desc, payload);
  console.log("PASS: HTML tags in description are stored literally without execution");
}

// Test 6: DOM rendering safe-text verification & XSS immunity (DOM Simulation)
{
  const createdElements = [];
  const mockDoc = {
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        className: "",
        textContent: "",
        children: [],
        attributes: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        appendChild(child) {
          this.children.push(child);
          if (child.textContent) {
            this.textContent += child.textContent;
          }
        }
      };
      createdElements.push(el);
      return el;
    },
    createTextNode(text) {
      return { textContent: text, isTextNode: true };
    }
  };

  const prevDoc = global.document;
  global.document = mockDoc;

  const htmlPayload = "<script>alert('xss')</script><img src=x onerror=alert(1)>";
  const item = {
    id: "exp_test_xss",
    desc: htmlPayload,
    amount: 150,
    category: "Food & Dining",
    date: "23 Nov 2026"
  };

  const renderedLi = createExpenseItemElement(item, () => {});

  // 1. Confirm description appears as literal text
  const descEl = createdElements.find(el => el.className === "item-desc");
  assert.ok(descEl, "item-desc element must exist");
  assert.strictEqual(descEl.textContent, htmlPayload, "Payload must appear as literal textContent");

  // 2. Confirm no script or img HTML elements were created
  const injectedScript = createdElements.find(el => el.tagName === "SCRIPT");
  const injectedImg = createdElements.find(el => el.tagName === "IMG");
  assert.strictEqual(injectedScript, undefined, "No SCRIPT element should ever be created");
  assert.strictEqual(injectedImg, undefined, "No IMG element should ever be created");

  // 3. Confirm category and date values are rendered safely
  const catEl = createdElements.find(el => el.className === "item-category");
  assert.ok(catEl, "item-category element must exist");
  assert.strictEqual(catEl.textContent, "Food & Dining", "Category must be safe textContent");

  const metaEl = createdElements.find(el => el.className === "item-meta");
  assert.ok(metaEl, "item-meta element must exist");
  assert.ok(metaEl.children.some(c => c.isTextNode && c.textContent.includes("23 Nov 2026")), "Date must be an inert text node");

  // 4. Confirm accessible delete button
  const delBtn = createdElements.find(el => el.className === "delete-btn");
  assert.ok(delBtn, "delete-btn element must exist");
  assert.strictEqual(delBtn.attributes["aria-label"], `Delete expense: ${htmlPayload} (₹150)`);

  global.document = prevDoc;
  console.log("PASS: DOM rendering verified safe: HTML/script tags are literal text, no elements injected");
}

// Test 7: LocalStorage serialization and recovery simulation
{
  const mockStorage = new Map();
  const testData = [
    { id: "exp_1", desc: "Textbook", amount: 500, category: "Books & Study", date: "23 Nov 2026" }
  ];

  mockStorage.set(STORAGE_KEY, JSON.stringify(testData));
  const retrievedRaw = mockStorage.get(STORAGE_KEY);
  const parsedData = JSON.parse(retrievedRaw);

  assert.strictEqual(parsedData.length, 1);
  assert.strictEqual(parsedData[0].desc, "Textbook");
  assert.strictEqual(parsedData[0].amount, 500);
  console.log("PASS: Storage serialization round-trip maintains data integrity");
}

console.log("\n=======================================================");
console.log("ALL 7 EXPENSE TRACKER VERIFICATION TESTS PASSED!");
console.log("=======================================================\n");
