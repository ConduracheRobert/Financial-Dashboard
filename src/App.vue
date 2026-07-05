<template>
  <div v-if="!user" class="login-screen">
      <div class="login-box">
        <div class="login-title">
          <span class="login-emoji">💰</span>
          <h1>Financial Dashboard</h1>
        </div>
        <p>Conectează-te pentru a-ți salva datele în cloud, sau testează aplicația local.</p>
        
        <button @click="handleLogin" class="google-btn">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="20" height="20" aria-hidden="true">
    <path fill="#EA4335" d="M44.59 4.21a64 64 0 0142.61.37 61.22 61.22 0 0120.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.28 34.28 0 00-13.64-8 37.17 37.17 0 00-37.46 9.74 39.25 39.25 0 00-9.18 14.91L8.76 35.6A63.53 63.53 0 0144.59 4.21z"/>
    <path fill="#FBBC05" d="M3.26 51.5a62.93 62.93 0 015.5-15.9l20.73 16.09a38.31 38.31 0 000 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 01-5.5-40.9z"/>
    <path fill="#4285F4" d="M65.27 52.15h59.52a74.33 74.33 0 01-1.61 33.58 57.44 57.44 0 01-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0012.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68z"/>
    <path fill="#34A853" d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0044 95.74a37.16 37.16 0 0014.08 6.08 41.29 41.29 0 0015.1 0 36.16 36.16 0 0013.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 01-25.9 13.47 67.6 67.6 0 01-32.36-.35 63 63 0 01-23-11.59A63.73 63.73 0 018.75 92.4z"/>
  </svg>
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
          <h2>Financial Dashboard</h2>
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
          <RouterLink to="/" exactActiveClass="active" @click="isSidebarOpen = false">📊 {{ t.dashboard }}</RouterLink>
          <RouterLink to="/insights" activeClass="active" @click="isSidebarOpen = false">📈 {{ t.insights }}</RouterLink>
          <RouterLink to="/history" activeClass="active" @click="isSidebarOpen = false">📝 {{ t.history }}</RouterLink>
          <RouterLink to="/settings" activeClass="active" @click="isSidebarOpen = false">⚙️ {{ t.settings }}</RouterLink>
          <RouterLink to="/import" activeClass="active" @click="isSidebarOpen = false">📥 {{ t.importExtras }}</RouterLink>
        </nav>
      </aside>

      <main class="main-content">
        <TimeNavigator v-if="showTimeControls" v-model:viewUnit="viewUnit" v-model:referenceDate="referenceDate" />

        <div v-if="showTimeControls" class="currency-tabs">
          <button :class="{ active: activeCurrency === 'RON' }" @click="activeCurrency = 'RON'">🇷🇴 RON</button>
          <button :class="{ active: activeCurrency === 'EUR' }" @click="activeCurrency = 'EUR'">🇪🇺 EUR</button>
          <button :class="{ active: activeCurrency === 'USD' }" @click="activeCurrency = 'USD'">🇺🇸 USD</button>
        </div>

        <router-view />
      </main>

      <button class="fab-button" @click="openNewModal" title="Adaugă Tranzacție">+</button>
    
    </div>

 <ToastContainer :toasts="toasts" />

 <div v-if="isBudgetModalOpen" class="modal-overlay" @click.self="closeBudgetModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>🎯 {{ currentLang === 'ro' ? 'Gestionează Bugete' : 'Manage Budgets' }}</h3>
        <button class="close-btn" @click="closeBudgetModal">×</button>
      </div>
      <BudgetForm
        :budgets="budgets"
        :preselectCategory="budgetPreselectCategory"
        @save-budget="handleSaveBudget"
        @delete-budget="handleDeleteBudget"
      />
    </div>
  </div>

 <div v-if="isRecurringModalOpen" class="modal-overlay" @click.self="closeRecurringModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔄 {{ currentLang === 'ro' ? 'Gestionează Recurente' : 'Manage Recurring' }}</h3>
        <button class="close-btn" @click="closeRecurringModal">×</button>
      </div>
      <RecurringForm
        :recurringTransactions="recurringTransactions"
        :editingRecurring="editingRecurring"
        @save-recurring="handleSaveRecurring"
        @delete-recurring="handleDeleteRecurring"
        @cancel-edit="editingRecurring = null"
      />
    </div>
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
import { ref, computed, onMounted, provide, watch } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { db, auth } from './firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore'

import TimeNavigator from './components/TimeNavigator.vue'
import TransactionForm from './components/TransactionForm.vue'
import ToastContainer from './components/ToastContainer.vue'
import BudgetForm from './components/BudgetForm.vue'
import RecurringForm from './components/RecurringForm.vue'
const route = useRoute()
const showTimeControls = computed(() => ['/', '/history'].includes(route.path))

// Stări aplicație
const user = ref(null)
const transactions = ref([])
const viewUnit = ref('month')
const referenceDate = ref(new Date().toISOString().split('T')[0])
const searchQuery = ref('')
const selectedCategory = ref('')

// Parsa JSON din storage fara a arunca exceptii; returneaza fallback la eroare/format invalid
function safeJsonParse(raw, fallback) {
  try {
    if (raw === null || raw === undefined) return fallback
    const parsed = JSON.parse(raw)
    return parsed !== null && typeof parsed === typeof fallback ? parsed : fallback
  } catch {
    return fallback
  }
}

// Categorii custom (localStorage)
const customCategories = ref(
  safeJsonParse(localStorage.getItem('custom_categories'), { expense: [], income: [] })
)
const addCustomCategory = (name, type) => {
  const trimmed = name.trim()
  if (!trimmed) return
  if (!customCategories.value[type].includes(trimmed)) {
    customCategories.value[type].push(trimmed)
    localStorage.setItem('custom_categories', JSON.stringify(customCategories.value))
  }
}
const deleteCustomCategory = (name, type) => {
  customCategories.value[type] = customCategories.value[type].filter(c => c !== name)
  localStorage.setItem('custom_categories', JSON.stringify(customCategories.value))
}
const activeCardFilter = ref(null)
const activeCurrency = ref('RON')
const globalRates = ref({ EUR: 1, USD: 1 })

// BUGETE - State Management
const budgets = ref([])
const alertedBudgets = ref(new Set(safeJsonParse(sessionStorage.getItem('alerted_budgets'), [])))
const lastAlertMonth = ref(new Date().getMonth())

// RECURENTE - State Management
const recurringTransactions = ref([])
const isRecurringModalOpen = ref(false)
const editingRecurring = ref(null)
const closeRecurringModal = () => {
  isRecurringModalOpen.value = false
  editingRecurring.value = null
}
const openEditRecurring = (item) => {
  editingRecurring.value = item
  isRecurringModalOpen.value = true
}

// NOU: Stări pentru interfața modernă
const isSidebarOpen = ref(false)
const isModalOpen = ref(false)
const isBudgetModalOpen = ref(false)
const budgetPreselectCategory = ref('')
const closeBudgetModal = () => {
  isBudgetModalOpen.value = false
  budgetPreselectCategory.value = ''
}

// --- SISTEM TOAST NOTIFICĂRI ---
const toasts = ref([])
const addToast = (message, type = 'info', action = null) => {
  const durations = { success: 10000, error: 6000, info: 10000 }
  const duration = durations[type] || 4000
  const id = Date.now()
  toasts.value.push({ id, message, type, action })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}
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
      loadBudgets()
      loadRecurring()
    }
  })
})

const handleLogin = async () => {
  const provider = new GoogleAuthProvider()
  await signInWithPopup(auth, provider)
}


const handleLogout = async () => {
  try {
    // 1. Încercăm să dăm afară de la Firebase (dacă e cazul)
    await signOut(auth)
  } catch (error) {
    console.log("Nu era nimeni logat în Firebase (probabil vizitator)");
  } finally {
    // 2. REPARAȚIA CRITICĂ: Forțăm utilizatorul să dispară din memoria aplicației
    user.value = null
    
    // Opțional: Dacă folosești localStorage pentru a ține minte guest-ul, șterge-l și pe ăla
    localStorage.removeItem('guest_user') 
  }
}
// --- LOGICĂ PENTRU VIZITATOR (GUEST MODE) ---
const continueAsGuest = () => {
  // UUID persistent per sesiune de browser (sessionStorage, nu localStorage)
  let guestId = sessionStorage.getItem('guest_session_id')
  if (!guestId) {
    guestId = crypto.randomUUID()
    sessionStorage.setItem('guest_session_id', guestId)
  }

  user.value = {
    uid: guestId,
    email: 'Vizitator (Mod Local)',
    isGuest: true
  }

  const savedLocal = localStorage.getItem('guest_transactions')
  transactions.value = Array.isArray(safeJsonParse(savedLocal, [])) ? safeJsonParse(savedLocal, []) : []
  
  loadBudgets()
  loadRecurring()
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
  if (user.value.isGuest) {
    if (transaction.id) {
      const idx = transactions.value.findIndex(t => t.id === transaction.id)
      if (idx !== -1) transactions.value[idx] = { ...transaction }
    } else {
      transactions.value.push({ ...transaction, id: Date.now().toString() })
    }
    localStorage.setItem('guest_transactions', JSON.stringify(transactions.value))
  } else {
    const { id, ...dataToSave } = transaction
    dataToSave.uid = user.value.uid

    if (id) {
      await updateDoc(doc(db, 'transactions', id), dataToSave)
    } else {
      await addDoc(collection(db, 'transactions'), dataToSave)
    }
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
    'Educație': 'Educație', 'Casă': 'Casă', 'Extras Cont-Cheltuieli': 'Extras Cont-Cheltuieli',
    'Salariu': 'Salariu', 'Bonus': 'Bonus',
    'Investiții': 'Investiții', 'Cadouri primite': 'Cadouri primite', 'Vânzări': 'Vânzări', 'Altele': 'Altele',
    'Extras Cont-Venituri': 'Extras Cont-Venituri'
  }
  const enMap = {
    'Mâncare': 'Food', 'Transport': 'Transport', 'Facturi & Utilități': 'Bills & Utilities',
    'Cumpărături': 'Shopping', 'Divertisment': 'Entertainment', 'Sănătate': 'Health',
    'Educație': 'Education', 'Casă': 'Home', 'Extras Cont-Cheltuieli': 'Bank Statement (Expenses)',
    'Salariu': 'Salary', 'Bonus': 'Bonus',
    'Investiții': 'Investments', 'Cadouri primite': 'Gifts Received', 'Vânzări': 'Sales', 'Altele': 'Others',
    'Extras Cont-Venituri': 'Bank Statement (Income)'
  }

  return currentLang.value === 'ro' ? {
    locale: 'ro-RO',
    dashboard: 'Dashboard', insights: 'Analize', history: 'Istoric Complet', settings: 'Setări', logout: 'Ieșire', menu: 'Meniu', importExtras: 'Import Extras',
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
    
    importTitle: 'Import Extras de Cont',
    importSubtitle: 'Importa automat tranzactiile din extrasul PDF al bancii tale.',
    importStep1Label: 'Selecteaza fisierul',
    importStep2Label: 'Verifica tranzactiile',
    importStep3Label: 'Import complet',
    importSelectBank: 'Selecteaza banca',
    importSelectBankPlaceholder: 'Alege banca...',
    importDropzoneText: 'Trage fisierul PDF aici sau da click pentru a-l selecta',
    importDropzoneHint: 'Suporta: extras de cont PDF (BT, BCR, BRD, Revolut)',
    importProcessing: 'Se proceseaza PDF-ul...',
    importProcessBtn: 'Proceseaza fisierul',
    importDetected: 'Detectate',
    importDeselectAll: 'Deselecteaza toate',
    importSelectAll: 'Selecteaza toate',
    importType: 'Tip',
    importBack: 'Inapoi',
    importBtn: 'Importa',
    importBtnSuffix: 'tranzactii selectate',
    importSuccess: 'tranzactii importate cu succes!',
    importViewDashboard: 'Vezi in Dashboard',
    importAnother: 'Importa alt fisier',
    importNoTransactions: 'Nu au fost detectate tranzactii. Verifica banca selectata sau formatul PDF-ului.',
    catMap: baseMap // Aici trimitem masca
  } : {
    locale: 'en-US',
    dashboard: 'Dashboard', insights: 'Insights', history: 'Full History', settings: 'Settings', logout: 'Logout', menu: 'Menu', importExtras: 'Import Statement',
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
    
    importTitle: 'Import Bank Statement',
    importSubtitle: 'Automatically import transactions from your bank PDF statement.',
    importStep1Label: 'Select file',
    importStep2Label: 'Verify transactions',
    importStep3Label: 'Import complete',
    importSelectBank: 'Select bank',
    importSelectBankPlaceholder: 'Choose bank...',
    importDropzoneText: 'Drag PDF file here or click to select',
    importDropzoneHint: 'Supports: bank statement PDF (BT, BCR, BRD, Revolut)',
    importProcessing: 'Processing PDF...',
    importProcessBtn: 'Process file',
    importDetected: 'Detected',
    importDeselectAll: 'Deselect all',
    importSelectAll: 'Select all',
    importType: 'Type',
    importBack: 'Back',
    importBtn: 'Import',
    importBtnSuffix: 'selected transactions',
    importSuccess: 'transactions imported successfully!',
    importViewDashboard: 'View Dashboard',
    importAnother: 'Import another file',
    importNoTransactions: 'No transactions detected. Check the selected bank or PDF format.',
    catMap: enMap // Aici trimitem masca în engleză
  }
})
// Aceasta este „magia” care trimite dicționarul invizibil către TOATE celelalte componente!


provide('t', t)

// --- WATCH PE USER ---
watch(user, (newUser, oldUser) => {
  if (!newUser) {
    budgets.value = []
    alertedBudgets.value.clear()
  } else if (oldUser && newUser.uid !== oldUser.uid) {
    budgets.value = []
    alertedBudgets.value.clear()
    loadBudgets()
  } else if (!oldUser && newUser) {
    loadBudgets()
  }
})

// NOU: Funcție care salvează și închide automat popup-ul
const handleSaveAndClose = async (data) => {
  try {
    await handleSaveTransaction(data)
    isModalOpen.value = false
    const isEdit = !!data.id
    addToast(
      isEdit
        ? (currentLang.value === 'ro' ? '✅ Tranzacție actualizată cu succes!' : '✅ Transaction updated successfully!')
        : (currentLang.value === 'ro' ? '✅ Tranzacție adăugată cu succes!' : '✅ Transaction added successfully!'),
      'success'
    )

    if (!isEdit && data.amount < 0) {
      const hasBudget = budgets.value.some(b => b.category === data.category)
      if (!hasBudget) {
        const catLabel = t.value.catMap[data.category] || data.category
        const category = data.category
        addToast(
          currentLang.value === 'ro'
            ? `💡 Ai cheltuit pe ${catLabel}. Vrei să îți setezi un buget pentru aceasta categorie?`
            : `💡 You spent on ${catLabel}. Want to set a budget for this category?`,
          'info',
          {
            label: currentLang.value === 'ro' ? 'Setează buget' : 'Set budget',
            handler: () => {
              budgetPreselectCategory.value = category
              isBudgetModalOpen.value = true
            }
          }
        )
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error("EROARE LA SALVAREA IN FIREBASE:", error)
    addToast(
      currentLang.value === 'ro'
        ? '❌ Eroare la salvare. Incearca din nou.'
        : '❌ Save failed. Please try again.',
      'error'
    )
    isModalOpen.value = false
  }
}

const handleDeleteTransaction = async (id) => {
  // Ownership guard: ID-ul trebuie sa existe in lista locala (deja filtrata dupa uid)
  if (!transactions.value.some(t => t.id === id)) return
  await deleteDoc(doc(db, 'transactions', id))
  addToast(
    currentLang.value === 'ro' ? '🗑️ Tranzacție ștearsă.' : '🗑️ Transaction deleted.',
    'success'
  )
}

const handleImportTransactions = async (txsToImport) => {
  let imported = 0
  let skipped = 0

  for (const tx of txsToImport) {
    const isDuplicate = transactions.value.some(
      e => e.date === tx.date &&
           Math.abs(e.amount - tx.amount) < 0.01 &&
           e.name === tx.name
    )
    if (isDuplicate) { skipped++; continue }

    await handleSaveTransaction({ name: tx.name, amount: tx.amount, category: tx.category, date: tx.date })
    imported++
  }

  const ro = currentLang.value === 'ro'
  addToast(
    skipped > 0
      ? (ro ? `✅ ${imported} tranzactii importate, ${skipped} duplicate sarite.`
             : `✅ ${imported} transactions imported, ${skipped} duplicates skipped.`)
      : (ro ? `✅ ${imported} tranzactii importate cu succes!`
             : `✅ ${imported} transactions imported successfully!`),
    'success'
  )

  return { imported, skipped }
}

const handleRates = (rates) => { globalRates.value = rates }

// --- BUGETE: LOAD, SAVE, DELETE ---
const loadBudgets = () => {
  if (!user.value) return
  
  if (user.value.isGuest) {
    const parsed = safeJsonParse(localStorage.getItem('guest_budgets'), [])
    budgets.value = Array.isArray(parsed) ? parsed : []
  } else {
    // Încarcă din Firestore
    const q = query(collection(db, 'budgets'), where('uid', '==', user.value.uid))
    onSnapshot(q, (snapshot) => {
      budgets.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    })
  }
  // Reset alertele la schimbul de user
  alertedBudgets.value = new Set()
  lastAlertMonth.value = new Date().getMonth()
}

const handleSaveBudget = async (budget) => {
  try {
    if (user.value.isGuest) {
      // Guest mode: localStorage
      if (budget.id) {
        const idx = budgets.value.findIndex(b => b.id === budget.id)
        if (idx !== -1) {
          budgets.value[idx] = { ...budget }
        }
      } else {
        const newBudget = { ...budget, id: Date.now().toString() }
        budgets.value.push(newBudget)
      }
      localStorage.setItem('guest_budgets', JSON.stringify(budgets.value))
    } else {
      // Firestore
      if (budget.id) {
        await updateDoc(doc(db, 'budgets', budget.id), {
          category: budget.category,
          limitAmount: budget.limitAmount
        })
      } else {
        await addDoc(collection(db, 'budgets'), {
          category: budget.category,
          limitAmount: budget.limitAmount,
          uid: user.value.uid,
          createdAt: new Date().toISOString()
        })
      }
    }
    // Reset alertele când se salvează buget nou
    alertedBudgets.value.clear()
    addToast(
      currentLang.value === 'ro' ? '✅ Buget salvat cu succes!' : '✅ Budget saved successfully!',
      'success'
    )
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error saving budget:', error)
    addToast(
      currentLang.value === 'ro' ? '❌ Eroare la salvare.' : '❌ Save failed.',
      'error'
    )
  }
}

const handleDeleteBudget = async (id) => {
  try {
    if (user.value.isGuest) {
      // Guest mode
      budgets.value = budgets.value.filter(b => b.id !== id)
      localStorage.setItem('guest_budgets', JSON.stringify(budgets.value))
    } else {
      // Ownership guard: ID-ul trebuie sa existe in lista locala (deja filtrata dupa uid)
      if (!budgets.value.some(b => b.id === id)) return
      await deleteDoc(doc(db, 'budgets', id))
    }
    addToast(
      currentLang.value === 'ro' ? '🗑️ Buget șters.' : '🗑️ Budget deleted.',
      'info'
    )
  } catch (error) {
    console.error('Error deleting budget:', error)
    addToast(
      currentLang.value === 'ro' ? '❌ Eroare la ștergere.' : '❌ Delete failed.',
      'error'
    )
  }
}

// --- RECURENTE: LOAD, SAVE, DELETE ---
const checkAndGenerateRecurring = async (manual = false, overrideDate = null) => {
  const now = overrideDate ? new Date(overrideDate) : new Date()
  const nowYear  = now.getFullYear()
  const nowMonth = now.getMonth() + 1
  const nowDay   = now.getDate()

  let generatedCount = 0
  const guestTxToAdd = []

  for (const r of recurringTransactions.value) {
    const last = r.lastGenerated ? new Date(r.lastGenerated) : null
    const periods = [] // datele pentru care trebuie generate tranzactii

    if (r.frequency === 'lunar') {
      // Punctul de start: luna urmatoare dupa lastGenerated, sau luna curenta daca nu a fost niciodata generat
      let sy = nowYear, sm = nowMonth
      if (last) {
        sm = last.getMonth() + 2 // +1 pentru 0-indexed, +1 pentru luna urmatoare
        sy = last.getFullYear()
        if (sm > 12) { sm = 1; sy++ }
      }
      // Parcurge toate lunile de la sy/sm pana la acum
      let y = sy, m = sm
      while (y < nowYear || (y === nowYear && m <= nowMonth)) {
        const isCurrent = y === nowYear && m === nowMonth
        if (!isCurrent || nowDay >= r.dayOfMonth) {
          periods.push(`${y}-${String(m).padStart(2,'0')}-${String(r.dayOfMonth).padStart(2,'0')}`)
        }
        if (++m > 12) { m = 1; y++ }
      }
    } else if (r.frequency === 'anual') {
      const startYear = last ? last.getFullYear() + 1 : nowYear
      for (let y = startYear; y <= nowYear; y++) {
        const due = y < nowYear
          || nowMonth > r.monthOfYear
          || (nowMonth === r.monthOfYear && nowDay >= r.dayOfMonth)
        if (due) {
          periods.push(`${y}-${String(r.monthOfYear).padStart(2,'0')}-${String(r.dayOfMonth).padStart(2,'0')}`)
        }
      }
    }

    if (periods.length === 0) continue

    for (const date of periods) {
      const txData = { name: r.name, amount: r.amount, category: r.category, date }
      if (user.value.isGuest) {
        guestTxToAdd.push({ ...txData, id: Date.now().toString() + Math.random() })
      } else {
        await addDoc(collection(db, 'transactions'), { ...txData, uid: user.value.uid })
      }
      generatedCount++
    }

    const newLastGenerated = now.toISOString()
    if (user.value.isGuest) {
      const idx = recurringTransactions.value.findIndex(x => x.id === r.id)
      if (idx !== -1) recurringTransactions.value[idx].lastGenerated = newLastGenerated
    } else {
      await updateDoc(doc(db, 'recurringTransactions', r.id), { lastGenerated: newLastGenerated })
    }
  }

  if (user.value.isGuest && guestTxToAdd.length > 0) {
    transactions.value.push(...guestTxToAdd)
    localStorage.setItem('guest_transactions', JSON.stringify(transactions.value))
    localStorage.setItem('guest_recurring', JSON.stringify(recurringTransactions.value))
  }

  if (generatedCount > 0) {
    addToast(
      currentLang.value === 'ro'
        ? `🔄 ${generatedCount} ${generatedCount === 1 ? 'tranzactie recurenta generata' : 'tranzactii recurente generate'} automat`
        : `🔄 ${generatedCount} recurring ${generatedCount === 1 ? 'transaction' : 'transactions'} generated automatically`,
      'info'
    )
  } else if (manual) {
    addToast(
      currentLang.value === 'ro'
        ? recurringTransactions.value.length === 0
          ? '🔄 Nu ai recurente configurate.'
          : '🔄 Totul e la zi. Nicio tranzactie scadenta.'
        : recurringTransactions.value.length === 0
          ? '🔄 No recurring transactions configured.'
          : '🔄 All up to date. No transactions due.',
      'info'
    )
  }
}

const loadRecurring = () => {
  if (!user.value) return

  if (user.value.isGuest) {
    const parsed = safeJsonParse(localStorage.getItem('guest_recurring'), [])
    recurringTransactions.value = Array.isArray(parsed) ? parsed : []
    checkAndGenerateRecurring()
  } else {
    const q = query(collection(db, 'recurringTransactions'), where('uid', '==', user.value.uid))
    onSnapshot(q, (snapshot) => {
      recurringTransactions.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      checkAndGenerateRecurring()
    })
  }
}

const handleSaveRecurring = async (recurring) => {
  try {
    const { id, ...data } = recurring
    if (user.value.isGuest) {
      if (id) {
        const idx = recurringTransactions.value.findIndex(r => r.id === id)
        if (idx !== -1) recurringTransactions.value[idx] = { ...recurringTransactions.value[idx], ...data }
      } else {
        recurringTransactions.value.push({ ...data, id: Date.now().toString(), lastGenerated: null, createdAt: new Date().toISOString() })
      }
      localStorage.setItem('guest_recurring', JSON.stringify(recurringTransactions.value))
    } else {
      if (id) {
        await updateDoc(doc(db, 'recurringTransactions', id), data)
      } else {
        await addDoc(collection(db, 'recurringTransactions'), {
          ...data,
          uid: user.value.uid,
          lastGenerated: null,
          createdAt: new Date().toISOString()
        })
      }
    }
    editingRecurring.value = null
    addToast(
      id
        ? (currentLang.value === 'ro' ? '✅ Recurenta actualizata!' : '✅ Recurring transaction updated!')
        : (currentLang.value === 'ro' ? '✅ Recurenta salvata!' : '✅ Recurring transaction saved!'),
      'success'
    )
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error saving recurring:', error)
    addToast(currentLang.value === 'ro' ? '❌ Eroare la salvare.' : '❌ Save failed.', 'error')
  }
}

const handleDeleteRecurring = async (id) => {
  try {
    if (user.value.isGuest) {
      recurringTransactions.value = recurringTransactions.value.filter(r => r.id !== id)
      localStorage.setItem('guest_recurring', JSON.stringify(recurringTransactions.value))
    } else {
      await deleteDoc(doc(db, 'recurringTransactions', id))
    }
    addToast(
      currentLang.value === 'ro' ? '🗑️ Recurenta stearsa.' : '🗑️ Recurring transaction deleted.',
      'success'
    )
  } catch (error) {
    console.error('Error deleting recurring:', error)
    addToast(currentLang.value === 'ro' ? '❌ Eroare la stergere.' : '❌ Delete failed.', 'error')
  }
}

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
    return isInRange 
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
    // 1. Filtrul pentru Venit/Cheltuială (când dai click pe carduri)
    if (activeCardFilter.value === 'income' && t.amount < 0) return false
    if (activeCardFilter.value === 'expense' && t.amount > 0) return false

    // 2. Filtrul din bara de căutare
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    // 3. Filtrul din meniul de categorii
    const matchesCategory = selectedCategory.value === '' || t.category === selectedCategory.value

    return matchesSearch && matchesCategory
  })
})

// --- BUGETE COMPUTED PROPERTIES ---

// Anul si luna selectate in TimeNavigator (0-indexed pentru luna)
const selectedYear  = computed(() => new Date(referenceDate.value).getFullYear())
const selectedMonth = computed(() => new Date(referenceDate.value).getMonth())

// Cheltuielile userului curent din luna/anul selectat in TimeNavigator
const currentMonthTransactions = computed(() => {
  const year  = selectedYear.value
  const month = selectedMonth.value
  return transactions.value.filter(t => {
    if (t.amount >= 0) return false // ignoram veniturile
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
})

const spentByCategory = computed(() => {
  const spent = {}

  // Initializeaza toate categoriile cu bugete setate la 0
  budgets.value.forEach(b => { spent[b.category] = 0 })

  // Acumuleaza cheltuielile din luna curenta (valorile sunt deja filtrate ca negative)
  currentMonthTransactions.value.forEach(t => {
    if (!spent[t.category]) spent[t.category] = 0
    spent[t.category] += Math.abs(t.amount)
  })
  
  // LOGICA TOAST ALERT @ 80% și 100%
  const currentMonth = new Date().getMonth()
  if (currentMonth !== lastAlertMonth.value) {
    // S-a schimbat luna → resetează alertele
    alertedBudgets.value.clear()
    lastAlertMonth.value = currentMonth
  }
  
  budgets.value.forEach(budget => {
    const categorySpent = spent[budget.category] || 0
    const percent = budget.limitAmount > 0 ? (categorySpent / budget.limitAmount) * 100 : 0
    
    if (percent >= 100) {
      // Alert @ 100%
      const alertKey = `100_${budget.category}`
      if (!alertedBudgets.value.has(alertKey)) {
        alertedBudgets.value.add(alertKey)
        const catName = t.value.catMap[budget.category] || budget.category
        const msg = currentLang.value === 'ro'
          ? `❌ Buget depășit! Ați cheltuit 100%+ din bugetul pentru ${catName}`
          : `❌ Budget exceeded! You spent 100%+ of budget for ${catName}`
        addToast(msg, 'danger')
      }
    } else if (percent >= 80) {
      // Alert @ 80%
      const alertKey = `80_${budget.category}`
      if (!alertedBudgets.value.has(alertKey)) {
        alertedBudgets.value.add(alertKey)
        const catName = t.value.catMap[budget.category] || budget.category
        const msg = currentLang.value === 'ro'
          ? `⚠️ Atenție! Ați cheltuit ${percent.toFixed(0)}% din bugetul pentru ${catName}`
          : `⚠️ Warning! You spent ${percent.toFixed(0)}% of budget for ${catName}`
        addToast(msg, 'warning')
      }
    }
  })
  
  return spent
})

const daysRemaining = computed(() => {
  const today = new Date()
  const curYear  = today.getFullYear()
  const curMonth = today.getMonth()
  const selYear  = selectedYear.value
  const selMonth = selectedMonth.value
  const lastDay  = new Date(selYear, selMonth + 1, 0) // ultima zi din luna selectata

  if (selYear < curYear || (selYear === curYear && selMonth < curMonth)) {
    return 0 // luna trecuta
  } else if (selYear === curYear && selMonth === curMonth) {
    // luna curenta — zile reale ramase
    return Math.max(0, Math.ceil((lastDay - today) / (24 * 60 * 60 * 1000)))
  } else {
    return lastDay.getDate() // luna viitoare — nr total de zile
  }
})
// --- STERGERE DATE ---
const deleteAllTransactions = async () => {
  try {
    if (user.value?.isGuest) {
      transactions.value = []
      localStorage.removeItem('guest_transactions')
    } else {
      const q = query(collection(db, 'transactions'), where('uid', '==', user.value.uid))
      const snap = await getDocs(q)
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'transactions', d.id))))
    }
    addToast(currentLang.value === 'ro' ? '🗑️ Toate tranzactiile au fost sterse.' : '🗑️ All transactions deleted.', 'success')
  } catch (e) { addToast('❌ Eroare la stergere.', 'error') }
}
const deleteAllBudgets = async () => {
  try {
    if (user.value?.isGuest) {
      budgets.value = []
      localStorage.removeItem('guest_budgets')
    } else {
      const q = query(collection(db, 'budgets'), where('uid', '==', user.value.uid))
      const snap = await getDocs(q)
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'budgets', d.id))))
    }
    addToast(currentLang.value === 'ro' ? '🗑️ Toate bugetele au fost sterse.' : '🗑️ All budgets deleted.', 'success')
  } catch (e) { addToast('❌ Eroare la stergere.', 'error') }
}

// --- FUNCȚIA DE EXPORT EXCEL/CSV ---
const exportCSV = () => {
  const BOM = "\uFEFF"
  const headers = t.value.locale === 'ro-RO' 
    ? "Data,Nume Tranzactie,Categorie,Suma,Tip\n"
    : "Date,Transaction Name,Category,Amount,Type\n"
  
  let csvContent = BOM + headers

  // AICI ERA PROBLEMA: am corectat din filteredTransactions în transactions
  displayListTransactions.value.forEach(item => {
    const date = item.date
    const name = `"${item.name.replace(/"/g, '""')}"`
    const category = t.value.catMap[item.category] || item.category
    
    let type = ''
    if (t.value.locale === 'ro-RO') {
      type = item.amount > 0 ? 'Venit' : 'Cheltuiala'
    } else {
      type = item.amount > 0 ? 'Income' : 'Expense'
    }

    csvContent += `${date},${name},${category},${item.amount},${type}\n`
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = t.value.locale === 'ro-RO' ? "Istoric_FinDash.csv" : "FinDash_History.csv"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// --- PROVIDE PENTRU VIEWS ---
provide('transactions', transactions)
provide('globalRates', globalRates)
provide('viewUnit', viewUnit)
provide('referenceDate', referenceDate)
provide('activeCurrency', activeCurrency)
provide('budgets', budgets)
provide('recurringTransactions', recurringTransactions)
provide('dashboardTransactions', dashboardTransactions)
provide('displayListTransactions', displayListTransactions)
provide('spentByCategory', spentByCategory)
provide('daysRemaining', daysRemaining)
provide('selectedYear', selectedYear)
provide('selectedMonth', selectedMonth)

provide('activeCardFilter', activeCardFilter)
provide('setActiveCardFilter', v => { activeCardFilter.value = v })
provide('searchQuery', searchQuery)
provide('setSearchQuery', v => { searchQuery.value = v })
provide('selectedCategory', selectedCategory)
provide('setSelectedCategory', v => { selectedCategory.value = v })

provide('handleDeleteTransaction', handleDeleteTransaction)
provide('handleSaveTransaction', handleSaveTransaction)
provide('handleImportTransactions', handleImportTransactions)
provide('openEditModal', openEditModal)
provide('handleDeleteRecurring', handleDeleteRecurring)
provide('openEditRecurring', openEditRecurring)
provide('checkAndGenerateRecurring', checkAndGenerateRecurring)
provide('handleRates', handleRates)
provide('exportCSV', exportCSV)
provide('openBudgetModal', () => { isBudgetModalOpen.value = true })
provide('openRecurringModal', () => { isRecurringModalOpen.value = true })

provide('currentLang', currentLang)
provide('isDarkMode', isDarkMode)
provide('toggleLanguage', toggleLanguage)
provide('toggleTheme', toggleTheme)
provide('customCategories', customCategories)
provide('addCustomCategory', addCustomCategory)
provide('deleteCustomCategory', deleteCustomCategory)
provide('deleteAllTransactions', deleteAllTransactions)
provide('deleteAllBudgets', deleteAllBudgets)
</script>

<style scoped>
/* STILURI DE BAZĂ */
#app-root { font-family: 'Inter', sans-serif; background: #f4f7f6; min-height: 100vh; color: #2c3e50; }

/* HEADER */
.app-header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 1000; }
.header-left { display: flex; align-items: center; gap: 15px; min-width: 0; }
.header-left h2 { margin: 0; font-size: 20px; color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hamburger-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #34495e; padding: 5px; border-radius: 5px; transition: 0.2s; flex-shrink: 0; }
.hamburger-btn:hover { background: #f1f3f5; }
.header-right { display: flex; align-items: center; gap: 15px; flex-shrink: 0; }
.user-email { font-size: 14px; color: #7f8c8d; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.logout-btn { background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.logout-btn:hover { background: #c0392b; }

/* MAIN CONTENT */
.main-content { padding: 25px; max-width: 1440px; margin: 0 auto; width: 100%; }
@media (min-width: 1600px) { .main-content { max-width: 1600px; padding: 30px 40px; } }

/* === RESPONSIV HEADER SI CONTINUT (MOBIL) === */
@media (max-width: 768px) {
  /* Header pe 2 randuri: rand1 = hamburger+titlu+iesire, rand2 = limba+tema+email */
  .app-header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      "hamburger title logout"
      "lang theme email";
    align-items: center;
    column-gap: 10px;
    row-gap: 8px;
    padding: 10px 14px;
  }
  .header-left, .header-right { display: contents; }
  .hamburger-btn { grid-area: hamburger; min-height: 44px; min-width: 44px; }
  .header-left h2 { grid-area: title; font-size: 16px; }
  .logout-btn { grid-area: logout; min-height: 44px; padding: 8px 12px; font-size: 14px; }
  .lang-btn { grid-area: lang; min-height: 44px; min-width: 44px; display: flex; align-items: center; justify-content: center; }
  .theme-btn { grid-area: theme; min-height: 44px; min-width: 44px; display: flex; align-items: center; justify-content: center; }
  .user-email { grid-area: email; justify-self: end; font-size: 14px; max-width: 150px; }
  .lang-text { display: none; }
  .main-content { padding: 14px; }
  .currency-tabs { padding: 6px; gap: 6px; }
  .currency-tabs button { padding: 8px 12px; font-size: 14px; min-height: 44px; }
  .transactions-section { padding: 14px; margin-top: 16px; }
  .fab-button { width: 52px; height: 52px; font-size: 26px; bottom: 18px; right: 18px; }
  .sidebar { width: 82vw; max-width: 300px; left: -85vw; }
  .list-header { flex-wrap: wrap; gap: 10px; }
}

@media (max-width: 480px) {
  .app-header { padding: 8px 12px; column-gap: 8px; }
  .header-left h2 { font-size: 15px; }
  .user-email { max-width: 110px; font-size: 13px; }
  .modal-content { padding: 16px; width: 94%; }
  .sidebar { width: 85vw; }
}
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
.fab-button { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: #3498db; color: white; border: none; border-radius: 50%; font-size: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4); cursor: pointer; z-index: 1000; transition: 0.2s; padding-bottom: 4px;}
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
body.dark-mode { background-color: #1a1a2e !important; }
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
body.dark-mode .transaction-item,
body.dark-mode .budget-overview {
  background-color: #16213e !important;
  border-color: #0f3460 !important;
}

/* BUGETE - containere interioare (mai inchise decat wrapper-ul, ca empty-state) */
body.dark-mode .budget-empty,
body.dark-mode .budget-card,
body.dark-mode .budget-row {
  background-color: #1a1a2e !important;
  border-color: #0f3460 !important;
}

/* BUGETE - texte */
body.dark-mode .budget-section-header h3,
body.dark-mode .budget-category-name,
body.dark-mode .budget-amounts strong,
body.dark-mode .budget-row-cat {
  color: #f1f1f1 !important;
}
body.dark-mode .budget-amounts,
body.dark-mode .remaining-label,
body.dark-mode .budget-row-amount,
body.dark-mode .empty-desc {
  color: #a5b1c2 !important;
}
body.dark-mode .manage-btn {
  background-color: #1a1a2e !important;
  border-color: #0f3460 !important;
  color: #a5b1c2 !important;
}
body.dark-mode .manage-btn:hover {
  background-color: #3498db !important;
  color: white !important;
}
body.dark-mode .progress-track    { background-color: #0f3460 !important; }
body.dark-mode .budget-row-amount { color: #a5b1c2 !important; }

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
   RESPONSIVE GLOBAL — reguli valabile pe toata aplicatia
   ========================================= */
* { box-sizing: border-box; }
html, body, #app { overflow-x: hidden; max-width: 100vw; }
img, svg { max-width: 100%; height: auto; }

@media (max-width: 768px) {
  body { font-size: 14px; }

  /* Touch target minim pe butoanele reale de actiune (excludem iconitele mici inline) */
  button:not(.icon-btn):not(.edit-btn):not(.delete-btn):not(.close-btn):not(.action-btn):not(.hamburger-btn):not(.cat-del):not(.remove-btn) {
    min-height: 44px;
  }
  .btn-dashboard { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }

  /* Orice container flex trebuie sa se poata infasura pe mobil ca sa nu depaseasca ecranul */
  .summary-container, .header-row, .card-top, .preview-top, .summary-badges,
  .pref-row, .danger-row, .about-content, .sim-data-bar, .sim-results,
  .filters-bar, .filter-toggle, .success-actions {
    flex-wrap: wrap;
  }
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
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  max-width: 400px; width: 90%;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 15px;
}
.login-title {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  text-align: center;
}

.login-title h1 {
  margin: 0;
  text-align: left;
  font-size: clamp(1.4rem, 5vw, 2rem);
}

.login-emoji {
  font-size: clamp(1.8rem, 6vw, 2.5rem);
  flex-shrink: 0;
  line-height: 1;
}
.login-box p { color: #7f8c8d; font-size: 14px; margin-bottom: 10px; line-height: 1.5; }

.google-btn, .guest-btn {
  width: 280px; max-width: 100%; box-sizing: border-box;
  padding: 14px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 16px;
}
.google-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: #ffffff; color: #3c4043; border: 1px solid #dadce0;
}
.google-btn:hover { background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.google-icon { width: 20px; height: 20px; }

/* Butonul de Vizitator - Fără fundal, doar contur elegant */
.guest-btn {
  background: transparent; color: #3498db; border: 2px solid #3498db;
}
.guest-btn:hover { background: rgba(52, 152, 219, 0.1); }

/* Pe mobil, ambele butoane ocupa toata latimea cardului de login */
@media (max-width: 768px) {
  .google-btn, .guest-btn { width: 100%; }
}

/* Dark mode pentru login */
body.dark-mode .login-screen { background: #1a1a2e; }
body.dark-mode .login-box { background: #16213e; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
body.dark-mode .login-title h1 { color: #f1f1f1; }
body.dark-mode .google-btn { background: #2c3e50; color: #fff; border-color: #4a627a; }
body.dark-mode .google-btn:hover { background: #34495e; }

/* --- STIL PENTRU BUTONUL DE EXPORT --- */
.list-header {
  display: flex;
  justify-content: space-between;
  
  align-items: center;
  margin-bottom: 15px;
}
.list-header h3 { margin: 0; }

.export-btn {
  background-color: #f1f3f5;
  color: #2c3e50;
  border: 1px solid #dcdde1;
  padding: 8px 15px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}
.export-btn:hover {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.2);
}

/* Dark Mode pentru Export */
body.dark-mode .export-btn {
  background-color: #1a1a2e;
  color: #a5b1c2;
  border-color: #0f3460;
}
body.dark-mode .export-btn:hover {
  background-color: #3498db;
  color: white;
}

</style>

