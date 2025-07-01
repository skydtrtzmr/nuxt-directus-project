<template>
    <div>
        <!-- 添加复制按钮 -->
        <!-- <div class="mb-4"> -->
        <!-- <button 
                @click="copyTestText"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mr-2"
            >
                复制测试文本
            </button> -->

        <!-- 状态提示 -->
        <!-- <span v-if="copyStatus" class="text-sm" :class="copyStatusClass">
                {{ copyStatus }}
            </span> -->
        <!-- </div> -->

        <iframe
            ref="chatIframe"
            :src="`${baseApiUrl}/chatbot/${chatbotRag}`"
            style="width: 100%; height: 100%; min-height: 700px"
            frameborder="0"
            allow="microphone"
        >
        </iframe>
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const {
    public: {
        dify: { baseApiUrl, chatbotRag },
    },
} = useRuntimeConfig();

const copyStatus = ref("");
const copyStatusClass = ref("");

// 复制测试文本到剪贴板
const copyTestText = async () => {
    const testText = "这里是测试文本";

    try {
        // 现代浏览器使用navigator.clipboard
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(testText);
            showCopySuccess();
        } else {
            // 备用方案：使用document.execCommand (已废弃但兼容性好)
            fallbackCopyText(testText);
        }
    } catch (error) {
        console.error("复制失败:", error);
        showCopyError("复制失败，请手动复制文本");
    }
};

// 备用复制方案
const fallbackCopyText = (text: string) => {
    try {
        // 创建临时textarea
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);

        // 选中并复制
        textarea.select();
        textarea.setSelectionRange(0, 99999); // 移动端兼容

        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (successful) {
            showCopySuccess();
        } else {
            showCopyError("复制功能不支持，请手动复制：这里是测试文本");
        }
    } catch (error) {
        console.error("备用复制方案也失败:", error);
        showCopyError("复制功能不可用，请手动输入：这里是测试文本");
    }
};

// 显示复制成功状态
const showCopySuccess = () => {
    copyStatus.value = "✅ 已复制到剪贴板！请在聊天框中粘贴 (Ctrl+V)";
    copyStatusClass.value = "text-green-600";

    // 3秒后清除状态
    setTimeout(() => {
        copyStatus.value = "";
    }, 3000);
};

// 显示复制失败状态
const showCopyError = (message: string) => {
    copyStatus.value = "❌ " + message;
    copyStatusClass.value = "text-red-600";

    // 5秒后清除状态
    setTimeout(() => {
        copyStatus.value = "";
    }, 5000);
};
</script>

<style></style>
