// stores\loadingState.ts
import { defineStore } from "pinia";

export const useLoadingStateStore = defineStore("loadingState", {
    state: () => ({
        componentsReady: {
            examPage: false, // 标记章节数据是否已加载
            examPageV2: false, // V2考试页面
            // otherComponentReady: false, // 其他组件是否加载完成
        },
    }),
    actions: {
        setComponentReady(component: 'examPage' | 'examPageV2') {
            this.componentsReady[component] = true;
        },
        checkComponentReady(component: 'examPage' | 'examPageV2') {
            return this.componentsReady[component] === true;
        },
        checkAllComponentsReady() {
            return Object.values(this.componentsReady).every((state) => state === true);
        },
        // 等待组件加载完成
        async waitUntilReady(component: 'examPage' | 'examPageV2') {
            // 如果组件已就绪，直接返回
            if (this.checkComponentReady(component)) {
                return;
            }
            
            // 否则，等待组件就绪
            return new Promise<void>((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.checkComponentReady(component)) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100); // 每100ms检查一次
                
                // 超时处理，10秒后自动取消等待
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn(`等待组件 ${component} 就绪超时`);
                    resolve();
                }, 10000);
            });
        },
    },
});