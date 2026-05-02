<template>
  <div>
    <DashboardSummary
      :transactions="dashboardTransactions"
      :currentFilter="activeCardFilter"
      :currency="activeCurrency"
      @filter-changed="setActiveCardFilter"
      @rates-loaded="handleRates"
    />

    <RecurringList
      :recurringTransactions="recurringTransactions"
      @open-manage="openRecurringModal"
      @delete-recurring="handleDeleteRecurring"
      @edit-recurring="openEditRecurring"
      @generate-now="generateNow"
    />

    <BudgetOverview
      :budgets="budgets"
      :spentByCategory="spentByCategory"
      :daysRemaining="daysRemaining"
      :selectedYear="selectedYear"
      :selectedMonth="selectedMonth"
      :viewUnit="viewUnit"
      @open-manage="openBudgetModal"
    />

    <div class="transactions-section">
      <div class="list-header">
        <h3>{{ t.latestTransactions }}</h3>
        <button @click="exportCSV" class="export-btn">
          {{ t.locale === 'ro-RO' ? '📥 Descarcă CSV' : '📥 Export CSV' }}
        </button>
      </div>
      <TransactionFilters
        :searchQuery="searchQuery"
        :selectedCategory="selectedCategory"
        @update:searchQuery="setSearchQuery"
        @update:selectedCategory="setSelectedCategory"
      />
      <TransactionList
        :transactions="latestTen"
        @delete-transaction="handleDeleteTransaction"
        @edit-transaction="openEditModal"
      />
      <div v-if="displayListTransactions.length > 10" class="history-link-row">
        <RouterLink to="/history" class="history-link">
          {{ t.locale === 'ro-RO' ? `📋 Vezi istoricul complet (${displayListTransactions.length} tranzactii)` : `📋 View full history (${displayListTransactions.length} transactions)` }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue'
import { RouterLink } from 'vue-router'

import DashboardSummary from '../components/DashboardSummary.vue'
import RecurringList from '../components/RecurringList.vue'
import BudgetOverview from '../components/BudgetOverview.vue'
import TransactionFilters from '../components/TransactionFilters.vue'
import TransactionList from '../components/TransactionList.vue'

const t = inject('t')
const viewUnit = inject('viewUnit')
const referenceDate = inject('referenceDate')
const activeCurrency = inject('activeCurrency')
const budgets = inject('budgets')
const recurringTransactions = inject('recurringTransactions')
const dashboardTransactions = inject('dashboardTransactions')
const displayListTransactions = inject('displayListTransactions')
const spentByCategory = inject('spentByCategory')
const daysRemaining = inject('daysRemaining')
const selectedYear = inject('selectedYear')
const selectedMonth = inject('selectedMonth')

const activeCardFilter = inject('activeCardFilter')
const setActiveCardFilter = inject('setActiveCardFilter')
const searchQuery = inject('searchQuery')
const setSearchQuery = inject('setSearchQuery')
const selectedCategory = inject('selectedCategory')
const setSelectedCategory = inject('setSelectedCategory')

const handleDeleteTransaction = inject('handleDeleteTransaction')
const openEditModal = inject('openEditModal')
const handleDeleteRecurring = inject('handleDeleteRecurring')
const openEditRecurring = inject('openEditRecurring')
const checkAndGenerateRecurring = inject('checkAndGenerateRecurring')
const handleRates = inject('handleRates')
const exportCSV = inject('exportCSV')
const openBudgetModal = inject('openBudgetModal')
const openRecurringModal = inject('openRecurringModal')

const generateNow = () => checkAndGenerateRecurring(true, referenceDate.value)

const latestTen = computed(() => displayListTransactions.value.slice(0, 10))
</script>

<style scoped>
.transactions-section {
  margin-top: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.list-header h3 { margin: 0; font-size: 18px; color: #2c3e50; }
.export-btn {
  background: #f1f3f5;
  border: 1px solid #dcdde1;
  color: #34495e;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}
.export-btn:hover { background: #3498db; color: white; border-color: #3498db; }

body.dark-mode .transactions-section { background: #16213e; box-shadow: none; }
body.dark-mode .list-header h3 { color: #f1f1f1; }
body.dark-mode .export-btn { background: #1a1a2e; border-color: #0f3460; color: #a5b1c2; }
body.dark-mode .export-btn:hover { background: #3498db; color: white; border-color: #3498db; }

.history-link-row { text-align: center; margin-top: 14px; }
.history-link { color: #3498db; font-size: 13px; font-weight: 600; text-decoration: none; padding: 8px 18px; border-radius: 20px; background: rgba(52,152,219,0.08); transition: 0.2s; display: inline-block; }
.history-link:hover { background: rgba(52,152,219,0.18); }
body.dark-mode .history-link { background: rgba(52,152,219,0.12) !important; }
body.dark-mode .history-link:hover { background: rgba(52,152,219,0.25) !important; }
</style>
