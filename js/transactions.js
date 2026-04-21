/* ============================================
   WealthWise — Transactions Module
   ============================================ */

const TransactionsModule = (() => {
  function init() {
    // Form submission
    document.getElementById('transactionForm').addEventListener('submit', handleAddTransaction);
    
    // Filter listeners
    document.getElementById('filterType').addEventListener('change', renderTable);
    document.getElementById('filterCategory').addEventListener('change', renderTable);
    document.getElementById('filterMonth').addEventListener('change', renderTable);

    // Auto-switch categories on type change
    document.getElementById('txnType').addEventListener('change', (e) => {
      const sel = document.getElementById('txnCategory');
      const type = e.target.value;
      // Auto-select first matching category
      const options = sel.querySelectorAll('option');
      for (const opt of options) {
        const group = opt.closest('optgroup');
        if (group) {
          const groupLabel = group.label.toLowerCase();
          if ((type === 'income' && groupLabel.includes('income')) ||
              (type === 'expense' && groupLabel.includes('expense'))) {
            sel.value = opt.value;
            break;
          }
        }
      }
    });

    // Set default date to today
    document.getElementById('txnDate').valueAsDate = new Date();
  }

  function handleAddTransaction(e) {
    e.preventDefault();

    const type = document.getElementById('txnType').value;
    const amount = parseFloat(document.getElementById('txnAmount').value);
    const category = document.getElementById('txnCategory').value;
    const date = document.getElementById('txnDate').value;
    const note = document.getElementById('txnNote').value.trim();

    if (!amount || amount <= 0) {
      WealthWise.showToast('Please enter a valid amount', 'error');
      return;
    }

    const txn = {
      id: WealthWise.generateId(),
      type,
      amount,
      category,
      date,
      note
    };

    const txns = WealthWise.getTransactions();
    txns.push(txn);
    WealthWise.saveTransactions(txns);

    // Reset form
    document.getElementById('txnAmount').value = '';
    document.getElementById('txnNote').value = '';
    document.getElementById('txnDate').valueAsDate = new Date();

    WealthWise.showToast(`${type === 'income' ? 'Income' : 'Expense'} of ${WealthWise.formatCurrency(amount)} added!`, 'success');
    
    renderTable();
    populateFilters();
  }

  function deleteTransaction(id) {
    let txns = WealthWise.getTransactions();
    txns = txns.filter(t => t.id !== id);
    WealthWise.saveTransactions(txns);
    WealthWise.showToast('Transaction deleted', 'warning');
    renderTable();
  }

  function populateFilters() {
    const txns = WealthWise.getTransactions();
    
    // Category filter
    const catFilter = document.getElementById('filterCategory');
    const currentCat = catFilter.value;
    const categories = [...new Set(txns.map(t => t.category))].sort();
    catFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
      catFilter.innerHTML += `<option value="${cat}" ${cat === currentCat ? 'selected' : ''}>${WealthWise.getCategoryIcon(cat)} ${cat}</option>`;
    });

    // Month filter
    const monthFilter = document.getElementById('filterMonth');
    const currentMonth = monthFilter.value;
    const months = [...new Set(txns.map(t => WealthWise.getMonthKey(t.date)))].sort().reverse();
    monthFilter.innerHTML = '<option value="all">All Months</option>';
    months.forEach(m => {
      monthFilter.innerHTML += `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>${WealthWise.getMonthLabel(m)}</option>`;
    });
  }

  function renderTable() {
    const txns = WealthWise.getTransactions();
    const filterType = document.getElementById('filterType').value;
    const filterCategory = document.getElementById('filterCategory').value;
    const filterMonth = document.getElementById('filterMonth').value;

    let filtered = txns;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }
    if (filterMonth !== 'all') {
      filtered = filtered.filter(t => WealthWise.getMonthKey(t.date) === filterMonth);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('transactionsBody');
    const emptyState = document.getElementById('txnEmptyState');
    const table = document.getElementById('transactionsTable');

    if (filtered.length === 0) {
      table.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    table.classList.remove('hidden');
    emptyState.classList.add('hidden');

    tbody.innerHTML = filtered.map(t => `
      <tr>
        <td>${WealthWise.formatDate(t.date)}</td>
        <td>${t.note || t.category}</td>
        <td><span class="category-badge">${WealthWise.getCategoryIcon(t.category)} ${t.category}</span></td>
        <td><span class="badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${t.type}</span></td>
        <td class="${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
          ${t.type === 'income' ? '+' : '-'}${WealthWise.formatCurrency(t.amount)}
        </td>
        <td>
          <button class="btn-delete" onclick="TransactionsModule.deleteTransaction('${t.id}')" title="Delete">🗑</button>
        </td>
      </tr>
    `).join('');
  }

  function refresh() {
    populateFilters();
    renderTable();
    document.getElementById('txnDate').valueAsDate = new Date();
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  return {
    refresh,
    deleteTransaction,
    renderTable
  };
})();
