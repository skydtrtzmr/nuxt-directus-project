<template>
    <div class="card">
        <Dialog
            v-model:visible="not_started_dialog_visible"
            modal
            header="提示"
            :style="{ width: '25rem' }"
        >
            <span class="text-surface-500 dark:text-surface-400 block mb-8"
                >未到考试开始时间！</span
            >
            <div class="flex justify-end gap-2">
                <Button
                    type="button"
                    label="确定"
                    @click="not_started_dialog_visible = false"
                ></Button>
            </div>
        </Dialog>
        <Dialog
            v-model:visible="have_ended_dialog_visible"
            modal
            header="提示"
            :style="{ width: '25rem' }"
        >
            <span class="text-surface-500 dark:text-surface-400 block mb-8"
                >已过考试结束时间！</span
            >
            <div class="flex justify-end gap-2">
                <Button
                    type="button"
                    label="确定"
                    @click="have_ended_dialog_visible = false"
                ></Button>
            </div>
        </Dialog>
        <DataView
            :value="submittedExams"
            :layout="layout"
            dataKey="submittedExams.id"
        >
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
                                <Tag
                                    :value="getSubmitStatusName(item)"
                                    :severity="getSubmitStatus(item)"
                                ></Tag>
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
                                        <div class="text-xl font-medium mt-2">
                                            {{ item.exam.title }}
                                        </div>
                                    </div>
                                    <div
                                        class="bg-surface-100 p-1"
                                        style="border-radius: 10px"
                                    >
                                        <div
                                            class="bg-surface-0 flex items-center gap-2 justify-center py-1 px-2"
                                            style="
                                                border-radius: 10px;
                                                box-shadow: 0px 1px 2px 0px
                                                        rgba(0, 0, 0, 0.04),
                                                    0px 1px 2px 0px
                                                        rgba(0, 0, 0, 0.06);
                                            "
                                        >
                                            <span>
                                                <strong>开始时间:</strong>
                                                {{
                                                    dayjs(
                                                        item.exam.start_time
                                                    ).format(
                                                        "YYYY-MM-DD HH:mm:ss"
                                                    )
                                                }}
                                            </span>
                                            <span>
                                                <strong>结束时间:</strong>
                                                {{
                                                    dayjs(
                                                        item.exam.end_time
                                                    ).format(
                                                        "YYYY-MM-DD HH:mm:ss"
                                                    )
                                                }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-col md:items-end gap-8">
                                    <span class="text-xl font-semibold"
                                        >考试时长{{ item.price }}</span
                                    >
                                    <div
                                        class="flex flex-row-reverse md:flex-row gap-2"
                                    >
                                        <Button
                                            icon="pi pi-info-circle"
                                            outlined
                                        ></Button>
                                        <Button
                                            @click="joinExam(item.id)"
                                            class="join-button flex-auto md:flex-initial whitespace-nowrap"
                                            :disabled="
                                                getSubmitStatusName(item) ==
                                                '已交卷'
                                            "
                                        >
                                            {{ getSubmitStatusAction(item) }}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <template #grid="slotProps">
                <div class="grid grid-cols-12 gap-4">
                    <!-- 总共分为12列 -->
                    <div
                        v-for="(item, index) in slotProps.items"
                        :key="index"
                        class="col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3 p-2"
                        ref="gridItems"
                    >
                        <!-- 根据屏幕尺寸，决定每行显示的数量 -->
                        <!-- 尺寸从大到小分别是：sm/md/lg/xl/2xl -->
                        <div
                            class="p-6 border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 rounded flex flex-col"
                        >
                            <div class="pt-6">
                                <div
                                    class="flex flex-row justify-between items-start gap-2"
                                >
                                    <div class="text-xl font-medium mt-1">
                                        {{ item.exam.title }}
                                    </div>
                                    <!-- Tag设为shrink-0，不许它被压缩！ -->
                                    <Tag
                                        class="shrink-0"
                                        :value="getSubmitStatusName(item)"
                                        :severity="getSubmitStatus(item)"
                                    ></Tag>
                                </div>
                                <div class="flex flex-col gap-2 mt-6">
                                    <div>
                                        <strong>开始时间:</strong>
                                        <div>
                                            {{
                                                dayjs(
                                                    item.exam.start_time
                                                ).format("YYYY-MM-DD HH:mm:ss")
                                            }}
                                        </div>
                                    </div>
                                    <div>
                                        <strong>结束时间:</strong>
                                        <div>
                                            {{
                                                dayjs(
                                                    item.exam.end_time
                                                ).format("YYYY-MM-DD HH:mm:ss")
                                            }}
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <Button
                                            :key="item.id"
                                            @click="joinExam(item.id)"
                                            class="join-button flex-auto whitespace-nowrap"
                                            :disabled="
                                                getSubmitStatusName(item) ==
                                                '已交卷'
                                            "
                                        >
                                            {{ getSubmitStatusAction(item) }}
                                        </Button>
                                        <Button
                                            icon="pi pi-info-circle"
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
import dayjs from "dayjs";
import { useAuth } from "~~/stores/auth";
import type {
    SubmittedExams,
    SubmittedPapers,
    Exams,
} from "~~/types/directus_types";
import type { HintedString } from "@primevue/core";

const gridItems = ref([]);
console.log("gridItems.value");
console.log(gridItems.value);
const submittedExams = ref<SubmittedExams[]>([]);
const auth = useAuth();
const current_user = auth.user; // 获取当前用户
console.log("current_user:\n", current_user);

if (!current_user) {
    const router = useRouter();
    router.push("/auth/login");
}

// 这两个控制能否参加考试的弹窗
const not_started_dialog_visible = ref(false);
const have_ended_dialog_visible = ref(false);

const { getItems, updateItem } = useDirectusItems();
// 如果当前用户未登录，或者token失效，则跳转到登录页面
definePageMeta({
    middleware: ["auth"],
});

const layout = ref<"grid" | "list" | undefined>("grid"); // 默认显示为网格
const options = ref(["list", "grid"]);

const fetchSubmittedExams = async () => {
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
                    directus_user: current_user!.id,
                },
            },
            // 注意！别弄混了，directus中student.id和directus_user.id不一样。
        },
    });
    submittedExams.value = submitted_exams;
};

const updateSubmitStatus = async (submitted_exam: SubmittedExams) => {
    try {
        const newItem = { submit_status: "doing" };
        await updateItem<SubmittedExams>({
            collection: "submitted_exams",
            id: submitted_exam.id,
            item: newItem,
        });
    } catch (e) {}
};

const submitActualStartTime = async (submitted_exam: SubmittedExams) => {
    try {
        let nowData = dayjs();
        const newItem = { actual_start_time: nowData };
        await updateItem<SubmittedExams>({
            collection: "submitted_exams",
            id: submitted_exam.id,
            item: newItem,
        });
    } catch (e) {}
};

const joinExam = (examId: string) => {
    // 首先判断考试时间
    console.log("当前时间：");
    console.log(dayjs(Date.now()));
    const now_time = dayjs(Date.now());

    const exam_info = submittedExams.value.find((item) => item.id === examId)!;

    // 注意因为exam可能是字符串或对象，要用“as”来断言类型
    console.log("考试开始时间：");
    const exam_start_time = dayjs((exam_info.exam as Exams).start_time);
    console.log(dayjs((exam_info.exam as Exams).start_time));

    console.log("考试结束时间：");
    const exam_end_time = dayjs((exam_info.exam as Exams).end_time);
    console.log(dayjs((exam_info.exam as Exams).end_time));

    if (now_time.isBefore(exam_start_time)) {
        not_started_dialog_visible.value = true;
        console.log("未到考试开始时间！");

        return;
    }

    if (now_time.isAfter(exam_end_time)) {
        have_ended_dialog_visible.value = true;
        console.log("已过考试结束时间！");

        return;
    }

    console.log(`参加考试：${examId}`);
    // 参加考试之后，需要修改submit_status为doing。
    updateSubmitStatus(
        submittedExams.value.find((item) => item.id === examId)!
    );

    // 只有第一次才记录实际开始时间，以后就不再记录了。

    if (exam_info.actual_start_time === null) {
        submitActualStartTime(
            submittedExams.value.find((item) => item.id === examId)!
        );
    }

    // 你可以根据examId跳转到具体的考试页面
    // 这里的 router.push 必须是 this.$router.push 或者使用 composable useRouter()
    // 如果使用 useRouter，需要引入并使用
    const router = useRouter();
    router.push(`/exam/${examId}`);
    // 跳转到具体的考试页面，页面path的最后一项就是submitted_exams的id。
};

const getSubmitStatus = (
    submitted_exam: SubmittedExams
):
    | HintedString<
          "secondary" | "success" | "info" | "warn" | "danger" | "contrast"
      >
    | undefined => {
    switch (submitted_exam.submit_status) {
        case "done":
            return "success";

        case "doing":
            return "warn";

        case "todo":
            return "danger";

        default:
            return "info";
    }
};

const getSubmitStatusName = (submitted_exam: SubmittedExams) => {
    switch (submitted_exam.submit_status) {
        case "done":
            return "已交卷";

        case "doing":
            return "答题中";

        case "todo":
            return "未答题";

        default:
            return null;
    }
};

const getSubmitStatusAction = (submitted_exam: SubmittedExams) => {
    switch (submitted_exam.submit_status) {
        case "done":
            return "答题完成";

        case "doing":
            return "继续答题";

        case "todo":
            return "开始答题";

        default:
            return null;
    }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
onMounted(async () => {
    await fetchSubmittedExams(); // 注意要await！确保submittedExams.value已经被赋值
    await nextTick(); // 确保 DOM 渲染完成

    // 筛选出标题为特定内容的循环项
    const targetItemTitle = "自动化测试专用考试"; // 需要筛选的标题
    console.log("submittedExams.value");
    console.log(submittedExams.value);
    await delay(2000);
    // 注意，下面获得的并不直接是Button，而是其父级div。
    const targetGirdDiv: HTMLElement|null = gridItems.value.find((button, index) => {
        const item = submittedExams.value[index]; // 获取对应的项
        console.log("item.??");
        console.log(item);
        
        return (item.exam as Exams).title === targetItemTitle;
    })||null;
    await delay(2000);

    console.log("targetGirdDiv1");

    // 模拟点击目标按钮
    if (targetGirdDiv && typeof targetGirdDiv == "object") {
        console.log("targetGirdDiv");
        console.log(targetGirdDiv);
        const firstButton = (targetGirdDiv as HTMLElement).querySelector('button');
        console.log("firstButton");
        console.log(firstButton);
        firstButton!.click();

    } else {
        console.log("没有找到目标按钮");
    }
});
</script>
