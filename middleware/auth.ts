import { useAuth } from "~~/stores/auth";
export default defineNuxtRouteMiddleware(async (to, _from) => {
    if (import.meta.client) {
        console.log("auth middleware");

        const router = useRouter();

        const authStore = useAuth();
        const isSessionValid = await authStore.validateSession();

        const { fetchUser, setUser } = useDirectusAuth();
        if (!isSessionValid) {
            console.log("no user found, fetching user");
            // 如果没有用户，则尝试通过fetchUser（其实是利用cookie）获取用户信息
            const user = await fetchUser();
            console.log("fetch user result:", user.value);

            // 如果尝试之后仍然没有用户，则跳转到登录页面
            if (!user.value) {
                console.log("fetch user failed, logging out");
                // 如果已经登出过了，cookie相关数据清掉了，
                // 但是这时候要是再访问页面，因为已经登出过了所以不能再成功地再登出。
                // 所以需要判断一下，如果已经登出过了，则直接跳转到登录页面，否则就正常登出。
                if (authStore.isLoggedIn) {
                    authStore.logout();
                } else {
                    router.push("/auth/login");
                }
            } else {
                // console.log("fetch user success, setting user");
                setUser(user.value);
                authStore.updateUser();
            }
        }
    }
});
