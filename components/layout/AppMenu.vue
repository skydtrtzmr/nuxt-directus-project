<script setup>
import { ref } from "vue";

import AppMenuItem from "./AppMenuItem.vue";

import { storeToRefs } from "pinia";
import { useAuth } from "~~/stores/auth";
import { Divider } from "primevue";

const auth = useAuth();
const { user } = storeToRefs(auth);

const model = ref([
    {
        label: "主页",
        items: [
            { label: "控制台", icon: "pi pi-fw pi-desktop", to: "/dashboard" },
        ],
    },
    {
        label: "功能组件",
        items: [
            { label: "考试", icon: "pi pi-fw pi-file", to: "/exams" },
            { label: "练习", icon: "pi pi-fw pi-file", to: "/practices" },
            // { label: "在线表格", icon: "pi pi-fw pi-table", to: "/sheet" },
            // { label: "test", icon: "pi pi-fw pi-id-card", to: "/test" },
            { label: "知识库聊天", icon: "pi pi-fw pi-id-card", to: "/chat" },
            { label: "MCP", icon: "pi pi-fw pi-id-card", to: "/mcp" },
            { label: "MCP2", icon: "pi pi-fw pi-id-card", to: "/mcp2" },
            {
                label: "情景问答",
                icon: "pi pi-fw pi-id-card",
                to: "/Scenario-based",
            },
        ],
    },
]);

const logout = () => {
    auth.logout();
    navigateTo("/auth/login");
};
</script>

<template>
    <ul class="layout-menu">
        <!-- 当前用户信息区域 -->
        <li class="user-info m-4">
            <template v-if="user">
                <div class="user-details w-full">
                    <p class="user-name">欢迎回来，</p>
                    <p class="user-role text-xl">
                        {{ user.last_name }}{{ user.first_name }}
                    </p>
                    <div class="items-center">
                        <i class="pi pi-envelope mr-2 pt-1 text-sm"></i
                        ><span class="text-sm">{{ user.email }}</span>
                    </div>
                </div>
            </template>
        </li>
        <Divider />
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item
                v-if="!item.separator"
                :item="item"
                :index="i"
            ></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>

        <li class="logout-button-container">
            <Button
                @click="logout"
                class="p-button-outlined p-button-danger logout-button"
            >
                <i class="pi pi-sign-out mr-2"></i>
                退出登录
            </Button>
        </li>
    </ul>
</template>

<style lang="scss" scoped>
.user-info {
    padding: 1rem;
    margin-bottom: 0.5rem;
}

.user-name {
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
}

.user-role {
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.logout-button-container {
    padding: 1rem;
    margin-top: 2rem;
}

.logout-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
