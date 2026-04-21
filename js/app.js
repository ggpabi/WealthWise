/* ============================================
   WealthWise — App Core (Router, Utils, Init)
   ============================================ */

const WealthWise = (() => {
  // Storage keys
  const KEYS = {
    transactions: 'wealthwise_transactions',
    settings: 'wealthwise_settings',
    riskProfile: 'wealthwise_risk_profile'
  };

  // --- Utility Functions ---
  function formatCurrency(amount) {
    const num = Number(amount);
    if (isNaN(num)) return '₹0';
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function generateId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  }

  function getMonthKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function getMonthLabel(monthKey) {
    const [year, month] = monthKey.split('-');
    const d = new Date(year, parseInt(month) - 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }

  // --- Storage ---
  function getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.transactions)) || [];
    } catch {
      return [];
    }
  }

  function saveTransactions(txns) {
    localStorage.setItem(KEYS.transactions, JSON.stringify(txns));
  }

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.settings)) || { budget: 0 };
    } catch {
      return { budget: 0 };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  }

  function getRiskProfile() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.riskProfile)) || null;
    } catch {
      return null;
    }
  }

  function saveRiskProfile(profile) {
    localStorage.setItem(KEYS.riskProfile, JSON.stringify(profile));
  }

  // --- Category Icons ---
  const CATEGORY_ICONS = {
    'Food': '🍕',
    'Rent': '🏠',
    'Transport': '🚗',
    'Entertainment': '🎬',
    'Shopping': '🛍️',
    'Healthcare': '🏥',
    'Education': '📚',
    'Utilities': '💡',
    'Other Expense': '📦',
    'Salary': '💼',
    'Freelance': '💻',
    'Investments Return': '📈',
    'Other Income': '💰'
  };

  function getCategoryIcon(cat) {
    return CATEGORY_ICONS[cat] || '📌';
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // --- SPA Navigation ---
  function navigate(viewName) {
    // Update view sections
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.remove('active');
    });
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (navItem) navItem.classList.add('active');

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    // Update hash
    window.location.hash = viewName;

    // Refresh view data
    refreshView(viewName);
  }

  function refreshView(viewName) {
    switch (viewName) {
      case 'dashboard':
        if (typeof DashboardModule !== 'undefined') DashboardModule.refresh();
        break;
      case 'transactions':
        if (typeof TransactionsModule !== 'undefined') TransactionsModule.refresh();
        break;
      case 'insights':
        if (typeof InsightsModule !== 'undefined') InsightsModule.refresh();
        break;
      case 'investments':
        if (typeof InvestmentsModule !== 'undefined') InvestmentsModule.refresh();
        break;
    }
  }

  // --- Sample Data Generator ---
  function generateSampleData() {
    const sampleTxns = [];
    const now = new Date();
    const today = now.getDate();

    // Fixed monthly salary - consistent like a real job
    const MONTHLY_SALARY = 65000;

    for (let m = 0; m < 8; m++) {
      const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const isCurrentMonth = (m === 0);
      // For current month, only generate transactions up to today's date
      const maxDay = isCurrentMonth ? today : 28;

      // Income - Salary (every month, consistent amount on 1st)
      // Salary is ALWAYS the same — it only increases with promotions, never randomly changes
      sampleTxns.push({
        id: generateId(),
        type: 'income',
        amount: MONTHLY_SALARY,
        category: 'Salary',
        date: new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0],
        note: 'Monthly salary'
      });

      // Freelance income (some months, only on dates that have passed)
      if (Math.random() > 0.4) {
        const freelanceDay = 10 + Math.floor(Math.random() * 10);
        if (freelanceDay <= maxDay) {
          sampleTxns.push({
            id: generateId(),
            type: 'income',
            amount: 8000 + Math.floor(Math.random() * 15000),
            category: 'Freelance',
            date: new Date(month.getFullYear(), month.getMonth(), freelanceDay).toISOString().split('T')[0],
            note: 'Freelance project'
          });
        }
      }

      // Rent (5th of each month)
      if (5 <= maxDay) {
        sampleTxns.push({
          id: generateId(),
          type: 'expense',
          amount: 15000,
          category: 'Rent',
          date: new Date(month.getFullYear(), month.getMonth(), 5).toISOString().split('T')[0],
          note: 'Monthly rent'
        });
      }

      // Utilities (8th of each month)
      if (8 <= maxDay) {
        sampleTxns.push({
          id: generateId(),
          type: 'expense',
          amount: 2000 + Math.floor(Math.random() * 2000),
          category: 'Utilities',
          date: new Date(month.getFullYear(), month.getMonth(), 8).toISOString().split('T')[0],
          note: 'Electricity + Internet'
        });
      }

      // Random daily expenses (only up to maxDay)
      const numExpenses = isCurrentMonth ? Math.min(5, maxDay) : (5 + Math.floor(Math.random() * 6));
      for (let i = 0; i < numExpenses; i++) {
        const expCats = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Healthcare', 'Education'];
        const cat = expCats[Math.floor(Math.random() * expCats.length)];
        const amounts = { Food: [200, 2500], Transport: [100, 1500], Entertainment: [300, 3000], Shopping: [500, 5000], Healthcare: [200, 4000], Education: [500, 3000] };
        const [min, max] = amounts[cat];
        const day = 1 + Math.floor(Math.random() * Math.min(27, maxDay));
        sampleTxns.push({
          id: generateId(),
          type: 'expense',
          amount: min + Math.floor(Math.random() * (max - min)),
          category: cat,
          date: new Date(month.getFullYear(), month.getMonth(), day).toISOString().split('T')[0],
          note: ''
        });
      }
    }

    return sampleTxns;
  }

  // --- Initialization ---
  function init() {
    // Navigation event listeners
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        navigate(view);
      });
    });

    // Mobile menu toggle
    document.getElementById('mobileMenuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('mobileMenuToggle');
      if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    // Settings handlers
    document.getElementById('saveBudgetBtn').addEventListener('click', () => {
      const val = parseInt(document.getElementById('settingBudget').value) || 0;
      const settings = getSettings();
      settings.budget = val;
      saveSettings(settings);
      showToast('Budget limit saved!', 'success');
      refreshView('dashboard');
      refreshView('insights');
    });

    document.getElementById('exportCSVBtn').addEventListener('click', exportCSV);

    document.getElementById('loadSampleBtn').addEventListener('click', () => {
      const existing = getTransactions();
      const samples = generateSampleData();
      saveTransactions([...existing, ...samples]);
      const settings = getSettings();
      if (!settings.budget) {
        settings.budget = 50000;
        saveSettings(settings);
        document.getElementById('settingBudget').value = 50000;
      }
      showToast('Sample data loaded!', 'success');
      navigate('dashboard');
    });

    document.getElementById('resetDataBtn').addEventListener('click', () => {
      if (confirm('Are you sure? This will delete ALL transactions and settings.')) {
        localStorage.removeItem(KEYS.transactions);
        localStorage.removeItem(KEYS.settings);
        localStorage.removeItem(KEYS.riskProfile);
        showToast('All data cleared', 'warning');
        navigate('dashboard');
      }
    });

    // Load budget setting value
    const settings = getSettings();
    document.getElementById('settingBudget').value = settings.budget || '';

    // Handle hash navigation
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigate(hash);
  }

  // --- CSV Export ---
  function exportCSV() {
    const txns = getTransactions();
    if (txns.length === 0) {
      showToast('No transactions to export', 'warning');
      return;
    }

    let csv = 'Date,Type,Category,Amount,Note\n';
    txns.forEach(t => {
      csv += `${t.date},${t.type},${t.category},${t.amount},"${(t.note || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wealthwise_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!', 'success');
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);

  // Public API
  return {
    navigate,
    formatCurrency,
    formatDate,
    generateId,
    getMonthKey,
    getMonthLabel,
    getTransactions,
    saveTransactions,
    getSettings,
    saveSettings,
    getRiskProfile,
    saveRiskProfile,
    getCategoryIcon,
    showToast,
    refreshView,
    KEYS
  };
})();
