<template>
  <div class="recurring-overview">

    <div class="recurring-header">
      <div class="header-text">
        <h3>🔄 {{ isRo ? 'Tranzacții Recurente' : 'Recurring Transactions' }}</h3>
        <span class="header-subtitle">
          {{ isRo
            ? 'Tranzacțiile se generează automat la deschiderea aplicației, după data setată'
            : 'Transactions are auto-generated when you open the app, after the set date' }}
        </span>
      </div>
      <div class="header-actions">
        <button class="generate-btn" @click="$emit('generate-now')" :title="isRo ? 'Generează acum' : 'Generate now'">
          ▶ {{ isRo ? 'Generează acum' : 'Generate now' }}
        </button>
        <button class="manage-btn" @click="$emit('open-manage')">
          ⚙️ {{ isRo ? 'Gestionează' : 'Manage' }}
        </button>
      </div>
    </div>

    <div v-if="recurringTransactions.length === 0" class="recurring-empty">
      <div class="empty-icon">🔄</div>
      <p class="empty-title">{{ isRo ? 'Nu ai tranzacții recurente.' : 'No recurring transactions.' }}</p>
      <p class="empty-desc">
        {{ isRo
          ? 'Adaugă chirii, salarii sau abonamente care se repetă automat.'
          : 'Add rents, salaries or subscriptions that repeat automatically.' }}
      </p>
      <button class="cta-btn" @click="$emit('open-manage')">
        {{ isRo ? '+ Adaugă prima recurență' : '+ Add your first recurring' }}
      </button>
    </div>

    <div v-else class="recurring-list">
      <div
        v-for="item in recurringTransactions"
        :key="item.id"
        class="recurring-card"
        :class="item.amount > 0 ? 'income' : 'expense'"
      >
        <div class="card-icon" :class="item.amount > 0 ? 'income' : 'expense'">
          {{ item.amount > 0 ? '📈' : '📉' }}
        </div>

        <div class="card-info">
          <span class="card-name">{{ item.name }}</span>
          <span class="card-meta">
            {{ t.catMap[item.category] || item.category }}
            · {{ item.frequency === 'lunar' ? (isRo ? 'lunar' : 'monthly') : (isRo ? 'anual' : 'yearly') }}
            · {{ isRo ? 'ziua' : 'day' }} {{ item.dayOfMonth }}
            <template v-if="item.frequency === 'anual'">
              / {{ isRo ? 'luna' : 'month' }} {{ item.monthOfYear }}
            </template>
          </span>
        </div>

        <span class="card-amount" :class="item.amount > 0 ? 'income' : 'expense'">
          {{ item.amount > 0 ? '+' : '' }}{{ item.amount.toFixed(0) }} RON
        </span>

        <button class="action-btn edit-btn" @click="$emit('edit-recurring', item)" :title="isRo ? 'Editează' : 'Edit'">
          ✏️
        </button>
        <button class="action-btn delete-btn" @click="$emit('delete-recurring', item.id)" :title="isRo ? 'Șterge' : 'Delete'">
          🗑️
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

const t = inject('t')
const isRo = computed(() => t.value.locale === 'ro-RO')

defineProps({
  recurringTransactions: { type: Array, required: true }
})

defineEmits(['open-manage', 'delete-recurring', 'edit-recurring', 'generate-now'])
</script>

<style scoped>
.recurring-overview {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.recurring-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.header-text { display: flex; flex-direction: column; gap: 3px; }
.recurring-header h3 { margin: 0; font-size: 18px; color: #2c3e50; }
.header-subtitle { font-size: 12px; color: #7f8c8d; font-weight: 500; }

.header-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }

.generate-btn {
  background: #f1f3f5;
  border: 1px solid #dcdde1;
  color: #34495e;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}
.generate-btn:hover { background: #2ecc71; color: white; border-color: #2ecc71; }

.manage-btn {
  background: #f1f3f5;
  border: 1px solid #dcdde1;
  color: #34495e;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}
.manage-btn:hover { background: #3498db; color: white; border-color: #3498db; }

.recurring-empty {
  text-align: center;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dcdde1;
}
.empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.5; }
.empty-title { margin: 0 0 6px 0; font-weight: bold; color: #34495e; font-size: 16px; }
.empty-desc  { margin: 0 0 16px 0; color: #7f8c8d; font-size: 14px; }
.cta-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}
.cta-btn:hover { background: #2980b9; }

.recurring-list { display: flex; flex-direction: column; gap: 8px; }

.recurring-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border: 1px solid #f1f3f5;
  border-left: 3px solid #dcdde1;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  transition: 0.2s;
}
.recurring-card.income  { border-left-color: #2ecc71; }
.recurring-card.expense { border-left-color: #e74c3c; }

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.card-icon.income  { background: rgba(46, 204, 113, 0.12); }
.card-icon.expense { background: rgba(231,  76,  60, 0.12); }

.card-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.card-name { font-weight: bold; color: #2c3e50; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-meta { font-size: 11px; color: #95a5a6; margin-top: 2px; }

.card-amount { font-weight: 900; font-size: 15px; white-space: nowrap; flex-shrink: 0; }
.card-amount.income  { color: #27ae60; }
.card-amount.expense { color: #c0392b; }

.action-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.4;
  transition: 0.2s;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 4px;
}
.action-btn:hover    { opacity: 1; }
.edit-btn:hover   { background: rgba(52, 152, 219, 0.1); }
.delete-btn:hover { background: rgba(231,  76,  60, 0.1); }

@media (max-width: 600px) {
  .card-meta { display: none; }
}

/* DARK MODE */
body.dark-mode .recurring-overview  { background: #16213e; box-shadow: none; }
body.dark-mode .recurring-header h3 { color: #f1f1f1; }
body.dark-mode .header-subtitle     { color: #a5b1c2; }
body.dark-mode .generate-btn        { background: #1a1a2e; border-color: #0f3460; color: #a5b1c2; }
body.dark-mode .generate-btn:hover  { background: #2ecc71; color: white; border-color: #2ecc71; }
body.dark-mode .manage-btn          { background: #1a1a2e; border-color: #0f3460; color: #a5b1c2; }
body.dark-mode .manage-btn:hover    { background: #3498db; color: white; border-color: #3498db; }

body.dark-mode .recurring-empty  { background: #1a1a2e; border-color: #0f3460; }
body.dark-mode .empty-title      { color: #f1f1f1; }
body.dark-mode .empty-desc       { color: #a5b1c2; }

body.dark-mode .recurring-card          { background: #1a1a2e; border-color: #0f3460; box-shadow: none; }
body.dark-mode .recurring-card.income   { border-left-color: #2ecc71; }
body.dark-mode .recurring-card.expense  { border-left-color: #e74c3c; }

body.dark-mode .card-icon.income  { background: rgba(46, 204, 113, 0.2); }
body.dark-mode .card-icon.expense { background: rgba(231,  76,  60, 0.2); }

body.dark-mode .card-name         { color: #f1f1f1; }
body.dark-mode .card-meta         { color: #7f8c8d; }
body.dark-mode .card-amount.income  { color: #2ecc71; }
body.dark-mode .card-amount.expense { color: #e74c3c; }
</style>
