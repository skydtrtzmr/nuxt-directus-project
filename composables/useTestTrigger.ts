import { useRuntimeConfig } from "#app";
import { useDirectusItems } from "#imports"; // Nuxt auto-imports

/**
 * 从 Directus 检查是否应启用测试模式。
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
