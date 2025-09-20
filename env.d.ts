/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly API_URL: string;
}
  
interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// 作用：
// 给 Vite 项目的环境变量补充类型声明；
// 让 TypeScript 知道 .env 文件里有哪些自定义变量（比如 API_URL），
// 并且能在 import.meta.env 下安全使用；
// 本质上是 开发体验增强，不影响运行时。
