import { useRuntimeConfig } from "#app";
import { useDirectusItems } from "#imports"; // Nuxt auto-imports
import { useSettingsStore } from "~/stores/settings";

/**
 * 从 Directus 检查是否应启用测试模式。
 * 此函数现在通过 useSettingsStore 获取数据，以利用缓存。
 *
 * @returns {Promise<boolean>} 如果应运行测试则返回 true，否则返回 false。
 *                             如果发生错误或未正确配置，默认为 false。
 */
export async function checkDirectusTestMode(): Promise<boolean> {
    // 使用 Pinia store 来获取设置
    const settingsStore = useSettingsStore();

    try {
        // fetchSettings 会处理缓存逻辑
        await settingsStore.fetchSettings();
        
        const isTestEnv = settingsStore.settings?.is_test_env;

        if (typeof isTestEnv === "boolean") {
            console.log(
                `Automation: Fetched 'is_test_env' from Settings Store: ${isTestEnv}`
            );
            return isTestEnv;
        } else {
            console.warn(
                "Automation: Could not determine test mode from Settings Store. 'is_test_env' field might be missing, not a boolean, or data is not in the expected format. Current settings:",
                settingsStore.settings
            );
            return false;
        }
    } catch (error) {
        console.error(
            "Automation: Error fetching test mode via Settings Store:",
            error
        );
        return false; // 发生错误时，默认不运行测试
    }
}
