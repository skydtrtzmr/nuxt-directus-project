import { createDirectus, staticToken, rest } from "@directus/sdk";

const {
    public: {
        directus: { url },
    },
    private: { directus_token },
} = useRuntimeConfig();

console.log("directus_token:", directus_token);

const directus_url = url || "http://127.0.0.1:8056";

const directus_client = createDirectus(directus_url)
    .with(staticToken(directus_token))
    .with(rest());

// console.log("directus_client:", directus_client);

export default directus_client;
