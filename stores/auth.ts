import { defineStore } from "pinia";
// import { useDirectusAuth, useDirectusUser } from "nuxt-directus";

interface User {
    id: string;
    email: string | null | undefined;
    first_name?: string | null;
    last_name?: string | null | undefined;
    // 添加其他用户字段
}

interface AuthState {
    loggedIn: boolean;
    user: User | null;
    access_token: string | null;
    refresh_token: string | null; // 如果你有 refresh token，可以存储它
}

interface AuthResponse {
    access_token: string;
    expires: number;
    refresh_token: string;
}

// interface LoginParams {
//     email: string;
//     password: string;
//     redirect?: string; // 可选参数，表示把用户重定向到某个页面
// }

// 关于存储登录状态：
// 用户数据中有一个关键的数据叫做token（用来标识当前用户是否登录），而Token持续一段时间才会过期
// Pinia的存储是基于内存的，刷新就会丢失，为了保持登录状态，就要做到刷新不丢失，需要配合持久化进行存储

export const useAuth = defineStore("auth", {
    state: (): AuthState => ({
        loggedIn: false,
        user: null,
        access_token: null,
        refresh_token: null,
    }),

    getters: {
        isLoggedIn: (state) => state.loggedIn,
        userData: (state) => state.user,
    },

    actions: {
        // 刷新 token 的逻辑
        async refreshToken() {
            console.log("auth store refreshToken");
            const { logout } = useDirectusAuth();

            try {
                const { refreshTokens } = useDirectusToken();
                const newToken = await refreshTokens();

                if (newToken) {
                    // 更新 token
                    this.access_token = newToken.access_token; // 假设你能从 response 中获取新的 access_token
                    this.refresh_token = newToken.refresh_token; // 如果有新的 refresh_token 也要更新
                }
            } catch (error) {
                console.error("刷新 token 失败", error);
                await logout();
                // this.$reset(); // 如果刷新失败，清空状态
            }
        },

        async validateSession() {
            const { logout } = useDirectusAuth();
            try {
                console.log("验证会话");

                // 检查用户是否仍然认证
                const directusUser = useDirectusUser();
                // 如果directusUser.value不存在，说明token无效
                if (!directusUser.value) {
                    this.$reset(); // 无效的token，重置状态
                    console.log("token 无效，重置状态");

                    return false; // 用户未登录或 token 已过期
                } // 如果用户信息存在，检查 token 是否有效
                console.log("token 有效，验证用户信息");
                // 如果 token 即将过期，尝试刷新 token
                console.log("token:", this.access_token, this.refresh_token);

                if (this.access_token && this.refresh_token) {
                    // TODO 这里应该判断 token 是否即将过期，如果即将过期，则刷新 token
                    console.log("token 即将过期，尝试刷新 token");
                    await this.refreshToken();
                }

                // 如果用户验证成功，确保用户数据同步
                await this.getUser();
                return true; // 会话有效
            } catch (e) {
                console.error("验证会话失败", e);
                this.$reset(); // 无法验证时，重置状态
                await logout(); // 无效的token，退出登录
                return false; // 用户未登录或 token 已过期
            }
        },

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
            console.log("auth store login");

            try {
                // Try to login
                const loginResponse: AuthResponse = await login({
                    email,
                    password,
                });

                // If login was successful, fetch the users data
                // 如果登录成功，获取用户数据
                const directusUser = useDirectusUser();
                // 注意一定要先判断directusUser.value是否存在，否则会报错
                if (directusUser.value) {
                    // 使用解构赋值提取所需的字段
                    const { id, email, first_name, last_name } =
                        directusUser.value;
                    this.user = { id, email, first_name, last_name };
                }
                // Update the auth store with the user data
                this.loggedIn = true;

                // 获取和保存 token 和 refreshToken
                const { access_token, refresh_token } = loginResponse;
                this.access_token = access_token; // 保存新的 access token
                this.refresh_token = refresh_token; // 保存新的 refresh token

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
            console.log("auth store logout");

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
            console.log("auth store getUser");

            try {
                // Try to fetch the user data
                const directusUser = useDirectusUser();
                // Update the auth store with the user data
                this.loggedIn = true;
                if (directusUser.value) {
                    // 使用解构赋值提取所需的字段
                    const { id, email, first_name, last_name } =
                        directusUser.value;
                    this.user = { id, email, first_name, last_name };
                }
            } catch (e) {
                console.log(e);
            }
        },
        async resetState() {
            this.$reset();
        },
        // 定时检查 token 是否过期
        startTokenExpirationCheck() {
            setInterval(async () => {
                await this.validateSession();
            }, 5 * 60 * 1000); // 每隔 5 分钟检查一次
        },
    },
    persist: true, // 持久化存储，这样刷新页面不会丢失登录状态
    // 其实即使这里不做持久化，也能正常在刷新后做需要用户权限的操作，因为nuxt-directus会存储token。
    // 但是如果不持久化，那么会影响要用到state的页面显示，因为刷新后state会重置。
});
