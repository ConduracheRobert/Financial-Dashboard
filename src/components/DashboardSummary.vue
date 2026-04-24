<template>
  <div class="summary-wrapper">
    <div class="budget-setup">
      <label>Buget Lunar (RON):</label>
      <input type="number" v-model="localBudget" @change="$emit('update-budget', localBudget)" />
    </div>

    <div class="progress-container" v-if="expenseTotal < 0">
      <div class="progress-info">
        <span>Consum Buget: {{ Math.abs(expenseTotal).toFixed(2) }} / {{ budget }} RON</span>
        <span>{{ budgetPercent }}%</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" :style="{ width: Math.min(budgetPercent, 100) + '%' }"></div>
      </div>
    </div>

    <div class="summary-cards">
      <div class="card balance">
        <h4>Sold</h4>
        <p :class="balance >= 0 ? 'pos' : 'neg'">{{ balance.toFixed(2) }}</p>
      </div>
      <div class="card inc">
        <h4>Venituri</h4>
        <p>+{{ incomeTotal.toFixed(2) }}</p>
      </div>
      <div class="card exp">
        <h4>Cheltuieli</h4>
        <p>{{ expenseTotal.toFixed(2) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps(['transactions', 'budget'])
const emit = defineEmits(['update-budget'])

// Îmi salvez bugetul într-o variabilă locală ca să îl pot edita direct din formular
const localBudget = ref(props.budget)
watch(() => props.budget, (newVal) => localBudget.value = newVal)

// Îmi calculez automat totalul veniturilor filtrând doar sumele pozitive
const incomeTotal = computed(() => 
  props.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
)

// Îmi calculez automat totalul cheltuielilor filtrând doar sumele negative
const expenseTotal = computed(() => 
  props.transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)
)

// Balanța mea curentă este simpla adunare a celor două valori
const balance = computed(() => incomeTotal.value + expenseTotal.value)

// Calculez procentul din buget pe care l-am consumat, asigurându-mă că nu împart la zero
const budgetPercent = computed(() => {
  if (!props.budget || props.budget <= 0) return 0
  return Math.round((Math.abs(expenseTotal.value) / props.budget) * 100)
})
</script>

<style scoped>
.summary-wrapper { margin-bottom: 20px; }
.budget-setup { background: white; padding: 10px 15px; border-radius: 10px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.budget-setup input { width: 100px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; text-align: center; font-weight: bold; }
.progress-container { background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.progress-info { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; font-weight: bold; color: #34495e; }
.progress-bar-bg { background: #ecf0f1; height: 10px; border-radius: 5px; overflow: hidden; }
.progress-bar-fill { background: #3498db; height: 100%; transition: width 0.5s ease; }
.summary-cards { display: flex; gap: 10px; }
.card { flex: 1; background: white; padding: 10px; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
h4 { margin: 0; font-size: 11px; color: #7f8c8d; text-transform: uppercase; }
p { margin: 5px 0 0; font-weight: bold; font-size: 14px; }
.pos { color: #2ecc71; }
.neg { color: #e74c3c; }
.exp p { color: #e74c3c; }
.inc p { color: #2ecc71; }
</style>