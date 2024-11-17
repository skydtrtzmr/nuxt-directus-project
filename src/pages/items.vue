<template>
	{{ products }}
</template>

<script setup lang="ts">
const { getItems } = useDirectusItems();

interface Product {
	id: string;
	title: string;
    price: string;
}

const products = await getItems<Product>({
    collection: "product"
});
</script>