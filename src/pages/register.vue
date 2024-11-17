<template>
    <div>
        <h1>Registration</h1>
        <input type="email" placeholder="Your E-Mail Address" v-model="email" />
        <input type="password" placeholder="Your Password" v-model="password" />
        <button @click="onSubmit">Register</button>
    </div>
</template>

<script setup lang="ts">
const { register } = useDirectusAuth();

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
