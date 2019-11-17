<template>
  <v-app>
    <v-app-bar app absolute>
      <v-container fluid>
        <v-row>
          <v-col md="2" />
          <v-col md="8">
            <v-toolbar-title>Yaizuuuu Tech Blog</v-toolbar-title>
          </v-col>
          <v-col md="2" />
        </v-row>
      </v-container>
    </v-app-bar>

    <v-content>
      <v-container fluid>
        <v-row>
          <v-col md="2" offset-md="1" />
          <v-col md="6">
            <v-card class="mx-auto pa-10 l-blog">
              <nuxt />
            </v-card>
          </v-col>
          <v-col md="2" />
        </v-row>
      </v-container>
    </v-content>

    <v-footer color="grey darken-1" app absolute>
      <span class="white--text">&copy; 2019</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class Blog extends Vue {}
</script>

<style scoped lang="scss">
  .l-blog {
    min-height: 80vh;
  }
</style>
