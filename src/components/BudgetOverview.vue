<template>
  <div class="budget-overview">

    <div class="budget-section-header">
      <h3>🎯 {{ isRo ? 'Bugete Lunare' : 'Monthly Budgets' }}</h3>
      <button class="manage-btn" @click="$emit('open-manage')">
        ⚙️ {{ isRo ? 'Gestionează' : 'Manage' }}
      </button>
    </div>

    <div v-if="budgets.length === 0" class="budget-empty">
      <div class="empty-icon">🎯</div>
      <p class="empty-title">
        {{ isRo ? 'Nu ai bugete setate.' : 'No budgets set.' }}
      </p>
      <p class="empty-desc">
        {{ isRo
          ? 'Apasă butonul de mai jos pentru a planifica cheltuielile lunare.'
          : 'Click the button below to plan your monthly expenses.' }}
      </p>
      <button class="cta-btn" @click="$emit('open-manage')">
        {{ isRo ? '+ Adaugă primul buget' : '+ Add your first budget' }}
      </button>
    </div>

    <div v-else class="budget-list">
      <div
        v-for="item in budgetsWithProgress"
        :key="item.category"
        class="budget-card"
      >
        <div class="budget-card-header">
          <span class="budget-category-name">{{ t.catMap[item.category] || item.category }}</span>
          <span class="budget-amounts">
            <strong>{{ item.spent.toFixed(0) }}</strong> / {{ item.limitAmount }} RON
          </span>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill"
            :class="item.statusClass"
            :style="{ width: Math.min(item.percent, 100) + '%' }"
          ></div>
        </div>

        <div class="budget-card-footer">
          <span class="percent-label" :class="item.statusClass">
            {{ item.statusIcon }} {{ item.percent.toFixed(0) }}%
          </span>
          <span v-if="item.percent < 100" class="remaining-label">
            {{ isRo
              ? `Rămas: ${item.remaining.toFixed(0)} RON · ${daysRemaining} zile`
              : `Left: ${item.remaining.toFixed(0)} RON · ${daysRemaining} days` }}
          </span>
          <span v-else class="remaining-label exceeded">
            {{ isRo
              ? `Depășit cu ${Math.abs(item.remaining).toFixed(0)} RON!`
              : `Exceeded by ${Math.abs(item.remaining).toFixed(0)} RON!` }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

const t = inject('t')
const isRo = computed(() => t.value.locale === 'ro-RO')

const props = defineProps({
  budgets: { type: Array, required: true },
  spentByCategory: { type: Object, required: true },
  daysRemaining: { type: Number, required: true }
})

defineEmits(['open-manage'])

const budgetsWithProgress = computed(() =>
  props.budgets.map(budget => {
    const spent = Math.abs(props.spentByCategory[budget.category] || 0)
    const percent = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0
    const remaining = budget.limitAmount - spent

    let statusClass, statusIcon
    if (percent >= 100)      { statusClass = 'danger';  statusIcon = '❌' }
    else if (percent >= 80)  { statusClass = 'warning'; statusIcon = '⚠️' }
    else                     { statusClass = 'good';    statusIcon = '✅' }

    return { ...budget, spent, percent, remaining, statusClass, statusIcon }
  })
)
</script>

<style scoped>
.budget-overview {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.budget-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.budget-section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

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
}
.manage-btn:hover {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

/* EMPTY STATE */
.budget-empty {
  text-align: center;
  padding: 30px 20px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 2px dashed #dcdde1;
}
.empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.6; }
.empty-title { margin: 0 0 6px 0; font-weight: bold; color: #34495e; font-size: 16px; }
.empty-desc { margin: 0 0 16px 0; color: #7f8c8d; font-size: 14px; }
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

/* BUDGET CARDS */
.budget-list { display: flex; flex-direction: column; gap: 12px; }

.budget-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 14px 16px;
  border-left: 4px solid #dcdde1;
  transition: 0.2s;
}

.budget-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.budget-category-name {
  font-weight: bold;
  color: #2c3e50;
  font-size: 14px;
}

.budget-amounts {
  font-size: 13px;
  color: #7f8c8d;
}

.budget-amounts strong {
  color: #2c3e50;
  font-size: 15px;
}

/* PROGRESS BAR */
.progress-track {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-fill.good    { background: #2ecc71; }
.progress-fill.warning { background: #e67e22; }
.progress-fill.danger  { background: #e74c3c; }

/* FOOTER */
.budget-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.percent-label { font-weight: bold; }
.percent-label.good    { color: #27ae60; }
.percent-label.warning { color: #d35400; }
.percent-label.danger  { color: #c0392b; }

.remaining-label { color: #7f8c8d; }
.remaining-label.exceeded { color: #c0392b; font-weight: bold; }

/* Border color matching status */
.budget-card:has(.percent-label.good)    { border-left-color: #2ecc71; }
.budget-card:has(.percent-label.warning) { border-left-color: #e67e22; }
.budget-card:has(.percent-label.danger)  { border-left-color: #e74c3c; }

/* DARK MODE */
:global(body.dark-mode) .budget-overview {
  background-color: #16213e !important;
  color: #f1f1f1 !important;
  box-shadow: none !important;
}
:global(body.dark-mode) .budget-section-header h3 { color: #f1f1f1 !important; }
:global(body.dark-mode) .manage-btn {
  background: #1a1a2e !important;
  border-color: #0f3460 !important;
  color: #a5b1c2 !important;
}
:global(body.dark-mode) .manage-btn:hover {
  background: #3498db !important;
  color: white !important;
}
:global(body.dark-mode) .budget-empty {
  background: #1a1a2e !important;
  border-color: #0f3460 !important;
}
:global(body.dark-mode) .empty-title { color: #f1f1f1 !important; }
:global(body.dark-mode) .empty-desc  { color: #a5b1c2 !important; }
:global(body.dark-mode) .budget-card {
  background: #1a1a2e !important;
  border-left-color: #0f3460 !important;
}
:global(body.dark-mode) .budget-category-name { color: #f1f1f1 !important; }
:global(body.dark-mode) .budget-amounts        { color: #a5b1c2 !important; }
:global(body.dark-mode) .budget-amounts strong { color: #f1f1f1 !important; }
:global(body.dark-mode) .remaining-label       { color: #a5b1c2 !important; }
:global(body.dark-mode) .progress-track        { background: #0f3460 !important; }
</style>
