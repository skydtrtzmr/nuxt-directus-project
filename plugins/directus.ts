import {
    createDirectus,
    rest,
    readItem,
    readItems,
    readSingleton,
    authentication,
    readMe,
    type AuthenticationStorage,
    registerUser,
} from "@directus/sdk";

export default defineNuxtPlugin(() => {
    const {
        public: {
            directus: { url },
        },
        // private: { directus_token },
        // 【Question】这行private不注释掉会报错。不知道为啥。
    } = useRuntimeConfig();

    // 使用 Nuxt 的 useCookie 实现持久化存储
    class NuxtCookieStorage {
        cookie = useCookie("directus-data");
        get() {
            return this.cookie.value;
        }
        set(value: any) {
            this.cookie.value = value;
        }
    }
    const storage = new NuxtCookieStorage() as AuthenticationStorage;

    // 创建带有身份验证功能的 Directus 实例
    const directus = createDirectus(url)
        .with(authentication("cookie", { credentials: "include", storage }))
        .with(rest({ credentials: "include" }));

    return {
        provide: {
            directus,
            // 保留旧的 provide 以确保其他地方的兼容性，尽管它们可以通过 directus.request(xxx) 调用
            readItem,
            readItems,
            readSingleton,
            registerUser,
        },
    };
});
