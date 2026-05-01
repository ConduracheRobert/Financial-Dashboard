<template>
  <div class="budget-manager">

    <!-- Lista bugetelor existente -->
    <div v-if="budgets.length > 0" class="existing-budgets">
      <h4>{{ isRo ? 'Bugete active' : 'Active budgets' }}</h4>
      <div v-for="b in budgets" :key="b.id" class="budget-row">
        <div class="budget-row-info">
          <span class="budget-row-cat">{{ t.catMap[b.category] || b.category }}</span>
          <span class="budget-row-amount">{{ b.limitAmount }} RON / {{ isRo ? 'lună' : 'month' }}</span>
        </div>
        <div class="budget-row-actions">
          <button class="icon-btn edit" @click="startEdit(b)" title="Edit">✏️</button>
          <button class="icon-btn delete" @click="$emit('delete-budget', b.id)" title="Delete">🗑️</button>
        </div>
      </div>
      <hr class="divider" />
    </div>

    <!-- Formular adăugare / editare -->
    <div class="budget-form">
      <h4>
        {{ editingId
          ? (isRo ? '✏️ Editează buget' : '✏️ Edit budget')
          : (isRo ? '+ Adaugă buget nou' : '+ Add new budget') }}
      </h4>

      <div v-if="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</div>

      <div class="input-group">
        <label>{{ isRo ? 'Categorie cheltuială' : 'Expense category' }}</label>
        <select v-model="selectedCategory" :disabled="!!editingId">
          <option disabled value="">
            {{ isRo ? 'Selectează o categorie...' : 'Select a category...' }}
          </option>
          <option v-for="key in availableCategories" :key="key" :value="key">
            {{ t.catMap[key] || key }}
          </option>
        </select>
      </div>

      <div class="input-group">
        <label>{{ isRo ? 'Limită lunară (RON)' : 'Monthly limit (RON)' }}</label>
        <input
          type="number"
          v-model.number="limitAmount"
          :placeholder="isRo ? 'ex: 800' : 'e.g. 800'"
          min="1"
          step="1"
        />
      </div>

      <div class="form-actions">
        <button v-if="editingId" class="cancel-btn" @click="cancelEdit">
          {{ isRo ? 'Anulează' : 'Cancel' }}
        </button>
        <button class="submit-btn" @click="submitForm">
          {{ editingId
            ? (isRo ? '💾 Salvează modificările' : '💾 Save changes')
            : (isRo ? '+ Adaugă buget' : '+ Add budget') }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'

const t = inject('t')
const isRo = computed(() => t.value.locale === 'ro-RO')

const props = defineProps({
  budgets: { type: Array, required: true }
})

const emit = defineEmits(['save-budget', 'delete-budget'])

const ALL_EXPENSE_KEYS = [
  'Mâncare', 'Transport', 'Facturi & Utilități', 'Cumpărături',
  'Divertisment', 'Sănătate', 'Educație', 'Casă', 'Altele'
]

const selectedCategory = ref('')
const limitAmount = ref('')
const editingId = ref(null)
const errorMsg = ref('')

const availableCategories = computed(() => {
  const usedCategories = props.budgets
    .filter(b => b.id !== editingId.value)
    .map(b => b.category)
  return ALL_EXPENSE_KEYS.filter(k => !usedCategories.includes(k))
})

const startEdit = (budget) => {
  editingId.value = budget.id
  selectedCategory.value = budget.category
  limitAmount.value = budget.limitAmount
  errorMsg.value = ''
}

const cancelEdit = () => {
  editingId.value = null
  selectedCategory.value = ''
  limitAmount.value = ''
  errorMsg.value = ''
}

const submitForm = () => {
  errorMsg.value = ''

  if (!selectedCategory.value) {
    errorMsg.value = isRo.value ? 'Selectează o categorie.' : 'Please select a category.'
    return
  }
  if (!limitAmount.value || limitAmount.value <= 0) {
    errorMsg.value = isRo.value
      ? 'Limita trebuie să fie un număr pozitiv.'
      : 'Limit must be a positive number.'
    return
  }

  emit('save-budget', {
    id: editingId.value ?? undefined,
    category: selectedCategory.value,
    limitAmount: Math.round(limitAmount.value)
  })

  cancelEdit()
}
</script>

<style scoped>
.budget-manager { display: flex; flex-direction: column; gap: 16px; }

/* LISTA EXISTENTA */
.existing-budgets h4,
.budget-form h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #7f8c8d;
  font-weight: bold;
}

.budget-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 6px;
  border: 1px solid #f1f3f5;
}

.budget-row-info { display: flex; flex-direction: column; gap: 2px; }
.budget-row-cat  { font-weight: bold; color: #2c3e50; font-size: 14px; }
.budget-row-amount { font-size: 12px; color: #7f8c8d; }

.budget-row-actions { display: flex; gap: 6px; }
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
.icon-btn.edit:hover   { background: rgba(52, 152, 219, 0.1); }

.divider { border: none; border-top: 1px solid #f1f3f5; margin: 4px 0 4px 0; }

/* FORMULAR */
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
.input-group select:disabled { opacity: 0.6; cursor: not-allowed; }

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
:global(body.dark-mode) .budget-row {
  background: #1a1a2e !important;
  border-color: #0f3460 !important;
}
:global(body.dark-mode) .budget-row-cat    { color: #f1f1f1 !important; }
:global(body.dark-mode) .budget-row-amount { color: #a5b1c2 !important; }
:global(body.dark-mode) .existing-budgets h4,
:global(body.dark-mode) .budget-form h4   { color: #a5b1c2 !important; }
:global(body.dark-mode) .divider          { border-top-color: #0f3460 !important; }
:global(body.dark-mode) .input-group label { color: #a5b1c2 !important; }
:global(body.dark-mode) .input-group input,
:global(body.dark-mode) .input-group select {
  background: #1a1a2e !important;
  color: #f1f1f1 !important;
  border-color: #0f3460 !important;
}
:global(body.dark-mode) .cancel-btn {
  background: #1a1a2e !important;
  border-color: #0f3460 !important;
  color: #a5b1c2 !important;
}
</style>
