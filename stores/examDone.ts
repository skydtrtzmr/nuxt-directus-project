// stores/useGlobalStore.ts
import { defineStore } from "pinia";

export const useGlobalStore = defineStore("global", {
    state: () => ({
        isAllDone: false, // 用于表示是否已全部做完
    }),
    actions: {
        setAllDone(value: boolean) {
            this.isAllDone = value;
        },
    },
});
