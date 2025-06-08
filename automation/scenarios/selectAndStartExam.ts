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
    const firstCard = await waitForElement(".exam-card", 5000);
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
        { timeoutPerAttempt: 10000, maxRetries: 5, delayBetweenRetriesMs: 2000 }
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
