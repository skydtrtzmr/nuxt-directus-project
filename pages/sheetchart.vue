<template>
  <div ref="container" class="sheet-container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createUniver, defaultTheme, LocaleType, merge } from '@univerjs/presets'
import { UniverSheetsAdvancedPreset } from '@univerjs/presets/preset-sheets-advanced'
import sheetsAdvancedZhCN from '@univerjs/presets/preset-sheets-advanced/locales/zh-CN'
import { LinePointShape } from '@univerjs-pro/sheets-chart'

// 基础样式
import '@univerjs/presets/lib/styles/preset-sheets-advanced.css'

const container = ref<HTMLElement | null>(null)

// 示例数据
const WORKBOOK_DATA = {
  id: 'sheet-chart-demo',
  name: '图表示例',
  sheetOrder: ['sheet1'],
  sheets: {
    sheet1: {
      id: 'sheet1',
      name: 'Sheet1',
      rowCount: 20,
      columnCount: 10,
      cellData: {
        0: {
          0: { v: '月份' },
          1: { v: '销售额' }
        },
        1: {
          0: { v: '1月' },
          1: { v: 1000 }
        },
        2: {
          0: { v: '2月' },
          1: { v: 1500 }
        },
        3: {
          0: { v: '3月' },
          1: { v: 1200 }
        },
        4: {
          0: { v: '4月' },
          1: { v: 2000 }
        },
        5: {
          0: { v: '5月' },
          1: { v: 1800 }
        }
      }
    }
  }
}

onMounted(async () => {
  if (!container.value) return

  const { univerAPI } = createUniver({
    theme: defaultTheme,
    locale: LocaleType.ZH_CN,
    locales: {
      [LocaleType.ZH_CN]: merge({}, sheetsAdvancedZhCN)
    },
    presets: [
      UniverSheetsAdvancedPreset()
    ]
  })

  if (container.value) {
    const containerElement = container.value
    const divElement = containerElement.querySelector('.univer-sheet') as HTMLElement || containerElement
    divElement.style.height = '100%'
  }

  const workbook = univerAPI.createUniverSheet(WORKBOOK_DATA)
  const sheet = workbook.getActiveSheet()

  // 创建图表
  setTimeout(async () => {
    const chartBuilder = sheet.newChart().asLineChart()
    const chartInfo = chartBuilder
      .addRange('A1:B6')  // 使用A1到B6的数据范围
      .setPosition(1, 3, 400, 300)  // 设置图表位置和大小
      .setDataPointSize(8)  // 设置数据点大小
      .setDataPointShape(LinePointShape.Circle)  // 使用正确的枚举值
      .setAxisPointerStyle({
        indicatorLabelColor: '#ff0000',
        indicatorLineType: 'solid',  // 使用字符串
        indicatorLabelTextColor: '#0000ff',
      })
      .build()

    await sheet.insertChart(chartInfo)
  }, 1000)  // 延迟1秒等待表格渲染完成
})
</script>

<style scoped>
.sheet-container {
  width: 100%;
  height: 800px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
</style>
