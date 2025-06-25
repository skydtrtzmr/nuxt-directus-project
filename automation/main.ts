// automation/main.ts
import type { Router } from "vue-router";
import { runLoginScenario } from "./scenarios/login";
import { runNavigateToExamsFromHomepageScenario } from "./scenarios/navigateToExamsFromHomepage";
import { runSelectAndStartExamScenario } from "./scenarios/selectAndStartExam";
import { runCompleteExamScenario } from "./scenarios/completeExam";
import { delay, retryAction } from "./utils/domHelpers";

let hasAutomationRun = false; // 防止重复执行
let currentExamId: string | null = null; // 保存当前考试ID，用于断点续传

export async function runFullAutomationSequence(router: Router): Promise<void> {
    if (hasAutomationRun) {
        // console.log(
        //     "Automation: Full sequence has already been attempted or run."
        // );
        return;
    }
    hasAutomationRun = true; // 标记已运行，避免重复触发

    // console.log("Automation: Starting Full Automation Sequence...");
    await delay(2000); // 初始延迟，等待应用完全初始化

    // 序列 1: 登录 (带重试)
    const loginSuccess = await retryAction(
        () => runLoginScenario(router),
        (result) => result === true,
        { maxRetries: 3, delayMs: 2000 }
    );
    if (!loginSuccess) {
        console.error("Automation: Login scenario failed after retries. Aborting sequence.");
        alert("自动化测试失败：登录场景重试后仍然失败！");
        hasAutomationRun = false; // 只有登录失败才完全重置，因为没有用户上下文
        return;
    }
    console.log("Automation: Login Scenario Completed.");
    await delay(1000);

    // 序列 2: 从主页导航到考试列表 (带重试)
    const navToExamsSuccess = await retryAction(
        () => runNavigateToExamsFromHomepageScenario(router),
        (result) => result === true,
        { maxRetries: 3, delayMs: 2000 }
    );
    if (!navToExamsSuccess) {
        console.error("Automation: Navigate to Exams scenario failed after retries.");
        alert("自动化测试失败：导航到考试页面场景重试后仍然失败！\n\n用户已登录，您可以手动导航到考试页面继续测试。");
        return; // 不重置hasAutomationRun，保持用户登录状态
    }
    console.log("Automation: Navigate to Exams Scenario Completed.");
    await delay(1000);

    // 序列 3: 选择特定考试并开始 (带重试)
    const examId = await retryAction(
        () => runSelectAndStartExamScenario(router, "自动化测试专用考试"),
        (result) => result !== null && typeof result === "string",
        { maxRetries: 5, delayMs: 3000 } // 增加重试次数和延迟，因为这一步更容易受网络影响
    );
    if (!examId) {
        console.error("Automation: Select and Start Exam scenario failed after retries.");
        alert("自动化测试失败：选择并开始考试场景重试后仍然失败！\n\n用户已登录，您可以手动选择考试继续测试。");
        return; // 不重置hasAutomationRun，保持用户登录状态
    }
    
    currentExamId = examId; // 保存考试ID
    console.log(`Automation: Select and Start Exam Scenario Completed. Exam ID: ${examId}`);
    await delay(2000); // 给考试页面更多加载时间

    // 序列 4: 完成并提交考试 (带重试)
    const completeExamSuccess = await retryAction(
        () => runCompleteExamScenario(router, examId),
        (result) => result === true,
        { maxRetries: 3, delayMs: 3000 }
    );
    if (!completeExamSuccess) {
        console.error("Automation: Complete Exam scenario failed after retries.");
        alert(`自动化测试失败：完成考试场景重试后仍然失败！\n\n用户已进入考试 ${examId}，您可以手动完成考试以确保数据完整性。`);
        return; // 不重置hasAutomationRun，保持考试状态
    } else {
        console.log("Automation: Complete Exam Scenario Completed.");
        currentExamId = null; // 清除考试ID，表示测试完成
        alert("自动化测试脚本执行完毕！");
    }

    console.log("Automation: Full Automation Sequence Finished.");
}

// 导出当前状态查询函数，方便调试
export function getAutomationStatus() {
    return {
        hasRun: hasAutomationRun,
        currentExamId: currentExamId,
        canRetry: !hasAutomationRun || currentExamId !== null
    };
}
