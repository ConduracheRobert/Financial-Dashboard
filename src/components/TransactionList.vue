<template>
  <div class="list-container">
    <div class="list-header">
      <h3>Istoric Tranzacții</h3>
      <button v-if="transactions.length > 0" @click="exportToCSV" class="export-btn">
        📥 Export CSV
      </button>
    </div>
    
    <div v-if="transactions.length === 0" class="empty-state">
      Nu ai nicio tranzacție înregistrată încă.
    </div>

    <ul v-else>
      <li v-for="t in transactions" :key="t.id" class="transaction-item">
        <div class="info">
          <span class="name">{{ t.name }}</span>
          <span class="category-badge">{{ t.category || 'Altele' }}</span> 
        </div>
        
        <div class="actions">
          <span :class="['amount', t.amount < 0 ? 'expense' : 'income']">
            {{ t.amount > 0 ? '+' : '' }}{{ t.amount }} RON
          </span>
          <button @click="$emit('edit-transaction', t)" class="action-btn edit-btn">✏️</button>
          <button @click="$emit('delete-transaction', t.id)" class="action-btn delete-btn">🗑️</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  transactions: {
    type: Array,
    required: true
  }
})

defineEmits(['delete-transaction', 'edit-transaction'])

const exportToCSV = () => {
  const headers = ['Nume', 'Categorie', 'Suma (RON)', 'Data']
  
  const rows = props.transactions.map(t => [
    `"${t.name}"`,
    `"${t.category || 'Altele'}"`,
    t.amount,
    t.date
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', 'raport_tranzactii.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.list-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

h3 { margin: 0; color: #2c3e50; }

.export-btn {
  background-color: #34495e;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: 0.3s;
}

.export-btn:hover { background-color: #2c3e50; }

.empty-state { text-align: center; color: #95a5a6; font-style: italic; padding: 20px 0; }
ul { list-style: none; padding: 0; margin: 0; }
.transaction-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; }
.info { display: flex; flex-direction: column; gap: 5px; }
.name { font-weight: bold; color: #333; }
.category-badge { font-size: 11px; background: #ecf0f1; padding: 3px 8px; border-radius: 12px; color: #7f8c8d; display: inline-block; width: max-content;}
.actions { display: flex; align-items: center; gap: 10px; }
.amount { font-weight: bold; margin-right: 5px; }
.expense { color: #e74c3c; }
.income { color: #2ecc71; }
.action-btn { background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.6; transition: 0.3s; padding: 0; }
.action-btn:hover { opacity: 1; transform: scale(1.1); }
</style>