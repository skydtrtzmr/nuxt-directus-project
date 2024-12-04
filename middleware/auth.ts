import { useAuth } from "~~/stores/auth";
export default defineNuxtRouteMiddleware(async (to, _from) => {
    console.log('auth middleware');
    
    const authStore = useAuth();
    await authStore.validateSession();
    
    const { fetchUser, setUser } = useDirectusAuth();
    const user = useDirectusUser();
    if (!user.value) {
        console.log('no user found, fetching user');
        // 如果没有用户，则尝试通过fetchUser（其实是利用cookie）获取用户信息
        const user = await fetchUser();
        setUser(user.value);
        // console.log('user:', user.value);
        
    }
    // 如果尝试之后仍然没有用户，则跳转到登录页面
    if (!user.value) {
        return navigateTo("/auth/login");
    }
});
