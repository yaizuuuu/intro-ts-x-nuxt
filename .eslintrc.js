module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  extends: [
    'plugin:nuxt/recommended',
    '@nuxtjs/eslint-config-typescript'
  ],
  plugins: [
    'vue'
  ],
  // add your custom rules here
  rules: {
    'vue/html-closing-bracket-newline': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-alert': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'space-before-function-paren': 0
  }
}
