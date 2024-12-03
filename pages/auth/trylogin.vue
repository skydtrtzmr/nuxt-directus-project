<script setup>
import { ref } from 'vue';
import PracticeAgain from "~/assets/icons/practice-again.svg";
definePageMeta({
    // middleware: ["auth"],
    layout: "empty", // 登录时全屏显示，不需要侧边栏和顶部导航栏
});
const email = ref('');
const password = ref('');
const checked = ref(false);
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <PracticeAgain
                            class="w-200 h-200 mb-8 w-16 shrink-0 mx-auto"
                            :fontControlled="false"
                        />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">欢迎使用学练考系统！</div>
                        <span class="text-muted-color font-medium">登录以继续学习</span>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">邮箱</label>
                        <InputText id="email1" type="text" placeholder="请输入邮箱" class="w-full md:w-[30rem] mb-8" v-model="email" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">密码</label>
                        <Password id="password1" v-model="password" placeholder="请输入密码" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">记住我</label>
                            </div>
                            <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">忘记密码?</span>
                        </div>
                        <Button label="Sign In" class="w-full" as="router-link" to="/"></Button>
                    </div>
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
