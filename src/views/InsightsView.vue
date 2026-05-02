<template>
  <div class="insights-page">

    <div v-if="noData" class="empty-insights">
      <div class="empty-icon">📊</div>
      <h2>{{ isRo ? 'Nicio tranzactie inca' : 'No transactions yet' }}</h2>
      <p>{{ isRo ? 'Adauga tranzactii pentru a vedea statistici.' : 'Add transactions to see statistics.' }}</p>
    </div>

    <template v-else>

      <!-- GRUP 1: Distributia cheltuielilor pe categorii -->
      <section class="insights-card">
        <div class="card-header">
          <h3>🍕 {{ isRo ? 'Distributia Cheltuielilor' : 'Spending Distribution' }}</h3>
          <p class="card-subtitle">{{ isRo ? 'Ultimele 12 luni, pe categorii' : 'Last 12 months, by category' }}</p>
        </div>
        <div v-if="topCategories.length === 0" class="no-data-msg">
          {{ isRo ? 'Nicio cheltuiala inregistrata in ultimele 12 luni.' : 'No expenses recorded in the last 12 months.' }}
        </div>
        <div v-else class="category-content">
          <div class="pie-container">
            <Pie :data="categoryChartData" :options="pieOptions" />
          </div>
          <div class="category-list">
            <div v-for="(cat, i) in topCategories" :key="cat.name" class="cat-row">
              <span class="cat-dot" :style="{ background: COLORS[i % COLORS.length] }"></span>
              <span class="cat-name">{{ cat.label }}</span>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" :style="{ width: cat.percent + '%', background: COLORS[i % COLORS.length] }"></div>
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

    </template>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const t = inject('t')
const allTransactions = inject('transactions')
const activeCurrency = inject('activeCurrency')
const globalRates = inject('globalRates')

const isRo = computed(() => t.value.locale === 'ro-RO')

const COLORS = [
  '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63'
]

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
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 12)
  return allTransactions.value.filter(tx => new Date(tx.date) >= cutoff && tx.amount < 0)
})

const topCategories = computed(() => {
  const map = {}
  last12Expenses.value.forEach(tx => {
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
})

const categoryChartData = computed(() => ({
  labels: topCategories.value.map(c => c.label),
  datasets: [{
    data: topCategories.value.map(c => c.amount),
    backgroundColor: topCategories.value.map((_, i) => COLORS[i % COLORS.length]),
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
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
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

@media (max-width: 700px) {
  .category-content { flex-direction: column; }
  .pie-container { width: 140px; align-self: center; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .cat-name { width: 80px; }
  .cat-amt { width: 65px; }
}
</style>
