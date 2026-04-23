import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    // 无需认证，游客可访问首页
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('../views/ChangePasswordView.vue'),
    meta: { requiresAuth: true },
  },
  // 网盘资源路由
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/resources/ResourcesView.vue'),
  },
  {
    path: '/resources/:id',
    name: 'ResourceDetail',
    component: () => import('../views/resources/ResourceDetailView.vue'),
  },
  {
    path: '/resources/create',
    name: 'CreateResource',
    component: () => import('../views/resources/CreateResourceView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/resources/:id/edit',
    name: 'EditResource',
    component: () => import('../views/resources/EditResourceView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/my-resources',
    name: 'MyResources',
    component: () => import('../views/resources/MyResourcesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/orders/OrdersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('../views/orders/OrderDetailView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from) => {
  const authStore = useAuthStore()

  // 初始化认证状态
  if (authStore.loading) {
    await authStore.initAuth()
  }

  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  } else if (to.meta.guest && isAuthenticated) {
    return { name: 'Home' }
  }
})

export default router
