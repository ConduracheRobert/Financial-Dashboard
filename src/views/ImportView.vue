<template>
  <div class="import-view">

    <!-- Stepper -->
    <div class="stepper">
      <div class="step-item" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
        <div class="step-circle">{{ currentStep > 1 ? '✓' : '1' }}</div>
        <span class="step-label">{{ t.importStep1Label }}</span>
      </div>
      <div class="step-connector" :class="{ done: currentStep > 1 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 2, done: currentStep > 2 }">
        <div class="step-circle">{{ currentStep > 2 ? '✓' : '2' }}</div>
        <span class="step-label">{{ t.importStep2Label }}</span>
      </div>
      <div class="step-connector" :class="{ done: currentStep > 2 }"></div>
      <div class="step-item" :class="{ active: currentStep >= 3 }">
        <div class="step-circle">3</div>
        <span class="step-label">{{ t.importStep3Label }}</span>
      </div>
    </div>

    <!-- PAS 1: Upload -->
    <div v-if="currentStep === 1" class="step-panel">
      <h2 class="panel-title">{{ t.importTitle }}</h2>
      <p class="panel-subtitle">{{ t.importSubtitle }}</p>

      <div class="form-group">
        <label class="form-label">{{ t.importSelectBank }}</label>
        <select v-model="selectedBank" class="bank-select">
          <option value="">{{ t.importSelectBankPlaceholder }}</option>
          <option value="bt">Banca Transilvania (BT)</option>
          <option value="bcr">BCR</option>
          <option value="revolut">Revolut</option>
        </select>
      </div>

      <div
        class="dropzone"
        :class="{ dragover: isDragging, 'has-file': selectedFile }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf"
          class="hidden-input"
          @change="handleFileSelect"
        />

        <div v-if="!selectedFile" class="dropzone-empty">
          <span class="dropzone-icon">📄</span>
          <p class="dropzone-text">{{ t.importDropzoneText }}</p>
          <p class="dropzone-hint">{{ t.importDropzoneHint }}</p>
        </div>

        <div v-else class="dropzone-file" @click.stop>
          <span class="file-icon">📋</span>
          <div class="file-info">
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
          </div>
          <button class="remove-btn" @click.stop="removeFile">×</button>
        </div>
      </div>

      <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>

      <button
        class="process-btn"
        :disabled="!selectedFile || !selectedBank || isProcessing"
        @click="processFile"
      >
        <span v-if="isProcessing" class="btn-loading">
          <span class="spinner"></span> {{ t.importProcessing }}
        </span>
        <span v-else>⚙️ {{ t.importProcessBtn }}</span>
      </button>
    </div>

    <!-- PAS 2: Preview -->
    <div v-if="currentStep === 2" class="step-panel step-panel--wide">
      <div class="preview-top">
        <div class="summary-badges">
          <span class="badge badge--total">
            {{ t.importDetected }}: <strong>{{ previewTransactions.length }}</strong>
          </span>
          <span class="badge badge--income">
            {{ t.incomeToggle }}: <strong>{{ incomeCount }}</strong>
          </span>
          <span class="badge badge--expense">
            {{ t.expenseToggle }}: <strong>{{ expenseCount }}</strong>
          </span>
        </div>
        <button class="toggle-all-btn" @click="toggleSelectAll">
          {{ allSelected ? t.importDeselectAll : t.importSelectAll }}
        </button>
      </div>

      <div class="table-wrap">
        <table class="preview-table">
          <thead>
            <tr>
              <th class="th-check">
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
              </th>
              <th>{{ t.date }}</th>
              <th>{{ t.transName }}</th>
              <th>{{ t.amount }}</th>
              <th>{{ t.importType }}</th>
              <th>{{ t.category }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(tx, idx) in previewTransactions"
              :key="idx"
              :class="{ 'row-selected': tx.selected, 'row-deselected': !tx.selected }"
            >
              <td><input type="checkbox" v-model="tx.selected" /></td>
              <td class="col-date">{{ tx.date }}</td>
              <td class="col-desc" :title="tx.description">{{ tx.description }}</td>
              <td class="col-amount" :class="tx.amount > 0 ? 'pos' : 'neg'">
                {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount.toFixed(2) }} RON
              </td>
              <td>
                <span class="type-pill" :class="tx.amount > 0 ? 'pill-income' : 'pill-expense'">
                  {{ tx.amount > 0 ? t.incomeToggle : t.expenseToggle }}
                </span>
              </td>
              <td>
                <select v-model="tx.category" class="cat-select">
                  <optgroup :label="t.expenseToggle">
                    <option v-for="cat in expenseCategories" :key="cat" :value="cat">
                      {{ t.catMap[cat] || cat }}
                    </option>
                  </optgroup>
                  <optgroup :label="t.incomeToggle">
                    <option v-for="cat in incomeCategories" :key="cat" :value="cat">
                      {{ t.catMap[cat] || cat }}
                    </option>
                  </optgroup>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="preview-footer">
        <button class="back-btn" @click="currentStep = 1">← {{ t.importBack }}</button>
        <button
          class="import-btn"
          :disabled="selectedCount === 0 || isImporting"
          @click="doImport"
        >
          <span v-if="isImporting" class="btn-loading">
            <span class="spinner"></span>
          </span>
          <span v-else>📥 {{ t.importBtn }} {{ selectedCount }} {{ t.importBtnSuffix }}</span>
        </button>
      </div>
    </div>

    <!-- PAS 3: Succes -->
    <div v-if="currentStep === 3" class="step-panel step-success">
      <div class="success-icon">✅</div>
      <h3 class="success-title">
        {{ importedCount }} {{ t.importSuccess }}
      </h3>
      <div class="success-actions">
        <RouterLink to="/" class="btn-dashboard">📊 {{ t.importViewDashboard }}</RouterLink>
        <button class="btn-restart" @click="resetImport">📥 {{ t.importAnother }}</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { RouterLink } from 'vue-router'
import { parseBT, parseBCR, parseRevolut } from '../utils/pdfParsers.js'



const t = inject('t')
const customCategories = inject('customCategories')
const handleImportTransactions = inject('handleImportTransactions')

// Categorii implicite
const DEFAULT_EXPENSE = ['Mâncare', 'Transport', 'Facturi & Utilități', 'Cumpărături', 'Divertisment', 'Sănătate', 'Educație', 'Casă', 'Extras Cont', 'Altele']
const DEFAULT_INCOME  = ['Salariu', 'Bonus', 'Investiții', 'Cadouri primite', 'Vânzări', 'Altele']

const expenseCategories = computed(() => [...DEFAULT_EXPENSE, ...(customCategories?.value?.expense || [])])
const incomeCategories  = computed(() => [...DEFAULT_INCOME,  ...(customCategories?.value?.income  || [])])

// State stepper
const currentStep = ref(1)

// Pas 1
const selectedBank  = ref('')
const selectedFile  = ref(null)
const isDragging    = ref(false)
const isProcessing  = ref(false)
const errorMsg      = ref('')
const fileInputRef  = ref(null)

// Pas 2
const previewTransactions = ref([])
const isImporting = ref(false)

// Pas 3
const importedCount = ref(0)

// Computed preview
const incomeCount  = computed(() => previewTransactions.value.filter(tx => tx.amount > 0).length)
const expenseCount = computed(() => previewTransactions.value.filter(tx => tx.amount < 0).length)
const selectedCount = computed(() => previewTransactions.value.filter(tx => tx.selected).length)
const allSelected   = computed(() => previewTransactions.value.length > 0 && previewTransactions.value.every(tx => tx.selected))

// Utilitare
const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const triggerFileInput = () => fileInputRef.value?.click()

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) setFile(file)
}

const handleDrop = (e) => {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file?.type === 'application/pdf') {
    setFile(file)
  } else {
    errorMsg.value = 'Fisierul trebuie sa fie un PDF.'
  }
}

const setFile = (file) => {
  errorMsg.value = ''
  selectedFile.value = file
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const processFile = async () => {
  if (!selectedFile.value || !selectedBank.value) return
  errorMsg.value = ''
  isProcessing.value = true

  try {
    let txs = []
    if      (selectedBank.value === 'bt')      txs = await parseBT(selectedFile.value)
    else if (selectedBank.value === 'bcr')     txs = await parseBCR(selectedFile.value)
    else if (selectedBank.value === 'revolut') txs = await parseRevolut(selectedFile.value)

    if (txs.length === 0) {
      errorMsg.value = t.value.importNoTransactions
      return
    }

    // Sort newest first
    txs.sort((a, b) => b.date.localeCompare(a.date))
    previewTransactions.value = txs
    currentStep.value = 2
  } catch (err) {
    console.error('[ImportView] processFile:', err)
    errorMsg.value = 'Eroare la procesarea PDF-ului. Incearca din nou.'
  } finally {
    isProcessing.value = false
  }
}

const toggleSelectAll = () => {
  const newVal = !allSelected.value
  previewTransactions.value.forEach(tx => { tx.selected = newVal })
}

const doImport = async () => {
  isImporting.value = true
  const selected = previewTransactions.value.filter(tx => tx.selected)

  const { imported } = await handleImportTransactions(
    selected.map(tx => ({ name: tx.description, amount: tx.amount, category: tx.category, date: tx.date }))
  )

  importedCount.value = imported
  isImporting.value = false
  currentStep.value = 3
}

const resetImport = () => {
  currentStep.value = 1
  selectedBank.value = ''
  selectedFile.value = null
  errorMsg.value = ''
  previewTransactions.value = []
  importedCount.value = 0
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>

<style scoped>
.import-view {
  padding: 20px 0;
  max-width: 960px;
  margin: 0 auto;
}

/* ── Stepper ── */
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 36px;
  padding: 0 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  color: #adb5bd;
  background: white;
  transition: all 0.3s;
}

.step-item.active .step-circle {
  border-color: #3498db;
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
}

.step-item.done .step-circle {
  border-color: #2ecc71;
  background: #2ecc71;
  color: white;
}

.step-label {
  font-size: 12px;
  font-weight: 600;
  color: #adb5bd;
  text-align: center;
  white-space: nowrap;
}

.step-item.active .step-label,
.step-item.done .step-label {
  color: #2c3e50;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: #dee2e6;
  margin: 0 8px;
  margin-bottom: 26px;
  transition: background 0.3s;
}

.step-connector.done {
  background: #2ecc71;
}

/* ── Panel ── */
.step-panel {
  background: white;
  border-radius: 16px;
  padding: 36px 40px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
}

.step-panel--wide {
  padding: 28px 24px;
}

.panel-title {
  margin: 0 0 6px 0;
  font-size: 22px;
  color: #2c3e50;
}

.panel-subtitle {
  margin: 0 0 28px 0;
  color: #7f8c8d;
  font-size: 14px;
}

/* ── Form ── */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 8px;
}

.bank-select {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #dee2e6;
  border-radius: 10px;
  font-size: 14px;
  color: #2c3e50;
  background: white;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
  max-width: 380px;
}

.bank-select:focus {
  border-color: #3498db;
}

/* ── Dropzone ── */
.dropzone {
  border: 2px dashed #dee2e6;
  border-radius: 14px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
  margin-bottom: 20px;
  background: #fafbfc;
}

.dropzone:hover,
.dropzone.dragover {
  border-color: #3498db;
  background: rgba(52, 152, 219, 0.04);
}

.dropzone.has-file {
  border-style: solid;
  border-color: #2ecc71;
  background: rgba(46, 204, 113, 0.04);
  padding: 20px 24px;
}

.hidden-input {
  display: none;
}

.dropzone-icon {
  font-size: 52px;
  display: block;
  margin-bottom: 14px;
}

.dropzone-text {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.dropzone-hint {
  margin: 0;
  font-size: 13px;
  color: #adb5bd;
}

.dropzone-file {
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: center;
}

.file-icon {
  font-size: 32px;
}

.file-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.file-name {
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
}

.file-size {
  font-size: 12px;
  color: #7f8c8d;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 22px;
  color: #e74c3c;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: 0.2s;
  line-height: 1;
}

.remove-btn:hover {
  background: rgba(231, 76, 60, 0.1);
}

/* ── Error ── */
.error-msg {
  color: #e74c3c;
  font-size: 13px;
  margin-bottom: 14px;
  padding: 10px 14px;
  background: rgba(231, 76, 60, 0.08);
  border-radius: 8px;
}

/* ── Process button ── */
.process-btn {
  width: 100%;
  padding: 14px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 380px;
  display: block;
}

.process-btn:hover:not(:disabled) {
  background: #2980b9;
  box-shadow: 0 4px 14px rgba(52, 152, 219, 0.35);
}

.process-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Spinner ── */
.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Preview top bar ── */
.preview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.badge--total  { background: rgba(52, 152, 219, 0.1); color: #2980b9; }
.badge--income { background: rgba(46, 204, 113, 0.1); color: #27ae60; }
.badge--expense { background: rgba(231, 76, 60, 0.1); color: #c0392b; }

.toggle-all-btn {
  padding: 8px 16px;
  background: #f1f3f5;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: #2c3e50;
  transition: 0.2s;
}

.toggle-all-btn:hover {
  background: #dee2e6;
}

/* ── Table ── */
.table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #f1f3f5;
  margin-bottom: 20px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.preview-table thead tr {
  background: #f8f9fa;
}

.preview-table th {
  padding: 11px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #7f8c8d;
  border-bottom: 1px solid #f1f3f5;
  white-space: nowrap;
}

.th-check { width: 40px; }

.preview-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f8f9fa;
  vertical-align: middle;
}

.preview-table tbody tr:last-child td {
  border-bottom: none;
}

.row-selected {
  background: white;
}

.row-deselected {
  background: #fafafa;
  opacity: 0.5;
}

.col-date {
  white-space: nowrap;
  color: #7f8c8d;
  font-size: 13px;
}

.col-desc {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2c3e50;
  font-weight: 500;
}

.col-amount {
  font-weight: 700;
  white-space: nowrap;
}

.pos { color: #27ae60; }
.neg { color: #e74c3c; }

.type-pill {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.pill-income  { background: rgba(46, 204, 113, 0.12); color: #27ae60; }
.pill-expense { background: rgba(231, 76, 60, 0.12);  color: #e74c3c; }

.cat-select {
  padding: 5px 8px;
  border: 1px solid #dee2e6;
  border-radius: 7px;
  font-size: 13px;
  background: white;
  color: #2c3e50;
  max-width: 180px;
  cursor: pointer;
}

/* ── Preview footer ── */
.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.back-btn {
  padding: 11px 20px;
  background: #f1f3f5;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
  transition: 0.2s;
}

.back-btn:hover {
  background: #dee2e6;
}

.import-btn {
  padding: 12px 28px;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;
}

.import-btn:hover:not(:disabled) {
  background: #27ae60;
  box-shadow: 0 4px 14px rgba(46, 204, 113, 0.35);
}

.import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Success ── */
.step-success {
  text-align: center;
  padding: 60px 40px;
}

.success-icon {
  font-size: 72px;
  margin-bottom: 20px;
}

.success-title {
  font-size: 22px;
  color: #2c3e50;
  margin: 0 0 32px 0;
}

.success-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-dashboard {
  display: inline-block;
  padding: 12px 28px;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  transition: 0.2s;
}

.btn-dashboard:hover {
  background: #2980b9;
  box-shadow: 0 4px 14px rgba(52, 152, 219, 0.35);
}

.btn-restart {
  padding: 12px 28px;
  background: #f1f3f5;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #2c3e50;
  cursor: pointer;
  transition: 0.2s;
}

.btn-restart:hover {
  background: #dee2e6;
}

/* ══════════════════════════════
   DARK MODE
══════════════════════════════ */
body.dark-mode .step-circle {
  background: #16213e !important;
  border-color: #0f3460 !important;
  color: #a5b1c2 !important;
}

body.dark-mode .step-item.active .step-circle {
  border-color: #3498db !important;
  color: #3498db !important;
  background: rgba(52, 152, 219, 0.15) !important;
}

body.dark-mode .step-item.done .step-circle {
  border-color: #2ecc71 !important;
  background: #2ecc71 !important;
  color: white !important;
}

body.dark-mode .step-label {
  color: #a5b1c2 !important;
}

body.dark-mode .step-item.active .step-label,
body.dark-mode .step-item.done .step-label {
  color: #f1f1f1 !important;
}

body.dark-mode .step-connector {
  background: #0f3460 !important;
}

body.dark-mode .step-connector.done {
  background: #2ecc71 !important;
}

body.dark-mode .step-panel {
  background: #16213e !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
}

body.dark-mode .panel-title,
body.dark-mode .success-title {
  color: #f1f1f1 !important;
}

body.dark-mode .panel-subtitle,
body.dark-mode .dropzone-hint {
  color: #a5b1c2 !important;
}

body.dark-mode .form-label {
  color: #a5b1c2 !important;
}

body.dark-mode .bank-select {
  background: #1a1a2e !important;
  border-color: #0f3460 !important;
  color: #f1f1f1 !important;
}

body.dark-mode .dropzone {
  border-color: #0f3460 !important;
  background: #1a1a2e !important;
}

body.dark-mode .dropzone:hover,
body.dark-mode .dropzone.dragover {
  border-color: #3498db !important;
  background: rgba(52, 152, 219, 0.08) !important;
}

body.dark-mode .dropzone.has-file {
  border-color: #2ecc71 !important;
  background: rgba(46, 204, 113, 0.06) !important;
}

body.dark-mode .dropzone-text,
body.dark-mode .file-name {
  color: #f1f1f1 !important;
}

body.dark-mode .file-size {
  color: #a5b1c2 !important;
}

body.dark-mode .toggle-all-btn {
  background: #1a1a2e !important;
  border-color: #0f3460 !important;
  color: #f1f1f1 !important;
}

body.dark-mode .toggle-all-btn:hover {
  background: #0f3460 !important;
}

body.dark-mode .table-wrap {
  border-color: #0f3460 !important;
}

body.dark-mode .preview-table thead tr {
  background: #0f3460 !important;
}

body.dark-mode .preview-table th {
  color: #a5b1c2 !important;
  border-bottom-color: #0f3460 !important;
}

body.dark-mode .preview-table td {
  border-bottom-color: #0f3460 !important;
}

body.dark-mode .row-selected {
  background: #16213e !important;
}

body.dark-mode .row-deselected {
  background: #1a1a2e !important;
}

body.dark-mode .col-desc,
body.dark-mode .col-date {
  color: #f1f1f1 !important;
}

body.dark-mode .col-date {
  color: #a5b1c2 !important;
}

body.dark-mode .cat-select {
  background: #1a1a2e !important;
  border-color: #0f3460 !important;
  color: #f1f1f1 !important;
}

body.dark-mode .back-btn {
  background: #1a1a2e !important;
  border-color: #0f3460 !important;
  color: #f1f1f1 !important;
}

body.dark-mode .back-btn:hover {
  background: #0f3460 !important;
}

body.dark-mode .btn-restart {
  background: #1a1a2e !important;
  border-color: #0f3460 !important;
  color: #f1f1f1 !important;
}

body.dark-mode .btn-restart:hover {
  background: #0f3460 !important;
}

body.dark-mode .badge--total  { background: rgba(52, 152, 219, 0.15) !important; }
body.dark-mode .badge--income { background: rgba(46, 204, 113, 0.15) !important; }
body.dark-mode .badge--expense { background: rgba(231, 76, 60, 0.15) !important; }

/* ── Responsive ── */
@media (max-width: 600px) {
  .stepper { gap: 0; }
  .step-label { display: none; }
  .step-panel { padding: 24px 16px; }
  .step-panel--wide { padding: 20px 12px; }
  .preview-footer { flex-direction: column; }
  .import-btn, .back-btn { width: 100%; }
  .process-btn { max-width: 100%; }
  .bank-select { max-width: 100%; }
}
</style>
