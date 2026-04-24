<template>
  <div class="chart-container">
    <h3>📊 Distribuție Cheltuieli</h3>
    <div v-if="hasExpenses" class="chart-wrapper">
      <Pie :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="empty-state">
      Adaugă o cheltuială (cu minus) pentru a genera graficul.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  transactions: { type: Array, required: true }
})

// Verific dacă am cel puțin o cheltuială (sumă negativă)
const hasExpenses = computed(() => {
  return props.transactions.some(t => t.amount < 0)
})

const chartData = computed(() => {
  // 1. Iau doar cheltuielile
  const expenses = props.transactions.filter(t => t.amount < 0)

  // 2. Le grupez matematic pe categorii (adun sumele)
  const categoryTotals = {}
  expenses.forEach(t => {
    const cat = t.category || 'Altele'
    if (!categoryTotals[cat]) categoryTotals[cat] = 0
    categoryTotals[cat] += Math.abs(t.amount) // Transform suma în pozitiv pentru grafic
  })

  // 3. Extrag etichetele (categoriile) și datele (sumele)
  const labels = Object.keys(categoryTotals)
  const data = Object.values(categoryTotals)

  // 4. Creez o paletă de culori profesionale
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9b59b6', '#e67e22']

  return {
    labels: labels,
    datasets: [
      {
        backgroundColor: colors.slice(0, labels.length),
        data: data,
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' }
  }
}
</script>

<style scoped>
.chart-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px; text-align: center; }
h3 { margin-top: 0; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
.chart-wrapper { position: relative; height: 250px; width: 100%; display: flex; justify-content: center; }
.empty-state { color: #95a5a6; font-style: italic; padding: 40px 0; }
</style>