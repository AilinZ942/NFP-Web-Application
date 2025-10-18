import { createRouter, createWebHistory } from 'vue-router'

import HealthResourceView from '../components/views/HealthResourceView.vue'
import CommunityView from '../components/views/CommunityView.vue'
import LoginView from '../components/views/AccountView/LoginView.vue'
import RegisterView from '../components/views/AccountView/RegisterView.vue'
import ProfileView from '../components/views/AccountView/ProfileView.vue'
import SendEmailView from '@/components/views/SendEmailView.vue'
import SupportView from '@/components/views/SupportView.vue'
import DonorView from '@/components/views/DonorView.vue'
import ActivityView from '@/components/views/ActivityView.vue'
import MapView from '@/components/views/MapView.vue'
import EditProfileView from '@/components/views/AccountView/EditProfileView.vue'
import BulkEmailAllView  from'@/components/views/BulkEmailAllView.vue'
import { auth } from '../firebase/init.js'


const routes = [
  { path: '/', redirect: '/healthResource' },
  { path: '/healthResource', name: 'healthResource', component: HealthResourceView },
  { path: '/community', name: 'community', component: CommunityView, meta: { requiresAuth: true } },
  { path: '/map', name: 'map', component: MapView },
  {
    path: '/account',
    redirect: () => (auth.currentUser ? { name: 'account.profile' } : { name: 'account.login' }),
  },
  { path: '/support', name: 'support', component: SupportView },
  {
    path: '/account/login',
    name: 'account.login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/account/register',
    name: 'account.register',
    component: RegisterView,
    meta: { guestOnly: true },
  },
  {
    path: '/account/profile',
    name: 'account.profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: '/account/EditProfile',
    name: 'account.editProfile',
    component: EditProfileView,
  },
  {
    path: '/send-email',
    name: 'sendEmail',
    component: SendEmailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/bulk-email-all',
    name: 'bulkEmailAll',
    component: BulkEmailAllView,
    meta: { requiresAuth: true },
  },
  { path: '/support/activities', name: 'support.activities', component: ActivityView },
  { path: '/support/donor', name: 'support.donor', component: DonorView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const isAuthed = !!auth.currentUser
  if (to.meta?.guestOnly && isAuthed) return { name: 'account.profile' }
  if (to.meta?.requiresAuth && !isAuthed) {
    return { name: 'account.login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
