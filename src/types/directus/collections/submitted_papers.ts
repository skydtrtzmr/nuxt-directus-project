import type { Relation } from "../utils";
import type { SubmittedExams } from "./submitted_exams";
/**
 * submitted_papers
 */
export interface SubmittedPapers {
    date_created?: string;
    date_updated?: string;
    id: string;
    point_value?: number;
    score?: number;
    sort?: number;
    source_paper_gen_strategies?: string;
    source_paper_prototype?: string;
    source_type?: string;
    status: string;
    submitted_exam: Relation<SubmittedExams>;
    title?: string;
    user_created?: string;
    user_updated?: string;
    [property: string]: any;
}