# 开发者文档

## 关于nuxt.config.ts

### vite.ssr.noExternal

在 Vite 的 SSR（服务端渲染）构建中，noExternal 的作用是这样的：

默认情况下，Vite 会将 node_modules 中的依赖包视为"外部依赖"（external），这意味着：

- 这些包不会被打包进最终的 SSR bundle
- 而是在运行时通过 require 动态引入
- 这样做可以减小构建体积，加快构建速度

但有些包必须被打包进 SSR bundle 中，原因可能是：

- 这些包可能包含 ESM（ES Modules）语法
- 或者包含需要特殊处理的代码（如 JSX）
- 或者包含特定的 CSS 引用
- 在运行时直接 require 会出问题

在我们的场景中：
@univerjs/presets 和 rxjs 就需要被打包进 SSR bundle，
因为它们包含了 ESM 语法和特殊的模块引用，
如果不设置 noExternal，在服务端渲染时就会出错。

所以，noExternal: ['@univerjs/presets', 'rxjs'] 的意思就是：
"这些包不要作为外部依赖，请将它们打包进 SSR bundle 中"。
这就是为什么这个配置对于在开发模式（pnpm dev）下正确运行 Univer 是必要的。
