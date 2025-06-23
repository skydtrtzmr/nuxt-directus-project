<script setup lang="ts">
import { useLayout } from "@/composables/layout";
import PracticeAgain from '~/assets/icons/practice-again.svg'
// import AppConfigurator from './AppConfigurator.vue';

// 声明组件的插槽
defineSlots();

const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();

const { $directus, $readSingleton } = useNuxtApp();

const { data: settings } = await useAsyncData("settings", () => {
    return $directus.request($readSingleton("settings"));
});
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button
                class="layout-menu-button layout-topbar-action"
                @click="onMenuToggle"
            >
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <PracticeAgain />
                <span>{{ settings!.student_portal_name }}</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <!-- 自定义内容将被插入到这里 -->
            <slot name="end"></slot>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{
                    selector: '@next',
                    enterFromClass: 'hidden',
                    enterActiveClass: 'animate-scalein',
                    leaveToClass: 'hidden',
                    leaveActiveClass: 'animate-fadeout',
                    hideOnOutsideClick: true,
                }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:flex lg:items-center">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>消息</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-user"></i>
                        <span>个人</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.layout-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    height: 4rem;
    background-color: var(--surface-card);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
    z-index: 100;
}

.layout-topbar-logo-container {
    display: flex;
    align-items: center;
}

.layout-topbar-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--text-color);
    text-decoration: none;
}

.layout-topbar-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.layout-topbar-action {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    color: var(--text-color);
    background-color: transparent;
    border: none;
}

.layout-topbar-action:hover {
    background-color: var(--surface-hover);
}

.layout-topbar-menu-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

@media screen and (max-width: 991px) {
    .layout-topbar {
        padding: 0 1rem;
    }
    
    .layout-topbar-logo span {
        display: none;
    }
}
</style>
