/* ============================================
   WealthWise — Investments Module v2.0
   Risk Profiling + Financial Health Analysis
   + ML Recommendation Engine
   ============================================ */

const InvestmentsModule = (() => {
  let portfolioChart = null;

  const QUIZ_QUESTIONS = [
    {
      id: 'age',
      question: 'What is your age range?',
      options: [
        { label: '18-25 years', value: 1 },
        { label: '26-35 years', value: 2 },
        { label: '36-50 years', value: 3 },
        { label: '50+ years', value: 4 }
      ]
    },
    {
      id: 'income',
      question: 'What is your monthly income bracket?',
      options: [
        { label: 'Below ₹25,000', value: 1 },
        { label: '₹25,000 - ₹50,000', value: 2 },
        { label: '₹50,000 - ₹1,00,000', value: 3 },
        { label: 'Above ₹1,00,000', value: 4 }
      ]
    },
    {
      id: 'horizon',
      question: 'What is your investment time horizon?',
      options: [
        { label: 'Short term (< 1 year)', value: 1 },
        { label: 'Medium term (1-3 years)', value: 2 },
        { label: 'Long term (3-7 years)', value: 3 },
        { label: 'Very long term (7+ years)', value: 4 }
      ]
    },
    {
      id: 'risk',
      question: 'How would you react if your investment dropped 20% in a month?',
      options: [
        { label: 'Sell immediately to prevent further loss', value: 1 },
        { label: 'Feel anxious but hold', value: 2 },
        { label: 'See it as a buying opportunity', value: 3 },
        { label: 'Buy more aggressively at the dip', value: 4 }
      ]
    },
    {
      id: 'knowledge',
      question: 'How would you rate your investment knowledge?',
      options: [
        { label: 'Beginner — I mostly use savings accounts & FDs', value: 1 },
        { label: 'Intermediate — I know about mutual funds & SIPs', value: 2 },
        { label: 'Advanced — I actively research stocks & sectors', value: 3 },
        { label: 'Expert — I use derivatives, options, or quant strategies', value: 4 }
      ]
    },
    {
      id: 'goal',
      question: 'What is your primary financial goal?',
      options: [
        { label: 'Preserve capital — protect what I have', value: 1 },
        { label: 'Steady growth — beat inflation consistently', value: 2 },
        { label: 'Aggressive growth — maximize returns over time', value: 3 },
        { label: 'Wealth multiplication — 10x+ returns, high-risk is fine', value: 4 }
      ]
    }
  ];

  let currentStep = -1; // -1 = intro
  let answers = {};

  function init() {
    document.getElementById('startQuizBtn').addEventListener('click', () => startQuiz());
    document.getElementById('retakeQuizBtn').addEventListener('click', () => {
      localStorage.removeItem(WealthWise.KEYS.riskProfile);
      resetQuiz();
      refresh();
    });
  }

  function refresh() {
    const riskProfile = WealthWise.getRiskProfile();

    if (riskProfile) {
      // Recalculate financial health with latest transactions
      const txns = WealthWise.getTransactions();
      const fh = ModelRules.analyzeFinancialHealth(txns);
      riskProfile.financialHealth = fh;

      document.getElementById('investmentResults').classList.remove('hidden');
      document.getElementById('riskQuizSection').classList.add('hidden');
      renderResults(riskProfile);
    } else {
      document.getElementById('investmentResults').classList.add('hidden');
      document.getElementById('riskQuizSection').classList.remove('hidden');
      resetQuiz();
    }
  }

  function resetQuiz() {
    currentStep = -1;
    answers = {};
    renderQuizProgress();
    document.getElementById('quizIntro').classList.add('active');
    document.getElementById('quizLoading').classList.remove('active');
    document.getElementById('quizStepsContainer').innerHTML = '';
  }

  function startQuiz() {
    document.getElementById('quizIntro').classList.remove('active');
    currentStep = 0;
    renderQuizProgress();
    renderQuizStep();
  }

  function renderQuizProgress() {
    const container = document.getElementById('quizProgress');
    container.innerHTML = '';
    for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'step-dot';
      if (i < currentStep) dot.classList.add('completed');
      if (i === currentStep) dot.classList.add('current');
      container.appendChild(dot);
    }
  }

  function renderQuizStep() {
    if (currentStep >= QUIZ_QUESTIONS.length) {
      showLoadingAndPredict();
      return;
    }

    const q = QUIZ_QUESTIONS[currentStep];
    const container = document.getElementById('quizStepsContainer');

    container.innerHTML = `
      <div class="quiz-step active">
        <div class="quiz-question">${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <div class="quiz-option" data-value="${opt.value}" data-qid="${q.id}">
              <span class="option-letter">${String.fromCharCode(65 + i)}</span>
              <span>${opt.label}</span>
            </div>
          `).join('')}
        </div>
        <div class="quiz-actions">
          <button class="btn btn-ghost" id="quizBackBtn" ${currentStep === 0 ? 'disabled style="opacity:0.4"' : ''}>← Back</button>
          <button class="btn btn-primary" id="quizNextBtn" disabled>Next →</button>
        </div>
      </div>
    `;

    container.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', () => {
        container.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const qid = opt.getAttribute('data-qid');
        const val = parseInt(opt.getAttribute('data-value'));
        answers[qid] = val;
        document.getElementById('quizNextBtn').disabled = false;
      });

      const qid = opt.getAttribute('data-qid');
      const val = parseInt(opt.getAttribute('data-value'));
      if (answers[qid] === val) {
        opt.classList.add('selected');
        document.getElementById('quizNextBtn').disabled = false;
      }
    });

    document.getElementById('quizBackBtn').addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        renderQuizProgress();
        renderQuizStep();
      }
    });

    document.getElementById('quizNextBtn').addEventListener('click', () => {
      currentStep++;
      renderQuizProgress();
      renderQuizStep();
    });
  }

  function showLoadingAndPredict() {
    document.getElementById('quizStepsContainer').innerHTML = '';
    document.getElementById('quizLoading').classList.add('active');

    setTimeout(() => {
      // Analyze real financial health from transactions
      const txns = WealthWise.getTransactions();
      const financialHealth = ModelRules.analyzeFinancialHealth(txns);

      // Pass both quiz answers AND financial health to the model
      const result = ModelRules.predict(answers, financialHealth);
      WealthWise.saveRiskProfile(result);

      document.getElementById('quizLoading').classList.remove('active');
      document.getElementById('investmentResults').classList.remove('hidden');
      document.getElementById('riskQuizSection').classList.add('hidden');

      renderResults(result);
      WealthWise.showToast(`Risk profile: ${result.profile.label}`, 'success');
    }, 2000);
  }

  function renderResults(result) {
    // Risk badge
    const badge = document.getElementById('riskBadge');
    badge.textContent = result.profile.label;
    badge.className = `risk-badge ${result.profile.riskBadgeClass}`;

    // Explanation
    document.getElementById('allocationExplanation').innerHTML = result.profile.explanation;

    // Confidence
    const confPct = (result.confidence * 100).toFixed(0);
    document.getElementById('modelConfidenceFill').style.width = confPct + '%';
    document.getElementById('modelConfidenceValue').textContent = confPct + '%';

    // Render financial health section
    renderFinancialHealthCard(result.financialHealth);

    // Portfolio pie chart
    renderPortfolioChart(result);

    // Recommendation cards
    renderRecommendationCards(result);
  }

  function renderFinancialHealthCard(fh) {
    const container = document.getElementById('financialHealthSection');
    if (!container) return;

    if (!fh || !fh.hasData) {
      container.innerHTML = `
        <div class="card mb-3">
          <div class="card-title">📋 Financial Health Check</div>
          <div class="alert alert-info">
            ℹ️ No transaction data found. Add transactions to get personalized recommendations based on your actual spending and savings patterns.
            <br><br>
            <button class="btn btn-primary btn-sm" onclick="WealthWise.navigate('transactions')">Add Transactions →</button>
          </div>
        </div>
      `;
      return;
    }

    // Health score color
    const healthColors = {
      critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: '🔴 Critical' },
      poor: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', label: '🟠 Poor' },
      fair: { color: '#facc15', bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.3)', label: '🟡 Fair' },
      good: { color: '#00d4aa', bg: 'rgba(0,212,170,0.1)', border: 'rgba(0,212,170,0.3)', label: '🟢 Good' },
      excellent: { color: '#4f8cff', bg: 'rgba(79,140,255,0.1)', border: 'rgba(79,140,255,0.3)', label: '🔵 Excellent' }
    };

    const hc = healthColors[fh.healthLevel] || healthColors.fair;
    const progressClass = fh.healthScore >= 60 ? 'green' : fh.healthScore >= 40 ? 'orange' : 'red';

    // Warnings & Tips HTML
    const alertsHtml = [
      ...fh.warnings.map(w => `<div class="alert alert-${w.type === 'danger' ? 'danger' : 'warning'}">${w.icon} ${w.text}</div>`),
      ...fh.tips.map(t => `<div class="alert alert-${t.type === 'success' ? 'success' : t.type === 'warning' ? 'warning' : 'info'}">${t.icon} ${t.text}</div>`)
    ].join('');

    container.innerHTML = `
      <div class="card mb-3" style="border-color:${hc.border};">
        <div class="flex-between mb-2">
          <div class="card-title" style="margin-bottom:0;">📋 Financial Health Check</div>
          <span style="font-size:0.85rem;padding:4px 14px;border-radius:var(--radius-full);background:${hc.bg};color:${hc.color};border:1px solid ${hc.border};font-weight:600;">
            ${hc.label} — ${fh.healthScore}/100
          </span>
        </div>

        <div class="progress-container mb-2">
          <div class="progress-bar" style="height:10px;">
            <div class="progress-fill ${progressClass}" style="width:${fh.healthScore}%;transition:width 1.5s ease;"></div>
          </div>
        </div>

        <!-- Key Metrics -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:20px;">
          <div style="text-align:center;padding:12px;background:var(--bg-glass);border-radius:var(--radius-md);">
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Monthly Income</div>
            <div style="font-size:1.1rem;font-weight:700;color:var(--accent-green);">${WealthWise.formatCurrency(fh.monthlyAvgIncome)}</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg-glass);border-radius:var(--radius-md);">
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Monthly Expenses</div>
            <div style="font-size:1.1rem;font-weight:700;color:var(--accent-orange);">${WealthWise.formatCurrency(fh.monthlyAvgExpense)}</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg-glass);border-radius:var(--radius-md);">
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Savings Rate</div>
            <div style="font-size:1.1rem;font-weight:700;color:${fh.savingsRate > 15 ? 'var(--accent-green)' : fh.savingsRate > 0 ? 'var(--accent-yellow)' : 'var(--accent-red)'};">${fh.savingsRate.toFixed(1)}%</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg-glass);border-radius:var(--radius-md);">
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Emergency Fund</div>
            <div style="font-size:1.1rem;font-weight:700;color:${fh.emergencyMonths >= 3 ? 'var(--accent-green)' : 'var(--accent-yellow)'};">${fh.emergencyMonths.toFixed(1)} months</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg-glass);border-radius:var(--radius-md);">
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Investable / Month</div>
            <div style="font-size:1.1rem;font-weight:700;color:${fh.monthlyInvestable > 0 ? 'var(--accent-blue)' : 'var(--accent-red)'};">${WealthWise.formatCurrency(fh.monthlyInvestable || 0)}</div>
          </div>
        </div>

        <!-- Alerts & Tips -->
        ${alertsHtml}

        ${fh.topExpenseCategories.length > 0 ? `
          <div style="margin-top:12px;">
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;font-weight:600;">TOP EXPENSE CATEGORIES</div>
            ${fh.topExpenseCategories.map(c => `
              <div class="progress-container" style="margin-bottom:8px;">
                <div class="progress-label">
                  <span class="label-text">${WealthWise.getCategoryIcon(c.category)} ${c.category}</span>
                  <span class="label-value">${WealthWise.formatCurrency(c.amount)} (${c.pct}%)</span>
                </div>
                <div class="progress-bar" style="height:6px;">
                  <div class="progress-fill orange" style="width:${c.pct}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderPortfolioChart(result) {
    const allocs = result.profile.allocations;
    const labels = Object.values(allocs).map(a => a.label);
    const data = Object.values(allocs).map(a => a.pct);
    const colors = ['#00d4aa', '#4f8cff', '#a855f7', '#f97316'];

    const ctx = document.getElementById('portfolioPieChart').getContext('2d');
    if (portfolioChart) portfolioChart.destroy();

    portfolioChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#0a0e1a',
          hoverBorderColor: '#fff',
          hoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 12 },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.raw}%`
            }
          }
        }
      }
    });
  }

  function renderRecommendationCards(result) {
    const allocs = result.profile.allocations;
    const typeClasses = { fd: 'fd', mf: 'mf', stocks: 'stocks', bonds: 'bonds' };
    const fh = result.financialHealth;

    // If user can't invest, show investable amount context
    const investNote = (fh && fh.hasData && fh.monthlyInvestable > 0)
      ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:8px;">≈ ${WealthWise.formatCurrency(Math.round(fh.monthlyInvestable * alloc_pct / 100))}/month</div>`
      : '';

    const container = document.getElementById('recommendationCards');
    container.innerHTML = Object.entries(allocs).map(([key, alloc]) => {
      const monthlyAmt = (fh && fh.hasData && fh.monthlyInvestable > 0)
        ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--border-subtle);">≈ <strong>${WealthWise.formatCurrency(Math.round((fh.monthlyInvestable || 0) * alloc.pct / 100))}</strong>/month</div>`
        : '';

      return `
        <div class="card invest-card ${typeClasses[key]}">
          <div class="invest-icon">${alloc.icon}</div>
          <div class="invest-type">${alloc.label}</div>
          <div class="invest-alloc">${alloc.pct}%</div>
          <div class="invest-desc">${alloc.desc}</div>
          ${monthlyAmt}
          <div class="confidence-meter">
            <span>Suitability:</span>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width:${Math.min(alloc.pct * 1.5, 100)}%"></div>
            </div>
            <span>${alloc.pct > 30 ? 'High' : alloc.pct > 15 ? 'Medium' : 'Low'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', init);

  return { refresh };
})();
