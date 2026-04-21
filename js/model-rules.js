/* ============================================
   WealthWise — Model Rules Engine v2.0
   Exported decision rules from ensemble model
   + Financial Health Analysis from Transactions
   ============================================ */

const ModelRules = (() => {
  /**
   * Investment categories with their allocation profiles
   */
  const PROFILES = {
    conservative: {
      label: 'Conservative',
      riskBadgeClass: 'low',
      allocations: {
        fd: { pct: 50, label: 'Fixed Deposits', icon: '🏦', desc: 'Guaranteed returns with capital protection. Ideal for risk-averse investors. Current FD rates: 6.5-7.5% p.a.' },
        mf: { pct: 30, label: 'Mutual Funds (Debt)', icon: '📊', desc: 'Debt mutual funds provide stable returns with moderate liquidity. Consider short-duration and corporate bond funds.' },
        stocks: { pct: 10, label: 'Blue-chip Stocks', icon: '📈', desc: 'Large-cap, dividend-paying stocks for slow but steady wealth creation. Focus on Nifty 50 constituents.' },
        bonds: { pct: 10, label: 'Govt. Bonds / PPF', icon: '🏛️', desc: 'Government bonds and PPF offer sovereign guarantee with tax benefits. PPF rate: ~7.1% p.a.' }
      },
      explanation: 'Based on your profile, a conservative strategy prioritizes <strong>capital preservation</strong>. With lower risk appetite and shorter investment horizons, fixed-income instruments form the core of your portfolio. This approach minimizes downside risk while still providing growth through selective equity exposure.',
      confidence: 0.89
    },
    balanced: {
      label: 'Balanced',
      riskBadgeClass: 'medium',
      allocations: {
        fd: { pct: 25, label: 'Fixed Deposits', icon: '🏦', desc: 'A safety net for liquidity needs. Keep 3-6 months of expenses in FDs or liquid funds.' },
        mf: { pct: 40, label: 'Mutual Funds (Hybrid)', icon: '📊', desc: 'Balanced advantage and hybrid funds automatically adjust equity-debt ratio. Good for moderate risk-takers.' },
        stocks: { pct: 25, label: 'Diversified Stocks', icon: '📈', desc: 'Mix of large and mid-cap stocks across sectors. Consider SIP approach for rupee cost averaging.' },
        bonds: { pct: 10, label: 'Govt. Bonds / NPS', icon: '🏛️', desc: 'NPS Tier-1 provides additional tax benefit under 80CCD(1B). Allocate to a mix of equity and fixed income.' }
      },
      explanation: 'Your balanced profile indicates you can tolerate <strong>moderate market fluctuations</strong> for better returns. A hybrid strategy balances capital growth with stability, using mutual funds as the core holding to capture upside while limiting drawdowns.',
      confidence: 0.85
    },
    growth: {
      label: 'Growth',
      riskBadgeClass: 'high',
      allocations: {
        fd: { pct: 10, label: 'Emergency Fund (FD)', icon: '🏦', desc: 'Minimal FD allocation for emergency corpus only. Keep 3 months expenses as emergency buffer.' },
        mf: { pct: 35, label: 'Equity Mutual Funds', icon: '📊', desc: 'Flexi-cap and mid-cap funds for aggressive growth. SIPs in proven AMC schemes with 5+ year track record.' },
        stocks: { pct: 40, label: 'Growth Stocks', icon: '📈', desc: 'Direct equity in growth sectors: IT, pharma, banking, renewables. Consider both large-cap stability and mid-cap upside.' },
        bonds: { pct: 15, label: 'Corporate Bonds / REITs', icon: '🏛️', desc: 'Higher-yield corporate bonds and REITs for diversified income. REITs provide real estate exposure without large capital outlay.' }
      },
      explanation: 'Your growth profile shows strong <strong>risk tolerance and a longer investment horizon</strong>. Equities form the bulk of your portfolio for maximum capital appreciation. The model recommends staying invested through market cycles to benefit from compounding.',
      confidence: 0.82
    },
    aggressive: {
      label: 'Aggressive',
      riskBadgeClass: 'aggressive',
      allocations: {
        fd: { pct: 5, label: 'Minimal Emergency FD', icon: '🏦', desc: 'Only bare-minimum emergency funds. Maximize investment exposure across growth assets.' },
        mf: { pct: 25, label: 'Small-Cap / Sectoral MFs', icon: '📊', desc: 'Small-cap and thematic/sectoral funds for high-alpha opportunities. Higher volatility but potentially outsized returns over 7+ years.' },
        stocks: { pct: 55, label: 'High-Growth Stocks', icon: '📈', desc: 'Concentrated positions in high-conviction ideas. Mix of growth stocks, momentum plays, and emerging sectors like AI, EV, space tech.' },
        bonds: { pct: 15, label: 'High-Yield / Global', icon: '🏛️', desc: 'International diversification through US/global ETFs. Hedge against INR depreciation and access global growth stories.' }
      },
      explanation: 'Your aggressive profile indicates <strong>high risk tolerance, long time horizon, and strong financial literacy</strong>. The model recommends maximum equity exposure with strategic allocation to emerging themes. This strategy targets wealth multiplication but requires patience during market downturns.',
      confidence: 0.78
    }
  };

  /**
   * Analyze the user's actual financial health from their transactions
   * Returns a health object with scores, warnings, and investable amount
   */
  function analyzeFinancialHealth(transactions) {
    if (!transactions || transactions.length === 0) {
      return {
        hasData: false,
        savingsRate: 0,
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0,
        monthlyAvgIncome: 0,
        monthlyAvgExpense: 0,
        investableAmount: 0,
        healthScore: 0, // 0-100
        healthLevel: 'unknown', // critical, poor, fair, good, excellent
        warnings: [],
        tips: [],
        canInvest: false,
        expenseToIncomeRatio: 0,
        topExpenseCategories: [],
        emergencyMonths: 0
      };
    }

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    // Split into recent (last 3 months) for relevance
    const recentTxns = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);
    const txnsToAnalyze = recentTxns.length >= 5 ? recentTxns : transactions;

    // Calculate totals
    const incomes = txnsToAnalyze.filter(t => t.type === 'income');
    const expenses = txnsToAnalyze.filter(t => t.type === 'expense');

    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const netSavings = totalIncome - totalExpense;

    // Calculate months span
    const dates = txnsToAnalyze.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const monthsSpan = Math.max(1, Math.round((maxDate - minDate) / (30 * 24 * 60 * 60 * 1000)) + 1);

    const monthlyAvgIncome = totalIncome / monthsSpan;
    const monthlyAvgExpense = totalExpense / monthsSpan;
    const monthlySavings = monthlyAvgIncome - monthlyAvgExpense;

    // Savings rate
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : -100;

    // Expense to income ratio
    const expenseToIncomeRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 999;

    // Top expense categories
    const catMap = {};
    expenses.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topExpenseCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => ({ category: cat, amount: amt, pct: totalExpense > 0 ? (amt / totalExpense * 100).toFixed(1) : 0 }));

    // Emergency fund months (how many months of expenses could savings cover)
    const emergencyMonths = monthlyAvgExpense > 0 ? Math.max(0, netSavings / monthlyAvgExpense) : 0;

    // Investable amount (recommend investing only what's safely surplus)
    // Rule: Keep 3 months expenses as emergency → invest the rest of savings
    const emergencyFundNeeded = monthlyAvgExpense * 3;
    const investableAmount = Math.max(0, netSavings - emergencyFundNeeded);
    const monthlyInvestable = Math.max(0, monthlySavings * 0.5); // Recommend investing 50% of monthly surplus

    // --- Financial Health Score (0-100) ---
    let healthScore = 50; // Start at neutral
    const warnings = [];
    const tips = [];

    // Factor 1: Savings rate (-30 to +20)
    if (savingsRate < 0) {
      healthScore -= 30;
      warnings.push({ type: 'danger', icon: '🚨', text: `You're spending more than you earn! Your expenses exceed income by ${WealthWise.formatCurrency(Math.abs(netSavings))}. Focus on reducing expenses before investing.` });
    } else if (savingsRate < 10) {
      healthScore -= 15;
      warnings.push({ type: 'warning', icon: '⚠️', text: `Your savings rate is very low at ${savingsRate.toFixed(1)}%. Aim for at least 20% savings before allocating to investments.` });
    } else if (savingsRate < 20) {
      healthScore += 5;
      tips.push({ type: 'info', icon: '💡', text: `Your savings rate is ${savingsRate.toFixed(1)}%. This is okay but try to increase it to 30%+ for comfortable investing.` });
    } else if (savingsRate < 40) {
      healthScore += 15;
    } else {
      healthScore += 20;
    }

    // Factor 2: Expense-to-income ratio (-20 to +10)
    if (expenseToIncomeRatio > 1) {
      healthScore -= 20;
    } else if (expenseToIncomeRatio > 0.8) {
      healthScore -= 10;
      warnings.push({ type: 'warning', icon: '📊', text: `${(expenseToIncomeRatio * 100).toFixed(0)}% of your income goes to expenses. Try to bring this below 70% to free up funds for investing.` });
    } else if (expenseToIncomeRatio > 0.6) {
      healthScore += 5;
    } else {
      healthScore += 10;
    }

    // Factor 3: Emergency fund (-10 to +10)
    if (emergencyMonths < 1) {
      healthScore -= 10;
      warnings.push({ type: 'warning', icon: '🛡️', text: `You don't have enough savings to cover even 1 month of expenses. Build a 3-month emergency fund before investing.` });
    } else if (emergencyMonths < 3) {
      healthScore += 0;
      tips.push({ type: 'info', icon: '🏦', text: `Your savings cover ${emergencyMonths.toFixed(1)} months of expenses. Build this to 3-6 months before aggressive investing.` });
    } else if (emergencyMonths < 6) {
      healthScore += 5;
    } else {
      healthScore += 10;
    }

    // Factor 4: Spending concentration
    if (topExpenseCategories.length > 0 && topExpenseCategories[0].pct > 50) {
      tips.push({ type: 'info', icon: '📋', text: `${topExpenseCategories[0].category} makes up ${topExpenseCategories[0].pct}% of your expenses. Explore ways to reduce this to increase investable surplus.` });
    }

    // Factor 5: Income consistency (+10)
    if (incomes.length >= 3) {
      healthScore += 10;
    }

    // Clamp
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Health level
    let healthLevel;
    if (healthScore < 20) healthLevel = 'critical';
    else if (healthScore < 40) healthLevel = 'poor';
    else if (healthScore < 60) healthLevel = 'fair';
    else if (healthScore < 80) healthLevel = 'good';
    else healthLevel = 'excellent';

    // Can invest?
    const canInvest = savingsRate > 5 && netSavings > 0;

    // Add positive tips
    if (canInvest && investableAmount > 0) {
      tips.push({ type: 'success', icon: '✅', text: `You have approximately ${WealthWise.formatCurrency(monthlyInvestable)}/month available for investments after essential expenses and emergency reserves.` });
    }

    if (!canInvest && totalIncome > 0) {
      tips.push({ type: 'warning', icon: '💰', text: 'Focus on building savings first. Start with a recurring deposit or liquid fund with even ₹500/month to build the habit.' });
    }

    return {
      hasData: true,
      savingsRate: savingsRate,
      totalIncome,
      totalExpense,
      netSavings,
      monthlyAvgIncome,
      monthlyAvgExpense,
      investableAmount,
      monthlyInvestable,
      healthScore,
      healthLevel,
      warnings,
      tips,
      canInvest,
      expenseToIncomeRatio,
      topExpenseCategories,
      emergencyMonths,
      monthsSpan
    };
  }

  /**
   * Ensemble model prediction — now enhanced with financial health data
   */
  function predict(answers, financialHealth) {
    // Feature extraction from quiz answers
    const ageScore = answers.age || 2;
    const incomeScore = answers.income || 2;
    const horizonScore = answers.horizon || 2;
    const riskScore = answers.risk || 2;
    const knowledgeScore = answers.knowledge || 2;
    const goalScore = answers.goal || 2;

    // Base ensemble scoring (RF, XGBoost, SVM weights)
    const rfScore = (riskScore * 0.28) + (horizonScore * 0.22) + (knowledgeScore * 0.18) +
                    (incomeScore * 0.14) + (goalScore * 0.12) + ((5 - ageScore) * 0.06);
    const xgbScore = (riskScore * 0.31) + (horizonScore * 0.20) + (goalScore * 0.17) +
                     (incomeScore * 0.15) + (knowledgeScore * 0.12) + ((5 - ageScore) * 0.05);
    const svmScore = (riskScore * 0.30) + (knowledgeScore * 0.20) + (horizonScore * 0.20) +
                     (incomeScore * 0.12) + (goalScore * 0.10) + ((5 - ageScore) * 0.08);

    let ensembleScore = (rfScore + xgbScore + svmScore) / 3;

    // --- NEW: Financial Health Modifier ---
    // If we have real transaction data, adjust the recommendation
    let healthModifier = 0;
    let adjustmentReason = '';

    if (financialHealth && financialHealth.hasData) {
      const sr = financialHealth.savingsRate;
      const eir = financialHealth.expenseToIncomeRatio;
      const em = financialHealth.emergencyMonths;

      // If spending > income → strong downgrade
      if (sr < 0) {
        healthModifier = -1.5;
        adjustmentReason = 'Your expenses exceed your income. Profile downgraded to prioritize savings.';
      }
      // Very low savings rate → moderate downgrade
      else if (sr < 10) {
        healthModifier = -0.8;
        adjustmentReason = 'Low savings rate detected. Profile adjusted toward safer investments.';
      }
      // Low savings + no emergency fund → mild downgrade
      else if (sr < 20 && em < 2) {
        healthModifier = -0.5;
        adjustmentReason = 'Moderate savings but insufficient emergency fund. Profile slightly adjusted.';
      }
      // High expense ratio → small downgrade
      else if (eir > 0.8) {
        healthModifier = -0.3;
        adjustmentReason = 'High expense ratio. Consider reducing discretionary spending to invest more.';
      }
      // Healthy finances → small upgrade possible
      else if (sr > 35 && em > 6) {
        healthModifier = 0.2;
        adjustmentReason = 'Excellent financial health! You can afford slightly more aggressive investments.';
      }
    }

    ensembleScore += healthModifier;

    // Classify
    let category;
    if (ensembleScore < 1.8) category = 'conservative';
    else if (ensembleScore < 2.5) category = 'balanced';
    else if (ensembleScore < 3.2) category = 'growth';
    else category = 'aggressive';

    // Confidence adjustment
    const scores = [rfScore, xgbScore, svmScore];
    const maxDiff = Math.max(...scores) - Math.min(...scores);
    let confidence = PROFILES[category].confidence;
    if (maxDiff < 0.3) confidence = Math.min(confidence + 0.05, 0.95);
    if (maxDiff > 0.8) confidence = Math.max(confidence - 0.08, 0.65);

    // If financial data contradicts quiz → lower confidence slightly
    if (Math.abs(healthModifier) > 0.5) {
      confidence = Math.max(confidence - 0.05, 0.60);
    }

    // Deep clone profile to avoid mutating original
    const profile = JSON.parse(JSON.stringify(PROFILES[category]));

    // If user can't invest → modify the explanation
    if (financialHealth && financialHealth.hasData && !financialHealth.canInvest) {
      profile.explanation = '<strong style="color:#ef4444;">⚠️ Investment readiness: Not yet ready.</strong><br><br>' +
        'Based on your transaction history, your current savings are insufficient for investing. ' +
        'The allocations below show the <em>target portfolio</em> once you build adequate savings.<br><br>' +
        '<strong>Recommended first steps:</strong><br>' +
        '1. Reduce non-essential expenses by 15-20%<br>' +
        '2. Build an emergency fund (3 months of expenses)<br>' +
        '3. Start a small SIP of ₹500-1000/month to build the habit<br>' +
        '4. Come back when your savings rate exceeds 15%';
    } else if (adjustmentReason) {
      profile.explanation += `<br><br><em style="color:var(--accent-yellow);">📊 Adjustment: ${adjustmentReason}</em>`;
    }

    return {
      category,
      profile,
      scores: {
        randomForest: rfScore.toFixed(2),
        xgboost: xgbScore.toFixed(2),
        svm: svmScore.toFixed(2),
        ensemble: ensembleScore.toFixed(2)
      },
      confidence,
      healthModifier,
      adjustmentReason,
      financialHealth
    };
  }

  return {
    predict,
    analyzeFinancialHealth,
    PROFILES
  };
})();
