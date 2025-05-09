// automation/scenarios/completeExam.ts
import type { Router } from "vue-router";
import {
    delay,
    waitForElement,
    waitForNavigation,
} from "../utils/domHelpers";

function getQuestionTypeFromTag(questionElement: HTMLElement): string | null {
    const tagElement = questionElement.querySelector(".question-type-tag");
    if (tagElement && tagElement.textContent) {
        const tagText = tagElement.textContent.trim();
        switch (tagText) {
            case "单选题":
                return "single";
            case "多选题":
                return "multiple";
            case "判断题":
                return "true-false";
            case "不定项选择题":
                 // Current strategy for indefinite is same as multiple
                return "indefinite"; // Or map to "multiple" if selection logic is identical and simpler
            default:
                console.warn(`Automation: Unknown question type from tag: ${tagText}`);
                return null;
        }
    }
    return null;
}

function getQuestionTypeFallback(questionElement: HTMLElement): string | null {
    // Fallback: Infer from input types if no explicit type found
    const radioButtons = questionElement.querySelectorAll("input[type='radio']").length;
    const checkBoxes = questionElement.querySelectorAll("input[type='checkbox']").length;
    const optionItems = questionElement.querySelectorAll(".option-item").length;

    if (radioButtons > 0 && checkBoxes === 0) {
        if (optionItems === 2) {
            return "true-false"; // Likely QMcBinary
        }
        return "single"; // Likely QMcSingle
    }
    if (checkBoxes > 0 && radioButtons === 0) {
         // For the purpose of selection strategy, QMcMulti and QMcFlexible are treated as "multiple"
        return "multiple"; 
    }
    return null;
}

function getQuestionType(questionElement: HTMLElement): string | null {
    // Priority 1: Check for a specific data-attribute on the question container itself or its direct child (e.g., the specific question type component root)
    // Example: <div data-question-actual-type="q_mc_single">...</div> in QMcSingle.vue root
    if (questionElement.dataset.questionActualType) {
        // Map from directus type to simplified type if necessary
        // e.g., if (questionElement.dataset.questionActualType === 'q_mc_single') return 'single';
        // For now, assuming a direct mapping or that the value is already simplified
        return questionElement.dataset.questionActualType;
    }
    
    // Priority 2: Try to get type from the .question-type-tag text, if QuestionContent.vue is a child
    const typeFromTag = getQuestionTypeFromTag(questionElement);
    if (typeFromTag) return typeFromTag;

    // Priority 3: Fallback to inferring from input types and option counts
    const typeFromInputs = getQuestionTypeFallback(questionElement);
    if (typeFromInputs) return typeFromInputs;

    console.warn("Automation: Could not determine question type from any method.");
    return null;
}

// Counters for deterministic selection
interface IAnswerCounters {
    single: number;
    trueFalse: number;
    multiIndefinite: number; // Shared counter for multiple and indefinite
}

async function selectDeterministicOptions(
    questionElement: HTMLElement, // This should be the container for a single question's options
    questionType: string,
    counters: IAnswerCounters
): Promise<void> {
    const getOptionLabel = (char: string): HTMLElement | null => {
        const selector = `label.option-label[for^='option_${char.toLowerCase()}_']`;
        // Ensure search is within the specific questionElement context
        return questionElement.querySelector(selector) as HTMLElement | null;
    };

    switch (questionType) {
        case "single": {
            const choices = ['A', 'B', 'C', 'D'];
            const targetChar = choices[counters.single % choices.length];
            const optionLabel = getOptionLabel(targetChar);
            if (optionLabel) {
                console.log(`Automation: [Single] Selecting: ${targetChar} in question element:`, questionElement);
                optionLabel.click();
                await delay(200); 
            } else {
                console.warn(`Automation: [Single] Could not find option ${targetChar} in:`, questionElement);
            }
            counters.single++;
            break;
        }
        case "true-false": {
            const choices = ['A', 'B']; 
            const targetChar = choices[counters.trueFalse % choices.length];
            const optionLabel = getOptionLabel(targetChar);
            if (optionLabel) {
                console.log(`Automation: [True/False] Selecting: ${targetChar} in:`, questionElement);
                optionLabel.click();
                await delay(200);
            } else {
                console.warn(`Automation: [True/False] Could not find option ${targetChar} in:`, questionElement);
            }
            counters.trueFalse++;
            break;
        }
        case "multiple": 
        case "indefinite": { 
            const patterns = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']];
            const currentPattern = patterns[counters.multiIndefinite % patterns.length];
            console.log(`Automation: [Multi/Indefinite] Selecting pattern: ${currentPattern.join(', ')} in:`, questionElement);
            for (const char of currentPattern) {
                const optionLabel = getOptionLabel(char);
                if (optionLabel) {
                    console.log(`Automation: [Multi/Indefinite] Clicking option: ${char}`);
                    optionLabel.click();
                    await delay(200); 
                } else {
                    console.warn(`Automation: [Multi/Indefinite] Could not find option ${char} in:`, questionElement);
                }
            }
            counters.multiIndefinite++;
            break;
        }
        default:
            console.warn(`Automation: Unknown or unhandled question type "${questionType}" for deterministic selection.`);
    }
}

export async function runCompleteExamScenario(
    router: Router,
    examId: string
): Promise<boolean> {
    console.log(
        `Automation: Starting Complete Exam Scenario for exam ID "${examId}"...`
    );

    if (!router.currentRoute.value.path.includes(`/exam/${examId}`)) {
        console.warn(
            `Automation: Not on the correct exam page. Expected /exam/${examId}, got ${router.currentRoute.value.path}`
        );
        return false;
    }
    console.log("Automation: Confirmed on exam page.");
    await delay(3000); // Wait for initial page elements and potential redirects

    const answerCounters: IAnswerCounters = {
        single: 0,
        trueFalse: 0,
        multiIndefinite: 0,
    };

    let mainQuestionLoopIndex = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        console.log(`Automation: Looking for main question/group area ${mainQuestionLoopIndex}...`);

        // This selector targets the overall container for the current question view (likely QuestionDetail)
        // Based on QuestionDetail.vue, the root is div.question-detail
        // Or, if there's a more specific wrapper for active question content within ExamPage.vue, use that.
        const mainQuestionArea = await waitForElement(
            "div.question-detail", // Targets the root of QuestionDetail.vue
            12000 
        );

        if (!mainQuestionArea) {
            console.log(
                `Automation: Could not find main question area ${mainQuestionLoopIndex}. Assuming end of questions or an issue.`
            );
            break; 
        }
        console.log(`Automation: Found main question area ${mainQuestionLoopIndex}.`);
        mainQuestionArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await delay(600); // Wait for scroll and potential content rendering

        // Check if it's a group question by looking for QuestionGroupContent.vue's structure
        const groupContentElement = mainQuestionArea.querySelector(".question-group-content");

        if (groupContentElement) {
            console.log("Automation: Detected Question Group Mode.");
            const groupQuestionItems = groupContentElement.querySelectorAll("div.question-item");
            if (groupQuestionItems.length === 0) {
                console.warn("Automation: In group mode, but no sub-questions (div.question-item) found.");
            } else {
                console.log(`Automation: Found ${groupQuestionItems.length} sub-questions in the group.`);
                for (let i = 0; i < groupQuestionItems.length; i++) {
                    const subQuestionElement = groupQuestionItems[i] as HTMLElement;
                    console.log(`Automation: Processing sub-question ${i + 1} of ${groupQuestionItems.length}.`);
                    subQuestionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    await delay(500);
                    
                    // The QuestionContent component is nested inside div.question-item
                    // The .question-type-tag will be inside the QuestionContent part of this subQuestionElement
                    const questionType = getQuestionType(subQuestionElement); 
                    if (!questionType) {
                        console.warn(
                            `Automation: Could not determine type for sub-question ${i + 1}. Skipping selection.`
                        );
                    } else {
                        console.log(`Automation: Sub-question ${i + 1} type determined as: ${questionType}`);
                        // Pass subQuestionElement as it contains the options for this specific sub-question
                        await selectDeterministicOptions(subQuestionElement, questionType, answerCounters);
                    }
                    await delay(300); // Delay after answering a sub-question
                }
            }
        } else {
            console.log("Automation: Detected Single Question Mode (or non-group structure).");
            // In single question mode, mainQuestionArea itself (or a child QuestionContent) is the context
            // The .question-type-tag should be within mainQuestionArea, rendered by QuestionContent
            const questionType = getQuestionType(mainQuestionArea as HTMLElement);
            if (!questionType) {
                console.warn(
                    `Automation: Could not determine type for single question ${mainQuestionLoopIndex}. Skipping selection.`
                );
            } else {
                console.log(`Automation: Single question ${mainQuestionLoopIndex} type determined as: ${questionType}`);
                 // Pass mainQuestionArea as it contains the options
                await selectDeterministicOptions(mainQuestionArea as HTMLElement, questionType, answerCounters);
            }
        }
        
        await delay(700); // Delay after answering question/group before clicking next

        // "Next Question" button is in QuestionDetail.vue footer
        const nextQuestionButton = document.querySelector(
            ".question-footer button[icon='pi pi-arrow-right']" // More specific selector for next button
        ) as HTMLButtonElement | null;

        if (nextQuestionButton && nextQuestionButton.offsetParent !== null && !nextQuestionButton.disabled) {
            console.log(
                `Automation: Clicking "Next Question" button after main question/group ${mainQuestionLoopIndex}.`
            );
            nextQuestionButton.click();
            mainQuestionLoopIndex++;
            await delay(3000); // Wait for next question/group to load
        } else {
            console.log(
                `Automation: "Next Question" button not found or not interactable after main question/group ${mainQuestionLoopIndex}. Assuming end of exam.`
            );
            break; 
        }
    }

    console.log(
        "Automation: Question loop finished. Attempting to submit exam."
    );
    // Submit button is likely outside QuestionDetail, in the main ExamPage layout (e.g., top-right corner)
    const submitExamButton = await waitForElement(
        "button[aria-label*='Submit Exam'], button[aria-label*='交卷']", // More generic based on common patterns
        7000
    ) as HTMLButtonElement | null; 

    if (!submitExamButton) {
        console.warn(
            "Automation: Could not find the final 'Submit Exam' button. Trying a more generic selector for top-right actions."
        );
        // Fallback for a generic top-right submit button if specific labels fail
        // This is highly speculative and needs to match actual DOM
        // const genericSubmit = await waitForElement(".exam-actions .submit-button", 3000) as HTMLButtonElement | null;
        // if (!genericSubmit) {
        //    console.error("Automation: Final 'Submit Exam' button DEFINITELY not found.");
        //    return false;
        // }
        // submitExamButton = genericSubmit; // This line would cause error as submitExamButton is const
        // TODO: Re-evaluate submit button strategy if above fails consistently
        return false; // For now, fail if specific selectors don't work
    }
    
    submitExamButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(400);
    submitExamButton.click(); 
    console.log("Automation: Clicked final 'Submit Exam' button.");

    const navigatedAfterSubmit = await waitForNavigation(
        router,
        (path) => !path.includes(`/exam/${examId}`), 
        20000 
    );

    if (navigatedAfterSubmit) {
        console.log(
            `Automation: Exam submitted successfully. Navigated to: ${router.currentRoute.value.path}`
        );
        return true;
    } else {
        console.warn(
            "Automation: Exam submission may have failed or navigation timed out post-submit."
        );
        if (router.currentRoute.value.path.includes(`/exam/${examId}`)) {
            console.warn("Automation: Still on the exam page. Submission might have failed or requires further interaction.");
        }
        return false;
    }
} 