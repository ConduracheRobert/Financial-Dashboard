<template>
  <div class="recurring-manager">

    <!-- Lista existenta -->
    <div v-if="recurringTransactions.length > 0" class="existing-list">
      <h4>{{ isRo ? 'Recurențe active' : 'Active recurring' }}</h4>
      <div v-for="r in recurringTransactions" :key="r.id" class="recurring-row">
        <div class="row-info">
          <span class="row-name">{{ r.name }}</span>
          <span class="row-meta">
            {{ r.amount > 0 ? '+' : '' }}{{ r.amount.toFixed(0) }} RON
            · {{ r.frequency === 'lunar' ? (isRo ? 'lunar' : 'monthly') : (isRo ? 'anual' : 'yearly') }}
            · {{ isRo ? 'ziua' : 'day' }} {{ r.dayOfMonth }}
          </span>
        </div>
        <button class="icon-btn delete" @click="$emit('delete-recurring', r.id)">🗑️</button>
      </div>
      <hr class="divider" />
    </div>

    <!-- Formular adaugare / editare -->
    <div class="recurring-form">
      <h4>
        {{ editingRecurring
          ? (isRo ? '✏️ Editează recurență' : '✏️ Edit recurring')
          : (isRo ? '+ Adaugă recurență nouă' : '+ Add new recurring') }}
      </h4>

      <div v-if="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>

      <!-- Tip -->
      <div class="input-group">
        <label>{{ isRo ? 'Tip tranzacție' : 'Transaction type' }}</label>
        <div class="type-toggle">
          <button :class="['type-btn', { active: tipForm === 'cheltuiala' }]" @click="tipForm = 'cheltuiala'">
            📉 {{ isRo ? 'Cheltuială' : 'Expense' }}
          </button>
          <button :class="['type-btn', { active: tipForm === 'venit' }]" @click="tipForm = 'venit'">
            📈 {{ isRo ? 'Venit' : 'Income' }}
          </button>
        </div>
      </div>

      <!-- Nume -->
      <div class="input-group">
        <label>{{ isRo ? 'Nume' : 'Name' }}</label>
        <input
          type="text"
          v-model="nameForm"
          :placeholder="isRo ? 'ex: Chirie, Salariu...' : 'e.g. Rent, Salary...'"
        />
      </div>

      <!-- Suma -->
      <div class="input-group">
        <label>{{ isRo ? 'Sumă (RON)' : 'Amount (RON)' }}</label>
        <input
          type="number"
          v-model.number="amountForm"
          :placeholder="isRo ? 'ex: 1500' : 'e.g. 1500'"
          min="1"
          step="1"
        />
      </div>

      <!-- Categorie -->
      <div class="input-group">
        <label>{{ isRo ? 'Categorie' : 'Category' }}</label>
        <select v-model="categoryForm">
          <option disabled value="">{{ isRo ? 'Selectează...' : 'Select...' }}</option>
          <option v-for="key in availableCategories" :key="key" :value="key">
            {{ t.catMap[key] || key }}
          </option>
        </select>
      </div>

      <!-- Frecventa -->
      <div class="input-group">
        <label>{{ isRo ? 'Frecvență' : 'Frequency' }}</label>
        <select v-model="frequencyForm">
          <option value="lunar">{{ isRo ? 'Lunar' : 'Monthly' }}</option>
          <option value="anual">{{ isRo ? 'Anual' : 'Yearly' }}</option>
        </select>
      </div>

      <!-- Ziua din luna -->
      <div class="input-group">
        <label>{{ isRo ? 'Ziua din lună (1–28)' : 'Day of month (1–28)' }}</label>
        <input
          type="number"
          v-model.number="dayOfMonthForm"
          min="1"
          max="28"
          placeholder="1–28"
        />
      </div>

      <!-- Luna din an (doar pentru anual) -->
      <div v-if="frequencyForm === 'anual'" class="input-group">
        <label>{{ isRo ? 'Luna din an (1–12)' : 'Month of year (1–12)' }}</label>
        <input
          type="number"
          v-model.number="monthOfYearForm"
          min="1"
          max="12"
          placeholder="1–12"
        />
      </div>

      <div class="form-actions">
        <button v-if="editingRecurring" class="cancel-btn" @click="$emit('cancel-edit')">
          {{ isRo ? 'Anulează' : 'Cancel' }}
        </button>
        <button class="submit-btn" @click="submitForm">
          {{ editingRecurring
            ? (isRo ? '💾 Salvează modificările' : '💾 Save changes')
            : (isRo ? '+ Adaugă recurență' : '+ Add recurring') }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'

const t = inject('t')
const isRo = computed(() => t.value.locale === 'ro-RO')

const props = defineProps({
  recurringTransactions: { type: Array,   required: true },
  editingRecurring:      { type: Object,  default: null  }
})

const emit = defineEmits(['save-recurring', 'delete-recurring', 'cancel-edit'])

const EXPENSE_CATEGORIES = ['Mâncare', 'Transport', 'Facturi & Utilități', 'Cumpărături', 'Divertisment', 'Sănătate', 'Educație', 'Casă', 'Altele']
const INCOME_CATEGORIES  = ['Salariu', 'Bonus', 'Investiții', 'Cadouri primite', 'Vânzări', 'Altele']

const tipForm         = ref('cheltuiala')
const nameForm        = ref('')
const amountForm      = ref('')
const categoryForm    = ref('')
const frequencyForm   = ref('lunar')
const dayOfMonthForm  = ref('')
const monthOfYearForm = ref(1)
const errorMsg        = ref('')

const availableCategories = computed(() =>
  tipForm.value === 'venit' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
)

watch(() => props.editingRecurring, (val) => {
  if (val) {
    tipForm.value         = val.amount < 0 ? 'cheltuiala' : 'venit'
    nameForm.value        = val.name
    amountForm.value      = Math.abs(val.amount)
    categoryForm.value    = val.category
    frequencyForm.value   = val.frequency
    dayOfMonthForm.value  = val.dayOfMonth
    monthOfYearForm.value = val.monthOfYear || 1
    errorMsg.value        = ''
  } else {
    resetForm()
  }
}, { immediate: true })

const resetForm = () => {
  nameForm.value        = ''
  amountForm.value      = ''
  categoryForm.value    = ''
  frequencyForm.value   = 'lunar'
  dayOfMonthForm.value  = ''
  monthOfYearForm.value = 1
  errorMsg.value        = ''
}

const submitForm = () => {
  errorMsg.value = ''

  if (!nameForm.value.trim()) {
    errorMsg.value = isRo.value ? 'Introduceți un nume.' : 'Please enter a name.'
    return
  }
  if (!amountForm.value || amountForm.value <= 0) {
    errorMsg.value = isRo.value ? 'Suma trebuie să fie pozitivă.' : 'Amount must be positive.'
    return
  }
  if (!categoryForm.value) {
    errorMsg.value = isRo.value ? 'Selectați o categorie.' : 'Please select a category.'
    return
  }
  if (!dayOfMonthForm.value || dayOfMonthForm.value < 1 || dayOfMonthForm.value > 28) {
    errorMsg.value = isRo.value ? 'Ziua trebuie să fie între 1 și 28.' : 'Day must be between 1 and 28.'
    return
  }
  if (frequencyForm.value === 'anual' && (monthOfYearForm.value < 1 || monthOfYearForm.value > 12)) {
    errorMsg.value = isRo.value ? 'Luna trebuie să fie între 1 și 12.' : 'Month must be between 1 and 12.'
    return
  }

  const finalAmount = tipForm.value === 'cheltuiala'
    ? -Math.abs(Math.round(amountForm.value))
    :  Math.abs(Math.round(amountForm.value))

  const payload = {
    name:        nameForm.value.trim(),
    amount:      finalAmount,
    category:    categoryForm.value,
    frequency:   frequencyForm.value,
    dayOfMonth:  dayOfMonthForm.value,
    monthOfYear: frequencyForm.value === 'anual' ? monthOfYearForm.value : null
  }
  if (props.editingRecurring?.id) payload.id = props.editingRecurring.id

  emit('save-recurring', payload)
  resetForm()
}
</script>

<style scoped>
.recurring-manager { display: flex; flex-direction: column; gap: 16px; }

.existing-list h4,
.recurring-form h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #7f8c8d;
  font-weight: bold;
}

.recurring-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 6px;
  border: 1px solid #f1f3f5;
}
.row-info { display: flex; flex-direction: column; gap: 2px; }
.row-name { font-weight: bold; color: #2c3e50; font-size: 14px; }
.row-meta { font-size: 12px; color: #7f8c8d; }

.icon-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.5;
  transition: 0.2s;
  padding: 4px;
  border-radius: 4px;
}
.icon-btn:hover { opacity: 1; }
.icon-btn.delete:hover { background: rgba(231, 76, 60, 0.1); }

.divider { border: none; border-top: 1px solid #f1f3f5; margin: 4px 0; }

.error-banner {
  background: #ffeaa7;
  color: #d63031;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  border-left: 4px solid #d63031;
  margin-bottom: 4px;
}

/* toggle tip */
.type-toggle { display: flex; gap: 8px; }
.type-btn {
  flex: 1;
  padding: 9px;
  border: 1px solid #dcdde1;
  border-radius: 8px;
  background: #f8f9fa;
  color: #34495e;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}
.type-btn.active        { background: #3498db; color: white; border-color: #3498db; }
.type-btn:not(.active):hover { background: #e2e6ea; }

.input-group { display: flex; flex-direction: column; gap: 5px; }
.input-group label {
  font-size: 12px;
  font-weight: bold;
  color: #34495e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.input-group input,
.input-group select {
  padding: 11px 14px;
  border: 1px solid #dcdde1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: white;
  color: #2c3e50;
  font-family: inherit;
  transition: 0.2s;
}
.input-group input:focus,
.input-group select:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-actions { display: flex; gap: 10px; margin-top: 4px; }

.submit-btn {
  flex: 1;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}
.submit-btn:hover { background: #2980b9; }

.cancel-btn {
  padding: 12px 16px;
  background: #f1f3f5;
  color: #34495e;
  border: 1px solid #dcdde1;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}
.cancel-btn:hover { background: #e2e6ea; }

/* DARK MODE */
body.dark-mode .recurring-row     { background: #1a1a2e !important; border-color: #0f3460 !important; }
body.dark-mode .row-name          { color: #f1f1f1 !important; }
body.dark-mode .row-meta          { color: #a5b1c2 !important; }
body.dark-mode .existing-list h4,
body.dark-mode .recurring-form h4 { color: #a5b1c2 !important; }
body.dark-mode .divider           { border-top-color: #0f3460 !important; }
body.dark-mode .input-group label { color: #a5b1c2 !important; }
body.dark-mode .input-group input,
body.dark-mode .input-group select {
  background: #1a1a2e !important;
  color: #f1f1f1 !important;
  border-color: #0f3460 !important;
}
body.dark-mode .type-btn          { background: #1a1a2e !important; border-color: #0f3460 !important; color: #a5b1c2 !important; }
body.dark-mode .type-btn.active   { background: #3498db !important; color: white !important; border-color: #3498db !important; }
body.dark-mode .cancel-btn        { background: #1a1a2e !important; border-color: #0f3460 !important; color: #a5b1c2 !important; }
</style>
