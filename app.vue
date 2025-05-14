<template>
    <NuxtLayout>
        <!-- <NuxtRouteAnnouncer /> -->
        <NuxtLoadingIndicator />
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
// import { onMounted } from "vue";
// import { useAuth } from "~/stores/auth";
import { onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useRuntimeConfig } from '#app';
import { runFullAutomationSequence } from '~/automation/main'; // 确保路径正确

const config = useRuntimeConfig();
const router = useRouter();

onMounted(async () => {
    if (config.public.isTest) {
        // console.log("Automation: Test environment detected. Initializing automation sequence...");
        // 等待Vue Router完全准备好并且初始导航完成
        await router.isReady();
        await nextTick(); // 确保初始DOM渲染
        await runFullAutomationSequence(router);
    } else {
        console.log("Automation: Not in test environment.");
    }
});

</script>

<style>
/* 加载必要样式 */
@import "@univerjs/design/lib/index.css";
@import "@univerjs/presets/lib/styles/preset-sheets-core.css";

/* 修复Univer的布局问题 */
.univer-cell-editor {
    z-index: 9999 !important;
}
</style>
