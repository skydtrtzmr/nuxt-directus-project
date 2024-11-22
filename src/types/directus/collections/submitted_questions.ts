/**
 * submitted_questions
 */
export interface SubmittedQuestions {
    date_created?: string;
    date_updated?: string;
    id: string;
    incomplete_point_value?: number;
    option_number?: number;
    point_value?: number;
    question?: string;
    question_type?: string;
    score?: number;
    sort?: number;
    status: string;
    student?: string;
    submitted_ans_q_mc_binary?: string;
    submitted_ans_q_mc_flexible?: string;
    submitted_ans_q_mc_multi?: string;
    submitted_ans_q_mc_single?: string;
    submitted_paper_chapter?: string;
    user_created?: string;
    user_updated?: string;
    [property: string]: any;
}