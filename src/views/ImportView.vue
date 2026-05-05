<template>
  <div class="import-view">
    <div class="import-header">
      <h2>{{ t.importTitle }}</h2>
      <p class="import-subtitle">{{ t.importSubtitle }}</p>
    </div>

    <div class="import-placeholder">
      <span class="placeholder-icon">📥</span>
      <p>{{ t.importComingSoon }}</p>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const t = inject('t')
</script>

<style scoped>
.import-view {
  padding: 20px 0;
}

.import-header {
  margin-bottom: 30px;
}

.import-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #2c3e50;
}

.import-subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 15px;
}

.import-placeholder {
  background: white;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  border: 2px dashed #dee2e6;
}

.placeholder-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 20px;
}

.import-placeholder p {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
}

/* Dark mode */
body.dark-mode .import-header h2 {
  color: #f1f1f1 !important;
}

body.dark-mode .import-subtitle {
  color: #a5b1c2 !important;
}

body.dark-mode .import-placeholder {
  background: #16213e !important;
  border-color: #0f3460 !important;
}

body.dark-mode .import-placeholder p {
  color: #a5b1c2 !important;
}
</style>
