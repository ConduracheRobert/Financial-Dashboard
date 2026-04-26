<template>
  <div class="chart-container">
    
    <transition name="pop-fade" mode="out-in">
      
      <div v-if="!currentFilter" class="empty-state" key="empty">
        <div class="empty-icon">📊</div>
        <h3>{{ t.noCategory }}</h3>
        <p>{{ t.selectCategory }}</p>
      </div>

      <div v-else key="chart">
        <div class="chart-header">
          <h3>{{ chartTitle }}</h3>
          
          <div v-if="showToggle" class="chart-toggle">
            <button :class="{ active: chartView === 'overview' }" @click="chartView = 'overview'">⚖️ {{ t.balance }}</button>
            <button :class="{ active: chartView === 'expense' }" @click="chartView = 'expense'">📉 {{ t.expenses }}</button>
            <button :class="{ active: chartView === 'income' }" @click="chartView = 'income'">📈 {{ t.incomes }}</button>
          </div>
        </div>
        
        <div v-if="hasDataToChart" class="chart-wrapper">
          <Pie :data="chartDataConfig" :options="chartOptions" />
        </div>
        
        <div v-else class="no-data-message">
          <p>{{ t.emptyHistory }}</p>
        </div>
      </div>

    </transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

// Aducem dicționarul!
const t = inject('t')

const props = defineProps({
  transactions: { type: Array, required: true },
  currentFilter: { type: String, default: null }
})

const chartView = ref('overview')

watch(() => props.currentFilter, (newFilter) => {
  if (newFilter === 'all') chartView.value = 'overview'
  else if (newFilter === 'expense') chartView.value = 'expense'
  else if (newFilter === 'income') chartView.value = 'income'
}, { immediate: true })

const expenses = computed(() => props.transactions.filter(t => t.amount < 0))
const incomes = computed(() => props.transactions.filter(t => t.amount > 0))

const showToggle = computed(() => expenses.value.length > 0 && incomes.value.length > 0)

const hasDataToChart = computed(() => {
  if (chartView.value === 'overview') return expenses.value.length > 0 || incomes.value.length > 0
  if (chartView.value === 'expense') return expenses.value.length > 0
  if (chartView.value === 'income') return incomes.value.length > 0
  return false
})

// Traducem titlul dinamic folosind t.value (pentru că suntem în script)
const chartTitle = computed(() => {
  if (chartView.value === 'overview') return `⚖️ ${t.value.balance}`
  if (chartView.value === 'expense') return `📊 ${t.value.expenses}`
  return `📊 ${t.value.incomes}`
})

const chartDataConfig = computed(() => {
  if (chartView.value === 'overview') {
    const totalInc = incomes.value.reduce((sum, tr) => sum + tr.amount, 0)
    const totalExp = Math.abs(expenses.value.reduce((sum, tr) => sum + tr.amount, 0))
    return {
      // Traducem etichetele din graficul propriu-zis
      labels: [t.value.totalIncome, t.value.totalExpense],
      datasets: [{
        data: [totalInc, totalExp],
        backgroundColor: ['#2ecc71', '#e74c3c'], 
        hoverOffset: 10, borderWidth: 2, borderColor: '#ffffff'
      }]
    }
  }

  const currentDataToChart = chartView.value === 'expense' ? expenses.value : incomes.value
  const categoryTotals = {}
  
  currentDataToChart.forEach(tr => {
    const cat = tr.category || 'Altele'
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(tr.amount)
  })

  const expenseColors = ['#FF6384', '#FF9F40', '#FFCE56', '#e84393', '#e74c3c', '#d35400', '#c0392b']
  const incomeColors = ['#1abc9c', '#3498db', '#9b59b6', '#16a085', '#2980b9', '#8e44ad']
  const bgColors = chartView.value === 'expense' ? expenseColors : incomeColors

  return {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: bgColors.slice(0, Object.keys(categoryTotals).length),
      hoverOffset: 10, borderWidth: 2, borderColor: '#ffffff'
    }]
  }
})

const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { font: { size: 13, family: 'inherit' }, padding: 20, usePointStyle: true } },
    tooltip: { callbacks: { label: function(context) { return (context.label ? context.label + ': ' : '') + (context.parsed !== null ? context.parsed.toFixed(2) : '') } } }
  }
}
</script>

<style scoped>
/* CSS-ul rămâne exact același */
.chart-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 20px; transition: 0.3s; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 250px; text-align: center; color: #7f8c8d; background: #f8f9fa; border-radius: 12px; border: 2px dashed #dcdde1; }
.empty-icon { font-size: 45px; margin-bottom: 10px; opacity: 0.6; }
.empty-state h3 { margin: 0 0 5px 0; color: #34495e; font-size: 18px; }
.empty-state p { margin: 0; font-size: 14px; max-width: 350px; line-height: 1.4; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
h3 { margin: 0; color: #2c3e50; font-size: 18px; }
.chart-toggle { display: flex; background: #f1f3f5; border-radius: 8px; padding: 4px; }
.chart-toggle button { border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; color: #7f8c8d; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 5px; }
.chart-toggle button:hover { color: #2c3e50; }
.chart-toggle button.active { background: white; color: #2c3e50; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.chart-wrapper { height: 300px; display: flex; justify-content: center; align-items: center; }
.no-data-message { height: 200px; display: flex; align-items: center; justify-content: center; color: #7f8c8d; font-style: italic; background: #f8f9fa; border-radius: 8px; }

/* =========================================
   ANIMAȚIE TRANZIȚIE (Empty State -> Grafic)
   ========================================= */
.pop-fade-enter-active,
.pop-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Cum arată elementul înainte să intre (pleacă de jos, mai mic, transparent) */
.pop-fade-enter-from {
  opacity: 0;
  transform: translateY(15px) scale(0.98);
}

/* Cum arată elementul când iese (se duce în sus, se micșorează, devine transparent) */
.pop-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.98);
}

</style>
