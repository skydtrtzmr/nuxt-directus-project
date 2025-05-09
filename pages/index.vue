<template>
    <div class="home-container">
        <header class="header">
            <div class="header-content">
                <h1 class="logo">学练考系统</h1>
                <nav class="main-nav">
                    <ul>
                        <li><router-link to="/" class="nav-link active">首页</router-link></li>
                        <li><router-link to="/auth/login" class="nav-link">登录</router-link></li>
                        <li><router-link to="/auth/register" class="nav-link">注册</router-link></li>
                        <li><router-link to="/about" class="nav-link">关于我们</router-link></li>
                    </ul>
                </nav>
            </div>
        </header>

        <main class="main-content">
            <section class="hero-section">
                <div class="hero-content">
                    <h2 class="hero-title">提升学习效率，助力考试成功</h2>
                    <p class="hero-description">我们提供全面的学习资源、练习题库和模拟考试，帮助您取得优异成绩</p>
                    <div class="hero-buttons">
                        <router-link to="/auth/register" class="btn btn-primary">免费注册</router-link>
                        <router-link to="/auth/login" class="btn btn-secondary">立即登录</router-link>
                    </div>
                </div>
                <div class="hero-image">
                    <img src="https://placehold.co/600x400" alt="学习场景插图" />
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
                <router-link to="/auth/register" class="btn btn-light">立即注册</router-link>
            </section>
        </main>

        <footer class="footer">
            <div class="footer-content">
                <div class="footer-logo">学练考系统</div>
                <div class="footer-links">
                    <h3>快速链接</h3>
                    <ul>
                        <li><router-link to="/">首页</router-link></li>
                        <li><router-link to="/auth/login">登录</router-link></li>
                        <li><router-link to="/auth/register">注册</router-link></li>
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
                <p>&copy; 2023 南京泰迪云智科技有限公司 版权所有</p>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    name: "Index",
    layout: "empty",
});

const router = useRouter();

</script>

<style scoped>
.home-container {
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    color: #333;
    line-height: 1.6;
}

/* 头部样式 */
.header {
    background: linear-gradient(to right, #4a6baf, #5a8acf);
    color: white;
    padding: 1rem 0;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
    color: #ffffff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.main-nav ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav-link {
    color: #ffffff;
    text-decoration: none;
    padding: 0.5rem 1rem;
    margin: 0 0.5rem;
    border-radius: 4px;
    transition: background-color 0.3s;
    font-weight: 500;
}

.nav-link:hover, .nav-link.active {
    background-color: rgba(255, 255, 255, 0.2);
}

/* 主要内容样式 */
.main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

/* 英雄区域 */
.hero-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 3rem 0;
    gap: 2rem;
}

.hero-content {
    flex: 1;
}

.hero-title {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #2a4b8d;
}

.hero-description {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: #666;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
}

.hero-image {
    flex: 1;
    display: flex;
    justify-content: center;
}

.hero-image img {
    max-width: 100%;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 按钮样式 */
.btn {
    display: inline-block;
    padding: 0.8rem 1.5rem;
    border-radius: 5px;
    text-decoration: none;
    font-weight: bold;
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
    border: 2px solid #4a6baf;
}

.btn-secondary:hover {
    background-color: #f0f5ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-light {
    background-color: #ffffff;
    color: #4a6baf;
    border: 2px solid #ffffff;
}

.btn-light:hover {
    background-color: rgba(255, 255, 255, 0.9);
    color: #2a4b8d;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 特色部分 */
.features-section {
    margin: 4rem 0;
}

.section-title {
    text-align: center;
    font-size: 2rem;
    margin-bottom: 3rem;
    color: #2a4b8d;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.feature-card {
    background-color: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s, box-shadow 0.3s;
    text-align: center;
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

/* 统计部分 */
.stats-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    margin: 4rem 0;
    background-color: #f5f9ff;
    padding: 3rem;
    border-radius: 10px;
}

.stat-item {
    text-align: center;
}

.stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #4a6baf;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 1.1rem;
    color: #666;
}

/* CTA部分 */
.cta-section {
    text-align: center;
    margin: 4rem 0;
    padding: 3rem;
    background: linear-gradient(to right, #4a6baf, #5a8acf);
    color: white;
    border-radius: 10px;
}

.cta-section h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #ffffff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.cta-section p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: #f0f5ff;
}

/* 页脚样式 */
.footer {
    background-color: #2a4b8d;
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 3rem;
}

.footer-logo {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #ffffff;
}

.footer-links h3, .footer-contact h3 {
    color: #ffffff;
    margin-bottom: 1rem;
    font-size: 1.3rem;
}

.footer-links ul {
    list-style: none;
    padding: 0;
}

.footer-links ul li {
    margin-bottom: 0.5rem;
}

.footer-links a {
    color: #e0e8f5;
    text-decoration: none;
    transition: color 0.3s;
}

.footer-links a:hover {
    color: white;
    text-decoration: underline;
}

.footer-contact p {
    color: #e0e8f5;
    margin-bottom: 0.5rem;
}

.footer-bottom {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 2rem 0;
    text-align: center;
    border-top: 1px solid #3a5b9f;
    margin-top: 2rem;
}

.footer-bottom p {
    color: #e0e8f5;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .hero-section {
        flex-direction: column;
    }
    
    .hero-content, .hero-image {
        text-align: center;
    }
    
    .hero-buttons {
        justify-content: center;
    }
    
    .features-grid {
        grid-template-columns: 1fr;
    }
    
    .stats-section {
        grid-template-columns: 1fr 1fr;
    }
    
    .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
    }
}
</style>
