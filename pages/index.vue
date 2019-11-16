<template>
  <v-layout>
    <v-flex class="text-center">
      <div>
        <ul>
          <li v-for="(ip_prefix, key) in prefixes" :key="key">
            {{ ip_prefix.ip_prefix }}
          </li>
        </ul>
      </div>
      <blockquote class="blockquote">
        &#8220;First, solve the problem. Then, write the code.&#8221;
        <footer>
          <small>
            <em>&mdash;John Johnson</em>
          </small>
        </footer>
      </blockquote>
    </v-flex>
  </v-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { Context } from '@nuxt/types'
import Logo from '~/components/Logo.vue'
import VuetifyLogo from '~/components/VuetifyLogo.vue'

interface IpV6Prefix {
  /* eslint camelcase: 'off' */
  ipv6_prefix: string
  region: string
  service: string
}

interface Prefix {
  /* eslint camelcase: 'off' */
  ip_prefix: string
  region: string
  service: string
}

interface CloudFrontIpRange {
  createDate: string
  /* eslint camelcase: 'off' */
  ipv6_prefixes: IpV6Prefix[]
  prefixes: Prefix[]
  syncToken: string
}

@Component({ components: { Logo, VuetifyLogo } })
export default class Index extends Vue {
  async asyncData(context: Context): Promise<CloudFrontIpRange> {
    const { data } = await context.$axios.get<CloudFrontIpRange>('https://ip-ranges.amazonaws.com/ip-ranges.json')

    return data
  }
}
</script>
