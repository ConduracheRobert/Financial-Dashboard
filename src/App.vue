<template>
  <div id="app-root">
    <div v-if="!user" class="auth-screen">
      <div class="auth-card">
        <h2>💰 Gestor Financiar</h2>
        <p>Conectează-te pentru a-ți gestiona bugetul</p>
        <button @click="handleLogin" class="login-btn">Conectare cu Google</button>
      </div>
    </div>

    <div v-else class="app-layout">
      
      <header class="app-header">
        <div class="header-left">
          <button class="hamburger-btn" @click="isSidebarOpen = true">☰</button>
          <h2>Dashboard</h2>
        </div>
        <div class="header-right">
          <button @click="toggleLanguage" class="lang-btn" :title="currentLang === 'ro' ? 'Switch to English' : 'Schimbă în Română'">
            {{ currentLang === 'ro' ? '🇬🇧' : '🇷🇴' }}
          </button>
          
          <button @click="toggleTheme" class="theme-btn" :title="isDarkMode ? 'Treci la modul luminos' : 'Treci la modul întunecat'">
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
          
          <span class="user-email" v-if="user">{{ user.email }}</span>
          <button @click="handleLogout" class="logout-btn">{{ t.logout }}</button>
        </div>
      </header>

      <div class="sidebar-overlay" v-if="isSidebarOpen" @click="isSidebarOpen = false"></div>
      <aside class="sidebar" :class="{ 'open': isSidebarOpen }">
        <div class="sidebar-header">
          <h2>{{ t.menu }}</h2>
          <button class="close-btn" @click="isSidebarOpen = false">×</button>
        </div>
        <nav class="sidebar-nav">
          <a href="#" class="active">📊 {{ t.dashboard }}</a>
          <a href="#">📝 {{ t.history }}</a>
          <a href="#">⚙️ {{ t.settings }}</a>
        </nav>
      </aside>

      <main class="main-content">
        <TimeNavigator v-model:viewUnit="viewUnit" v-model:referenceDate="referenceDate" />

        <div class="currency-tabs">
          <button :class="{ active: activeCurrency === 'RON' }" @click="activeCurrency = 'RON'">🇷🇴 RON</button>
          <button :class="{ active: activeCurrency === 'EUR' }" @click="activeCurrency = 'EUR'">🇪🇺 EUR</button>
          <button :class="{ active: activeCurrency === 'USD' }" @click="activeCurrency = 'USD'">🇺🇸 USD</button>
        </div>

        <DashboardSummary 
          :transactions="dashboardTransactions" 
          :currentFilter="activeCardFilter"
          :currency="activeCurrency"
          @filter-changed="type => activeCardFilter = type" 
          @rates-loaded="handleRates"
        />

        <ExpenseChart 
          :transactions="displayListTransactions" 
          :currentFilter="activeCardFilter" 
        />

        <div class="transactions-section">
          <h3>Ultimele tranzacții</h3>
          <TransactionFilters 
            v-model:searchQuery="searchQuery"
            v-model:selectedCategory="selectedCategory"
          />
          <TransactionList 
            :transactions="displayListTransactions" 
            @delete-transaction="handleDeleteTransaction"
            @save-transaction="handleSaveTransaction"
          />
        </div>
      </main>

      <button class="fab-button" @click="isModalOpen = true" title="Adaugă Tranzacție">+</button>

      <div class="modal-overlay" v-if="isModalOpen" @click.self="isModalOpen = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Adaugă o tranzacție nouă</h3>
            <button class="close-btn" @click="isModalOpen = false">×</button>
          </div>
          <TransactionForm @add-transaction="handleSaveAndClose" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db, auth } from './firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'

import DashboardSummary from './components/DashboardSummary.vue'
import TimeNavigator from './components/TimeNavigator.vue'
import TransactionForm from './components/TransactionForm.vue'
import TransactionList from './components/TransactionList.vue'
import TransactionFilters from './components/TransactionFilters.vue'
import ExpenseChart from './components/ExpenseChart.vue'

// Stări aplicație
const user = ref(null)
const transactions = ref([])
const viewUnit = ref('month')
const referenceDate = ref(new Date().toISOString().split('T')[0])
const searchQuery = ref('')
const selectedCategory = ref('')
const activeCardFilter = ref(null)
const activeCurrency = ref('RON')
const globalRates = ref({ EUR: 1, USD: 1 })

// NOU: Stări pentru interfața modernă
const isSidebarOpen = ref(false)
const isModalOpen = ref(false)
// --- TEMĂ (DARK/LIGHT MODE) ---
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode')
    localStorage.setItem('theme', 'dark')
  } else {
    document.body.classList.remove('dark-mode')
    localStorage.setItem('theme', 'light')
  }
}

// --- FIREBASE AUTH ---
onMounted(() => {
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode')
  }
  onAuthStateChanged(auth, (newUser) => {
    user.value = newUser
    if (newUser) {
      const q = query(collection(db, 'transactions'), where('uid', '==', newUser.uid))
      onSnapshot(q, (snapshot) => {
        transactions.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      })
    }
  })
})

const handleLogin = async () => {
  const provider = new GoogleAuthProvider()
  await signInWithPopup(auth, provider)
}

const handleLogout = async () => {
  await signOut(auth)
}

// --- LOGICĂ TRANZACȚII ---
const handleSaveTransaction = async (data) => {
  if (data.id) {
    await updateDoc(doc(db, 'transactions', data.id), data)
  } else {
    await addDoc(collection(db, 'transactions'), { ...data, uid: user.value.uid })
  }
}
// --- INTERNAȚIONALIZARE (LIMBĂ) ---
// Citim din memorie dacă utilizatorul a mai ales o limbă, altfel punem 'ro' implicit
const currentLang = ref(localStorage.getItem('app_lang') || 'ro')

const toggleLanguage = () => {
  currentLang.value = currentLang.value === 'ro' ? 'en' : 'ro'
  localStorage.setItem('app_lang', currentLang.value)
}

// Dicționarul aplicației noastre pentru interfața principală
const t = computed(() => {
  return currentLang.value === 'ro' ? {
    dashboard: 'Dashboard',
    history: 'Istoric Complet',
    settings: 'Setări',
    logout: 'Ieșire',
    menu: 'Meniu',
    addTransaction: 'Adaugă o tranzacție nouă'
  } : {
    dashboard: 'Dashboard',
    history: 'Full History',
    settings: 'Settings',
    logout: 'Logout',
    menu: 'Menu',
    addTransaction: 'Add a new transaction'
  }
})

// NOU: Funcție care salvează și închide automat popup-ul
const handleSaveAndClose = async (data) => {
  await handleSaveTransaction(data)
  isModalOpen.value = false // Închide modalul după succes
}

const handleDeleteTransaction = async (id) => {
  await deleteDoc(doc(db, 'transactions', id))
}

const handleRates = (rates) => { globalRates.value = rates }

// --- CONDUCTE DE DATE ---
const baseFilteredTransactions = computed(() => {
  const refDate = new Date(referenceDate.value)
  let startDate, endDate

  if (viewUnit.value === 'day') {
    startDate = new Date(refDate.setHours(0,0,0,0))
    endDate = new Date(refDate.setHours(23,59,59,999))
  } else if (viewUnit.value === 'month') {
    startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
    endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59)
  } else if (viewUnit.value === 'year') {
    startDate = new Date(refDate.getFullYear(), 0, 1)
    endDate = new Date(refDate.getFullYear(), 11, 31, 23, 59, 59)
  } else if (viewUnit.value === 'week') {
    const day = refDate.getDay()
    const diff = refDate.getDate() - day + (day === 0 ? -6 : 1)
    startDate = new Date(new Date(refDate.setDate(diff)).setHours(0,0,0,0))
    endDate = new Date(new Date(refDate.setDate(diff + 6)).setHours(23,59,59,999))
  }

  return transactions.value.filter(t => {
    const tDate = new Date(t.date)
    const isInRange = tDate >= startDate && tDate <= endDate
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === '' || t.category === selectedCategory.value
    return isInRange && matchesSearch && matchesCategory
  })
})

const dashboardTransactions = computed(() => {
  return baseFilteredTransactions.value.map(t => {
    let amt = t.amount
    if (activeCurrency.value === 'EUR' && globalRates.value.EUR) amt = t.amount / globalRates.value.EUR
    if (activeCurrency.value === 'USD' && globalRates.value.USD) amt = t.amount / globalRates.value.USD
    return { ...t, amount: amt }
  })
})

const displayListTransactions = computed(() => {
  return dashboardTransactions.value.filter(t => {
    if (activeCardFilter.value === 'income') return t.amount > 0
    if (activeCardFilter.value === 'expense') return t.amount < 0
    return true 
  })
})
</script>

<style scoped>
/* STILURI DE BAZĂ */
#app-root { font-family: 'Inter', sans-serif; background: #f4f7f6; min-height: 100vh; color: #2c3e50; }

/* HEADER */
.app-header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 1000; }
.header-left { display: flex; align-items: center; gap: 15px; }
.header-left h2 { margin: 0; font-size: 20px; color: #2c3e50; }
.hamburger-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #34495e; padding: 5px; border-radius: 5px; transition: 0.2s; }
.hamburger-btn:hover { background: #f1f3f5; }
.header-right { display: flex; align-items: center; gap: 15px; }
.user-email { font-size: 14px; color: #7f8c8d; font-weight: 500; }
.logout-btn { background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.logout-btn:hover { background: #c0392b; }

/* MAIN CONTENT */
.main-content { padding: 25px; max-width: 1200px; margin: 0 auto; }
.transactions-section { margin-top: 30px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.transactions-section h3 { margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f1f3f5; padding-bottom: 10px; }

/* SIDEBAR MENIU LATERAL */
.sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); z-index: 2000; animation: fadeIn 0.2s; }
.sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100vh; background: white; z-index: 2001; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 4px 0 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
.sidebar.open { left: 0; }
.sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #f1f3f5; }
.sidebar-header h2 { margin: 0; font-size: 18px; color: #2c3e50; }
.close-btn { background: none; border: none; font-size: 28px; cursor: pointer; color: #95a5a6; line-height: 1; transition: 0.2s; }
.close-btn:hover { color: #e74c3c; }
.sidebar-nav { display: flex; flex-direction: column; padding: 15px; gap: 5px; }
.sidebar-nav a { padding: 12px 15px; text-decoration: none; color: #34495e; border-radius: 8px; font-weight: 500; transition: 0.2s; }
.sidebar-nav a:hover { background: #f1f3f5; }
.sidebar-nav a.active { background: rgba(52, 152, 219, 0.1); color: #3498db; font-weight: bold; }

/* BUTON PLUTITOR (FAB) */
.fab-button { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: #3498db; color: white; border: none; border-radius: 50%; font-size: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4); cursor: pointer; z-index: 1000; transition: 0.2s; }
.fab-button:hover { transform: scale(1.1) translateY(-5px); background: #2980b9; box-shadow: 0 6px 20px rgba(52, 152, 219, 0.6); }

/* POPUP MODAL (FORMULAR) */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(3px); z-index: 3000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; padding: 20px; }
.modal-content { background: white; width: 100%; max-width: 500px; border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f3f5; padding-bottom: 15px; }
.modal-header h3 { margin: 0; color: #2c3e50; }

/* TABS MONEDĂ */
.currency-tabs { display: flex; gap: 10px; margin-bottom: 20px; background: white; padding: 10px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); width: fit-content; }
.currency-tabs button { border: none; background: transparent; padding: 8px 16px; border-radius: 8px; font-weight: bold; color: #7f8c8d; cursor: pointer; transition: 0.3s; }
.currency-tabs button:hover { background: #f1f3f5; }
.currency-tabs button.active { background: #3498db; color: white; box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3); }

/* AUTH SCREEN */
.auth-screen { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f4f7f6; }
.auth-card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
.auth-card h2 { margin-top: 0; color: #2c3e50; }
.login-btn { background: #4285F4; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold; margin-top: 20px; transition: 0.2s; }
.login-btn:hover { background: #357ABD; box-shadow: 0 4px 10px rgba(66, 133, 244, 0.3); }

/* ANIMAȚII */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

/* Adaptare Dark Mode */
body.dark-mode #app-root { background: #1a1a2e; color: #f1f1f1; }
body.dark-mode .app-header, body.dark-mode .sidebar, body.dark-mode .modal-content, body.dark-mode .transactions-section, body.dark-mode .auth-card { background: #16213e; color: #f1f1f1; }
body.dark-mode .header-left h2, body.dark-mode .sidebar-header h2, body.dark-mode .modal-header h3, body.dark-mode .auth-card h2 { color: #f1f1f1; }
body.dark-mode .hamburger-btn, body.dark-mode .sidebar-nav a { color: #a5b1c2; }
body.dark-mode .hamburger-btn:hover, body.dark-mode .sidebar-nav a:hover { background: #0f3460; }
body.dark-mode .sidebar-header, body.dark-mode .modal-header, body.dark-mode .transactions-section h3 { border-color: #0f3460; }
body.dark-mode .currency-tabs { background: #16213e; }
body.dark-mode .currency-tabs button { color: #a5b1c2; }
body.dark-mode .currency-tabs button:hover { background: #0f3460; }
body.dark-mode .currency-tabs button.active { background: #3498db; color: white; }

/* =========================================
   DARK MODE GLOBAL PENTRU TOATĂ APLICAȚIA
   (Fără "scoped" - suprascrie orice fundal alb)
   ========================================= */

/* 1. Toate input-urile și meniurile de selecție */
body.dark-mode input,
body.dark-mode select,
body.dark-mode textarea {
  background-color: #1a1a2e !important;
  color: #f1f1f1 !important;
  border: 1px solid #0f3460 !important;
}

body.dark-mode input::placeholder {
  color: #7f8c8d !important;
}

/* 2. Suprascriem orice container care are fundal alb */
body.dark-mode .time-navigator,
body.dark-mode .time-navigator-container,
body.dark-mode .transaction-filters,
body.dark-mode .filters-container,
body.dark-mode .transaction-list,
body.dark-mode .list-container,
body.dark-mode .transaction-item,
body.dark-mode .empty-state,
body.dark-mode .empty-list {
  background-color: #16213e !important;
  color: #f1f1f1 !important;
  border-color: #0f3460 !important;
  box-shadow: none !important;
}

/* 3. Corectăm culorile textelor */
body.dark-mode .time-navigator button,
body.dark-mode .time-navigator span,
body.dark-mode .transaction-list h3,
body.dark-mode .empty-state p,
body.dark-mode .empty-list p,
body.dark-mode label {
  color: #f1f1f1 !important;
}

/* Hover pentru elementele din listă */
body.dark-mode .transaction-item:hover {
  background-color: #1a1a2e !important;
}
</style>
<style>
/* =========================================
   DARK MODE GLOBAL (Varianta Blindată 100%)
   ========================================= */

/* 1. Butonul cu Soarele și Butonul de Limbă - perfect transparente */
.theme-btn, .lang-btn {
  background: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  font-size: 22px;
  cursor: pointer;
  padding: 5px;
  transition: transform 0.2s;
}
.theme-btn:hover, .lang-btn:hover {
  transform: scale(1.1);
}

/* 2. REPARAȚIE TOTALĂ PENTRU TIME NAVIGATOR (Bara albă) */
body.dark-mode .time-navigator,
body.dark-mode .time-navigator div,
body.dark-mode .time-navigator section,
body.dark-mode .time-navigator nav { 
  background-color: #16213e !important; 
  border-color: #0f3460 !important; 
}

/* Butoanele normale din Time Navigator (Zi, Săpt, An) */
body.dark-mode .time-navigator button {
  background-color: #1a1a2e !important;
  color: #f1f1f1 !important;
  border: 1px solid #0f3460 !important;
}

/* Butonul ACTIV din Time Navigator (Lună) și Săgețile */
body.dark-mode .time-navigator button.active,
body.dark-mode .time-navigator button.icon-btn {
  background-color: #3498db !important;
  color: white !important;
  border-color: #3498db !important;
}

/* Textul cu data (ex: Aprilie 2026) */
body.dark-mode .date-display,
body.dark-mode .time-navigator span { 
  color: #f1f1f1 !important; 
  background-color: transparent !important;
}

/* 3. Input-uri și Select-uri (Filtre) */
body.dark-mode input,
body.dark-mode select { 
  background-color: #1a1a2e !important; 
  color: #f1f1f1 !important; 
  border: 1px solid #0f3460 !important; 
}
body.dark-mode input::placeholder { color: #7f8c8d !important; }

/* 4. Lista de Tranzacții */
body.dark-mode .transaction-list,
body.dark-mode .list-container,
body.dark-mode .empty-state { 
  background-color: transparent !important; 
  border: none !important; 
}
body.dark-mode .transaction-item { 
  background-color: #1a1a2e !important; 
  border: 1px solid #0f3460 !important; 
}
body.dark-mode .transaction-item:hover { background-color: #0f3460 !important; }

/* 5. Texte */
body.dark-mode .transaction-item .name,
body.dark-mode .transaction-list h3,
body.dark-mode .empty-state p { color: #f1f1f1 !important; }
</style>
