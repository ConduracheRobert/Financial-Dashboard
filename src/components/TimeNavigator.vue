<template>
  <div class="time-navigator-container">
    
    <div class="nav-group">
      <button @click="shiftTime(-1)" class="icon-btn">◀</button>
      <span class="date-display">{{ displayDate }}</span>
      <button @click="shiftTime(1)" class="icon-btn">▶</button>
    </div>

    <div class="time-filters">
      <button :class="{ active: viewUnit === 'day' }" @click="setUnit('day')">{{ t.day }}</button>
      <button :class="{ active: viewUnit === 'week' }" @click="setUnit('week')">{{ t.week }}</button>
      <button :class="{ active: viewUnit === 'month' }" @click="setUnit('month')">{{ t.month }}</button>
      <button :class="{ active: viewUnit === 'year' }" @click="setUnit('year')">{{ t.year }}</button>
    </div>

  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

// Aducem dicționarul!
const t = inject('t')

const props = defineProps({
  viewUnit: { type: String, default: 'month' },
  referenceDate: { type: String, required: true }
})

const emit = defineEmits(['update:viewUnit', 'update:referenceDate'])

const setUnit = (unit) => {
  emit('update:viewUnit', unit)
}

const shiftTime = (direction) => {
  const d = new Date(props.referenceDate)
  if (props.viewUnit === 'day') d.setDate(d.getDate() + direction)
  else if (props.viewUnit === 'week') d.setDate(d.getDate() + direction * 7)
  else if (props.viewUnit === 'month') d.setMonth(d.getMonth() + direction)
  else if (props.viewUnit === 'year') d.setFullYear(d.getFullYear() + direction)
  
  emit('update:referenceDate', d.toISOString().split('T')[0])
}

const displayDate = computed(() => {
  const d = new Date(props.referenceDate)
  const loc = t.value.locale // Tragem limba exactă din dicționar

  if (props.viewUnit === 'year') return d.getFullYear().toString()
  if (props.viewUnit === 'month') return d.toLocaleDateString(loc, { month: 'long', year: 'numeric' })
  if (props.viewUnit === 'day') return d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })
  if (props.viewUnit === 'week') {
    const start = new Date(d)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.toLocaleDateString(loc, { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString(loc, { day: 'numeric', month: 'short' })}`
  }
  return props.referenceDate
})
</script>

<style scoped>
.time-navigator-container { display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
.nav-group { display: flex; align-items: center; gap: 15px; }
.icon-btn { background: #f1f3f5; border: none; width: 35px; height: 35px; border-radius: 8px; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.2s; color: #34495e; }
.icon-btn:hover { background: #e2e6ea; transform: scale(1.05); }
.date-display { font-size: 16px; font-weight: bold; color: #2c3e50; min-width: 140px; text-align: center; text-transform: capitalize; }
.time-filters { display: flex; background: #f1f3f5; border-radius: 8px; padding: 4px; }
.time-filters button { border: none; background: transparent; padding: 8px 15px; border-radius: 6px; font-size: 13px; font-weight: bold; color: #7f8c8d; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
.time-filters button:hover { color: #2c3e50; }
.time-filters button.active { background: #3498db; color: white; box-shadow: 0 2px 5px rgba(52, 152, 219, 0.3); }
@media (max-width: 600px) { .time-navigator-container { flex-direction: column; justify-content: center; } .time-filters { width: 100%; display: grid; grid-template-columns: repeat(4, 1fr); } }
</style>