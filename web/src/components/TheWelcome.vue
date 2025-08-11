<script setup lang="ts">
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import ToolingIcon from './icons/IconTooling.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import CommunityIcon from './icons/IconCommunity.vue'
import SupportIcon from './icons/IconSupport.vue'

const openReadmeInEditor = () => fetch('/__open-in-editor?file=README.md')
</script>

<template>
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>{{ $t('welcome.documentation.heading') }}</template>

    <span v-html="$t('welcome.documentation.body_html')"></span>
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <ToolingIcon />
    </template>
    <template #heading>{{ $t('welcome.tooling.heading') }}</template>

    <span v-html="$t('welcome.tooling.body_html_1')"></span>
    <br />
    <span v-html="$t('welcome.tooling.body_html_2')"></span>
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <EcosystemIcon />
    </template>
    <template #heading>{{ $t('welcome.ecosystem.heading') }}</template>

    <span v-html="$t('welcome.ecosystem.body_html')"></span>
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <CommunityIcon />
    </template>
    <template #heading>{{ $t('welcome.community.heading') }}</template>

    <span v-html="$t('welcome.community.body_html')"></span>
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <SupportIcon />
    </template>
    <template #heading>{{ $t('welcome.support.heading') }}</template>

    <span v-html="$t('welcome.support.body_html')"></span>
  </WelcomeItem>
</template>
