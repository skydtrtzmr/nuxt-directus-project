<template>
    <SessionList mode="practice" />
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ["auth"],
});
</script>
