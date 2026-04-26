<template>
  <div class="smart-form">
    
    <div v-if="errorMessage" class="error-banner">
      ⚠️ {{ errorMessage }}
    </div>

    <div class="type-toggle">
      <button type="button" class="toggle-btn income" :class="{ active: transactionType === 'income' }" @click="transactionType = 'income'">
        <span class="icon">➕</span> {{ t.incomeToggle }}
      </button>
      <button type="button" class="toggle-btn expense" :class="{ active: transactionType === 'expense' }" @click="transactionType = 'expense'">
        <span class="icon">➖</span> {{ t.expenseToggle }}
      </button>
    </div>

    <form @submit.prevent="submitForm" class="form-grid">
      
      <div class="input-group">
        <label>{{ t.transName }}</label>
        <input type="text" v-model="name" :placeholder="namePlaceholder" maxlength="30" />
      </div>

      <div class="input-group">
        <label>{{ t.category }}</label>
        <select v-model="category">
          <option disabled value="">{{ t.selectCategoryOpt }}</option>
          <option v-for="key in currentCategoryKeys" :key="key" :value="key">
            {{ t.catMap[key] }}
          </option>
        </select>
      </div>

      <div class="input-group">
        <label>{{ t.amount }}</label>
        <div class="amount-wrapper">
          <input type="number" v-model="amount" placeholder="0.00" step="0.01" min="0.01" />
        </div>
      </div>

      <div class="input-group">
        <label>{{ t.date }}</label>
        <input type="date" v-model="date" :max="todayString" />
      </div>

      <button type="submit" class="submit-btn" :class="transactionType">
        {{ transactionToEdit ? (t.locale === 'ro-RO' ? '💾 Salvează Modificările' : '💾 Save Changes') : (transactionType === 'income' ? t.addIncomeBtn : t.addExpenseBtn) }}
      </button>

    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'

const t = inject('t')
const emit = defineEmits(['add-transaction'])

// Prindem datele trimise de App.vue
const props = defineProps({
  transactionToEdit: { type: Object, default: null }
})

const todayString = new Date().toISOString().split('T')[0]
const transactionType = ref('expense')
const name = ref('')
const amount = ref('')
const category = ref('')
const date = ref(todayString)
const errorMessage = ref('')

const expenseKeys = ['Mâncare', 'Transport', 'Facturi & Utilități', 'Cumpărături', 'Divertisment', 'Sănătate', 'Educație', 'Casă', 'Altele']
const incomeKeys = ['Salariu', 'Bonus', 'Investiții', 'Cadouri primite', 'Vânzări', 'Altele']

const currentCategoryKeys = computed(() => transactionType.value === 'expense' ? expenseKeys : incomeKeys)
const namePlaceholder = computed(() => transactionType.value === 'expense' ? t.value.placeholderExpense : t.value.placeholderIncome)

// Magia AICI: Când se deschide formularul, verificăm dacă avem date de editat
watch(() => props.transactionToEdit, (newVal) => {
  if (newVal) {
    // Dacă DA, umplem căsuțele cu datele vechi
    transactionType.value = newVal.amount > 0 ? 'income' : 'expense'
    name.value = newVal.name
    amount.value = Math.abs(newVal.amount)
    category.value = newVal.category
    date.value = newVal.date
  } else {
    // Dacă NU (e tranzacție nouă), lăsăm gol
    transactionType.value = 'expense'
    name.value = ''
    amount.value = ''
    category.value = ''
    date.value = todayString
  }
}, { immediate: true }) // Rulăm verificarea instant

// Resetează categoria doar dacă utilizatorul dă click MANUAL pe tipul tranzacției, 
// nu și când încărcăm datele automate.
watch(transactionType, (newType, oldType) => {
  if (oldType && !props.transactionToEdit) {
    category.value = ''
  }
})

const submitForm = () => {
  errorMessage.value = ''
  if (!name.value.trim()) { errorMessage.value = t.value.validationName; return }
  if (!amount.value || amount.value <= 0) { errorMessage.value = t.value.validationAmount; return }
  if (!category.value) { errorMessage.value = t.value.validationCategory; return }
  if (date.value > todayString) { errorMessage.value = t.value.validationDate; return }

  const numericAmount = Math.abs(parseFloat(amount.value))
  const finalAmount = transactionType.value === 'expense' ? -numericAmount : numericAmount

  // Trimitem pachetul înapoi, INCLUZÂND ID-ul dacă există
  emit('add-transaction', {
    id: props.transactionToEdit ? props.transactionToEdit.id : undefined,
    name: name.value.trim(), 
    amount: finalAmount, 
    category: category.value, 
    date: date.value, 
    type: transactionType.value 
  })
}
</script>

<style scoped>
.smart-form { display: flex; flex-direction: column; gap: 20px; }
.error-banner { background: #ffeaa7; color: #d63031; padding: 10px 15px; border-radius: 8px; font-size: 14px; font-weight: 500; border-left: 4px solid #d63031; animation: shake 0.3s ease-in-out; }
.type-toggle { display: flex; gap: 10px; background: #f1f3f5; padding: 5px; border-radius: 12px; }
.toggle-btn { flex: 1; padding: 10px; border: none; background: transparent; border-radius: 8px; font-weight: bold; color: #7f8c8d; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.toggle-btn.income.active { background: white; color: #2ecc71; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.2); }
.toggle-btn.expense.active { background: white; color: #e74c3c; box-shadow: 0 4px 10px rgba(231, 76, 60, 0.2); }
.form-grid { display: flex; flex-direction: column; gap: 15px; }
.input-group { display: flex; flex-direction: column; gap: 5px; }
.input-group label { font-size: 13px; font-weight: bold; color: #34495e; text-transform: uppercase; letter-spacing: 0.5px; }
.input-group input, .input-group select { padding: 12px 15px; border: 1px solid #dcdde1; border-radius: 8px; font-size: 15px; transition: 0.2s; outline: none; background: white; color: #2c3e50; font-family: inherit; }
.input-group input:focus, .input-group select:focus { border-color: #3498db; box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1); }
.submit-btn { margin-top: 10px; padding: 15px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; color: white; cursor: pointer; transition: 0.3s; text-transform: uppercase; letter-spacing: 1px; }
.submit-btn.income { background: #2ecc71; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3); }
.submit-btn.income:hover { background: #27ae60; }
.submit-btn.expense { background: #e74c3c; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3); }
.submit-btn.expense:hover { background: #c0392b; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

/* --- FORȚARE DARK MODE PENTRU BUTOANE (Varianta Nucleară) --- */
:global(body.dark-mode) .type-toggle { background-color: #0f3460 !important; }
:global(body.dark-mode) .toggle-btn { color: #a5b1c2 !important; }
:global(body.dark-mode) .toggle-btn.income.active { 
  background-color: #1a1a2e !important; 
  color: #2ecc71 !important; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; 
}
:global(body.dark-mode) .toggle-btn.expense.active { 
  background-color: #1a1a2e !important; 
  color: #e74c3c !important; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; 
}
</style>