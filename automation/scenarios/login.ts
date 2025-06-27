// automation/scenarios/login.ts
import type { Router } from "vue-router";
import {
    fillInput,
    clickElement,
    delay,
    navigateToWithRetry,
    waitForElement,
} from "../utils/domHelpers";
import { fetchWithRetry } from "../utils/networkHelpers";

export async function runLoginScenario(router: Router): Promise<boolean> {
    const config = useRuntimeConfig();
    // console.log("Automation: Starting Login Scenario...");
    if (router.currentRoute.value.path !== "/auth/login") {
        console.log(
            "Automation: Not on login page, navigating with retries..."
        );
        const navigatedToLogin = await navigateToWithRetry(
            router,
            () => router.push("/auth/login"),
            (path) => path === "/auth/login",
            { timeoutPerAttempt: 5000, maxRetries: 3 }
        );
        if (!navigatedToLogin) {
            console.warn(
                "Automation: Failed to navigate to login page after multiple retries."
            );
            return false;
        }
    }

    try {
        // 从 login.vue 的 onMounted 获取逻辑
        const fetchCurrentUserEmailResponse = await fetchWithRetry<
            Record<string, string>
        >(
            `${config.public.directus.url}/fetch-user-email-list-pop-endpoint/pop`
        );

        if (!fetchCurrentUserEmailResponse) {
            console.error(
                "Automation: Failed to fetch current user for login after retries."
            );
            alert("自动化测试获取用户信息失败！");
            return false;
        }

        const currentUserEmail = fetchCurrentUserEmailResponse.email as any; // 假设API返回结构
        // console.log("Automation: Test user fetched:", currentUserEmail);

        // 等待邮件输入框出现，而不是固定延迟
        const emailInput = await waitForElement('input[name="email"]', 10000);
        if (!emailInput) {
            console.error("Automation: Email input not found on login page.");
            return false;
        }

        if (!(await fillInput('input[name="email"]', currentUserEmail)))
            return false;

        const passwordInput = currentUserEmail.split("@")[0];
        // PrimeVue Password 组件可能需要特殊处理其内部 input
        const passwordComponentInput = document.querySelector(
            "#password1 input"
        ) as HTMLInputElement;
        if (passwordComponentInput) {
            passwordComponentInput.value = passwordInput;
            passwordComponentInput.dispatchEvent(
                new Event("input", { bubbles: true })
            );
            passwordComponentInput.dispatchEvent(
                new Event("blur", { bubbles: true })
            );
            // console.log(`Automation: Filled password component input`);
        } else {
            // Fallback if direct input selection above fails
            if (!(await fillInput('input[type="password"]', passwordInput)))
                return false;
        }

        if (!(await clickElement('button#login-form[type="submit"]')))
            return false; // 登录按钮
        // console.log("Automation: Login form submitted.");

        // 登录后，应用会跳转到 /dashboard
        // index.vue 的 onMounted 会再从 /dashboard (如果auth.login配置了redirect) 或直接从 / 跳转到 /exams
        // 此处我们等待跳转到 /exams，意味着后续脚本依赖此跳转
        console.log(
            "Automation: Waiting for navigation after login with retries..."
        );
        const navigatedAfterLogin = await navigateToWithRetry(
            router,
            () => {
                /* 导航由表单提交触发，此处无需额外操作 */
            },
            (path) =>
                path.startsWith("/dashboard") ||
                path.startsWith("/exams") ||
                path.startsWith("/"), // 首页本身也可能是一个有效的中间状态
            {
                timeoutPerAttempt: 20000,
                maxRetries: 5,
                delayBetweenRetriesMs: 1000,
            }
        );

        if (navigatedAfterLogin) {
            // console.log("Automation: Login successful, navigation detected.");
        } else {
            console.warn(
                "Automation: Login might have failed or navigation timed out after submit. Current path:",
                router.currentRoute.value.path
            );
            return false;
        }
        return true;
    } catch (error) {
        console.error(
            "Automation: The login scenario failed due to a fatal error during fetch.",
            error
        );
        return false;
    }
}
