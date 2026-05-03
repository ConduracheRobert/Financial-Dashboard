import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView  from '../views/DashboardView.vue'
import InsightsView   from '../views/InsightsView.vue'
import HistoryView    from '../views/HistoryView.vue'
import SettingsView   from '../views/SettingsView.vue'
import SimulatorView  from '../views/SimulatorView.vue'

const routes = [
  { path: '/',          component: DashboardView  },
  { path: '/insights',  component: InsightsView   },
  { path: '/history',   component: HistoryView    },
  { path: '/settings',  component: SettingsView   },
  { path: '/simulator', component: SimulatorView  }
]

export default createRouter({ history: createWebHashHistory(), routes })
