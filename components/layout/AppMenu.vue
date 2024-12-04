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
        label: "首页",
        items: [{ label: "首页", icon: "pi pi-fw pi-home", to: "/" }],
    },
    {
        label: "功能组件",
        items: [
            // { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', to: '/uikit/formlayout' },
            { label: "考试", icon: "pi pi-fw pi-id-card", to: "/exams" },
            {
                label: "考试列表dataview",
                icon: "pi pi-fw pi-check-square",
                to: "/examdataview",
            },
            { label: "登录", icon: "pi pi-fw pi-id-card", to: "/login" },
            { label: "test", icon: "pi pi-fw pi-id-card", to: "/test" },
            // { label: 'Input', icon: 'pi pi-fw pi-check-square', to: '/uikit/input' },
            // { label: 'Button', icon: 'pi pi-fw pi-mobile', to: '/uikit/button', class: 'rotated-icon' },
            // { label: 'Table', icon: 'pi pi-fw pi-table', to: '/uikit/table' },
            // { label: 'List', icon: 'pi pi-fw pi-list', to: '/uikit/list' },
            // { label: 'Tree', icon: 'pi pi-fw pi-share-alt', to: '/uikit/tree' },
            // { label: 'Panel', icon: 'pi pi-fw pi-tablet', to: '/uikit/panel' },
            // { label: 'Overlay', icon: 'pi pi-fw pi-clone', to: '/uikit/overlay' },
            // { label: 'Media', icon: 'pi pi-fw pi-image', to: '/uikit/media' },
            // { label: 'Menu', icon: 'pi pi-fw pi-bars', to: '/uikit/menu' },
            // { label: 'Message', icon: 'pi pi-fw pi-comment', to: '/uikit/message' },
            // { label: 'File', icon: 'pi pi-fw pi-file', to: '/uikit/file' },
            // { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts' },
            // { label: 'Timeline', icon: 'pi pi-fw pi-calendar', to: '/uikit/timeline' },
            // { label: 'Misc', icon: 'pi pi-fw pi-circle', to: '/uikit/misc' }
        ],
    },
    // {
    //     label: 'Pages',
    //     icon: 'pi pi-fw pi-briefcase',
    //     to: '/pages',
    //     items: [
    //         {
    //             label: 'Landing',
    //             icon: 'pi pi-fw pi-globe',
    //             to: '/landing'
    //         },
    //         {
    //             label: 'Auth',
    //             icon: 'pi pi-fw pi-user',
    //             items: [
    //                 {
    //                     label: 'Login',
    //                     icon: 'pi pi-fw pi-sign-in',
    //                     to: '/auth/login'
    //                 },
    //                 {
    //                     label: 'Error',
    //                     icon: 'pi pi-fw pi-times-circle',
    //                     to: '/auth/error'
    //                 },
    //                 {
    //                     label: 'Access Denied',
    //                     icon: 'pi pi-fw pi-lock',
    //                     to: '/auth/access'
    //                 }
    //             ]
    //         },
    //         {
    //             label: 'Crud',
    //             icon: 'pi pi-fw pi-pencil',
    //             to: '/pages/crud'
    //         },
    //         {
    //             label: 'Not Found',
    //             icon: 'pi pi-fw pi-exclamation-circle',
    //             to: '/pages/notfound'
    //         },
    //         {
    //             label: 'Empty',
    //             icon: 'pi pi-fw pi-circle-off',
    //             to: '/pages/empty'
    //         }
    //     ]
    // },
    // {
    //     label: 'Hierarchy',
    //     items: [
    //         {
    //             label: 'Submenu 1',
    //             icon: 'pi pi-fw pi-bookmark',
    //             items: [
    //                 {
    //                     label: 'Submenu 1.1',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [
    //                         { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
    //                         { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
    //                         { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
    //                     ]
    //                 },
    //                 {
    //                     label: 'Submenu 1.2',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
    //                 }
    //             ]
    //         },
    //         {
    //             label: 'Submenu 2',
    //             icon: 'pi pi-fw pi-bookmark',
    //             items: [
    //                 {
    //                     label: 'Submenu 2.1',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [
    //                         { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
    //                         { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
    //                     ]
    //                 },
    //                 {
    //                     label: 'Submenu 2.2',
    //                     icon: 'pi pi-fw pi-bookmark',
    //                     items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
    //                 }
    //             ]
    //         }
    //     ]
    // },
    // {
    //     label: 'Get Started',
    //     items: [
    //         {
    //             label: 'Documentation',
    //             icon: 'pi pi-fw pi-book',
    //             to: '/documentation'
    //         },
    //         {
    //             label: 'View Source',
    //             icon: 'pi pi-fw pi-github',
    //             url: 'https://github.com/primefaces/sakai-vue',
    //             target: '_blank'
    //         }
    //     ]
    // }
]);
</script>

<template>
    <ul class="layout-menu">
        <!-- 当前用户信息区域 -->
        <li class="user-info m-4">
            <template v-if="user">
                <!-- <div class="user-avatar">
                <img :src="user.avatar" alt="User Avatar" />
            </div> -->
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
    </ul>
</template>

<style lang="scss" scoped></style>
