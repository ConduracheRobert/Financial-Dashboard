<template>
  <div class="simulator-page">

    <div v-if="insufficientData" class="sim-empty">
      <div class="sim-empty-icon">🧮</div>
      <h2>{{ isRo ? 'Date insuficiente' : 'Insufficient data' }}</h2>
      <p>{{ isRo
        ? 'Ai nevoie de cel putin 3 luni de tranzactii pentru a folosi simulatorul.'
        : 'You need at least 3 months of transactions to use the simulator.' }}</p>
    </div>

    <template v-else>

      <!-- Rezumat date reale -->
      <div class="sim-data-bar">
        <div class="sim-data-item">
          <span class="sim-data-label">{{ isRo ? 'Venit mediu / luna' : 'Avg income / month' }}</span>
          <span class="sim-data-val green">{{ fmtAmt(avgIncome) }}</span>
        </div>
        <div class="sim-data-sep"></div>
        <div class="sim-data-item">
          <span class="sim-data-label">{{ isRo ? 'Cheltuieli medii / luna' : 'Avg expenses / month' }}</span>
          <span class="sim-data-val red">{{ fmtAmt(avgExpense) }}</span>
        </div>
        <div class="sim-data-sep"></div>
        <div class="sim-data-item">
          <span class="sim-data-label">{{ isRo ? 'Economii medii / luna' : 'Avg savings / month' }}</span>
          <span class="sim-data-val" :class="avgSavings >= 0 ? 'green' : 'red'">{{ fmtAmt(avgSavings) }}</span>
        </div>
      </div>

      <!-- SCENARIU A -->
      <section class="sim-card">
        <div class="sim-card-header">
          <h3>✂️ {{ isRo ? 'Daca reduc cheltuielile' : 'If I reduce expenses' }}</h3>
          <p class="sim-subtitle">{{ isRo ? 'Simuleaza impactul reducerii cheltuielilor lunare' : 'Simulate the impact of reducing monthly expenses' }}</p>
        </div>
        <div class="sim-body">
          <div class="slider-group">
            <div class="slider-label-row">
              <label>{{ isRo ? 'Reducere cheltuieli' : 'Expense reduction' }}</label>
              <strong class="slider-val-badge">{{ reductionPct }}%</strong>
            </div>
            <input type="range" min="0" max="50" step="1" v-model.number="reductionPct" class="sim-slider" />
            <div class="slider-ticks"><span>0%</span><span>25%</span><span>50%</span></div>
          </div>
          <div class="sim-results">
            <div class="sim-result-card green-card">
              <span class="res-icon">💰</span>
              <span class="res-label">{{ isRo ? 'Economii suplimentare' : 'Extra savings' }}</span>
              <span class="res-val">+{{ fmtAmt(extraSavingsA) }} / {{ isRo ? 'luna' : 'month' }}</span>
            </div>
            <div class="sim-result-card blue-card">
              <span class="res-icon">📈</span>
              <span class="res-label">{{ isRo ? 'Total economisit / luna' : 'Total saved / month' }}</span>
              <span class="res-val">{{ fmtAmt(totalSavingsA) }} / {{ isRo ? 'luna' : 'month' }}</span>
            </div>
            <div class="sim-result-card" :class="monthsToEmergencyA > 0 ? 'purple-card' : 'red-card'">
              <span class="res-icon">🛡️</span>
              <span class="res-label">{{ isRo ? 'Fond urgenta (3 salarii)' : 'Emergency fund (3x salary)' }}</span>
              <span class="res-val">
                {{ monthsToEmergencyA > 0
                  ? (isRo ? `in ${monthsToEmergencyA} luni` : `in ${monthsToEmergencyA} months`)
                  : (isRo ? 'Economii negative' : 'Negative savings') }}
              </span>
              <span class="res-sub">{{ fmtAmt(emergencyFund) }} {{ isRo ? 'necesar' : 'needed' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- SCENARIU B -->
      <section class="sim-card">
        <div class="sim-card-header">
          <h3>🎯 {{ isRo ? 'Daca pun deoparte X RON/luna' : 'If I save X per month' }}</h3>
          <p class="sim-subtitle">{{ isRo ? 'Calculeaza cand atingi un obiectiv financiar' : 'Calculate when you reach a financial goal' }}</p>
        </div>
        <div class="sim-body">
          <div class="input-group-row">
            <label>{{ isRo ? 'Economisesc lunar' : 'Monthly saving' }}:</label>
            <div class="num-input-wrap">
              <input type="number" v-model.number="monthlySavingB" min="0" max="999999" step="50" class="sim-num-input" />
              <span class="input-unit">{{ currSymbol }}</span>
            </div>
          </div>
          <div class="slider-group" style="margin-top:18px">
            <div class="slider-label-row">
              <label>{{ isRo ? 'Obiectiv financiar' : 'Financial goal' }}</label>
              <strong class="slider-val-badge">{{ fmtAmt(targetB) }}</strong>
            </div>
            <input type="range" min="1000" max="50000" step="500" v-model.number="targetB" class="sim-slider" />
            <div class="slider-ticks"><span>1k</span><span>25k</span><span>50k {{ currSymbol }}</span></div>
          </div>
          <div class="sim-results">
            <div class="sim-result-card" :class="monthsToTargetB > 0 ? 'green-card' : 'red-card'">
              <span class="res-icon">⏱️</span>
              <span class="res-label">{{ isRo ? 'Timp pana la obiectiv' : 'Time to goal' }}</span>
              <span class="res-val">
                {{ monthsToTargetB > 0
                  ? (monthsToTargetB <= 120
                      ? (isRo ? `${monthsToTargetB} luni` : `${monthsToTargetB} months`)
                      : (isRo ? 'Peste 10 ani' : 'Over 10 years'))
                  : (isRo ? 'Seteaza o suma' : 'Set an amount') }}
              </span>
              <span v-if="monthsToTargetB > 0 && monthsToTargetB <= 120" class="res-sub">
                {{ isRo
                  ? `${(monthsToTargetB / 12).toFixed(1)} ani`
                  : `${(monthsToTargetB / 12).toFixed(1)} years` }}
              </span>
            </div>
          </div>
          <div class="progress-section">
            <div class="progress-label-row">
              <span>{{ isRo ? 'Progres in 12 luni' : 'Progress in 12 months' }}</span>
              <span class="progress-pct">{{ Math.min(progress12B, 100) }}%</span>
            </div>
            <div class="sim-progress-track">
              <div class="sim-progress-fill" :style="{ width: Math.min(progress12B, 100) + '%' }"></div>
            </div>
            <div class="progress-sub">
              {{ isRo
                ? `Economisesti ${fmtAmt(monthlySavingB * 12)} in 12 luni din ${fmtAmt(targetB)} obiectiv`
                : `You save ${fmtAmt(monthlySavingB * 12)} in 12 months out of ${fmtAmt(targetB)} goal` }}
            </div>
          </div>
        </div>
      </section>

      <!-- SCENARIU C -->
      <section class="sim-card">
        <div class="sim-card-header">
          <h3>📅 {{ isRo ? 'Proiectie anuala' : 'Annual Projection' }}</h3>
          <p class="sim-subtitle">{{ isRo
            ? 'Urmatoarele 12 luni bazate pe media ultimelor 3 luni'
            : 'Next 12 months based on your last 3-month average' }}</p>
        </div>
        <div class="sim-body">
          <div class="projection-chart-wrap">
            <Line :data="projectionChartData" :options="projectionOptions" />
          </div>
          <div class="sim-results" style="margin-top: 16px;">
            <div class="sim-result-card" :class="projectedAnnualSavings >= 0 ? 'green-card' : 'red-card'">
              <span class="res-icon">{{ projectedAnnualSavings >= 0 ? '🏦' : '📉' }}</span>
              <span class="res-label">{{ isRo ? 'Economii anuale estimate' : 'Estimated annual savings' }}</span>
              <span class="res-val">{{ fmtAmt(projectedAnnualSavings) }}</span>
            </div>
            <div v-if="deficitMonths > 0" class="sim-result-card red-card">
              <span class="res-icon">⚠️</span>
              <span class="res-label">{{ isRo ? 'Luni cu deficit estimat' : 'Months in estimated deficit' }}</span>
              <span class="res-val">{{ deficitMonths }} / 12</span>
            </div>
            <div v-else class="sim-result-card green-card">
              <span class="res-icon">✅</span>
              <span class="res-label">{{ isRo ? 'Proiectie pozitiva' : 'Positive projection' }}</span>
              <span class="res-val">{{ isRo ? 'Toate lunile in surplus' : 'All months in surplus' }}</span>
            </div>
          </div>
        </div>
      </section>

    </template>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

const t               = inject('t')
const allTransactions = inject('transactions')
const activeCurrency  = inject('activeCurrency')
const globalRates     = inject('globalRates')
const referenceDate   = inject('referenceDate')

const isRo = computed(() => t.value.locale === 'ro-RO')

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
  const sign = val < 0 ? '-' : ''
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k ${currSymbol.value}`
  return `${sign}${Math.round(abs)} ${currSymbol.value}`
}

// Medii din ultimele 3 luni inainte de referenceDate
const last3 = computed(() => {
  const anchor = new Date(referenceDate.value)
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i - 1, 1)
    const txs = allTransactions.value.filter(tx => {
      const td = new Date(tx.date)
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
    })
    return {
      income:  txs.filter(tx => tx.amount > 0).reduce((s, tx) => s + toAct(tx.amount), 0),
      expense: txs.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(toAct(tx.amount)), 0)
    }
  })
})

const avgIncome  = computed(() => last3.value.reduce((s, m) => s + m.income, 0) / 3)
const avgExpense = computed(() => last3.value.reduce((s, m) => s + m.expense, 0) / 3)
const avgSavings = computed(() => avgIncome.value - avgExpense.value)

const insufficientData = computed(() =>
  allTransactions.value.length < 5 ||
  last3.value.reduce((s, m) => s + m.income + m.expense, 0) === 0
)

// Fond de urgenta = 3 x venit mediu lunar
const emergencyFund = computed(() => 3 * avgIncome.value)

// --- SCENARIU A ---
const reductionPct = ref(10)
const extraSavingsA      = computed(() => avgExpense.value * (reductionPct.value / 100))
const totalSavingsA      = computed(() => avgSavings.value + extraSavingsA.value)
const monthsToEmergencyA = computed(() => {
  if (totalSavingsA.value <= 0) return 0
  return Math.ceil(emergencyFund.value / totalSavingsA.value)
})

// --- SCENARIU B ---
const monthlySavingB = ref(500)
const targetB        = ref(10000)
const monthsToTargetB = computed(() => {
  if (monthlySavingB.value <= 0) return 0
  return Math.ceil(targetB.value / monthlySavingB.value)
})
const progress12B = computed(() => {
  if (targetB.value <= 0 || monthlySavingB.value <= 0) return 0
  return Math.round(((monthlySavingB.value * 12) / targetB.value) * 100)
})

// --- SCENARIU C ---
const next12Months = computed(() => {
  const anchor = new Date(referenceDate.value)
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() + i + 1, 1)
    return {
      label:   d.toLocaleDateString(isRo.value ? 'ro-RO' : 'en-US', { month: 'short', year: '2-digit' }),
      income:  Math.round(avgIncome.value),
      expense: Math.round(avgExpense.value)
    }
  })
})

const deficitMonths          = computed(() => next12Months.value.filter(m => m.expense > m.income).length)
const projectedAnnualSavings = computed(() => avgSavings.value * 12)

const projectionChartData = computed(() => ({
  labels: next12Months.value.map(m => m.label),
  datasets: [
    {
      label: isRo.value ? 'Venituri estimate' : 'Projected Income',
      data: next12Months.value.map(m => m.income),
      borderColor: '#2ecc71',
      backgroundColor: 'rgba(46,204,113,0.08)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      borderWidth: 2
    },
    {
      label: isRo.value ? 'Cheltuieli estimate' : 'Projected Expenses',
      data: next12Months.value.map(m => m.expense),
      borderColor: '#e74c3c',
      backgroundColor: 'rgba(231,76,60,0.08)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      borderWidth: 2
    }
  ]
}))

const projectionOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#a5b1c2', font: { size: 12 } } }
  },
  scales: {
    x: { ticks: { color: '#a5b1c2' }, grid: { color: 'rgba(165,177,194,0.08)' } },
    y: {
      ticks: {
        color: '#a5b1c2',
        callback: v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v
      },
      grid: { color: 'rgba(165,177,194,0.08)' }
    }
  }
}))
</script>

<style scoped>
.simulator-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* --- EMPTY STATE --- */
.sim-empty {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.sim-empty-icon { font-size: 56px; margin-bottom: 16px; }
.sim-empty h2   { margin: 0 0 10px; color: #2c3e50; font-size: 22px; }
.sim-empty p    { margin: 0; color: #7f8c8d; font-size: 15px; }

/* --- DATA BAR --- */
.sim-data-bar {
  display: flex;
  align-items: center;
  gap: 0;
  background: white;
  border-radius: 12px;
  padding: 16px 24px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  flex-wrap: wrap;
}
.sim-data-item  { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px; }
.sim-data-sep   { width: 1px; height: 36px; background: #f1f3f5; margin: 0 20px; flex-shrink: 0; }
.sim-data-label { font-size: 11px; color: #95a5a6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
.sim-data-val   { font-size: 20px; font-weight: 700; color: #2c3e50; }
.sim-data-val.green { color: #27ae60; }
.sim-data-val.red   { color: #e74c3c; }

/* --- CARDS --- */
.sim-card {
  background: white;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.sim-card-header { margin-bottom: 20px; }
.sim-card-header h3 { margin: 0 0 4px; font-size: 17px; color: #2c3e50; }
.sim-subtitle { margin: 0; font-size: 13px; color: #95a5a6; }

/* --- SLIDER --- */
.slider-group     { display: flex; flex-direction: column; gap: 10px; }
.slider-label-row { display: flex; justify-content: space-between; align-items: center; }
.slider-label-row label { font-size: 14px; color: #34495e; font-weight: 500; }
.slider-val-badge {
  background: rgba(52,152,219,0.1);
  color: #2980b9;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 13px;
}
.sim-slider {
  width: 100%;
  accent-color: #3498db;
  cursor: pointer;
  height: 6px;
}
.slider-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #95a5a6;
}

/* --- NUMERIC INPUT --- */
.input-group-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.input-group-row label { font-size: 14px; color: #34495e; font-weight: 500; }
.num-input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #dcdde1;
  border-radius: 8px;
  overflow: hidden;
}
.sim-num-input {
  border: none;
  outline: none;
  padding: 8px 12px;
  font-size: 15px;
  font-weight: 600;
  width: 120px;
  background: transparent;
  color: #2c3e50;
}
.input-unit { padding: 8px 12px; background: #f8f9fa; color: #7f8c8d; font-size: 13px; font-weight: 600; border-left: 1px solid #dcdde1; }

/* --- RESULTS --- */
.sim-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.sim-result-card {
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.res-icon  { font-size: 22px; }
.res-label { font-size: 11px; font-weight: 700; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.4px; }
.res-val   { font-size: 20px; font-weight: 700; color: #2c3e50; }
.res-sub   { font-size: 12px; color: #95a5a6; }

.green-card  { background: rgba(46,204,113,0.08);  border: 1px solid rgba(46,204,113,0.2); }
.blue-card   { background: rgba(52,152,219,0.08);  border: 1px solid rgba(52,152,219,0.2); }
.purple-card { background: rgba(142,68,173,0.08);  border: 1px solid rgba(142,68,173,0.2); }
.red-card    { background: rgba(231,76,60,0.08);   border: 1px solid rgba(231,76,60,0.2); }

/* --- PROGRESS BAR --- */
.progress-section { margin-top: 18px; }
.progress-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #34495e;
  margin-bottom: 8px;
}
.progress-pct { font-weight: 700; color: #3498db; }
.sim-progress-track {
  height: 10px;
  background: #f1f3f5;
  border-radius: 99px;
  overflow: hidden;
}
.sim-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 99px;
  transition: width 0.5s ease;
}
.progress-sub { margin-top: 7px; font-size: 12px; color: #95a5a6; }

/* --- LINE CHART --- */
.projection-chart-wrap {
  height: 260px;
  position: relative;
}

/* ===== DARK MODE ===== */
body.dark-mode .sim-empty      { background: #16213e !important; box-shadow: none !important; }
body.dark-mode .sim-empty h2   { color: #f1f1f1 !important; }
body.dark-mode .sim-empty p    { color: #a5b1c2 !important; }

body.dark-mode .sim-data-bar   { background: #16213e !important; box-shadow: none !important; }
body.dark-mode .sim-data-sep   { background: #0f3460 !important; }
body.dark-mode .sim-data-val   { color: #f1f1f1 !important; }
body.dark-mode .sim-data-val.green { color: #2ecc71 !important; }
body.dark-mode .sim-data-val.red   { color: #e74c3c !important; }

body.dark-mode .sim-card       { background: #16213e !important; box-shadow: none !important; }
body.dark-mode .sim-card-header h3 { color: #f1f1f1 !important; }
body.dark-mode .sim-subtitle   { color: #6c7a89 !important; }

body.dark-mode .slider-label-row label { color: #dfe6e9 !important; }
body.dark-mode .slider-ticks   { color: #4a5568 !important; }

body.dark-mode .input-group-row label { color: #dfe6e9 !important; }
body.dark-mode .num-input-wrap { border-color: #0f3460 !important; }
body.dark-mode .sim-num-input  { color: #f1f1f1 !important; background: transparent !important; }
body.dark-mode .input-unit     { background: #0f3460 !important; color: #a5b1c2 !important; border-color: #1a1a2e !important; }

body.dark-mode .res-label { color: #6c7a89 !important; }
body.dark-mode .res-val   { color: #f1f1f1 !important; }
body.dark-mode .res-sub   { color: #4a5568 !important; }
body.dark-mode .green-card  { background: rgba(46,204,113,0.1)  !important; border-color: rgba(46,204,113,0.2) !important; }
body.dark-mode .blue-card   { background: rgba(52,152,219,0.1)  !important; border-color: rgba(52,152,219,0.2) !important; }
body.dark-mode .purple-card { background: rgba(142,68,173,0.1)  !important; border-color: rgba(142,68,173,0.2) !important; }
body.dark-mode .red-card    { background: rgba(231,76,60,0.1)   !important; border-color: rgba(231,76,60,0.2)  !important; }

body.dark-mode .progress-label-row { color: #dfe6e9 !important; }
body.dark-mode .sim-progress-track { background: #0f3460 !important; }
body.dark-mode .progress-sub       { color: #4a5568 !important; }

@media (max-width: 768px) {
  .simulator-page { gap: 14px; }
  .sim-data-bar { flex-direction: column; gap: 12px; padding: 14px; }
  .sim-data-sep { width: 100%; height: 1px; margin: 0; }
  .sim-data-item { min-width: 0; width: 100%; }
  .sim-card { padding: 16px; }
  .sim-card-header h3 { font-size: 15px; }
  .sim-subtitle { font-size: 12px; }
  .sim-results  { grid-template-columns: 1fr; }
  .sim-result-card { padding: 12px; }
  .input-group-row { flex-direction: column; align-items: stretch; gap: 8px; }
  .num-input-wrap { width: 100%; }
  .sim-num-input { flex: 1; width: auto; min-width: 0; }
  .projection-chart-wrap { height: 200px; }
}

@media (max-width: 480px) {
  .sim-card { padding: 12px; }
  .sim-data-bar { padding: 12px; }
  .sim-data-val { font-size: 17px; }
  .projection-chart-wrap { height: 180px; }
}
</style>
