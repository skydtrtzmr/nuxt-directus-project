// automation/utils/domHelpers.ts
import type { Router } from 'vue-router';

export async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForElement(
    selector: string,
    timeout = 20000 // 增加默认超时时间
): Promise<Element | null> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) {
            // 确保元素可见且可交互 (基本检查)
            const style = window.getComputedStyle(element);
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                 return element;
            }
        }
        await delay(200); // Poll every 200ms
    }
    console.warn(`Automation: Timeout waiting for element: ${selector}`);
    return null;
}

export async function clickElement(selector: string, timeout = 20000): Promise<boolean> {
    const element = await waitForElement(selector, timeout);
    if (element) {
        (element as HTMLElement).click();
        console.log(`Automation: Clicked element: ${selector}`);
        return true;
    }
    console.warn(`Automation: Element not found or not clickable: ${selector}`);
    return false;
}

export async function fillInput(
    selector: string,
    value: string,
    timeout = 20000
): Promise<boolean> {
    const element = (await waitForElement(selector, timeout)) as HTMLInputElement | null;
    if (element) {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        // console.log(`Automation: Filled input ${selector} with "${value}"`);
        return true;
    }
    console.warn(`Automation: Input element not found: ${selector}`);
    return false;
}

// pathCondition 是一个函数，它被用作一个参数传递给 waitForNavigation 函数。
// 它的作用是定义导航成功的条件。
// 具体来说：
// pathCondition 接收一个字符串参数 path，这个 path 代表了当前路由的路径。
// 它需要返回一个布尔值（true 或 false）：
// 返回 true 表示当前的路径 path 满足了你期望的导航成功条件。
// 返回 false 表示当前路径还不满足条件。
// 在 waitForNavigation 函数内部，会不断地获取当前页面的路径，并调用 pathCondition 函数，把当前路径传给它。如果 pathCondition 返回 true，waitForNavigation 就认为导航已经成功完成。如果超时仍未满足条件，则认为导航失败。
// [2025-05-25] 注意，此函数仅仅用于等待验证是否成功跳转，本身并不包含跳转逻辑。
export async function waitForNavigation(router: Router, pathCondition: (path: string) => boolean, timeout = 20000): Promise<boolean> {
    console.log("waitForNavigation");
    
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        // console.log("router.currentRoute.value:", router.currentRoute.value);
        
        if (pathCondition(router.currentRoute.value.path)) {
            console.log(`Automation: Navigation successful to path matching condition.`);
            await delay(500); // 给页面一点时间加载内容
            return true;
        }
        await delay(200);
    }
    console.warn(`Automation: Timeout waiting for navigation to path matching condition. Current path: ${router.currentRoute.value.path}`);
    return false;
}

// 新增函数：执行导航操作并带重试逻辑
export async function navigateToWithRetry(
    router: Router,
    navigationAction: () => Promise<any> | void, // 实际执行导航的函数，例如 () => router.push('/path')
    pathCondition: (path: string) => boolean, // 验证导航是否成功的条件
    options?: {
        timeoutPerAttempt?: number; // 每次尝试等待导航完成的超时时间
        maxRetries?: number; // 最大重试次数
        delayBetweenRetriesMs?: number; // 两次重试之间的延迟
    }
): Promise<boolean> {
    const {
        timeoutPerAttempt = 20000, // 默认与 waitForNavigation 一致
        maxRetries = 3, // 默认重试3次
        delayBetweenRetriesMs = 1000 // 默认重试间隔1秒
    } = options || {};

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Automation: Navigation attempt ${attempt} of ${maxRetries} to path matching condition...`);
        
        try {
            await navigationAction(); // 执行导航动作
        } catch (error) {
            console.error(`Automation: Error during navigation action on attempt ${attempt}:`, error);
            // 如果导航动作本身出错，也视为一次失败的尝试
        }

        if (await waitForNavigation(router, pathCondition, timeoutPerAttempt)) {
            console.log(`Automation: Navigation successful after attempt ${attempt}.`);
            return true; // 导航成功
        }

        const currentPath = router.currentRoute.value.path;
        if (attempt < maxRetries) {
            console.warn(`Automation: Navigation attempt ${attempt} failed. Current path: ${currentPath}. Retrying in ${delayBetweenRetriesMs}ms...`);
            await delay(delayBetweenRetriesMs);
        } else {
            console.error(`Automation: Navigation failed after ${maxRetries} attempts. Current path: ${currentPath}.`);
        }
    }

    return false; // 所有重试均失败
}

/**
 * 通用重试操作函数
 * @param action - 要执行的函数，它应该返回一个结果
 * @param condition - 一个函数，用于判断action返回的结果是否满足成功条件
 * @param options - 配置选项，包括最大重试次数和延迟
 * @returns 如果成功，则返回action的结果；如果所有重试都失败，则返回null
 */
export async function retryAction<T>(
    action: () => T | Promise<T>,
    condition: (result: T) => boolean,
    options?: {
        maxRetries?: number;
        delayMs?: number;
    }
): Promise<T | null> {
    const { maxRetries = 5, delayMs = 1500 } = options || {};

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const result = await action();
        if (condition(result)) {
            return result;
        }

        if (attempt < maxRetries) {
            console.warn(`自动化测试：操作未满足条件，将在 ${delayMs}ms 后重试（第 ${attempt}/${maxRetries} 次）...`);
            await delay(delayMs);
        } else {
            console.error(`自动化测试：操作在 ${maxRetries} 次重试后仍然失败。`);
        }
    }

    return null;
}