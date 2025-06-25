import { delay } from "./domHelpers";

/**
 * 带有重试逻辑的 fetch 请求封装。
 * @param url - 请求的 URL。
 * @param options - fetch 请求的选项。
 * @param retryOptions - 重试相关的配置。
 * @returns - 返回 fetch 的响应 Promise。
 */
export async function fetchWithRetry<T>(
    url: string,
    fetchOptions: any = {},
    retryOptions: { maxRetries?: number; delayMs?: number } = {}
): Promise<T> {
    const { maxRetries = 5, delayMs = 1000 } = retryOptions;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response: T = await $fetch(url, fetchOptions);
            return response;
        } catch (error) {
            attempt++;
            console.warn(
                `Automation: Fetch failed for ${url}. Attempt ${attempt} of ${maxRetries}.`,
                error
            );
            if (attempt >= maxRetries) {
                console.error(
                    `Automation: Fetch failed for ${url} after ${maxRetries} attempts. Giving up.`
                );
                throw error; // 重试次数用尽后，抛出最终错误
            }
            if (delayMs > 0) {
                await delay(delayMs);
            }
        }
    }
    // This part should be unreachable if maxRetries > 0
    throw new Error(`Automation: fetchWithRetry logic error for ${url}.`);
} 