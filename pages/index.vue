<template>
    <div class="home-container">
        <header class="header">
            <div class="header-content">
                <h1 class="logo">{{ settings.student_portal_name }}</h1>
                <nav class="main-nav">
                    <ul>
                        <li>
                            <router-link to="/" class="nav-link active"
                                >首页</router-link
                            >
                        </li>
                        <li>
                            <router-link to="/auth/login" class="nav-link"
                                >登录</router-link
                            >
                        </li>
                        <li>
                            <router-link to="/auth/register" class="nav-link"
                                >注册</router-link
                            >
                        </li>
                        <li>
                            <router-link to="/about" class="nav-link"
                                >关于我们</router-link
                            >
                        </li>
                    </ul>
                </nav>
            </div>
        </header>

        <main class="main-content">
            <section class="hero-section">
                <div class="hero-content">
                    <h2 class="hero-title">提升学习效率，助力考试成功</h2>
                    <p class="hero-description">
                        我们提供全面的学习资源、练习题库和模拟考试，帮助您取得优异成绩
                    </p>
                    <div class="hero-buttons">
                        <router-link to="/auth/register" class="btn btn-primary"
                            >免费注册</router-link
                        >
                        <router-link to="/auth/login" class="btn btn-secondary"
                            >立即登录</router-link
                        >
                    </div>
                </div>
                <div class="hero-image">
                    <img
                        src="https://placehold.co/600x400"
                        alt="学习场景插图"
                    />
                </div>
            </section>

            <section class="features-section">
                <h2 class="section-title">我们的特色</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">📚</div>
                        <h3>丰富的学习资源</h3>
                        <p>覆盖各个学科和考试类型的全面学习材料</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">✏️</div>
                        <h3>专业的练习系统</h3>
                        <p>针对性强的练习题目，帮助巩固知识点</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🧠</div>
                        <h3>智能模拟考试</h3>
                        <p>模拟真实考试环境，提前适应考试氛围</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3>详细的学习分析</h3>
                        <p>通过数据分析，找出学习中的薄弱环节</p>
                    </div>
                </div>
            </section>

            <section class="stats-section">
                <div class="stat-item">
                    <div class="stat-number">10,000+</div>
                    <div class="stat-label">学习资源</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">5,000+</div>
                    <div class="stat-label">考试题目</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">50,000+</div>
                    <div class="stat-label">注册用户</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">98%</div>
                    <div class="stat-label">用户满意度</div>
                </div>
            </section>

            <section class="cta-section">
                <h2>准备好提升你的学习体验了吗？</h2>
                <p>加入我们的学习平台，开启成功之旅</p>
                <router-link to="/auth/register" class="btn btn-light"
                    >立即注册</router-link
                >
            </section>
        </main>

        <footer class="footer">
            <div class="footer-content">
                <div class="footer-logo">{{ settings.student_portal_name }}</div>
                <div class="footer-links">
                    <h3>快速链接</h3>
                    <ul>
                        <li><router-link to="/">首页</router-link></li>
                        <li>
                            <router-link to="/auth/login">登录</router-link>
                        </li>
                        <li>
                            <router-link to="/auth/register">注册</router-link>
                        </li>
                        <li><router-link to="/about">关于我们</router-link></li>
                    </ul>
                </div>
                <div class="footer-contact">
                    <h3>联系我们</h3>
                    <p>邮箱: contact@xueliankaosystem.com</p>
                    <p>电话: 400-123-4567</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2023 {{ settings.company_name }} 版权所有</p>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { setBlockTracking } from "vue";
import { set } from "zod";

const { settings } = useSettings();

definePageMeta({
    name: "Index",
    layout: "empty",
});

const router = useRouter();
</script>

<style lang="scss" scoped>
@import "@/assets/styles/pages/index.scss";
</style>
