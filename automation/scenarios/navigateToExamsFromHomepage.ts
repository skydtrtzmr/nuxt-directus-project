// automation/scenarios/navigateToExamsFromHomepage.ts
import type { Router } from 'vue-router';
import { delay, navigateToWithRetry } from '../utils/domHelpers';
// import { log } from 'console';

export async function runNavigateToExamsFromHomepageScenario(router: Router): Promise<boolean> {
    // console.log("Automation: Starting Navigate to Exams from Homepage Scenario...");
    // console.log("router.currentRoute.value.path:", router.currentRoute.value.path);
    
    // 如果当前不是首页，先尝试导航到首页
    if (router.currentRoute.value.path !== '/dashboard') {
        console.log("Automation: Current path is not /dashboard. Attempting to navigate to /dashboard with retries...");
        const navigatedToDashboard = await navigateToWithRetry(
            router,
            () => router.push('/dashboard'),
            path => path === '/dashboard',
            { 
                timeoutPerAttempt: 5000,
                maxRetries: 3,
                delayBetweenRetriesMs: 1000
            }
        );
        if (!navigatedToDashboard) {
            console.warn("Automation: Failed to navigate to /dashboard after multiple retries.");
            return false;
        }
        console.log("Automation: Successfully navigated to /dashboard.");
    }
    
    // index.vue 的 onMounted 逻辑是直接跳转
    // console.log("Automation: Assuming index.vue will redirect to /exams. Waiting for redirection...");

    // 生成1到3秒的随机延迟
    const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1000ms to 2999ms, so 1 to ~3 seconds
    console.log(`Automation: Adding random delay of ${randomDelay}ms before navigating to /exams.`);
    await delay(randomDelay);

    // 尝试导航到 /exams，带重试逻辑
    console.log("Automation: Attempting to navigate to /exams with retries...");
    const navigatedToExams = await navigateToWithRetry(
        router,
        () => router.push('/exams'),
        path => path === '/exams',
        {
            timeoutPerAttempt: 10000,
            maxRetries: 3,
            delayBetweenRetriesMs: 1500
        }
    );

    if (navigatedToExams) {
        console.log("Automation: Successfully navigated to /exams.");
    } else {
        console.warn("Automation: Failed to navigate to /exams from homepage after multiple retries. Current path:", router.currentRoute.value.path);
        return false;
    }
    return true;
}