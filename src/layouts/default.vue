<script lang="ts"></script>

<template>
    <div>默认布局</div>
    <div>
        <div>
            <ul>
                <li><router-link to="/login">登录</router-link></li>
                <li><router-link to="/exams">考试</router-link></li>
            </ul>
        </div>

        <slot />
    </div>
</template>
<style lang="scss"></style>
