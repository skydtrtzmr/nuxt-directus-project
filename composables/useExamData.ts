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
import { useDirectusItems } from "#imports"; // Nuxt auto-imports

export function useExamData() {
    const { getItemById, getItems } = useDirectusItems();

    const practiceSession = ref<PracticeSessions>({} as PracticeSessions);
    const paper = ref<Papers>({} as Papers);
    const submittedPaperSections = ref<PaperSections[]>([]);
    const initialSelectedQuestion = ref<any>(null); // Stores the initially selected question or group
    const questionResults = ref<QuestionResults[]>([]);
    const examScore = ref<number | null>(null);
    const practiceSessionTime = ref<PracticeSessions>({} as PracticeSessions);

    // This will be returned to ExamPage to trigger side effects
    const timerInitParams = ref<{
        actualStartISO: string;
        durationMins: number;
        extraMins: number;
    } | null>(null);
    const shouldShowFinalSubmissionDialog = ref(false);

    const fetchQuestionResults = async (practice_session_id: string) => {
        // 这个依然保持从directus直接获取，而非从redis获取。
        const questionResultsData = await getItems<QuestionResults>({
            collection: "question_results",
            params: {
                filter: {
                    practice_session_id,
                },
                fields: [
                    "id",
                    "practice_session_id",
                    "question_in_paper_id",
                    "question_type",
                    "point_value",
                    "score",
                    "submit_ans_select_radio",
                    "submit_ans_select_multiple_checkbox",
                    "is_flagged",
                ],
            },
        });
        questionResults.value = questionResultsData;
    };

    const fetchSubmittedSectionsList = async (
        sections: PaperSections[],
        current_selected_question_ref: Ref<any>
    ) => {
        console.log("sections:");
        console.log(sections);
        const sections_id_list = sections.flatMap(s=>s.id);
        const submittedSectionsResponse = (await $fetch(
            "/api/paper_sections/list",
            {
                method: "POST",
                body: {
                    ids: sections_id_list,
                },
            }
        )) as PaperSections[];

        console.log("submittedSectionsResponse:", submittedSectionsResponse);
        console.log("sections:", sections);

        submittedSectionsResponse.sort(
            (a, b) => (a.sort_in_paper || 0) - (b.sort_in_paper || 0)
        );
        const sectionList = submittedSectionsResponse;

        // const sectionList = sections;

        const question_id_list_local = ref<string[]>([]);
        const question_groups_id_list_local = ref<string[]>([]);

        // 注意：这里传递的是paper_sections_question的id列表（字符串列表）
        const paper_sections_question_ids = sectionList.flatMap(
            (s) => s.questions
        );
        console.log("paper_sections_question_ids:");
        console.log(paper_sections_question_ids);
        

        const paper_section_question_group_ids = sectionList.flatMap(
            (s) => s.question_groups
        );
        console.log("paper_section_question_group_ids:");
        console.log(paper_section_question_group_ids);
        

        let allSectionQuestions: PaperSectionsQuestions[] = [];
        if (paper_sections_question_ids.length > 0) {
            allSectionQuestions = (await $fetch(
                "/api/paper_sections_questions/list",
                {
                    method: "POST",
                    body: { ids: paper_sections_question_ids },
                }
            )) as PaperSectionsQuestions[];
            const allQuestionIds = allSectionQuestions.map(
                (sq) => sq.questions_id as string
            );
            question_id_list_local.value = Array.from(
                new Set(question_id_list_local.value.concat(allQuestionIds))
            );
        }

        console.log("allSectionQuesions:", allSectionQuestions);
        

        let allSectionQuestionGroups: PaperSectionsQuestionGroups[] = [];
        const groupModeSectionIds = sectionList
            .filter((section) => section.question_mode === "group")
            .map((section) => section.id);

        if (
            groupModeSectionIds.length > 0 &&
            paper_section_question_group_ids.length > 0
        ) {
            allSectionQuestionGroups = (await $fetch(
                "/api/paper_sections_question_groups/list",
                {
                    method: "POST",
                    body: { ids: paper_section_question_group_ids },
                }
            )) as PaperSectionsQuestionGroups[];
            const allGroupIds = allSectionQuestionGroups.map(
                (sgq) => sgq.question_groups_id as string
            );
            question_groups_id_list_local.value = Array.from(
                new Set(question_groups_id_list_local.value.concat(allGroupIds))
            );
        }

        const questionsData = (await $fetch("/api/questions/list", {
            method: "POST",
            body: { ids: Array.from(new Set(question_id_list_local.value)) },
        })) as Questions[];

        let questionGroupsData: QuestionGroups[] = [];
        if (question_groups_id_list_local.value.length > 0) {
            // questionGroupsData = sections.flatMap(s=>s.question_groups) as QuestionGroups[];
            questionGroupsData = (await $fetch("/api/question_groups/list", {
                method: "POST",
                body: {
                    ids: Array.from(
                        new Set(question_groups_id_list_local.value)
                    ),
                },
            })) as QuestionGroups[];
            console.log("questionGroupsData:");
            console.log(questionGroupsData);
            
        }

        sectionList.forEach((section) => {
            const currentSectionQuestions = allSectionQuestions
                .filter((sq) => sq.paper_sections_id === section.id)
                .sort(
                    (a, b) =>
                        (a.sort_in_section || 0) - (b.sort_in_section || 0)
                );
            const sectionQuestionsWithData = currentSectionQuestions.map(
                (sq) => {
                    const questionData = questionsData.find(
                        (item) => item.id === (sq.questions_id as string)
                    );
                    return {
                        ...sq,
                        questions_id: questionData || null,
                    };
                }
            );
            section.questions = sectionQuestionsWithData;

            if (section.question_mode === "group") {
                const currentSectionGroups = allSectionQuestionGroups
                    .filter((sgq) => sgq.paper_sections_id === section.id)
                    .sort(
                        (a, b) =>
                            (a.sort_in_section || 0) - (b.sort_in_section || 0)
                    );
                const sectionQuestionGroupsWithData = currentSectionGroups.map(
                    (sgq) => {
                        const questionGroupData = questionGroupsData.find(
                            (item) =>
                                item.id === (sgq.question_groups_id as string)
                        );
                        if (questionGroupData) {
                            const groupQuestions = section.questions.filter(
                                (qItem) => {
                                    if (
                                        !qItem.questions_id ||
                                        !qItem.questions_id.question_group
                                    )
                                        return false;
                                    const qGroup =
                                        qItem.questions_id.question_group;
                                    return (
                                        (typeof qGroup === "string"
                                            ? qGroup
                                            : qGroup.id) ===
                                        questionGroupData.id
                                    );
                                }
                            );
                            return {
                                ...sgq,
                                question_groups_id: questionGroupData || null,
                                group_question_ids: groupQuestions.map(
                                    (q) => q.id
                                ),
                            };
                        }
                        return {
                            ...sgq,
                            question_groups_id: questionGroupData || null,
                        };
                    }
                );
                section.question_groups = sectionQuestionGroupsWithData;
            }
        });

        submittedPaperSections.value = sectionList;
        console.log(
            "submittedPaperSections.value:",
            submittedPaperSections.value
        );

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

    const fetchSubmittedPaper = async (
        paperId: string,
        current_practice_session_id: string,
        current_selected_question_ref: Ref<any>
    ) => {
        const paperFullData: Papers = await $fetch(
            `/api/papers/full/${paperId}`
        );
        console.log("paperFullData:");
        console.log(paperFullData);

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
        if (practiceSession.value.exercises_students_id) {
            const esId = practiceSession.value.exercises_students_id;
            if (
                typeof esId === "object" &&
                esId &&
                "exercises_id" in esId &&
                esId.exercises_id
            ) {
                const exercisesId = esId.exercises_id;
                if (typeof exercisesId === "object" && "paper" in exercisesId) {
                    const paperId = exercisesId.paper as string;
                    await fetchSubmittedPaper(
                        paperId,
                        current_practice_session_id,
                        current_selected_question_ref
                    );
                }
            }
        }
    };

    const loadExamData = async (
        current_practice_session_id: string,
        exam_page_mode: string,
        current_selected_question_ref: Ref<any>
    ) => {
        try {
            const practiceSessionResponse: PracticeSessions =
                await getItemById<PracticeSessions>({
                    collection: "practice_sessions",
                    id: current_practice_session_id,
                    params: {
                        fields: [
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
                        ],
                    },
                });

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
                let durationMins = 0;
                let extraMins = 0;

                const esId = practiceSessionTime.value.exercises_students_id;
                if (
                    esId &&
                    typeof esId === "object" &&
                    esId.exercises_id &&
                    typeof esId.exercises_id === "object" &&
                    typeof esId.exercises_id.duration === "number"
                ) {
                    durationMins = esId.exercises_id.duration;
                }
                if (typeof practiceSessionTime.value.extra_time === "number") {
                    extraMins = practiceSessionTime.value.extra_time;
                }

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

    // 调试日志，用于重构时确认数据
    watchEffect(() => {
        console.log("------ 调试日志: useExamData ------");
        console.log("practiceSession:", practiceSession.value);
        console.log("paper:", paper.value);
        console.log("submittedPaperSections:", submittedPaperSections.value);
        console.log("questionResults:", questionResults.value);
        console.log("examScore:", examScore.value);
        console.log("practiceSessionTime:", practiceSessionTime.value);
        console.log("timerInitParams:", timerInitParams.value);
        console.log(
            "shouldShowFinalSubmissionDialog:",
            shouldShowFinalSubmissionDialog.value
        );
        console.log("------------------------------------");
    });

    return {
        practiceSession,
        paper,
        submittedPaperSections,
        // selectedQuestion is managed by ExamPage.vue, but its initial value is set here via ref
        questionResults,
        examScore,
        practiceSessionTime,
        loadExamData,
        timerInitParams, // Expose for ExamPage to use
        shouldShowFinalSubmissionDialog, // Expose for ExamPage to use
    };
}
