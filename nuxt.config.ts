// https://nuxt.com/docs/api/configuration/nuxt-config

import Aura from "@primevue/themes/aura";
import Material from "@primevue/themes/material";
import Lara from "@primevue/themes/lara";
import Nora from "@primevue/themes/Nora";

export default defineNuxtConfig({
    devtools: { enabled: true },

    modules: [
        "nuxt-directus",
        "@nuxtjs/tailwindcss",
        "@primevue/nuxt-module",
        "nuxt-svgo", // 加载svg图片为vue组件
        "@pinia/nuxt",
        [
            "@pinia/nuxt",
            {
                autoImports: [
                    // 自动引入 `defineStore()`
                    "defineStore",
                    // 自动引入 `defineStore()` 并重命名为 `definePiniaStore()`
                    ["defineStore", "definePiniaStore"],
                ],
            },
        ],
        "pinia-plugin-persistedstate/nuxt",
    ],

    runtimeConfig: {
        public: {
            directus: {
                url: "http://127.0.0.1:8055",
            },
        },
    },

    directus: {
        devtools: true,
    },

    // srcDir: "src/",
    compatibilityDate: "2024-11-17",
    primevue: {
        options: {
            // theme: "none",
            // 如果你没有配置theme switcher，就必须设置theme，否则会导致没有样式以至于显示不出来
            // 注意，主题和颜色没有关系
            theme: {
                preset: Aura, // 记得要先在文件开头import
            },
        },
    },
    // 这里css有以下几个文件是必须引用的：
    // - tailwind.css，这个文件是tailwindcss的样式文件
    // - base.css或者app.css，也就是 https://tailwind.primevue.org/nuxt/#css-variables 里的
    css: [
        "@/assets/styles/tailwind.css",
        "@/assets/styles/layout/layout.scss",
        "primeicons/primeicons.css",
        // 可用的icon参见：https://primevue.org/icons/#list
        "@/assets/styles/demo/demo.scss",
    ],
    postcss: {
        plugins: {
            "postcss-import": {},
            tailwindcss: {},
            autoprefixer: {},
        },
    },
});
