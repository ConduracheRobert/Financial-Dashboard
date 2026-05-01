<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast-message', toast.type]"
      >
        <span class="toast-text">{{ toast.message }}</span>
        <button
          v-if="toast.action"
          class="toast-action-btn"
          @click="toast.action.handler()"
        >
          {{ toast.action.label }}
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
// Îmi preiau lista de notificări active direct din starea globală a aplicației
defineProps({
  toasts: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
}

.toast-message {
  min-width: 250px;
  max-width: 380px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-text { flex: 1; }

.toast-action-btn {
  background: rgba(255,255,255,0.25);
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.2s;
}
.toast-action-btn:hover { background: rgba(255,255,255,0.45); }

.toast-message.success { background-color: #2ecc71; }
.toast-message.error { background-color: #e74c3c; }
.toast-message.info { background-color: #3498db; }

/* Definesc animațiile mele de intrare și ieșire pentru notificări */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>