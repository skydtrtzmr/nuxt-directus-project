<template>
    <div class="countdown">
        <!-- <p>当前时间: {{ dayjs().format("YYYY-MM-DD HH:mm:ss") }}</p> -->
        <!-- 不要直接在这里写时间，会导致客户端和服务器时间不一致。 -->
        <p v-if="isClient">
            当前时间: {{ dayjs().format("YYYY-MM-DD HH:mm:ss") }}
        </p>
        <p>
            结束时间:
            {{ dayjs(examEndTime).format("YYYY-MM-DD HH:mm:ss") }}
        </p>
        <p>剩余时长: {{ formattedCountDown }}</p>
    </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const props = defineProps<{
    isClient: boolean;
    examEndTime: dayjs.Dayjs;
    formattedCountDown: string;
}>();

console.log("examEndTime in ExamCountdown.vue:");
console.log(dayjs(props.examEndTime).format("YYYY-MM-DD HH:mm:ss"));


</script>

<style scoped></style>
