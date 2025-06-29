import { defineStore } from "pinia";
import type { Students } from "~/types/directus_types";
import { login, readMe, type DirectusUser } from "@directus/sdk";

// const { getItems } = useDirectusItems(); // 从顶层移除

// useDirectusItems() 是一个 Nuxt composable，它依赖于 Nuxt 的上下文。在模块的顶层调用它，尤其是在服务器端渲染的早期阶段，可能会因为 Nuxt 应用实例尚未完全准备好而导致 getItems 函数未能正确初始化。如果这个未正确初始化的 getItems 函数在后续的 login action 中被调用，它可能会返回非预期的数据或导致错误，从而污染 Pinia 的状态。当 devalue 尝试序列化这个被污染的状态时，就可能触发 obj.hasOwnProperty is not a function 错误。

interface AuthUser extends DirectusUser {
    student_id?: string | null | undefined;
}

interface AuthState {
    loggedIn: boolean;
    user: AuthUser | null;
    access_token: string | null;
    refresh_token: string | null;
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
        async refreshToken() {
            const { $directus } = useNuxtApp();
            try {
                const response = await ($directus as any).auth.refresh();
                if (response) {
                    this.access_token = response.access_token;
                    this.refresh_token = response.refresh_token;
                }
            } catch (error) {
                console.error("刷新 token 失败", error);
                this.logout();
            }
        },

        async fetchUser() {
            const { $directus } = useNuxtApp();
            try {
                const me = await ($directus as any).users.me.read();
                if (me) {
                    this.user = me as AuthUser;
                    this.loggedIn = true;
                    // 在此可以根据需要获取关联的学生信息
                }
                return this.user;
            } catch (error) {
                this.resetState();
                return null;
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
            const { $directus } = useNuxtApp();
            const router = useRouter();

            try {
                const response = await $directus.login(
                    email,
                    password,
                );

                if (response) {
                    this.access_token = response.access_token;
                    this.refresh_token = response.refresh_token;
                }

                await this.fetchUser();

                if (this.loggedIn && redirect) {
                    router.push(redirect);
                }
            } catch (e) {
                console.error("登录失败", e);
                this.resetState();
                throw new Error(
                    "Wrong email address or password! 登录信息错误！"
                );
            }
        },
        async logout() {
            const { $directus } = useNuxtApp();
            const router = useRouter();
            try {
                await ($directus as any).auth.logout();
                this.resetState();
                router.push("/auth/login");
            } catch (e) {
                console.error("登出失败", e);
                this.resetState(); // 确保即使登出失败也重置状态
                router.push("/auth/login");
                throw new Error("Issue logging out! 登出失败！");
            }
        },
        async register({
            email,
            password,
        }: {
            email: string;
            password: string;
        }) {
            const { $directus } = useNuxtApp();
            try {
                // 1. 创建用户
                await ($directus as any).users.createOne({
                    email,
                    password,
                    role: "a6c5520a-c560-4638-92c8-251a31b4533b", // 注意：这里需要填入正确的学生角色ID
                });

                // 2. 注册成功后直接登录
                await this.login({ email, password, redirect: "/" });
            } catch (e) {
                console.error("注册失败", e);
                throw new Error("Registration failed. 注册失败。");
            }
        },
        async resetState() {
            this.$reset();
        },
    },
    persist: true,
    // 其实即使这里不做持久化，也能正常在刷新后做需要用户权限的操作，因为nuxt-directus会存储token。
    // 但是如果不持久化，那么会影响要用到state的页面显示，因为刷新后state会重置。
});
