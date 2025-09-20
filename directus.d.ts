/// <reference types="@directus/extensions/api.d.ts" />
interface DirectusSchema {
    messages: Message[];
}
interface Message {
    id: number;
    content: string;
    user_created: string;
    date_created: string;
}


// 全局声明：
// interface 不加 export → 全局可用
// 项目中任何地方都可以直接使用 DirectusSchema 或 Message
// 不需要 import
// 通常用于类型增强 / 全局类型
// 比如扩展第三方库类型（这里扩展了 @directus/extensions/api）
// 定义全局 schema 或全局 API 对象类型
// 不会被模块作用域隔离
// 和 .ts 文件不同，.d.ts 是 声明文件，主要目的是 告诉 TS 有这些类型存在