<template>
    <NuxtLayout>
        <NuxtRouteAnnouncer />
        <NuxtLoadingIndicator />
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
// import { useRuntimeConfig } from '#app'; // No longer directly used here for isTest
import { runFullAutomationSequence } from '~/automation/main'; // 确保路径正确
import { checkDirectusTestMode } from '~/composables/useTestTrigger'; // 新增导入
import { useAsyncData } from '#app'; // 导入 useAsyncData

// const config = useRuntimeConfig(); // No longer directly used here for isTest
const router = useRouter();

// 在服务端或客户端（首次加载时）获取Directus的测试模式状态
const { data: shouldRunAutomationBasedOnDirectus, error: directusError } = await useAsyncData(
  'directusTestModeSetting', // 唯一的键，用于缓存和去重
  () => checkDirectusTestMode(),
  {
    default: () => false, // 如果获取失败或在加载完成前，默认为false
    // server: true, // 默认即为true，会在服务端执行
    // lazy: false, // 默认为false，会阻塞导航直到数据获取完毕。对我们这个场景是合适的。
  }
);

onMounted(async () => {
    // 使用从 useAsyncData 获取的值  
    if (shouldRunAutomationBasedOnDirectus.value) {
        console.log("Automation: Test environment (Directus, server-fetched) detected. Initializing automation sequence...");
        // 等待Vue Router完全准备好并且初始导航完成
        await router.isReady();
        await nextTick(); // 确保初始DOM渲染
        await runFullAutomationSequence(router);
    } else {
        console.log("Automation: Not in test environment (Directus check, server-fetched).");
        if (directusError.value) {
            console.error("Automation: Error fetching Directus test mode on server/client:", directusError.value);
        }
    }
});

</script>

<style>

</style>
