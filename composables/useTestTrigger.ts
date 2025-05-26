import { useRuntimeConfig } from "#app";
import { useDirectusItems } from "#imports"; // Nuxt auto-imports

/**
 * @interface SystemSettingsDirectus
 * @description 定义从 Directus 'system_settings' 集合预期的单例项数据结构。
 * @property {boolean} is_test_env - 指示是否应激活测试环境的布尔标志。
 *                                          请确保此字段名与您在 Directus 集合中定义的字段名一致。
 */
interface SystemSettingsDirectus {
    is_test_env: boolean;
    // 您可以在此添加 'system_settings' 集合中的其他字段（如果需要）
}

/**
 * 从 Directus 检查是否应启用测试模式。
 *
 * 此函数会尝试从 Directus 的 'system_settings' 集合中获取配置。
 * 它假设 'system_settings' 是一个单例集合 (Singleton Collection)，
 * 并且其中包含一个名为 'is_test_env' 的布尔字段。
 *
 * @returns {Promise<boolean>} 如果应运行测试则返回 true，否则返回 false。
 *                             如果发生错误或未正确配置，默认为 false。
 */
export async function checkDirectusTestMode(): Promise<boolean> {
    const { getSingletonItem } = useDirectusItems();
    try {
        const response: any = await getSingletonItem({
            collection: "settings",
        });
        if (
            response &&
            typeof response.is_test_env === "boolean"
        ) {
            console.log(
                `Automation: Fetched 'is_test_env' from Directus: ${response.is_test_env}`
            );
            return response.is_test_env;
        } else {
            console.warn(
                "Automation: Could not determine test mode from Directus. 'is_test_env' field might be missing, not a boolean, or data is not in the expected format. Response:",
                response
            );
            return false;
        }
    } catch (error) {
        console.error(
            "Automation: Error fetching test mode from Directus:",
            error
        );
        return false; // 发生错误时，默认不运行测试
    }
}
