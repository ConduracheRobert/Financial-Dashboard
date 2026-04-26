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
/* Păstrează CSS-ul tău existent, dar adaugă asta la final: */
.edit-btn { background: transparent; border: none; cursor: pointer; font-size: 16px; opacity: 0.5; transition: 0.2s; margin-right: 5px; }
.edit-btn:hover { opacity: 1; transform: scale(1.1); filter: brightness(1.2); }
/* RESTUL STILURILOR TALE RĂMÂN AICI... */
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
</style>

<style scoped>
/* CSS-ul a rămas același ca înainte */
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
</style>