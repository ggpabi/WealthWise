/* ============================================
   WealthWise — Insights Module
   ============================================ */

const InsightsModule = (() => {
  let trendChart = null;
  let categoryChart = null;

  const CHART_COLORS = [
    '#4f8cff', '#00d4aa', '#a855f7', '#f97316', '#ef4444',
    '#facc15', '#22d3ee', '#ec4899', '#10b981', '#6366f1'
  ];

  function refresh() {
    const txns = WealthWise.getTransactions();
    const settings = WealthWise.getSettings();

    // Current month data
    const now = new Date();
    const currentMonthKey = WealthWise.getMonthKey(now.toISOString());

    const monthIncome = txns.filter(t => t.type === 'income' && WealthWise.getMonthKey(t.date) === currentMonthKey).reduce((s, t) => s + t.amount, 0);
    const monthExpense = txns.filter(t => t.type === 'expense' && WealthWise.getMonthKey(t.date) === currentMonthKey).reduce((s, t) => s + t.amount, 0);
    const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome * 100).toFixed(1) : 0;

    document.getElementById('insightMonthIncome').textContent = WealthWise.formatCurrency(monthIncome);
    document.getElementById('insightMonthExpense').textContent = WealthWise.formatCurrency(monthExpense);
    document.getElementById('insightSavingsRate').textContent = `${savingsRate}%`;

    // Budget progress
    const budgetCard = document.getElementById('budgetProgressCard');
    if (settings.budget > 0) {
      budgetCard.classList.remove('hidden');
      const pct = Math.min((monthExpense / settings.budget * 100), 100);
      document.getElementById('budgetSpentLabel').textContent = `${WealthWise.formatCurrency(monthExpense)} spent`;
      document.getElementById('budgetLimitLabel').textContent = `Budget: ${WealthWise.formatCurrency(settings.budget)}`;

      const fill = document.getElementById('budgetProgressFill');
      fill.style.width = pct + '%';
      fill.className = 'progress-fill';
      if (pct >= 100) fill.classList.add('red');
      else if (pct >= 80) fill.classList.add('orange');
      else if (pct >= 50) fill.classList.add('blue');
      else fill.classList.add('green');
    } else {
      budgetCard.classList.remove('hidden');
      document.getElementById('budgetSpentLabel').textContent = 'No budget set';
      document.getElementById('budgetLimitLabel').textContent = 'Go to Settings →';
      document.getElementById('budgetProgressFill').style.width = '0%';
    }

    // Budget alert
    const alertContainer = document.getElementById('budgetAlertInsights');
    alertContainer.innerHTML = '';
    if (settings.budget > 0) {
      const pctUsed = (monthExpense / settings.budget * 100).toFixed(0);
      if (pctUsed >= 100) {
        alertContainer.innerHTML = `<div class="alert alert-danger">🚨 Budget exceeded! You've spent ${WealthWise.formatCurrency(monthExpense)} which is ${pctUsed}% of your ${WealthWise.formatCurrency(settings.budget)} monthly budget.</div>`;
      } else if (pctUsed >= 80) {
        alertContainer.innerHTML = `<div class="alert alert-warning">⚠️ Careful! You've used ${pctUsed}% of your monthly budget (${WealthWise.formatCurrency(monthExpense)} of ${WealthWise.formatCurrency(settings.budget)}).</div>`;
      } else if (pctUsed < 50 && monthExpense > 0) {
        alertContainer.innerHTML = `<div class="alert alert-success">✅ Great! You're well within budget — only ${pctUsed}% used this month.</div>`;
      }
    }

    // Render charts
    renderTrendChart(txns);
    renderCategoryChart(txns);
    renderTopCategories(txns);
  }

  function renderTrendChart(txns) {
    const now = new Date();
    const months = [];
    const incomeData = [];
    const expenseData = [];
    const savingsData = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = WealthWise.getMonthKey(d.toISOString());
      months.push(WealthWise.getMonthLabel(key));

      const mIncome = txns.filter(t => t.type === 'income' && WealthWise.getMonthKey(t.date) === key).reduce((s, t) => s + t.amount, 0);
      const mExpense = txns.filter(t => t.type === 'expense' && WealthWise.getMonthKey(t.date) === key).reduce((s, t) => s + t.amount, 0);

      incomeData.push(mIncome);
      expenseData.push(mExpense);
      savingsData.push(mIncome - mExpense);
    }

    const ctx = document.getElementById('insightTrendChart').getContext('2d');
    if (trendChart) trendChart.destroy();

    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: '#00d4aa',
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
          },
          {
            label: 'Savings',
            data: savingsData,
            borderColor: '#4f8cff',
            backgroundColor: 'rgba(79, 140, 255, 0.05)',
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
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
            ticks: { color: '#64748b', font: { family: 'Inter', size: 11 }, maxRotation: 45 }
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

  function renderCategoryChart(txns) {
    const expenses = txns.filter(t => t.type === 'expense');
    const categoryMap = {};
    expenses.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, amt]) => amt);

    const ctx = document.getElementById('insightCategoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    if (data.length === 0) {
      categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['No expenses yet'],
          datasets: [{ data: [1], backgroundColor: ['rgba(255,255,255,0.05)'], borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
      return;
    }

    categoryChart = new Chart(ctx, {
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
        cutout: '60%',
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

  function renderTopCategories(txns) {
    const expenses = txns.filter(t => t.type === 'expense');
    const categoryMap = {};
    expenses.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total = expenses.reduce((s, t) => s + t.amount, 0);

    const container = document.getElementById('topCategoriesContainer');

    if (sorted.length === 0) {
      container.innerHTML = '<div class="empty-state"><p class="text-muted">No expense data available</p></div>';
      return;
    }

    const colorClasses = ['blue', 'green', 'purple', 'orange', 'red', 'blue'];

    container.innerHTML = sorted.map(([cat, amt], i) => {
      const pct = total > 0 ? (amt / total * 100).toFixed(1) : 0;
      return `
        <div class="progress-container">
          <div class="progress-label">
            <span class="label-text">${WealthWise.getCategoryIcon(cat)} ${cat}</span>
            <span class="label-value">${WealthWise.formatCurrency(amt)} (${pct}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${colorClasses[i % colorClasses.length]}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  return { refresh };
})();
