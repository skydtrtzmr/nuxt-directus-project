<template>
    <div>
        <h1>注册页</h1>
        <input type="email" placeholder="输入邮箱" v-model="email" />
        <input type="password" placeholder="输入密码" v-model="password" />
        <button @click="onSubmit">点击注册</button>
    </div>
</template>

<script setup lang="ts">
import { useAuth } from "~/stores/auth";

definePageMeta({
    // middleware: ["auth"],
    layout: "empty", // 登录时全屏显示，不需要侧边栏和顶部导航栏
});

const authStore = useAuth();
const router = useRouter();

const email = ref("");
const password = ref("");

const onSubmit = async () => {
    try {
        await authStore.register({
            email: email.value,
            password: password.value,
        });
        // 注册并登录成功后，跳转到首页
        // (跳转逻辑已在 authStore.register -> login 中处理)
        alert("注册成功！");
    } catch (e) {
        console.error(e);
        alert("注册失败");
    }
};
</script>
