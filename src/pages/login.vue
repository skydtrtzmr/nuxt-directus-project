<template>
    <div>
        <h1>Login</h1>
        <input type="email" placeholder="Your E-Mail Address" v-model="email"/>
        <input type="password" placeholder="Your Password" v-model="password"/>
        <button @click="onSubmit">Login</button>
    </div>
    <div style="margin-top: 55px" v-if="user"> 
        <h1>Current User</h1> 
        <pre>{{ user }}</pre> 
        
    </div>
</template>

<script setup lang="ts">
const { login } = useDirectusAuth();
const user = useDirectusUser(); 

const email = ref("");
const password = ref("");

let error_message = "";

const onSubmit = async () => {
	try {
		await login({ email: email.value, password: password.value });
        alert("Login successfully");
	} catch (e) {
        error_message = "登录信息错误！";
        alert(error_message);
    }
};
</script>