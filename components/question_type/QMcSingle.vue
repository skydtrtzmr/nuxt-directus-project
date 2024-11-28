<template>
    <div>
        <div class="flex flex-col gap-4" v-if="q_mc_single">
            <p>{{ q_mc_single.stem }}</p>
            <div class="flex items-center gap-2">
                <RadioButton
                    v-model="ingredient"
                    inputId="option_a"
                    name="pizza"
                    value="A"
                />
                <label for="option_a">A. {{ q_mc_single.option_a }}</label>
            </div>
            <div class="flex items-center gap-2">
                <RadioButton
                    v-model="ingredient"
                    inputId="option_b"
                    name="pizza"
                    value="Mushroom"
                />
                <label for="option_b">B. {{ q_mc_single.option_b }}</label>
            </div>
            <div class="flex items-center gap-2">
                <RadioButton
                    v-model="ingredient"
                    inputId="option_c"
                    name="pizza"
                    value="Pepper"
                />
                <label for="option_c">C. {{ q_mc_single.option_c }}</label>
            </div>
            <div class="flex items-center gap-2">
                <RadioButton
                    v-model="ingredient"
                    inputId="option_d"
                    name="pizza"
                    value="Onion"
                />
                <label for="option_d">D. {{ q_mc_single.option_d }}</label>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    q_mc_single: Object,
});
const ingredient = ref("");
</script>

<style scoped></style>
