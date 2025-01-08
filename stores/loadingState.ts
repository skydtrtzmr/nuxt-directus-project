// stores\loadingState.ts
import { defineStore } from "pinia";

export const useLoadingStateStore = defineStore("loadingState", {
    state: () => ({
        componentsReady: {
            examPage: false, // 标记章节数据是否已加载
            // otherComponentReady: false, // 其他组件是否加载完成
        },
    }),
    actions: {
        setComponentReady(component: 'examPage') {
            this.componentsReady[component] = true;
        },
        checkComponentReady(component: 'examPage') {
            return this.componentsReady[component] === true;
        },
        checkAllComponentsReady() {
            return Object.values(this.componentsReady).every((state) => state === true);
        },
    },
});