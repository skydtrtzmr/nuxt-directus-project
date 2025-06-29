import {
    createDirectus,
    rest,
    readItem,
    readItems,
    readSingleton,
    authentication,
    type AuthenticationStorage,
} from "@directus/sdk";

// 注意这个不能写在export外面，会报错：
//  A composable that requires access to the Nuxt instance was called outside of a plugin, Nuxt hook, Nuxt middleware, or Vue setup function.
// 要写在export里面。
// const {
//     public: {
//         directus: { url },
//     },
//     private: { directus_token },
// } = useRuntimeConfig();

// const directus = createDirectus(url).with(rest());

export default defineNuxtPlugin(() => {
    const {
        public: {
            directus: { url },
        },
        // private: { directus_token },
        // 【Question】这行private不注释掉会报错。不知道为啥。
    } = useRuntimeConfig();

    // 使用 Nuxt 的 useCookie 实现持久化存储
    class NuxtCookieStorage implements AuthenticationStorage {
        get() {
            const cookie = useCookie<any>("directus_session_data");
            return cookie.value ?? null;
        }
        set(value: any) {
            const cookie = useCookie<any>("directus_session_data");
            cookie.value = value;
        }
    }
    const storage = new NuxtCookieStorage();

    // 创建带有身份验证功能的 Directus 实例
    const directus = createDirectus(url)
        .with(authentication("cookie", { storage }))
        .with(rest());

    return {
        provide: {
            directus,
            // 保留旧的 provide 以确保其他地方的兼容性，尽管它们可以通过 directus.request(xxx) 调用
            readItem,
            readItems,
            readSingleton,
        },
    };
});
