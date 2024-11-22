/**
 * exams
 */
export interface Exams {
    date_created?: string;
    date_updated?: string;
    description?: string;
    duration: number;
    end_time?: string;
    id: string;
    paper_prototype?: string;
    sort?: number;
    start_time?: string;
    status: string;
    title: string;
    type?: string;
    user_created?: string;
    user_updated?: string;
    [property: string]: any;
}