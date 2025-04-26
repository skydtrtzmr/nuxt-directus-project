import { createDirectus, staticToken, rest } from "@directus/sdk";

const {
    public: {
        directus: { url },
    },
    private: { redisHost, redisPort, directus_token },
} = useRuntimeConfig();

const directus_url = url || "http://127.0.0.1:8056";

const directus_client = createDirectus(directus_url)
    .with(staticToken(directus_token))
    .with(rest());

export default directus_client;
