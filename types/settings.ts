/**
 * 应用设置类型定义
 * 包含项目实际使用的设置字段
 */
export interface AppSettings {
  // 学生门户名称
  student_portal_name: string
  // 公司名称
  company_name: string
  // 其他可能的设置字段
  app_version?: string
  maintenance_mode?: boolean
  max_upload_size?: number
  session_timeout?: number
  default_language?: string
  theme_color?: string
  logo_url?: string
  contact_email?: string
  support_phone?: string
}

/**
 * 设置的默认值
 */
export const DEFAULT_SETTINGS: AppSettings = {
  student_portal_name: '学习考试系统',
  company_name: '教育科技有限公司',
  app_version: '1.0.0',
  maintenance_mode: false,
  max_upload_size: 10485760, // 10MB
  session_timeout: 3600, // 1小时
  default_language: 'zh-CN',
  theme_color: '#6366f1',
  logo_url: '',
  contact_email: '',
  support_phone: ''
} 