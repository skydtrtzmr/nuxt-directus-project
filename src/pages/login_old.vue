<template>
    <div>
        <h1>登录页</h1>
        <input type="email" placeholder="输入邮箱" v-model="email"/>
        <input type="password" placeholder="输入密码" v-model="password"/>
        <button @click="onSubmit">点击登录</button>
    </div>
    <div style="margin-top: 55px" v-if="user"> 
        <h1>当前用户</h1> 
        <pre>{{ user }}</pre> 
        
    </div>
</template>

<script setup lang="ts">
const { login } = useDirectusAuth();
const user = useDirectusUser();
console.log('user.value');
console.log(user.value);


const email = ref("");
const password = ref("");

let error_message = "";

const onSubmit = async () => {
	try {
		await login({ email: email.value, password: password.value });
        alert("登录成功！");
	} catch (e) {
        error_message = "登录信息错误！";
        alert(error_message);
    }
};

// 用了pinia之后，就不再像上面那样写了，而是将登录逻辑从组件抽离到 Pinia Store 中。
// 具体的登录逻辑可以参考 src/stores/auth.ts 文件。
</script>