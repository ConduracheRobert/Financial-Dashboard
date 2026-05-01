<template>
  <div class="insights-placeholder">
    <div class="placeholder-icon">📈</div>
    <h2>{{ isRo ? 'Insights — În curând' : 'Insights — Coming Soon' }}</h2>
    <p>{{ isRo ? 'Statistici avansate, tipare de cheltuieli și sănătate financiară.' : 'Advanced statistics, spending patterns, and financial health.' }}</p>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

const t = inject('t')
const isRo = computed(() => t.value.locale === 'ro-RO')
</script>

<style scoped>
.insights-placeholder {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.placeholder-icon { font-size: 56px; margin-bottom: 16px; }
.insights-placeholder h2 { margin: 0 0 10px 0; color: #2c3e50; font-size: 24px; }
.insights-placeholder p { color: #7f8c8d; font-size: 16px; margin: 0; }

body.dark-mode .insights-placeholder { background: #16213e; box-shadow: none; }
body.dark-mode .insights-placeholder h2 { color: #f1f1f1; }
body.dark-mode .insights-placeholder p { color: #a5b1c2; }
</style>
