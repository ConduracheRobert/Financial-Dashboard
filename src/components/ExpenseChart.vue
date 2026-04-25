<template>
  <div class="chart-container">
    
    <div v-if="!currentFilter" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>Nicio categorie selectată</h3>
      <p>Apasă pe un card de sus (Sold, Venituri sau Cheltuieli) pentru a genera analiza vizuală.</p>
    </div>

    <div v-else>
      <div class="chart-header">
        <h3>{{ chartTitle }}</h3>
        
        <div v-if="showToggle" class="chart-toggle">
          <button :class="{ active: chartView === 'overview' }" @click="chartView = 'overview'">⚖️ Balanță</button>
          <button :class="{ active: chartView === 'expense' }" @click="chartView = 'expense'">📉 Cheltuieli</button>
          <button :class="{ active: chartView === 'income' }" @click="chartView = 'income'">📈 Venituri</button>
        </div>
      </div>
      
      <div v-if="hasDataToChart" class="chart-wrapper">
        <Pie :data="chartDataConfig" :options="chartOptions" />
      </div>
      
      <div v-else class="no-data-message">
        <p>Nu există date în această categorie pentru a genera graficul.</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  transactions: { type: Array, required: true },
  currentFilter: { type: String, default: null } // Acum graficul știe exact ce ai apăsat sus!
})

const chartView = ref('overview')

// Când apeși pe un card, graficul își schimbă modul AUTOMAT
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

const chartTitle = computed(() => {
  if (chartView.value === 'overview') return '⚖️ Balanță: Venituri vs. Cheltuieli'
  if (chartView.value === 'expense') return '📊 Distribuția Cheltuielilor'
  return '📊 Sursele de Venit'
})

const chartDataConfig = computed(() => {
  if (chartView.value === 'overview') {
    const totalInc = incomes.value.reduce((sum, t) => sum + t.amount, 0)
    const totalExp = Math.abs(expenses.value.reduce((sum, t) => sum + t.amount, 0))
    return {
      labels: ['Total Venituri', 'Total Cheltuieli'],
      datasets: [{
        data: [totalInc, totalExp],
        backgroundColor: ['#2ecc71', '#e74c3c'], 
        hoverOffset: 10, borderWidth: 2, borderColor: '#ffffff'
      }]
    }
  }

  const currentDataToChart = chartView.value === 'expense' ? expenses.value : incomes.value
  const categoryTotals = {}
  
  currentDataToChart.forEach(t => {
    const cat = t.category || 'Altele'
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount)
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
.chart-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 20px; transition: 0.3s; }

/* STILURI PENTRU STAREA GOALĂ (NOU) */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 250px; text-align: center; color: #7f8c8d; background: #f8f9fa;
  border-radius: 12px; border: 2px dashed #dcdde1;
}
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

/* Adaptare Dark Mode */
body.dark-mode .chart-container { background: #1a1a2e; }
body.dark-mode h3 { color: #f1f1f1; }
body.dark-mode .empty-state { background: #16213e; border-color: #0f3460; }
body.dark-mode .empty-state h3 { color: #f1f1f1; }
body.dark-mode .chart-toggle { background: #0f3460; }
body.dark-mode .chart-toggle button { color: #a5b1c2; }
body.dark-mode .chart-toggle button:hover { color: #f1f1f1; }
body.dark-mode .chart-toggle button.active { background: #1a1a2e; color: #f1f1f1; }
body.dark-mode .no-data-message { background: #16213e; color: #a5b1c2; }
</style>