// https://nuxt.com/docs/api/configuration/nuxt-config
// NOTE: 修改此文件后，需要重新执行pnpm build命令才会生效。

import Aura from "@primevue/themes/aura";
import Material from "@primevue/themes/material";
import Lara from "@primevue/themes/lara";
import Nora from "@primevue/themes/Nora";
import { definePreset } from "@primevue/themes";

const MyPreset = definePreset(Aura, {
    semantic: {
        // 在这里切换主题色
        primary: {
            50: "{blue.50}",
            100: "{blue.100}",
            200: "{blue.200}",
            300: "{blue.300}",
            400: "{blue.400}",
            500: "{blue.500}",
            600: "{blue.600}",
            700: "{blue.700}",
            800: "{blue.800}",
            900: "{blue.900}",
            950: "{blue.950}",
        },
    },
});

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
        "nuxt-vite-legacy", // 兼容旧版本浏览器
        "nuxt-cron", // 定时任务
    ],

    plugins: [
        // '~/plugins/redis.server.ts',
    ],

    // 这个是给nuxt-vite-legacy用的，用来兼容旧版本浏览器
    legacy: {
        targets: ["chrome 69", "chrome 84"],
        modernPolyfills: ["es.global-this", "es.string.replace-all"],
        // 这里引入的文件参见这里：https://unpkg.com/browse/core-js@3.39.0/
    },
    // 如果报错：'legacy' does not exist in type 'InputConfig<NuxtConfig, ConfigLayerMeta>' 的话，
    // 运行nuxt build，这个参数就不会报错了。

    hooks: {
        // Nuxt Hooks (build time)写在nuxt.config.ts中或nuxt modules中
        // 仅在构建时执行，所以不存在服务器启动时执行的情况。
        ready: () => {
            console.log("ready");
        },
    },

    runtimeConfig: {
        public: {
            directus: {
                url: "http://127.0.0.1:8056",
                // url: process.env.DIRECTUS_URL,
                // 注意，这里的url在build的时候就已经读取到了。
                // 打包docker的时候，已经没有这个nuxt.config.ts文件了。
                // 参考：https://nuxtjs.org.cn/docs/guide/directory-structure/env
                // 所以，不要尝试直接用.env文件配置*生产环境*下的directus的url。
                // 必须通过执行命令时给命令行传参(.env文件中配置NUXT_PUBLIC_DIRECTUS_URL="http://127.0.0.1:8056/")的方式来配置。
            },
            isTest: false, // 默认为false，如果是测试环境，则设置为true
            // 以下是AnythingLLM的配置，用于嵌入式聊天机器人
            anythingllm: {
                embedId: "72e40eec-a5b4-4a5b-9106-6ed6c7f51aef",
                baseApiUrl: "http://localhost:3001/api/embed",
                scriptUrl:
                    "http://localhost:3101/embed/anythingllm-chat-widget.min.js",
            },
        },
        private: {
            // private意味着这些配置只能在服务器端代码中访问，不能在客户端代码中访问。
            directus_token: "token", //  这里会被.env文件中的NUXT_PRIVATE_DIRECTUS_TOKEN覆盖。
            redisHost: "127.0.0.1",
            redisPort: 6279,
        },
    },

    directus: {
        devtools: true,
        autoFetch: false, // 是否自动获取用户信息。如果开着这个的话，项目启动时如果token失效会报错。
        autoRefresh: false, // 是否自动刷新token
    },

    cron: {
        runOnInit: true, // 是否在启动时立即执行定时任务
        timeZone: "UTC+8",
        // jobsDir: "cron",
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
                // preset: MyPreset, // 自定义主题
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

    vite: {
        resolve: {
            // 此项必须配置，否则pnpm dev打开univer sheet会报错。
            alias: {
                react: "react",
                "react-dom": "react-dom",
                "@univerjs/design/lib/index.css":
                    "@univerjs/design/lib/index.css",
                "@univerjs/presets/lib/styles/preset-sheets-core.css":
                    "@univerjs/presets/lib/styles/preset-sheets-core.css",
            },
        },
        ssr: {
            // 此项必须配置，否则pnpm dev打开univer sheet会报错。
            noExternal: ["@univerjs/presets", "rxjs", "unplugin-vue-router", "vue-router"],
        },
    },
});
