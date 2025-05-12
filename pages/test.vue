<template>
  <div>
    <div>Test Page</div>
    <ClientOnly>
      <!-- <AnythingLLMChat /> -->
      <!-- <DifyChat /> -->
      <DifyIframe />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
// ClientOnly component might be auto-imported by Nuxt or needs to be explicitly imported if not global
// import { ClientOnly } from '#components' // Or the correct path if it's a local component

// 异步加载组件
const AnythingLLMChat = defineAsyncComponent(() =>
  import('../components/AnythingLLMChat.vue')
)

const DifyChat = defineAsyncComponent(() =>
  import('../components/DifyChat.vue')
)
</script>

<style scoped>

</style>
