<template>
  <div class="summary-container" ref="containerRef">

    <!-- CARD: Sold Curent -->
    <div
      class="summary-card balance filter-card"
      :class="{ 'active-filter': currentFilter === 'all' }"
      @click="toggleFilter('all')"
    >
      <div class="icon">💳</div>
      <div class="details">
        <span class="label">{{ t.currentBalance }}</span>
        <span class="value">{{ currentBalance.toFixed(2) }} <small>{{ currency }}</small></span>
      </div>

      <div v-if="activePopover === 'all'" class="card-popover" @click.stop>
        <div class="popover-row">
          <span class="pop-icon">📈</span>
          <span class="pop-label">{{ t.totalIncome }}</span>
          <span class="pop-value income">+{{ fmtVal(totalIncome) }}</span>
        </div>
        <div class="popover-row">
          <span class="pop-icon">📉</span>
          <span class="pop-label">{{ t.totalExpense }}</span>
          <span class="pop-value expense">{{ fmtVal(totalExpense) }}</span>
        </div>
        <hr class="pop-divider" />
        <div class="popover-row">
          <span class="pop-icon">⚖️</span>
          <span class="pop-label">{{ t.currentBalance }}</span>
          <span class="pop-value" :class="currentBalance >= 0 ? 'income' : 'expense'">
            {{ currentBalance >= 0 ? '+' : '' }}{{ currentBalance.toFixed(2) }} {{ currency }}
          </span>
        </div>
      </div>
    </div>

    <!-- CARD: Total Venituri -->
    <div
      class="summary-card income filter-card"
      :class="{ 'active-filter': currentFilter === 'income' }"
      @click="toggleFilter('income')"
    >
      <div class="icon">📈</div>
      <div class="details">
        <span class="label">{{ t.totalIncome }}</span>
        <span class="value">+{{ totalIncome.toFixed(2) }} <small>{{ currency }}</small></span>
      </div>

      <div v-if="activePopover === 'income'" class="card-popover" @click.stop>
        <p class="pop-title">{{ isRo ? 'Top surse de venit' : 'Top income sources' }}</p>
        <div v-if="topIncomeCategories.length === 0" class="pop-empty">
          {{ isRo ? 'Nu există date pentru această perioadă.' : 'No data for this period.' }}
        </div>
        <template v-else>
          <div v-for="(cat, i) in topIncomeCategories" :key="cat.name" class="popover-row">
            <span class="pop-rank">{{ i + 1 }}.</span>
            <span class="pop-label">{{ cat.label }}</span>
            <span class="pop-value income">{{ fmtVal(cat.amount) }}</span>
            <span class="pop-pct">{{ cat.percent }}%</span>
          </div>
        </template>
      </div>
    </div>

    <!-- CARD: Total Cheltuieli -->
    <div
      class="summary-card expense filter-card"
      :class="{ 'active-filter': currentFilter === 'expense' }"
      @click="toggleFilter('expense')"
    >
      <div class="icon">📉</div>
      <div class="details">
        <span class="label">{{ t.totalExpense }}</span>
        <span class="value">{{ Math.abs(totalExpense).toFixed(2) }} <small>{{ currency }}</small></span>
      </div>

      <div v-if="activePopover === 'expense'" class="card-popover" @click.stop>
        <p class="pop-title">{{ isRo ? 'Top categorii cheltuieli' : 'Top expense categories' }}</p>
        <div v-if="topExpenseCategories.length === 0" class="pop-empty">
          {{ isRo ? 'Nu există date pentru această perioadă.' : 'No data for this period.' }}
        </div>
        <template v-else>
          <div v-for="(cat, i) in topExpenseCategories" :key="cat.name" class="popover-row">
            <span class="pop-rank">{{ i + 1 }}.</span>
            <span class="pop-label">{{ cat.label }}</span>
            <span class="pop-value expense">{{ fmtVal(cat.amount) }}</span>
            <span class="pop-pct">{{ cat.percent }}%</span>
          </div>
        </template>
      </div>
    </div>

    <!-- CARD: Curs Valutar -->
    <div
      class="summary-card exchange-rate interactive-card"
      @mousemove="trackMouse"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <div class="icon">💱</div>
      <div class="details">
        <span class="label">{{ t.globalRate }}</span>
        <div class="rates-wrapper">
          <span v-if="isLoading" class="loading-text">...</span>
          <template v-else>
            <span v-if="currency !== 'EUR'" class="currency-line">1 € = <strong>{{ getRate('EUR') }}</strong> {{ currency }}</span>
            <span v-if="currency !== 'USD'" class="currency-line">1 $ = <strong>{{ getRate('USD') }}</strong> {{ currency }}</span>
            <span v-if="currency !== 'RON'" class="currency-line">1 RON = <strong>{{ getRate('RON') }}</strong> {{ currency }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Floating bubble curs valutar -->
    <div
      v-if="showTooltip && !isLoading"
      class="floating-bubble"
      :style="{ top: mouseY + 'px', left: mouseX + 'px' }"
    >
      <h4>🌍 {{ t.otherCurrencies }} {{ currency }}):</h4>
      <div class="bubble-grid">
        <span class="bubble-line">🇬🇧 1 £ = <strong>{{ getRate('GBP') }}</strong> {{ currency }}</span>
        <span class="bubble-line">🇨🇭 1 CHF = <strong>{{ getRate('CHF') }}</strong> {{ currency }}</span>
        <span class="bubble-line">🇲🇩 1 MDL = <strong>{{ getRate('MDL') }}</strong> {{ currency }}</span>
        <span class="bubble-line">🇦🇪 1 AED = <strong>{{ getRate('AED') }}</strong> {{ currency }}</span>
        <span class="bubble-line">🇹🇷 1 TRY = <strong>{{ getRate('TRY') }}</strong> {{ currency }}</span>
        <span class="bubble-line">🇨🇦 1 CAD = <strong>{{ getRate('CAD') }}</strong> {{ currency }}</span>
        <span class="bubble-line">🇦🇺 1 AUD = <strong>{{ getRate('AUD') }}</strong> {{ currency }}</span>
        <span class="bubble-line">🇭🇺 100 HUF = <strong>{{ getRate100('HUF') }}</strong> {{ currency }}</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, inject } from 'vue'

const t = inject('t')
const isRo = computed(() => t.value.locale === 'ro-RO')

const props = defineProps({
  transactions: Array,
  currentFilter: String,
  currency: { type: String, default: 'RON' }
})
const emit = defineEmits(['filter-changed', 'rates-loaded'])

const totalIncome  = computed(() => props.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0))
const totalExpense = computed(() => props.transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
const currentBalance = computed(() => totalIncome.value + totalExpense.value)

const fmtVal = (val) => `${Math.abs(val).toFixed(2)} ${props.currency}`

// --- Top categorii pentru popover-uri ---
const topExpenseCategories = computed(() => {
  const expenses = props.transactions.filter(tx => tx.amount < 0)
  const total = expenses.reduce((s, tx) => s + Math.abs(tx.amount), 0)
  if (total === 0) return []
  const map = {}
  expenses.forEach(tx => {
    const cat = tx.category || 'Altele'
    map[cat] = (map[cat] || 0) + Math.abs(tx.amount)
  })
  return Object.entries(map)
    .map(([name, amount]) => ({ name, label: t.value.catMap?.[name] || name, amount, percent: Math.round((amount / total) * 100) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
})

const topIncomeCategories = computed(() => {
  const incomes = props.transactions.filter(tx => tx.amount > 0)
  const total = incomes.reduce((s, tx) => s + tx.amount, 0)
  if (total === 0) return []
  const map = {}
  incomes.forEach(tx => {
    const cat = tx.category || 'Altele'
    map[cat] = (map[cat] || 0) + tx.amount
  })
  return Object.entries(map)
    .map(([name, amount]) => ({ name, label: t.value.catMap?.[name] || name, amount, percent: Math.round((amount / total) * 100) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
})

// --- Popover state ---
const activePopover = ref(null)
const containerRef  = ref(null)

const toggleFilter = (type) => {
  if (props.currentFilter === type) {
    emit('filter-changed', null)
    activePopover.value = null
  } else {
    emit('filter-changed', type)
    activePopover.value = type
  }
}

const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    if (props.currentFilter !== null) emit('filter-changed', null)
    activePopover.value = null
  }
}

// --- Curs valutar ---
const apiRates  = ref(null)
const isLoading = ref(true)

const getRate = (target) => {
  if (!apiRates.value) return '0.0000'
  const base = apiRates.value[props.currency] || 1
  const tgt  = apiRates.value[target] || 1
  return (base / tgt).toFixed(4)
}
const getRate100 = (target) => {
  if (!apiRates.value) return '0.0000'
  const base = apiRates.value[props.currency] || 1
  const tgt  = apiRates.value[target] || 1
  return ((base / tgt) * 100).toFixed(4)
}

const showTooltip = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)
const trackMouse = (e) => { mouseX.value = e.clientX + 15; mouseY.value = e.clientY + 15 }

const sendRatesToApp = () => {
  if (apiRates.value) {
    emit('rates-loaded', {
      EUR: apiRates.value['RON'] / apiRates.value['EUR'],
      USD: apiRates.value['RON'] / apiRates.value['USD']
    })
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  const today = new Date().toISOString().split('T')[0]
  const cached = localStorage.getItem('exchangeRatesGlobalV4')
  if (cached) {
    const parsed = JSON.parse(cached)
    if (parsed.date === today && parsed.rates) {
      apiRates.value = parsed.rates
      isLoading.value = false
      sendRatesToApp()
      return
    }
  }
  try {
    const res  = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
    const data = await res.json()
    if (data?.rates) {
      apiRates.value = data.rates
      localStorage.setItem('exchangeRatesGlobalV4', JSON.stringify({ date: today, rates: data.rates }))
      sendRatesToApp()
    }
  } catch (e) { console.error(e) } finally { isLoading.value = false }
})

onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>

<style scoped>
.summary-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  overflow: visible;
}

.summary-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  gap: 15px;
  border: 2px solid transparent;
  transition: all 0.2s;
  overflow: visible;
}
.filter-card    { cursor: pointer; }
.filter-card:hover { transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0,0,0,0.1); }
.interactive-card { cursor: default; }

.balance.active-filter,
.income.active-filter,
.expense.active-filter { z-index: 20; }

.balance.active-filter { border-color: #3498db; background: #f0f8ff; }
.income.active-filter  { border-color: #2ecc71; background: #f0fff4; }
.expense.active-filter { border-color: #e74c3c; background: #fff0f0; }

.icon { font-size: 30px; background: #f8f9fa; min-width: 55px; height: 55px; display: flex; justify-content: center; align-items: center; border-radius: 50%; transition: 0.3s; }
.details { display: flex; flex-direction: column; width: 100%; }
.label  { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; margin-bottom: 5px; }
.value  { font-size: 20px; font-weight: 800; color: #2c3e50; }
.value small { font-size: 13px; font-weight: normal; color: #95a5a6; }

.balance .icon  { background: #e3f2fd; color: #3498db; }
.income .icon   { background: #e8f8f5; color: #2ecc71; }
.income .value  { color: #27ae60; }
.expense .icon  { background: #fdedec; color: #e74c3c; }
.expense .value { color: #c0392b; }
.exchange-rate .icon { background: #f3e5f5; color: #8e44ad; }

.rates-wrapper { display: flex; flex-direction: column; gap: 2px; }
.currency-line  { font-size: 14px; color: #2c3e50; }
.currency-line strong { color: #8e44ad; font-size: 15px; }
.loading-text   { font-size: 13px; color: #95a5a6; font-style: italic; }

/* --- POPOVER --- */
.card-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 210px;
  max-width: 250px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.13);
  border: 1px solid #e2e8f0;
  padding: 12px 14px;
  z-index: 9999;
  animation: fadeIn 0.15s ease;
}

.pop-title {
  margin: 0 0 8px 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #95a5a6;
  font-weight: bold;
}

.pop-empty {
  font-size: 13px;
  color: #95a5a6;
  font-style: italic;
  text-align: center;
  padding: 4px 0;
}

.popover-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
}

.pop-icon  { font-size: 14px; flex-shrink: 0; }
.pop-rank  { color: #95a5a6; font-size: 12px; flex-shrink: 0; width: 16px; }
.pop-label { flex: 1; color: #34495e; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pop-value { font-weight: 700; white-space: nowrap; flex-shrink: 0; }
.pop-value.income  { color: #27ae60; }
.pop-value.expense { color: #c0392b; }
.pop-pct   { color: #95a5a6; font-size: 11px; flex-shrink: 0; width: 32px; text-align: right; }

.pop-divider { border: none; border-top: 1px solid #f1f3f5; margin: 6px 0; }

/* --- FLOATING BUBBLE curs valutar --- */
.floating-bubble { position: fixed; pointer-events: none; z-index: 9999; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 15px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 10px; animation: fadeIn 0.2s ease-out; border: 1px solid rgba(142,68,173,0.2); min-width: 200px; }
.floating-bubble h4 { margin: 0; font-size: 13px; color: #7f8c8d; text-transform: uppercase; border-bottom: 1px solid #ecf0f1; padding-bottom: 5px; }
.bubble-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 15px; }
.bubble-line { font-size: 13px; color: #2c3e50; white-space: nowrap; }
.bubble-line strong { color: #8e44ad; }

/* --- DARK MODE --- */
body.dark-mode .summary-card { background: #1a1a2e !important; }
body.dark-mode .label  { color: #a5b1c2 !important; }
body.dark-mode .value, body.dark-mode .currency-line { color: #f1f1f1 !important; }
body.dark-mode .balance .icon  { background: #0f3460 !important; }
body.dark-mode .income .icon   { background: rgba(46,204,113,0.2) !important; }
body.dark-mode .income .value  { color: #2ecc71 !important; }
body.dark-mode .expense .icon  { background: rgba(231,76,60,0.2) !important; }
body.dark-mode .expense .value { color: #e74c3c !important; }
body.dark-mode .exchange-rate .icon { background: rgba(142,68,173,0.2) !important; color: #9b59b6 !important; }
body.dark-mode .currency-line strong { color: #be2edd !important; }
body.dark-mode .balance.active-filter { border-color: #3498db !important; background: rgba(52,152,219,0.1) !important; }
body.dark-mode .income.active-filter  { border-color: #2ecc71 !important; background: rgba(46,204,113,0.1) !important; }
body.dark-mode .expense.active-filter { border-color: #e74c3c !important; background: rgba(231,76,60,0.1) !important; }

body.dark-mode .card-popover { background: #16213e !important; border-color: #0f3460 !important; box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important; }
body.dark-mode .pop-title  { color: #6c7a89 !important; }
body.dark-mode .pop-label  { color: #dfe6e9 !important; }
body.dark-mode .pop-empty  { color: #6c7a89 !important; }
body.dark-mode .pop-rank   { color: #6c7a89 !important; }
body.dark-mode .pop-pct    { color: #6c7a89 !important; }
body.dark-mode .pop-value.income  { color: #2ecc71 !important; }
body.dark-mode .pop-value.expense { color: #e74c3c !important; }
body.dark-mode .pop-divider { border-top-color: #0f3460 !important; }

body.dark-mode .floating-bubble { background: rgba(22,33,62,0.95) !important; border-color: #0f3460 !important; box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important; }
body.dark-mode .floating-bubble h4 { color: #a5b1c2 !important; border-bottom-color: #16213e !important; }
body.dark-mode .bubble-line { color: #f1f1f1 !important; }
body.dark-mode .bubble-line strong { color: #be2edd !important; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

/* === RESPONSIVE MOBIL === */
@media (max-width: 768px) {
  .summary-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }
  .summary-card {
    padding: 14px;
    gap: 10px;
  }
  .icon {
    min-width: 44px;
    height: 44px;
    font-size: 22px;
  }
  .value {
    font-size: 16px;
  }
  .label {
    font-size: 11px;
  }
  .currency-line {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .summary-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .summary-card {
    padding: 12px;
    gap: 8px;
  }
  .icon {
    min-width: 38px;
    height: 38px;
    font-size: 18px;
  }
  .value {
    font-size: 14px;
  }
  .label {
    font-size: 10px;
    letter-spacing: 0;
  }
  .card-popover {
    left: 0;
    right: 0;
    min-width: 0;
    max-width: calc(100vw - 32px);
  }
  .floating-bubble {
    max-width: calc(100vw - 32px);
  }
  .bubble-grid {
    grid-template-columns: 1fr;
  }
}
</style>
