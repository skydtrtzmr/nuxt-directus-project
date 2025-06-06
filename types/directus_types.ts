export type Articles = {
  content?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  knowledge_points: any[] | ArticlesKnowledgePoints[];
  sections: any[] | ArticlesSections[];
  sort?: number | null;
  status: string;
  textbook?: string | Textbooks | null;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type ArticlesKnowledgePoints = {
  articles_id?: string | Articles | null;
  id: number;
  knowledge_points_id?: string | KnowledgePoints | null;
};

export type ArticlesSections = {
  articles_id?: string | Articles | null;
  id: number;
  sections_id?: string | Sections | null;
};

export type Classes = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  institution?: string | Institutions | null;
  name?: string | null;
  status: string;
  students: any[] | Students[];
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type Courses = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  sort?: number | null;
  status: string;
  subject?: string | Subjects | null;
  teachers: any[] | CoursesTeachers[];
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type CoursesTeachers = {
  courses_id?: string | Courses | null;
  id: number;
  teachers_id?: string | Teachers | null;
};

export type DirectusAccess = {
  id: string;
  policy: string | DirectusPolicies;
  role?: string | DirectusRoles | null;
  sort?: number | null;
  user?: string | DirectusUsers | null;
};

export type DirectusActivity = {
  action: string;
  collection: string;
  id: number;
  ip?: string | null;
  item: string;
  origin?: string | null;
  revisions: any[] | DirectusRevisions[];
  timestamp: string;
  user?: string | DirectusUsers | null;
  user_agent?: string | null;
};

export type DirectusCollections = {
  accountability?: string | null;
  archive_app_filter: boolean;
  archive_field?: string | null;
  archive_value?: string | null;
  collapse: string;
  collection: string;
  color?: string | null;
  display_template?: string | null;
  group?: string | DirectusCollections | null;
  hidden: boolean;
  icon?: string | null;
  item_duplication_fields?: unknown | null;
  note?: string | null;
  preview_url?: string | null;
  singleton: boolean;
  sort?: number | null;
  sort_field?: string | null;
  translations?: unknown | null;
  unarchive_value?: string | null;
  versioning: boolean;
};

export type DirectusComments = {
  collection: string | DirectusCollections;
  comment: string;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  item: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type DirectusDashboards = {
  color?: string | null;
  date_created?: string | null;
  icon: string;
  id: string;
  name: string;
  note?: string | null;
  panels: any[] | DirectusPanels[];
  user_created?: string | DirectusUsers | null;
};

export type DirectusExtensions = {
  bundle?: string | null;
  enabled: boolean;
  folder: string;
  id: string;
  source: string;
};

export type DirectusFields = {
  collection: string | DirectusCollections;
  conditions?: unknown | null;
  display?: string | null;
  display_options?: unknown | null;
  field: string;
  group?: string | DirectusFields | null;
  hidden: boolean;
  id: number;
  interface?: string | null;
  note?: string | null;
  options?: unknown | null;
  readonly: boolean;
  required?: boolean | null;
  sort?: number | null;
  special?: unknown | null;
  translations?: unknown | null;
  validation?: unknown | null;
  validation_message?: string | null;
  width?: string | null;
};

export type DirectusFiles = {
  charset?: string | null;
  created_on: string;
  description?: string | null;
  duration?: number | null;
  embed?: string | null;
  filename_disk?: string | null;
  filename_download: string;
  filesize?: number | null;
  focal_point_x?: number | null;
  focal_point_y?: number | null;
  folder?: string | DirectusFolders | null;
  height?: number | null;
  id: string;
  location?: string | null;
  metadata?: unknown | null;
  modified_by?: string | DirectusUsers | null;
  modified_on: string;
  storage: string;
  tags?: unknown | null;
  title?: string | null;
  tus_data?: unknown | null;
  tus_id?: string | null;
  type?: string | null;
  uploaded_by?: string | DirectusUsers | null;
  uploaded_on?: string | null;
  width?: number | null;
};

export type DirectusFlows = {
  accountability?: string | null;
  color?: string | null;
  date_created?: string | null;
  description?: string | null;
  icon?: string | null;
  id: string;
  name: string;
  operation?: string | DirectusOperations | null;
  operations: any[] | DirectusOperations[];
  options?: unknown | null;
  status: string;
  trigger?: string | null;
  user_created?: string | DirectusUsers | null;
};

export type DirectusFolders = {
  id: string;
  name: string;
  parent?: string | DirectusFolders | null;
};

export type DirectusMigrations = {
  name: string;
  timestamp?: string | null;
  version: string;
};

export type DirectusNotifications = {
  collection?: string | null;
  id: number;
  item?: string | null;
  message?: string | null;
  recipient: string | DirectusUsers;
  sender?: string | DirectusUsers | null;
  status?: string | null;
  subject: string;
  timestamp?: string | null;
};

export type DirectusOperations = {
  date_created?: string | null;
  flow: string | DirectusFlows;
  id: string;
  key: string;
  name?: string | null;
  options?: unknown | null;
  position_x: number;
  position_y: number;
  reject?: string | DirectusOperations | null;
  resolve?: string | DirectusOperations | null;
  type: string;
  user_created?: string | DirectusUsers | null;
};

export type DirectusPanels = {
  color?: string | null;
  dashboard: string | DirectusDashboards;
  date_created?: string | null;
  height: number;
  icon?: string | null;
  id: string;
  name?: string | null;
  note?: string | null;
  options?: unknown | null;
  position_x: number;
  position_y: number;
  show_header: boolean;
  type: string;
  user_created?: string | DirectusUsers | null;
  width: number;
};

export type DirectusPermissions = {
  action: string;
  collection: string;
  fields?: unknown | null;
  id: number;
  permissions?: unknown | null;
  policy: string | DirectusPolicies;
  presets?: unknown | null;
  validation?: unknown | null;
};

export type DirectusPolicies = {
  admin_access: boolean;
  app_access: boolean;
  description?: string | null;
  enforce_tfa: boolean;
  icon: string;
  id: string;
  ip_access?: unknown | null;
  name: string;
  permissions: any[] | DirectusPermissions[];
  roles: any[] | DirectusAccess[];
  users: any[] | DirectusAccess[];
};

export type DirectusPresets = {
  bookmark?: string | null;
  collection?: string | null;
  color?: string | null;
  filter?: unknown | null;
  icon?: string | null;
  id: number;
  layout?: string | null;
  layout_options?: unknown | null;
  layout_query?: unknown | null;
  refresh_interval?: number | null;
  role?: string | DirectusRoles | null;
  search?: string | null;
  user?: string | DirectusUsers | null;
};

export type DirectusRelations = {
  id: number;
  junction_field?: string | null;
  many_collection: string;
  many_field: string;
  one_allowed_collections?: unknown | null;
  one_collection?: string | null;
  one_collection_field?: string | null;
  one_deselect_action: string;
  one_field?: string | null;
  sort_field?: string | null;
};

export type DirectusRevisions = {
  activity: number | DirectusActivity;
  collection: string;
  data?: unknown | null;
  delta?: unknown | null;
  id: number;
  item: string;
  parent?: number | DirectusRevisions | null;
  version?: string | DirectusVersions | null;
};

export type DirectusRoles = {
  children: any[] | DirectusRoles[];
  description?: string | null;
  icon: string;
  id: string;
  name: string;
  parent?: string | DirectusRoles | null;
  policies: any[] | DirectusAccess[];
  users: any[] | DirectusUsers[];
  users_group: string;
};

export type DirectusSessions = {
  expires: string;
  ip?: string | null;
  next_token?: string | null;
  origin?: string | null;
  share?: string | DirectusShares | null;
  token: string;
  user?: string | DirectusUsers | null;
  user_agent?: string | null;
};

export type DirectusSettings = {
  auth_login_attempts?: number | null;
  auth_password_policy?: string | null;
  basemaps?: unknown | null;
  custom_aspect_ratios?: unknown | null;
  custom_css?: string | null;
  default_appearance: string;
  default_language: string;
  default_theme_dark?: string | null;
  default_theme_light?: string | null;
  id: number;
  mapbox_key?: string | null;
  module_bar?: unknown | null;
  project_color: string;
  project_descriptor?: string | null;
  project_logo?: string | DirectusFiles | null;
  project_name: string;
  project_url?: string | null;
  public_background?: string | DirectusFiles | null;
  public_favicon?: string | DirectusFiles | null;
  public_foreground?: string | DirectusFiles | null;
  public_note?: string | null;
  public_registration: boolean;
  public_registration_email_filter?: unknown | null;
  public_registration_role?: string | DirectusRoles | null;
  public_registration_verify_email: boolean;
  report_bug_url?: string | null;
  report_error_url?: string | null;
  report_feature_url?: string | null;
  storage_asset_presets?: unknown | null;
  storage_asset_transform?: string | null;
  storage_default_folder?: string | DirectusFolders | null;
  theme_dark_overrides?: unknown | null;
  theme_light_overrides?: unknown | null;
  theming_group: string;
  visual_editor_urls?: unknown | null;
};

export type DirectusShares = {
  collection: string | DirectusCollections;
  date_created?: string | null;
  date_end?: string | null;
  date_start?: string | null;
  id: string;
  item: string;
  max_uses?: number | null;
  name?: string | null;
  password?: string | null;
  role?: string | DirectusRoles | null;
  times_used?: number | null;
  user_created?: string | DirectusUsers | null;
};

export type DirectusTranslations = {
  id: string;
  key: string;
  language: string;
  value: string;
};

export type DirectusUsers = {
  appearance?: string | null;
  auth_data?: unknown | null;
  avatar?: string | DirectusFiles | null;
  description?: string | null;
  email?: string | null;
  email_notifications?: boolean | null;
  external_identifier?: string | null;
  first_name?: string | null;
  id: string;
  language?: string | null;
  last_access?: string | null;
  last_name?: string | null;
  last_page?: string | null;
  location?: string | null;
  password?: string | null;
  policies: any[] | DirectusAccess[];
  provider: string;
  role?: string | DirectusRoles | null;
  status: string;
  tags?: unknown | null;
  tfa_secret?: string | null;
  theme_dark?: string | null;
  theme_dark_overrides?: unknown | null;
  theme_light?: string | null;
  theme_light_overrides?: unknown | null;
  title?: string | null;
  token?: string | null;
};

export type DirectusVersions = {
  collection: string | DirectusCollections;
  date_created?: string | null;
  date_updated?: string | null;
  delta?: unknown | null;
  hash?: string | null;
  id: string;
  item: string;
  key: string;
  name?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type DirectusWebhooks = {
  actions: unknown;
  collections: unknown;
  data: boolean;
  headers?: unknown | null;
  id: number;
  method: string;
  migrated_flow?: string | DirectusFlows | null;
  name: string;
  status: string;
  url: string;
  was_active_before_deprecation: boolean;
};

export type Exercises = {
  date_created?: string | null;
  date_updated?: string | null;
  description?: string | null;
  duration: number;
  end_time: string;
  id: string;
  mode?: string | null;
  paper?: string | Papers | null;
  sort?: number | null;
  start_time: string;
  status: string;
  students: any[] | ExercisesStudents[];
  title: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type ExercisesStudents = {
  exercises_id?: string | Exercises | null;
  id: number;
  students_id?: string | Students | null;
};

export type Institutions = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  name?: string | null;
  sort?: number | null;
  status: string;
  type?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type KnowledgePoints = {
  child_nodes: any[] | KnowledgePoints[];
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  parent_node?: string | KnowledgePoints | null;
  parent_nodes: any[] | KnowledgePointsKnowledgePoints[];
  sort?: number | null;
  status: string;
  subject?: string | Subjects | null;
  title?: string | null;
  type?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type KnowledgePointsKnowledgePoints = {
  id: number;
  knowledge_points_id?: string | KnowledgePoints | null;
  related_knowledge_points_id?: string | KnowledgePoints | null;
};

export type Notices = {
  content?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  sort?: number | null;
  status: string;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type PaperInstances = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  sort?: number | null;
  status: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type PaperSectionStrategies = {
  date_created?: string | null;
  date_updated?: string | null;
  filter_knowledge_points?: unknown | null;
  filter_textbook_chapters?: unknown | null;
  filter_type?: string | null;
  id: string;
  paper_strategy?: string | PaperStrategies | null;
  points_per_question?: number | null;
  question_type: string;
  sort?: number | null;
  sort_in_paper?: number | null;
  status: string;
  target_difficulty: number;
  title?: string | null;
  total_question_count?: number | null;
  total_question_points?: number | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type PaperSections = {
  date_created?: string | null;
  date_updated?: string | null;
  description?: string | null;
  id: string;
  paper_id?: string | Papers | null;
  points_per_question?: number | null;
  question_groups: any[] | PaperSectionsQuestionGroups[];
  question_mode?: string | null;
  question_type: string;
  questions: any[] | PaperSectionsQuestions[];
  save_and_stay: string;
  sort?: number | null;
  sort_in_paper?: number | null;
  status: string;
  title?: string | null;
  total_question_count?: number | null;
  total_question_points?: number | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type PaperSectionsQuestionGroups = {
  id: number;
  paper_sections_id?: string | PaperSections | null;
  question_groups_id?: string | QuestionGroups | null;
  sort_in_section?: number | null;
};

export type PaperSectionsQuestions = {
  id: number;
  paper_sections_id?: string | PaperSections | null;
  questions_id?: string | Questions | null;
  sort_in_section?: number | null;
};

export type PaperStrategies = {
  date_created?: string | null;
  date_updated?: string | null;
  description?: string | null;
  difficulty?: number | null;
  id: string;
  paper_section_strategies: any[] | PaperSectionStrategies[];
  sort?: number | null;
  status: string;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type Papers = {
  course?: string | Courses | null;
  date_created?: string | null;
  date_updated?: string | null;
  description?: string | null;
  id: string;
  paper_sections: any[] | PaperSections[];
  paper_strategy?: string | PaperStrategies | null;
  save_and_stay?: string;
  sort?: number | null;
  status: string;
  title?: string | null;
  total_point_value?: number | null;
  total_question_count?: number | null;
  "triggers-do4gvh"?: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type PracticeSessions = {
  actual_end_time?: string | null;
  actual_start_time?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  exercises_students_id?: number | ExercisesStudents | null;
  expected_end_time?: string | null;
  extra_time?: number | null;
  id: string;
  paper?: string | Papers | null;
  question_results: any[] | QuestionResults[];
  score?: number | null;
  sort?: number | null;
  status: string;
  submit_status?: string | null;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QFillInBlankAnswers = {
  blank_position?: number | null;
  correct_answer?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  question_id?: string | QuestionsFillInBlank | null;
  score?: number | null;
  status: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QMc = {
  correct_option?: number | null;
  correct_options?: unknown | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  mcq_type?: string | null;
  option_a: string;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  option_e?: string | null;
  option_f?: string | null;
  option_number?: number | null;
  options: string;
  sort?: number | null;
  status: string;
  stem: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QMcBinary = {
  analysis?: string | null;
  correct_option?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  option_a?: string | null;
  option_b?: string | null;
  options: string;
  sort?: number | null;
  status: string;
  stem?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QMcFlexible = {
  analysis?: string | null;
  correct_options?: unknown | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  option_e?: string | null;
  option_f?: string | null;
  option_number?: number | null;
  options: string;
  sort?: number | null;
  status: string;
  stem?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QMcMulti = {
  analysis?: string | null;
  correct_options?: unknown | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  option_e?: string | null;
  option_f?: string | null;
  option_number?: number | null;
  options: string;
  sort?: number | null;
  status: string;
  stem?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QMcSingle = {
  analysis?: string | null;
  correct_option?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  option_e?: string | null;
  option_f?: string | null;
  option_number?: number | null;
  options: string;
  sort?: number | null;
  status: string;
  stem?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QSpreadsheetScoringGroups = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  scoring_items: any[] | QSpreadsheetScoringItems[];
  status: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QSpreadsheetScoringItems = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  item_type?: string | null;
  scoring_group?: string | QSpreadsheetScoringGroups | null;
  sort?: number | null;
  status: string;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QuestionGroups = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  question_count?: number | null;
  questions: any[] | Questions[];
  shared_stem?: string | null;
  sort?: number | null;
  status: string;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QuestionMistakes = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  question?: string | Questions | null;
  sort?: number | null;
  status: string;
  student?: string | Students | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
  wrong_count?: number | null;
};

export type QuestionPointAssignStrategies = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  question_difficulty?: number | null;
  question_point_value?: number | null;
  question_type?: string | null;
  sort?: number | null;
  status: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QuestionResults = {
  correct_ans_select_multiple_checkbox?: unknown | null;
  correct_ans_select_radio?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  is_flagged?: boolean | null;
  option_number?: number | null;
  point_value?: number | null;
  practice_session_id?: string | PracticeSessions | null;
  question_in_paper_id?: number | PaperSectionsQuestions | null;
  question_type?: string | null;
  score?: number | null;
  sort?: number | null;
  submit_ans_select_multiple_checkbox?: unknown | null;
  submit_ans_select_radio?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type Questions = {
  analysis?: string | null;
  correct_ans_select_multiple_checkbox?: unknown | null;
  correct_ans_select_radio?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  difficulty?: number | null;
  id: string;
  knowledge_points: any[] | QuestionsKnowledgePoints[];
  q_mc?: string | QMc | null;
  q_mc_binary?: string | QMcBinary | null;
  q_mc_flexible?: string | QMcFlexible | null;
  q_mc_multi?: string | QMcMulti | null;
  q_mc_single?: string | QMcSingle | null;
  question_group?: string | QuestionGroups | null;
  review_status?: string | null;
  score?: number | null;
  sections: any[] | QuestionsSections[];
  sort?: number | null;
  sort_in_group?: number | null;
  status: string;
  stem?: string | null;
  title?: string | null;
  type: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QuestionsFillInBlank = {
  answers: any[] | QFillInBlankAnswers[];
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  question_text?: string | null;
  status: string;
  stem?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QuestionsFillInBlank1 = {
  correct_answer?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  question_text?: string | null;
  status: string;
  stem?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type QuestionsKnowledgePoints = {
  id: number;
  knowledge_points_id?: string | KnowledgePoints | null;
  questions_id?: string | Questions | null;
};

export type QuestionsSections = {
  id: number;
  questions_id?: string | Questions | null;
  sections_id?: string | Sections | null;
};

export type QuestionsSpreadsheet = {
  date_created?: string | null;
  date_updated?: string | null;
  handbook?: string | null;
  id: string;
  status: string;
  task?: string | null;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type Sections = {
  child_nodes: any[] | Sections[];
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  knowledge_points: any[] | SectionsKnowledgePoints[];
  level?: number | null;
  parent_node?: string | Sections | null;
  section_number?: string | null;
  sort?: number | null;
  status: string;
  textbooks?: string | Textbooks | null;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type SectionsKnowledgePoints = {
  id: number;
  knowledge_points_id?: string | KnowledgePoints | null;
  sections_id?: string | Sections | null;
};

export type Students = {
  class?: string | Classes | null;
  date_created?: string | null;
  date_updated?: string | null;
  directus_user?: string | DirectusUsers | null;
  email: string;
  id: string;
  name?: string | null;
  number?: number | null;
  password?: string | null;
  status: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type Subjects = {
  date_created?: string | null;
  date_updated?: string | null;
  description?: string | null;
  id: string;
  sort?: number | null;
  status: string;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type Teachers = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  name?: string | null;
  sort?: number | null;
  status: string;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
};

export type Textbooks = {
  author?: string | null;
  course?: string | Courses | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  sort?: number | null;
  status: string;
  title?: string | null;
  user_created?: string | DirectusUsers | null;
  user_updated?: string | DirectusUsers | null;
  version?: string | null;
};

export type CustomDirectusTypes = {
  articles: Articles[];
  articles_knowledge_points: ArticlesKnowledgePoints[];
  articles_sections: ArticlesSections[];
  classes: Classes[];
  courses: Courses[];
  courses_teachers: CoursesTeachers[];
  directus_access: DirectusAccess[];
  directus_activity: DirectusActivity[];
  directus_collections: DirectusCollections[];
  directus_comments: DirectusComments[];
  directus_dashboards: DirectusDashboards[];
  directus_extensions: DirectusExtensions[];
  directus_fields: DirectusFields[];
  directus_files: DirectusFiles[];
  directus_flows: DirectusFlows[];
  directus_folders: DirectusFolders[];
  directus_migrations: DirectusMigrations[];
  directus_notifications: DirectusNotifications[];
  directus_operations: DirectusOperations[];
  directus_panels: DirectusPanels[];
  directus_permissions: DirectusPermissions[];
  directus_policies: DirectusPolicies[];
  directus_presets: DirectusPresets[];
  directus_relations: DirectusRelations[];
  directus_revisions: DirectusRevisions[];
  directus_roles: DirectusRoles[];
  directus_sessions: DirectusSessions[];
  directus_settings: DirectusSettings;
  directus_shares: DirectusShares[];
  directus_translations: DirectusTranslations[];
  directus_users: DirectusUsers[];
  directus_versions: DirectusVersions[];
  directus_webhooks: DirectusWebhooks[];
  exercises: Exercises[];
  exercises_students: ExercisesStudents[];
  institutions: Institutions[];
  knowledge_points: KnowledgePoints[];
  knowledge_points_knowledge_points: KnowledgePointsKnowledgePoints[];
  notices: Notices[];
  paper_instances: PaperInstances[];
  paper_section_strategies: PaperSectionStrategies[];
  paper_sections: PaperSections[];
  paper_sections_question_groups: PaperSectionsQuestionGroups[];
  paper_sections_questions: PaperSectionsQuestions[];
  paper_strategies: PaperStrategies[];
  papers: Papers[];
  practice_sessions: PracticeSessions[];
  q_fill_in_blank_answers: QFillInBlankAnswers[];
  q_mc: QMc[];
  q_mc_binary: QMcBinary[];
  q_mc_flexible: QMcFlexible[];
  q_mc_multi: QMcMulti[];
  q_mc_single: QMcSingle[];
  q_spreadsheet_scoring_groups: QSpreadsheetScoringGroups[];
  q_spreadsheet_scoring_items: QSpreadsheetScoringItems[];
  question_groups: QuestionGroups[];
  question_mistakes: QuestionMistakes[];
  question_point_assign_strategies: QuestionPointAssignStrategies[];
  question_results: QuestionResults[];
  questions: Questions[];
  questions_fill_in_blank: QuestionsFillInBlank[];
  questions_fill_in_blank_1: QuestionsFillInBlank1[];
  questions_knowledge_points: QuestionsKnowledgePoints[];
  questions_sections: QuestionsSections[];
  questions_spreadsheet: QuestionsSpreadsheet[];
  sections: Sections[];
  sections_knowledge_points: SectionsKnowledgePoints[];
  students: Students[];
  subjects: Subjects[];
  teachers: Teachers[];
  textbooks: Textbooks[];
};
