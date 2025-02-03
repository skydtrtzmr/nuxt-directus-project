import type { FUniver } from '@univerjs/presets'
import type { FWorksheet } from '@univerjs/sheets/facade'
import { AreaLineStyle, ChartTypeBits, LegendPositionEnum, RadarShape, SelectModeEnum } from '@univerjs/presets/preset-sheets-advanced'
import themeJson from './theme.json'

export function insertChart(univerAPI: FUniver) {
  univerAPI.getHooks().onRendered(() => {
    const workbook = univerAPI.getActiveWorkbook()!
    const sheet = workbook.getActiveSheet()

    insertLineChart(sheet)
    insertBarChart(sheet)
    insertPieChart(sheet)
    insertRadarChart(sheet)
    insertCombinChart(sheet)
  })
}

function insertLineChart(sheet: FWorksheet) {
  const lineChartBuildInfo = sheet.newChart()
    .asLineChart()
    .setLineStyle(AreaLineStyle.Step)
    .addRange('Sheet1!B3:F14')
    .setPosition(1, 7, 0, 0)
    .setOptions('', {
      legend: {
        position: LegendPositionEnum.Top,
      },
    })
    .build()
  sheet.insertChart(lineChartBuildInfo)
}

function insertBarChart(sheet: FWorksheet) {
  const barChartBuildInfo = sheet.newChart()
    .addRange('Sheet1!B3:F14')
    .setChartType(ChartTypeBits.Bar)
    .setPosition(1, 13, 0, 0)
    .setOptions('', {
      legend: {
        selectMode: SelectModeEnum.Multiple,
      },
    })
    .build()
  sheet.insertChart(barChartBuildInfo)
}

function insertPieChart(sheet: FWorksheet) {
  sheet.registerChartTheme('theme1', themeJson)

  const pieChartBuildInfo = sheet.newChart()
    .asPieChart()
    .setHasPaddingAngle(true)
    .addRange('Sheet1!B16:F17')
    .setPosition(18, 1, 0, 0)
    .setTheme('theme1')
    .setOptions('', {
      title: {
        content: 'Average Consumption',
        fontColor: '#ff0000',
        alignment: 'left',
      },
      legend: {
        selectMode: SelectModeEnum.Multiple,
      },
    })
    .setTransposeRowsAndColumns(false)
    .setWidth(600)
    .build()
  sheet.insertChart(pieChartBuildInfo)
}

function insertRadarChart(sheet: FWorksheet) {
  const RadarChartBuildInfo = sheet.newChart()
    .asRadarChart()
    .setShape(RadarShape.Circle)
    .setFill(true)
    .addRange('Sheet1!B3:F14')
    .setPosition(18, 8, 0, 0)
    .build()
  sheet.insertChart(RadarChartBuildInfo)
}

function insertCombinChart(sheet: FWorksheet) {
  const combinChartBuildInfo = sheet.newChart()
    .setChartType(ChartTypeBits.Combination)
    .addRange('Sheet1!B3:F14')
    .setPosition(18, 14, 0, 0)
    .build()
  sheet.insertChart(combinChartBuildInfo)
}
