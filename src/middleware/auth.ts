import { useAuth } from "~/stores/auth";
export default defineNuxtRouteMiddleware(async (to, _from) => {
    console.log('auth middleware');
    
    const authStore = useAuth();
    await authStore.validateSession();
    
    const { fetchUser, setUser } = useDirectusAuth();
    const user = useDirectusUser();
    if (!user.value) {
        console.log('no user found, fetching user');
        
        const user = await fetchUser();
        setUser(user.value);
        // console.log('user:', user.value);
        
    }
    
    if (!user.value) {
        return navigateTo("/login");
    }
});
