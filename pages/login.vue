<template>
    <div>
        <h1>登录页</h1>
        <Form
            v-slot="$form"
            :resolver="resolver"
            :initialValues="initialValues"
            @submit="onFormSubmit"
            class="flex flex-col gap-4 w-full sm:w-64"
        >
            <div class="flex flex-col gap-1">
                <InputGroup>
                    <InputGroupAddon
                        ><i class="pi pi-envelope"></i></InputGroupAddon
                    ><InputText
                        name="email"
                        v-model="email"
                        type="text"
                        placeholder="请输入账号对应邮箱"
                /></InputGroup>
                <template v-if="$form.email?.invalid"
                    ><Message
                        v-if="$form.email?.invalid"
                        severity="error"
                        size="small"
                        variant="simple"
                        >{{ $form.email.error?.message }}</Message
                    ></template
                >
                <InputGroup
                    ><InputGroupAddon
                        ><i class="pi pi-credit-card"></i></InputGroupAddon
                    ><Password
                        name="password"
                        placeholder="请输入账号密码"
                        v-model="password"
                        :feedback="false"
                        fluid
                /></InputGroup>
                <template v-if="$form.password?.invalid">
                    <Message
                        v-for="(error, index) of $form.password.errors"
                        :key="index"
                        severity="error"
                        size="small"
                        variant="simple"
                        >{{ error.message }}</Message
                    >
                </template>
            </div>
            <Button type="submit" severity="secondary" label="Submit" />
        </Form>
    </div>
    <div>
        <p>{{ isLoggedIn }}</p>
    </div>
    <div style="margin-top: 55px" v-if="user">
        <h1>当前用户</h1>
        <pre>{{ user }}</pre>
    </div>
    <div v-if="isLoggedIn">
        <Button @click="auth.logout()">退出登录</Button>
    </div>
</template>

<script setup lang="ts">
// TODO 现存Bug就是，state存储的登录状态和实际登录状态不一致，token失效后，页面会显示已登录，但实际上并未登录。
import { storeToRefs } from "pinia";
import { useAuth } from "~~/stores/auth";

const auth = useAuth();
const { isLoggedIn, user } = storeToRefs(auth);

const email = ref("");
const password = ref("");

let error_message = "";

import { zodResolver } from "@primevue/forms/resolvers/zod";
import { useToast } from "primevue/usetoast";
import { z } from "zod";

const toast = useToast();
const initialValues = ref({
    password: "",
});
const resolver = ref(
    zodResolver(
        z.object({
            email: z
                .string()
                // .min(1, { message: "请输入账号对应邮箱。" })
                .email({ message: "请输入有效的邮箱。" }),
            password: z
                .string()
                .min(3, { message: "密码至少需要 3 个字符。" })
                .max(20, { message: "密码不能超过 20 个字符。" })
                // .refine((value: string) => /[a-z]/.test(value), {
                //     message: "密码必须包含小写字母。",
                // })
                // .refine((value: string) => /[A-Z]/.test(value), {
                //     message: "密码必须包含大写字母。",
                // })
                .refine((value: string) => /\d/.test(value), {
                    // 注意d前面有反斜杠，表示转义
                    message: "密码必须包含数字。",
                }),
        })
    )
);

// TODO 这里暂时写成any了，以后再优化
const onFormSubmit = ({ valid }: any) => {
    if (valid) {
        toast.add({
            severity: "success",
            summary: "Form is submitted.",
            life: 3000,
        });
        loginSubmit();
    }
};

const loginSubmit = async () => {
    try {
        await auth.login({ email: email.value, password: password.value });
        alert("登录成功！");
    } catch (e) {
        error_message = "登录信息错误！";
        alert(error_message);
    }
};
</script>
