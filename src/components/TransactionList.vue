<template>
  <div class="list-container">
    <div v-if="transactions.length === 0" class="empty-list">
      <div class="empty-icon">📭</div>
      <p>{{ t.emptyHistory }}</p>
    </div>

    <div v-else class="transaction-list">
      <div v-for="item in transactions" :key="item.id" class="transaction-item">
        <div class="item-details">
          <span class="icon">{{ item.amount > 0 ? '📈' : '📉' }}</span>
          <div class="info">
            <span class="name">{{ item.name }}</span>
            <span class="category-date">{{ t.catMap[item.category] || item.category }} • {{ item.date }}</span>
          </div>
        </div>
        <div class="item-actions">
          <span class="amount" :class="item.amount > 0 ? 'income' : 'expense'">
            {{ item.amount > 0 ? '+' : '' }}{{ item.amount.toFixed(2) }}
          </span>
          <button class="edit-btn" @click="$emit('edit-transaction', item)" title="Edit">✏️</button>
          <button class="delete-btn" @click="$emit('delete-transaction', item.id)" title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
const t = inject('t')
defineProps({ transactions: { type: Array, required: true } })
// Declarăm noul eveniment de editare
defineEmits(['delete-transaction', 'edit-transaction']) 
</script>

<style scoped>

.edit-btn { background: transparent; border: none; cursor: pointer; font-size: 16px; opacity: 0.5; transition: 0.2s; margin-right: 5px; }
.edit-btn:hover { opacity: 1; transform: scale(1.1); filter: brightness(1.2); }

.empty-list { text-align: center; padding: 40px 20px; color: #7f8c8d; background: #f8f9fa; border-radius: 12px; border: 2px dashed #dcdde1; }
.empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.5; }
.transaction-list { display: flex; flex-direction: column; gap: 10px; }
.transaction-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border: 1px solid #f1f3f5; border-radius: 10px; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
.item-details { display: flex; align-items: center; gap: 15px; }
.icon { font-size: 24px; }
.info { display: flex; flex-direction: column; }
.name { font-weight: bold; color: #2c3e50; font-size: 15px; }
.category-date { font-size: 12px; color: #95a5a6; margin-top: 3px; }
.item-actions { display: flex; align-items: center; gap: 10px; }
.amount { font-weight: 900; font-size: 16px; }
.amount.income { color: #27ae60; }
.amount.expense { color: #c0392b; }
.delete-btn { background: transparent; border: none; cursor: pointer; font-size: 18px; opacity: 0.5; transition: 0.2s; }
.delete-btn:hover { opacity: 1; transform: scale(1.1); }

@media (max-width: 768px) {
  .transaction-item { flex-wrap: wrap; padding: 12px; row-gap: 8px; }
  .item-details { min-width: 0; flex: 1 1 65%; gap: 10px; }
  .info { min-width: 0; }
  .name { font-size: 14px; white-space: normal; overflow-wrap: break-word; }
  .category-date { font-size: 12px; white-space: normal; overflow-wrap: break-word; }
  .item-actions { flex-shrink: 0; margin-left: auto; }
  .amount { font-size: 14px; }
}

@media (max-width: 480px) {
  .transaction-item { padding: 10px; }
  .icon { font-size: 20px; }
}
</style>
