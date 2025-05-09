// automation/utils/domHelpers.ts
export async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForElement(
    selector: string,
    timeout = 10000 // 增加默认超时时间
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
        await delay(100); // Poll every 100ms
    }
    console.warn(`Automation: Timeout waiting for element: ${selector}`);
    return null;
}

export async function clickElement(selector: string, timeout = 10000): Promise<boolean> {
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
    timeout = 10000
): Promise<boolean> {
    const element = (await waitForElement(selector, timeout)) as HTMLInputElement | null;
    if (element) {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        console.log(`Automation: Filled input ${selector} with "${value}"`);
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
export async function waitForNavigation(router: any, pathCondition: (path: string) => boolean, timeout = 10000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        // console.log("router.currentRoute.value:", router.currentRoute.value);
        
        if (pathCondition(router.currentRoute.value.path)) {
            console.log(`Automation: Navigation successful to path matching condition.`);
            await delay(500); // 给页面一点时间加载内容
            return true;
        }
        await delay(100);
    }
    console.warn(`Automation: Timeout waiting for navigation to path matching condition. Current path: ${router.currentRoute.value.path}`);
    return false;
}