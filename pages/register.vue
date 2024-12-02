<template>
    <div>
        <h1>注册页</h1>
        <input type="email" placeholder="输入邮箱" v-model="email" />
        <input type="password" placeholder="输入密码" v-model="password" />
        <button @click="onSubmit">点击注册</button>
    </div>
</template>

<script setup lang="ts">
const { register } = useDirectusAuth();
console.log('register');


const email = ref("");
const password = ref("");

const onSubmit = async () => {
    try {
        await register({ email: email.value, password: password.value });
        alert("Registered successfully");
    } catch (e) {
        alert("Registered failed");
    }
};
</script>
