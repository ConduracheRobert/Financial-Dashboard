<template>
  <div class="filters-container">
    <div class="filter-group search">
      <input 
        type="text" 
        :value="searchQuery" 
        @input="$emit('update:searchQuery', $event.target.value)"
        placeholder="Caută o tranzacție..."
      />
    </div>
    
    <div class="filter-group select">
      <select 
        :value="selectedCategory" 
        @change="$emit('update:selectedCategory', $event.target.value)"
      >
        <option value="">Toate categoriile</option>
        <option value="Salariu">Salariu / Venit</option>
        <option value="Mâncare">Mâncare & Cumpărături</option>
        <option value="Facturi">Facturi & Utilități</option>
        <option value="Transport">Transport</option>
        <option value="Divertisment">Divertisment</option>
        <option value="Altele">Altele</option>
      </select>
    </div>
  </div>
</template>

<script setup>
// Definim proprietățile primite și evenimentele emise pentru a permite v-model bidirecțional din App.vue
defineProps(['searchQuery', 'selectedCategory'])
defineEmits(['update:searchQuery', 'update:selectedCategory'])
</script>

<style scoped>
.filters-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}
.filter-group { flex: 1; }
input, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  box-sizing: border-box;
}
input:focus, select:focus {
  outline: none;
  border-color: #3498db;
}
@media (max-width: 400px) {
  .filters-container { flex-direction: column; }
}
/* --- ADAPTARE DARK MODE --- */
:global(body.dark-mode) input,
:global(body.dark-mode) select {
  background-color: #1a1a2e;
  color: #f1f1f1;
  border: 1px solid #0f3460;
}
:global(body.dark-mode) input::placeholder { 
  color: #7f8c8d; 
}
</style>