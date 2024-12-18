let userIndex = 0; // 计数器

export default defineEventHandler((event) => {
    userIndex += 1; // 计数器自增
    console.log("userIndex: ", userIndex);
    return userIndex; // 每次请求递增计数器并返回
    
});
