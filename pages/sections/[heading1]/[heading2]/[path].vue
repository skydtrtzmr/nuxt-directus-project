<template>
    <div>content: {{ content }}</div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
const route = useRoute();
console.log("route.params:");
console.log(route.params);

console.log("route.fullPath:");
console.log(route.fullPath);

const content = ref("");

const { getItemById, getItems, updateItem } = useDirectusItems();
const path = route.fullPath.replace("/sections", "");
// 要获取的是不包含/sections的路径

console.log("path:");
console.log(path);

// 注意如果是中文的话，需要对路径进行encodeURIComponent编码
// 例如：
const path_encoded = encodeURIComponent(path);
console.log("path_encoded:");
console.log(path_encoded);

const fetchSubmittedExam = async () => {
    const submittedExamResponse = await getItems<any>({
        collection: "sections",
        params: {
            fields: ["id", "title", "path", "content"], // 获取考试的状态和关联的试卷
            filter: {
                path: path_encoded,
            },
        },
    });
    console.log("submittedExamResponse:");
    console.log(submittedExamResponse);
    
    
    content.value = submittedExamResponse[0].content;
};

onMounted(async () => {
    await fetchSubmittedExam();
});
</script>

<style scoped></style>
