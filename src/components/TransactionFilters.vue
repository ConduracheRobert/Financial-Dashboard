<template>
  <div class="transaction-filters">
    <input 
      type="text" 
      :value="searchQuery" 
      @input="$emit('update:searchQuery', $event.target.value)" 
      :placeholder="t.searchTrans"
      class="search-input"
    />
    <select 
      :value="selectedCategory" 
      @change="$emit('update:selectedCategory', $event.target.value)"
      class="category-select"
    >
      <option value="">-- {{ t.allCategories }} --</option>
      <option v-for="(label, key) in t.catMap" :key="key" :value="key">
        {{ label }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { inject } from 'vue'
const t = inject('t')
defineProps(['searchQuery', 'selectedCategory'])
defineEmits(['update:searchQuery', 'update:selectedCategory'])
</script>

<style scoped>
.transaction-filters { display: flex; gap: 15px; margin-bottom: 20px; }
.search-input { flex: 2; padding: 12px 15px; border: 1px solid #dcdde1; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s; }
.category-select { flex: 1; padding: 12px 15px; border: 1px solid #dcdde1; border-radius: 8px; font-size: 14px; outline: none; cursor: pointer; }
.search-input:focus, .category-select:focus { border-color: #3498db; box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1); }
@media (max-width: 600px) { .transaction-filters { flex-direction: column; } }
</style>