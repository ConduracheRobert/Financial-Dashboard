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

        <RecurringList
          :recurringTransactions="recurringTransactions"
          @open-manage="isRecurringModalOpen = true"
          @delete-recurring="handleDeleteRecurring"
          @edit-recurring="openEditRecurring"
          @generate-now="checkAndGenerateRecurring(true)"
        />

        <BudgetOverview
          :budgets="budgets"
          :spentByCategory="spentByCategory"
          :daysRemaining="daysRemaining"
          :selectedYear="selectedYear"
          :selectedMonth="selectedMonth"
          :viewUnit="viewUnit"
          @open-manage="isBudgetModalOpen = true"
        />

        <ExpenseChart
          :transactions="displayListTransactions"
          :currentFilter="activeCardFilter"
        />

        <div class="transactions-section">
          <div class="list-header">
      <h3>{{ t.latestTransactions }}</h3>
      <button @click="exportCSV" class="export-btn">
        {{ t.locale === 'ro-RO' ? '📥 Descarcă CSV' : '📥 Export CSV' }}
      </button>
    </div>
          <TransactionFilters 
            v-model:searchQuery="searchQuery"
            v-model:selectedCategory="selectedCategory"
          />
          <TransactionList 
  :transactions="displayListTransactions" 
  @delete-transaction="handleDeleteTransaction" 
  @edit-transaction="openEditModal" 
/>
        </div>
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
import { db, auth } from './firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'

import DashboardSummary from './components/DashboardSummary.vue'
import TimeNavigator from './components/TimeNavigator.vue'
import TransactionForm from './components/TransactionForm.vue'
import TransactionList from './components/TransactionList.vue'
import TransactionFilters from './components/TransactionFilters.vue'
import ExpenseChart from './components/ExpenseChart.vue'
import ToastContainer from './components/ToastContainer.vue'
import BudgetOverview from './components/BudgetOverview.vue'
import BudgetForm from './components/BudgetForm.vue'
import RecurringList from './components/RecurringList.vue'
import RecurringForm from './components/RecurringForm.vue'
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

// BUGETE - State Management
const budgets = ref([])
const alertedBudgets = ref(new Set())
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
  if (user.value.uid === 'local_guest') {
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
    console.error("EROARE LA SALVAREA ÎN FIREBASE:", error)
    addToast(
      currentLang.value === 'ro'
        ? '❌ Eroare la salvare. Verifică consola pentru detalii.'
        : '❌ Save failed. Check the console for details.',
      'error'
    )
    isModalOpen.value = false
  }
}

const handleDeleteTransaction = async (id) => {
  await deleteDoc(doc(db, 'transactions', id))
  addToast(
    currentLang.value === 'ro' ? '🗑️ Tranzacție ștearsă.' : '🗑️ Transaction deleted.',
    'success'
  )
}

const handleRates = (rates) => { globalRates.value = rates }

// --- BUGETE: LOAD, SAVE, DELETE ---
const loadBudgets = () => {
  if (!user.value) return
  
  if (user.value.uid === 'local_guest') {
    // Încarcă din localStorage
    const saved = localStorage.getItem('guest_budgets')
    budgets.value = saved ? JSON.parse(saved) : []
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
    if (user.value.uid === 'local_guest') {
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
    console.error('Error saving budget:', error)
    addToast(
      currentLang.value === 'ro' ? '❌ Eroare la salvare.' : '❌ Save failed.',
      'error'
    )
  }
}

const handleDeleteBudget = async (id) => {
  try {
    if (user.value.uid === 'local_guest') {
      // Guest mode
      budgets.value = budgets.value.filter(b => b.id !== id)
      localStorage.setItem('guest_budgets', JSON.stringify(budgets.value))
    } else {
      // Firestore
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
const checkAndGenerateRecurring = async (manual = false) => {
  const now = new Date()
  const nowYear  = now.getFullYear()
  const nowMonth = now.getMonth() + 1  // 1-12
  const nowDay   = now.getDate()

  let generatedCount = 0

  for (const r of recurringTransactions.value) {
    const last = r.lastGenerated ? new Date(r.lastGenerated) : null
    const lastYear  = last ? last.getFullYear() : 0
    const lastMonth = last ? last.getMonth() + 1 : 0

    let shouldGenerate = false

    if (r.frequency === 'lunar') {
      // genereaza daca suntem intr-o luna noua fata de lastGenerated si ziua a sosit
      const newMonth = (nowYear > lastYear) || (nowYear === lastYear && nowMonth > lastMonth)
      shouldGenerate = newMonth && nowDay >= r.dayOfMonth
    } else if (r.frequency === 'anual') {
      // genereaza daca suntem intr-un an nou fata de lastGenerated, luna si ziua au sosit
      const newYear = nowYear > lastYear
      shouldGenerate = newYear && nowMonth >= r.monthOfYear && nowDay >= r.dayOfMonth
    }

    if (!shouldGenerate) continue

    const txData = {
      name: r.name,
      amount: r.amount,
      category: r.category,
      date: now.toISOString().split('T')[0]
    }
    const newLastGenerated = now.toISOString()

    if (user.value.uid === 'local_guest') {
      transactions.value.push({ ...txData, id: Date.now().toString() + Math.random() })
      localStorage.setItem('guest_transactions', JSON.stringify(transactions.value))

      const idx = recurringTransactions.value.findIndex(x => x.id === r.id)
      if (idx !== -1) recurringTransactions.value[idx].lastGenerated = newLastGenerated
      localStorage.setItem('guest_recurring', JSON.stringify(recurringTransactions.value))
    } else {
      await addDoc(collection(db, 'transactions'), { ...txData, uid: user.value.uid })
      await updateDoc(doc(db, 'recurringTransactions', r.id), { lastGenerated: newLastGenerated })
    }

    generatedCount++
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
          : '🔄 Nicio recurenta nu e scadenta inca. Verifica ziua setata.'
        : recurringTransactions.value.length === 0
          ? '🔄 No recurring transactions configured.'
          : '🔄 No recurring transactions due yet. Check the set day.',
      'info'
    )
  }
}

const loadRecurring = () => {
  if (!user.value) return

  if (user.value.uid === 'local_guest') {
    const saved = localStorage.getItem('guest_recurring')
    recurringTransactions.value = saved ? JSON.parse(saved) : []
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
    if (user.value.uid === 'local_guest') {
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
    console.error('Error saving recurring:', error)
    addToast(currentLang.value === 'ro' ? '❌ Eroare la salvare.' : '❌ Save failed.', 'error')
  }
}

const handleDeleteRecurring = async (id) => {
  try {
    if (user.value.uid === 'local_guest') {
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

