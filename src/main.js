import { createApp } from 'vue'
import App from './App.vue'

// Creez instanța principală a aplicației mele
const app = createApp(App)

// Montez aplicația direct în HTML (în div-ul cu id="app")
app.mount('#app')