<template>
  <div v-if="!user" class="login-screen">
      <div class="login-box">
        <h2>💰 Financial Dashboard</h2>
        <p>Conectează-te pentru a-ți salva datele în cloud, sau testează aplicația local.</p>
        
        <button @click="handleLogin" class="google-btn">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg" alt="Google" class="google-icon" />
  Conectare cu Google
</button>
        
        <button @click="continueAsGuest" class="guest-btn">
          👤 Continuă fără cont
        </button>
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
            <img v-if="currentLang === 'ro'" src="https://flagcdn.com/w40/ro.png" alt="RO" class="flag-icon" />
            <img v-else src="https://flagcdn.com/w40/gb.png" alt="EN" class="flag-icon" />
            <span class="lang-text">{{ currentLang === 'ro' ? 'RO' : 'EN' }}</span>
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
          <h3>{{ t.latestTransactions }}</h3>
          <TransactionFilters 
            v-model:searchQuery="searchQuery"
            v-model:selectedCategory="selectedCategory"
          />
          <TransactionList 
  :transactions="transactions" 
  @delete-transaction="handleDeleteTransaction" 
  @edit-transaction="openEditModal" 
/>
        </div>
      </main>

      <button class="fab-button" @click="openNewModal" title="Adaugă Tranzacție">+</button>
     />
    </div>

 <div v-if="isModalOpen" class="modal-overlay" @click.self="isModalOpen = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ transactionToEdit ? (t.locale === 'ro-RO' ? '✏️ Editează Tranzacția' : '✏️ Edit Transaction') : t.addTransactionTitle }}</h3>
          <button class="close-btn" @click="isModalOpen = false">×</button>
        </div>
        
        <TransactionForm 
          :transactionToEdit="transactionToEdit" 
          @add-transaction="handleSaveAndClose" 
        />
        
      </div>
    </div>

</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
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
// --- LOGICĂ PENTRU VIZITATOR (GUEST MODE) ---
const continueAsGuest = () => {
  // Creăm un utilizator fals pentru a debloca interfața
  user.value = {
    uid: 'local_guest',
    email: 'Vizitator (Mod Local)',
    isGuest: true
  }
  
  // Încărcăm tranzacțiile din memoria locală a browserului (dacă există)
  const savedLocal = localStorage.getItem('guest_transactions')
  if (savedLocal) {
    transactions.value = JSON.parse(savedLocal)
  } else {
    transactions.value = []
  }
}
// --- LOGICĂ PENTRU EDITARE ---
const transactionToEdit = ref(null)

const openNewModal = () => {
  transactionToEdit.value = null // Resetăm memoria
  isModalOpen.value = true       // Deschidem popup-ul
}

const openEditModal = (item) => {
  transactionToEdit.value = item // Memorăm tranzacția pe care am dat click
  isModalOpen.value = true       // Deschidem popup-ul
}
// --- LOGICĂ TRANZACȚII ---
const handleSaveTransaction = async (transaction) => {
  if (user.value.uid === 'local_guest') {
    // Dacă e vizitator, salvăm doar local
    transactions.value.push(transaction)
    localStorage.setItem('guest_transactions', JSON.stringify(transactions.value))
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

// --- DICȚIONARUL UNIVERSAL (i18n) COMPLET ---
const t = computed(() => {
  // Masca pentru baza de date
  const baseMap = {
    'Mâncare': 'Mâncare', 'Transport': 'Transport', 'Facturi & Utilități': 'Facturi & Utilități',
    'Cumpărături': 'Cumpărături', 'Divertisment': 'Divertisment', 'Sănătate': 'Sănătate',
    'Educație': 'Educație', 'Casă': 'Casă', 'Salariu': 'Salariu', 'Bonus': 'Bonus',
    'Investiții': 'Investiții', 'Cadouri primite': 'Cadouri primite', 'Vânzări': 'Vânzări', 'Altele': 'Altele'
  }
  const enMap = {
    'Mâncare': 'Food', 'Transport': 'Transport', 'Facturi & Utilități': 'Bills & Utilities',
    'Cumpărături': 'Shopping', 'Divertisment': 'Entertainment', 'Sănătate': 'Health',
    'Educație': 'Education', 'Casă': 'Home', 'Salariu': 'Salary', 'Bonus': 'Bonus',
    'Investiții': 'Investments', 'Cadouri primite': 'Gifts Received', 'Vânzări': 'Sales', 'Altele': 'Others'
  }

  return currentLang.value === 'ro' ? {
    locale: 'ro-RO',
    dashboard: 'Dashboard', history: 'Istoric Complet', settings: 'Setări', logout: 'Ieșire', menu: 'Meniu',
    latestTransactions: 'Ultimele tranzacții',
    currentBalance: 'Sold Curent', totalIncome: 'Total Venituri', totalExpense: 'Total Cheltuieli',
    globalRate: 'Curs Valutar', otherCurrencies: 'Alte monede (în',
    noCategory: 'Nicio categorie selectată', selectCategory: 'Apasă pe un card de sus pentru a genera analiza vizuală.',
    balance: 'Balanță', expenses: 'Cheltuieli', incomes: 'Venituri',
    emptyHistory: 'Nu există tranzacții în această perioadă.',
    searchTrans: 'Caută o tranzacție...', allCategories: 'Toate categoriile',
    transName: 'Nume Tranzacție', category: 'Categorie', amount: 'Sumă', date: 'Data',
    day: 'Zi', week: 'Săpt', month: 'Lună', year: 'An',
    
    // Cuvinte Noi pentru Formular
    addTransactionTitle: 'Adaugă o tranzacție nouă', 
    addIncomeBtn: 'Adaugă Venit', 
    addExpenseBtn: 'Adaugă Cheltuială',
    incomeToggle: 'Venit', 
    expenseToggle: 'Cheltuială',
    placeholderExpense: 'Ex: Cafea, Chirie, Supermarket...',
    placeholderIncome: 'Ex: Salariu, Bonus, Bani primiți...',
    selectCategoryOpt: 'Selectează o categorie...',
    validationName: 'Te rog să introduci un nume pentru tranzacție.',
    validationAmount: 'Suma introdusă trebuie să fie mai mare decât 0.',
    validationCategory: 'Te rog să selectezi o categorie.',
    validationDate: 'Eroare temporală: Nu poți adăuga o tranzacție din viitor!',
    
    catMap: baseMap // Aici trimitem masca
  } : {
    locale: 'en-US',
    dashboard: 'Dashboard', history: 'Full History', settings: 'Settings', logout: 'Logout', menu: 'Menu',
    latestTransactions: 'Latest Transactions',
    currentBalance: 'Current Balance', totalIncome: 'Total Income', totalExpense: 'Total Expenses',
    globalRate: 'Exchange Rate', otherCurrencies: 'Other currencies (in',
    noCategory: 'No category selected', selectCategory: 'Click a top card to generate visual analysis.',
    balance: 'Balance', expenses: 'Expenses', incomes: 'Incomes',
    emptyHistory: 'No transactions in this period.',
    searchTrans: 'Search transaction...', allCategories: 'All categories',
    transName: 'Transaction Name', category: 'Category', amount: 'Amount', date: 'Date',
    day: 'Day', week: 'Week', month: 'Month', year: 'Year',
    
    // Cuvinte Noi pentru Formular (ENG)
    addTransactionTitle: 'Add new transaction', 
    addIncomeBtn: 'Add Income', 
    addExpenseBtn: 'Add Expense',
    incomeToggle: 'Income', 
    expenseToggle: 'Expense',
    placeholderExpense: 'Ex: Coffee, Rent, Groceries...',
    placeholderIncome: 'Ex: Salary, Bonus, Received money...',
    selectCategoryOpt: 'Select a category...',
    validationName: 'Please enter a transaction name.',
    validationAmount: 'The amount must be greater than 0.',
    validationCategory: 'Please select a category.',
    validationDate: 'Temporal error: Cannot add a transaction from the future!',
    
    catMap: enMap // Aici trimitem masca în engleză
  }
})
// Aceasta este „magia” care trimite dicționarul invizibil către TOATE celelalte componente!
provide('t', t)

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
   DARK MODE GLOBAL (Varianta Blindată 100% V2)
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
.lang-btn { display: flex; align-items: center; gap: 8px; }
.flag-icon { width: 24px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.lang-text { font-size: 14px; font-weight: bold; color: #34495e; }
body.dark-mode .lang-text { color: #f1f1f1; }

/* 2. CONTAINERE PRINCIPALE (Navigator, Grafic, Item din Listă) */
body.dark-mode .time-navigator-container,
body.dark-mode .chart-container,
body.dark-mode .transaction-item {
  background-color: #16213e !important;
  border-color: #0f3460 !important;
}

/* 3. ZONE GRI ȘI MENIURI (Empty States, Toggle Grafic, Filtre Timp) */
body.dark-mode .empty-state,
body.dark-mode .empty-list,
body.dark-mode .no-data-message,
body.dark-mode .chart-toggle,
body.dark-mode .time-filters,
body.dark-mode .nav-group {
  background-color: #1a1a2e !important;
  border-color: #0f3460 !important;
  color: #a5b1c2 !important;
}

/* 4. BUTOANE (Navigator Timp, Săgeți, Butoane Grafic) */
body.dark-mode .time-filters button,
body.dark-mode .chart-toggle button {
  color: #f1f1f1 !important;
}
body.dark-mode .time-filters button.active,
body.dark-mode .chart-toggle button.active {
  background-color: #3498db !important;
  color: white !important;
}
body.dark-mode .icon-btn {
  background-color: #1a1a2e !important;
  color: #f1f1f1 !important;
}
body.dark-mode .icon-btn:hover { 
  background-color: #0f3460 !important; 
}

/* 5. INPUT-URI ȘI SELECT-URI (Filtre) */
body.dark-mode input,
body.dark-mode select { 
  background-color: #1a1a2e !important; 
  color: #f1f1f1 !important; 
  border: 1px solid #0f3460 !important; 
}
body.dark-mode input::placeholder { color: #7f8c8d !important; }

/* 6. CORECTARE TEXTE NEGRE (Titluri, Nume Tranzacții, Data) */
body.dark-mode .date-display,
body.dark-mode .empty-state h3,
body.dark-mode .empty-state p,
body.dark-mode .empty-list p,
body.dark-mode .no-data-message p,
body.dark-mode h3,
body.dark-mode .name {
  color: #f1f1f1 !important;
}

/* Hover pentru lista de tranzacții */
body.dark-mode .transaction-item:hover { 
  background-color: #0f3460 !important; 
}
/* =========================================
   REPARAȚIE POPUP (Fereastra plutitoare)
   ========================================= */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.modal-header h3 { margin: 0; color: #2c3e50; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #7f8c8d; }

/* Dark mode specific pentru rama Modalului */
:global(body.dark-mode) .modal-content { background: #16213e; border: 1px solid #0f3460; }
:global(body.dark-mode) .modal-header { border-bottom-color: #0f3460; }
:global(body.dark-mode) .modal-header h3 { color: #f1f1f1; }
body, #app, button, input, select, textarea, h1, h2, h3, p, span, div {
  font-family: "Avenir", "Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif !important;
}

/* =========================================
   REPARAȚIE POPUP & FORMULAR (BLINDAT 100%)
   ========================================= */

/* 1. Ridicăm Popup-ul deasupra la tot */
.modal-overlay {
  position: fixed !important;
  top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
  background: rgba(0, 0, 0, 0.7) !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  z-index: 99999 !important; /* Nivel maxim */
  backdrop-filter: blur(5px) !important;
}

.modal-content {
  background: white !important;
  padding: 25px !important;
  border-radius: 15px !important;
  width: 90% !important;
  max-width: 500px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
  position: relative !important;
}

.modal-header {
  display: flex !important; justify-content: space-between !important; align-items: center !important;
  margin-bottom: 20px !important; border-bottom: 1px solid #eee !important; padding-bottom: 15px !important;
}

.modal-header h3 { margin: 0 !important; color: #2c3e50 !important; }
.close-btn { background: none !important; border: none !important; font-size: 24px !important; cursor: pointer !important; color: #7f8c8d !important; }

/* 2. DARK MODE Pentru Fereastră */
body.dark-mode .modal-content { background: #16213e !important; border: 1px solid #0f3460 !important; }
body.dark-mode .modal-header { border-bottom-color: #0f3460 !important; }
body.dark-mode .modal-header h3 { color: #f1f1f1 !important; }

/* 3. DARK MODE Pentru Butoanele Formularului (Fără fundal alb!) */
body.dark-mode .smart-form .type-toggle { background-color: #0f3460 !important; border: 1px solid #0f3460 !important;}
body.dark-mode .smart-form .toggle-btn { color: #a5b1c2 !important; background: transparent !important; }
body.dark-mode .smart-form .toggle-btn.income.active { background-color: #1a1a2e !important; color: #2ecc71 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; }
body.dark-mode .smart-form .toggle-btn.expense.active { background-color: #1a1a2e !important; color: #e74c3c !important; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; }
body.dark-mode .smart-form .input-group label { color: #a5b1c2 !important; }

/* =========================================
   REPARAȚIE FONT (Varianta Forțată 100%)
   ========================================= */
.modal-overlay,
.modal-content,
.modal-content *,
.smart-form input,
.smart-form select,
.smart-form button,
.smart-form label {
  font-family: "Avenir", "Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif !important;
}
/* --- STILURI PENTRU ECRANUL DE LOGIN --- */
.login-screen {
  display: flex; justify-content: center; align-items: center;
  height: 100vh; background: #f4f7f6;
}
.login-box {
  background: white; padding: 40px; border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center;
  max-width: 400px; width: 90%; display: flex; flex-direction: column; gap: 15px;
}
.login-box h2 { margin: 0; color: #2c3e50; font-size: 24px; }
.login-box p { color: #7f8c8d; font-size: 14px; margin-bottom: 10px; line-height: 1.5; }

.google-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: #ffffff; color: #3c4043; border: 1px solid #dadce0;
  padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 15px;
}
.google-btn:hover { background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.google-icon { width: 20px; height: 20px; }

/* Butonul de Vizitator - Fără fundal, doar contur elegant */
.guest-btn {
  background: transparent; color: #3498db; border: 2px solid #3498db;
  padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 15px;
}
.guest-btn:hover { background: rgba(52, 152, 219, 0.1); }

/* Dark mode pentru login */
body.dark-mode .login-screen { background: #1a1a2e; }
body.dark-mode .login-box { background: #16213e; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
body.dark-mode .login-box h2 { color: #f1f1f1; }
body.dark-mode .google-btn { background: #2c3e50; color: #fff; border-color: #4a627a; }
body.dark-mode .google-btn:hover { background: #34495e; }

</style>
