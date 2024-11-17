// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
      "nuxt-directus",
  ],

  runtimeConfig: {
      public: {
          directus: {
              url: "http://127.0.0.1:8055",
          },
      },
  },

  directus: {
      devtools: true,
  },

  srcDir: "src/",
  compatibilityDate: "2024-11-17",
});