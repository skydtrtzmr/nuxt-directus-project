# Types

这个文件夹用于存放 TypeScript 类型定义文件。

有些数据模型不适合直接从API生成类型定义，比如引用其他数据模型的关系字段等。这些类型定义需要手动编写。

这些关系字段虽然存储为字符串，但实际上是表示关系，是对象引用。

所以需要用联合类型或泛型来定义。

## type/interface存储方式

关于是一个文件一个interface，或者一个文件多个interface。

最后还是决定一个文件多个interface，因为如果一个文件一个interface，那么公用的类型定义就需要复制到每个文件中，造成代码冗余。

## 2024-11-22更新

直接用[Relational Fields by maltejur · Pull Request #3 · maltejur/directus-extension-generate-types](https://github.com/maltejur/directus-extension-generate-types/pull/3)插件进行生成。不再手动编写类型定义。
