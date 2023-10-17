
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('src/pages/IndexPage.vue') },
      { path: 'webrtc1', name: 'webrtc1', component: () => import('src/pages/WebRTC1.vue') },
      { path: 'webrtc2', name: 'webrtc2', component: () => import('src/pages/WebRTC2.vue') },
      { path: 'local-stream-test', name: 'local-stream-test', component: () => import('src/pages/LocalStreamTest.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
