// server/utils/directusUtils.ts
import directus_client from "~~/server/lib/directus"; // 引入 Directus 客户端
import { readUsers, readItems } from "@directus/sdk";

interface FetchPaginatedParams {
    collection: string; // 表名
    fields: string[]; // 查询的字段
    // sort?: string[] | null; // 排序方式
    // pageSize: number; // 每页的数据条数
}

// TODO 这里后面其实可以改一下。其实只要加上limit=-1，就会返回所有数据了，不需要手动拼凑页数。
export async function fetchAllPaginatedData({
    collection,
    fields,
    // sort,
}: // pageSize,
FetchPaginatedParams): Promise<any[]> {
    let allData: any[] = [];
    let page = 1;
    let hasMoreData = true;
    let pageSize = 100; // 默认每页100条数据

    while (hasMoreData) {
        // 获取当前页的数据
        const currentData = await directus_client.request(
            readItems(collection, {
                fields,
                page,
                limit: pageSize, // 根据每页大小调整
            })
        );

        // 将当前页的数据合并到所有数据中
        allData = allData.concat(currentData);

        // 判断是否还有下一页的数据
        if (currentData.length < pageSize) {
            hasMoreData = false; // 如果返回的数据少于pageSize，表示没有更多数据了
        } else {
            page += 1; // 否则继续请求下一页
        }
    }

    return allData; // 返回合并后的所有数据
}
