/**
 * Student Expense Tracker — Dynamic Client Engine
 * Handles persistent storage, metrics aggregation, item deletion, and DOM updates.
 */

const STORAGE_KEY = "student_expenses_v1";

// In-memory state
let expenses = [];

/**
 * Sanitize and validate stored expense records loaded from storage.
 * Ensures data is an array of well-formed expense objects and gracefully
 * handles unexpected, corrupted, or non-array JSON structures.
 */
function sanitizeStoredExpenses(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .filter(item => {
      if (!item || typeof item !== "object") return false;
      const hasValidDesc = typeof item.desc === "string" && item.desc.trim().length > 0;
      const numAmount = typeof item.amount === "number" ? item.amount : parseFloat(item.amount);
      const hasValidAmount = !isNaN(numAmount) && numAmount > 0 && isFinite(numAmount);
      return hasValidDesc && hasValidAmount;
    })
    .map(item => ({
      id: typeof item.id === "string" && item.id.trim().length > 0
        ? item.id.trim()
        : "exp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      desc: item.desc.trim(),
      amount: Math.round((typeof item.amount === "number" ? item.amount : parseFloat(item.amount)) * 100) / 100,
      category: typeof item.category === "string" && item.category.trim().length > 0
        ? item.category.trim()
        : "Other",
      date: typeof item.date === "string" && item.date.trim().length > 0
        ? item.date.trim()
        : new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })
    }));
}

/**
 * Initialize application state from localStorage
 */
function initApp() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      expenses = sanitizeStoredExpenses(parsed);
    } else {
      expenses = [];
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
  if (isNaN(amount) || amount <= 0 || !isFinite(amount)) {
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
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const total = safeExpenses.reduce((sum, item) => sum + (item && typeof item.amount === "number" && isFinite(item.amount) ? item.amount : 0), 0);
  const count = safeExpenses.length;
  const highest = safeExpenses.reduce((max, item) => (item && typeof item.amount === "number" && isFinite(item.amount) && item.amount > max ? item.amount : max), 0);

  const totalEl = document.getElementById("total");
  const countEl = document.getElementById("count");
  const highestEl = document.getElementById("highest");

  if (totalEl) totalEl.textContent = total.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  if (countEl) countEl.textContent = count;
  if (highestEl) highestEl.textContent = highest.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/**
 * Construct an expense item DOM element safely using text nodes
 */
function createExpenseItemElement(item, onDelete) {
  const li = document.createElement("li");
  li.className = "expense-item";

  if (!item || typeof item !== "object") return li;

  const desc = typeof item.desc === "string" ? item.desc : "";
  const category = typeof item.category === "string" ? item.category : "Other";
  const date = typeof item.date === "string" ? item.date : "";
  const amount = typeof item.amount === "number" && isFinite(item.amount) ? item.amount : 0;
  const id = typeof item.id === "string" ? item.id : "";

  const left = document.createElement("div");
  left.className = "item-left";

  const descSpan = document.createElement("span");
  descSpan.className = "item-desc";
  descSpan.textContent = desc;

  const metaSpan = document.createElement("span");
  metaSpan.className = "item-meta";

  const catSpan = document.createElement("span");
  catSpan.className = "item-category";
  catSpan.textContent = category;

  const dateText = document.createTextNode(` · ${date}`);
  metaSpan.appendChild(catSpan);
  metaSpan.appendChild(dateText);

  left.appendChild(descSpan);
  left.appendChild(metaSpan);

  const right = document.createElement("div");
  right.className = "item-right";

  const amountSpan = document.createElement("span");
  amountSpan.className = "item-amount";
  amountSpan.textContent = "₹" + amount.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "delete-btn";
  delBtn.title = `Delete ${desc}`;
  delBtn.setAttribute("aria-label", `Delete expense: ${desc} (₹${amount})`);

  const iconSpan = document.createElement("span");
  iconSpan.setAttribute("aria-hidden", "true");
  iconSpan.textContent = "×";
  delBtn.appendChild(iconSpan);

  if (onDelete && id) {
    delBtn.onclick = () => onDelete(id);
  }

  right.appendChild(amountSpan);
  right.appendChild(delBtn);

  li.appendChild(left);
  li.appendChild(right);
  return li;
}

/**
 * Re-render the expense list in the DOM
 */
function renderList() {
  const listEl = document.getElementById("list");
  const emptyEl = document.getElementById("empty-state");

  if (!listEl) return;
  listEl.textContent = "";

  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  if (safeExpenses.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";

  safeExpenses.forEach(item => {
    const li = createExpenseItemElement(item, deleteExpense);
    listEl.appendChild(li);
  });
}

/**
 * Master render pipeline
 */
function render() {
  if (!Array.isArray(expenses)) {
    expenses = [];
  }
  updateMetrics();
  renderList();

  const clearBtn = document.getElementById("clear-btn");
  if (clearBtn) {
    clearBtn.disabled = expenses.length === 0;
  }
}

// Automatically start app when DOM is ready
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}

// Export for automated unit testing in Node environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    STORAGE_KEY,
    sanitizeStoredExpenses,
    addExpenseToState: (list, desc, amount, category) => {
      const safeList = Array.isArray(list) ? list : [];
      const cleanDesc = typeof desc === "string" ? desc.trim() : "";
      const numAmount = typeof amount === "number" ? amount : parseFloat(amount);
      if (!cleanDesc || isNaN(numAmount) || numAmount <= 0 || !isFinite(numAmount)) {
        return safeList;
      }
      return [{
        id: "test_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        desc: cleanDesc,
        amount: numAmount,
        category: category || "Other",
        date: "23 Nov 2026"
      }, ...safeList];
    },
    deleteExpenseFromState: (list, id) => {
      if (!Array.isArray(list)) return [];
      return list.filter(item => item && item.id !== id);
    },
    calculateTotals: (list) => {
      if (!Array.isArray(list)) return { total: 0, count: 0, highest: 0 };
      const total = list.reduce((s, x) => s + (x && typeof x.amount === "number" && isFinite(x.amount) ? x.amount : 0), 0);
      const highest = list.reduce((max, x) => (x && typeof x.amount === "number" && isFinite(x.amount) && x.amount > max ? x.amount : max), 0);
      return { total, count: list.length, highest };
    },
    createExpenseItemElement
  };
}
