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

</script>

<style>
/* 修复Univer的布局问题 */
.univer-cell-editor {
  z-index: 9999 !important;
}

/* 加载必要样式 */
@import '@univerjs/design/lib/index.css'; 
@import '@univerjs/presets/lib/styles/preset-sheets-core.css';
</style>