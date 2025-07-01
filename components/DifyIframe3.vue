<template>
    <div>
        <iframe
            :src="`${baseApiUrl}/chatbot/${scenarioBasedChatbotRag}`"
            style="width: 100%; height: 100%; min-height: 700px"
            frameborder="0"
            allow="microphone"
        >
        </iframe>
    </div>
</template>

<script lang="ts" setup>
const {
    public: {
        dify: { baseApiUrl, scenarioBasedChatbotRag },
    },
} = useRuntimeConfig();

</script>

<style></style>
