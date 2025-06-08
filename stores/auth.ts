import { defineStore } from "pinia";
import type { Students } from "~/types/directus_types";
// import { useDirectusAuth, useDirectusUser } from "nuxt-directus";

// const { getItems } = useDirectusItems(); // 从顶层移除

// useDirectusItems() 是一个 Nuxt composable，它依赖于 Nuxt 的上下文。在模块的顶层调用它，尤其是在服务器端渲染的早期阶段，可能会因为 Nuxt 应用实例尚未完全准备好而导致 getItems 函数未能正确初始化。如果这个未正确初始化的 getItems 函数在后续的 login action 中被调用，它可能会返回非预期的数据或导致错误，从而污染 Pinia 的状态。当 devalue 尝试序列化这个被污染的状态时，就可能触发 obj.hasOwnProperty is not a function 错误。

interface User {
    id: string;
    email: string | null | undefined;
    first_name?: string | null;
    last_name?: string | null | undefined;
    student_id?: string | null | undefined; 
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
            // console.log("auth store refreshToken");
            try {
                const { refreshTokens } = useDirectusToken();
                const newToken = await refreshTokens();
                // console.log(
                //     "newToken:",
                //     newToken?.access_token,
                //     newToken?.refresh_token,
                //     newToken?.expires
                // );
                if (newToken) {
                    // 更新 token
                    this.access_token = newToken.access_token; // 假设你能从 response 中获取新的 access_token
                    this.refresh_token = newToken.refresh_token; // 如果有新的 refresh_token 也要更新
                }
            } catch (error) {
                console.error("刷新 token 失败", error);
                this.logout();
            }
        },

        async validateSession() {
            // 仅在客户端执行
            if (import.meta.client) {
                try {
                    // console.log("验证会话");
                    // console.log("当前时间：", new Date().toLocaleString());

                    // 检查用户是否仍然认证
                    const directusUser = useDirectusUser();
                    // console.log("directusUser:", directusUser);
                    // console.log("directusUser.value:", directusUser.value);
                    const { token, expires } = useDirectusToken();

                    // console.log("token1:", token, expires);

                    // 如果directusUser.value不存在，说明token无效
                    if (!directusUser.value) {
                        //  this.$reset(); // 无效的token，重置状态
                        // console.log("token 无效");
                        return false; // 用户未登录或 token 已过期
                    } else {
                        // console.log("token 有效，验证用户信息");
                        // 如果 token 即将过期，尝试刷新 token
                        // console.log("token2:", this.access_token, this.refresh_token);

                        if (this.access_token && this.refresh_token) {
                            // TODO 这里应该判断 token 是否即将过期，如果即将过期，则刷新 token
                            // console.log("token 即将过期，尝试刷新 token");
                            await this.refreshToken();
                        }
                        return true; // 会话有效
                    }
                } catch (e) {
                    console.error("验证会话失败", e);
                    this.logout();
                    return false; // 用户未登录或 token 已过期
                }
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
            // console.log("auth store login");
            // const { getItems } = useDirectusItems(); // 在 action 内部调用

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

                    // // [2025-06-03] 获取对应学生信息
                    // const filters = { directus_user: id };
                    // const student_info = await getItems<Students>({
                    //     collection: "students",
                    //     params: {
                    //         filter: filters,
                    //     },
                    // });
                    // this.user = { id, email, first_name, last_name, student_id: student_info[0].id };
                    // [2025-06-08] 获取学生信息不再需要了。
                    this.user = { id, email, first_name, last_name};

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
                    // console.log("auth store login success");
                } else {
                    // console.error("auth store login failed");
                    this.logout();
                }
            } catch (e) {
                console.error("登录失败", e);
                throw new Error(
                    "Wrong email address or password! 登录信息错误！"
                );
            }
        },
        async logout() {
            // console.log("auth store logout");
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
                router.push("/auth/login");
            } catch (e) {
                console.error("登出失败", e);
                router.push("/auth/login");
                throw new Error("Issue logging out! 登出失败！");
            }
        },
        async updateUser() {
            // console.log("auth store updateUser");

            try {
                // Try to fetch the user data
                const directusUser = useDirectusUser();
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
