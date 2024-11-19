// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },

    modules: [
        "nuxt-directus",
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
        'pinia-plugin-persistedstate/nuxt',
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

    srcDir: "src/",
    compatibilityDate: "2024-11-17",
});
