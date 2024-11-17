<template>
    <button @click="() => createItems">Create items</button>
</template>

<script setup lang="ts">
const { createItems } = useDirectusItems();

interface Product {
    id?: number;
    title: string;
    price: string;
}

const newProducts: Product[] = [
    { title: "Banana", price: "0.29€" },
    { title: "Vue.js Handbook", price: "29.99€"}
];

await createItems<Product>({
    collection: "product",
    items: newProducts
});
</script>
