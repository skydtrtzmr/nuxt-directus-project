// automation/scenarios/selectAndStartExam.ts
import type { Router } from "vue-router";
import {
    clickElement,
    delay,
    waitForElement,
    waitForElementToDisappear,
    navigateToWithRetry,
} from "../utils/domHelpers";

export async function runSelectAndStartExamScenario(
    router: Router,
    examTitle: string
): Promise<string | null> {
    // console.log(
    //     `Automation: Starting Select and Start Exam Scenario for "${examTitle}"...`
    // );
    if (router.currentRoute.value.path !== "/exams") {
        console.log("Automation: Not on exams page, navigating with retries...");
        const navigatedToExams = await navigateToWithRetry(
            router,
            () => router.push("/exams"),
            (path) => path === "/exams",
            { timeoutPerAttempt: 5000, maxRetries: 3 }
        );
        if (!navigatedToExams) {
            console.warn("Automation: Failed to navigate to exams page after multiple retries.");
            return null;
        }
    }

    // 等待加载指示器消失，而不是固定延迟
    console.log("Automation: Waiting for exam list to load...");
    const listLoaded = await waitForElementToDisappear(
        ".session-list-loading",
        20000
    );
    if (!listLoaded) {
        console.error("Automation: Timed out waiting for exam list to load.");
        return null;
    }

    // 确保至少一张考试卡片已渲染
    const firstCard = await waitForElement(".exam-card", 10000);
    if (!firstCard) {
        console.warn("Automation: No exam cards found after list loaded.");
        return null;
    }
    console.log("Automation: Exam list loaded successfully.");

    const examCards = document.querySelectorAll(".exam-card");
    if (examCards.length === 0) {
        console.warn("Automation: No exam cards found on the page.");
        return null;
    }

    let targetCard: HTMLElement | null = null;
    for (const card of Array.from(examCards)) {
        const titleElement = card.querySelector(".exam-card-title");
        if (titleElement && titleElement.textContent?.trim() === examTitle) {
            targetCard = card as HTMLElement;
            break;
        }
    }

    if (!targetCard) {
        console.warn(
            `Automation: Exam card with title "${examTitle}" not found.`
        );
        return null;
    }

    console.log(`Automation: Found exam card for "${examTitle}".`);
    const joinButton = targetCard.querySelector(".join-button") as HTMLElement;
    if (!joinButton) {
        console.warn(
            `Automation: Join button not found for exam "${examTitle}".`
        );
        return null;
    }

    // 等待导航到 /exam/:id 页面
    let examId: string | null = null;
    console.log(`Automation: Waiting for navigation to exam page for "${examTitle}" with retries...`);
    const navigatedToExamPage = await navigateToWithRetry(
        router,
        () => joinButton.click(),
        (path) => {
            const match = path.match(/^\/exam\/([^/]+)/);
            if (match) {
                examId = match[1];
                return true;
            }
            return false;
        },
        { timeoutPerAttempt: 15000, maxRetries: 5, delayBetweenRetriesMs: 3000 }
    );

    if (navigatedToExamPage && examId) {
        console.log(`Automation: URL navigation successful to exam page for ID: ${examId}.`);
        
        // 增强验证：确保考试页面内容真的加载完成
        console.log("Automation: Verifying exam page content is loaded...");
        
        // 等待考试页面的关键元素加载
        const examPageContentLoaded = await waitForElement(
            "div.question-detail, .loading-spinner-container, .exam-header",
            10000
        );
        
        if (!examPageContentLoaded) {
            console.warn(`Automation: Exam page content did not load for exam ID: ${examId}`);
            return null;
        }
        
        // 如果有加载动画，等待其消失
        const loadingSpinner = document.querySelector(".loading-spinner-container");
        if (loadingSpinner) {
            console.log("Automation: Loading spinner detected, waiting for it to disappear...");
            const spinnerDisappeared = await waitForElementToDisappear(
                ".loading-spinner-container",
                15000
            );
            if (!spinnerDisappeared) {
                console.warn(`Automation: Loading spinner did not disappear for exam ID: ${examId}`);
                return null;
            }
        }
        
        // 再次验证我们确实在正确的考试页面
        if (router.currentRoute.value.path.includes(`/exam/${examId}`)) {
            console.log(`Automation: Successfully verified exam page is fully loaded for ID: ${examId}.`);
            return examId;
        } else {
            console.warn(`Automation: Route verification failed. Expected path to contain /exam/${examId}, but got: ${router.currentRoute.value.path}`);
            return null;
        }
    } else {
        console.warn(
            `Automation: Failed to navigate to exam page for "${examTitle}" after multiple retries. Current path: ${router.currentRoute.value.path}`
        );
        return null;
    }
}
