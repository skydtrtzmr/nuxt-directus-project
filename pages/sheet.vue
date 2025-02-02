<template>
  <div ref="container" class="sheet-container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createUniver, defaultTheme, LocaleType, merge } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core'
import sheetsCoreZhCN from '@univerjs/presets/preset-sheets-core/locales/zh-CN'

// 基础样式
import '@univerjs/presets/lib/styles/preset-sheets-core.css'

const container = ref<HTMLElement | null>(null)

// 示例数据
const WORKBOOK_DATA = {
  id: 'sheet-demo',
  name: '考试表格',
  sheetOrder: ['sheet1'],
  sheets: {
    sheet1: {
      id: 'sheet1',
      name: 'Sheet1',
      rowCount: 20,
      columnCount: 10,
      cellData: {
        0: {
          0: { v: '考生姓名' },
          1: { v: '考试成绩' }
        },
        1: {
          0: { v: '张三' },
          1: { v: 85 }
        }
      }
    }
  }
}

onMounted(() => {
  if (!container.value) return

  const { univerAPI } = createUniver({
    locale: LocaleType.ZH_CN,
    locales: {
      [LocaleType.ZH_CN]: merge({}, sheetsCoreZhCN)
    },
    theme: defaultTheme,
    presets: [
      UniverSheetsCorePreset({
        container: container.value
      })
    ]
  })

  univerAPI.createUniverSheet(WORKBOOK_DATA)
})
</script>

<style scoped>
.sheet-container {
  width: 100%;
  height: 600px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
</style> 