import { useAuth } from "~/stores/auth";
export default defineNuxtRouteMiddleware(async (to, _from) => {
    const authStore = useAuth();
    await authStore.validateSession();
    
    const { fetchUser, setUser } = useDirectusAuth();
    const user = useDirectusUser();
    if (!user.value) {
        const user = await fetchUser();
        setUser(user.value);
    }
    if (!user.value) {
        return navigateTo("/login");
    }
});
