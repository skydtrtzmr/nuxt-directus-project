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

const { settings } = useSettings();


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
                    <div class="topbar-actions">
                        <router-link to="/" class="home-link">
                            <i class="pi pi-home"></i>
                            <span>首页</span>
                        </router-link>
                        <router-link to="/dashboard" class="dashboard-link">
                            <i class="pi pi-desktop"></i>
                            <span>控制台</span>
                        </router-link>
                        <Button 
                            :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'" 
                            @click="toggleDarkMode" 
                            class="p-button-rounded p-button-text" 
                            v-tooltip.bottom="isDarkMode ? '切换到亮色模式' : '切换到暗色模式'"
                        />
                    </div>
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
            <app-footer :companyName="settings.company_name"></app-footer>
        </div>
        <div class="layout-mask" @click="resetMenu"></div>
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

.topbar-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.home-link, .dashboard-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #ffffff;
    text-decoration: none;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    transition: background-color 0.2s, color 0.2s;
}

.home-link:hover, .dashboard-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.home-link i, .dashboard-link i {
    font-size: 1rem;
}

.layout-main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 2rem;
    margin-top: 0; /* 移除顶部偏移 */
}

.layout-main {
    flex: 1;
    padding: 0 1.5rem 1.5rem 1.5rem;
}

.content-wrapper {
    max-width: 1440px;
    margin: 0 auto;
    width: 100%;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    padding: 1.5rem;
    border: 1px solid #d1d5db;
}

/* 遮罩层 */
.layout-mask {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 998;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
}

/* 暗色模式样式覆盖 */
.dark-mode .layout-main {
    background-color: #111827;
    color: #ffffff;
}

.dark-mode .content-wrapper {
    background-color: #1f2937;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid #4b5563;
}

.dark-mode .home-link, .dark-mode .dashboard-link {
    color: #ffffff;
}

/* 响应式设计 */
@media screen and (max-width: 1024px) {
    .layout-main {
        padding: 0 1rem 1rem 1rem;
    }
    
    .content-wrapper {
        padding: 1.25rem;
    }
}

@media screen and (max-width: 768px) {
    .layout-main {
        padding: 0 0.75rem 0.75rem 0.75rem;
    }
    
    .content-wrapper {
        padding: 1rem;
        border-radius: 6px;
    }
    
    .home-link span, .dashboard-link span {
        display: none;
    }
}

@media screen and (max-width: 576px) {
    .layout-main {
        padding: 0 0.5rem 0.5rem 0.5rem;
    }
    
    .content-wrapper {
        padding: 0.75rem;
        border-radius: 4px;
    }
}

/* 移动端布局 */
@media (max-width: 991px) {
    .layout-wrapper.layout-mobile-active .layout-mask {
        display: block;
    }
}

@media (min-width: 992px) {
    .layout-wrapper .layout-mask {
        display: none;
    }
}
</style>
