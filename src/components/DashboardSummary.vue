<template>
  <div class="summary-container" ref="containerRef">
    
    <div 
      class="summary-card balance filter-card" 
      :class="{ 'active-filter': currentFilter === 'all' }" 
      @click="toggleFilter('all')"
      title="Afișează toate tranzacțiile"
    >
      <div class="icon">💳</div>
      <div class="details">
        <span class="label">Sold Curent</span>
        <span class="value">{{ currentBalance.toFixed(2) }} <small>{{ currency }}</small></span>
      </div>
    </div>

    <div 
      class="summary-card income filter-card" 
      :class="{ 'active-filter': currentFilter === 'income' }" 
      @click="toggleFilter('income')"
      title="Afișează doar veniturile"
    >
      <div class="icon">📈</div>
      <div class="details">
        <span class="label">Total Venituri</span>
        <span class="value">+{{ totalIncome.toFixed(2) }} <small>{{ currency }}</small></span>
      </div>
    </div>

    <div 
      class="summary-card expense filter-card" 
      :class="{ 'active-filter': currentFilter === 'expense' }" 
      @click="toggleFilter('expense')"
      title="Afișează doar cheltuielile"
    >
      <div class="icon">📉</div>
      <div class="details">
        <span class="label">Total Cheltuieli</span>
        <span class="value">{{ Math.abs(totalExpense).toFixed(2) }} <small>{{ currency }}</small></span>
      </div>
    </div>

    <div 
      class="summary-card exchange-rate interactive-card"
      @mousemove="trackMouse"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <div class="icon">💱</div>
      <div class="details">
        <span class="label">Curs Global (Live)</span>
        <div class="rates-wrapper">
          <span v-if="isLoading" class="loading-text">Se încarcă...</span>
          <template v-else>
            <span v-if="currency !== 'EUR'" class="currency-line">1 € = <strong>{{ getRate('EUR') }}</strong> {{ currency }}</span>
            <span v-if="currency !== 'USD'" class="currency-line">1 $ = <strong>{{ getRate('USD') }}</strong> {{ currency }}</span>
            <span v-if="currency !== 'RON'" class="currency-line">1 RON = <strong>{{ getRate('RON') }}</strong> {{ currency }}</span>
          </template>
        </div>
      </div>
    </div>

    <div 
      v-if="showTooltip && !isLoading" 
      class="floating-bubble" 
      :style="{ top: mouseY + 'px', left: mouseX + 'px' }"
    >
      <h4>🌍 Alte monede (în {{ currency }}):</h4>
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
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  transactions: Array,
  currentFilter: String,
  currency: { type: String, default: 'RON' }
})
const emit = defineEmits(['filter-changed', 'rates-loaded'])

const totalIncome = computed(() => props.transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0))
const totalExpense = computed(() => props.transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))
const currentBalance = computed(() => totalIncome.value + totalExpense.value)

// --- LOGICA DE SELECȚIE (CLICK EXTERIOR) ---
const containerRef = ref(null)

const toggleFilter = (type) => {
  if (props.currentFilter === type) {
    emit('filter-changed', null) 
  } else {
    emit('filter-changed', type)
  }
}

const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    if (props.currentFilter !== null) emit('filter-changed', null)
  }
}

// --- LOGICA CURS VALUTAR DINAMIC ---
const apiRates = ref(null)
const isLoading = ref(true)

// FORMULA MAGICĂ: Calculează cât valorează 1 unitate din "Moneda Țintă" raportat la "Moneda Activă"
const getRate = (targetCurrency) => {
  if (!apiRates.value) return '0.0000'
  const baseValue = apiRates.value[props.currency] || 1 
  const targetValue = apiRates.value[targetCurrency] || 1 
  return (baseValue / targetValue).toFixed(4)
}

// Special pentru forinți (Afișăm pentru 100 de unități)
const getRate100 = (targetCurrency) => {
  if (!apiRates.value) return '0.0000'
  const baseValue = apiRates.value[props.currency] || 1
  const targetValue = apiRates.value[targetCurrency] || 1
  return ((baseValue / targetValue) * 100).toFixed(4)
}

const showTooltip = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)
const trackMouse = (event) => { mouseX.value = event.clientX + 15; mouseY.value = event.clientY + 15 }

// Trimitem cursurile de bază (RON) către App.vue pentru a putea filtra tranzacțiile corect
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
  // Am schimbat numele cache-ului la V4 pentru a forța descărcarea noii structuri de date
  const cachedData = localStorage.getItem('exchangeRatesGlobalV4')
  
  if (cachedData) {
    const parsedData = JSON.parse(cachedData)
    if (parsedData.date === today && parsedData.rates) {
      apiRates.value = parsedData.rates
      isLoading.value = false
      sendRatesToApp();
      return 
    }
  }

  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
    const data = await response.json()
    if (data && data.rates) {
      apiRates.value = data.rates
      localStorage.setItem('exchangeRatesGlobalV4', JSON.stringify({
        date: today, 
        rates: data.rates
      }))
      sendRatesToApp();
    }
  } catch (error) { 
    console.error("Eroare API:", error) 
  } finally { 
    isLoading.value = false 
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.summary-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px; }
.summary-card { display: flex; align-items: center; padding: 20px; border-radius: 12px; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); gap: 15px; border: 2px solid transparent; transition: all 0.2s; }
.filter-card { cursor: pointer; }
.filter-card:hover { transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0,0,0,0.1); }
.interactive-card { cursor: default; }
.balance.active-filter { border-color: #3498db; background: #f0f8ff; }
.income.active-filter { border-color: #2ecc71; background: #f0fff4; }
.expense.active-filter { border-color: #e74c3c; background: #fff0f0; }
.icon { font-size: 30px; background: #f8f9fa; min-width: 55px; height: 55px; display: flex; justify-content: center; align-items: center; border-radius: 50%; transition: 0.3s; }
.details { display: flex; flex-direction: column; width: 100%; }
.label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; margin-bottom: 5px; }
.value { font-size: 20px; font-weight: 800; color: #2c3e50; }
.value small { font-size: 13px; font-weight: normal; color: #95a5a6; }
.balance .icon { background: #e3f2fd; color: #3498db; }
.income .icon { background: #e8f8f5; color: #2ecc71; }
.income .value { color: #27ae60; }
.expense .icon { background: #fdedec; color: #e74c3c; }
.expense .value { color: #c0392b; }
.exchange-rate .icon { background: #f3e5f5; color: #8e44ad; }
.rates-wrapper { display: flex; flex-direction: column; gap: 2px; }
.currency-line { font-size: 14px; color: #2c3e50; }
.currency-line strong { color: #8e44ad; font-size: 15px; }
.loading-text { font-size: 13px; color: #95a5a6; font-style: italic; }
.floating-bubble { position: fixed; pointer-events: none; z-index: 9999; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); padding: 15px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 10px; animation: fadeIn 0.2s ease-out; border: 1px solid rgba(142, 68, 173, 0.2); min-width: 200px; }
.floating-bubble h4 { margin: 0; font-size: 13px; color: #7f8c8d; text-transform: uppercase; border-bottom: 1px solid #ecf0f1; padding-bottom: 5px;}
.bubble-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 15px; }
.bubble-line { font-size: 13px; color: #2c3e50; white-space: nowrap; }
.bubble-line strong { color: #8e44ad; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@media (max-width: 768px) { .summary-container { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .summary-container { grid-template-columns: 1fr; } }
body.dark-mode .summary-card { background: #1a1a2e; }
body.dark-mode .label { color: #a5b1c2; }
body.dark-mode .value, body.dark-mode .currency-line { color: #f1f1f1; }
body.dark-mode .balance .icon { background: #0f3460; }
body.dark-mode .income .icon { background: rgba(46, 204, 113, 0.2); }
body.dark-mode .income .value { color: #2ecc71; }
body.dark-mode .expense .icon { background: rgba(231, 76, 60, 0.2); }
body.dark-mode .expense .value { color: #e74c3c; }
body.dark-mode .exchange-rate .icon { background: rgba(142, 68, 173, 0.2); color: #9b59b6; }
body.dark-mode .currency-line strong { color: #be2edd; }
body.dark-mode .balance.active-filter { border-color: #3498db; background: rgba(52, 152, 219, 0.1); }
body.dark-mode .income.active-filter { border-color: #2ecc71; background: rgba(46, 204, 113, 0.1); }
body.dark-mode .expense.active-filter { border-color: #e74c3c; background: rgba(231, 76, 60, 0.1); }
body.dark-mode .floating-bubble { background: rgba(22, 33, 62, 0.95); border-color: #0f3460; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
body.dark-mode .floating-bubble h4 { color: #a5b1c2; border-bottom-color: #16213e;}
body.dark-mode .bubble-line { color: #f1f1f1; }
body.dark-mode .bubble-line strong { color: #be2edd; }
</style>