import { ref, type Ref } from "vue";
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
    const questionResults = ref<QuestionResults[]>([]);
    const examScore = ref<number | null>(null);
    const practiceSessionTime = ref<PracticeSessions>({} as PracticeSessions);

    // This will be returned to ExamPage to trigger side effects
    const timerInitParams = ref<{ actualStartISO: string; durationMins: number; extraMins: number } | null>(null);
    const shouldShowFinalSubmissionDialog = ref(false);

    const loadExamData = async (current_practice_session_id: string, exam_page_mode: string, current_selected_question_ref: Ref<any>) => {
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
                    return; // Exit early if already submitted and not in review mode
                }

                let paperId: string | null = null;
                if (practiceSession.value.exercises_students_id) {
                    const esId = practiceSession.value.exercises_students_id;
                    if (
                        typeof esId === "object" &&
                        esId &&
                        "exercises_id" in esId &&
                        esId.exercises_id &&
                        typeof esId.exercises_id === "object" &&
                        "paper" in esId.exercises_id
                    ) {
                        paperId = esId.exercises_id.paper as string;
                    }
                }

                if (!paperId) {
                    console.error("useExamData: Paper ID could not be determined from practice session.");
                    return;
                }

                // Fetch static paper data from the new comprehensive API
                const fullPaperData: Papers = await $fetch(`/api/papers/full/${paperId}`);

                if (!fullPaperData) {
                    console.error(`useExamData: Failed to fetch full paper data for paper ID ${paperId}.`);
                    return;
                } else {
                    console.log("fullPaperData:");
                    console.log(fullPaperData);
                    
                    
                }

                paper.value = fullPaperData; // Assign the whole paper object

                // Process sections, questions, and groups from the new API's response
                const sectionsFromServer = (fullPaperData.paper_sections as PaperSections[] || [])
                    .sort((a, b) => (a.sort_in_paper || 0) - (b.sort_in_paper || 0));

                submittedPaperSections.value = sectionsFromServer.map(serverSection => {
                    // serverSection.questions should be an array of PaperSectionsQuestions items
                    // where questions_id is a fully populated Question object.
                    const sortedQuestions = (serverSection.questions as PaperSectionsQuestions[] || [])
                        .sort((a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0));

                    let processedQuestionGroups: PaperSectionsQuestionGroups[] = [];
                    if (serverSection.question_mode === 'group' && serverSection.question_groups) {
                        // serverSection.question_groups should be an array of PaperSectionsQuestionGroups items
                        // where question_groups_id is a fully populated QuestionGroups object.
                        processedQuestionGroups = (serverSection.question_groups as PaperSectionsQuestionGroups[] || [])
                            .sort((a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0))
                            .map(psqg => { // psqg is a PaperSectionsQuestionGroups item
                                // Identify questions belonging to this specific group (psqg)
                                const groupQuestions = sortedQuestions.filter(qItem => { // qItem is PaperSectionsQuestions
                                    const questionData = qItem.questions_id as Questions; // This is the full Question object
                                    if (!questionData || !questionData.question_group) return false;
                                    
                                    const qGroup = questionData.question_group; // This is the FK to QuestionGroups on the Question itself
                                    const qGroupId = typeof qGroup === 'string' ? qGroup : (qGroup as QuestionGroups).id;
                                    
                                    const currentGroupDefinition = psqg.question_groups_id as QuestionGroups; // This is the full QuestionGroup object for this psqg item
                                    return qGroupId === currentGroupDefinition.id;
                                });
                                return {
                                    ...psqg, // Spread the original PaperSectionsQuestionGroups item
                                    // Store IDs of the PaperSectionsQuestions items that belong to this group
                                    group_question_ids: groupQuestions.map(q => String(q.id)), 
                                };
                            });
                    }

                    return {
                        ...serverSection, // Basic PaperSections fields
                        questions: sortedQuestions, // Array of PaperSectionsQuestions items, with questions_id fully populated
                        question_groups: processedQuestionGroups, // Array of processed PaperSectionsQuestionGroups items
                    } as PaperSections;
                });

                // Fetch question_results directly from Directus (this part remains unchanged)
                const questionResultsData = await getItems<QuestionResults>({
                    collection: "question_results",
                    params: {
                        filter: {
                            practice_session_id: current_practice_session_id,
                        },
                        fields: [
                            "id",
                            "practice_session_id",
                            "question_in_paper_id", // This ID refers to paper_sections_questions.id
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

                // Initialize current_selected_question_ref (passed from ExamPage.vue)
                if (submittedPaperSections.value.length > 0) {
                    const firstSection = submittedPaperSections.value[0];
                    if (
                        firstSection.question_mode === "group" &&
                        firstSection.question_groups &&
                        firstSection.question_groups.length > 0
                    ) {
                        const firstProcessedGroup = firstSection.question_groups[0]; // This is a processed PaperSectionsQuestionGroups item
                        
                        // Filter the section's questions to get those belonging to this first group
                        const groupQuestionsForDisplay = (firstSection.questions as PaperSectionsQuestions[] || []).filter(qItem =>
                            (firstProcessedGroup.group_question_ids || []).includes(String(qItem.id))
                        );

                        const sortedGroupQuestionsForDisplay = [...groupQuestionsForDisplay].sort((a, b) => {
                            const aQuestionData = a.questions_id as Questions;
                            const bQuestionData = b.questions_id as Questions;
                            const aSort = aQuestionData?.sort_in_group ?? 999;
                            const bSort = bQuestionData?.sort_in_group ?? 999;
                            if (aSort === bSort) {
                                return (a.sort_in_section || 0) - (b.sort_in_section || 0);
                            }
                            return aSort - bSort;
                        });

                        current_selected_question_ref.value = {
                            ...(firstProcessedGroup as any), // Spread properties of PaperSectionsQuestionGroups item
                            isGroupMode: true,
                            questionGroup: firstProcessedGroup.question_groups_id, // Full QuestionGroups object
                            questions_id: { type: "group" }, // Marker for group type
                            section_id: firstSection.id,
                            paper_sections_id: firstSection.id, // For compatibility
                            groupQuestions: sortedGroupQuestionsForDisplay, // Array of PaperSectionsQuestions items for this group
                        };
                    } else if (
                        firstSection.questions &&
                        firstSection.questions.length > 0
                    ) {
                        current_selected_question_ref.value = firstSection.questions[0]; // A PaperSectionsQuestions item
                    } else {
                        current_selected_question_ref.value = null; // No questions or groups in the first section
                    }
                } else {
                    current_selected_question_ref.value = null; // No sections in the paper
                }

                // Initialize timer parameters (logic remains unchanged)
                const actualStartISO = practiceSessionTime.value.actual_start_time;
                let durationMins = 0;
                let extraMins = 0;

                const esIdForTimer = practiceSessionTime.value.exercises_students_id;
                if (
                    esIdForTimer &&
                    typeof esIdForTimer === "object" &&
                    esIdForTimer.exercises_id &&
                    typeof esIdForTimer.exercises_id === "object" &&
                    typeof esIdForTimer.exercises_id.duration === "number"
                ) {
                    durationMins = esIdForTimer.exercises_id.duration;
                }
                if (typeof practiceSessionTime.value.extra_time === "number") {
                    extraMins = practiceSessionTime.value.extra_time;
                }

                if (actualStartISO) {
                    timerInitParams.value = { actualStartISO, durationMins, extraMins };
                } else {
                    console.error(
                        "useExamData: Timer init params incomplete - actual_start_time missing.",
                        "actualStartISO was:", actualStartISO
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
        practiceSession,
        paper,
        submittedPaperSections,
        questionResults,
        examScore,
        practiceSessionTime,
        loadExamData,
        timerInitParams,
        shouldShowFinalSubmissionDialog,
    };
} 