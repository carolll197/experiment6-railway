import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/Home.vue'),
  },
  {
    path: '/pre-subject',
    name: 'PreSubject',
    component: () => import('./views/PreSubject/Index.vue'),
  },
  {
    path: '/pre-expert',
    name: 'PreExpert',
    component: () => import('./views/PreExpert/Index.vue'),
  },
  {
    path: '/pre-admin',
    name: 'PreAdmin',
    component: () => import('./views/PreAdmin/Index.vue'),
  },
  {
    path: '/study1-subject',
    name: 'Study1Subject',
    component: () => import('./views/Study1Subject/Index.vue'),
  },
  {
    path: '/study1-expert',
    name: 'Study1Expert',
    component: () => import('./views/Study1Expert/Index.vue'),
  },
  {
    path: '/study1-admin',
    name: 'Study1Admin',
    component: () => import('./views/Study1Admin/Index.vue'),
  },
  {
    path: '/study2-process',
    name: 'Study2Process',
    component: () => import('./views/Study2Process/Index.vue'),
  },
  {
    path: '/study2-result',
    name: 'Study2Result',
    component: () => import('./views/Study2Result/Index.vue'),
  },
  {
    path: '/study2-admin',
    name: 'Study2Admin',
    component: () => import('./views/Study2Admin/Index.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
