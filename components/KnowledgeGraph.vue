<template>
  <div class="knowledge-graph-container">
    <div class="knowledge-graph-header">
      <h3>会计知识图谱</h3>
      <div class="controls">
        <button @click="fitView" class="control-btn">适应视图</button>
        <button @click="resetZoom" class="control-btn">重置缩放</button>
        <button @click="toggleLayout" class="control-btn">切换布局</button>
      </div>
    </div>
    <div ref="graphContainer" class="graph-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Graph } from '@antv/g6'

const graphContainer = ref<HTMLElement>()
let graph: Graph | null = null
let currentLayout = 'dagre'

// 虚拟会计知识点数据
const knowledgeData = {
  nodes: [
    // 一级知识点
    { id: 'accounting', label: '会计学', level: 1, color: '#1f77b4' },
    
    // 二级知识点
    { id: 'basic-accounting', label: '基础会计', level: 2, color: '#ff7f0e' },
    { id: 'intermediate-accounting', label: '中级会计', level: 2, color: '#ff7f0e' },
    { id: 'cost-accounting', label: '成本会计', level: 2, color: '#ff7f0e' },
    { id: 'management-accounting', label: '管理会计', level: 2, color: '#ff7f0e' },
    { id: 'financial-analysis', label: '财务分析', level: 2, color: '#ff7f0e' },
    { id: 'auditing', label: '审计学', level: 2, color: '#ff7f0e' },
    
    // 三级知识点 - 基础会计
    { id: 'accounting-equation', label: '会计等式', level: 3, color: '#2ca02c' },
    { id: 'accounting-subjects', label: '会计科目', level: 3, color: '#2ca02c' },
    { id: 'double-entry', label: '复式记账', level: 3, color: '#2ca02c' },
    { id: 'accounting-voucher', label: '会计凭证', level: 3, color: '#2ca02c' },
    { id: 'accounting-books', label: '会计账簿', level: 3, color: '#2ca02c' },
    
    // 三级知识点 - 中级会计
    { id: 'financial-statements', label: '财务报表', level: 3, color: '#2ca02c' },
    { id: 'revenue-recognition', label: '收入确认', level: 3, color: '#2ca02c' },
    { id: 'asset-valuation', label: '资产计价', level: 3, color: '#2ca02c' },
    { id: 'liability-accounting', label: '负债会计', level: 3, color: '#2ca02c' },
    { id: 'equity-accounting', label: '所有者权益', level: 3, color: '#2ca02c' },
    
    // 三级知识点 - 成本会计
    { id: 'cost-classification', label: '成本分类', level: 3, color: '#2ca02c' },
    { id: 'cost-allocation', label: '成本分配', level: 3, color: '#2ca02c' },
    { id: 'job-costing', label: '分批法', level: 3, color: '#2ca02c' },
    { id: 'process-costing', label: '分步法', level: 3, color: '#2ca02c' },
    
    // 三级知识点 - 管理会计
    { id: 'budgeting', label: '预算管理', level: 3, color: '#2ca02c' },
    { id: 'variance-analysis', label: '差异分析', level: 3, color: '#2ca02c' },
    { id: 'performance-measurement', label: '绩效评价', level: 3, color: '#2ca02c' },
    { id: 'decision-analysis', label: '决策分析', level: 3, color: '#2ca02c' },
    
    // 四级知识点 - 财务报表详细
    { id: 'balance-sheet', label: '资产负债表', level: 4, color: '#d62728' },
    { id: 'income-statement', label: '利润表', level: 4, color: '#d62728' },
    { id: 'cash-flow-statement', label: '现金流量表', level: 4, color: '#d62728' },
    { id: 'equity-statement', label: '所有者权益变动表', level: 4, color: '#d62728' },
    
    // 四级知识点 - 资产计价详细
    { id: 'current-assets', label: '流动资产', level: 4, color: '#d62728' },
    { id: 'fixed-assets', label: '固定资产', level: 4, color: '#d62728' },
    { id: 'intangible-assets', label: '无形资产', level: 4, color: '#d62728' },
    { id: 'investment-assets', label: '投资性房地产', level: 4, color: '#d62728' },
  ],
  edges: [
    // 一级到二级
    { source: 'accounting', target: 'basic-accounting' },
    { source: 'accounting', target: 'intermediate-accounting' },
    { source: 'accounting', target: 'cost-accounting' },
    { source: 'accounting', target: 'management-accounting' },
    { source: 'accounting', target: 'financial-analysis' },
    { source: 'accounting', target: 'auditing' },
    
    // 基础会计的子节点
    { source: 'basic-accounting', target: 'accounting-equation' },
    { source: 'basic-accounting', target: 'accounting-subjects' },
    { source: 'basic-accounting', target: 'double-entry' },
    { source: 'basic-accounting', target: 'accounting-voucher' },
    { source: 'basic-accounting', target: 'accounting-books' },
    
    // 中级会计的子节点
    { source: 'intermediate-accounting', target: 'financial-statements' },
    { source: 'intermediate-accounting', target: 'revenue-recognition' },
    { source: 'intermediate-accounting', target: 'asset-valuation' },
    { source: 'intermediate-accounting', target: 'liability-accounting' },
    { source: 'intermediate-accounting', target: 'equity-accounting' },
    
    // 成本会计的子节点
    { source: 'cost-accounting', target: 'cost-classification' },
    { source: 'cost-accounting', target: 'cost-allocation' },
    { source: 'cost-accounting', target: 'job-costing' },
    { source: 'cost-accounting', target: 'process-costing' },
    
    // 管理会计的子节点
    { source: 'management-accounting', target: 'budgeting' },
    { source: 'management-accounting', target: 'variance-analysis' },
    { source: 'management-accounting', target: 'performance-measurement' },
    { source: 'management-accounting', target: 'decision-analysis' },
    
    // 财务报表的子节点
    { source: 'financial-statements', target: 'balance-sheet' },
    { source: 'financial-statements', target: 'income-statement' },
    { source: 'financial-statements', target: 'cash-flow-statement' },
    { source: 'financial-statements', target: 'equity-statement' },
    
    // 资产计价的子节点
    { source: 'asset-valuation', target: 'current-assets' },
    { source: 'asset-valuation', target: 'fixed-assets' },
    { source: 'asset-valuation', target: 'intangible-assets' },
    { source: 'asset-valuation', target: 'investment-assets' },
  ]
}

// 初始化图谱
const initGraph = () => {
  if (!graphContainer.value) return

  graph = new Graph({
    container: graphContainer.value,
    width: graphContainer.value.offsetWidth,
    height: graphContainer.value.offsetHeight,
    data: knowledgeData,
    layout: {
      type: 'dagre',
      nodesep: 20,
      ranksep: 40,
      rankdir: 'TB',
    },
    node: {
      type: 'rect',
      style: {
        size: (d: any) => {
          const textLength = d.label.length
          return [Math.max(textLength * 12 + 20, 80), 32]
        },
        fill: (d: any) => d.color,
        stroke: '#fff',
        strokeWidth: 2,
        radius: 8,
        labelText: (d: any) => d.label,
        labelFill: '#fff',
        labelFontSize: 12,
        labelFontWeight: 'bold',
      },
    },
    edge: {
      style: {
        stroke: '#91d5ff',
        strokeWidth: 2,
        endArrow: true,
        endArrowSize: 8,
      },
    },
    behaviors: [
      'drag-canvas',
      'zoom-canvas',
      'drag-node',
      'click-select',
      'hover-activate',
    ],
    plugins: [
      {
        type: 'tooltip',
        enable: true,
        getContent: (e: any) => {
          const { item } = e
          const data = item.data
          return `
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 8px 0; color: #333;">${data.label}</h4>
              <p style="margin: 0; color: #666;">层级: ${data.level}</p>
              <p style="margin: 4px 0 0 0; color: #666;">点击查看相关内容</p>
            </div>
          `
        },
      },
    ],
  })

  // 监听节点点击事件
  graph.on('node:click', (event: any) => {
    const { item } = event
    const data = item.data
    console.log('点击了知识点:', data.label)
    
    // 高亮相关节点
    graph.setItemState(item.id, 'selected', true)
    
    // 这里可以扩展，比如显示详细信息、跳转到相关页面等
    // emit('nodeClick', data)
  })

  // 监听画布点击事件（取消选择）
  graph.on('canvas:click', () => {
    graph.getNodes().forEach((node: any) => {
      graph.setItemState(node.id, 'selected', false)
    })
  })

  graph.render()
}

// 控制函数
const fitView = () => {
  if (graph) {
    graph.fitView()
  }
}

const resetZoom = () => {
  if (graph) {
    graph.zoomTo(1)
    graph.fitCenter()
  }
}

const toggleLayout = () => {
  if (!graph) return
  
  currentLayout = currentLayout === 'dagre' ? 'force' : 'dagre'
  
  const layoutConfig = currentLayout === 'dagre' 
    ? {
        type: 'dagre',
        nodesep: 20,
        ranksep: 40,
        rankdir: 'TB',
      }
    : {
        type: 'force',
        preventOverlap: true,
        nodeSpacing: 50,
        linkDistance: 100,
        nodeStrength: 300,
        edgeStrength: 200,
      }
  
  graph.layout(layoutConfig)
}

// 响应式处理
const handleResize = () => {
  if (graph && graphContainer.value) {
    graph.changeSize(
      graphContainer.value.offsetWidth,
      graphContainer.value.offsetHeight
    )
  }
}

onMounted(async () => {
  await nextTick()
  initGraph()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (graph) {
    graph.destroy()
  }
})
</script>

<style scoped>
.knowledge-graph-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.knowledge-graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.knowledge-graph-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  padding: 6px 12px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.control-btn:hover {
  background: #40a9ff;
}

.control-btn:active {
  background: #096dd9;
}

.graph-container {
  flex: 1;
  width: 100%;
  height: 500px;
  background: white;
  position: relative;
}

/* 工具提示样式 */
:deep(.g6-tooltip) {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  max-width: 200px;
}

/* 选中状态样式 */
:deep(.g6-node.selected) {
  stroke: #ff4d4f !important;
  stroke-width: 3px !important;
}

/* 激活状态样式 */
:deep(.g6-node.active) {
  stroke: #52c41a !important;
  stroke-width: 3px !important;
}
</style> 