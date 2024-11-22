/**
 * paper_prototypes
 */
export interface PaperPrototypes {
    course?: string;
    date_created?: string;
    date_updated?: string;
    id: string;
    sort?: number;
    status: string;
    title?: string;
    total_point_value?: number;
    total_question_count?: number;
    user_created?: string;
    user_updated?: string;
    [property: string]: any;
}