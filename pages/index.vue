<template>
    <div class="home">
        <header>
            <h1>欢迎来到我们的首页!</h1>
            <nav>
                <ul>
                    <li><router-link to="/">首页</router-link></li>
                    <li><router-link to="/auth/login">登录</router-link></li>
                    <li><router-link to="/exams">考试</router-link></li>
                </ul>
            </nav>
        </header>

        <main>
            <section>
                <h2>最新消息</h2>
                <p>这里是一些最新的更新和消息。</p>
            </section>
            <section>
                <h2>我们的服务</h2>
                <p>我们提供多种服务以满足客户的需求。</p>
            </section>
        </main>
        <pre>{{ data }}</pre>

        <footer>
            <p>&copy; 版权所有。</p>
        </footer>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ["auth"],
    name: "Index",
});

const router = useRouter();

const { data } = await useFetch("/api/hello");

// 获取环境变量，确定是否运行测试
const {
    public: { isTest },
} = useRuntimeConfig();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
onMounted(async () => {
    if (isTest) {
        // 以下是用于测试的自动操作脚本
        // Only for testing
        await nextTick();
        console.log("测试自动操作脚本开始。");

        await delay(2000);
        console.log("跳转到exams页面。");

        router.push("/exams");
        await delay(1000);
    }
});
</script>

<style scoped>
.home {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}

header {
    background: #90b2d7;
    color: white;
    padding: 20px;
}

nav ul {
    list-style-type: none;
    padding: 0;
}

nav ul li {
    display: inline;
    margin: 0 15px;
}

footer {
    margin-top: 20px;
    font-size: 12px;
}
</style>
