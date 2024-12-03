<script setup lang="ts">
// TODO 现存Bug就是，state存储的登录状态和实际登录状态不一致，token失效后，页面会显示已登录，但实际上并未登录。
import { storeToRefs } from "pinia";
import { useAuth } from "~~/stores/auth";
import { ref } from "vue";
import PracticeAgain from "~/assets/icons/practice-again.svg";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { useToast } from "primevue/usetoast";
import { z } from "zod";

definePageMeta({
    // middleware: ["auth"],
    layout: "empty", // 登录时全屏显示，不需要侧边栏和顶部导航栏
});

const email = ref("");
const password = ref("");
const checked = ref(false);

const auth = useAuth();
const { isLoggedIn, user } = storeToRefs(auth);

const router = useRouter();

let error_message = "";

const toast = useToast();
const initialValues = ref({
    email: "",
    password: "",
});
const resolver = ref(
    zodResolver(
        z.object({
            email: z
                .string()
                .min(6, { message: "邮箱不可以少于 6 个字符。" })
                .email({ message: "请输入有效的邮箱。" }),
            password: z
                .string()
                .min(3, { message: "密码至少需要 4 个字符。" })
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

        router.push("/");
    } catch (e) {
        error_message = "登录信息错误！";
        alert(error_message);
    }
};
</script>

<template>
    <div
        class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden"
    >
        <div class="flex flex-col items-center justify-center">
            <div
                style="
                    border-radius: 56px;
                    padding: 0.3rem;
                    background: linear-gradient(
                        180deg,
                        var(--primary-color) 10%,
                        rgba(33, 150, 243, 0) 30%
                    );
                "
            >
                <div
                    class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20"
                    style="border-radius: 53px"
                >
                    <div class="text-center mb-8">
                        <PracticeAgain
                            class="w-200 h-200 mb-8 w-16 shrink-0 mx-auto"
                            :fontControlled="false"
                        />
                        <div
                            class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4"
                        >
                            欢迎使用学练考系统！
                        </div>
                        <span class="text-muted-color font-medium"
                            >登录以继续学习</span
                        >
                    </div>
                    <Form
                        v-slot="$form"
                        :resolver="resolver"
                        :initialValues="initialValues"
                        @submit="onFormSubmit"
                    >
                        <label
                            for="email1"
                            class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"
                            >邮箱</label
                        >
                        <div class="w-full md:w-[30rem] mb-8">
                            <InputGroup class="mb-2">
                                <InputGroupAddon
                                    ><i
                                        class="pi pi-envelope"
                                    ></i></InputGroupAddon
                                ><InputText
                                    id="email1"
                                    name="email"
                                    v-model="email"
                                    type="text"
                                    placeholder="请输入账号对应邮箱"
                            /></InputGroup>
                            <Message
                                v-if="$form.email?.invalid"
                                severity="error"
                                size="small"
                                variant="simple"
                                >{{ $form.email.error?.message }}</Message
                            >
                            <!-- 如果没有错误，显示一个占位的空Message -->
                            <Message
                                v-else
                                severity="error"
                                size="small"
                                variant="simple"
                                class="opacity-0"
                            >
                                空的占位符，透明的！
                            </Message>
                        </div>

                        <label
                            for="password1"
                            class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2"
                            >密码</label
                        >
                        <div class="w-full md:w-[30rem] mb-8">
                            <InputGroup class="mb-2"
                                ><InputGroupAddon
                                    ><i
                                        class="pi pi-credit-card"
                                    ></i></InputGroupAddon
                                ><Password
                                    id="password1"
                                    name="password"
                                    placeholder="请输入账号密码"
                                    v-model="password"
                                    :feedback="false"
                                    :toggleMask="true"
                                    fluid
                            /></InputGroup>
                            <Message
                                v-if="$form.password?.invalid"
                                severity="error"
                                size="small"
                                variant="simple"
                                >{{ $form.password.error?.message }}</Message
                            >
                            <Message
                                v-else
                                severity="error"
                                size="small"
                                variant="simple"
                                class="opacity-0"
                            >
                                空的占位符，透明的！
                            </Message>
                        </div>
                        <div
                            class="flex items-center justify-between mt-2 mb-8 gap-8"
                        >
                            <div class="flex items-center">
                                <Checkbox
                                    v-model="checked"
                                    id="rememberme1"
                                    binary
                                    class="mr-2"
                                ></Checkbox>
                                <label for="rememberme1">记住我</label>
                            </div>
                            <span
                                class="font-medium no-underline ml-2 text-right cursor-pointer text-primary"
                                >忘记密码？</span
                            >
                        </div>
                        <Button
                            type="submit"
                            severity="secondary"
                            label="登录"
                            class="w-full"
                        />
                    </Form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
