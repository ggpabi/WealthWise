/* ============================================
   WealthWise — Dashboard Module
   ============================================ */

const DashboardModule = (() => {
  let barChart = null;
  let donutChart = null;

  const CHART_COLORS = [
    '#4f8cff', '#00d4aa', '#a855f7', '#f97316', '#ef4444',
    '#facc15', '#22d3ee', '#ec4899', '#10b981', '#6366f1'
  ];

  function refresh() {
    const txns = WealthWise.getTransactions();
    const settings = WealthWise.getSettings();
    const riskProfile = WealthWise.getRiskProfile();

    // Calculate totals
    const totalIncome = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savings = totalIncome - totalExpense;

    // Update summary cards
    document.getElementById('dashTotalIncome').textContent = WealthWise.formatCurrency(totalIncome);
    document.getElementById('dashTotalExpense').textContent = WealthWise.formatCurrency(totalExpense);
    document.getElementById('dashSavings').textContent = WealthWise.formatCurrency(savings);

    // Savings rate
    if (totalIncome > 0) {
      const rate = ((savings / totalIncome) * 100).toFixed(1);
      document.getElementById('dashSavingsRate').textContent = `Savings rate: ${rate}%`;
      document.getElementById('dashSavingsRate').className = savings >= 0 ? 'trend-up' : 'trend-down';
    }

    // Risk profile
    if (riskProfile) {
      document.getElementById('dashRiskProfile').textContent = riskProfile.profile.label;
      document.getElementById('dashRiskSubtitle').textContent = `Confidence: ${(riskProfile.confidence * 100).toFixed(0)}%`;
    } else {
      document.getElementById('dashRiskProfile').textContent = 'Not Set';
      document.getElementById('dashRiskSubtitle').textContent = 'Complete risk assessment →';
    }

    // Current month trends
    const now = new Date();
    const currentMonthKey = WealthWise.getMonthKey(now.toISOString());
    const lastMonthKey = WealthWise.getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString());

    const currentMonthIncome = txns.filter(t => t.type === 'income' && WealthWise.getMonthKey(t.date) === currentMonthKey).reduce((s, t) => s + t.amount, 0);
    const lastMonthIncome = txns.filter(t => t.type === 'income' && WealthWise.getMonthKey(t.date) === lastMonthKey).reduce((s, t) => s + t.amount, 0);
    const currentMonthExpense = txns.filter(t => t.type === 'expense' && WealthWise.getMonthKey(t.date) === currentMonthKey).reduce((s, t) => s + t.amount, 0);
    const lastMonthExpense = txns.filter(t => t.type === 'expense' && WealthWise.getMonthKey(t.date) === lastMonthKey).reduce((s, t) => s + t.amount, 0);

    if (lastMonthIncome > 0) {
      const incChange = ((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(0);
      document.getElementById('dashIncomeTrend').textContent = `${incChange >= 0 ? '↑' : '↓'} ${Math.abs(incChange)}% vs last month`;
      document.getElementById('dashIncomeTrend').className = incChange >= 0 ? 'trend-up' : 'trend-down';
    }

    if (lastMonthExpense > 0) {
      const expChange = ((currentMonthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(0);
      document.getElementById('dashExpenseTrend').textContent = `${expChange >= 0 ? '↑' : '↓'} ${Math.abs(expChange)}% vs last month`;
      document.getElementById('dashExpenseTrend').className = expChange >= 0 ? 'trend-down' : 'trend-up';
    }

    // Budget alert
    const alertContainer = document.getElementById('budgetAlertDashboard');
    alertContainer.innerHTML = '';
    if (settings.budget > 0) {
      const pct = (currentMonthExpense / settings.budget * 100).toFixed(0);
      if (pct >= 100) {
        alertContainer.innerHTML = `<div class="alert alert-danger">🚨 Budget exceeded! You've spent ${WealthWise.formatCurrency(currentMonthExpense)} of your ${WealthWise.formatCurrency(settings.budget)} budget (${pct}%)</div>`;
      } else if (pct >= 80) {
        alertContainer.innerHTML = `<div class="alert alert-warning">⚠️ Budget alert: ${pct}% used (${WealthWise.formatCurrency(currentMonthExpense)} of ${WealthWise.formatCurrency(settings.budget)})</div>`;
      }
    }

    // Render charts
    renderBarChart(txns);
    renderDonutChart(txns);

    // Render recent transactions
    renderRecentTransactions(txns);
  }

  function renderBarChart(txns) {
    const now = new Date();
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = WealthWise.getMonthKey(d.toISOString());
      months.push(WealthWise.getMonthLabel(key));

      const monthIncome = txns.filter(t => t.type === 'income' && WealthWise.getMonthKey(t.date) === key).reduce((s, t) => s + t.amount, 0);
      const monthExpense = txns.filter(t => t.type === 'expense' && WealthWise.getMonthKey(t.date) === key).reduce((s, t) => s + t.amount, 0);

      incomeData.push(monthIncome);
      expenseData.push(monthExpense);
    }

    const ctx = document.getElementById('dashBarChart').getContext('2d');

    if (barChart) barChart.destroy();

    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            backgroundColor: 'rgba(0, 212, 170, 0.7)',
            borderColor: '#00d4aa',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.4
          },
          {
            label: 'Expenses',
            data: expenseData,
            backgroundColor: 'rgba(249, 115, 22, 0.7)',
            borderColor: '#f97316',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { family: 'Inter' } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${WealthWise.formatCurrency(ctx.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748b', font: { family: 'Inter' } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#64748b',
              font: { family: 'Inter' },
              callback: (v) => WealthWise.formatCurrency(v)
            }
          }
        }
      }
    });
  }

  function renderDonutChart(txns) {
    const expenses = txns.filter(t => t.type === 'expense');
    const categoryMap = {};
    expenses.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const labels = sortedCategories.map(([cat]) => cat);
    const data = sortedCategories.map(([, amt]) => amt);

    const ctx = document.getElementById('dashDonutChart').getContext('2d');

    if (donutChart) donutChart.destroy();

    if (data.length === 0) {
      // Empty state
      donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['No data'],
          datasets: [{ data: [1], backgroundColor: ['rgba(255,255,255,0.05)'], borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
      return;
    }

    donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: CHART_COLORS.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#0a0e1a',
          hoverBorderColor: '#fff',
          hoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 12 },
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.raw / total) * 100).toFixed(1);
                return `${ctx.label}: ${WealthWise.formatCurrency(ctx.raw)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  function renderRecentTransactions(txns) {
    const sorted = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sorted.slice(0, 5);

    const tbody = document.getElementById('dashRecentBody');
    const emptyState = document.getElementById('dashEmptyState');
    const table = document.getElementById('dashRecentTable');

    if (recent.length === 0) {
      table.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    table.classList.remove('hidden');
    emptyState.classList.add('hidden');

    tbody.innerHTML = recent.map(t => `
      <tr>
        <td>${WealthWise.formatDate(t.date)}</td>
        <td>${t.note || t.category}</td>
        <td><span class="category-badge">${WealthWise.getCategoryIcon(t.category)} ${t.category}</span></td>
        <td><span class="badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${t.type}</span></td>
        <td class="${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
          ${t.type === 'income' ? '+' : '-'}${WealthWise.formatCurrency(t.amount)}
        </td>
      </tr>
    `).join('');
  }

  return { refresh };
})();
