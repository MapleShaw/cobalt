import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import i18n from '../i18n'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:locale',
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'about',
          name: 'about',
          // route level code-splitting
          // this generates a separate chunk (About.[hash].js) for this route
          // which is lazy-loaded when the route is visited.
          component: () => import('../views/AboutView.vue'),
        },
      ],
    },
    {
      path: '/',
      redirect: '/en',
    },
  ],
})

router.beforeEach((to, from, next) => {
  const locale = to.params.locale as string
  if (i18n.global.availableLocales.includes(locale as any)) {
    i18n.global.locale.value = locale as any
  }
  next()
})

export default router
