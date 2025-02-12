<template>
  <div>
    <div>Test Page</div>
    <ClientOnly>
      <AnythingLLMChat />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { ClientOnly } from '#components'

// 异步加载组件
const AnythingLLMChat = defineAsyncComponent(() =>
  import('../components/AnythingLLMChat.vue')
)
</script>

<style scoped>

</style>
