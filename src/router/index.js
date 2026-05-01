import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import InsightsView from '../views/InsightsView.vue'

const routes = [
  { path: '/', component: DashboardView },
  { path: '/insights', component: InsightsView }
]

export default createRouter({ history: createWebHashHistory(), routes })
