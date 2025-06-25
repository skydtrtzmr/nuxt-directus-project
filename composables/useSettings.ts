import { useSettingsStore } from '~/stores/settings'
import type { AppSettings } from '~/types/settings'

/**
 * 用于获取应用设置的 composable
 * 提供了错误处理、默认值和缓存策略
 */
export const useSettings = () => {
  const settingsStore = useSettingsStore()

  /**
   * 获取设置数据（非阻塞式）
   * @param force 是否强制重新获取
   * @returns 响应式的设置数据
   */
  const getSettings = async (force = false) => {
    try {
      await settingsStore.fetchSettings(force)
    } catch (error) {
      console.warn('获取设置失败，使用默认值:', error)
    }
    
    return settingsStore.safeSettings
  }

  /**
   * 直接返回当前设置（立即可用）
   */
  const settings = computed(() => settingsStore.safeSettings)

  /**
   * 获取加载状态
   */
  const isLoading = computed(() => settingsStore.isLoading)

  /**
   * 获取错误信息
   */
  const error = computed(() => settingsStore.error)

  /**
   * 获取特定的设置值，并提供默认值
   */
  const getSetting = <K extends keyof AppSettings>(
    key: K, 
    defaultValue: AppSettings[K]
  ): ComputedRef<AppSettings[K]> => {
    return computed(() => {
      const value = settingsStore.safeSettings[key]
      return value !== null && value !== undefined ? value : defaultValue
    })
  }

  /**
   * 便捷的获取常用设置的方法
   */
  const getPortalName = () => getSetting('student_portal_name', '学习考试系统')
  const getCompanyName = () => getSetting('company_name', '教育科技有限公司')

  /**
   * 清除错误状态
   */
  const clearError = () => {
    settingsStore.clearError()
  }

  /**
   * 刷新设置数据
   */
  const refreshSettings = () => {
    settingsStore.invalidateCache()
    return getSettings(true)
  }

  // 如果是在客户端，自动开始获取数据
  if (process.client) {
    getSettings()
  }

  return {
    settings,
    getSettings,
    isLoading,
    error,
    getSetting,
    getPortalName,
    getCompanyName,
    clearError,
    refreshSettings
  }
}