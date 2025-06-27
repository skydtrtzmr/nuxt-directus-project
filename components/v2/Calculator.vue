<template>
    <div class="calculator-container">
        <!-- 计算器折叠/展开按钮 -->
        <div class="calculator-toggle">
            <Button
                @click="toggleCalculator"
                class="p-button-rounded p-button-text calculator-toggle-btn"
                size="small"
                :aria-label="isCalculatorVisible ? '收起计算器' : '打开计算器'"
            >
                <template #icon>
                    <CalculatorIcon 
                        v-if="!isCalculatorVisible" 
                        class="calculator-icon"
                    />
                    <i v-else class="pi pi-chevron-up"></i>
                </template>
                <span class="button-label">{{ isCalculatorVisible ? '收起计算器' : '' }}</span>
            </Button>
        </div>

        <!-- 计算器主体 -->
        <div v-show="isCalculatorVisible" class="calculator card">
            <div class="calculator-header">
                <h6 class="calculator-title">
                    <i class="pi pi-calculator mr-2"></i>
                    计算器
                </h6>
                <Button
                    icon="pi pi-times"
                    @click="toggleCalculator"
                    class="p-button-rounded p-button-text p-button-sm"
                    aria-label="关闭计算器"
                />
            </div>

            <!-- 显示屏 -->
            <div class="calculator-display">
                <div class="display-expression">{{ expression || '0' }}</div>
                <div class="display-result">{{ displayValue }}</div>
            </div>

            <!-- 按钮区 -->
            <div class="calculator-buttons">
                <!-- 第一行：清除、删除、括号、除法 -->
                <Button @click="clear" class="calc-btn calc-btn-function" label="C" />
                <Button @click="deleteLast" class="calc-btn calc-btn-function" icon="pi pi-arrow-left" />
                <Button @click="addOperator('(')" class="calc-btn calc-btn-operator" label="(" />
                <Button @click="addOperator(')')" class="calc-btn calc-btn-operator" label=")" />

                <!-- 第二行：7、8、9、乘法 -->
                <Button @click="addNumber('7')" class="calc-btn calc-btn-number" label="7" />
                <Button @click="addNumber('8')" class="calc-btn calc-btn-number" label="8" />
                <Button @click="addNumber('9')" class="calc-btn calc-btn-number" label="9" />
                <Button @click="addOperator('÷')" class="calc-btn calc-btn-operator" label="÷" />

                <!-- 第三行：4、5、6、减法 -->
                <Button @click="addNumber('4')" class="calc-btn calc-btn-number" label="4" />
                <Button @click="addNumber('5')" class="calc-btn calc-btn-number" label="5" />
                <Button @click="addNumber('6')" class="calc-btn calc-btn-number" label="6" />
                <Button @click="addOperator('-')" class="calc-btn calc-btn-operator" label="-" />

                <!-- 第四行：1、2、3、加法 -->
                <Button @click="addNumber('1')" class="calc-btn calc-btn-number" label="1" />
                <Button @click="addNumber('2')" class="calc-btn calc-btn-number" label="2" />
                <Button @click="addNumber('3')" class="calc-btn calc-btn-number" label="3" />
                <Button @click="addOperator('+')" class="calc-btn calc-btn-operator" label="+" />

                <!-- 第五行：0、小数点、乘法、等于 -->
                <Button @click="addNumber('0')" class="calc-btn calc-btn-number calc-btn-zero" label="0" />
                <Button @click="addDecimal" class="calc-btn calc-btn-number" label="." />
                <Button @click="addOperator('×')" class="calc-btn calc-btn-operator" label="×" />
                <Button @click="calculate" class="calc-btn calc-btn-equals" label="=" />
            </div>

            <!-- 历史记录 -->
            <div v-if="history.length > 0" class="calculator-history">
                <div class="history-header">
                    <span class="history-title">历史记录</span>
                    <Button
                        @click="clearHistory"
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-text p-button-sm"
                        aria-label="清除历史记录"
                    />
                </div>
                <div class="history-list">
                    <div
                        v-for="(item, index) in history.slice(-3)"
                        :key="index"
                        class="history-item"
                        @click="useHistoryResult(item.result)"
                    >
                        <span class="history-expression">{{ item.expression }}</span>
                        <span class="history-result">= {{ item.result }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CalculatorIcon from '~/assets/icons/calculator.svg';

// 响应式数据
const isCalculatorVisible = ref(false);
const expression = ref('');
const currentNumber = ref('');
const operator = ref('');
const previousNumber = ref('');
const waitingForNumber = ref(false);
const history = ref<Array<{expression: string, result: string}>>([]);

// 显示值计算属性
const displayValue = computed(() => {
    if (currentNumber.value) {
        return currentNumber.value;
    }
    return expression.value || '0';
});

// 切换计算器显示/隐藏
const toggleCalculator = () => {
    isCalculatorVisible.value = !isCalculatorVisible.value;
};

// 添加数字
const addNumber = (num: string) => {
    if (waitingForNumber.value) {
        currentNumber.value = num;
        waitingForNumber.value = false;
    } else {
        currentNumber.value = currentNumber.value === '0' ? num : currentNumber.value + num;
    }
    updateExpression();
};

// 添加小数点
const addDecimal = () => {
    if (waitingForNumber.value) {
        currentNumber.value = '0.';
        waitingForNumber.value = false;
    } else if (currentNumber.value.indexOf('.') === -1) {
        currentNumber.value = currentNumber.value || '0';
        currentNumber.value += '.';
    }
    updateExpression();
};

// 添加操作符
const addOperator = (op: string) => {
    if (op === '(' || op === ')') {
        // 处理括号
        if (currentNumber.value || expression.value) {
            expression.value += op;
        } else if (op === '(') {
            expression.value = '(';
        }
        currentNumber.value = '';
        return;
    }

    if (currentNumber.value) {
        if (operator.value && previousNumber.value && !waitingForNumber.value) {
            calculate();
        }
        previousNumber.value = currentNumber.value;
        currentNumber.value = '';
    }
    
    operator.value = op;
    waitingForNumber.value = true;
    updateExpression();
};

// 更新表达式显示
const updateExpression = () => {
    let expr = '';
    
    if (previousNumber.value) {
        expr += previousNumber.value;
    }
    
    if (operator.value) {
        expr += ` ${operator.value} `;
    }
    
    if (currentNumber.value && !waitingForNumber.value) {
        expr += currentNumber.value;
    }
    
    expression.value = expr;
};

// 计算结果
const calculate = () => {
    try {
        let expr = expression.value;
        
        // 替换显示符号为计算符号
        expr = expr.replace(/×/g, '*').replace(/÷/g, '/');
        
        // 使用 Function 构造函数进行安全计算
        const result = new Function('return ' + expr)();
        
        if (isFinite(result)) {
            const formattedResult = parseFloat(result.toFixed(10)).toString();
            
            // 添加到历史记录
            history.value.push({
                expression: expression.value,
                result: formattedResult
            });
            
            // 保持历史记录在合理数量内
            if (history.value.length > 10) {
                history.value = history.value.slice(-10);
            }
            
            // 重置状态
            currentNumber.value = formattedResult;
            expression.value = formattedResult;
            operator.value = '';
            previousNumber.value = '';
            waitingForNumber.value = false;
        } else {
            throw new Error('计算结果无效');
        }
    } catch (error) {
        currentNumber.value = '错误';
        expression.value = '错误';
        setTimeout(() => {
            clear();
        }, 1500);
    }
};

// 清除所有
const clear = () => {
    expression.value = '';
    currentNumber.value = '';
    operator.value = '';
    previousNumber.value = '';
    waitingForNumber.value = false;
};

// 删除最后一个字符
const deleteLast = () => {
    if (currentNumber.value) {
        currentNumber.value = currentNumber.value.slice(0, -1);
        updateExpression();
    } else if (expression.value) {
        expression.value = expression.value.slice(0, -1);
    }
};

// 使用历史记录结果
const useHistoryResult = (result: string) => {
    currentNumber.value = result;
    expression.value = result;
    operator.value = '';
    previousNumber.value = '';
    waitingForNumber.value = false;
};

// 清除历史记录
const clearHistory = () => {
    history.value = [];
};

// 键盘支持
const handleKeyPress = (event: KeyboardEvent) => {
    const key = event.key;
    
    if (key >= '0' && key <= '9') {
        addNumber(key);
    } else if (key === '.') {
        addDecimal();
    } else if (key === '+' || key === '-') {
        addOperator(key);
    } else if (key === '*') {
        addOperator('×');
    } else if (key === '/') {
        event.preventDefault();
        addOperator('÷');
    } else if (key === 'Enter' || key === '=') {
        calculate();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clear();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === '(' || key === ')') {
        addOperator(key);
    }
};

// 组件挂载时添加键盘监听
onMounted(() => {
    document.addEventListener('keydown', handleKeyPress);
});

// 组件卸载时移除键盘监听
onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyPress);
});
</script>

<style scoped>
.calculator-container {
    position: relative;
    width: 100%;
}

.calculator-toggle {
    margin-bottom: 0.5rem;
    text-align: center;
}

.calculator-toggle-btn {
    transition: all 0.3s ease;
}

.calculator-icon {
    width: 20px;
    height: 20px;
    filter: var(--text-color-filter);
    transition: all 0.3s ease;
}

.calculator-toggle-btn:hover .calculator-icon {
    transform: scale(1.1);
}

.button-label {
    margin-left: 0.5rem;
    font-size: 0.875rem;
}

.calculator {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.calculator-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--surface-100);
    border-bottom: 1px solid var(--surface-border);
}

.calculator-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
}

.calculator-display {
    padding: 1.5rem 1rem;
    background: var(--surface-50);
    text-align: right;
    border-bottom: 1px solid var(--surface-border);
}

.display-expression {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    min-height: 1.25rem;
    margin-bottom: 0.5rem;
}

.display-result {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-color);
    word-break: break-all;
    min-height: 2rem;
}

.calculator-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--surface-border);
    padding: 1px;
}

.calc-btn {
    border: 0;
    border-radius: 0;
    aspect-ratio: 1;
    font-size: 1.125rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

.calc-btn:hover {
    transform: translateY(-1px);
}

.calc-btn:active {
    transform: translateY(0);
}

.calc-btn-number {
    background: var(--surface-0);
    color: var(--text-color);
}

.calc-btn-number:hover {
    background: var(--surface-100);
}

.calc-btn-operator {
    background: var(--primary-color);
    color: white;
}

.calc-btn-operator:hover {
    background: var(--primary-600);
}

.calc-btn-function {
    background: var(--surface-200);
    color: var(--text-color);
}

.calc-btn-function:hover {
    background: var(--surface-300);
}

.calc-btn-equals {
    background: var(--green-500);
    color: white;
}

.calc-btn-equals:hover {
    background: var(--green-600);
}

.calc-btn-zero {
    grid-column: span 1;
}

.calculator-history {
    border-top: 1px solid var(--surface-border);
    background: var(--surface-50);
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--surface-border);
}

.history-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-secondary);
}

.history-list {
    max-height: 150px;
    overflow-y: auto;
}

.history-item {
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-bottom: 1px solid var(--surface-border);
}

.history-item:hover {
    background: var(--surface-100);
}

.history-item:last-child {
    border-bottom: none;
}

.history-expression {
    display: block;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.25rem;
}

.history-result {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color);
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
    .calculator {
        max-width: 280px;
    }
    
    .calc-btn {
        font-size: 1rem;
    }
    
    .display-result {
        font-size: 1.5rem;
    }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
    .calculator {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
}

/* 无障碍支持 */
.calc-btn:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
    z-index: 1;
}

/* 动画效果 */
.calculator-toggle-btn {
    transform: scale(1);
}

.calculator-toggle-btn:hover {
    transform: scale(1.05);
}

.calculator {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style> 