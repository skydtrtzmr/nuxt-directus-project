<template>
    <div class="main-content">
        <div v-if="selectedQuestion">
            <h2>
                {{
                    selectedQuestion.submitted_paper_chapter
                        .source_paper_prototype_chapter.title
                }}
            </h2>
            <p>
                {{
                    selectedQuestion.submitted_paper_chapter
                        .source_paper_prototype_chapter.description
                }}
            </p>
            <hr />
            <h3>题目详情</h3>
            <p>{{ selectedQuestion.question }}</p>

            <!-- 这里可以显示题目选项，供用户选择 -->
            <div v-if="selectedQuestion.option_number">
                <p>选择题</p>
                <!-- <ul>
                        <li
                            v-for="option in selectedQuestion.options"
                            :key="option"
                        >
                            <input
                                type="radio"
                                :name="selectedQuestion.id"
                                :value="option"
                                v-model="selectedAnswer"
                            />
                            {{ option }}
                        </li>
                    </ul> -->
            </div>

            <!-- 其他题型，例如填空题 -->
            <div v-else>
                <textarea
                    v-model="selectedAnswer"
                    placeholder="输入答案..."
                ></textarea>
            </div>
        </div>

        <!-- 答题区：这里可以展示当前题目的答题区 -->
        <div v-if="selectedQuestion">
            <h3>答题区</h3>
            <p>请选择您的答案：</p>
            <textarea
                v-model="selectedAnswer"
                placeholder="输入答案..."
            ></textarea>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    selectedQuestion: Object | null,
});

const selectedAnswer = ref("");
</script>
