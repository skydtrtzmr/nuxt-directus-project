// automation/scenarios/completeExam.ts
import type { Router } from "vue-router";
import {
    delay,
    waitForElement,
    waitForElementToDisappear,
    navigateToWithRetry,
    retryAction,
} from "../utils/domHelpers";

// 从题型标签获取题目类型
function getQuestionTypeFromTag(questionElement: HTMLElement): string | null {
    const tagElement = questionElement.querySelector(".question-type-tag");
    if (tagElement && tagElement.textContent) {
        const tagText = tagElement.textContent.trim();
        switch (tagText) {
            case "单选题":
                return "q_mc_single";
            case "多选题":
                return "q_mc_multi";
            case "判断题":
                return "q_mc_binary";
            case "不定项选择题":
                return "q_mc_flexible";
            default:
                console.warn(`自动化测试：从标签识别出未知题型: ${tagText}`);
                return null;
        }
    }
    return null;
}

// 题型识别的备选方案
function getQuestionTypeFallback(questionElement: HTMLElement): string | null {
    const radioButtons = questionElement.querySelectorAll(
        "input[type='radio']"
    ).length;
    const checkBoxes = questionElement.querySelectorAll(
        "input[type='checkbox']"
    ).length;
    const optionItems = questionElement.querySelectorAll(".option-item").length;

    if (radioButtons > 0 && checkBoxes === 0) {
        if (optionItems === 2) return "q_mc_binary";
        return "q_mc_single";
    }
    if (checkBoxes > 0 && radioButtons === 0) {
        // 对于选择策略，QMcMulti 和 QMcFlexible 类似，但这里我们仍需区分它们以匹配计数器
        // 假设 data-question-actual-type 或 tag 会提供更准确的区分
        // 此备选方案的准确性较低，尤其是在区分 q_mc_multi 和 q_mc_flexible 时
        // 暂时返回 q_mc_multi，期望更优先的检测方法能正确处理
        return "q_mc_multi";
    }
    return null;
}

// 获取题目类型的主要函数
function getQuestionType(questionElement: HTMLElement): string | null {
    // 优先级 1: 检查 data-question-actual-type 属性
    const actualType = questionElement.dataset.questionActualType;
    if (actualType) {
        // 直接返回获取到的类型，如 "q_mc_single", "q_mc_multi" 等
        return actualType;
    }

    // 优先级 2: 从 .question-type-tag 文本获取类型
    const typeFromTag = getQuestionTypeFromTag(questionElement);
    if (typeFromTag) return typeFromTag;

    // 优先级 3: 备选方案，根据 input 类型和选项数量推断
    const typeFromInputs = getQuestionTypeFallback(questionElement);
    if (typeFromInputs) return typeFromInputs;

    console.warn("自动化测试：无法通过任何方法确定题目类型。", questionElement);
    return null;
}

interface IAnswerCounters {
    q_mc_single: number;
    q_mc_binary: number;
    q_mc_multi: number;
    q_mc_flexible: number;
}

async function selectDeterministicOptions(
    questionElement: HTMLElement,
    questionType: string,
    counters: IAnswerCounters
): Promise<void> {
    const getOptionLabel = (char: string): HTMLElement | null => {
        const selector = `label.option-label[for^='option_${char.toLowerCase()}_']`;
        return questionElement.querySelector(selector) as HTMLElement | null;
    };

    switch (questionType) {
        case "q_mc_single": {
            const choices = ["A", "B", "C", "D"];
            const targetChar = choices[counters.q_mc_single % choices.length];
            const optionLabel = getOptionLabel(targetChar);
            if (optionLabel) {
                // console.log(
                //     `自动化测试：[单选题] 在题目元素中选择: ${targetChar}`
                // );
                optionLabel.click();
                await delay(200);
            } else {
                console.warn(
                    `自动化测试：[单选题] 未在以下元素中找到选项 ${targetChar}:`,
                    questionElement
                );
            }
            counters.q_mc_single++;
            break;
        }
        case "q_mc_binary": {
            const choices = ["A", "B"];
            const targetChar = choices[counters.q_mc_binary % choices.length];
            const optionLabel = getOptionLabel(targetChar);
            if (optionLabel) {
                // console.log(
                //     `自动化测试：[判断题] 在题目元素中选择: ${targetChar}`
                // );
                optionLabel.click();
                await delay(200);
            } else {
                console.warn(
                    `自动化测试：[判断题] 未在以下元素中找到选项 ${targetChar}:`,
                    questionElement
                );
            }
            counters.q_mc_binary++;
            break;
        }
        case "q_mc_multi": {
            const patterns = [
                ["A", "B"],
                ["B", "C"],
                ["C", "D"],
                ["D", "A"],
            ];
            const currentPattern =
                patterns[counters.q_mc_multi % patterns.length];
            // console.log(
            //     `自动化测试：[多选题] 在题目元素中选择模式: ${currentPattern.join(
            //         ", "
            //     )}`
            // );
            for (const char of currentPattern) {
                const optionLabel = getOptionLabel(char);
                if (optionLabel) {
                    // console.log(`自动化测试：[多选题] 点击选项: ${char}`);
                    optionLabel.click();
                    await delay(200);
                } else {
                    console.warn(
                        `自动化测试：[多选题] 未在以下元素中找到选项 ${char}:`,
                        questionElement
                    );
                }
            }
            counters.q_mc_multi++;
            break;
        }
        case "q_mc_flexible": {
            const patterns = [
                ["A", "B"],
                ["B", "C"],
                ["C", "D"],
                ["D", "A"],
            ];
            const currentPattern =
                patterns[counters.q_mc_flexible % patterns.length];
            // console.log(
            //     `自动化测试：[不定项选择题] 在题目元素中选择模式: ${currentPattern.join(
            //         ", "
            //     )}`
            // );
            for (const char of currentPattern) {
                const optionLabel = getOptionLabel(char);
                if (optionLabel) {
                    // console.log(`自动化测试：[不定项选择题] 点击选项: ${char}`);
                    optionLabel.click();
                    await delay(200);
                } else {
                    console.warn(
                        `自动化测试：[不定项选择题] 未在以下元素中找到选项 ${char}:`,
                        questionElement
                    );
                }
            }
            counters.q_mc_flexible++;
            break;
        }
        default:
            console.warn(
                `自动化测试：确定性选择遇到未知或未处理的题型 "${questionType}"`
            );
    }
}

export async function runCompleteExamScenario(
    router: Router,
    examId: string
): Promise<boolean> {
    // console.log(`自动化测试：开始执行完成考试场景，考试ID "${examId}"...`);

    // 增强路径验证：使用重试机制等待正确的路径
    console.log(`自动化测试：正在验证是否在正确的考试页面 (ID: ${examId})...`);
    const routeVerificationSuccess = await retryAction(
        () => {
            const currentPath = router.currentRoute.value.path;
            return currentPath.includes(`/exam/${examId}`);
        },
        (isOnCorrectPath) => isOnCorrectPath === true,
        { maxRetries: 5, delayMs: 2000 }
    );

    if (!routeVerificationSuccess) {
        console.warn(
            `自动化测试：重试后仍不在正确的考试页面。期望路径包含 /exam/${examId}, 实际为 ${router.currentRoute.value.path}`
        );
        return false;
    }
    console.log("自动化测试：已确认在考试页面。");

    // 新的等待逻辑：等待加载动画出现然后消失
    console.log("自动化测试：等待试卷加载...");
    const spinnerAppeared = await waitForElement(
        ".loading-spinner-container",
        5000 // 等待5秒
    );
    if (spinnerAppeared) {
        console.log("自动化测试：加载指示器已出现，现在等待其消失...");
        const spinnerDisappeared = await waitForElementToDisappear(
            ".loading-spinner-container",
            15000 // 给与更长的超时时间，以应对慢速网络
        );
        if (!spinnerDisappeared) {
            console.error("自动化测试：等待加载指示器消失超时。测试终止。");
            return false;
        }
    } else {
        console.warn(
            "自动化测试：未检测到加载指示器。可能页面已预加载或加载速度非常快。继续执行..."
        );
    }
    console.log("自动化测试：试卷加载完成。");

    const answerCounters: IAnswerCounters = {
        q_mc_single: 0,
        q_mc_binary: 0,
        q_mc_multi: 0,
        q_mc_flexible: 0,
    };

    let mainQuestionLoopIndex = 1; // 主题目循环索引
    while (true) {
        // console.log(
        //     `自动化测试：正在查找主题目/题组区域 ${mainQuestionLoopIndex}...`
        // );
        const mainQuestionArea = await waitForElement(
            "div.question-detail", // 目标为 QuestionDetail.vue 的根元素
            12000
        );

        if (!mainQuestionArea) {
            console.log(
                `自动化测试：未能找到主题目区域 ${mainQuestionLoopIndex}。可能已到题目末尾或出现问题。`
            );
            break;
        }
        console.log(`自动化测试：找到主题目区域 ${mainQuestionLoopIndex}。`);
        mainQuestionArea.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
        await delay(600); // 等待滚动和潜在的内容渲染

        const groupContentElement = mainQuestionArea.querySelector(
            ".question-group-content"
        );

        if (groupContentElement) {
            console.log("自动化测试：检测到题组模式。");
            const groupQuestionItems =
                groupContentElement.querySelectorAll("div.question-item");
            if (groupQuestionItems.length === 0) {
                console.warn(
                    "自动化测试：处于题组模式，但未找到子题目 (div.question-item)。"
                );
            } else {
                // console.log(
                //     `自动化测试：在题组中找到 ${groupQuestionItems.length} 个子题目。`
                // );
                for (let i = 0; i < groupQuestionItems.length; i++) {
                    const subQuestionElement = groupQuestionItems[
                        i
                    ] as HTMLElement;
                    // console.log(
                    //     `自动化测试：正在处理题组中的第 ${i + 1} / ${
                    //         groupQuestionItems.length
                    //     } 个子题目。`
                    // );
                    subQuestionElement.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                    });
                    await delay(1000);
                    // QuestionContent 组件嵌套在 div.question-item 内部
                    // .question-type-tag 将位于此 subQuestionElement 的 QuestionContent 部分

                    const questionType = await retryAction(
                        () => getQuestionType(subQuestionElement),
                        (type) => type !== null
                    );
                    if (!questionType) {
                        console.warn(
                            `自动化测试：重试后仍无法确定子题目 ${
                                i + 1
                            } 的类型。将跳过选择。`
                        );
                    } else {
                        // console.log(
                        //     `自动化测试：子题目 ${
                        //         i + 1
                        //     } 的类型确定为: ${questionType}`
                        // );
                        // 传递 subQuestionElement，因为它包含此特定子题目的选项
                        await selectDeterministicOptions(
                            subQuestionElement,
                            questionType,
                            answerCounters
                        );
                    }
                    await delay(500);
                }
            }
        } else {
            // console.log("自动化测试：检测到单题模式 (或非题组结构)。");
            const questionType = await retryAction(
                () => getQuestionType(mainQuestionArea as HTMLElement),
                (type) => type !== null
            );
            if (!questionType) {
                console.warn(
                    `自动化测试：重试后仍无法确定单题 ${mainQuestionLoopIndex} 的类型。将跳过选择。`
                );
            } else {
                console.log(
                    `自动化测试：单题 ${mainQuestionLoopIndex} 的类型确定为: ${questionType}`
                );
                // 在单题模式下，mainQuestionArea 本身 (或其子组件 QuestionContent) 是上下文
                // .question-type-tag 应位于 mainQuestionArea 内部，由 QuestionContent 渲染
                await selectDeterministicOptions(
                    mainQuestionArea as HTMLElement,
                    questionType,
                    answerCounters
                );
            }
        }

        await delay(700);
        // "下一题"按钮位于 QuestionDetail.vue 的页脚
        // 根据 QuestionDetail.vue, 下一题按钮有 label "下一题" 和 icon "pi pi-arrow-right"
        const nextQuestionButton = await retryAction(
            () => document.querySelector(
                ".question-footer button[aria-label='下一题']"
            ) as HTMLButtonElement | null,
            (button) => button !== null && button.offsetParent !== null && !button.disabled,
            { maxRetries: 5, delayMs: 1000 }
        );
        // 可以添加对 icon 的检查以增加特异性: ".question-footer button[label='下一题'][icon='pi pi-arrow-right']"

        if (nextQuestionButton) {
            console.log(
                `自动化测试：点击主题目/题组 ${mainQuestionLoopIndex} 后的"下一题"按钮。`
            );
            nextQuestionButton.click();
            await delay(1000);

            // 增加重试逻辑来等待对话框出现
            const endDialogMessageElementButton = await retryAction(
                () => document.querySelector(
                    ".p-dialog-content button[aria-label='确定']"
                ) as HTMLButtonElement | null,
                (button) => button !== null && !button.disabled,
                { maxRetries: 3, delayMs: 500 }
            );

            if (endDialogMessageElementButton) {
                console.log(
                    "自动化测试：检测到'已经是最后一题'提示框，点击确定并准备交卷。"
                );
                endDialogMessageElementButton.click();
                await delay(500);
                break;
            }
            mainQuestionLoopIndex++;
            await delay(2000); // 等待下一个题目/题组加载
        } else {
            console.log(
                `自动化测试：主题目/题组 ${mainQuestionLoopIndex} 后未找到"下一题"按钮或按钮不可交互。假设考试结束。`
            );
            break;
        }
    }

    // console.log("自动化测试：题目循环完成。正在尝试提交考试。");
    const submitExamButton = (await waitForElement(
        "button[aria-label*='Submit'], button[aria-label*='交卷']",
        10000 // 增加等待时间
    )) as HTMLButtonElement | null;

    if (!submitExamButton) {
        console.warn("自动化测试：未能找到最终的提交考试按钮。");
        return false;
    }

    submitExamButton.scrollIntoView({ behavior: "smooth", block: "center" });
    await delay(400);
    submitExamButton.click();
    console.log("自动化测试：已点击最终的提交考试按钮。");

    await delay(1000);

    // 增加重试逻辑来等待确认对话框
    const confirmSubmitButton = await retryAction(
        () => document.querySelector(
            "button[aria-label='确定交卷']"
        ) as HTMLButtonElement | null,
        (button) => button !== null && !button.disabled,
        { maxRetries: 5, delayMs: 1000 }
    );

    if (confirmSubmitButton) {
        // console.log("自动化测试：检测到确认提交试卷对话框，点击确定交卷。");
        confirmSubmitButton.click();
        await delay(500);
    } else {
        console.warn("自动化测试：确认提交试卷对话框中的确定按钮未找到。");
    }

    // 增加重试逻辑来等待退出对话框
    const readyToExitExamButton = await retryAction(
        () => document.querySelector(
            "button[aria-label='确定']"
        ) as HTMLButtonElement | null,
        (button) => button !== null && !button.disabled,
        { maxRetries: 5, delayMs: 1000 }
    );

    if (readyToExitExamButton) {
        // console.log("自动化测试：检测到提示退出对话框，点击确定。");
        readyToExitExamButton.click();
        await delay(500);
    } else {
        console.warn("自动化测试：提示退出对话框中的确定按钮未找到。");
    }

    // 确定后，会自动开始跳转。
    console.log("自动化测试：等待考试提交后导航，带重试...");
    const navigatedAfterSubmit = await navigateToWithRetry(
        router,
        () => { /* 导航由之前的按钮点击触发 */ },
        (path) => !path.includes(`/exam/${examId}`), // 条件：路径不再包含当前考试ID
        {
            timeoutPerAttempt: 25000, // 增加超时时间
            maxRetries: 3,            // 最多重试3次
            delayBetweenRetriesMs: 2000 // 增加重试间隔
        }
    );

    if (navigatedAfterSubmit) {
        // console.log(
        //     `自动化测试：考试提交成功。已导航到: ${router.currentRoute.value.path}`
        // );
        return true;
    } else {
        console.warn("自动化测试：考试提交可能失败或提交后导航超时。");
        if (router.currentRoute.value.path.includes(`/exam/${examId}`)) {
            console.warn(
                "自动化测试：当前仍在考试页面。提交可能失败或需要未处理的进一步交互。"
            );
        }
        return false;
    }
}
