import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import CV from '../views/CV.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/cv',
      name: 'cv',
      component: CV
    }
  ]
})

export default router