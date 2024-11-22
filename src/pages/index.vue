<template>
    <div class="home">
        <header>
            <h1>欢迎来到我们的首页!</h1>
            <nav>
                <ul>
                    <li><router-link to="/">首页</router-link></li>
                    <li><router-link to="/about">关于我们</router-link></li>
                    <li><router-link to="/contact">联系我们</router-link></li>
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

        <footer>
            <p>&copy; 版权所有。</p>
        </footer>
    </div>
</template>

<script>
export default {
    name: "Index",
};
</script>

<style scoped>
.home {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}

header {
    background: #35495e;
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
