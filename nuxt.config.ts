// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },

    modules: [
        "nuxt-directus",
        "@nuxtjs/tailwindcss",
        "@primevue/nuxt-module",
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
            theme: "none",
        },
    },
    // 这里css有以下几个文件是必须引用的：
    // - tailwind.css，这个文件是tailwindcss的样式文件
    // - base.css或者app.css，也就是https://tailwind.primevue.org/nuxt/#css-variables里的
    css: [
        "@/assets/styles/tailwind.css",
        "@/assets/styles/layout/layout.scss",
        "primeicons/primeicons.css",
        "@/assets/styles/demo/demo.scss",
    ],
    postcss: {
        plugins: {
            'postcss-import': {},
            tailwindcss: {},
            autoprefixer: {}
        }
    },
});
