<script setup lang="ts">
defineProps<{
    companyName: string;
}>();
</script>

<template>
    <div class="layout-footer">
        版权所有 © 2022
        <a
            href="https://www.baidu.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary font-bold hover:underline"
            >{{ companyName }}</a
        >
    </div>
</template>
