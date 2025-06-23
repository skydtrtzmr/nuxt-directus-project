import { createDirectus, rest, readItem, readItems, readSingleton } from "@directus/sdk";

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
    const directus = createDirectus(url).with(rest());
    return {
        provide: { directus, readItem, readItems, readSingleton },
    };
});
