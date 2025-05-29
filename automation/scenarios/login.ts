// automation/scenarios/login.ts
import type { Router } from "vue-router";
import {
    fillInput,
    clickElement,
    delay,
    waitForNavigation,
} from "../utils/domHelpers";

export async function runLoginScenario(router: Router): Promise<boolean> {
    // console.log("Automation: Starting Login Scenario...");
    if (router.currentRoute.value.path !== "/auth/login") {
        console.log("Automation: Not on login page, navigating...");
        router.push("/auth/login");
        if (
            !(await waitForNavigation(router, (path) => path === "/auth/login"))
        )
            return false;
    }

    // 从 login.vue 的 onMounted 获取逻辑
    const { data: fetchCurrentUserEmailResponse, error } = await useFetch(
        "/api/fetch_test_user"
    );
    if (error.value || !fetchCurrentUserEmailResponse.value) {
        console.error(
            "Automation: Failed to fetch current user for login.",
            error.value
        );
        alert("自动化测试获取用户信息失败！");
        return false;
    }
    const currentUserEmail = fetchCurrentUserEmailResponse.value as any; // 假设API返回结构
    // console.log("Automation: Test user fetched:", currentUserEmail);

    await delay(1000); // 等待页面元素渲染

    if (!(await fillInput('input[name="email"]', currentUserEmail)))
        return false;
    await delay(500);

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
    await delay(500);

    if (!(await clickElement('button#login-form[type="submit"]'))) return false; // 登录按钮
    // console.log("Automation: Login form submitted.");

    // 登录后，应用会跳转到 /dashboard
    // index.vue 的 onMounted 会再从 /dashboard (如果auth.login配置了redirect) 或直接从 / 跳转到 /exams
    // 此处我们等待跳转到 /exams，意味着后续脚本依赖此跳转
    const navigated = await waitForNavigation(
        router,
        (path) =>
            path.startsWith("/dashboard") ||
            path.startsWith("/exams") ||
            path.startsWith("/"),
        20000
    );
    if (navigated) {
        // console.log("Automation: Login successful, navigation detected.");

        await delay(1000);
    } else {
        console.warn(
            "Automation: Login might have failed or navigation timed out after submit."
        );
        return false;
    }
    return true;
}
