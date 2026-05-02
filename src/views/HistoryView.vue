<template>
  <div class="history-page">

    <div class="page-header">
      <div>
        <h2>📋 {{ isRo ? 'Istoric Complet' : 'Full History' }}</h2>
        <p class="page-subtitle">{{ isRo ? 'Toate tranzactiile, filtrate si sortate' : 'All transactions, filtered and sorted' }}</p>
      </div>
      <button @click="doExportCSV" class="export-btn">
        {{ isRo ? '📥 Descarca CSV' : '📥 Export CSV' }}
      </button>
    </div>

    <!-- Bara de filtre -->
    <div class="filters-bar">
      <!-- Cautare -->
      <input
        class="filter-input"
        type="text"
        v-model="localSearch"
        :placeholder="isRo ? 'Cauta tranzactie...' : 'Search transaction...'"
      />

      <!-- Tip -->
      <div class="filter-toggle">
        <button :class="['ftbtn', { active: localType === 'all' }]"     @click="localType = 'all'">
          {{ isRo ? 'Toate' : 'All' }}
        </button>
        <button :class="['ftbtn', { active: localType === 'income' }]"  @click="localType = 'income'">
          {{ isRo ? 'Venituri' : 'Income' }}
        </button>
        <button :class="['ftbtn', { active: localType === 'expense' }]" @click="localType = 'expense'">
          {{ isRo ? 'Cheltuieli' : 'Expenses' }}
        </button>
      </div>

      <!-- Categorie -->
      <select class="filter-select" v-model="localCategory">
        <option value="">{{ isRo ? 'Toate categoriile' : 'All categories' }}</option>
        <option v-for="cat in availableCategories" :key="cat" :value="cat">
          {{ t.catMap?.[cat] || cat }}
        </option>
      </select>

      <!-- Perioada (sinc cu TimeNavigator) -->
      <div class="filter-toggle">
        <button :class="['ftbtn', { active: viewUnit === 'day' }]"   @click="viewUnit = 'day'">
          {{ isRo ? 'Zi' : 'Day' }}
        </button>
        <button :class="['ftbtn', { active: viewUnit === 'week' }]"  @click="viewUnit = 'week'">
          {{ isRo ? 'Sapt' : 'Week' }}
        </button>
        <button :class="['ftbtn', { active: viewUnit === 'month' }]" @click="viewUnit = 'month'">
          {{ isRo ? 'Luna' : 'Month' }}
        </button>
        <button :class="['ftbtn', { active: viewUnit === 'year' }]"  @click="viewUnit = 'year'">
          {{ isRo ? 'An' : 'Year' }}
        </button>
      </div>

      <!-- Sortare -->
      <select class="filter-select" v-model="localSort">
        <option value="date-desc">{{ isRo ? 'Data: noua → veche' : 'Date: newest first' }}</option>
        <option value="date-asc">{{ isRo  ? 'Data: veche → noua' : 'Date: oldest first' }}</option>
        <option value="amount-desc">{{ isRo ? 'Suma: mare → mica'  : 'Amount: high → low' }}</option>
        <option value="amount-asc">{{ isRo  ? 'Suma: mica → mare'  : 'Amount: low → high' }}</option>
      </select>
    </div>

    <!-- Sumar filtre active -->
    <div class="results-row">
      <span class="results-count">
        {{ filteredTransactions.length }}
        {{ isRo ? 'tranzactii' : 'transactions' }}
      </span>
      <span v-if="localSearch || localCategory || localType !== 'all'" class="clear-link" @click="clearFilters">
        {{ isRo ? '✕ Sterge filtrele' : '✕ Clear filters' }}
      </span>
    </div>

    <!-- Empty state -->
    <div v-if="filteredTransactions.length === 0" class="empty-history">
      <div class="empty-icon">📭</div>
      <p>{{ isRo ? 'Nicio tranzactie gasita.' : 'No transactions found.' }}</p>
    </div>

    <!-- Lista -->
    <div v-else class="transaction-list">
      <div
        v-for="item in filteredTransactions"
        :key="item.id"
        class="tx-item"
      >
        <div class="tx-left">
          <span class="tx-icon">{{ item.displayAmount > 0 ? '📈' : '📉' }}</span>
          <div class="tx-info">
            <span class="tx-name">{{ item.name }}</span>
            <span class="tx-meta">{{ t.catMap?.[item.category] || item.category }} · {{ item.date }}</span>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount" :class="item.displayAmount > 0 ? 'income' : 'expense'">
            {{ item.displayAmount > 0 ? '+' : '' }}{{ item.displayAmount.toFixed(2) }} {{ currSymbol }}
          </span>
          <button class="icon-btn" @click="openEditModal(item)" title="Edit">✏️</button>
          <button class="icon-btn del" @click="handleDeleteTransaction(item.id)" title="Delete">🗑️</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'

const t               = inject('t')
const transactions    = inject('transactions')
const activeCurrency  = inject('activeCurrency')
const globalRates     = inject('globalRates')
const viewUnit        = inject('viewUnit')
const referenceDate   = inject('referenceDate')
const handleDeleteTransaction = inject('handleDeleteTransaction')
const openEditModal   = inject('openEditModal')

const isRo = computed(() => t.value.locale === 'ro-RO')

const localSearch   = ref('')
const localType     = ref('all')
const localCategory = ref('')
const localSort     = ref('date-desc')

const clearFilters = () => {
  localSearch.value   = ''
  localType.value     = 'all'
  localCategory.value = ''
}

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

// Calculeaza range de date dupa viewUnit + referenceDate
const periodRange = computed(() => {
  const refDate = new Date(referenceDate.value)
  let startDate, endDate
  if (viewUnit.value === 'day') {
    startDate = new Date(refDate); startDate.setHours(0, 0, 0, 0)
    endDate   = new Date(refDate); endDate.setHours(23, 59, 59, 999)
  } else if (viewUnit.value === 'month') {
    startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
    endDate   = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59)
  } else if (viewUnit.value === 'year') {
    startDate = new Date(refDate.getFullYear(), 0, 1)
    endDate   = new Date(refDate.getFullYear(), 11, 31, 23, 59, 59)
  } else {
    const day  = refDate.getDay()
    const diff = refDate.getDate() - day + (day === 0 ? -6 : 1)
    startDate = new Date(refDate.getFullYear(), refDate.getMonth(), diff); startDate.setHours(0, 0, 0, 0)
    endDate   = new Date(refDate.getFullYear(), refDate.getMonth(), diff + 6); endDate.setHours(23, 59, 59, 999)
  }
  return { startDate, endDate }
})

const filteredTransactions = computed(() => {
  const { startDate, endDate } = periodRange.value
  let result = transactions.value
    .filter(tx => {
      const d = new Date(tx.date)
      return d >= startDate && d <= endDate
    })
    .map(tx => ({ ...tx, displayAmount: toAct(tx.amount) }))

  if (localType.value === 'income')  result = result.filter(tx => tx.displayAmount > 0)
  if (localType.value === 'expense') result = result.filter(tx => tx.displayAmount < 0)

  if (localCategory.value) result = result.filter(tx => tx.category === localCategory.value)

  if (localSearch.value.trim()) {
    const q = localSearch.value.toLowerCase()
    result = result.filter(tx => tx.name.toLowerCase().includes(q))
  }

  return [...result].sort((a, b) => {
    if (localSort.value === 'date-desc')   return new Date(b.date) - new Date(a.date)
    if (localSort.value === 'date-asc')    return new Date(a.date) - new Date(b.date)
    if (localSort.value === 'amount-desc') return Math.abs(b.displayAmount) - Math.abs(a.displayAmount)
    if (localSort.value === 'amount-asc')  return Math.abs(a.displayAmount) - Math.abs(b.displayAmount)
    return 0
  })
})

// Categoriile unice din perioada selectata
const availableCategories = computed(() => {
  const { startDate, endDate } = periodRange.value
  return [...new Set(
    transactions.value
      .filter(tx => { const d = new Date(tx.date); return d >= startDate && d <= endDate })
      .map(tx => tx.category)
      .filter(Boolean)
  )].sort()
})

// Export CSV
const doExportCSV = () => {
  const BOM = '﻿'
  const headers = isRo.value
    ? 'Data,Nume,Categorie,Suma,Tip\n'
    : 'Date,Name,Category,Amount,Type\n'
  let csv = BOM + headers
  filteredTransactions.value.forEach(item => {
    const name = `"${item.name.replace(/"/g, '""')}"`
    const cat  = t.value.catMap?.[item.category] || item.category
    const type = item.displayAmount > 0
      ? (isRo.value ? 'Venit' : 'Income')
      : (isRo.value ? 'Cheltuiala' : 'Expense')
    csv += `${item.date},${name},${cat},${item.displayAmount.toFixed(2)},${type}\n`
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = isRo.value ? 'Istoric_FinDash.csv' : 'FinDash_History.csv'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}
</script>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.page-header h2 { margin: 0 0 4px 0; font-size: 20px; color: #2c3e50; }
.page-subtitle  { margin: 0; font-size: 13px; color: #95a5a6; }

.export-btn {
  background: #f1f3f5;
  border: 1px solid #dcdde1;
  color: #34495e;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}
.export-btn:hover { background: #3498db; color: white; border-color: #3498db; }

/* Filtere */
.filters-bar {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.filter-input {
  flex: 1;
  min-width: 160px;
  padding: 8px 12px;
  border: 1px solid #dcdde1;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  color: #2c3e50;
  background: white;
  transition: 0.2s;
}
.filter-input:focus { border-color: #3498db; box-shadow: 0 0 0 3px rgba(52,152,219,0.1); }

.filter-select {
  padding: 8px 12px;
  border: 1px solid #dcdde1;
  border-radius: 8px;
  font-size: 13px;
  color: #2c3e50;
  background: white;
  outline: none;
  cursor: pointer;
}

.filter-toggle {
  display: flex;
  gap: 3px;
  background: #f1f3f5;
  padding: 3px;
  border-radius: 8px;
}
.ftbtn {
  padding: 5px 11px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #7f8c8d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
  white-space: nowrap;
}
.ftbtn.active { background: white; color: #2c3e50; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.ftbtn:not(.active):hover { color: #34495e; }

/* Rezultate */
.results-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 4px;
}
.results-count { font-size: 13px; color: #7f8c8d; font-weight: 500; }
.clear-link { font-size: 13px; color: #e74c3c; cursor: pointer; font-weight: 600; }
.clear-link:hover { text-decoration: underline; }

/* Empty */
.empty-history {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  border: 2px dashed #dcdde1;
}
.empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.5; }
.empty-history p { color: #7f8c8d; margin: 0; font-size: 15px; }

/* Lista */
.transaction-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  overflow: hidden;
}

.tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f3f5;
  transition: background 0.15s;
}
.tx-item:last-child { border-bottom: none; }
.tx-item:hover { background: #fafbfc; }

.tx-left  { display: flex; align-items: center; gap: 14px; }
.tx-icon  { font-size: 22px; }
.tx-info  { display: flex; flex-direction: column; gap: 2px; }
.tx-name  { font-weight: 600; color: #2c3e50; font-size: 14px; }
.tx-meta  { font-size: 12px; color: #95a5a6; }

.tx-right  { display: flex; align-items: center; gap: 8px; }
.tx-amount { font-weight: 700; font-size: 15px; min-width: 90px; text-align: right; }
.tx-amount.income  { color: #27ae60; }
.tx-amount.expense { color: #c0392b; }

.icon-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.45;
  transition: 0.2s;
  padding: 4px 6px;
  border-radius: 4px;
}
.icon-btn:hover { opacity: 1; }
.icon-btn.del:hover { background: rgba(231,76,60,0.1); }

/* DARK MODE */
body.dark-mode .page-header,
body.dark-mode .filters-bar,
body.dark-mode .transaction-list { background: #16213e !important; box-shadow: none !important; }

body.dark-mode .page-header h2   { color: #f1f1f1 !important; }
body.dark-mode .page-subtitle    { color: #6c7a89 !important; }
body.dark-mode .export-btn       { background: #1a1a2e !important; border-color: #0f3460 !important; color: #a5b1c2 !important; }
body.dark-mode .export-btn:hover { background: #3498db !important; color: white !important; border-color: #3498db !important; }

body.dark-mode .filter-input  { background: #1a1a2e !important; border-color: #0f3460 !important; color: #f1f1f1 !important; }
body.dark-mode .filter-select { background: #1a1a2e !important; border-color: #0f3460 !important; color: #f1f1f1 !important; }
body.dark-mode .filter-toggle { background: #0f3460 !important; }
body.dark-mode .ftbtn         { color: #a5b1c2 !important; }
body.dark-mode .ftbtn.active  { background: #1a1a2e !important; color: #f1f1f1 !important; box-shadow: none !important; }

body.dark-mode .tx-item       { border-bottom-color: #0f3460 !important; }
body.dark-mode .tx-item:hover { background: #1a1a2e !important; }
body.dark-mode .tx-name       { color: #f1f1f1 !important; }
body.dark-mode .tx-meta       { color: #6c7a89 !important; }
body.dark-mode .results-count { color: #6c7a89 !important; }
body.dark-mode .empty-history { background: #16213e !important; border-color: #0f3460 !important; }
body.dark-mode .empty-history p { color: #6c7a89 !important; }

@media (max-width: 700px) {
  .page-header  { flex-direction: column; gap: 12px; }
  .filters-bar  { flex-direction: column; align-items: stretch; }
  .filter-toggle { justify-content: center; }
  .filter-input, .filter-select { width: 100%; }
}
</style>
