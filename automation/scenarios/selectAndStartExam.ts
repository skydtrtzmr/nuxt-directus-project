// automation/scenarios/selectAndStartExam.ts
import type { Router } from "vue-router";
import {
    clickElement,
    delay,
    waitForElement,
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

    await delay(2000); // 等待 DataView 加载完成

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

    joinButton.click();
    // console.log(`Automation: Clicked join button for "${examTitle}".`);

    // 等待导航到 /exam/:id 页面
    let examId: string | null = null;
    console.log(`Automation: Waiting for navigation to exam page for "${examTitle}" with retries...`);
    const navigatedToExamPage = await navigateToWithRetry(
        router,
        () => { /* 导航由 joinButton.click() 触发，此处无需额外操作 */ },
        (path) => {
            const match = path.match(/^\/exam\/([^/]+)/);
            if (match) {
                examId = match[1];
                return true;
            }
            return false;
        },
        { timeoutPerAttempt: 10000, maxRetries: 3, delayBetweenRetriesMs: 1000 }
    );

    if (navigatedToExamPage && examId) {
        console.log(
            `Automation: Successfully navigated to exam page for ID: ${examId}.`
        );
        return examId;
    } else {
        console.warn(
            `Automation: Failed to navigate to exam page for "${examTitle}" after multiple retries. Current path: ${router.currentRoute.value.path}`
        );
        return null;
    }
}
