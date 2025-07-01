import { ref, type Ref, watchEffect } from "vue";
import type {
    PracticeSessions,
    Papers,
    PaperSections,
    Questions,
    QuestionResults,
    PaperSectionsQuestions,
    PaperSectionsQuestionGroups,
    QuestionGroups,
} from "~~/types/directus_types";
import { useRuntimeConfig } from "#imports"; // Nuxt auto-imports
import dayjs from "dayjs"; // 确保 dayjs 已导入

export function useExamData() {
    const config = useRuntimeConfig();
    // 注意，这个一定要写在函数内部。
    // 这样，useRuntimeConfig() 只有在 useExamData 这个组合式函数被实际调用时（例如，在 ExamPage.vue 的 setup 函数中）才会执行，此时 Nuxt 的上下文是可用的。
    // 否则，如果写在外面，这行代码在 useExamData.ts 模块被导入和首次评估时就会执行。在页面刷新（特别是首次加载或 SSR 期间）的某些阶段，这个执行时机可能早于 Nuxt 应用实例完全准备好并提供给 useRuntimeConfig() 所需的上下文。于是变回导致报错：
    // 500 [nuxt] A composable that requires access to the Nuxt instance was called outside of a plugin, Nuxt hook, Nuxt middleware, or Vue setup function.
    const isLoading = ref(true); // 新增：用于跟踪加载状态
    const loadError = ref<string | null>(null); // 新增：用于跟踪和显示加载错误
    const practiceSession = ref<any>({} as any);
    const paper = ref<Papers>({} as Papers);
    const submittedPaperSections = ref<PaperSections[]>([]);
    const initialSelectedQuestion = ref<any>(null); // Stores the initially selected question or group
    const questionResults = ref<QuestionResults[]>([]);
    const examScore = ref<number | null>(null);
    const practiceSessionTime = ref<any>({} as any);

    // This will be returned to ExamPage to trigger side effects
    const timerInitParams = ref<{
        actualStartISO: string;
        durationMins: number;
        extraMins: number;
    } | null>(null);
    const shouldShowFinalSubmissionDialog = ref(false);

    const fetchQuestionResults = async (practice_session_id: string) => {
        const questionResultsData = await $fetch(
            `${config.public.directus.url}/fetch-practice-session-cache-endpoint/practice_session/${practice_session_id}/qresults`
        );
        // 类型断言为 any[] 以便修改
        const processedQuestionResults = (questionResultsData as any[]).map(
            (qr) => {
                if (
                    qr.submit_ans_select_multiple_checkbox &&
                    typeof qr.submit_ans_select_multiple_checkbox === "string"
                ) {
                    try {
                        qr.submit_ans_select_multiple_checkbox = JSON.parse(
                            qr.submit_ans_select_multiple_checkbox
                        );
                    } catch (error) {
                        // 如果解析失败，可以根据需求设置为 null, [], 或者保留原样并记录错误
                        console.warn(
                            `Failed to parse submit_ans_select_multiple_checkbox for question result id: ${qr.id}`,
                            error
                        );
                        // 为保持与原类型一致，这里将其设置为空数组，如果原始字符串无效
                        qr.submit_ans_select_multiple_checkbox = [];
                    }
                } else if (qr.submit_ans_select_multiple_checkbox === "") {
                    // 如果是空字符串，也转换为空数组，以保持类型一致性
                    qr.submit_ans_select_multiple_checkbox = [];
                }
                return qr;
            }
        );
        questionResults.value = processedQuestionResults as QuestionResults[];
    };

    const fetchSubmittedSectionsList = async (
        sections: PaperSections[],
        current_selected_question_ref: Ref<any>
    ) => {
        // [PERF_OPTIMIZATION_SUGGESTION] 后端优化建议
        // 下方的循环和数据处理逻辑是为了将题目（questions）与其所属的题组（question_groups）进行关联。
        // 这个操作在客户端执行，特别是对于题目数量多、题组复杂的试卷，会消耗大量的计算资源，阻塞UI渲染，导致页面加载变慢。
        // 理想情况下，这部分数据关联逻辑应该在后端完成。
        // API应该直接返回已经处理好的数据结构，即每个 section 的 question_groups 数组中，每个 group 对象都直接包含它下面的题目列表（group_question_ids）。
        // 这样可以极大地减轻客户端的负担，加快页面渲染速度。

        const sectionList = sections;

        // 开始：为 section.question_groups 添加 group_question_ids
        sectionList.forEach((section) => {
            // 只处理题组模式的section，并且确保相关数组存在
            if (
                section.question_mode === "group" &&
                Array.isArray(section.question_groups) &&
                Array.isArray(section.questions)
            ) {
                // 构建一个映射：question_group_id -> PaperSectionsQuestions.id[]
                const groupToQuestionIdsMap = new Map<string, string[]>();
                // 注意，paper_sections_questions的id类型为int。
                section.questions.forEach((psq) => {
                    // psq 是 PaperSectionsQuestions 类型的题目项
                    if (psq.questions_id && psq.questions_id.question_group) {
                        let questionGroupId: string | undefined;
                        // 获取题目所属题组的ID
                        if (
                            typeof psq.questions_id.question_group === "string"
                        ) {
                            questionGroupId = psq.questions_id.question_group;
                        } else if (
                            psq.questions_id.question_group &&
                            typeof psq.questions_id.question_group.id ===
                                "string"
                        ) {
                            questionGroupId =
                                psq.questions_id.question_group.id;
                        }

                        if (questionGroupId && typeof psq.id === "number") {
                            if (!groupToQuestionIdsMap.has(questionGroupId)) {
                                groupToQuestionIdsMap.set(questionGroupId, []);
                            }
                            groupToQuestionIdsMap
                                .get(questionGroupId)!
                                .push(psq.id);
                        }
                    }
                });

                // 为 section.question_groups 中的每个题组对象添加 group_question_ids 字段
                section.question_groups.forEach((psqg) => {
                    // psqg 是 PaperSectionsQuestionGroups 类型的题组项
                    let actualQuestionGroupId: string | undefined;
                    // 获取当前题组定义的ID
                    if (psqg.question_groups_id) {
                        if (typeof psqg.question_groups_id === "string") {
                            actualQuestionGroupId = psqg.question_groups_id;
                        } else if (
                            psqg.question_groups_id &&
                            typeof psqg.question_groups_id.id === "string"
                        ) {
                            actualQuestionGroupId = psqg.question_groups_id.id;
                        }
                    }

                    if (actualQuestionGroupId) {
                        // 将计算得到的题目ID列表赋值给 group_question_ids
                        // 使用 'as any' 是因为我们动态地向现有类型添加属性
                        (psqg as any).group_question_ids =
                            groupToQuestionIdsMap.get(actualQuestionGroupId) ||
                            [];
                    } else {
                        // 如果题组没有有效ID，则关联一个空列表
                        (psqg as any).group_question_ids = [];
                    }
                });
            }
        });
        // 结束：为 section.question_groups 添加 group_question_ids

        submittedPaperSections.value = sectionList;

        // 接下来，根据sectionList中的question_mode，来确定初始化哪个问题
        if (sectionList.length > 0) {
            if (
                sectionList[0].question_mode === "group" &&
                sectionList[0].question_groups &&
                sectionList[0].question_groups.length > 0
            ) {
                const firstGroup = sectionList[0].question_groups[0];
                const groupQuestionIds = firstGroup.group_question_ids || [];
                const groupQuestions = sectionList[0].questions.filter((q) =>
                    groupQuestionIds.includes(q.id)
                );
                const sortedGroupQuestions = [...groupQuestions].sort(
                    (a, b) => {
                        const aSort = a.questions_id?.sort_in_group ?? 999;
                        const bSort = b.questions_id?.sort_in_group ?? 999;
                        if (aSort === bSort)
                            return (
                                (a.sort_in_section || 0) -
                                (b.sort_in_section || 0)
                            );
                        return aSort - bSort;
                    }
                );
                current_selected_question_ref.value = {
                    ...firstGroup,
                    isGroupMode: true,
                    questionGroup: firstGroup.question_groups_id,
                    questions_id: { type: "group" },
                    section_id: sectionList[0].id,
                    paper_sections_id: sectionList[0].id,
                    sort_in_section: firstGroup.sort_in_section,
                    groupQuestions: sortedGroupQuestions,
                };
            } else if (
                // 如果不是group模式，则直接取第一个问题
                sectionList[0].questions &&
                sectionList[0].questions.length > 0
            ) {
                current_selected_question_ref.value =
                    sectionList[0].questions[0];
            }
        }
    };

    // 在这一步获取了试卷的全部静态数据（题干、选项等）
    const fetchSubmittedPaper = async (
        paperId: string,
        current_practice_session_id: string,
        current_selected_question_ref: Ref<any>
    ) => {
        // [PERF_OPTIMIZATION] 通过Promise.all并行执行不相关的异步任务
        // fetch-paper-cache-endpoint 和 fetchQuestionResults 之间没有依赖关系，可以并行处理
        const [paperFullData] = await Promise.all([
            $fetch<Papers>(
                // `/api/papers/full/${paperId}`
                `${config.public.directus.url}/fetch-paper-cache-endpoint/papers/${paperId}`
            ),
            fetchQuestionResults(current_practice_session_id),
        ]);

        // 从 await Promise.all(...) 返回的结果数组中，取出第一个元素，并将其赋值给一个名为 paperFullData 的新常量。"
        // 数组中的第二个元素（也就是 fetchQuestionResults 的返回值）虽然也被返回了，但在这次赋值中被忽略了。如果您想同时获取第二个结果，可以这样写：const [paperFullData, questionResultsData] = await Promise.all([...]);
        const paperResponse: Papers = {
            id: paperFullData.id,
            status: paperFullData.status,
            title: paperFullData.title,
            total_point_value: paperFullData.total_point_value,
            total_question_count: paperFullData.total_question_count,
            paper_sections: paperFullData.paper_sections,
            "triggers-do4gvh": "",
            save_and_stay: "",
        };

        if (paperResponse) {
            paper.value = paperResponse;
            await fetchSubmittedSectionsList(
                paperResponse.paper_sections as PaperSections[],
                current_selected_question_ref
            );
            // [PERF_OPTIMIZATION] fetchQuestionResults 已经通过 Promise.all 并行执行
            // await fetchQuestionResults(current_practice_session_id);
        }
    };

    const afterFetchSubmittedExamContent = async (
        current_practice_session_id: string,
        current_selected_question_ref: Ref<any>
    ) => {
        const paperId =
            practiceSession.value["exercises_students_id__exercises_id__paper"];
        await fetchSubmittedPaper(
            paperId,
            current_practice_session_id,
            current_selected_question_ref
        );
    };

    const loadExamData = async (
        current_practice_session_id: string,
        exam_page_mode: string,
        current_selected_question_ref: Ref<any>
    ) => {
        isLoading.value = true;
        loadError.value = null;
        const maxRetries = 8;
        let attempt = 0;

        const delay = (ms: number) =>
            new Promise((resolve) => setTimeout(resolve, ms));

        while (attempt < maxRetries) {
            try {
                // 首先，总是获取最新的会话信息
                let sessionData: any = await $fetch(
                    `${config.public.directus.url}/fetch-practice-session-info-endpoint/${current_practice_session_id}`
                );

                // 如果是首次进入（状态为 'todo'），则更新状态
                if (
                    exam_page_mode !== "review" &&
                    sessionData.submit_status === "todo"
                ) {
                    console.log(
                        "首次进入考试，正在更新状态为 'doing' 并记录开始时间..."
                    );
                    const itemToUpdate = {
                        actual_start_time: dayjs().toISOString(),
                        submit_status: "doing" as const,
                    };

                    await $fetch(
                        `${config.public.directus.url}/update-practice-session-info-endpoint/${current_practice_session_id}`,
                        {
                            method: "PATCH",
                            body: itemToUpdate,
                        }
                    );

                    // 不要用PATCH的返回消息覆盖，而是将更新的字段合并到现有的sessionData中
                    Object.assign(sessionData, itemToUpdate);
                    console.log("状态更新成功，sessionData已合并。");
                }

                // --- 后续逻辑使用已经确定状态的 sessionData ---

                practiceSession.value = sessionData;
                practiceSessionTime.value = sessionData; // 保持兼容
                examScore.value = Number(sessionData.score) || null;

                if (
                    sessionData.submit_status === "done" &&
                    exam_page_mode !== "review"
                ) {
                    shouldShowFinalSubmissionDialog.value = true;
                    isLoading.value = false; // 同样需要设置
                    return; // 提前退出，因为已交卷
                }

                // 获取试卷内容和答题卡
                await afterFetchSubmittedExamContent(
                    current_practice_session_id,
                    current_selected_question_ref
                );

                // 设置计时器参数
                const actualStartISO = practiceSession.value.actual_start_time;
                if (actualStartISO) {
                    timerInitParams.value = {
                        actualStartISO,
                        durationMins:
                            practiceSession.value[
                                "exercises_students_id__exercises_id__duration"
                            ],
                        extraMins: practiceSession.value.extra_time,
                    };
                } else {
                    console.error(
                        "useExamData: 无法初始化计时器 - actual_start_time 缺失。"
                    );
                }
                isLoading.value = false; // 成功加载后
                return; // 成功，退出函数
            } catch (error) {
                attempt++;
                console.error(
                    `useExamData: 加载考试数据第 ${attempt} 次尝试失败:`,
                    error
                );
                if (attempt >= maxRetries) {
                    loadError.value = "加载考试数据失败，请检查网络后重试。";
                    break; // 退出循环
                }
                const delayTime = Math.pow(2, attempt - 1) * 1000;
                console.log(
                    `将在 ${delayTime / 1000}s 后重试...`
                );
                await delay(delayTime);
            }
        }
        isLoading.value = false; // 所有重试失败后
    };

    return {
        practiceSession, // session信息（包括时间，有点重复了，后期优化） TODO
        // 目前practiceSession已经不是标准结构了，被我扁平化了[2025-06-03]
        paper, // 试卷信息
        submittedPaperSections, // 最终试题信息
        // selectedQuestion is managed by ExamPage.vue, but its initial value is set here via ref
        questionResults, // 答题结果
        examScore, // 考试得分（仅review模式显示）
        practiceSessionTime, // 时间信息
        loadExamData,
        timerInitParams, // Expose for ExamPage to use
        shouldShowFinalSubmissionDialog, // Expose for ExamPage to use
        isLoading, // 导出加载状态
        loadError, // 导出加载错误状态
    };
}
