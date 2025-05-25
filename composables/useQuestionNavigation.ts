import type { Ref } from "vue";
import type { PaperSections, Questions } from "~~/types/directus_types";
import type { PaperSectionsQuestionGroups, QuestionGroups } from "~~/types/directus_types";

type EnhancedPaperSectionsQuestionGroups = PaperSectionsQuestionGroups & {
    group_question_ids?: string[];
    question_groups_id: QuestionGroups;
};

export function useQuestionNavigation(
    submittedPaperSections: Ref<PaperSections[]>,
    selectedQuestion: Ref<any>
) {
    const navBoundaryDialogVisible = ref(false);
    const navBoundaryMessage = ref("");

    const navigateToQuestion = (direction: number) => {
        if (!selectedQuestion.value) return;
        const currentQuestion = selectedQuestion.value;
        
        let currentSectionId: string;
        if (typeof currentQuestion.section_id === "string") {
            currentSectionId = currentQuestion.section_id;
        } else if (typeof currentQuestion.paper_sections_id === "string") {
            currentSectionId = currentQuestion.paper_sections_id;
        } else if (currentQuestion.paper_sections_id?.id) {
            currentSectionId = currentQuestion.paper_sections_id.id;
        } else {
            return;
        }

        const currentSection = submittedPaperSections.value.find(s => s.id === currentSectionId);
        if (!currentSection) return;

        const isGroupMode = currentSection.question_mode === "group";
        const sortedSections = [...submittedPaperSections.value].sort(
            (a, b) => (a.sort_in_paper || 0) - (b.sort_in_paper || 0)
        );
        const currentSectionIndex = sortedSections.findIndex(s => s.id === currentSectionId);

        if (isGroupMode) {
            navigateInGroupMode(currentSection, sortedSections, currentSectionIndex, currentQuestion, direction);
        } else {
            navigateInSingleMode(currentSection, sortedSections, currentSectionIndex, currentQuestion, direction);
        }
    };

    const navigateInSingleMode = (
        currentSection: PaperSections,
        sortedSections: PaperSections[],
        currentSectionIndex: number,
        currentQuestion: any,
        direction: number
    ) => {
        const currentSortInSection = currentQuestion.sort_in_section;
        const sortedSectionQuestions = [...currentSection.questions].sort(
            (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
        );

        if (direction === 1) {
            const nextQuestionIndex = sortedSectionQuestions.findIndex(
                q => q.sort_in_section > currentSortInSection
            );
            if (nextQuestionIndex !== -1) {
                selectedQuestion.value = sortedSectionQuestions[nextQuestionIndex];
                return;
            }

            if (currentSectionIndex < sortedSections.length - 1) {
                const nextSection = sortedSections[currentSectionIndex + 1];
                handleSectionTransition(nextSection, "first");
            } else {
                showBoundaryMessage("当前已经是最后一题！");
            }
        } else {
            const prevQuestions = sortedSectionQuestions.filter(
                q => q.sort_in_section < currentSortInSection
            );
            if (prevQuestions.length > 0) {
                selectedQuestion.value = prevQuestions[prevQuestions.length - 1];
                return;
            }

            if (currentSectionIndex > 0) {
                const prevSection = sortedSections[currentSectionIndex - 1];
                handleSectionTransition(prevSection, "last");
            } else {
                showBoundaryMessage("当前已经是第一题！");
            }
        }
    };

    const navigateInGroupMode = (
        currentSection: PaperSections,
        sortedSections: PaperSections[],
        currentSectionIndex: number,
        currentQuestion: any,
        direction: number
    ) => {
        if (!currentSection.question_groups?.length) return;

        const sortedGroups = [...currentSection.question_groups].sort(
            (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
        );
        const currentGroupIndex = sortedGroups.findIndex(
            group => group.question_groups_id?.id === currentQuestion.questionGroup?.id
        );

        if (currentGroupIndex === -1) return;

        if (direction === 1) {
            if (currentGroupIndex < sortedGroups.length - 1) {
                handleQuestionGroupClick(sortedGroups[currentGroupIndex + 1], currentSection);
            } else if (currentSectionIndex < sortedSections.length - 1) {
                const nextSection = sortedSections[currentSectionIndex + 1];
                handleSectionTransition(nextSection, "first");
            } else {
                showBoundaryMessage("当前已经是最后一题！");
            }
        } else {
            if (currentGroupIndex > 0) {
                handleQuestionGroupClick(sortedGroups[currentGroupIndex - 1], currentSection);
            } else if (currentSectionIndex > 0) {
                const prevSection = sortedSections[currentSectionIndex - 1];
                handleSectionTransition(prevSection, "last");
            } else {
                showBoundaryMessage("当前已经是第一题！");
            }
        }
    };

    const handleQuestionGroupClick = (group: EnhancedPaperSectionsQuestionGroups, section: PaperSections) => {
        const questionGroup = group.question_groups_id;
        const groupQuestionIds = group.question_groups_id.questions.flatMap((q: Questions) => q.id) || [];
        
        const groupQuestions = section.questions
            .filter(q => groupQuestionIds.includes(q.id))
            .sort((a, b) => {
                const aSort = a.questions_id?.sort_in_group ?? 999;
                const bSort = b.questions_id?.sort_in_group ?? 999;
                return aSort - bSort || (a.sort_in_section || 0) - (b.sort_in_section || 0);
            });

        const enhancedQuestion = {
            ...group,
            isGroupMode: true,
            questionGroup,
            questions_id: { type: "group" },
            section_id: section.id,
            paper_sections_id: section.id,
            sort_in_section: group.sort_in_section,
            groupQuestions,
        };

        selectedQuestion.value = enhancedQuestion;
    };

    const handleSectionTransition = (section: PaperSections, position: "first" | "last") => {
        if (section.question_mode === "group" && section.question_groups?.length) {
            const groups = [...section.question_groups].sort(
                (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
            );
            const targetGroup = position === "first" ? groups[0] : groups[groups.length - 1];
            if (targetGroup) handleQuestionGroupClick(targetGroup, section);
        } else if (section.questions?.length) {
            const questions = [...section.questions].sort(
                (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
            );
            selectedQuestion.value = position === "first" ? questions[0] : questions[questions.length - 1];
        }
    };

    const showBoundaryMessage = (message: string) => {
        navBoundaryMessage.value = message;
        navBoundaryDialogVisible.value = true;
    };

    return {
        navBoundaryDialogVisible,
        navBoundaryMessage,
        navigateToQuestion,
        handleQuestionGroupClick
    };
} 