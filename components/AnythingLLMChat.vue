<template>
  <div ref="chatContainer"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

const {
    public: { anythingllm },
} = useRuntimeConfig();

const chatContainer = ref(null)
let scriptElement = null

const initChat = () => {
  // 确保在客户端环境
  if (typeof window !== 'undefined') {
    scriptElement = document.createElement('script')
    scriptElement.setAttribute('data-embed-id', anythingllm.embedId)
    scriptElement.setAttribute('data-base-api-url', anythingllm.baseApiUrl)
    scriptElement.src = anythingllm.scriptUrl
    document.body.appendChild(scriptElement)
  }
}

const cleanupChat = () => {
  // 确保在客户端环境
  if (typeof window !== 'undefined') {
    // 移除聊天窗口
    const widgetContainer = document.querySelector('#anythingllm-chat-widget')
    if (widgetContainer) {
      widgetContainer.remove()
    }
    
    // 移除脚本
    if (scriptElement) {
      scriptElement.remove()
    }
    
    // 清理全局变量
    if (window?.AnythingLLM) {
      delete window.AnythingLLM
    }
    if (window?.anythingllm) {
      delete window.anythingllm
    }
  }
}

onMounted(() => {
  initChat()
})

onBeforeUnmount(() => {
  cleanupChat()
})
</script>

<style scoped>
.chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
</style> 