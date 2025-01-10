// server/cron/scheduledUpdateCache.ts
import { defineCronHandler } from "#nuxt/cron";
import { updateCache } from "~~/server/utils/redisUtils";
import { createDirectus, rest, readUsers, readItems } from "@directus/sdk";

const {
    public: {
        directus: { url },
    },
    private: { redisHost, redisPort },
} = useRuntimeConfig();

const directus_url = url || "http://127.0.0.1:8056";

const directus_client = createDirectus(directus_url).with(rest());

export default defineCronHandler("everyThirtyMinutes", () => {
    // do action
    console.log("Scheduled Update Cache");
    updateCache(
        "chapters",
        () =>
            directus_client.request(
                readItems("paper_prototype_chapters", {
                    fields: ["id", "title", "description"],
                })
            ),
        3600 // 1 hour
    );
});

// 已经在nuxt.config.ts中设置了`runOnInit: true`，就不再在函数中写`{ runOnInit: true }`了。
