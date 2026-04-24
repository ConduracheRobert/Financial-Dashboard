<template>
  <div class="app-container">
    <header>
      <div class="header-top">
        <h1>📱 Financial Dashboard</h1>
        <div class="header-actions">
          <button @click="toggleTheme" class="theme-btn" title="Schimbă tema">
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
          <button v-if="user" @click="handleLogout" class="logout-btn">Ieșire</button>
        </div>
      </div>
    </header>

    <div v-if="!user" class="login-screen">
      <h2>Salut! 👋</h2>
      <p>Conectează-te pentru a-ți gestiona bugetul.</p>
      <button @click="handleLogin" class="google-btn">🌐 Conectare cu Google</button>
    </div>

    <main v-else>
      <TimeNavigator 
        v-model:viewUnit="viewUnit" 
        :referenceDate="referenceDate" 
        @navigate="handleNavigation" 
      />

      <DashboardSummary 
        :transactions="filteredTransactions" 
        :budget="budget"
        @update-budget="handleUpdateBudget"
      />

      <TransactionForm 
        :transactionToEdit="editingTransaction"
        @save-transaction="handleSaveTransaction" 
        @cancel-edit="editingTransaction = null"
      />
      
      <TransactionFilters 
        v-model:searchQuery="searchQuery"
        v-model:selectedCategory="selectedCategory"
      />

      <DashboardChart :transactions="filteredTransactions" />
      
      <TransactionList 
        :transactions="filteredTransactions" 
        @delete-transaction="handleDeleteTransaction" 
        @edit-transaction="startEdit"
      />
    </main>

    <ToastContainer :toasts="activeToasts" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import TimeNavigator from './components/TimeNavigator.vue'
import DashboardSummary from './components/DashboardSummary.vue'
import TransactionForm from './components/TransactionForm.vue'
import TransactionFilters from './components/TransactionFilters.vue'
import DashboardChart from './components/DashboardChart.vue'
import TransactionList from './components/TransactionList.vue'
import ToastContainer from './components/ToastContainer.vue'
import { auth, provider, signInWithPopup, signOut, db } from './firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, where, setDoc, getDoc } from 'firebase/firestore'

// Gestionez starea temei vizuale și o salvez persistent în browser
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')

watch(isDarkMode, (newVal) => {
  if (newVal) {
    document.body.classList.add('dark-mode')
    localStorage.setItem('theme', 'dark')
  } else {
    document.body.classList.remove('dark-mode')
    localStorage.setItem('theme', 'light')
  }
}, { immediate: true })

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
}

const transactions = ref([])
const user = ref(null)
const editingTransaction = ref(null)
const budget = ref(2000)
const searchQuery = ref('')
const selectedCategory = ref('')
const viewUnit = ref('month')
const referenceDate = ref(new Date())
let unsubscribe = null

const activeToasts = ref([])

const showToast = (message, type = 'success') => {
  const id = Date.now()
  activeToasts.value.push({ id, message, type })
  setTimeout(() => {
    activeToasts.value = activeToasts.value.filter(t => t.id !== id)
  }, 3000)
}

const filteredTransactions = computed(() => {
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
    const isInTimeRange = tDate >= startDate && tDate <= endDate
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === '' || t.category === selectedCategory.value
    return isInTimeRange && matchesSearch && matchesCategory
  })
})

const handleNavigation = (direction) => {
  const d = new Date(referenceDate.value)
  if (viewUnit.value === 'day') d.setDate(d.getDate() + direction)
  else if (viewUnit.value === 'week') d.setDate(d.getDate() + (direction * 7))
  else if (viewUnit.value === 'month') d.setMonth(d.getMonth() + direction)
  else if (viewUnit.value === 'year') d.setFullYear(d.getFullYear() + direction)
  referenceDate.value = d
}

onMounted(() => {
  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser
    if (currentUser) {
      showToast('Te-ai conectat cu succes!', 'info')
      const budgetDoc = await getDoc(doc(db, "budgets", currentUser.uid))
      if (budgetDoc.exists()) budget.value = budgetDoc.data().amount

      const q = query(collection(db, "transactions"), where("userId", "==", currentUser.uid))
      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = []
        snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }))
        fetched.sort((a, b) => new Date(b.date) - new Date(a.date))
        transactions.value = fetched
      })
    } else {
      transactions.value = []
      if (unsubscribe) unsubscribe()
    }
  })
})

const handleUpdateBudget = async (newAmount) => {
  budget.value = newAmount
  if (user.value) {
    try {
      await setDoc(doc(db, "budgets", user.value.uid), { amount: newAmount })
      showToast('Bugetul a fost actualizat!', 'success')
    } catch (e) {
      showToast('Eroare la actualizarea bugetului.', 'error')
    }
  }
}

const handleLogin = async () => { try { await signInWithPopup(auth, provider) } catch (e) { showToast('Eroare la conectare.', 'error') } }
const handleLogout = async () => { try { await signOut(auth); showToast('Te-ai deconectat.', 'info') } catch (e) { console.error(e) } }

const handleSaveTransaction = async (data) => {
  if (!user.value) return
  try {
    if (data.id) {
      await updateDoc(doc(db, "transactions", data.id), { ...data })
      showToast('Tranzacția a fost modificată!', 'success')
    } else {
      await addDoc(collection(db, "transactions"), { ...data, userId: user.value.uid })
      showToast('Tranzacție adăugată cu succes!', 'success')
    }
    editingTransaction.value = null
  } catch (e) { 
    showToast('Eroare la salvarea tranzacției.', 'error') 
  }
}

const handleDeleteTransaction = async (id) => { 
  try { 
    await deleteDoc(doc(db, "transactions", id))
    showToast('Tranzacția a fost ștearsă.', 'info')
  } catch (e) { 
    showToast('Eroare la ștergere.', 'error') 
  } 
}
const startEdit = (t) => { editingTransaction.value = t }
</script>

<style>
/* Stiluri Globale Standard */
body { margin: 0; background-color: #f8f9fa; font-family: Arial, sans-serif; transition: background-color 0.3s ease, color 0.3s ease; }
.app-container { max-width: 500px; margin: 0 auto; padding: 20px; }
header { margin-bottom: 20px; }
.header-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ECEFF1; padding-bottom: 10px; transition: border-color 0.3s; }
header h1 { color: #2c3e50; font-size: 20px; margin: 0; transition: color 0.3s; }

.header-actions { display: flex; align-items: center; gap: 15px; }
.theme-btn { background: none; border: none; font-size: 22px; cursor: pointer; transition: transform 0.3s; padding: 0; }
.theme-btn:hover { transform: scale(1.1); }

.logout-btn { background-color: #E74C3C; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; }
.logout-btn:hover { background-color: #c0392b; }
.login-screen { text-align: center; background: white; padding: 40px 20px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-top: 50px; transition: 0.3s; }
.login-screen h2 { color: #333; }
.login-screen p { color: #666; margin-bottom: 30px; }
.google-btn { background-color: #4285F4; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; }
.google-btn:hover { background-color: #3367D6; }

/* Suprascrieri pentru Dark Mode */
body.dark-mode { background-color: #1a1a2e; color: #ecf0f1; }
body.dark-mode .app-container { color: #ecf0f1; }
body.dark-mode header h1 { color: #ecf0f1; }
body.dark-mode .header-top { border-bottom-color: #333; }

/* Țintesc toate containerele albe din sub-componente pentru a le face întunecate */
body.dark-mode .form-container,
body.dark-mode .list-container,
body.dark-mode .chart-container,
body.dark-mode .time-navigator,
body.dark-mode .budget-setup,
body.dark-mode .progress-container,
body.dark-mode .card,
body.dark-mode .login-screen {
  background-color: #16213e;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  color: #ecf0f1;
}

/* Elemente de input și texte secundare */
body.dark-mode input, 
body.dark-mode select { background-color: #0f3460; color: white; border-color: #2c3e50; }
body.dark-mode .unit-selector { background-color: #0f3460; }
body.dark-mode .unit-selector button { color: #95a5a6; }
body.dark-mode .unit-selector button.active { background-color: #e94560; color: white; box-shadow: none; }

body.dark-mode h3, 
body.dark-mode h4, 
body.dark-mode .name, 
body.dark-mode .current-period,
body.dark-mode label,
body.dark-mode .login-screen h2 { color: #ecf0f1; }
body.dark-mode .login-screen p { color: #bdc3c7; }

/* Linii de separare și badge-uri */
body.dark-mode .transaction-item { border-bottom-color: #2c3e50; }
body.dark-mode .category-badge { background-color: #0f3460; color: #bdc3c7; }
body.dark-mode .progress-info { color: #bdc3c7; }
body.dark-mode .progress-bar-bg { background-color: #0f3460; }
</style>