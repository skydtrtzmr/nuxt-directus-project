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
import { useDirectusItems, useRuntimeConfig } from "#imports"; // Nuxt auto-imports

export function useExamData() {
    const config = useRuntimeConfig();
    // 注意，这个一定要写在函数内部。
    // 这样，useRuntimeConfig() 只有在 useExamData 这个组合式函数被实际调用时（例如，在 ExamPage.vue 的 setup 函数中）才会执行，此时 Nuxt 的上下文是可用的。
    // 否则，如果写在外面，这行代码在 useExamData.ts 模块被导入和首次评估时就会执行。在页面刷新（特别是首次加载或 SSR 期间）的某些阶段，这个执行时机可能早于 Nuxt 应用实例完全准备好并提供给 useRuntimeConfig() 所需的上下文。于是变回导致报错：
    // 500 [nuxt] A composable that requires access to the Nuxt instance was called outside of a plugin, Nuxt hook, Nuxt middleware, or Vue setup function.

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
        const paperFullData: Papers = await $fetch(
            // `/api/papers/full/${paperId}`
            `${config.public.directus.url}/fetch-paper-cache-endpoint/papers/${paperId}`
        );

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
            await fetchQuestionResults(current_practice_session_id);
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
        try {
            const practiceSessionFields = [
                "id",
                "exercises_students_id.exercises_id.paper",
                "exercises_students_id.students_id.name",
                "exercises_students_id.students_id.number",
                "exercises_students_id.students_id.email",
                "exercises_students_id.students_id.class.name",
                "exercises_students_id.exercises_id.title",
                "exercises_students_id.exercises_id.duration",
                "score",
                "actual_start_time",
                "actual_end_time",
                "extra_time",
                "expected_end_time",
                "submit_status",
            ];
            // 将每个字段中的 "." 替换为 "__", 然后用 "," 连接
            const fieldsQueryString = practiceSessionFields
                .map((field) => field.replace(/\./g, "__"))
                .join(",");

            const practiceSessionResponse: any = await $fetch(
                `${config.public.directus.url}/fetch-practice-session-info-endpoint/${current_practice_session_id}?fields=${fieldsQueryString}`
            );

            if (practiceSessionResponse) {
                practiceSession.value = practiceSessionResponse;
                practiceSessionTime.value = practiceSessionResponse;
                examScore.value = Number(practiceSessionResponse.score) || null;

                if (
                    practiceSession.value.submit_status === "done" &&
                    exam_page_mode !== "review"
                ) {
                    shouldShowFinalSubmissionDialog.value = true;
                    // No need to call loadingStateStore here, ExamPage will handle it.
                    return; // Exit early if already submitted and not in review mode
                }

                await afterFetchSubmittedExamContent(
                    current_practice_session_id,
                    current_selected_question_ref
                );

                const actualStartISO =
                    practiceSessionTime.value.actual_start_time;
                let durationMins =
                    practiceSessionTime.value[
                        "exercises_students_id__exercises_id__duration"
                    ];
                let extraMins = practiceSessionTime.value.extra_time;

                if (actualStartISO) {
                    timerInitParams.value = {
                        actualStartISO,
                        durationMins,
                        extraMins,
                    };
                } else {
                    console.error(
                        "useExamData: Timer init params incomplete - actual_start_time missing.",
                        "actualStartISO was:",
                        actualStartISO
                    );
                }
            } else {
                console.error("useExamData: Failed to fetch practice session.");
            }
        } catch (error) {
            console.error("useExamData: Error in loadExamData:", error);
        }
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
    };
}
