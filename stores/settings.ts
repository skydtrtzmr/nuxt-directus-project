import { defineStore } from "pinia";
import type { AppSettings } from "~/types/settings";
import { DEFAULT_SETTINGS } from "~/types/settings";

interface SettingsState {
    settings: AppSettings | null;
    isLoading: boolean;
    error: string | null;
    lastFetchTime: number | null;
}

export const useSettingsStore = defineStore("settings", {
    state: (): SettingsState => ({
        settings: null,
        isLoading: false,
        error: null,
        lastFetchTime: null,
    }),

    getters: {
        // 提供默认值，确保页面不会因为数据缺失而崩溃
        safeSettings(): AppSettings {
            return this.settings || DEFAULT_SETTINGS;
        },

        isDataStale(): boolean {
            if (!this.lastFetchTime) return true;
            // 数据超过5分钟认为过期
            return Date.now() - this.lastFetchTime > 5 * 60 * 1000;
        },
    },

    actions: {
        async fetchSettings(force = false) {
            // 安全检查：如果在服务器端，但不在请求上下文中，则跳过获取
            if (import.meta.server && !useRequestEvent()) {
                console.warn(
                    "fetchSettings a été appelé en dehors d'un contexte de requête côté serveur. L'extraction est ignorée."
                );
                return this.settings || this.safeSettings;
            }

            // 如果数据还新鲜且不强制刷新，直接返回
            if (this.settings && !this.isDataStale && !force) {
                return this.settings;
            }

            // 如果正在加载中，等待当前请求完成
            if (this.isLoading) {
                return new Promise((resolve) => {
                    const checkLoading = () => {
                        if (!this.isLoading) {
                            resolve(this.settings);
                        } else {
                            setTimeout(checkLoading, 100);
                        }
                    };
                    checkLoading();
                });
            }

            this.isLoading = true;
            this.error = null;

            try {
                const { $directus, $readSingleton } = useNuxtApp();

                // 设置超时时间，避免无限等待
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("请求超时")), 10000)
                );

                const fetchPromise = $directus.request(
                    $readSingleton("global")
                );

                const settings = (await Promise.race([
                    fetchPromise,
                    timeoutPromise,
                ])) as AppSettings;

                this.settings = settings;
                this.lastFetchTime = Date.now();
                this.error = null;

                return settings;
            } catch (error) {
                console.error("获取系统设置失败:", error);
                this.error =
                    error instanceof Error ? error.message : "获取设置失败";

                // 如果是首次加载失败，返回默认值
                if (!this.settings) {
                    this.settings = this.safeSettings;
                }

                return this.settings;
            } finally {
                this.isLoading = false;
            }
        },

        // 清除缓存，强制重新获取
        invalidateCache() {
            this.lastFetchTime = null;
        },

        // 重置错误状态
        clearError() {
            this.error = null;
        },
    },
});
