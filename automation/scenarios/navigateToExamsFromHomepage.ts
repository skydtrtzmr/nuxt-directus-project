// automation/scenarios/navigateToExamsFromHomepage.ts
import type { Router } from 'vue-router';
import { delay, waitForNavigation } from '../utils/domHelpers';
import { log } from 'console';

export async function runNavigateToExamsFromHomepageScenario(router: Router): Promise<boolean> {
    // console.log("Automation: Starting Navigate to Exams from Homepage Scenario...");
    // console.log("router.currentRoute.value.path:", router.currentRoute.value.path);
    
    // 如果当前不是首页，先尝试导航到首页
    if (router.currentRoute.value.path !== '/dashboard') {
        router.push('/dashboard');
        if (!await waitForNavigation(router, path => path === '/dashboard')) {
            console.warn("Automation: Failed to navigate to homepage first.");
            return false;
        }
    }
    
    // index.vue 的 onMounted 逻辑是直接跳转
    // console.log("Automation: Assuming index.vue will redirect to /exams. Waiting for redirection...");
    // 等待跳转到 /exams
    const navigated = await waitForNavigation(router, path => path === '/exams', 10000);
    if (navigated) {
        console.log("Automation: Successfully navigated to /exams.");
    } else {
        console.log("path:", router.currentRoute.value.path);
        
        console.warn("Automation: Failed to navigate to /exams from homepage.");
        // 尝试强制导航以防万一
        router.push('/exams');
        await delay(1000);
        if (router.currentRoute.value.path !== '/exams') {
            return false;
        }
    }
    return true;
}