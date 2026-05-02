<template>
  <div class="settings-page">

    <!-- A: Preferinte -->
    <section class="settings-card">
      <h3 class="section-title">🎨 {{ isRo ? 'Preferinte' : 'Preferences' }}</h3>

      <div class="pref-row">
        <div class="pref-label">
          <span class="pref-name">{{ isRo ? 'Limba' : 'Language' }}</span>
          <span class="pref-desc">{{ isRo ? 'Schimba limba interfetei' : 'Change interface language' }}</span>
        </div>
        <div class="toggle-group">
          <button :class="['tog-btn', { active: currentLang === 'ro' }]" @click="setLang('ro')">🇷🇴 RO</button>
          <button :class="['tog-btn', { active: currentLang === 'en' }]" @click="setLang('en')">🇬🇧 EN</button>
        </div>
      </div>

      <div class="pref-row">
        <div class="pref-label">
          <span class="pref-name">{{ isRo ? 'Tema' : 'Theme' }}</span>
          <span class="pref-desc">{{ isRo ? 'Mod intunecat sau luminos' : 'Dark or light mode' }}</span>
        </div>
        <div class="toggle-group">
          <button :class="['tog-btn', { active: !isDarkMode }]" @click="setTheme(false)">☀️ {{ isRo ? 'Luminos' : 'Light' }}</button>
          <button :class="['tog-btn', { active: isDarkMode  }]" @click="setTheme(true)">🌙 {{ isRo ? 'Intunecat' : 'Dark' }}</button>
        </div>
      </div>

      <div class="pref-row">
        <div class="pref-label">
          <span class="pref-name">{{ isRo ? 'Valuta implicita' : 'Default currency' }}</span>
          <span class="pref-desc">{{ isRo ? 'Valuta folosita pentru afisare' : 'Currency used for display' }}</span>
        </div>
        <div class="toggle-group">
          <button :class="['tog-btn', { active: activeCurrency === 'RON' }]" @click="activeCurrency = 'RON'">🇷🇴 RON</button>
          <button :class="['tog-btn', { active: activeCurrency === 'EUR' }]" @click="activeCurrency = 'EUR'">🇪🇺 EUR</button>
          <button :class="['tog-btn', { active: activeCurrency === 'USD' }]" @click="activeCurrency = 'USD'">🇺🇸 USD</button>
        </div>
      </div>
    </section>

    <!-- B: Categorii Custom -->
    <section class="settings-card">
      <h3 class="section-title">🏷️ {{ isRo ? 'Categorii' : 'Categories' }}</h3>

      <div class="cat-tabs">
        <button :class="['cat-tab', { active: catTabType === 'expense' }]" @click="catTabType = 'expense'">
          {{ isRo ? 'Cheltuieli' : 'Expenses' }}
        </button>
        <button :class="['cat-tab', { active: catTabType === 'income' }]" @click="catTabType = 'income'">
          {{ isRo ? 'Venituri' : 'Income' }}
        </button>
      </div>

      <div class="cat-list">
        <!-- Categorii implicite -->
        <div v-for="cat in defaultCats" :key="cat" class="cat-row">
          <span class="cat-name">{{ t.catMap?.[cat] || cat }}</span>
          <span class="cat-badge">{{ isRo ? 'implicit' : 'default' }}</span>
        </div>
        <!-- Categorii custom -->
        <div v-for="cat in customCats" :key="cat" class="cat-row cat-custom">
          <span class="cat-name">{{ cat }}</span>
          <button class="cat-del" @click="deleteCustomCategory(cat, catTabType)" title="Delete">🗑️</button>
        </div>
        <div v-if="customCats.length === 0 && catTabType === 'expense'" class="cat-empty">
          {{ isRo ? 'Nicio categorie custom de cheltuieli.' : 'No custom expense categories.' }}
        </div>
        <div v-if="customCats.length === 0 && catTabType === 'income'" class="cat-empty">
          {{ isRo ? 'Nicio categorie custom de venituri.' : 'No custom income categories.' }}
        </div>
      </div>

      <div class="cat-add-row">
        <input
          v-model="newCatName"
          class="cat-input"
          :placeholder="isRo ? 'Nume categorie noua...' : 'New category name...'"
          @keyup.enter="doAddCategory"
          maxlength="30"
        />
        <button class="add-cat-btn" @click="doAddCategory">
          {{ isRo ? '+ Adauga' : '+ Add' }}
        </button>
      </div>
      <div v-if="catError" class="cat-error">{{ catError }}</div>
    </section>

    <!-- C: Stergere Date -->
    <section class="settings-card danger-zone">
      <h3 class="section-title">⚠️ {{ isRo ? 'Stergere Date' : 'Delete Data' }}</h3>
      <p class="danger-desc">
        {{ isRo ? 'Actiunile de mai jos sunt ireversibile. Datele sterse nu pot fi recuperate.' : 'The actions below are irreversible. Deleted data cannot be recovered.' }}
      </p>

      <div class="danger-row">
        <div>
          <span class="danger-lbl">{{ isRo ? 'Sterge toate tranzactiile' : 'Delete all transactions' }}</span>
          <span class="danger-sub">{{ isRo ? 'Elimina permanent toate tranzactiile tale' : 'Permanently removes all your transactions' }}</span>
        </div>
        <button
          :class="['danger-btn', { confirm: confirmDeleteTx }]"
          @click="handleDeleteTxClick"
          @mouseleave="resetConfirmTx"
        >
          {{ confirmDeleteTx
            ? (isRo ? '⚠️ Esti sigur? Apasa din nou' : '⚠️ Are you sure? Click again')
            : (isRo ? '🗑️ Sterge tranzactiile' : '🗑️ Delete transactions') }}
        </button>
      </div>

      <div class="danger-row">
        <div>
          <span class="danger-lbl">{{ isRo ? 'Sterge toate bugetele' : 'Delete all budgets' }}</span>
          <span class="danger-sub">{{ isRo ? 'Elimina permanent toate bugetele setate' : 'Permanently removes all set budgets' }}</span>
        </div>
        <button
          :class="['danger-btn', { confirm: confirmDeleteBudgets }]"
          @click="handleDeleteBudgetsClick"
          @mouseleave="resetConfirmBudgets"
        >
          {{ confirmDeleteBudgets
            ? (isRo ? '⚠️ Esti sigur? Apasa din nou' : '⚠️ Are you sure? Click again')
            : (isRo ? '🗑️ Sterge bugetele' : '🗑️ Delete budgets') }}
        </button>
      </div>
    </section>

    <!-- D: Despre Aplicatie -->
    <section class="settings-card">
      <h3 class="section-title">ℹ️ {{ isRo ? 'Despre Aplicatie' : 'About' }}</h3>
      <div class="about-content">
        <div class="about-logo">💰</div>
        <div class="about-info">
          <h2 class="about-name">FinDash</h2>
          <p class="about-version">v1.0.0</p>
          <p class="about-desc">
            {{ isRo
              ? 'Aplicatie de management financiar personal'
              : 'Personal financial management application' }}
          </p>

          <div class="tech-stack">
            <span class="tech-badge">Vue 3</span>
            <span class="tech-badge">Vite</span>
            <span class="tech-badge">Firebase</span>
            <span class="tech-badge">PWA</span>
            <span class="tech-badge">Chart.js</span>
          </div>

          <div class="about-footer">
            <span>{{ isRo ? 'Dezvoltat de' : 'Developed by' }}: <strong>Condurache Robert</strong></span>
            <span class="about-year">© 2026</span>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'

const t                   = inject('t')
const currentLang         = inject('currentLang')
const isDarkMode          = inject('isDarkMode')
const toggleLanguage      = inject('toggleLanguage')
const toggleTheme         = inject('toggleTheme')
const activeCurrency      = inject('activeCurrency')
const customCategories    = inject('customCategories')
const addCustomCategory   = inject('addCustomCategory')
const deleteCustomCategory = inject('deleteCustomCategory')
const deleteAllTransactions = inject('deleteAllTransactions')
const deleteAllBudgets    = inject('deleteAllBudgets')

const isRo = computed(() => t.value.locale === 'ro-RO')

// Preferinte
const setLang = (lang) => {
  if (currentLang.value !== lang) toggleLanguage()
}
const setTheme = (dark) => {
  if (isDarkMode.value !== dark) toggleTheme()
}

// Categorii
const catTabType = ref('expense')
const newCatName = ref('')
const catError   = ref('')

const BASE_EXPENSE = ['Mâncare', 'Transport', 'Facturi & Utilități', 'Cumpărături', 'Divertisment', 'Sănătate', 'Educație', 'Casă', 'Altele']
const BASE_INCOME  = ['Salariu', 'Bonus', 'Investiții', 'Cadouri primite', 'Vânzări', 'Altele']

const defaultCats = computed(() => catTabType.value === 'expense' ? BASE_EXPENSE : BASE_INCOME)
const customCats  = computed(() => customCategories.value[catTabType.value] || [])

const doAddCategory = () => {
  catError.value = ''
  const name = newCatName.value.trim()
  if (!name) {
    catError.value = isRo.value ? 'Introduci un nume.' : 'Enter a name.'
    return
  }
  if (defaultCats.value.includes(name) || customCats.value.includes(name)) {
    catError.value = isRo.value ? 'Categoria exista deja.' : 'Category already exists.'
    return
  }
  addCustomCategory(name, catTabType.value)
  newCatName.value = ''
}

// Stergere date - 2 pasi confirmare
const confirmDeleteTx      = ref(false)
const confirmDeleteBudgets = ref(false)

const handleDeleteTxClick = async () => {
  if (!confirmDeleteTx.value) {
    confirmDeleteTx.value = true
    setTimeout(() => { confirmDeleteTx.value = false }, 4000)
  } else {
    confirmDeleteTx.value = false
    await deleteAllTransactions()
  }
}
const resetConfirmTx = () => { /* intentionat gol - resetam doar la timeout */ }

const handleDeleteBudgetsClick = async () => {
  if (!confirmDeleteBudgets.value) {
    confirmDeleteBudgets.value = true
    setTimeout(() => { confirmDeleteBudgets.value = false }, 4000)
  } else {
    confirmDeleteBudgets.value = false
    await deleteAllBudgets()
  }
}
const resetConfirmBudgets = () => { /* intentionat gol */ }
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f3f5;
}

/* Preferinte */
.pref-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f8f9fa;
  gap: 16px;
  flex-wrap: wrap;
}
.pref-row:last-child { border-bottom: none; }
.pref-label { display: flex; flex-direction: column; gap: 3px; }
.pref-name  { font-weight: 600; color: #2c3e50; font-size: 14px; }
.pref-desc  { font-size: 12px; color: #95a5a6; }

.toggle-group {
  display: flex;
  gap: 4px;
  background: #f1f3f5;
  padding: 4px;
  border-radius: 8px;
  flex-shrink: 0;
}
.tog-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #7f8c8d;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
  white-space: nowrap;
}
.tog-btn.active { background: white; color: #2c3e50; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.tog-btn:not(.active):hover { color: #34495e; }

/* Categorii */
.cat-tabs {
  display: flex;
  gap: 4px;
  background: #f1f3f5;
  padding: 4px;
  border-radius: 8px;
  margin-bottom: 16px;
  width: fit-content;
}
.cat-tab {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #7f8c8d;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
}
.cat-tab.active { background: white; color: #2c3e50; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

.cat-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
  max-height: 280px;
  overflow-y: auto;
}
.cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 8px;
  background: #f8f9fa;
}
.cat-custom { background: rgba(52,152,219,0.06); border: 1px solid rgba(52,152,219,0.15); }
.cat-name   { font-size: 13px; color: #2c3e50; font-weight: 500; }
.cat-badge  { font-size: 11px; color: #95a5a6; background: #f1f3f5; padding: 2px 8px; border-radius: 10px; }
.cat-del    { background: transparent; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; transition: 0.2s; }
.cat-del:hover { opacity: 1; }
.cat-empty  { font-size: 13px; color: #bdc3c7; text-align: center; padding: 12px; }

.cat-add-row {
  display: flex;
  gap: 8px;
}
.cat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #dcdde1;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  color: #2c3e50;
  background: white;
  transition: 0.2s;
}
.cat-input:focus { border-color: #3498db; box-shadow: 0 0 0 3px rgba(52,152,219,0.1); }
.add-cat-btn {
  padding: 10px 18px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}
.add-cat-btn:hover { background: #2980b9; }
.cat-error { font-size: 12px; color: #e74c3c; margin-top: 6px; }

/* Zona de pericol */
.danger-zone { border: 1px solid rgba(231,76,60,0.3); }
.danger-zone .section-title { color: #c0392b; border-bottom-color: rgba(231,76,60,0.15); }
.danger-desc { font-size: 13px; color: #e74c3c; margin: 0 0 18px 0; background: rgba(231,76,60,0.06); padding: 10px 14px; border-radius: 8px; }

.danger-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #fef5f5;
  gap: 16px;
  flex-wrap: wrap;
}
.danger-row:last-child { border-bottom: none; }
.danger-lbl { display: block; font-weight: 600; color: #2c3e50; font-size: 14px; margin-bottom: 3px; }
.danger-sub { display: block; font-size: 12px; color: #95a5a6; }

.danger-btn {
  padding: 9px 18px;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
  min-width: 200px;
  text-align: center;
}
.danger-btn:hover { background: rgba(231,76,60,0.08); }
.danger-btn.confirm { background: #e74c3c; color: white; }
.danger-btn.confirm:hover { background: #c0392b; }

/* Despre */
.about-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.about-logo { font-size: 52px; flex-shrink: 0; }
.about-info { flex: 1; }
.about-name    { margin: 0 0 2px 0; font-size: 26px; color: #2c3e50; }
.about-version { margin: 0 0 8px 0; font-size: 13px; color: #95a5a6; }
.about-desc    { margin: 0 0 16px 0; font-size: 14px; color: #7f8c8d; }

.tech-stack { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.tech-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(52,152,219,0.1);
  color: #2980b9;
}

.about-footer { display: flex; gap: 16px; align-items: center; font-size: 13px; color: #7f8c8d; flex-wrap: wrap; }
.about-year   { font-weight: 600; }

/* DARK MODE */
body.dark-mode .settings-card  { background: #16213e !important; box-shadow: none !important; }
body.dark-mode .section-title  { color: #f1f1f1 !important; border-bottom-color: #0f3460 !important; }
body.dark-mode .pref-name      { color: #f1f1f1 !important; }
body.dark-mode .pref-desc      { color: #6c7a89 !important; }
body.dark-mode .pref-row       { border-bottom-color: #0f3460 !important; }
body.dark-mode .toggle-group   { background: #0f3460 !important; }
body.dark-mode .tog-btn        { color: #a5b1c2 !important; }
body.dark-mode .tog-btn.active { background: #1a1a2e !important; color: #f1f1f1 !important; box-shadow: none !important; }

body.dark-mode .cat-tabs { background: #0f3460 !important; }
body.dark-mode .cat-tab  { color: #a5b1c2 !important; }
body.dark-mode .cat-tab.active { background: #1a1a2e !important; color: #f1f1f1 !important; }
body.dark-mode .cat-row   { background: #1a1a2e !important; }
body.dark-mode .cat-custom { background: rgba(52,152,219,0.08) !important; border-color: rgba(52,152,219,0.2) !important; }
body.dark-mode .cat-name  { color: #dfe6e9 !important; }
body.dark-mode .cat-badge { background: #0f3460 !important; color: #a5b1c2 !important; }
body.dark-mode .cat-input { background: #1a1a2e !important; border-color: #0f3460 !important; color: #f1f1f1 !important; }
body.dark-mode .cat-empty { color: #4a5568 !important; }

body.dark-mode .danger-zone    { border-color: rgba(231,76,60,0.25) !important; }
body.dark-mode .danger-row     { border-bottom-color: rgba(231,76,60,0.1) !important; }
body.dark-mode .danger-lbl     { color: #f1f1f1 !important; }
body.dark-mode .danger-sub     { color: #6c7a89 !important; }

body.dark-mode .about-name    { color: #f1f1f1 !important; }
body.dark-mode .about-version { color: #6c7a89 !important; }
body.dark-mode .about-desc    { color: #a5b1c2 !important; }
body.dark-mode .about-footer  { color: #a5b1c2 !important; }
body.dark-mode .tech-badge    { background: rgba(52,152,219,0.15) !important; color: #3498db !important; }

@media (max-width: 700px) {
  .pref-row    { flex-direction: column; align-items: flex-start; }
  .danger-row  { flex-direction: column; align-items: flex-start; }
  .danger-btn  { width: 100%; min-width: unset; }
  .about-content { flex-direction: column; }
  .cat-add-row { flex-direction: column; }
}
</style>
