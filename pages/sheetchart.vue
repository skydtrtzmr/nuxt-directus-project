<template>
  <div class="card">
    <div id="app" style="width: 100%; height: 600px;" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import {
    createUniver,
    defaultTheme,
    LocaleType,
    merge,
} from "@univerjs/presets";
import { UniverSheetsAdvancedPreset } from "@univerjs/presets/preset-sheets-advanced";
import UniverPresetSheetsAdvancedEnUS from "@univerjs/presets/preset-sheets-advanced/locales/en-US";
import { UniverSheetsCorePreset } from "@univerjs/presets/preset-sheets-core";
import sheetsCoreZhCN from '@univerjs/presets/preset-sheets-core/locales/zh-CN'
// import sheetsCoreEnUS from "@univerjs/presets/preset-sheets-core/locales/en-US";
import { UniverSheetsDrawingPreset } from "@univerjs/presets/preset-sheets-drawing";
import UniverPresetSheetsDrawingEnUS from "@univerjs/presets/preset-sheets-drawing/locales/en-US";
import { WORKBOOK_DATA } from "../server/lib/data";
import { insertChart } from "../server/lib/function";

import "@univerjs/presets/lib/styles/preset-sheets-core.css";
import "@univerjs/presets/lib/styles/preset-sheets-drawing.css";
import "@univerjs/presets/lib/styles/preset-sheets-advanced.css";

definePageMeta({
  layout: 'default'
})

onMounted(() => {
  const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
          [LocaleType.EN_US]: merge(
              {},
            //   sheetsCoreEnUS,
              sheetsCoreZhCN,
              UniverPresetSheetsDrawingEnUS,
              UniverPresetSheetsAdvancedEnUS
          ),
      },
      theme: defaultTheme,
      presets: [
          UniverSheetsCorePreset(),
          UniverSheetsDrawingPreset(),
          UniverSheetsAdvancedPreset({
            //   license:
            //       "1846850823316525115-1-eyJpIjoiMTg0Njg1MDgyMzMxNjUyNTExNSIsInYiOiIxIiwicCI6Ikx1aCt4eEVpN3pkRklqbDdOYXEvTy9NcEx1RVROUzIxQWFLM1J2Y0J6dkU9IiwicnQiOjMsImZ0Ijp7InVmIjp7Im11IjoyMTQ3NDgzNjQ2LCJldCI6MTczODM5Mjg4OCwibW0iOjIxNDc0ODM2NDYsImN1IjoyMTQ3NDgzNjQ2fSwic2YiOnsiZXQiOjE3MzgzOTI4ODgsInB0biI6MjE0NzQ4MzY0NiwibWlzIjoyMTQ3NDgzNjQ2LCJtcG4iOjIxNDc0ODM2NDYsIm5jIjoyMTQ3NDgzNjQ2fSwiZGYiOnsiZXQiOjE3MzgzOTI4ODgsInJ2Ijp0cnVlLCJtaXMiOjIxNDc0ODM2NDYsIm1wbiI6MjE0NzQ4MzY0Nn0sIndzZiI6eyJldCI6MTczODM5Mjg4OCwiaG4iOjIxNDc0ODM2NDZ9fSwidWQiOjE3MzgzOTI4ODgsImF0IjoxNzM1ODAwODg4LCJlIjoiMjY3NzU1NjcwMEBxcS5jb20iLCJkIjo4LCJuIjo2MH0=-ty5ziMmVnrlmNdzrFcMi7mBR8OGGn65QHCgF6Ms03IbFMlAkkZW0cb8tYv5E424d4BYtqK6jX/XJg5GL59Z1Cw==-1738392888",
          }),
      ],
  });

  univerAPI.createUniverSheet(WORKBOOK_DATA);
  insertChart(univerAPI);
})
</script>

<style>
#app {
  padding: 0;
  margin: 0;
  height: 100%;
}

.card {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}
</style>