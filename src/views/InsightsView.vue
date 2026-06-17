<template>
  <div class="insights-page">

    <div v-if="noData" class="empty-insights">
      <div class="empty-icon">📊</div>
      <h2>{{ isRo ? 'Nicio tranzactie inca' : 'No transactions yet' }}</h2>
      <p>{{ isRo ? 'Adauga tranzactii pentru a vedea statistici.' : 'Add transactions to see statistics.' }}</p>
    </div>

    <template v-else>

      <!-- GRUP 1: Distributia categoriilor cu toggle -->
      <section class="insights-card">
        <div class="card-header">
          <div class="header-row">
            <div>
              <h3>🍕 {{ pieTitle }}</h3>
              <p class="card-subtitle">{{ pieSubtitle }}</p>
            </div>
            <div class="pie-mode-tabs">
              <button :class="['mode-btn', { active: pieMode === 'expense' }]" @click="pieMode = 'expense'">
                {{ isRo ? 'Cheltuieli' : 'Expenses' }}
              </button>
              <button :class="['mode-btn', { active: pieMode === 'income' }]" @click="pieMode = 'income'">
                {{ isRo ? 'Venituri' : 'Income' }}
              </button>
              <button :class="['mode-btn', { active: pieMode === 'all' }]" @click="pieMode = 'all'">
                {{ isRo ? 'Ambele' : 'All' }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="currentPieCategories.length === 0" class="no-data-msg">
          {{ pieEmptyMsg }}
        </div>
        <div v-else class="category-content">
          <div class="pie-container">
            <Pie :data="categoryChartData" :options="pieOptions" />
          </div>
          <div class="category-list">
            <div v-for="(cat, i) in currentPieCategories" :key="cat.name" class="cat-row">
              <span class="cat-dot" :style="{ background: currentPieColors[i] }"></span>
              <span class="cat-name">{{ cat.label }}</span>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" :style="{ width: cat.percent + '%', background: currentPieColors[i] }"></div>
              </div>
              <span class="cat-pct">{{ cat.percent }}%</span>
              <span class="cat-amt">{{ fmtAmt(cat.amount) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- GRUP 2: Evolutia lunara venituri vs cheltuieli -->
      <section class="insights-card">
        <div class="card-header">
          <h3>📈 {{ isRo ? 'Evolutie Lunara' : 'Monthly Trend' }}</h3>
          <p class="card-subtitle">{{ isRo ? 'Venituri vs Cheltuieli — ultimele 6 luni' : 'Income vs Expenses — last 6 months' }}</p>
        </div>
        <div class="bar-container">
          <Bar :data="monthlyChartData" :options="barOptions" />
        </div>
      </section>

      <!-- GRUP 3: KPI-uri Sanatate Financiara -->
      <section class="insights-card">
        <div class="card-header">
          <h3>💡 {{ isRo ? 'Sanatate Financiara' : 'Financial Health' }}</h3>
          <p class="card-subtitle">{{ isRo ? 'Statistici bazate pe ultimele 6 luni' : 'Stats based on last 6 months' }}</p>
        </div>
        <div class="kpi-grid">
          <div class="kpi-item" :class="savingsRateClass">
            <div class="kpi-emoji">{{ savingsRateEmoji }}</div>
            <div class="kpi-val">{{ savingsRate }}%</div>
            <div class="kpi-lbl">{{ isRo ? 'Rata de economii' : 'Savings Rate' }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-emoji">💰</div>
            <div class="kpi-val">{{ fmtAmt(avgIncome) }}</div>
            <div class="kpi-lbl">{{ isRo ? 'Venit mediu / luna' : 'Avg income / month' }}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-emoji">💸</div>
            <div class="kpi-val">{{ fmtAmt(avgExpense) }}</div>
            <div class="kpi-lbl">{{ isRo ? 'Cheltuieli medii / luna' : 'Avg expenses / month' }}</div>
          </div>
          <div class="kpi-item kpi-best">
            <div class="kpi-emoji">🏆</div>
            <div class="kpi-val">{{ bestMonth.label }}</div>
            <div class="kpi-lbl">{{ isRo ? 'Cea mai buna luna' : 'Best savings month' }}</div>
          </div>
        </div>
      </section>

      <!-- GRUP 4: Analiza lunii selectate -->
      <section class="insights-card">
        <div class="card-header">
          <h3>🔍 {{ isRo ? 'Analiza Lunii Selectate' : 'Selected Month Analysis' }}</h3>
          <p class="card-subtitle">{{ selectedMonthLabel }}</p>
        </div>

        <div v-if="selectedMonthExpenses.length === 0" class="no-data-msg">
          {{ isRo ? 'Nicio cheltuiala inregistrata in aceasta luna.' : 'No expenses recorded this month.' }}
        </div>

        <div v-else class="insights-grid">

          <!-- A: Comparatie luna -->
          <div class="ig-card ig-wide">
            <div class="ig-icon">📊</div>
            <div class="ig-label">{{ isRo ? 'Fata de luna anterioara' : 'vs Previous Month' }}</div>
            <div class="ig-main-val">{{ fmtAmt(monthComparison.current) }}</div>
            <div class="ig-sub">
              <span class="ig-prev">{{ isRo ? 'Luna ant:' : 'Prev:' }} {{ fmtAmt(monthComparison.prev) }}</span>
              <span v-if="monthComparison.change !== null"
                    :class="['ig-badge', monthComparison.change > 0 ? 'badge-red' : 'badge-green']">
                {{ monthComparison.change > 0 ? '▲' : '▼' }} {{ Math.abs(monthComparison.change) }}%
              </span>
              <span v-else class="ig-badge badge-neutral">{{ isRo ? 'Fara date anterioare' : 'No prior data' }}</span>
            </div>
          </div>

          <!-- B: Ziua saptamanii -->
          <div class="ig-card">
            <div class="ig-icon">📅</div>
            <div class="ig-label">{{ isRo ? 'Ziua cu cele mai mari cheltuieli' : 'Most expensive day' }}</div>
            <div v-if="mostExpensiveDayOfWeek" class="ig-main-val">{{ mostExpensiveDayOfWeek.day }}</div>
            <div v-if="mostExpensiveDayOfWeek" class="ig-sub">
              <span class="ig-prev">{{ fmtAmt(mostExpensiveDayOfWeek.amount) }}</span>
            </div>
            <div v-else class="ig-empty-sub">{{ isRo ? 'Insuficiente date' : 'Not enough data' }}</div>
          </div>

          <!-- C: Streak -->
          <div class="ig-card">
            <div class="ig-icon">🔥</div>
            <div class="ig-label">{{ isRo ? 'Zile consecutive fara cheltuieli' : 'Expense-free streak' }}</div>
            <div class="ig-main-val">{{ longestExpenseStreak }}</div>
            <div class="ig-sub">
              <span class="ig-prev">{{ isRo ? 'zile' : 'days' }}</span>
            </div>
          </div>

          <!-- D: Cea mai mare cheltuiala -->
          <div class="ig-card ig-wide">
            <div class="ig-icon">💸</div>
            <div class="ig-label">{{ isRo ? 'Cea mai mare cheltuiala' : 'Biggest expense' }}</div>
            <div class="ig-main-val">{{ fmtAmt(biggestExpense?.amount || 0) }}</div>
            <div class="ig-sub">
              <span class="ig-prev">{{ biggestExpense?.name }}</span>
              <span class="ig-prev">·</span>
              <span class="ig-prev">{{ biggestExpense ? new Date(biggestExpense.date).toLocaleDateString(isRo ? 'ro-RO' : 'en-US') : '' }}</span>
            </div>
            <div class="ig-tag">{{ biggestExpense ? (t.catMap?.[biggestExpense.category] || biggestExpense.category) : '' }}</div>
          </div>

          <!-- E: Top 3 categorii -->
          <div class="ig-card ig-wide">
            <div class="ig-icon">🏷️</div>
            <div class="ig-label">{{ isRo ? 'Top 3 categorii luna aceasta' : 'Top 3 categories this month' }}</div>
            <div v-if="topCategoriesSelectedMonth.length === 0" class="ig-empty-sub">
              {{ isRo ? 'Nicio cheltuiala' : 'No expenses' }}
            </div>
            <div v-else class="ig-cat-list">
              <div v-for="(cat, i) in topCategoriesSelectedMonth" :key="cat.name" class="ig-cat-row">
                <span class="ig-cat-dot" :style="{ background: EXPENSE_COLORS[i] }"></span>
                <span class="ig-cat-name">{{ cat.label }}</span>
                <span class="ig-cat-pct">{{ cat.percent }}%</span>
                <span class="ig-cat-amt">{{ fmtAmt(cat.amount) }}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- GRUP 4.5: Anomalii detectate -->
      <section class="insights-card">
        <div class="card-header">
          <h3>🔺 {{ isRo ? 'Anomalii Detectate' : 'Detected Anomalies' }}</h3>
          <p class="card-subtitle">{{ selectedMonthLabel }}</p>
        </div>

        <div v-if="selectedMonthExpenses.length === 0" class="no-data-msg">
          {{ isRo ? 'Nicio cheltuiala in aceasta luna.' : 'No expenses this month.' }}
        </div>

        <div v-else-if="anomalies.length === 0" class="anomaly-clean">
          <div class="anomaly-clean-icon">✅</div>
          <p>{{ isRo
            ? 'Nu am detectat anomalii in aceasta perioada. Cheltuielile tale sunt consistente!'
            : 'No anomalies detected. Your spending is consistent!' }}</p>
        </div>

        <div v-else class="anomaly-list">
          <div v-for="(a, i) in anomalies" :key="i" class="anomaly-card">
            <div class="anomaly-icon">⚠️</div>
            <div class="anomaly-body">
              <div class="anomaly-top">
                <span class="anomaly-name">{{ a.name }}</span>
                <span class="anomaly-badge">{{ isRo ? 'Anomalie' : 'Anomaly' }}</span>
              </div>
              <div class="anomaly-amounts">
                <span class="anomaly-amt">{{ fmtAmt(a.amount) }}</span>
                <span class="anomaly-vs">vs {{ isRo ? 'medie' : 'avg' }} {{ fmtAmt(a.avg) }}</span>
              </div>
              <p class="anomaly-msg">
                <template v-if="a.type === 'transaction'">
                  {{ isRo
                    ? `Aceasta cheltuiala e de ${a.ratio}x mai mare decat media ta pe ${a.catLabel}`
                    : `This expense is ${a.ratio}x higher than your average for ${a.catLabel}` }}
                </template>
                <template v-else>
                  {{ isRo
                    ? `Totalul ${a.catLabel} din aceasta luna e de ${a.ratio}x fata de media lunara`
                    : `Total ${a.catLabel} this month is ${a.ratio}x the monthly average` }}
                </template>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- GRUP 5: Analiza AI -->
      <section class="insights-card ai-card">
        <div class="card-header">
          <div class="header-row">
            <div>
              <h3>🤖 {{ isRo ? 'Analiza AI Personalizata' : 'AI Personal Analysis' }}</h3>
              <p class="card-subtitle">Powered by Google Gemini</p>
            </div>
            <div class="ai-btn-wrap">
              <button
                class="ai-btn"
                :disabled="aiLoading || aiCooldown > 0 || allTransactions.length < 5"
                @click="analyzeWithAI"
              >
                {{ aiLoading
                  ? (isRo ? 'Se analizeaza...' : 'Analyzing...')
                  : aiResult
                    ? (isRo ? '🔄 Regenereaza analiza' : '🔄 Regenerate analysis')
                    : (isRo ? '✨ Analizeaza cu AI' : '✨ AI Analysis') }}
              </button>
              <p v-if="aiCooldown > 0" class="ai-cooldown-msg">
                {{ isRo ? `Poti regenera analiza in ${aiCooldown} secunde` : `You can regenerate in ${aiCooldown} seconds` }}
              </p>
            </div>
          </div>
        </div>

        <!-- Date insuficiente -->
        <div v-if="allTransactions.length < 5" class="ai-state ai-insufficient">
          <div class="ai-state-icon">📊</div>
          <p>{{ isRo
            ? 'Adauga mai multe tranzactii pentru o analiza AI relevanta (minim 5).'
            : 'Add more transactions for a relevant AI analysis (minimum 5).' }}</p>
        </div>

        <!-- Stare initiala -->
        <div v-else-if="!aiResult && !aiLoading && !aiError" class="ai-state ai-idle">
          <div class="ai-state-icon">🤖</div>
          <p>{{ isRo
            ? 'Apasa butonul pentru a primi o analiza financiara personalizata bazata pe datele tale reale.'
            : 'Press the button to get a personalized financial analysis based on your real data.' }}</p>
        </div>

        <!-- Loading -->
        <div v-else-if="aiLoading" class="ai-state ai-loading">
          <div class="ai-spinner"></div>
          <p>{{ isRo ? 'Se analizeaza datele tale...' : 'Analyzing your data...' }}</p>
        </div>

        <!-- Eroare -->
        <div v-else-if="aiError" class="ai-state ai-error">
          <div class="ai-state-icon">⚠️</div>
          <p>{{ aiError }}</p>
          <button class="ai-retry-btn" :disabled="aiCooldown > 0" @click="analyzeWithAI">
            {{ aiCooldown > 0
              ? (isRo ? `Asteapta ${aiCooldown}s...` : `Wait ${aiCooldown}s...`)
              : (isRo ? 'Incearca din nou' : 'Try again') }}
          </button>
        </div>

        <!-- Rezultat -->
        <div v-else class="ai-result">
          <div class="ai-timestamp">
            {{ isRo ? 'Analiza generata la' : 'Analysis generated at' }} {{ aiTimestamp }}
          </div>
          <div class="ai-text">
            <template v-for="(item, i) in aiFormattedLines" :key="i">
              <h4 v-if="item.isHeader" class="ai-section-head" v-html="item.html"></h4>
              <p v-else class="ai-para" v-html="item.html"></p>
            </template>
          </div>
        </div>
      </section>

    </template>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const t = inject('t')
const allTransactions = inject('transactions')
const activeCurrency  = inject('activeCurrency')
const globalRates     = inject('globalRates')
const referenceDate   = inject('referenceDate')
const budgets         = inject('budgets')

const isRo = computed(() => t.value.locale === 'ro-RO')

const EXPENSE_COLORS = ['#e74c3c','#e67e22','#f39c12','#e91e63','#c0392b','#d35400','#f1c40f','#ff6b6b']
const INCOME_COLORS  = ['#2ecc71','#3498db','#1abc9c','#27ae60','#2980b9','#16a085','#8e44ad','#00cec9']

const pieMode = ref('expense')

const toAct = (amount) => {
  if (activeCurrency.value === 'EUR' && globalRates.value?.EUR) return amount / globalRates.value.EUR
  if (activeCurrency.value === 'USD' && globalRates.value?.USD) return amount / globalRates.value.USD
  return amount
}

const currSymbol = computed(() => {
  if (activeCurrency.value === 'EUR') return '€'
  if (activeCurrency.value === 'USD') return '$'
  return 'RON'
})

const fmtAmt = (val) => {
  const abs = Math.abs(val)
  if (abs >= 1000) return `${(abs / 1000).toFixed(1)}k ${currSymbol.value}`
  return `${Math.round(abs)} ${currSymbol.value}`
}

const noData = computed(() => !allTransactions.value || allTransactions.value.length === 0)

// --- GRUP 1: Categorii ---
const last12Expenses = computed(() => {
  const anchor = new Date(referenceDate.value)
  const cutoff = new Date(anchor.getFullYear(), anchor.getMonth() - 11, 1)
  return allTransactions.value.filter(tx => new Date(tx.date) >= cutoff && tx.amount < 0)
})

const last12Incomes = computed(() => {
  const anchor = new Date(referenceDate.value)
  const cutoff = new Date(anchor.getFullYear(), anchor.getMonth() - 11, 1)
  return allTransactions.value.filter(tx => new Date(tx.date) >= cutoff && tx.amount > 0)
})

const buildCategories = (txList) => {
  const map = {}
  txList.forEach(tx => {
    const cat = tx.category || 'Altele'
    if (!map[cat]) map[cat] = 0
    map[cat] += Math.abs(toAct(tx.amount))
  })
  const total = Object.values(map).reduce((s, v) => s + v, 0)
  if (total === 0) return []
  return Object.entries(map)
    .map(([name, amount]) => ({
      name,
      label: t.value.catMap?.[name] || name,
      amount,
      percent: Math.round((amount / total) * 100)
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 7)
}

const topExpenseCategories = computed(() => buildCategories(last12Expenses.value))
const topIncomeCategories  = computed(() => buildCategories(last12Incomes.value))

const currentPieCategories = computed(() => {
  if (pieMode.value === 'expense') return topExpenseCategories.value
  if (pieMode.value === 'income')  return topIncomeCategories.value
  // 'all': combine both, recalc percent from combined total
  const combined = [
    ...topExpenseCategories.value.map(c => ({ ...c, _type: 'expense' })),
    ...topIncomeCategories.value.map(c => ({ ...c, _type: 'income' }))
  ]
  const total = combined.reduce((s, c) => s + c.amount, 0)
  if (total === 0) return []
  return combined.map(c => ({ ...c, percent: Math.round((c.amount / total) * 100) }))
})

const currentPieColors = computed(() => {
  if (pieMode.value === 'expense') return topExpenseCategories.value.map((_, i) => EXPENSE_COLORS[i % EXPENSE_COLORS.length])
  if (pieMode.value === 'income')  return topIncomeCategories.value.map((_, i) => INCOME_COLORS[i % INCOME_COLORS.length])
  return [
    ...topExpenseCategories.value.map((_, i) => EXPENSE_COLORS[i % EXPENSE_COLORS.length]),
    ...topIncomeCategories.value.map((_, i) => INCOME_COLORS[i % INCOME_COLORS.length])
  ]
})

const pieTitle = computed(() => {
  if (pieMode.value === 'expense') return isRo.value ? 'Distributia Cheltuielilor' : 'Spending Distribution'
  if (pieMode.value === 'income')  return isRo.value ? 'Distributia Veniturilor'   : 'Income Distribution'
  return isRo.value ? 'Distributia Categoriilor' : 'Category Distribution'
})

const pieSubtitle = computed(() => {
  const base = isRo.value ? 'Ultimele 12 luni' : 'Last 12 months'
  if (pieMode.value === 'expense') return `${base}, ${isRo.value ? 'cheltuieli' : 'expenses'}`
  if (pieMode.value === 'income')  return `${base}, ${isRo.value ? 'venituri' : 'income'}`
  return `${base}, ${isRo.value ? 'toate categoriile' : 'all categories'}`
})

const pieEmptyMsg = computed(() => {
  if (pieMode.value === 'expense') return isRo.value ? 'Nicio cheltuiala in ultimele 12 luni.' : 'No expenses in the last 12 months.'
  if (pieMode.value === 'income')  return isRo.value ? 'Niciun venit in ultimele 12 luni.'     : 'No income in the last 12 months.'
  return isRo.value ? 'Nicio tranzactie in ultimele 12 luni.' : 'No transactions in the last 12 months.'
})

const categoryChartData = computed(() => ({
  labels: currentPieCategories.value.map(c => c.label),
  datasets: [{
    data: currentPieCategories.value.map(c => c.amount),
    backgroundColor: currentPieColors.value,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)'
  }]
}))

const pieOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toFixed(0)} ${activeCurrency.value}`
      }
    }
  }
}

// --- GRUP 2: Evolutie lunara ---
const last6MonthsSlots = computed(() => {
  const slots = []
  const anchor = new Date(referenceDate.value)
  for (let i = 5; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)
    slots.push({ year: d.getFullYear(), month: d.getMonth() })
  }
  return slots
})

const monthlyData = computed(() =>
  last6MonthsSlots.value.map(({ year, month }) => {
    const txs = allTransactions.value.filter(tx => {
      const d = new Date(tx.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    const income = txs.filter(tx => tx.amount > 0).reduce((s, tx) => s + toAct(tx.amount), 0)
    const expense = txs.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(toAct(tx.amount)), 0)
    return { year, month, income, expense }
  })
)

const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString(isRo.value ? 'ro-RO' : 'en-US', { month: 'short', year: '2-digit' })

const monthlyChartData = computed(() => ({
  labels: last6MonthsSlots.value.map(({ year, month }) => monthLabel(year, month)),
  datasets: [
    {
      label: isRo.value ? 'Venituri' : 'Income',
      data: monthlyData.value.map(m => Math.round(m.income)),
      backgroundColor: 'rgba(46, 204, 113, 0.7)',
      borderColor: '#2ecc71',
      borderWidth: 2,
      borderRadius: 6
    },
    {
      label: isRo.value ? 'Cheltuieli' : 'Expenses',
      data: monthlyData.value.map(m => Math.round(m.expense)),
      backgroundColor: 'rgba(231, 76, 60, 0.7)',
      borderColor: '#e74c3c',
      borderWidth: 2,
      borderRadius: 6
    }
  ]
}))

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#a5b1c2', font: { size: 13 } } }
  },
  scales: {
    x: { ticks: { color: '#a5b1c2' }, grid: { color: 'rgba(165,177,194,0.1)' } },
    y: { ticks: { color: '#a5b1c2' }, grid: { color: 'rgba(165,177,194,0.1)' } }
  }
}))

// --- GRUP 3: KPI-uri ---
const savingsRate = computed(() => {
  const totalIncome = monthlyData.value.reduce((s, m) => s + m.income, 0)
  const totalExpense = monthlyData.value.reduce((s, m) => s + m.expense, 0)
  if (totalIncome === 0) return 0
  return Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
})

const savingsRateClass = computed(() => {
  if (savingsRate.value >= 20) return 'kpi-great'
  if (savingsRate.value >= 0) return 'kpi-ok'
  return 'kpi-bad'
})

const savingsRateEmoji = computed(() => {
  if (savingsRate.value >= 20) return '🏆'
  if (savingsRate.value >= 0) return '✅'
  return '⚠️'
})

const avgIncome = computed(() => {
  const months = last6MonthsSlots.value.length
  return months ? monthlyData.value.reduce((s, m) => s + m.income, 0) / months : 0
})

const avgExpense = computed(() => {
  const months = last6MonthsSlots.value.length
  return months ? monthlyData.value.reduce((s, m) => s + m.expense, 0) / months : 0
})

const bestMonth = computed(() => {
  if (!monthlyData.value.length) return { label: '-' }
  const best = monthlyData.value.reduce((b, m) => {
    const savings = m.income - m.expense
    return savings > b.savings ? { ...m, savings } : b
  }, { savings: -Infinity })
  if (best.savings === -Infinity) return { label: '-' }
  return { label: monthLabel(best.year, best.month) }
})

// --- GRUP 4: Analiza lunii selectate ---
const selYear  = computed(() => new Date(referenceDate.value).getFullYear())
const selMonth = computed(() => new Date(referenceDate.value).getMonth())

const selectedMonthLabel = computed(() =>
  new Date(selYear.value, selMonth.value, 1).toLocaleDateString(
    isRo.value ? 'ro-RO' : 'en-US', { month: 'long', year: 'numeric' }
  )
)

const selectedMonthExpenses = computed(() =>
  allTransactions.value.filter(tx => {
    const d = new Date(tx.date)
    return d.getFullYear() === selYear.value && d.getMonth() === selMonth.value && tx.amount < 0
  })
)

const prevMonthExpenses = computed(() => {
  const prev = new Date(selYear.value, selMonth.value - 1, 1)
  return allTransactions.value.filter(tx => {
    const d = new Date(tx.date)
    return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth() && tx.amount < 0
  })
})

// A) Comparatie cu luna anterioara
const monthComparison = computed(() => {
  const current = selectedMonthExpenses.value.reduce((s, tx) => s + Math.abs(toAct(tx.amount)), 0)
  const prev    = prevMonthExpenses.value.reduce((s, tx) => s + Math.abs(toAct(tx.amount)), 0)
  const change  = prev > 0 ? Math.round(((current - prev) / prev) * 100) : null
  return { current, prev, change }
})

// B) Ziua saptamanii cu cele mai mari cheltuieli (ultimele 4 sapt fata de sfarsitul lunii selectate)
const mostExpensiveDayOfWeek = computed(() => {
  const endOfMonth = new Date(selYear.value, selMonth.value + 1, 0)
  const cutoff = new Date(endOfMonth)
  cutoff.setDate(cutoff.getDate() - 27)
  const dayMap = {}
  allTransactions.value.forEach(tx => {
    if (tx.amount >= 0) return
    const d = new Date(tx.date)
    if (d < cutoff || d > endOfMonth) return
    const dow = d.getDay()
    if (!dayMap[dow]) dayMap[dow] = 0
    dayMap[dow] += Math.abs(toAct(tx.amount))
  })
  if (!Object.keys(dayMap).length) return null
  const [dow, amount] = Object.entries(dayMap).reduce((a, b) => b[1] > a[1] ? b : a)
  const RO = ['Duminica','Luni','Marti','Miercuri','Joi','Vineri','Sambata']
  const EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  return { day: (isRo.value ? RO : EN)[parseInt(dow)], amount }
})

// C) Streak zile fara cheltuieli in luna selectata
const longestExpenseStreak = computed(() => {
  const daysInMonth = new Date(selYear.value, selMonth.value + 1, 0).getDate()
  const today = new Date()
  const isCurrentMonth = selYear.value === today.getFullYear() && selMonth.value === today.getMonth()
  const endDay = isCurrentMonth ? today.getDate() : daysInMonth
  const expenseDays = new Set(selectedMonthExpenses.value.map(tx => new Date(tx.date).getDate()))
  let max = 0, cur = 0
  for (let d = 1; d <= endDay; d++) {
    if (!expenseDays.has(d)) { cur++; if (cur > max) max = cur }
    else cur = 0
  }
  return max
})

// D) Cea mai mare cheltuiala din luna selectata
const biggestExpense = computed(() => {
  if (!selectedMonthExpenses.value.length) return null
  return selectedMonthExpenses.value.reduce((mx, tx) =>
    Math.abs(tx.amount) > Math.abs(mx.amount) ? tx : mx
  )
})

// E) Top 3 categorii in luna selectata
const topCategoriesSelectedMonth = computed(() => {
  const map = {}
  selectedMonthExpenses.value.forEach(tx => {
    const cat = tx.category || 'Altele'
    if (!map[cat]) map[cat] = 0
    map[cat] += Math.abs(toAct(tx.amount))
  })
  const total = Object.values(map).reduce((s, v) => s + v, 0)
  if (total === 0) return []
  return Object.entries(map)
    .map(([name, amount]) => ({
      name,
      label: t.value.catMap?.[name] || name,
      amount,
      percent: Math.round((amount / total) * 100)
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
})

// --- GRUP 4.5: Anomalii ---
const anomalies = computed(() => {
  if (!selectedMonthExpenses.value.length) return []

  const anchor = new Date(referenceDate.value)
  const catPrev = {}
  for (let i = 1; i <= 3; i++) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)
    allTransactions.value
      .filter(tx => {
        const td = new Date(tx.date)
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && tx.amount < 0
      })
      .forEach(tx => {
        const cat = tx.category || 'Altele'
        catPrev[cat] = (catPrev[cat] || 0) + Math.abs(toAct(tx.amount))
      })
  }
  const catAvg = Object.fromEntries(Object.entries(catPrev).map(([c, v]) => [c, v / 3]))

  const result = []

  // Tranzactii individuale > 200% din media categoriei
  selectedMonthExpenses.value.forEach(tx => {
    const cat = tx.category || 'Altele'
    const avg = catAvg[cat]
    if (!avg) return
    const amt = Math.abs(toAct(tx.amount))
    if (amt > avg * 2) {
      result.push({
        type: 'transaction',
        name: tx.name,
        category: cat,
        amount: amt,
        avg,
        ratio: +(amt / avg).toFixed(1),
        catLabel: t.value.catMap?.[cat] || cat
      })
    }
  })

  // Total categorie in luna selectata > 150% din media lunara
  const catTotals = {}
  selectedMonthExpenses.value.forEach(tx => {
    const cat = tx.category || 'Altele'
    catTotals[cat] = (catTotals[cat] || 0) + Math.abs(toAct(tx.amount))
  })
  Object.entries(catTotals).forEach(([cat, total]) => {
    const avg = catAvg[cat]
    if (!avg) return
    if (total > avg * 1.5) {
      result.push({
        type: 'category',
        name: t.value.catMap?.[cat] || cat,
        category: cat,
        amount: total,
        avg,
        ratio: +(total / avg).toFixed(1),
        catLabel: t.value.catMap?.[cat] || cat
      })
    }
  })

  return result.sort((a, b) => b.ratio - a.ratio)
})

// --- GRUP 5: Analiza AI ---
const aiLoading   = ref(false)
const aiResult    = ref('')
const aiError     = ref('')
const aiTimestamp = ref('')
const aiCooldown  = ref(0)

const startCooldown = () => {
  aiCooldown.value = 30
  const timer = setInterval(() => {
    aiCooldown.value--
    if (aiCooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

const aiFormattedLines = computed(() => {
  if (!aiResult.value) return []
  return aiResult.value
    .replace(/<[^>]+>/g, '')  // strip html
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => ({
      html: l
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>'),
      isHeader: /^[0-9]+[.)]\s/.test(l) || /^#+\s/.test(l)
    }))
})

const analyzeWithAI = async () => {
  if (allTransactions.value.length < 5) return

  aiLoading.value = true
  aiResult.value  = ''
  aiError.value   = ''

  const anchor = new Date(referenceDate.value)
  const cutoff = new Date(anchor.getFullYear(), anchor.getMonth() - 2, 1)
  const last3  = allTransactions.value.filter(tx => new Date(tx.date) >= cutoff)

  const totalIncome  = last3.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0)
  const totalExpense = last3.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0)

  // Top 3 categorii (ultimele 3 luni, RON brut)
  const catMap3 = {}
  last3.filter(tx => tx.amount < 0).forEach(tx => {
    const cat = t.value.catMap?.[tx.category] || tx.category || 'Altele'
    if (!catMap3[cat]) catMap3[cat] = 0
    catMap3[cat] += Math.abs(tx.amount)
  })
  const top3Str = Object.entries(catMap3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c, v]) => `${c}: ${Math.round(v)} RON`)
    .join(', ') || 'insuficiente date'

  // Comparatie luna curenta vs anterioara (RON brut)
  const curExp  = selectedMonthExpenses.value.reduce((s, tx) => s + Math.abs(tx.amount), 0)
  const prevExp = prevMonthExpenses.value.reduce((s, tx) => s + Math.abs(tx.amount), 0)

  const budgetStr = budgets.value.length > 0
    ? budgets.value.map(b => `${t.value.catMap?.[b.category] || b.category}: limita ${b.limitAmount} RON`).join(', ')
    : 'Niciun buget configurat'

  const dataStr = [
    `Rata de economisire (ultimele 6 luni): ${savingsRate.value}%`,
    `Venit total ultimele 3 luni: ${Math.round(totalIncome)} RON`,
    `Cheltuieli totale ultimele 3 luni: ${Math.round(totalExpense)} RON`,
    `Top 3 categorii cheltuieli (3 luni): ${top3Str}`,
    `Luna ${selectedMonthLabel.value}: cheltuieli ${Math.round(curExp)} RON`,
    `Luna precedenta: cheltuieli ${Math.round(prevExp)} RON`,
    `Bugete active: ${budgetStr}`,
    `Total tranzactii inregistrate: ${allTransactions.value.length}`
  ].join('\n')

  const prompt = `Esti un asistent financiar personal. Analizeaza datele financiare ale utilizatorului si ofera o analiza personalizata in limba romana. Fii concret, foloseste cifrele reale din date, si ofera 3-5 observatii actionabile. Nu fi generic. Structureaza raspunsul in: 1) Rezumat general (2-3 fraze), 2) Puncte forte, 3) Puncte de atentie, 4) Recomandari concrete. Raspunde in maximum 300 de cuvinte.\n\nDate financiare:\n${dataStr}`

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    )
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (text) {
      aiResult.value = text
      const now = new Date()
      aiTimestamp.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    } else {
      throw new Error('empty response')
    }
  } catch {
    aiError.value = isRo.value
      ? 'Eroare la conectarea cu AI. Verifica conexiunea la internet sau cheia API.'
      : 'Error connecting to AI. Check your internet connection or API key.'
  } finally {
    aiLoading.value = false
    startCooldown()
  }
}
</script>

<style scoped>
.insights-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-insights {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.empty-icon { font-size: 56px; margin-bottom: 16px; }
.empty-insights h2 { margin: 0 0 10px 0; color: #2c3e50; font-size: 24px; }
.empty-insights p { color: #7f8c8d; font-size: 16px; margin: 0; }

.insights-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.card-header { margin-bottom: 18px; }
.card-header h3 { margin: 0 0 4px 0; font-size: 17px; color: #2c3e50; }
.card-subtitle { margin: 0; font-size: 13px; color: #95a5a6; }

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

/* Pie mode toggle */
.pie-mode-tabs {
  display: flex;
  gap: 4px;
  background: #f1f3f5;
  padding: 4px;
  border-radius: 8px;
  flex-shrink: 0;
}
.mode-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #7f8c8d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
}
.mode-btn.active {
  background: white;
  color: #2c3e50;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.mode-btn:not(.active):hover { color: #34495e; }

/* GRUP 1 */
.no-data-msg { color: #95a5a6; font-size: 14px; text-align: center; padding: 20px; }

.category-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.pie-container {
  width: 180px;
  flex-shrink: 0;
}

.category-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name {
  width: 110px;
  color: #34495e;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-bar-track {
  flex: 1;
  height: 8px;
  background: #f1f3f5;
  border-radius: 4px;
  overflow: hidden;
}
.cat-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.cat-pct {
  width: 36px;
  text-align: right;
  color: #7f8c8d;
  font-size: 12px;
}

.cat-amt {
  width: 80px;
  text-align: right;
  font-weight: 600;
  color: #2c3e50;
  font-size: 12px;
}

/* GRUP 2 */
.bar-container {
  height: 240px;
  position: relative;
}

/* GRUP 3 */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.kpi-item {
  text-align: center;
  padding: 18px 12px;
  border-radius: 10px;
  background: #f8f9fa;
  border: 1px solid transparent;
}

.kpi-great { background: rgba(46, 204, 113, 0.12); border-color: rgba(46,204,113,0.3); }
.kpi-ok    { background: rgba(52, 152, 219, 0.10); border-color: rgba(52,152,219,0.3); }
.kpi-bad   { background: rgba(231, 76, 60, 0.10);  border-color: rgba(231,76,60,0.3); }
.kpi-best  { background: rgba(243, 156, 18, 0.10); border-color: rgba(243,156,18,0.3); }

.kpi-emoji { font-size: 28px; margin-bottom: 8px; }
.kpi-val   { font-size: 20px; font-weight: 700; color: #2c3e50; margin-bottom: 4px; }
.kpi-lbl   { font-size: 12px; color: #7f8c8d; line-height: 1.3; }

/* DARK MODE */
body.dark-mode .empty-insights,
body.dark-mode .insights-card { background: #16213e !important; box-shadow: none !important; }

body.dark-mode .empty-insights h2 { color: #f1f1f1 !important; }
body.dark-mode .empty-insights p  { color: #a5b1c2 !important; }

body.dark-mode .card-header h3 { color: #f1f1f1 !important; }
body.dark-mode .card-subtitle  { color: #6c7a89 !important; }

body.dark-mode .pie-mode-tabs { background: #0f3460 !important; }
body.dark-mode .mode-btn      { color: #a5b1c2 !important; }
body.dark-mode .mode-btn.active { background: #1a1a2e !important; color: #f1f1f1 !important; box-shadow: none !important; }

body.dark-mode .cat-name  { color: #dfe6e9 !important; }
body.dark-mode .cat-amt   { color: #dfe6e9 !important; }
body.dark-mode .cat-pct   { color: #6c7a89 !important; }
body.dark-mode .cat-bar-track { background: #0f3460 !important; }

body.dark-mode .kpi-item  { background: #1a1a2e !important; border-color: #0f3460 !important; }
body.dark-mode .kpi-great { background: rgba(46,204,113,0.12) !important; border-color: rgba(46,204,113,0.3) !important; }
body.dark-mode .kpi-ok    { background: rgba(52,152,219,0.12) !important; border-color: rgba(52,152,219,0.3) !important; }
body.dark-mode .kpi-bad   { background: rgba(231,76,60,0.12)  !important; border-color: rgba(231,76,60,0.3)  !important; }
body.dark-mode .kpi-best  { background: rgba(243,156,18,0.12) !important; border-color: rgba(243,156,18,0.3) !important; }
body.dark-mode .kpi-val   { color: #f1f1f1 !important; }
body.dark-mode .kpi-lbl   { color: #6c7a89 !important; }

body.dark-mode .no-data-msg { color: #6c7a89 !important; }

/* GRUP 4: Insights grid */
.insights-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.ig-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #f1f3f5;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ig-wide { grid-column: span 2; }

.ig-icon  { font-size: 22px; }
.ig-label { font-size: 11px; font-weight: 700; color: #95a5a6; text-transform: uppercase; letter-spacing: 0.4px; line-height: 1.3; }
.ig-main-val { font-size: 22px; font-weight: 700; color: #2c3e50; margin-top: 2px; }
.ig-sub  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 2px; }
.ig-prev { font-size: 12px; color: #7f8c8d; }
.ig-empty-sub { font-size: 13px; color: #bdc3c7; margin-top: 4px; }
.ig-tag  { font-size: 11px; background: rgba(52,152,219,0.1); color: #2980b9; padding: 2px 8px; border-radius: 20px; align-self: flex-start; font-weight: 600; }

.ig-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
}
.badge-red   { background: rgba(231,76,60,0.12);  color: #e74c3c; }
.badge-green { background: rgba(46,204,113,0.12); color: #27ae60; }
.badge-neutral { background: #f1f3f5; color: #95a5a6; }

.ig-cat-list { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.ig-cat-row  { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.ig-cat-dot  { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ig-cat-name { flex: 1; color: #34495e; font-weight: 500; }
.ig-cat-pct  { color: #7f8c8d; font-size: 12px; width: 36px; text-align: right; }
.ig-cat-amt  { font-weight: 600; color: #2c3e50; font-size: 12px; width: 80px; text-align: right; }

/* dark mode grup 4 */
body.dark-mode .ig-card       { background: #1a1a2e !important; border-color: #0f3460 !important; }
body.dark-mode .ig-main-val   { color: #f1f1f1 !important; }
body.dark-mode .ig-label      { color: #6c7a89 !important; }
body.dark-mode .ig-prev       { color: #a5b1c2 !important; }
body.dark-mode .ig-empty-sub  { color: #4a5568 !important; }
body.dark-mode .ig-tag        { background: rgba(52,152,219,0.15) !important; color: #3498db !important; }
body.dark-mode .badge-neutral { background: #0f3460 !important; color: #a5b1c2 !important; }
body.dark-mode .ig-cat-name   { color: #dfe6e9 !important; }
body.dark-mode .ig-cat-amt    { color: #dfe6e9 !important; }
body.dark-mode .ig-cat-pct    { color: #6c7a89 !important; }

/* GRUP 4.5: Anomalii */
.anomaly-clean {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 20px;
  background: rgba(46,204,113,0.06);
  border-radius: 10px;
  border: 1px solid rgba(46,204,113,0.2);
  text-align: center;
}
.anomaly-clean-icon { font-size: 32px; }
.anomaly-clean p { margin: 0; font-size: 14px; color: #27ae60; font-weight: 500; max-width: 420px; line-height: 1.5; }

.anomaly-list { display: flex; flex-direction: column; gap: 10px; }
.anomaly-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  background: rgba(231,76,60,0.05);
  border: 1px solid rgba(231,76,60,0.15);
  border-radius: 10px;
  padding: 14px 16px;
}
.anomaly-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }
.anomaly-body { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.anomaly-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.anomaly-name { font-weight: 700; color: #2c3e50; font-size: 14px; }
.anomaly-badge {
  font-size: 10px; font-weight: 700; padding: 2px 7px;
  border-radius: 99px; background: rgba(231,76,60,0.12); color: #e74c3c;
  border: 1px solid rgba(231,76,60,0.25); text-transform: uppercase; letter-spacing: 0.4px;
}
.anomaly-amounts { display: flex; align-items: baseline; gap: 8px; }
.anomaly-amt { font-size: 16px; font-weight: 700; color: #e74c3c; }
.anomaly-vs { font-size: 12px; color: #95a5a6; }
.anomaly-msg { margin: 0; font-size: 12px; color: #7f8c8d; line-height: 1.5; }

body.dark-mode .anomaly-clean { background: rgba(46,204,113,0.08) !important; border-color: rgba(46,204,113,0.2) !important; }
body.dark-mode .anomaly-clean p { color: #2ecc71 !important; }
body.dark-mode .anomaly-card { background: rgba(231,76,60,0.08) !important; border-color: rgba(231,76,60,0.2) !important; }
body.dark-mode .anomaly-name { color: #f1f1f1 !important; }
body.dark-mode .anomaly-vs { color: #6c7a89 !important; }
body.dark-mode .anomaly-msg { color: #a5b1c2 !important; }

/* GRUP 5: Analiza AI */
.ai-card { border: 1px solid rgba(102,126,234,0.2); }

.ai-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.ai-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(102,126,234,0.4); }
.ai-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.ai-btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.ai-cooldown-msg {
  font-size: 11px;
  color: #95a5a6;
  margin: 0;
  text-align: right;
  font-style: italic;
}

.ai-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 36px 20px;
  text-align: center;
}
.ai-state-icon { font-size: 40px; }
.ai-state p    { font-size: 14px; color: #7f8c8d; max-width: 440px; line-height: 1.6; margin: 0; }

.ai-loading { }
.ai-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(102,126,234,0.25);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: aiSpin 0.75s linear infinite;
}
@keyframes aiSpin { to { transform: rotate(360deg); } }

.ai-error p { color: #e74c3c !important; }
.ai-retry-btn {
  padding: 8px 18px;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.ai-retry-btn:hover { background: rgba(231,76,60,0.08); }

.ai-result { padding-top: 4px; }
.ai-timestamp {
  font-size: 11px;
  color: #95a5a6;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ai-timestamp::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #2ecc71;
  border-radius: 50%;
}

.ai-text { display: flex; flex-direction: column; gap: 8px; }
.ai-section-head {
  font-size: 14px;
  font-weight: 700;
  color: #2c3e50;
  margin: 10px 0 2px 0;
  padding-left: 10px;
  border-left: 3px solid #667eea;
}
.ai-para {
  font-size: 14px;
  color: #34495e;
  line-height: 1.65;
  margin: 0;
  padding-left: 2px;
}

/* dark mode AI */
body.dark-mode .ai-card         { border-color: rgba(102,126,234,0.25) !important; }
body.dark-mode .ai-state p      { color: #6c7a89 !important; }
body.dark-mode .ai-timestamp    { color: #6c7a89 !important; }
body.dark-mode .ai-section-head { color: #f1f1f1 !important; }
body.dark-mode .ai-para         { color: #dfe6e9 !important; }
body.dark-mode .ai-cooldown-msg { color: #4a5568 !important; }

@media (max-width: 700px) {
  .category-content { flex-direction: column; }
  .pie-container { width: 140px; align-self: center; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .cat-name { width: 80px; }
  .cat-amt { width: 65px; }
  .header-row { flex-direction: column; }
  .insights-grid { grid-template-columns: repeat(2, 1fr); }
  .ig-wide { grid-column: span 2; }
}
</style>
