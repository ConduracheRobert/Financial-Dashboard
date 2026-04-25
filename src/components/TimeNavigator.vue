<template>
  <div class="time-navigator">
    <div class="unit-selector">
      <button 
        v-for="unit in ['day', 'week', 'month', 'year']" 
        :key="unit"
        :class="{ active: viewUnit === unit }"
        @click="$emit('update:viewUnit', unit)"
      >
        {{ unitLabels[unit] }}
      </button>
    </div>

    <div class="period-controls">
      <button @click="$emit('navigate', -1)" class="nav-btn">◀</button>
      <span class="current-period">{{ formattedPeriod }}</span>
      <button @click="$emit('navigate', 1)" class="nav-btn">▶</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Definesc proprietățile pe care le primesc din App.vue pentru a ști unde mă aflu în timp
const props = defineProps(['viewUnit', 'referenceDate'])
const emit = defineEmits(['update:viewUnit', 'navigate'])

// Îmi creez un dicționar simplu pentru a traduce unitățile în limba română în interfață
const unitLabels = {
  day: 'Zi',
  week: 'Săpt',
  month: 'Lună',
  year: 'An'
}

// Calculez și formatez textul care îmi arată perioada selectată (ex: "Aprilie 2026")
const formattedPeriod = computed(() => {
  const d = new Date(props.referenceDate)
  
  if (props.viewUnit === 'day') {
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (props.viewUnit === 'month') {
    return d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
  }
  if (props.viewUnit === 'year') {
    return d.getFullYear().toString()
  }
  if (props.viewUnit === 'week') {
    // Pentru săptămână, îmi calculez matematic ziua de Luni și ziua de Duminică
    const first = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)
    const firstDay = new Date(d.setDate(first))
    const lastDay = new Date(d.setDate(first + 6))
    return `${firstDay.getDate()} - ${lastDay.getDate()} ${lastDay.toLocaleDateString('ro-RO', { month: 'short' })}`
  }
  return ''
})
</script>

<style scoped>
.time-navigator { background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center; }
.unit-selector { display: flex; gap: 5px; margin-bottom: 15px; background: #f1f3f5; padding: 4px; border-radius: 8px; }
.unit-selector button { flex: 1; border: none; background: none; padding: 6px; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer; color: #7f8c8d; }
.unit-selector button.active { background: white; color: #3498db; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.period-controls { display: flex; justify-content: space-between; align-items: center; }
.nav-btn { background: #3498db; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; }
.current-period { font-weight: bold; color: #2c3e50; text-transform: capitalize; }
/* --- ADAPTARE DARK MODE --- */
:global(body.dark-mode) .time-navigator,
:global(body.dark-mode) .nav-group { 
  background-color: #16213e; 
  border: 1px solid #0f3460; 
}
:global(body.dark-mode) .date-display, 
:global(body.dark-mode) .time-navigator button { 
  color: #f1f1f1; 
}
:global(body.dark-mode) .time-navigator button.active { 
  background-color: #3498db; 
  color: white; 
}
:global(body.dark-mode) .time-navigator button:hover:not(.active) { 
  background-color: #0f3460; 
}
</style>