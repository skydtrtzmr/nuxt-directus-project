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

export async function waitForNavigation(router: any, pathCondition: (path: string) => boolean, timeout = 10000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        console.log("router.currentRoute.value:", router.currentRoute.value);
        
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