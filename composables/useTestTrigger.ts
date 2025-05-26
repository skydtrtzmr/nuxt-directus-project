import { useRuntimeConfig } from '#app';

/**
 * @interface SystemSettingsDirectus
 * @description 定义从 Directus 'system_settings' 集合预期的单例项数据结构。
 * @property {boolean} is_test_environment - 指示是否应激活测试环境的布尔标志。
 *                                          请确保此字段名与您在 Directus 集合中定义的字段名一致。
 */
interface SystemSettingsDirectus {
    is_test_environment: boolean;
    // 您可以在此添加 'system_settings' 集合中的其他字段（如果需要）
}

/**
 * 从 Directus 检查是否应启用测试模式。
 *
 * 此函数会尝试从 Directus 的 'system_settings' 集合中获取配置。
 * 它假设 'system_settings' 是一个单例集合 (Singleton Collection)，
 * 并且其中包含一个名为 'is_test_environment' 的布尔字段。
 *
 * @returns {Promise<boolean>} 如果应运行测试则返回 true，否则返回 false。
 *                             如果发生错误或未正确配置，默认为 false。
 */
export async function checkDirectusTestMode(): Promise<boolean> {
    const config = useRuntimeConfig();
    const directusUrl = config.public.directus?.url as string | undefined;
    const directusToken = config.public.directus?.token as string | undefined; // 如果您的API需要认证

    if (!directusUrl) {
        console.warn('Automation: Directus URL (NUXT_PUBLIC_DIRECTUS_URL) is not configured in nuxt.config.ts. Automation will not run based on Directus setting.');
        return false;
    }

    // 目标API端点。
    // 假设 'system_settings' 是您在 Directus 中用于存储此配置的单例集合的名称。
    // 如果您的集合名称不同，请修改下面的 'system_settings'。
    const apiUrl = `${directusUrl}/items/system_settings`;

    try {
        const headers: Record<string, string> = {};
        if (directusToken) {
            headers['Authorization'] = `Bearer ${directusToken}`;
        }

        // 对于单例集合，Directus 通常直接返回该项的数据，并包含在 'data' 属性中。
        // 请确保 SystemSettingsDirectus 接口与您的 Directus 'system_settings' 集合的实际字段匹配。
        const response = await $fetch<{ data: SystemSettingsDirectus }>(apiUrl, {
            method: 'GET',
            headers,
            // 如果您的 'system_settings' 不是单例，或者需要特定查询参数，
            // 您可能需要添加 params 对象，例如:
            // params: { fields: 'is_test_environment', 'filter[status][_eq]': 'published' }
        });

        if (response && response.data && typeof response.data.is_test_environment === 'boolean') {
            console.log(`Automation: Fetched 'is_test_environment' from Directus: ${response.data.is_test_environment}`);
            return response.data.is_test_environment;
        } else {
            console.warn("Automation: Could not determine test mode from Directus. 'is_test_environment' field might be missing, not a boolean, or data is not in the expected format. Response:", response);
            return false;
        }
    } catch (error) {
        console.error('Automation: Error fetching test mode from Directus:', error);
        return false; // 发生错误时，默认不运行测试
    }
} 