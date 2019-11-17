<template>
  <v-app>
    <v-app-bar app color="white">
      <v-toolbar-title>Yaizuuuu Tech Blog 3</v-toolbar-title>
    </v-app-bar>

    <v-content>
      <v-container fluid>
        <v-row align="center" justify="center">
          <v-col md="1" offset-md="1" />
          <v-col md="8">
            <v-card class="mx-auto">
              <nuxt />
            </v-card>
          </v-col>
          <v-col md="1" />
        </v-row>
      </v-container>
    </v-content>
    <v-footer color="grey darken-3" app>
      <span class="white--text">&copy; 2019</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class Default extends Vue {
  clipped = false
  drawer = false
  fixed = false
  items = [
    {
      icon: 'mdi-apps',
      title: 'Welcome',
      to: '/'
    },
    {
      icon: 'mdi-chart-bubble',
      title: 'Inspire',
      to: '/inspire'
    }
  ]
  miniVariant = false
  right = true
  rightDrawer = false
  title = 'Vuetify.js'
}
</script>
