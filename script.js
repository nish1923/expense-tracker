/**
 * Student Expense Tracker — Dynamic Client Engine
 * Handles persistent storage, metrics aggregation, item deletion, and DOM updates.
 */

const STORAGE_KEY = "student_expenses_v1";

// In-memory state
let expenses = [];

/**
 * Initialize application state from localStorage
 */
function initApp() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      expenses = JSON.parse(stored);
    }
  } catch (err) {
    console.warn("Could not load from localStorage, initializing empty state:", err);
    expenses = [];
  }
  render();
}

/**
 * Persist current state to localStorage
 */
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
  }
}

/**
 * Add an expense item from form inputs
 */
function addExpense() {
  const descInput = document.getElementById("desc");
  const amountInput = document.getElementById("amount");
  const categoryInput = document.getElementById("category");

  const desc = descInput ? descInput.value.trim() : "";
  const amount = amountInput ? parseFloat(amountInput.value) : 0;
  const category = categoryInput ? categoryInput.value : "Other";

  // Strict validation
  if (!desc) {
    alert("Please provide an expense description.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid positive amount.");
    return;
  }

  const newExpense = {
    id: "exp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    desc: desc,
    amount: amount,
    category: category,
    date: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  };

  expenses.unshift(newExpense);
  persist();
  render();

  // Reset inputs
  if (descInput) descInput.value = "";
  if (amountInput) amountInput.value = "";
  if (descInput) descInput.focus();
}

/**
 * Delete a specific expense by ID
 */
function deleteExpense(id) {
  expenses = expenses.filter(item => item.id !== id);
  persist();
  render();
}

/**
 * Clear all logged expenses with confirmation
 */
function clearAllExpenses() {
  if (expenses.length === 0) return;
  if (confirm("Are you sure you want to clear all logged expenses? This action cannot be undone.")) {
    expenses = [];
    persist();
    render();
  }
}

/**
 * Calculate totals and update metric cards
 */
function updateMetrics() {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const count = expenses.length;
  const highest = expenses.reduce((max, item) => item.amount > max ? item.amount : max, 0);

  const totalEl = document.getElementById("total");
  const countEl = document.getElementById("count");
  const highestEl = document.getElementById("highest");

  if (totalEl) totalEl.innerText = total.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  if (countEl) countEl.innerText = count;
  if (highestEl) highestEl.innerText = highest.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/**
 * Re-render the expense list in the DOM
 */
function renderList() {
  const listEl = document.getElementById("list");
  const emptyEl = document.getElementById("empty-state");

  if (!listEl) return;
  listEl.innerHTML = "";

  if (expenses.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";

  expenses.forEach(item => {
    const li = document.createElement("li");
    li.className = "expense-item";

    const left = document.createElement("div");
    left.className = "item-left";

    const descSpan = document.createElement("span");
    descSpan.className = "item-desc";
    descSpan.innerText = item.desc;

    const metaSpan = document.createElement("span");
    metaSpan.className = "item-meta";
    metaSpan.innerHTML = `<span class="item-category">${item.category}</span> · ${item.date}`;

    left.appendChild(descSpan);
    left.appendChild(metaSpan);

    const right = document.createElement("div");
    right.className = "item-right";

    const amountSpan = document.createElement("span");
    amountSpan.className = "item-amount";
    amountSpan.innerText = "₹" + item.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 });

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.title = "Delete this expense";
    delBtn.innerHTML = "&times;";
    delBtn.onclick = () => deleteExpense(item.id);

    right.appendChild(amountSpan);
    right.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(right);
    listEl.appendChild(li);
  });
}

/**
 * Master render pipeline
 */
function render() {
  updateMetrics();
  renderList();
}

// Automatically start app when DOM is ready
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}

// Export for automated unit testing in Node environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    addExpenseToState: (list, desc, amount, category) => {
      if (!desc || isNaN(amount) || amount <= 0) return list;
      return [{
        id: "test_" + Date.now(),
        desc,
        amount: Number(amount),
        category: category || "Other",
        date: "23 Nov 2026"
      }, ...list];
    },
    calculateTotals: (list) => {
      const total = list.reduce((s, x) => s + x.amount, 0);
      const highest = list.reduce((max, x) => x.amount > max ? x.amount : max, 0);
      return { total, count: list.length, highest };
    }
  };
}
