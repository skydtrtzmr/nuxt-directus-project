// automation/scenarios/completeExam.ts
import type { Router } from "vue-router";
import {
    delay,
    waitForElement,
    waitForNavigation,
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
                // 当前不定项选择题的策略与多选题相同
                return "q_mc_flexible"; // 或者如果选择逻辑完全相同，可以映射到 "q_mc_multi" 以简化处理
            default:
                console.warn(`自动化测试：从标签识别出未知题型: ${tagText}`);
                return null;
        }
    }
    return null;
}

// 题型识别的备选方案
function getQuestionTypeFallback(questionElement: HTMLElement): string | null {
    // 备选方案：如果没有明确的类型信息，则根据 input 类型推断
    const radioButtons = questionElement.querySelectorAll("input[type='radio']").length;
    const checkBoxes = questionElement.querySelectorAll("input[type='checkbox']").length;
    const optionItems = questionElement.querySelectorAll(".option-item").length;

    if (radioButtons > 0 && checkBoxes === 0) {
        if (optionItems === 2) {
            return "q_mc_binary"; // 可能是判断题 (QMcBinary)
        }
        return "q_mc_single"; // 可能是单选题 (QMcSingle)
    }
    if (checkBoxes > 0 && radioButtons === 0) {
         // 就选择策略而言，多选题 (QMcMulti) 和不定项选择题 (QMcFlexible) 都按 "q_mc_multi" 处理
        return "q_mc_multi"; 
    }
    return null;
}

// 获取题目类型的主要函数
function getQuestionType(questionElement: HTMLElement): string | null {
    // 优先级 1: 检查题目容器自身或其直接子元素（例如，特定题型组件的根元素）上是否有特定的 data-attribute
    // 示例: <div data-question-actual-type="q_mc_q_mc_single">...</div> (在 QMcSingle.vue 的根元素上)
    if (questionElement.dataset.questionActualType) {
        // 如果需要，这里可以进行从 directus 类型到简化类型的映射
        // 例如: if (questionElement.dataset.questionActualType === 'q_mc_q_mc_single') return 'q_mc_single';
        // 目前假设是直接映射，或者该值已经是简化类型
        return questionElement.dataset.questionActualType;
    }
    
    // 优先级 2: 如果 QuestionContent.vue 是子组件，尝试从 .question-type-tag 的文本中获取类型
    const typeFromTag = getQuestionTypeFromTag(questionElement);
    if (typeFromTag) return typeFromTag;

    // 优先级 3: 最后的备选方案，根据 input 类型和选项数量推断
    const typeFromInputs = getQuestionTypeFallback(questionElement);
    if (typeFromInputs) return typeFromInputs;

    console.warn("自动化测试：无法通过任何方法确定题目类型。");
    return null;
}

// 用于确定性选择的计数器
interface IAnswerCounters {
    q_mc_single: number;          // 单选题计数器
    trueFalse: number;       // 判断题计数器
    multiIndefinite: number; // 多选题和不定项选择题共享的计数器
}

// 根据确定性策略选择选项
async function selectDeterministicOptions(
    questionElement: HTMLElement, // 这应该是包含单个题目选项的容器
    questionType: string,
    counters: IAnswerCounters
): Promise<void> {
    // 获取选项标签的辅助函数
    const getOptionLabel = (char: string): HTMLElement | null => {
        const selector = `label.option-label[for^='option_${char.toLowerCase()}_']`;
        // 确保在特定的 questionElement 上下文内查找
        return questionElement.querySelector(selector) as HTMLElement | null;
    };

    switch (questionType) {
        case "q_mc_single": {
            const choices = ['A', 'B', 'C', 'D'];
            const targetChar = choices[counters.q_mc_single % choices.length];
            const optionLabel = getOptionLabel(targetChar);
            if (optionLabel) {
                console.log(`自动化测试：[单选题] 在题目元素中选择: ${targetChar}`, questionElement);
                optionLabel.click();
                await delay(200); 
            } else {
                console.warn(`自动化测试：[单选题] 未在以下元素中找到选项 ${targetChar}:`, questionElement);
            }
            counters.q_mc_single++;
            break;
        }
        case "q_mc_binary": {
            const choices = ['A', 'B']; 
            const targetChar = choices[counters.trueFalse % choices.length];
            const optionLabel = getOptionLabel(targetChar);
            if (optionLabel) {
                console.log(`自动化测试：[判断题] 在题目元素中选择: ${targetChar}`, questionElement);
                optionLabel.click();
                await delay(200);
            } else {
                console.warn(`自动化测试：[判断题] 未在以下元素中找到选项 ${targetChar}:`, questionElement);
            }
            counters.trueFalse++;
            break;
        }
        case "q_mc_multi": 
        case "q_mc_flexible": { 
            const patterns = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']];
            const currentPattern = patterns[counters.multiIndefinite % patterns.length];
            console.log(`自动化测试：[多选/不定项] 在题目元素中选择模式: ${currentPattern.join(', ')}`, questionElement);
            for (const char of currentPattern) {
                const optionLabel = getOptionLabel(char);
                if (optionLabel) {
                    console.log(`自动化测试：[多选/不定项] 点击选项: ${char}`);
                    optionLabel.click();
                    await delay(200); 
                } else {
                    console.warn(`自动化测试：[多选/不定项] 未在以下元素中找到选项 ${char}:`, questionElement);
                }
            }
            counters.multiIndefinite++;
            break;
        }
        default:
            console.warn(`自动化测试：确定性选择遇到未知或未处理的题型 "${questionType}"`);
    }
}

// 运行完成考试的自动化场景
export async function runCompleteExamScenario(
    router: Router,
    examId: string
): Promise<boolean> {
    console.log(
        `自动化测试：开始执行完成考试场景，考试ID "${examId}"...`
    );

    if (!router.currentRoute.value.path.includes(`/exam/${examId}`)) {
        console.warn(
            `自动化测试：当前不在正确的考试页面。期望路径包含 /exam/${examId}, 实际为 ${router.currentRoute.value.path}`
        );
        return false;
    }
    console.log("自动化测试：已确认在考试页面。");
    await delay(3000); // 等待初始页面元素加载和可能的重定向

    const answerCounters: IAnswerCounters = {
        q_mc_single: 0,
        trueFalse: 0,
        multiIndefinite: 0,
    };

    let mainQuestionLoopIndex = 1; // 主题目循环索引
    // eslint-disable-next-line no-constant-condition
    while (true) {
        console.log(`自动化测试：正在查找主题目/题组区域 ${mainQuestionLoopIndex}...`);

        // 此选择器用于定位当前题目视图的整体容器 (通常是 QuestionDetail)
        // 根据 QuestionDetail.vue, 其根元素是 div.question-detail
        // 如果 ExamPage.vue 中有更特定的包裹活动题目内容的元素，应使用那个选择器
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
        mainQuestionArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await delay(600); // 等待滚动和潜在的内容渲染

        // 通过查找 QuestionGroupContent.vue 的结构来判断是否为题组
        const groupContentElement = mainQuestionArea.querySelector(".question-group-content");

        if (groupContentElement) {
            console.log("自动化测试：检测到题组模式。");
            const groupQuestionItems = groupContentElement.querySelectorAll("div.question-item");
            if (groupQuestionItems.length === 0) {
                console.warn("自动化测试：处于题组模式，但未找到子题目 (div.question-item)。");
            } else {
                console.log(`自动化测试：在题组中找到 ${groupQuestionItems.length} 个子题目。`);
                for (let i = 0; i < groupQuestionItems.length; i++) {
                    const subQuestionElement = groupQuestionItems[i] as HTMLElement;
                    console.log(`自动化测试：正在处理题组中的第 ${i + 1} / ${groupQuestionItems.length} 个子题目。`);
                    subQuestionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    await delay(500);
                    
                    // QuestionContent 组件嵌套在 div.question-item 内部
                    // .question-type-tag 将位于此 subQuestionElement 的 QuestionContent 部分
                    const questionType = getQuestionType(subQuestionElement); 
                    if (!questionType) {
                        console.warn(
                            `自动化测试：无法确定子题目 ${i + 1} 的类型。将跳过选择。`
                        );
                    } else {
                        console.log(`自动化测试：子题目 ${i + 1} 的类型确定为: ${questionType}`);
                        // 传递 subQuestionElement，因为它包含此特定子题目的选项
                        await selectDeterministicOptions(subQuestionElement, questionType, answerCounters);
                    }
                    await delay(300); // 回答一个子题目后的延迟
                }
            }
        } else {
            console.log("自动化测试：检测到单题模式 (或非题组结构)。");
            // 在单题模式下，mainQuestionArea 本身 (或其子组件 QuestionContent) 是上下文
            // .question-type-tag 应位于 mainQuestionArea 内部，由 QuestionContent 渲染
            const questionType = getQuestionType(mainQuestionArea as HTMLElement);
            if (!questionType) {
                console.warn(
                    `自动化测试：无法确定单题 ${mainQuestionLoopIndex} 的类型。将跳过选择。`
                );
            } else {
                console.log(`自动化测试：单题 ${mainQuestionLoopIndex} 的类型确定为: ${questionType}`);
                 // 传递 mainQuestionArea，因为它包含选项
                await selectDeterministicOptions(mainQuestionArea as HTMLElement, questionType, answerCounters);
            }
        }
        
        await delay(700); // 回答题目/题组后，点击下一题前的延迟

        // “下一题”按钮位于 QuestionDetail.vue 的页脚
        // 根据 QuestionDetail.vue, 下一题按钮有 label "下一题" 和 icon "pi pi-arrow-right"
        const nextQuestionButton = document.querySelector(
            ".question-footer button[label='下一题']" 
        ) as HTMLButtonElement | null;
        // 可以添加对 icon 的检查以增加特异性: ".question-footer button[label='下一题'][icon='pi pi-arrow-right']"

        if (nextQuestionButton && nextQuestionButton.offsetParent !== null && !nextQuestionButton.disabled) {
            console.log(
                `自动化测试：点击主题目/题组 ${mainQuestionLoopIndex} 后的“下一题”按钮。`
            );
            nextQuestionButton.click();
            mainQuestionLoopIndex++;
            await delay(3000); // 等待下一个题目/题组加载
        } else {
            console.log(
                `自动化测试：主题目/题组 ${mainQuestionLoopIndex} 后未找到“下一题”按钮或按钮不可交互。假设考试结束。`
            );
            break; 
        }
    }

    console.log(
        "自动化测试：题目循环完成。正在尝试提交考试。"
    );
    // 提交按钮可能在 QuestionDetail 之外，位于主 ExamPage 布局中 (例如，右上角)
    const submitExamButton = await waitForElement(
        "button[aria-label*='Submit Exam'], button[aria-label*='交卷']", // 基于通用模式的更通用的选择器
        7000
    ) as HTMLButtonElement | null; 

    if (!submitExamButton) {
        console.warn(
            "自动化测试：未能找到最终的“提交考试”按钮。"
        );
        // 如果特定标签选择器失败，可以尝试更通用的右上角操作按钮选择器（非常规，需匹配实际DOM）
        // const genericSubmit = await waitForElement(".exam-actions .submit-button", 3000) as HTMLButtonElement | null;
        // if (!genericSubmit) {
        //    console.error("自动化测试：确定未找到最终的“提交考试”按钮。");
        //    return false;
        // }
        // submitExamButton = genericSubmit; // 此行会因 submitExamButton 是 const 而导致错误
        // TODO: 如果上述选择器持续失败，需重新评估提交按钮策略
        return false; // 当前，如果特定选择器无效，则失败
    }
    
    submitExamButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(400);
    submitExamButton.click(); 
    console.log("自动化测试：已点击最终的“提交考试”按钮。");

    const navigatedAfterSubmit = await waitForNavigation(
        router,
        (path) => !path.includes(`/exam/${examId}`), // 导航离开考试页面
        20000 
    );

    if (navigatedAfterSubmit) {
        console.log(
            `自动化测试：考试提交成功。已导航到: ${router.currentRoute.value.path}`
        );
        return true;
    } else {
        console.warn(
            "自动化测试：考试提交可能失败或提交后导航超时。"
        );
        if (router.currentRoute.value.path.includes(`/exam/${examId}`)) {
            console.warn("自动化测试：当前仍在考试页面。提交可能失败或需要未处理的进一步交互。");
        }
        return false;
    }
} 