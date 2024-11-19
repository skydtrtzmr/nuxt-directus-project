import { defineStore } from "pinia";
// import { useDirectusAuth, useDirectusUser } from "nuxt-directus";

interface User {
    id: string;
    email: string | null | undefined;
    first_name?: string | null;
    last_name?: string| null | undefined;
    // 添加其他用户字段
}

interface AuthState {
    loggedIn: boolean;
    user: User | null;
}

// interface LoginParams {
//     email: string;
//     password: string;
//     redirect?: string; // 可选参数，表示把用户重定向到某个页面
// }

export const useAuth = defineStore("auth", {
    state: (): AuthState => ({
        loggedIn: false,
        user: null,
    }),

    getters: {
        isLoggedIn: (state) => state.loggedIn,
        userData: (state) => state.user,
    },

    actions: {
        async login({
            email,
            password,
            redirect,
        }: {
            email: string;
            password: string;
            redirect?: string;
        }) {
            const { login } = useDirectusAuth();
            const router = useRouter();

            try {
                // Try to login
                await login({
                    email,
                    password,
                });

                // If login was successful, fetch the users data
                // 如果登录成功，获取用户数据
                const directusUser = useDirectusUser();
                // 注意一定要先判断directusUser.value是否存在，否则会报错
                if (directusUser.value) {
                    // 使用解构赋值提取所需的字段
                    const {id , email, first_name, last_name} = directusUser.value;
                    this.user = {id , email, first_name, last_name};
                }
                // Update the auth store with the user data
                this.loggedIn = true;

                // If there's a redirect, send the user there
                if (redirect) {
                    router.push(redirect);
                }
            } catch (e) {
                console.error("登录失败", e);
                throw new Error(
                    "Wrong email address or password! 登录信息错误！"
                );
            }
        },
        async logout() {
            const router = useRouter();
            const { logout } = useDirectusAuth();

            try {
                // Try to logout
                await logout();

                // Remove the auth_expires_at cookie that is left over from the logout
                // const authExpiration = useCookie("auth_expires_at");
                // authExpiration.value = null;
                // TODO 目前不太确定nuxt-directus是否logout时会清除cookie，先注释掉。

                // If logout was successful, reset the auth store
                this.$reset();
                // Send the user back to the home page
                router.push("/");
            } catch (e) {
                console.error("登出失败", e);
                throw new Error("Issue logging out! 登出失败！");
            }
        },
        async getUser() {
            try {
                // Try to fetch the user data
                const directusUser = useDirectusUser();
                // Update the auth store with the user data
                this.loggedIn = true;
                if (directusUser.value) {
                    // 使用解构赋值提取所需的字段
                    const {id , email, first_name, last_name} = directusUser.value;
                    this.user = {id , email, first_name, last_name};
                }
            } catch (e) {
                console.log(e);
            }
        },
        async resetState() {
            this.$reset();
        },
    },
});
