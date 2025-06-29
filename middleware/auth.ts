import { useAuth } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
    // 如果目标是登录页，则不进行任何操作，避免重定向循环
    if (to.path === "/auth/login") {
        return;
    }

    const authStore = useAuth();

    // 仅在客户端执行，尝试从 Cookie 初始化用户状态
    if (import.meta.client) {
        // 如果 store 中没有用户信息，则尝试获取
        if (!authStore.isLoggedIn) {
            await authStore.fetchUser();
        }
    }

    // 再次检查登录状态，如果依然未登录，则重定向
    // 注意：在服务端渲染（SSR）期间，authStore.isLoggedIn 可能为 false，
    // 但我们依赖客户端的 Cookie 来验证。真正的重定向判断应在客户端初始化后进行。
    if (import.meta.client && !authStore.isLoggedIn) {
        // 保存用户想访问的页面路径，以便登录后重定向
        const redirect = to.fullPath;
        return navigateTo({ path: "/auth/login", query: { redirect } });
    }
});
