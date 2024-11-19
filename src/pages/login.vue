<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuth } from '@/stores/auth';
const auth = useAuth();
const { isLoggedIn, user } = storeToRefs(auth)

const email = ref("");
const password = ref("");

let error_message = "";

const onSubmit = async () => {
	try {
		await auth.login({ email: email.value, password: password.value });
        alert("登录成功！");
	} catch (e) {
        error_message = "登录信息错误！";
        alert(error_message);
    }
};

</script>

<template>
    <div>
        <h1>登录页</h1>
        <input type="email" placeholder="输入邮箱" v-model="email"/>
        <input type="password" placeholder="输入密码" v-model="password"/>
        <button @click="onSubmit">点击登录</button>
    </div>
    <div>
        <p>{{ isLoggedIn }}</p>
    </div>
    <div style="margin-top: 55px" v-if="user"> 
        <h1>当前用户</h1> 
        <pre>{{ user }}</pre> 
        
    </div>
</template>