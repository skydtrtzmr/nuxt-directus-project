import { ref, computed, onUnmounted } from "vue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export function useExamTimer() {
    // --- 内部状态 ---
    const countdownInterval_ref = ref<NodeJS.Timeout | null>(null); // 计时器实例

    // --- 响应式状态 ---
    const isLoading_ref = ref(true); // 加载状态，初始化时为 true
    const actualStartTime_iso_ref = ref<string>(""); // 从数据库或输入获取的原始 ISO 格式开始时间字符串
    const duration_mins_ref = ref(0); // 考试时长（分钟）
    const extraTime_mins_ref = ref(0); // 额外补偿时长（分钟）

    const examEndTime_dayjs_ref = ref<dayjs.Dayjs | null>(null); // 计算得出的 Dayjs 格式的考试结束时间
    const remainingSeconds_ref = ref(0); // 剩余总秒数
    const isTimeUp_ref = ref(false); // 标记考试时间是否已到

    // --- 计算属性 ---
    const formattedCountdown_ref = computed(() => {
        // 仅当尚未计算时显示加载中
        if (isLoading_ref.value && remainingSeconds_ref.value === 0) {
            return "时间加载中...";
        }
        // 如果时间已到或剩余秒数小于等于0，显示00:00:00
        if (isTimeUp_ref.value || remainingSeconds_ref.value <= 0) {
            return "00:00:00";
        }
        const totalSeconds = remainingSeconds_ref.value;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        // 格式化数字，确保两位数显示
        const pad = (num: number) => String(num).padStart(2, "0");
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    });

    // 格式化后的实际开始时间字符串，用于显示
    const formattedActualStartTime_ref = computed(() => {
        return actualStartTime_iso_ref.value
            ? dayjs(actualStartTime_iso_ref.value).format("MM-DD HH:mm:ss")
            : "未设置";
    });

    // 格式化后的考试结束时间字符串，用于显示
    const formattedExamEndTime_ref = computed(() => {
        return examEndTime_dayjs_ref.value
            ? examEndTime_dayjs_ref.value.format("MM-DD HH:mm:ss")
            : "未设置";
    });

    // --- 方法 ---
    // 初始化计时器
    const initializeTimer = (
        startTimeISO: string,
        durationMins: number,
        compensationMins: number
    ) => {
        isLoading_ref.value = true; // 开始加载
        isTimeUp_ref.value = false; // 重置时间到期状态
        remainingSeconds_ref.value = 0; // 重置剩余时间

        actualStartTime_iso_ref.value = startTimeISO;
        duration_mins_ref.value = Math.max(0, durationMins); // 确保时长非负
        extraTime_mins_ref.value = Math.max(0, compensationMins); // 确保补偿时长非负

        if (!startTimeISO) {
            console.error("[useExamTimer] Invalid start time (empty string):", startTimeISO);
            examEndTime_dayjs_ref.value = null;
            isLoading_ref.value = false;
            if (!isTimeUp_ref.value) {
                console.log("[useExamTimer] Setting isTimeUp_ref to true due to invalid start time (empty).");
                isTimeUp_ref.value = true;
            }
            remainingSeconds_ref.value = 0;
            return;
        }

        // 保留原有的结束时间计算逻辑:
        // const endTimeDate = new Date(actual_start_time.value);
        // endTimeDate.setMinutes(endTimeDate.getMinutes() + duration.value + extra_time.value);
        // expected_end_time_str.value = endTimeDate.toISOString();
        // examEndTime.value = dayjs(expected_end_time_str.value);

        const startTimeDate = new Date(actualStartTime_iso_ref.value);
        // 检查日期解析是否成功
        if (isNaN(startTimeDate.getTime())) {
            console.error("[useExamTimer] Invalid start time (date parsing failed):", startTimeISO);
            examEndTime_dayjs_ref.value = null;
            isLoading_ref.value = false;
            if (!isTimeUp_ref.value) {
                console.log("[useExamTimer] Setting isTimeUp_ref to true due to invalid start time (parsing).");
                isTimeUp_ref.value = true;
            }
            remainingSeconds_ref.value = 0;
            return;
        }

        startTimeDate.setMinutes(
            startTimeDate.getMinutes() +
                duration_mins_ref.value +
                extraTime_mins_ref.value
        );
        const expectedEndTimeStr = startTimeDate.toISOString();
        // ISO 字符串转 Dayjs 对象 (如果 ISO 字符串是 UTC，则 dayjs() 会隐式使用 UTC)
        const calculatedEndTime = dayjs(expectedEndTimeStr);

        if (!calculatedEndTime.isValid()) {
            console.error("[useExamTimer] Calculated end time is invalid (from ISO string):", expectedEndTimeStr);
            examEndTime_dayjs_ref.value = null;
            isLoading_ref.value = false;
            if (!isTimeUp_ref.value) {
                console.log("[useExamTimer] Setting isTimeUp_ref to true due to invalid calculated end time.");
                isTimeUp_ref.value = true;
            }
            remainingSeconds_ref.value = 0;
            return;
        }

        examEndTime_dayjs_ref.value = calculatedEndTime;
        isLoading_ref.value = false; // 加载完成
        _updateInterval(); // 调用一次以计算初始 remainingSeconds 和 isTimeUp 状态
    };

    // 内部方法：更新倒计时时间间隔
    const _updateInterval = () => {
        // 如果结束时间无效或仍在加载中，则不执行
        if (!examEndTime_dayjs_ref.value || isLoading_ref.value) {
            return;
        }

        const now = dayjs.utc(); // 获取当前 UTC 时间以进行比较
        const diffSeconds = examEndTime_dayjs_ref.value.diff(now, "second");

        if (diffSeconds <= 0) {
            remainingSeconds_ref.value = 0;
            if (!isTimeUp_ref.value) {
                console.log("[useExamTimer] Time is up! Setting isTimeUp_ref to true.");
                isTimeUp_ref.value = true;
            }
            stopCountdown(); // 调用暴露的停止方法
        } else {
            remainingSeconds_ref.value = diffSeconds;
            isTimeUp_ref.value = false; // 如果还有剩余时间，确保 isTimeUp 为 false
        }
    };

    // 将 _startCountdownInternal 重命名并公开为 startCountdown
    const startCountdown = () => {
        // 确保只在客户端执行
        if (!process.client) {
            console.warn("[useExamTimer] startCountdown called on server. Aborting.");
            return;
        }
        
        stopCountdown(); // 先清除已存在的计时器

        if (isLoading_ref.value) {
            console.warn("[useExamTimer] 无法启动倒计时: 数据仍在加载中");
            return;
        }
        if (!examEndTime_dayjs_ref.value || !examEndTime_dayjs_ref.value.isValid()) {
            console.error("[useExamTimer] 无法启动倒计时: 结束时间无效");
            if (!isTimeUp_ref.value) isTimeUp_ref.value = true;
            remainingSeconds_ref.value = 0;
            return;
        }

        _updateInterval(); // 立即执行一次更新

        if (examEndTime_dayjs_ref.value.isAfter(dayjs.utc()) && !countdownInterval_ref.value) {
            countdownInterval_ref.value = setInterval(_updateInterval, 1000);
        } else if (examEndTime_dayjs_ref.value.isBefore(dayjs.utc()) && !isTimeUp_ref.value) {
            if (!isTimeUp_ref.value) isTimeUp_ref.value = true; // 确保时间到期状态正确
            remainingSeconds_ref.value = 0;
        }
    };

    // 将 _stopCountdownInternal 重命名并公开为 stopCountdown
    const stopCountdown = () => {
        if (countdownInterval_ref.value) {
            clearInterval(countdownInterval_ref.value);
            countdownInterval_ref.value = null;
        }
    };

    // 组件卸载时清除计时器
    onUnmounted(() => {
        stopCountdown();
    });

    // 返回给外部使用的状态和方法
    return {
        isLoading: isLoading_ref,
        // 以计算属性形式暴露 actualStartTime，确保为 Dayjs 对象或 null
        actualStartTime: computed(() =>
            actualStartTime_iso_ref.value
                ? dayjs(actualStartTime_iso_ref.value)
                : null
        ),
        examEndTime: examEndTime_dayjs_ref, // 已经是 Dayjs 对象或 null
        remainingSeconds: remainingSeconds_ref,
        isTimeUp: isTimeUp_ref,

        formattedCountdown: formattedCountdown_ref, // 格式化后的倒计时字符串
        formattedActualStartTime: formattedActualStartTime_ref, // 格式化后的实际开始时间字符串
        formattedExamEndTime: formattedExamEndTime_ref, // 格式化后的考试结束时间字符串

        initializeTimer, // 初始化计时器方法
        startCountdown, // 暴露启动方法
        stopCountdown,  // 暴露停止方法
    };
}
