<template>
    <div>content: {{ data }}</div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import type { Sections } from "~/types/directus_types";
const route = useRoute();
console.log("route.params:");
console.log(route.params);

const pathList = route.params.path; // 路径列表，形如["初级会计实务", "第1章", "第一节"]

console.log("route.fullPath:");
console.log(route.fullPath);

const content = ref("");

const { getItemById, getItems, updateItem } = useDirectusItems();
let path = route.fullPath;
// 要获取的是不包含/sections的路径

path = path.replace("/sections", "");

const fetchSubmittedExam = async () => {
    let currentContent = "";
    let parentId: string | null = null; // 初始先从没有parent的最上层开始
    for (let pathItem of pathList) {
        const filter = parentId
            ? {
                  title: pathItem,
                  parent_node: parentId,
              }
            : { title: pathItem, parent_node: { _null: true } };
        const sections: Sections[] = await getItems<Sections>({
            collection: "sections",
            params: {
                fields: ["id", "title", "path", "content"], // 获取考试的状态和关联的试卷
                filter: filter,
            },
        });
        console.log("sections:");
        console.log(sections);
        parentId = sections[0].id;
        currentContent = sections[0].content || "";
    }
    return currentContent;
};

const { data } = await useAsyncData('sectionContent', fetchSubmittedExam);
// 使用useAsyncData函数，使得页面加载时，先获取数据，再渲染页面

onMounted(async () => {
    // await fetchSubmittedExam(); // 如果放在这里，就是客户端渲染，数据获取会导致页面闪烁
});
</script>

<style scoped></style>
