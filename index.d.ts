type VueRouterError = {
  statusCode?: string
  message?: string
}

declare module 'vue/types/vue' {
  interface Vue {
    error: VueRouterError
  }
}
