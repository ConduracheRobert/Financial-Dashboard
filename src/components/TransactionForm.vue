<template>
  <div class="smart-form">
    
    <div v-if="errorMessage" class="error-banner">
      ⚠️ {{ errorMessage }}
    </div>

    <div class="type-toggle">
      <button 
        type="button" 
        class="toggle-btn income" 
        :class="{ active: transactionType === 'income' }"
        @click="transactionType = 'income'"
      >
        <span class="icon">➕</span> Venit
      </button>
      <button 
        type="button" 
        class="toggle-btn expense" 
        :class="{ active: transactionType === 'expense' }"
        @click="transactionType = 'expense'"
      >
        <span class="icon">➖</span> Cheltuială
      </button>
    </div>

    <form @submit.prevent="submitForm" class="form-grid">
      
      <div class="input-group">
        <label>Nume Tranzacție</label>
        <input 
          type="text" 
          v-model="name" 
          :placeholder="namePlaceholder" 
          maxlength="30"
        />
      </div>

      <div class="input-group">
        <label>Categorie</label>
        <select v-model="category">
          <option disabled value="">Selectează o categorie...</option>
          <option v-for="cat in currentCategories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="input-group">
        <label>Sumă</label>
        <div class="amount-wrapper">
          <input 
            type="number" 
            v-model="amount" 
            placeholder="0.00" 
            step="0.01" 
            min="0.01"
          />
        </div>
      </div>

      <div class="input-group">
        <label>Data</label>
        <input 
          type="date" 
          v-model="date" 
          :max="todayString"
        />
      </div>

      <button type="submit" class="submit-btn" :class="transactionType">
        {{ transactionType === 'income' ? 'Adaugă Venit' : 'Adaugă Cheltuială' }}
      </button>

    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['add-transaction'])

// Data de azi (formatată corect)
const todayString = new Date().toISOString().split('T')[0]

// Stările formularului
const transactionType = ref('expense')
const name = ref('')
const amount = ref('')
const category = ref('')
const date = ref(todayString)
const errorMessage = ref('')

// Categorii predefinite
const expenseCategories = ['Mâncare', 'Transport', 'Facturi & Utilități', 'Cumpărături', 'Divertisment', 'Sănătate', 'Educație', 'Casă', 'Altele']
const incomeCategories = ['Salariu', 'Bonus', 'Investiții', 'Cadouri primite', 'Vânzări', 'Altele']

// Placeholder inteligent pentru nume
const namePlaceholder = computed(() => {
  return transactionType.value === 'expense' 
    ? 'Ex: Cafea, Chirie, Supermarket...' 
    : 'Ex: Salariu, Bonus, Bani primiți...'
})

// Schimbă lista de categorii în funcție de butonul apăsat
const currentCategories = computed(() => {
  return transactionType.value === 'expense' ? expenseCategories : incomeCategories
})

// Când schimbi tipul, resetăm categoria selectată
watch(transactionType, () => {
  category.value = ''
})

const submitForm = () => {
  errorMessage.value = '' // Resetăm erorile

  // 1. Validări
  if (!name.value.trim()) {
    errorMessage.value = 'Te rog să introduci un nume pentru tranzacție.'
    return
  }
  if (!amount.value || amount.value <= 0) {
    errorMessage.value = 'Suma introdusă trebuie să fie mai mare decât 0.'
    return
  }
  if (!category.value) {
    errorMessage.value = 'Te rog să selectezi o categorie.'
    return
  }
  if (date.value > todayString) {
    errorMessage.value = 'Eroare temporală: Nu poți adăuga o tranzacție din viitor!'
    return
  }

  // 2. Calculăm suma finală
  const numericAmount = Math.abs(parseFloat(amount.value))
  const finalAmount = transactionType.value === 'expense' ? -numericAmount : numericAmount

  // 3. Trimitem datele către App.vue
  emit('add-transaction', {
    name: name.value.trim(),
    amount: finalAmount,
    category: category.value,
    date: date.value,
    type: transactionType.value 
  })

  // 4. Resetăm formularul pentru următoarea utilizare
  name.value = ''
  amount.value = ''
  category.value = ''
}
</script>

<style scoped>
/* ACELAȘI CSS CA ÎNAINTE */
.smart-form { display: flex; flex-direction: column; gap: 20px; }

/* Eroare */
.error-banner { background: #ffeaa7; color: #d63031; padding: 10px 15px; border-radius: 8px; font-size: 14px; font-weight: 500; border-left: 4px solid #d63031; animation: shake 0.3s ease-in-out; }

/* Toggle Tip Tranzacție */
.type-toggle { display: flex; gap: 10px; background: #f1f3f5; padding: 5px; border-radius: 12px; }
.toggle-btn { flex: 1; padding: 10px; border: none; background: transparent; border-radius: 8px; font-weight: bold; color: #7f8c8d; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.toggle-btn.income.active { background: white; color: #2ecc71; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.2); }
.toggle-btn.expense.active { background: white; color: #e74c3c; box-shadow: 0 4px 10px rgba(231, 76, 60, 0.2); }

/* Grid Formular */
.form-grid { display: flex; flex-direction: column; gap: 15px; }
.input-group { display: flex; flex-direction: column; gap: 5px; }
.input-group label { font-size: 13px; font-weight: bold; color: #34495e; text-transform: uppercase; letter-spacing: 0.5px; }
.input-group input, .input-group select { padding: 12px 15px; border: 1px solid #dcdde1; border-radius: 8px; font-size: 15px; transition: 0.2s; outline: none; background: white; color: #2c3e50; font-family: inherit; }
.input-group input:focus, .input-group select:focus { border-color: #3498db; box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1); }

/* Buton Submit */
.submit-btn { margin-top: 10px; padding: 15px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; color: white; cursor: pointer; transition: 0.3s; text-transform: uppercase; letter-spacing: 1px; }
.submit-btn.income { background: #2ecc71; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3); }
.submit-btn.income:hover { background: #27ae60; }
.submit-btn.expense { background: #e74c3c; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3); }
.submit-btn.expense:hover { background: #c0392b; }

@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

/* Adaptare Modal / Dark Mode Global */
:global(body.dark-mode) .type-toggle { background: #0f3460; }
:global(body.dark-mode) .toggle-btn { color: #a5b1c2; }
:global(body.dark-mode) .toggle-btn.income.active, 
:global(body.dark-mode) .toggle-btn.expense.active { background: #1a1a2e; }
:global(body.dark-mode) .input-group label { color: #a5b1c2; }
</style>