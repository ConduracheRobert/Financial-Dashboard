<template>
  <div class="budget-overview">

    <div class="budget-section-header">
      <div class="header-text">
        <h3>🎯 {{ isRo ? 'Bugete Lunare' : 'Monthly Budgets' }}</h3>
        <span class="header-subtitle">
          {{ currentMonthLabel }} · {{ daysRemaining }}
          {{ isRo ? (daysRemaining === 1 ? 'zi rămasă' : 'zile rămase') : (daysRemaining === 1 ? 'day left' : 'days left') }}
        </span>
      </div>
      <button class="manage-btn" @click="$emit('open-manage')">
        ⚙️ {{ isRo ? 'Gestionează' : 'Manage' }}
      </button>
    </div>

    <div v-if="budgets.length === 0" class="budget-empty">
      <div class="empty-icon">🎯</div>
      <p class="empty-title">{{ isRo ? 'Nu ai bugete setate.' : 'No budgets set.' }}</p>
      <p class="empty-desc">
        {{ isRo
          ? 'Apasă mai jos pentru a planifica cheltuielile lunare.'
          : 'Click below to plan your monthly expenses.' }}
      </p>
      <button class="cta-btn" @click="$emit('open-manage')">
        {{ isRo ? '+ Adaugă primul buget' : '+ Add your first budget' }}
      </button>
    </div>

    <div v-else class="budget-grid">
      <div
        v-for="item in budgetsWithProgress"
        :key="item.category"
        class="budget-card"
        :class="item.statusClass"
      >
        <div class="card-top">
          <div class="cat-icon" :class="item.statusClass">
            {{ CATEGORY_EMOJI[item.category] || '📦' }}
          </div>
          <div class="cat-info">
            <span class="cat-name">{{ t.catMap[item.category] || item.category }}</span>
            <span class="cat-amounts">
              <strong>{{ item.spent.toFixed(0) }}</strong> / {{ item.limitAmount }} RON
            </span>
            <span v-if="item.limitAmount > 0" class="cat-rate">
              ≈ {{ Math.round(item.limitAmount / 4.33) }} RON/{{ isRo ? 'săpt.' : 'week' }}
              · ≈ {{ Math.round(item.limitAmount / 30) }} RON/{{ isRo ? 'zi' : 'day' }}
            </span>
          </div>
          <span v-if="item.statusClass === 'warning'" class="alert-badge warning">
            ⚠ {{ isRo ? 'Aproape de limită' : 'Near limit' }}
          </span>
          <span v-else-if="item.statusClass === 'danger'" class="alert-badge danger">
            ✕ {{ isRo ? 'Depășit' : 'Exceeded' }}
          </span>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill"
            :class="item.statusClass"
            :style="{ width: Math.min(item.percent, 100) + '%' }"
          ></div>
        </div>

        <div class="card-bottom">
          <span class="pct-label" :class="item.statusClass">
            {{ item.percent.toFixed(0) }}%
          </span>
          <span v-if="item.percent < 100" class="remaining-text">
            {{ isRo
              ? `Rămas: ${item.remaining.toFixed(0)} RON · ${daysRemaining} ${daysRemaining === 1 ? 'zi' : 'zile'}`
              : `Left: ${item.remaining.toFixed(0)} RON · ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}` }}
          </span>
          <span v-else class="remaining-text exceeded">
            {{ isRo
              ? `Depășit cu ${Math.abs(item.remaining).toFixed(0)} RON`
              : `Exceeded by ${Math.abs(item.remaining).toFixed(0)} RON` }}
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
  budgets:         { type: Array,  required: true },
  spentByCategory: { type: Object, required: true },
  daysRemaining:   { type: Number, required: true },
  selectedYear:    { type: Number, required: true },
  selectedMonth:   { type: Number, required: true }  // 0-indexed
})

defineEmits(['open-manage'])

const CATEGORY_EMOJI = {
  'Mâncare':           '🍽️',
  'Transport':         '🚗',
  'Facturi & Utilități': '⚡',
  'Cumpărături':       '🛍️',
  'Divertisment':      '🎮',
  'Sănătate':          '💊',
  'Educație':          '📚',
  'Casă':              '🏠',
  'Altele':            '📦'
}

// Construim data din props pentru a afisa luna selectata in TimeNavigator
const currentMonthLabel = computed(() => {
  const d = new Date(props.selectedYear, props.selectedMonth, 1)
  return d.toLocaleDateString(t.value.locale, { month: 'long', year: 'numeric' })
})

const budgetsWithProgress = computed(() =>
  props.budgets.map(budget => {
    const spent   = Math.abs(props.spentByCategory[budget.category] || 0)
    const percent  = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0
    const remaining = budget.limitAmount - spent

    let statusClass
    if (percent >= 100)     statusClass = 'danger'
    else if (percent >= 80) statusClass = 'warning'
    else                    statusClass = 'good'

    return { ...budget, spent, percent, remaining, statusClass }
  })
)
</script>

<style scoped>
/* === WRAPPER === */
.budget-overview {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

/* === HEADER === */
.budget-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.header-text { display: flex; flex-direction: column; gap: 3px; }
.budget-section-header h3 { margin: 0; font-size: 18px; color: #2c3e50; }
.header-subtitle { font-size: 12px; color: #7f8c8d; font-weight: 500; text-transform: capitalize; }

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
  flex-shrink: 0;
}
.manage-btn:hover { background: #3498db; color: white; border-color: #3498db; }

/* === EMPTY STATE — identic cu .empty-list din TransactionList === */
.budget-empty {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
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

/* === GRID === */
.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

/* === CARD — aceleasi valori ca .transaction-item === */
.budget-card {
  background: white;
  border: 1px solid #f1f3f5;
  border-left: 3px solid #dcdde1;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: 0.2s;
}
.budget-card.good    { border-left-color: #2ecc71; }
.budget-card.warning { border-left-color: #e67e22; }
.budget-card.danger  { border-left-color: #e74c3c; }

/* === TOP ROW === */
.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Iconiță 36×36px, pătrat rotunjit — culoare semantică cu opacitate */
.cat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.cat-icon.good    { background: rgba(46,  204, 113, 0.12); }
.cat-icon.warning { background: rgba(230, 126,  34, 0.12); }
.cat-icon.danger  { background: rgba(231,  76,  60, 0.12); }

.cat-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.cat-name { font-weight: bold; color: #2c3e50; font-size: 14px; }
.cat-amounts { font-size: 12px; color: #7f8c8d; margin-top: 2px; }
.cat-amounts strong { color: #2c3e50; font-size: 13px; }
.cat-rate { font-size: 11px; color: #95a5a6; margin-top: 2px; }

/* Badge alertă */
.alert-badge {
  font-size: 11px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}
.alert-badge.warning {
  background: rgba(230, 126, 34, 0.12);
  color: #d35400;
  border: 1px solid rgba(230, 126, 34, 0.3);
}
.alert-badge.danger {
  background: rgba(231, 76, 60, 0.12);
  color: #c0392b;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

/* === PROGRESS BAR === */
.progress-track {
  height: 8px;
  background: #f1f3f5;
  border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.5s ease;
}
.progress-fill.good    { background: #2ecc71; }
.progress-fill.warning { background: #e67e22; }
.progress-fill.danger  { background: #e74c3c; }

/* === BOTTOM ROW === */
.card-bottom { display: flex; align-items: center; gap: 8px; }

.pct-label {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 99px;
  flex-shrink: 0;
}
.pct-label.good    { background: rgba(46,  204, 113, 0.12); color: #27ae60; }
.pct-label.warning { background: rgba(230, 126,  34, 0.12); color: #d35400; }
.pct-label.danger  { background: rgba(231,  76,  60, 0.12); color: #c0392b; }

.remaining-text { font-size: 12px; color: #7f8c8d; }
.remaining-text.exceeded { color: #c0392b; font-weight: bold; }

/* === RESPONSIVE === */
@media (max-width: 600px) {
  .budget-grid { grid-template-columns: 1fr; }
  .alert-badge { align-self: flex-start; }
}

/* ===================================================
   DARK MODE — pattern identic cu DashboardSummary
   (body.dark-mode .class in scoped = body.dark-mode .class[data-v-xxx])
   =================================================== */
body.dark-mode .budget-overview   { background: #16213e; box-shadow: none; }
body.dark-mode .budget-section-header h3 { color: #f1f1f1; }
body.dark-mode .header-subtitle   { color: #a5b1c2; }
body.dark-mode .manage-btn        { background: #1a1a2e; border-color: #0f3460; color: #a5b1c2; }
body.dark-mode .manage-btn:hover  { background: #3498db; color: white; border-color: #3498db; }

body.dark-mode .budget-empty { background: #1a1a2e; border-color: #0f3460; }
body.dark-mode .empty-title  { color: #f1f1f1; }
body.dark-mode .empty-desc   { color: #a5b1c2; }

body.dark-mode .budget-card        { background: #1a1a2e; border-color: #0f3460; box-shadow: none; }
body.dark-mode .budget-card.good    { border-left-color: #2ecc71; }
body.dark-mode .budget-card.warning { border-left-color: #e67e22; }
body.dark-mode .budget-card.danger  { border-left-color: #e74c3c; }

body.dark-mode .cat-icon.good    { background: rgba(46,  204, 113, 0.2); }
body.dark-mode .cat-icon.warning { background: rgba(230, 126,  34, 0.2); }
body.dark-mode .cat-icon.danger  { background: rgba(231,  76,  60, 0.2); }

body.dark-mode .cat-name           { color: #f1f1f1; }
body.dark-mode .cat-amounts        { color: #a5b1c2; }
body.dark-mode .cat-amounts strong { color: #f1f1f1; }
body.dark-mode .cat-rate           { color: #7f8c8d; }

body.dark-mode .alert-badge.warning { background: rgba(230,126,34,0.2);  color: #e67e22; border-color: rgba(230,126,34,0.4); }
body.dark-mode .alert-badge.danger  { background: rgba(231, 76,60,0.2);  color: #e74c3c; border-color: rgba(231, 76,60,0.4); }

body.dark-mode .progress-track { background: #0f3460; }

body.dark-mode .pct-label.good    { background: rgba(46,  204,113,0.2); color: #2ecc71; }
body.dark-mode .pct-label.warning { background: rgba(230, 126, 34,0.2); color: #e67e22; }
body.dark-mode .pct-label.danger  { background: rgba(231,  76, 60,0.2); color: #e74c3c; }

body.dark-mode .remaining-text         { color: #a5b1c2; }
body.dark-mode .remaining-text.exceeded { color: #e74c3c; }
</style>
