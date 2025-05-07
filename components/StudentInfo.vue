<template>
    <div class="student-info bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
        <div class="flex items-center space-x-2">
            <i class="pi pi-user text-primary text-lg"></i>
            <div class="flex-1">
                <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ studentData.name }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>学号：{{ studentData.student_number }}</div>
                    <div>邮箱：{{ studentData.email }}</div>
                    <!-- <div>班级：{{ studentData.className }}</div> -->
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    studentData: {
        name: string;
        student_number: number;
        email: string;
        className: string;
    };
}>();
</script>

<style scoped>
.student-info {
    transition: all 0.3s ease;
}

.student-info:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style> 