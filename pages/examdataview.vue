<template>
    <div class="card">
        <DataView :value="submitted_exams" :layout="layout">
            <template #header>
                <div class="flex justify-end">
                    <SelectButton
                        v-model="layout"
                        :options="options"
                        :allowEmpty="false"
                    >
                        <template #option="{ option }">
                            <i
                                :class="[
                                    option === 'list'
                                        ? 'pi pi-bars'
                                        : 'pi pi-table',
                                ]"
                            />
                        </template>
                    </SelectButton>
                </div>
            </template>

            <template #list="slotProps">
                <div class="flex flex-col">
                    <div v-for="(item, index) in slotProps.items" :key="index">
                        <div
                            class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
                            :class="{
                                'border-t border-surface-200 dark:border-surface-700':
                                    index !== 0,
                            }"
                        >
                            <div class="md:w-40 relative">
                                <!-- <img
                                    class="block xl:block mx-auto rounded w-full"
                                    :src="`https://primefaces.org/cdn/primevue/images/product/${item.image}`"
                                    :alt="item.exam.title"
                                /> -->
                                <div
                                    class="absolute bg-black/70 rounded-border"
                                    style="left: 4px; top: 4px"
                                >
                                    <Tag
                                        :value="item.submit_status"
                                        :severity="getSeverity(item)"
                                    ></Tag>
                                </div>
                            </div>
                            <div
                                class="flex flex-col md:flex-row justify-between md:items-center flex-1 gap-6"
                            >
                                <div
                                    class="flex flex-row md:flex-col justify-between items-start gap-2"
                                >
                                    <div>
                                        <!-- <span
                                            class="font-medium text-surface-500 dark:text-surface-400 text-sm"
                                            >{{ item.category }}</span
                                        > -->
                                        <div class="text-lg font-medium mt-2">
                                            {{ item.exam.title }}
                                        </div>
                                    </div>
                                    <div
                                        class="bg-surface-100 p-1"
                                        style="border-radius: 30px"
                                    >
                                        <div
                                            class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2"
                                            style="
                                                border-radius: 30px;
                                                box-shadow: 0px 1px 2px 0px
                                                        rgba(0, 0, 0, 0.04),
                                                    0px 1px 2px 0px
                                                        rgba(0, 0, 0, 0.06);
                                            "
                                        >
                                            <span
                                                class="text-surface-900 font-medium text-sm"
                                                >{{ item.rating }}</span
                                            >
                                            <i
                                                class="pi pi-star-fill text-yellow-500"
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-col md:items-end gap-8">
                                    <span class="text-xl font-semibold"
                                        >${{ item.price }}</span
                                    >
                                    <div
                                        class="flex flex-row-reverse md:flex-row gap-2"
                                    >
                                        <Button
                                            icon="pi pi-heart"
                                            outlined
                                        ></Button>
                                        <Button
                                            icon="pi pi-shopping-cart"
                                            label="Buy Now"
                                            :disabled="
                                                item.submit_status ===
                                                'todo'
                                            "
                                            class="flex-auto md:flex-initial whitespace-nowrap"
                                        ></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <template #grid="slotProps">
                <div class="grid grid-cols-12 gap-4">
                    <div
                        v-for="(item, index) in slotProps.items"
                        :key="index"
                        class="col-span-12 sm:col-span-6 md:col-span-4 xl:col-span-6 p-2"
                    >
                        <div
                            class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col"
                        >
                            <div
                                class="bg-surface-50 flex justify-center rounded p-4"
                            >
                                <div class="relative mx-auto">
                                    <img
                                        class="rounded w-full"
                                        :src="`https://primefaces.org/cdn/primevue/images/product/${item.image}`"
                                        :alt="item.exam.title"
                                        style="max-width: 300px"
                                    />
                                    <div
                                        class="absolute bg-black/70 rounded-border"
                                        style="left: 4px; top: 4px"
                                    >
                                        <Tag
                                            :value="item.submit_status"
                                            :severity="getSeverity(item)"
                                        ></Tag>
                                    </div>
                                </div>
                            </div>
                            <div class="pt-6">
                                <div
                                    class="flex flex-row justify-between items-start gap-2"
                                >
                                    <div>
                                        <span
                                            class="font-medium text-surface-500 dark:text-surface-400 text-sm"
                                            >{{ item.category }}</span
                                        >
                                        <div class="text-lg font-medium mt-1">
                                            {{ item.exam.title }}
                                        </div>
                                    </div>
                                    <div
                                        class="bg-surface-100 p-1"
                                        style="border-radius: 30px"
                                    >
                                        <div
                                            class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2"
                                            style="
                                                border-radius: 30px;
                                                box-shadow: 0px 1px 2px 0px
                                                        rgba(0, 0, 0, 0.04),
                                                    0px 1px 2px 0px
                                                        rgba(0, 0, 0, 0.06);
                                            "
                                        >
                                            <span
                                                class="text-surface-900 font-medium text-sm"
                                                >{{ item.rating }}</span
                                            >
                                            <i
                                                class="pi pi-star-fill text-yellow-500"
                                            ></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-col gap-6 mt-6">
                                    <span class="text-2xl font-semibold"
                                        >${{ item.price }}</span
                                    >
                                    <div class="flex gap-2">
                                        <Button
                                            icon="pi pi-shopping-cart"
                                            label="Buy Now"
                                            :disabled="
                                                item.submit_status ===
                                                'todo'
                                            "
                                            class="flex-auto whitespace-nowrap"
                                        ></Button>
                                        <Button
                                            icon="pi pi-heart"
                                            outlined
                                        ></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </DataView>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ProductService } from '@/service/ProductService';
import dayjs from "dayjs";
import { useAuth } from "~~/stores/auth";
import type {
    SubmittedExams,
    SubmittedPapers,
    Exams,
} from "~~/types/directus_types";
const auth = useAuth();
const current_user = auth.user; // 获取当前用户

onMounted(() => {
    ProductService.getProducts().then((data) => (products.value = data.slice(0, 12)));
});

const { getItems } = useDirectusItems();

const submitted_exams = await getItems<SubmittedExams>({
    collection: "submitted_exams",
    params: {
        fields: [
            "id",
            "exam.*",
            "extra_time",
            "actual_end_time",
            "actual_start_time",
            "participation_status",
            "submit_status",
            "student.*", // 要获得学生的详细信息，因为directus_user在student中。
        ],
        // 笔记：注意看，嵌套的字段（例如student.directus_user）要做筛选的话像下面这样。
        filter: {
            student: {
                directus_user: current_user.id,
            },
        },
        // 注意！别弄混了，directus中student.id和directus_user.id不一样。
    },
});

const products = ref();
const layout = ref('grid');
const options = ref(['list', 'grid']);

// 根据库存状态获取颜色
const getSeverity = (product) => {
    switch (product.submit_status) {
        case 'done':
            return 'success';

        case 'doing':
            return 'warn';

        case 'todo':
            return 'danger';

        default:
            return null;
    }
}
</script>
