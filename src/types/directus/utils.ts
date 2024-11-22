// 文件路径：types/directus/utils.ts

// 定义Relation类型，用于处理Directus API中返回的关联数据
export type Relation<T> = T | string;
// 注意，不要把null写在Relation类型里，否则容易造成类型错误。

// 定义Relations类型，用于处理Directus API中返回的关联数据数组
export type Relations<T> = Array<Relation<T>>;