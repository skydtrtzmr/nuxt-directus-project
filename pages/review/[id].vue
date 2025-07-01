<!-- pages/review/[id].vue -->
<template>
    <ExamPage :exam_page_mode="exam_page_mode"/>
</template>

<script setup lang="ts">
// 如果当前用户未登录或者token失效，则跳转到登录页面
definePageMeta({
    // middleware: ["auth"],
    layout: "empty", // 考试时全屏显示，不需要侧边栏和顶部导航栏
});

const {
    public: {
        dify: { baseApiUrl, chatbotRag },
    },
} = useRuntimeConfig();

const exam_page_mode = ref("review"); // 考试模式，practice表示练习模式，exam表示考试模式

// 虽然可以在这里获取路由参数传给ExamPage，但是暂时直接让ExamPage自己获取也能用，先不改了。

// // 路由参数：practice_session 的 ID
// const route = useRoute();
// // const practice_session_id = route.params.id;
// // 加入预处理参数：在路由守卫或组件加载时，无论是单个值还是数组，都统一解析为单个值。
// const practice_session_id = Array.isArray(route.params.id)
//     ? route.params.id[0]
//     : route.params.id;

// 使用 useHead 注入 Dify 聊天组件的脚本和样式
useHead({
    script: [
        {
            innerHTML: `
                window.difyChatbotConfig = {
                    token: '${chatbotRag}',
                    baseUrl: '${baseApiUrl}',
                    systemVariables: {
                        // user_id: 'YOU CAN DEFINE USER ID HERE',
                        // conversation_id: 'YOU CAN DEFINE CONVERSATION ID HERE, IT MUST BE A VALID UUID',
                    },
                    userVariables: {
                        // avatar_url: 'YOU CAN DEFINE USER AVATAR URL HERE',
                        // name: 'YOU CAN DEFINE USER NAME HERE',
                    },
                }
            `,
            type: 'text/javascript'
        },
        {
            src: `${baseApiUrl}/embed.min.js`,
            id: chatbotRag,
            defer: true
        }
    ],
    style: [
        {
            innerHTML: `
                #dify-chatbot-bubble-button {
                    background-color: #1C64F2 !important;
                }
                #dify-chatbot-bubble-window {
                    width: 24rem !important;
                    height: 40rem !important;
                }
            `
        }
    ]
});
</script>

<style scoped></style>
