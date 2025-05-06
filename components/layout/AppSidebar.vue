<script setup>
import AppMenu from './AppMenu.vue';
</script>

<template>
    <div class="layout-sidebar">
        <app-menu></app-menu>
    </div>
</template>

<style lang="scss" scoped>
.layout-sidebar {
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    border-right: 1px solid #e5e7eb;
    z-index: 999;
}

:deep(.dark-mode) .layout-sidebar {
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.25);
    border-right: 1px solid #374151;
}
</style>
