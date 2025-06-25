// automation/scenarios/navigateToExamsFromHomepage.ts
import type { Router } from 'vue-router';
import { delay, navigateToWithRetry, waitForElement } from '../utils/domHelpers';
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
    
    // 等待一个 dashboard 页面上的稳定元素，而不是使用随机延迟
    console.log("Automation: Waiting for dashboard to be fully loaded...");
    const dashboardElement = await waitForElement('.dashboard-header', 15000);
    if (!dashboardElement) {
        console.warn("Automation: Failed to find a stable element on the dashboard. The page might not have loaded correctly.");
        return false;
    }
    console.log("Automation: Dashboard loaded. Proceeding to navigate to exams.");

    // 尝试导航到 /exams，带重试逻辑
    console.log("Automation: Attempting to navigate to /exams with retries...");
    const navigatedToExams = await navigateToWithRetry(
        router,
        () => router.push('/exams'),
        path => path === '/exams',
        {
            timeoutPerAttempt: 10000,
            maxRetries: 5,
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