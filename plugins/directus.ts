import { createDirectus, rest, readItem, readItems } from "@directus/sdk";

const {
    public: {
        directus: { url },
    },
    private: { directus_token },
} = useRuntimeConfig();

const directus = createDirectus(url).with(rest());

export default defineNuxtPlugin(() => {
    return {
        provide: { directus, readItem, readItems },
    };
});
