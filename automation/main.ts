// automation/main.ts
import type { Router } from "vue-router";
import { runLoginScenario } from "./scenarios/login";
import { runNavigateToExamsFromHomepageScenario } from "./scenarios/navigateToExamsFromHomepage";
import { runSelectAndStartExamScenario } from "./scenarios/selectAndStartExam";
import { runCompleteExamScenario } from "./scenarios/completeExam";
import { delay } from "./utils/domHelpers";

let hasAutomationRun = false; // 防止重复执行

export async function runFullAutomationSequence(router: Router): Promise<void> {
    if (hasAutomationRun) {
        console.log(
            "Automation: Full sequence has already been attempted or run."
        );
        return;
    }
    hasAutomationRun = true; // 标记已运行，避免重复触发

    console.log("Automation: Starting Full Automation Sequence...");
    await delay(2000); // 初始延迟，等待应用完全初始化

    // 序列 1: 登录
    const loginSuccess = await runLoginScenario(router);
    if (!loginSuccess) {
        console.error("Automation: Login scenario failed. Aborting sequence.");
        return;
    }
    console.log("Automation: Login Scenario Completed.");
    await delay(1000);

    // // 序列 2: 从主页（或登录后自动跳转到的页面）导航到考试列表
    // // loginScenario 应该已经处理了登录后的跳转，现在我们确保在 /exams
    const navToExamsSuccess = await runNavigateToExamsFromHomepageScenario(
        router
    );
    if (!navToExamsSuccess) {
        console.error(
            "Automation: Navigate to Exams scenario failed. Aborting sequence."
        );
        return;
    }
    console.log("Automation: Navigate to Exams Scenario Completed.");
    await delay(1000);

    // // 序列 3: 选择特定考试并开始
    const examId = await runSelectAndStartExamScenario(
        router,
        "自动化测试专用考试"
    ); // 从 SessionList.vue 来的标题
    if (!examId) {
        console.error(
            "Automation: Select and Start Exam scenario failed. Aborting sequence."
        );
        return;
    }
    console.log(
        `Automation: Select and Start Exam Scenario Completed. Exam ID: ${examId}`
    );
    await delay(1000);

    // // 序列 4: 完成并提交考试
    const completeExamSuccess = await runCompleteExamScenario(router, examId);
    if (!completeExamSuccess) {
        console.error("Automation: Complete Exam scenario failed.");
    } else {
        console.log("Automation: Complete Exam Scenario Completed.");
    }

    console.log("Automation: Full Automation Sequence Finished.");
    alert("自动化测试脚本执行完毕！");
}
