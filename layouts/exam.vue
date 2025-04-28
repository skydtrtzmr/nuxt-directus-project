<!-- layout/exam.vue -->
<!-- 考试界面下的布局。 -->
<script setup>
import { useLayout } from "../composables/layout.js";
import { computed, ref, watch, onMounted } from "vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import AppSidebar from "@/components/layout/AppSidebar.vue";
import AppTopbar from "@/components/layout/AppTopbar.vue";

const { layoutConfig, layoutState, isSidebarActive, resetMenu } = useLayout();

const outsideClickListener = ref(null);
const isDarkMode = ref(false);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        "layout-overlay": layoutConfig.menuMode === "overlay",
        "layout-static": layoutConfig.menuMode === "static",
        "layout-static-inactive":
            layoutState.staticMenuDesktopInactive &&
            layoutConfig.menuMode === "static",
        "layout-overlay-active": layoutState.overlayMenuActive,
        "layout-mobile-active": layoutState.staticMenuMobileActive,
        "dark-mode": isDarkMode.value,
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                resetMenu();
            }
        };
        document.addEventListener("click", outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener("click", outsideClickListener);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector(".layout-sidebar");
    const topbarEl = document.querySelector(".layout-menu-button");

    if (!sidebarEl || !topbarEl) return false;

    return !(
        sidebarEl.isSameNode(event.target) ||
        sidebarEl.contains(event.target) ||
        topbarEl.isSameNode(event.target) ||
        topbarEl.contains(event.target)
    );
}

function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
    if (isDarkMode.value) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    // 保存到本地存储，以便页面刷新后保持设置
    localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false');
}

onMounted(() => {
    // 从本地存储中读取暗色模式设置
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        isDarkMode.value = true;
        document.documentElement.classList.add('dark');
    }
    
    // 检测系统颜色模式
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark && savedDarkMode === null) {
        isDarkMode.value = true;
        document.documentElement.classList.add('dark');
    }
});
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <div class="topbar-container">
            <app-topbar>
                <template #end>
                    <Button 
                        :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'" 
                        @click="toggleDarkMode" 
                        class="p-button-rounded p-button-text ml-2" 
                        v-tooltip.bottom="isDarkMode ? '切换到亮色模式' : '切换到暗色模式'"
                    />
                </template>
            </app-topbar>
        </div>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <div class="content-wrapper">
                    <slot />
                </div>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
    <Toast />
</template>

<style>
.layout-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.topbar-container {
    position: sticky;
    top: 0;
    z-index: 999;
}

.layout-main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.layout-main {
    flex: 1;
    padding: 1.5rem;
}

.content-wrapper {
    max-width: 1440px;
    margin: 0 auto;
    width: 100%;
}

/* 暗色模式样式覆盖 */
.dark-mode .layout-main {
    background-color: var(--surface-900);
    color: var(--surface-0);
}

/* 响应式设计 */
@media screen and (max-width: 1024px) {
    .layout-main {
        padding: 1rem;
    }
}

@media screen and (max-width: 768px) {
    .layout-main {
        padding: 0.75rem;
    }
}

@media screen and (max-width: 576px) {
    .layout-main {
        padding: 0.5rem;
    }
}
</style>
