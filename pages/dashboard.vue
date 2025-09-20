<template>
    <div class="dashboard-container">
        <div class="dashboard-header">
            <h1 class="page-title">个人控制台</h1>
            <!-- <div class="welcome-message">欢迎回来，<span class="user-name">{{ userName }}</span></div> -->
        </div>

        <div class="dashboard-stats">
            <div class="stat-card">
                <div class="stat-icon">📝</div>
                <div class="stat-value">{{ stats.completedExams }}</div>
                <div class="stat-label">已完成考试</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏱️</div>
                <div class="stat-value">{{ stats.totalHours }}小时</div>
                <div class="stat-label">学习时长</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-value">{{ stats.ranking }}</div>
                <div class="stat-label">当前排名</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-value">{{ stats.averageScore }}</div>
                <div class="stat-label">平均分数</div>
            </div>
        </div>

        <div class="dashboard-content">
            <div class="dashboard-section">
                <div class="section-header">
                    <h2>进行中的考试</h2>
                    <router-link to="/exams" class="view-all">查看全部</router-link>
                </div>
                <div v-if="exams.length > 0" class="exam-cards">
                    <div v-for="exam in exams" :key="exam.id" class="exam-card">
                        <div class="exam-title">{{ exam.title }}</div>
                        <div class="exam-info">
                            <div class="exam-time">
                                时长: {{ exam.duration }}分钟
                            </div>
                            <div class="exam-due">
                                截止时间: {{ formatDate(exam.dueDate) }}
                            </div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress" :style="{ width: `${exam.progress}%` }"></div>
                        </div>
                        <div class="exam-progress-text">
                            完成度: {{ exam.progress }}%
                        </div>
                        <router-link :to="`/exams/${exam.id}`" class="btn btn-primary">继续考试</router-link>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <div class="empty-icon">📋</div>
                    <div class="empty-message">暂无进行中的考试</div>
                    <router-link to="/exams" class="btn btn-primary">浏览可用考试</router-link>
                </div>
            </div>

            <div class="dashboard-section">
                <div class="section-header">
                    <h2>最近学习活动</h2>
                </div>
                <div v-if="activities.length > 0" class="activity-list">
                    <div v-for="activity in activities" :key="activity.id" class="activity-item">
                        <div class="activity-icon" :class="activity.type">
                            <span v-if="activity.type === 'exam'">📝</span>
                            <span v-else-if="activity.type === 'practice'">✏️</span>
                            <span v-else>📚</span>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">
                                {{ activity.title }}
                            </div>
                            <div class="activity-description">
                                {{ activity.description }}
                            </div>
                            <div class="activity-time">
                                {{ formatTime(activity.time) }}
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-message">暂无学习活动记录</div>
                    <router-link to="/study" class="btn btn-primary">开始学习</router-link>
                </div>
            </div>
        </div>

        <!-- <div class="dashboard-section recommendations-section">
            <div class="section-header">
                <h2>推荐学习</h2>
            </div>
            <div class="recommendations">
                <div
                    v-for="recommendation in recommendations"
                    :key="recommendation.id"
                    class="recommendation-card"
                >
                    <div class="recommendation-image">
                        <img
                            :src="recommendation.image"
                            :alt="recommendation.title"
                        />
                    </div>
                    <div class="recommendation-content">
                        <div class="recommendation-title">
                            {{ recommendation.title }}
                        </div>
                        <div class="recommendation-description">
                            {{ recommendation.description }}
                        </div>
                        <div class="recommendation-meta">
                            <span class="recommendation-type">{{
                                recommendation.type
                            }}</span>
                            <span class="recommendation-duration">{{
                                recommendation.duration
                            }}</span>
                        </div>
                        <router-link
                            :to="recommendation.link"
                            class="btn btn-secondary"
                            >查看详情</router-link
                        >
                    </div>
                </div>
            </div>
        </div> -->
    </div>
</template>

<script setup lang="ts">

import { useAuth } from "~~/stores/auth";
definePageMeta({
    // middleware: ["auth"],
    name: "Dashboard",
});


const { $directus } = useNuxtApp();

const auth = useAuth();
const refreshToken = ref(auth.refresh_token);

// 模拟用户数据
const userName = ref("张三");

// 模拟统计数据
const stats = ref({
    completedExams: 12,
    totalHours: 36,
    ranking: "前10%",
    averageScore: 85,
});

// 模拟考试数据
const exams = ref([
    {
        id: 1,
        title: "初级会计实务期中考试",
        duration: 120,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        progress: 60,
    },
    {
        id: 2,
        title: "经济法基础测试",
        duration: 45,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        progress: 25,
    },
]);

// 模拟活动数据
const activities = ref([
    {
        id: 1,
        type: "exam",
        title: "完成了经济法基础模拟测试",
        description: "得分: 92/100",
        time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
        id: 2,
        type: "practice",
        title: "完成了经济法基础练习",
        description: "正确率: 85%",
        time: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
        id: 3,
        type: "study",
        title: "学习了初级会计实务基础知识",
        description: "学习时长: 45分钟",
        time: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
]);

// 模拟推荐数据
const recommendations = ref([
    {
        id: 1,
        title: "初级会计实务进阶课程",
        description: "深入理解初级会计实务和线性代数的核心概念",
        type: "课程",
        duration: "8小时",
        image: "https://placehold.co/300x200",
        link: "/courses/1",
    },
    {
        id: 2,
        title: "英语四级词汇强化",
        description: "系统掌握英语四级核心词汇",
        type: "练习",
        duration: "3小时",
        image: "https://placehold.co/300x200",
        link: "/practices/2",
    },
    {
        id: 3,
        title: "计算机基础模拟考试",
        description: "全真模拟，提前适应考试环境",
        type: "考试",
        duration: "90分钟",
        image: "https://placehold.co/300x200",
        link: "/exams/3",
    },
]);

// 格式化日期
const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
    });
};

// 格式化时间
const formatTime = (time: Date) => {
    const now = new Date();
    const diff = now.getTime() - time.getTime();

    if (diff < 60 * 60 * 1000) {
        // 不到1小时
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes}分钟前`;
    } else if (diff < 24 * 60 * 60 * 1000) {
        // 不到1天
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours}小时前`;
    } else {
        // 超过1天
        return time.toLocaleDateString("zh-CN", {
            month: "2-digit",
            day: "2-digit",
        });
    }
};

// 添加socket功能

const saveRefreshToken = (token: string) => {
    refreshToken.value = token
    localStorage.setItem('directus_refresh_token', token)
}
onMounted(() => {
    const storedToken = localStorage.getItem('directus_refresh_token')
    if (storedToken) {
        refreshToken.value = storedToken
        // $directus.connect()
        $directus.onWebSocket('open', () => {
            $directus.sendMessage({
                type: 'auth',
                refresh_token: storedToken
            })
        })
    } else {
        // $directus.connect()
    }


    const cleanup = $directus.onWebSocket('message', (message) => {
        if (message.type === 'auth' && message.status === 'ok') {
            saveRefreshToken(message.refresh_token)
        }
    })

    onBeforeUnmount(cleanup)
})


</script>

<style scoped>
.dashboard-container {
    padding: 1.5rem;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.page-title {
    font-size: 1.8rem;
    font-weight: 600;
    color: #2a4b8d;
    margin: 0;
}

.welcome-message {
    font-size: 1.1rem;
    color: #666;
}

.user-name {
    font-weight: bold;
    color: #4a6baf;
}

/* 统计卡片样式 */
.dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2.5rem;
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
    font-size: 2rem;
    margin-bottom: 0.8rem;
}

.stat-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: #4a6baf;
    margin-bottom: 0.3rem;
}

.stat-label {
    color: #666;
    font-size: 0.9rem;
}

/* 内容区域样式 */
.dashboard-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2.5rem;
}

.dashboard-section {
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.2rem;
}

.section-header h2 {
    font-size: 1.3rem;
    color: #2a4b8d;
    margin: 0;
}

.view-all {
    color: #4a6baf;
    text-decoration: none;
    font-size: 0.9rem;
}

.view-all:hover {
    text-decoration: underline;
}

/* 考试卡片样式 */
.exam-cards {
    display: grid;
    gap: 1rem;
}

.exam-card {
    background: #f7f9fc;
    border-radius: 8px;
    padding: 1.2rem;
    transition: transform 0.2s;
}

.exam-card:hover {
    transform: translateY(-3px);
}

.exam-title {
    font-weight: 600;
    margin-bottom: 0.8rem;
    color: #333;
}

.exam-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 1rem;
}

.progress-bar {
    height: 8px;
    background: #e0e8f5;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress {
    height: 100%;
    background: linear-gradient(to right, #4a6baf, #5a8acf);
}

.exam-progress-text {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 1rem;
    text-align: right;
}

/* 活动列表样式 */
.activity-list {
    display: grid;
    gap: 1rem;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    padding: 0.8rem;
    border-radius: 8px;
    background: #f7f9fc;
    transition: background-color 0.2s;
}

.activity-item:hover {
    background: #f0f5ff;
}

.activity-icon {
    margin-right: 1rem;
    font-size: 1.5rem;
}

.activity-content {
    flex: 1;
}

.activity-title {
    font-weight: 500;
    margin-bottom: 0.3rem;
}

.activity-description {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.3rem;
}

.activity-time {
    font-size: 0.8rem;
    color: #888;
}

/* 推荐区域样式 */
.recommendations-section {
    margin-bottom: 0;
}

.recommendations {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.recommendation-card {
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
}

.recommendation-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.recommendation-image {
    height: 150px;
    overflow: hidden;
}

.recommendation-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.recommendation-content {
    padding: 1.2rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.recommendation-title {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
}

.recommendation-description {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 1rem;
    flex: 1;
}

.recommendation-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    color: #888;
}

/* 空状态样式 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
    color: #888;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.empty-message {
    margin-bottom: 1.5rem;
}

/* 按钮样式 */
.btn {
    display: inline-block;
    padding: 0.6rem 1.2rem;
    border-radius: 5px;
    text-decoration: none;
    font-weight: 500;
    text-align: center;
    transition: all 0.3s;
}

.btn-primary {
    background-color: #4a6baf;
    color: white;
}

.btn-primary:hover {
    background-color: #3a5b9f;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
    background-color: white;
    color: #4a6baf;
    border: 1px solid #4a6baf;
}

.btn-secondary:hover {
    background-color: #f0f5ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .dashboard-content {
        grid-template-columns: 1fr;
    }

    .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .welcome-message {
        margin-top: 0.5rem;
    }

    .recommendations {
        grid-template-columns: 1fr;
    }
}
</style>
