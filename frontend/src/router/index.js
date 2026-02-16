import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/pre-subject',
    name: 'PreSubject',
    component: () => import('../views/PreSubject/Index.vue'),
    meta: { title: '预实验-被试版' },
  },
  {
    path: '/pre-expert',
    name: 'PreExpert',
    component: () => import('../views/PreExpert/Index.vue'),
    meta: { title: '预实验-专家版' },
  },
  {
    path: '/pre-admin',
    name: 'PreAdmin',
    component: () => import('../views/PreAdmin/Index.vue'),
    meta: { title: '预实验-主试版' },
  },
  {
    path: '/study1-subject',
    name: 'Study1Subject',
    component: () => import('../views/Study1Subject/Index.vue'),
    meta: { title: '研究一-被试版' },
  },
  {
    path: '/study1-admin',
    name: 'Study1Admin',
    component: () => import('../views/Study1Admin/Index.vue'),
    meta: { title: '研究一-主试版' },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 广告创意研究实验平台` : '广告创意研究实验平台';
});

export default router;
