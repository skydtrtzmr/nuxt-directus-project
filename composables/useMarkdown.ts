import markdownit from "markdown-it";

// 在 composable 作用域内创建 markdown-it 单例
// 这样，整个应用只会有一个 md 实例
const md = markdownit({
    html: true, // 在源码中启用 HTML 标签
    breaks: true, // 将段落中的 '\n' 转换成 <br>
    linkify: true, // 将类似链接的文本自动转换为链接
});

// 你还可以根据需要添加插件
// md.use(require('markdown-it-attrs')); // 例如：添加属性的插件
// md.use(require('markdown-it-highlightjs')); // 例如：代码高亮插件

export const useMarkdown = () => {
    const render = (content: string | null | undefined): string => {
        if (
            content === null ||
            content === undefined ||
            typeof content !== "string"
        ) {
            return "";
        }
        return md.render(content);
    };

    // 如果未来有其他 markdown 相关的功能，也可以从这里导出
    return {
        render,
        // mdInstance: md, // 如果需要直接访问实例，也可以导出
    };
};
