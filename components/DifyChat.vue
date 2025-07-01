<template>
  <div>
    <!-- This component only injects the script, it doesn't render anything itself -->
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const {
    public: {
        dify: { baseApiUrl, chatbotRag },
    },
} = useRuntimeConfig();

// Dify Chatbot Configuration
const difyConfig = {
  token: chatbotRag,
  baseUrl: baseApiUrl, // 注意：生产环境可能需要修改此 URL
  systemVariables: {
    // user_id: '在这里定义用户 ID',
    // conversation_id: '在这里定义会话 ID (必须是有效的 UUID)',
  },
}

const configScriptId = `dify-config-${difyConfig.token}`
const styleElementId = `dify-style-${difyConfig.token}`

// Keep track of added elements
const scriptElements = ref<HTMLScriptElement[]>([])
const styleElement = ref<HTMLStyleElement | null>(null)

const addDifyChat = () => {
  // Ensure we are in the client-side environment
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    // 1. Add configuration script
    const configScript = document.createElement('script');
    configScript.id = configScriptId;
    configScript.type = 'text/javascript';
    configScript.innerHTML = `window.difyChatbotConfig = ${JSON.stringify(difyConfig)}`;
    document.body.appendChild(configScript);
    scriptElements.value.push(configScript); // Track the script

    // 2. Add Dify embed script
    const embedScript = document.createElement('script');
    embedScript.id = difyConfig.token; // Dify uses the token as the ID
    embedScript.src = `${difyConfig.baseUrl}/embed.min.js`;
    embedScript.defer = true;
    document.body.appendChild(embedScript);
    scriptElements.value.push(embedScript); // Track the script

    // 3. Add custom styles
    const customStyle = document.createElement('style');
    customStyle.id = styleElementId;
    customStyle.textContent = `
      #dify-chatbot-bubble-button {
        background-color: #1C64F2 !important;
      }
      #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 40rem !important;
      }
    `;
    document.head.appendChild(customStyle);
    styleElement.value = customStyle; // Track the style element

  } catch (error) {
    console.error("Failed to initialize Dify Chat:", error);
  }
}

const removeDifyChat = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Remove scripts
  scriptElements.value.forEach(script => {
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });
  scriptElements.value = []; // Clear the tracking array

  // Remove style
  if (styleElement.value && styleElement.value.parentNode) {
    styleElement.value.parentNode.removeChild(styleElement.value);
    styleElement.value = null; // Clear the tracking ref
  }

  // Clean up global config variable
  if ((window as any).difyChatbotConfig) {
    delete (window as any).difyChatbotConfig;
  }

  // Attempt to remove Dify UI elements (optional, depends on Dify's implementation)
  const bubbleButton = document.getElementById('dify-chatbot-bubble-button');
  if (bubbleButton) bubbleButton.remove();
  const bubbleWindow = document.getElementById('dify-chatbot-bubble-window');
  if (bubbleWindow) bubbleWindow.remove();
  // Add other Dify specific elements if necessary
}

onMounted(() => {
  addDifyChat();
})

onBeforeUnmount(() => {
  removeDifyChat();
})

</script>

<style>
/* Component-specific styles can go here if needed, but the main Dify styles are injected */
</style>