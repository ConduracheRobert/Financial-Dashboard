<template>
  <div class="list-container">
    <div class="list-header">
      <h3>Istoric Tranzacții</h3>
      <button v-if="transactions.length > 0" @click="exportToCSV" class="export-btn" title="Descarcă raportul în format Excel">
        📊 Descarcă CSV
      </button>
    </div>

    <div v-if="transactions.length === 0" class="no-data">
      Nu există tranzacții în această perioadă.
    </div>

    <div v-else class="transaction-item" v-for="t in transactions" :key="t.id">
      
      <template v-if="editingId !== t.id">
        <div class="t-info">
          <span class="name">{{ t.name }}</span>
          <span class="date">{{ new Date(t.date).toLocaleDateString('ro-RO') }}</span>
          <span class="category-badge">{{ t.category || 'Altele' }}</span>
        </div>
        <div class="t-actions">
          <span :class="['amount', t.amount > 0 ? 'pos' : 'neg']">
            {{ t.amount > 0 ? '+' : '' }}{{ t.amount.toFixed(2) }} RON
          </span>
          <button @click="startInlineEdit(t)" class="edit-btn" title="Editează">✏️</button>
          <button @click="requestDelete(t)" class="del-btn" title="Șterge">🗑️</button>
        </div>
      </template>

      <template v-else>
        <div class="inline-edit-form">
          <input v-model="editForm.name" type="text" placeholder="Nume" />
          <select v-model="editForm.category">
            <option value="Salariu">Salariu</option>
            <option value="Mâncare">Mâncare</option>
            <option value="Facturi">Facturi</option>
            <option value="Transport">Transport</option>
            <option value="Divertisment">Divertisment</option>
            <option value="Altele">Altele</option>
          </select>
          <input v-model="editForm.amount" type="number" placeholder="Sumă" />
          <input v-model="editForm.date" type="date" />
          
          <div class="edit-actions-btns">
            <button type="button" @click.prevent="saveInlineEdit" class="save-btn">💾 Salvează</button>
            <button type="button" @click.prevent="cancelInlineEdit" class="cancel-btn">❌ Anulează</button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="transactionToDelete" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-content">
        <div class="modal-icon">⚠️</div>
        <h4>Confirmare Ștergere</h4>
        <p>Ești sigur că vrei să ștergi tranzacția <strong>"{{ transactionToDelete.name }}"</strong>?</p>
        <p class="modal-amount">Valoare: {{ transactionToDelete.amount }} RON</p>
        
        <div class="modal-actions">
          <button @click="cancelDelete" class="modal-cancel-btn">Anulează</button>
          <button @click="confirmDelete" class="modal-delete-btn">Da, șterge definitiv</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps(['transactions'])
const emit = defineEmits(['delete-transaction', 'save-transaction'])

// Editare Inline
const editingId = ref(null)
const editForm = ref({ id: null, name: '', amount: 0, category: '', date: '' })

const startInlineEdit = (transaction) => {
  editingId.value = transaction.id
  editForm.value = { ...transaction }
}
const cancelInlineEdit = () => { editingId.value = null }
const saveInlineEdit = () => {
  emit('save-transaction', editForm.value)
  editingId.value = null
}

// Logica pentru Modalul de Ștergere
const transactionToDelete = ref(null) // Aici ținem minte ce vrem să ștergem

const requestDelete = (transaction) => {
  transactionToDelete.value = transaction // Deschide modalul cu datele tranzacției
}

const cancelDelete = () => {
  transactionToDelete.value = null // Închide modalul fără să facă nimic
}

const confirmDelete = () => {
  emit('delete-transaction', transactionToDelete.value.id) // Trimite semnalul real de ștergere
  transactionToDelete.value = null // Închide modalul
}

// Export CSV cu BOM pentru diacritice
const exportToCSV = () => {
  const headers = ['Data', 'Nume', 'Categorie', 'Suma (RON)']
  const rows = props.transactions.map(t => {
    const dataFormatata = new Date(t.date).toLocaleDateString('ro-RO')
    const categorie = t.category || 'Altele'
    return `"${dataFormatata}","${t.name}","${categorie}","${t.amount}"`
  })

  const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'raport_financiar.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
/* Stilurile vechi */
.list-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-top: 20px; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #f1f3f5; padding-bottom: 10px; }
.list-header h3 { margin: 0; color: #2c3e50; }
.export-btn { background-color: #27ae60; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.2s; }
.export-btn:hover { background-color: #2ecc71; transform: translateY(-2px); }
.no-data { text-align: center; color: #7f8c8d; font-style: italic; padding: 20px 0; }
.transaction-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f3f5; }
.transaction-item:last-child { border-bottom: none; }
.t-info { display: flex; flex-direction: column; gap: 4px; }
.name { font-weight: bold; color: #34495e; font-size: 15px; }
.date { font-size: 12px; color: #95a5a6; }
.category-badge { background: #ecf0f1; padding: 3px 8px; border-radius: 12px; font-size: 11px; color: #7f8c8d; width: max-content; }
.t-actions { display: flex; align-items: center; gap: 10px; }
.amount { font-weight: bold; font-size: 16px; }
.amount.pos { color: #2ecc71; }
.amount.neg { color: #e74c3c; }
.del-btn, .edit-btn { background: none; border: none; font-size: 16px; cursor: pointer; transition: transform 0.2s; padding: 5px; }
.del-btn:hover, .edit-btn:hover { transform: scale(1.2); }

.inline-edit-form { width: 100%; display: flex; flex-wrap: wrap; gap: 10px; background: #f8f9fa; padding: 15px; border-radius: 8px; box-sizing: border-box; }
.inline-edit-form input, .inline-edit-form select { flex: 1; min-width: 120px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; }
.edit-actions-btns { display: flex; gap: 10px; width: 100%; justify-content: flex-end; margin-top: 5px; }
.save-btn { background: #2ecc71; color: white; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; }
.cancel-btn { background: #e74c3c; color: white; border: none; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; }

/* STILURI NOI PENTRU MODAL */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(3px); }
.modal-content { background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: popIn 0.3s ease-out; }
.modal-icon { font-size: 40px; margin-bottom: 10px; }
.modal-content h4 { margin: 0 0 15px 0; color: #2c3e50; font-size: 20px; }
.modal-content p { color: #7f8c8d; margin-bottom: 10px; line-height: 1.5; }
.modal-amount { font-weight: bold; font-size: 18px; color: #e74c3c !important; }
.modal-actions { display: flex; justify-content: space-between; gap: 15px; margin-top: 25px; }
.modal-cancel-btn { flex: 1; padding: 10px; background: #ecf0f1; border: none; border-radius: 8px; color: #2c3e50; font-weight: bold; cursor: pointer; transition: 0.2s; }
.modal-cancel-btn:hover { background: #bdc3c7; }
.modal-delete-btn { flex: 1; padding: 10px; background: #e74c3c; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: 0.2s; }
.modal-delete-btn:hover { background: #c0392b; box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3); }

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Adaptare Dark Mode */
body.dark-mode .modal-content { background: #1a1a2e; color: #f1f1f1; }
body.dark-mode .modal-content h4 { color: #fff; }
body.dark-mode .modal-cancel-btn { background: #16213e; color: #f1f1f1; }
body.dark-mode .modal-cancel-btn:hover { background: #0f3460; }
/* --- ADAPTARE DARK MODE --- */
:global(body.dark-mode) .transaction-list,
:global(body.dark-mode) .list-container,
:global(body.dark-mode) .empty-state {
  background-color: transparent; /* Se contopește cu fundalul părintelui */
  border: none;
  color: #f1f1f1;
}
:global(body.dark-mode) .transaction-item {
  background-color: #1a1a2e;
  border: 1px solid #0f3460;
}
:global(body.dark-mode) .transaction-item:hover {
  background-color: #0f3460;
}
:global(body.dark-mode) .transaction-item .name { 
  color: #f1f1f1; 
}
:global(body.dark-mode) .empty-state p {
  color: #a5b1c2;
}
</style>