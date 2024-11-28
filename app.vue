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

// onMounted(() => {
//     const authStore = useAuth();
//     authStore.validateSession(); // 检查会话状态
// });
// 当应用首次加载时：authStore.validateSession() 会检查登录状态（通过刷新 token 或验证认证状态）。
// 如果用户的 session 已过期：validateSession 会调用 this.$reset() 重置 Pinia 状态。

// 暂时不写在这里了，写在middleware里更合适。
</script>