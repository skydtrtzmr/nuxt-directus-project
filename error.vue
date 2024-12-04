<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps({
    error: Object as () => NuxtError,
});

const handleError = () => clearError({ redirect: "/" });
</script>

<template>
    <div>
        <h1>错误页面</h1>
        <h2>{{ error?.statusCode }}</h2>
        <p>{{ error?.message }}</p>
        <button @click="handleError">Clear errors</button>
    </div>
</template>
