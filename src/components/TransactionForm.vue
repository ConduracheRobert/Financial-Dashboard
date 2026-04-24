<template>
  <div class="form-container">
    <h3>{{ isEditing ? '✏️ Editare Date' : 'Adăugare Date' }}</h3>
    <form @submit.prevent="submitTransaction">
      
      <div class="form-group">
        <label>Nume tranzacție:</label>
        <input type="text" v-model="name" placeholder="Ex: Cafea, Chirie..." required />
      </div>

      <div class="form-group">
        <label>Categorie:</label>
        <select v-model="category" required>
          <option disabled value="">Selectează o categorie...</option>
          <option value="Salariu">Salariu / Venit</option>
          <option value="Mâncare">Mâncare & Cumpărături</option>
          <option value="Facturi">Facturi & Utilități</option>
          <option value="Transport">Transport</option>
          <option value="Divertisment">Divertisment (Ieșiri, Filme)</option>
          <option value="Altele">Altele</option>
        </select>
      </div>

      <div class="form-group">
        <label>Suma (RON):</label>
        <input type="number" v-model="amount" placeholder="0.00" step="0.01" required />
      </div>

      <div class="form-group">
        <label>Data:</label>
        <input type="date" v-model="date" required />
      </div>

      <button type="submit" :class="['submit-btn', isEditing ? 'edit-mode' : '']">
        {{ isEditing ? '💾 SALVEAZĂ MODIFICĂRILE' : '➕ ADAUGĂ TRANZACȚIA' }}
      </button>
      
      <button v-if="isEditing" type="button" class="cancel-btn" @click="cancelEdit">
        Anulează
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  transactionToEdit: { type: Object, default: null }
})

const emit = defineEmits(['save-transaction', 'cancel-edit'])

const name = ref('')
const amount = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const category = ref('')
const isEditing = ref(false)

const resetForm = () => {
  isEditing.value = false
  name.value = ''
  amount.value = ''
  category.value = ''
  date.value = new Date().toISOString().slice(0, 10)
}

watch(() => props.transactionToEdit, (newVal) => {
  if (newVal) {
    isEditing.value = true
    name.value = newVal.name
    amount.value = newVal.amount
    date.value = newVal.date
    category.value = newVal.category
  } else {
    resetForm()
  }
}, { immediate: true })

const submitTransaction = () => {
  if (!name.value || !amount.value || !date.value || !category.value) return

  emit('save-transaction', {
    id: props.transactionToEdit ? props.transactionToEdit.id : null,
    name: name.value,
    amount: parseFloat(amount.value),
    date: date.value,
    category: category.value 
  })

  resetForm()
}

const cancelEdit = () => {
  resetForm()
  emit('cancel-edit')
}
</script>

<style scoped>
.form-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px; }
.form-group { margin-bottom: 15px; text-align: left; }
label { display: block; margin-bottom: 5px; font-size: 14px; font-weight: bold; color: #333; }
input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-family: inherit; }
.submit-btn { width: 100%; background: #42b983; color: white; border: none; padding: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-bottom: 10px;}
.submit-btn:hover { background: #3aa876; }
.submit-btn.edit-mode { background: #3498db; }
.submit-btn.edit-mode:hover { background: #2980b9; }
.cancel-btn { width: 100%; background: transparent; color: #7f8c8d; border: 1px solid #bdc3c7; padding: 10px; border-radius: 6px; cursor: pointer; }
.cancel-btn:hover { background: #ecf0f1; }
</style>