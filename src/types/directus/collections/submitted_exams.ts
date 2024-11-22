import type { Relation } from "../utils";
import type { Exams } from "./exams";
/**
 * submitted_exams
 */
export interface SubmittedExams {
    actual_end_time?: string;
    actual_start_time?: string;
    date_created?: string;
    date_updated?: string;
    exam: Relation<Exams>;
    expected_end_time?: string;
    extra_time?: number;
    id: string;
    participation_status?: string;
    sort?: number;
    status: string;
    student?: string;
    submit_status?: string;
    user_created?: string;
    user_updated?: string;
    [property: string]: any;
}