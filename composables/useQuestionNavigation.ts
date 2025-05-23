import type { Ref } from "vue";
import type { PaperSections, Questions, QuestionGroups, PaperSectionsQuestions } from "~~/types/directus_types";
// Original PaperSectionsQuestionGroups is imported for type safety if needed directly
import type { PaperSectionsQuestionGroups as OriginalPaperSectionsQuestionGroups } from "~~/types/directus_types";

// This type is used internally and for arguments, reflecting the structure after processing in useExamData or QuestionList
// It expects question_groups_id to be a full QuestionGroups object.
// It also includes group_question_ids which is added during processing.
interface ProcessedPaperSectionGroup extends OriginalPaperSectionsQuestionGroups {
    group_question_ids?: string[];      // IDs of PaperSectionsQuestions items belonging to this group
    question_groups_id: QuestionGroups; // Expects this to be the full QuestionGroups object
}

export function useQuestionNavigation(
    submittedPaperSections: Ref<PaperSections[]>,
    selectedQuestion: Ref<any> // This will be an enhanced object for both single and group questions
) {
    const navBoundaryDialogVisible = ref(false);
    const navBoundaryMessage = ref("");

    const navigateToQuestion = (direction: number) => {
        if (!selectedQuestion.value) {
            console.error("[useQuestionNavigation] Cannot navigate, selectedQuestion is null.");
            return;
        }
        const currentQuestion = selectedQuestion.value;
        
        // currentQuestion should have section_id directly from how it's set
        const currentSectionId: string | undefined = currentQuestion.section_id;

        if (!currentSectionId) {
            console.error("[useQuestionNavigation] Cannot navigate, currentQuestion.section_id is missing.", currentQuestion);
            return;
        }

        const currentSection = submittedPaperSections.value.find(s => s.id === currentSectionId);
        if (!currentSection) {
            console.error("[useQuestionNavigation] Current section not found for id:", currentSectionId);
            return;
        }

        // Use isGroupMode from the selectedQuestion object itself if available, otherwise fallback to section's mode
        const mode = typeof currentQuestion.isGroupMode === 'boolean' ? 
                        (currentQuestion.isGroupMode ? 'group' : 'single') :
                        currentSection.question_mode;

        const sortedSections = [...submittedPaperSections.value].sort(
            (a, b) => (a.sort_in_paper || 0) - (b.sort_in_paper || 0)
        );
        const currentSectionIndex = sortedSections.findIndex(s => s.id === currentSectionId);

        if (mode === "group") {
            navigateInGroupMode(currentSection, sortedSections, currentSectionIndex, currentQuestion, direction);
        } else {
            navigateInSingleMode(currentSection, sortedSections, currentSectionIndex, currentQuestion, direction);
        }
    };

    const navigateInSingleMode = (
        currentSection: PaperSections,
        sortedSections: PaperSections[],
        currentSectionIndex: number,
        currentQuestion: any, // This is an enhanced PaperSectionsQuestions object
        direction: number
    ) => {
        const currentSortInSection = currentQuestion.sort_in_section;
        const sortedSectionQuestions = (currentSection.questions as PaperSectionsQuestions[] || []).sort(
            (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
        );

        if (direction === 1) { // Next question
            const nextQuestionInArr = sortedSectionQuestions.find(
                q => q.sort_in_section! > currentSortInSection
            );
            if (nextQuestionInArr) {
                selectedQuestion.value = {
                    ...nextQuestionInArr,
                    section_id: currentSection.id,
                    paper_sections_id: currentSection.id, 
                    isGroupMode: false
                };
                return;
            }
            // If no next question in current section, try next section
            if (currentSectionIndex < sortedSections.length - 1) {
                const nextSection = sortedSections[currentSectionIndex + 1];
                handleSectionTransition(nextSection, "first");
            } else {
                showBoundaryMessage("当前已经是最后一题！");
            }
        } else { // Previous question
            const prevQuestionsInArr = sortedSectionQuestions.filter(
                q => q.sort_in_section! < currentSortInSection
            );
            if (prevQuestionsInArr.length > 0) {
                selectedQuestion.value = {
                    ...prevQuestionsInArr[prevQuestionsInArr.length - 1],
                    section_id: currentSection.id,
                    paper_sections_id: currentSection.id,
                    isGroupMode: false
                };
                return;
            }
            // If no previous question in current section, try previous section
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
        currentQuestion: any, // This is an enhanced group object
        direction: number
    ) => {
        if (!currentSection.question_groups?.length) return;

        const sortedGroups = (currentSection.question_groups as ProcessedPaperSectionGroup[] || []).sort(
            (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
        );
        // currentQuestion.questionGroup should be the QuestionGroups object
        const currentQuestionGroupId = currentQuestion.questionGroup?.id;
        if (!currentQuestionGroupId) {
            console.error("[useQuestionNavigation] Current group ID missing from selectedQuestion for group mode navigation.", currentQuestion);
            return;
        }

        const currentGroupIndex = sortedGroups.findIndex(
            group => group.question_groups_id.id === currentQuestionGroupId
        );

        if (currentGroupIndex === -1) {
            console.error("[useQuestionNavigation] Current group not found in section's sorted groups.");
            return;
        }

        if (direction === 1) { // Next group
            if (currentGroupIndex < sortedGroups.length - 1) {
                // Pass the ProcessedPaperSectionGroup to handleQuestionGroupClick
                handleQuestionGroupClick(sortedGroups[currentGroupIndex + 1], currentSection);
            } else if (currentSectionIndex < sortedSections.length - 1) {
                const nextSection = sortedSections[currentSectionIndex + 1];
                handleSectionTransition(nextSection, "first");
            } else {
                showBoundaryMessage("当前已经是最后一题！");
            }
        } else { // Previous group
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

    // This function is also called by QuestionList, so 'group' type needs to be consistent
    // It takes a ProcessedPaperSectionGroup (which includes group_question_ids and full question_groups_id object)
    const handleQuestionGroupClick = (group: ProcessedPaperSectionGroup, section: PaperSections) => {
        const questionGroupObject = group.question_groups_id; // This IS the QuestionGroups object
        const groupPsqIds = group.group_question_ids || []; // string[] of PaperSectionsQuestions IDs
        
        const groupQuestionsList = (section.questions as PaperSectionsQuestions[] || [])
            .filter(q_item => groupPsqIds.includes(String(q_item.id))) // q_item.id is number
            .sort((a, b) => {
                const aSort = (a.questions_id as Questions)?.sort_in_group ?? 999;
                const bSort = (b.questions_id as Questions)?.sort_in_group ?? 999;
                if (aSort === bSort) {
                    return (a.sort_in_section || 0) - (b.sort_in_section || 0);
                }
                return Number(aSort) - Number(bSort);
            });

        selectedQuestion.value = {
            // Spread the original PaperSectionsQuestionGroups item (the 'group' argument)
            // This carries its own 'id' (pqs.id), 'sort_in_section', etc.
            ...group, 
            isGroupMode: true,
            questionGroup: questionGroupObject,    // The full QuestionGroups object
            questions_id: { type: "group" },      // Placeholder for compatibility
            section_id: section.id,
            paper_sections_id: section.id,         // For consistency
            // sort_in_section is already part of 'group'
            groupQuestions: groupQuestionsList,    // Array of PaperSectionsQuestions items for this group
        };
    };

    const handleSectionTransition = (section: PaperSections, position: "first" | "last") => {
        if (section.question_mode === "group" && section.question_groups?.length) {
            const groups = (section.question_groups as ProcessedPaperSectionGroup[] || []).sort(
                (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
            );
            const targetGroup = position === "first" ? groups[0] : groups[groups.length - 1];
            if (targetGroup) {
                handleQuestionGroupClick(targetGroup, section);
            }
        } else if (section.questions?.length) {
            const questions = (section.questions as PaperSectionsQuestions[] || []).sort(
                (a, b) => (a.sort_in_section || 0) - (b.sort_in_section || 0)
            );
            const targetQuestion = position === "first" ? questions[0] : questions[questions.length - 1];
            if (targetQuestion) {
                selectedQuestion.value = {
                    ...targetQuestion,
                    section_id: section.id,
                    paper_sections_id: section.id,
                    isGroupMode: false
                };
            }
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
        handleQuestionGroupClick // Export if QuestionList needs to call this specific version
    };
} 