let userIndex = 0; // 计数器

export default defineEventHandler((event) => {
    return ++userIndex; // 每次请求递增计数器并返回
});
