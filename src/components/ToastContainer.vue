<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        :class="['toast-message', toast.type]"
      >
        {{ toast.message }}
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
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
}

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