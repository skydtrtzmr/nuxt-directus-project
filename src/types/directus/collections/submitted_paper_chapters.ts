import type { Relation } from "../utils";
import type { SubmittedPapers } from "./submitted_papers";
/**
 * submitted_paper_chapters
 */
export interface SubmittedPaperChapters {
    date_created?: string;
    date_updated?: string;
    id: string;
    point_value?: number;
    score?: string;
    sort?: number;
    sort_in_paper?: number;
    source_paper_gen_strategy_chapter?: string;
    source_paper_prototype_chapter?: string;
    status: string;
    submitted_paper?: Relation<SubmittedPapers>;
    title?: string;
    user_created?: string;
    user_updated?: string;
    [property: string]: any;
}