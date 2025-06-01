document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.btn:not(.clear-history)');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    let expression = '0';
    let hasEvaluated = false;
    let calculationHistory = [];
    const MAX_HISTORY_ITEMS = 15;

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.dataset.value;

            if (button.classList.contains('number')) {
                handleNumber(value);
            } else if (button.classList.contains('operator')) {
                handleOperator(value);
            } else if (button.classList.contains('equals')) {
                handleEquals();
            } else if (button.classList.contains('clear') && value === 'AC') {
                handleClear();
            }
            updateDisplay();
        });
    });

    clearHistoryBtn.addEventListener('click', () => {
        calculationHistory = [];
        renderHistory();
    });

    function handleNumber(numStr) {
        if (expression === 'Error') {
            expression = '0';
        }

        if (hasEvaluated) {
            expression = (numStr === '.') ? '0.' : numStr;
            hasEvaluated = false;
            return;
        }

        const segments = expression.split(/([+\-*/])/);
        const lastSegment = segments.pop() || '';

        if (numStr === '.' && lastSegment.includes('.')) {
            return;
        }

        if (expression === '0' && numStr !== '.') {
            expression = numStr;
        } else if (lastSegment === '0' && numStr === '0' && !lastSegment.includes('.')) {
            return;
        } else if (lastSegment === '0' && numStr !== '.' && !lastSegment.includes('.')) {
             expression = expression.slice(0, -1) + numStr;
        }
        else {
            expression += numStr;
        }
    }

    function handleOperator(opStr) {
        if (opStr === 'DEL') {
            if (expression === 'Error' || (hasEvaluated && !isOperator(expression.slice(-1)))) {
                expression = '0';
                hasEvaluated = false;
            } else if (expression !== '0') {
                expression = expression.slice(0, -1);
                if (expression === '') {
                    expression = '0';
                }
            }
            return;
        }

        if (expression === 'Error') {
            expression = '0';
            if (opStr !== '-') return;
        }
        
        hasEvaluated = false;
        const lastChar = expression.slice(-1);

        if (isOperator(lastChar)) {
            const secondLastChar = expression.length > 1 ? expression.slice(-2, -1) : '';
            if (opStr === '-' && (lastChar === '*' || lastChar === '/')) {
                expression += opStr;
            } else if (isOperator(secondLastChar) && lastChar === '-') {
                if (opStr !== '-') {
                     expression = expression.slice(0, -2) + opStr;
                } else if (expression.slice(-2) !== '--') {
                    expression += opStr;
                }
            } else {
                expression = expression.slice(0, -1) + opStr;
            }
        } else {
            if (expression === '0' && opStr !== '-') {
                 expression += opStr;
            } else if (expression === '0' && opStr === '-') {
                 expression = opStr;
            }
            else {
                 expression += opStr;
            }
        }
    }

    function handleEquals() {
        if (expression === 'Error' || isOperator(expression.slice(-1)) || expression === '' || expression === '0') {
            return;
        }

        const expressionToLog = getDisplayableExpression(expression);
        let result;

        try {
            result = eval(expression);

            if (isNaN(result) || !isFinite(result)) {
                expression = 'Error';
            } else {
                expression = parseFloat(result.toFixed(10)).toString();
                addToHistory(expressionToLog, expression);
            }
        } catch (e) {
            expression = 'Error';
        }
        hasEvaluated = true;
        renderHistory();
    }

    function handleClear() {
        expression = '0';
        hasEvaluated = false;
    }

    function updateDisplay() {
        let displayValue = getDisplayableExpression(expression);
        
        const maxLength = 16;
        if (displayValue.length > maxLength) {
            if (hasEvaluated && !isNaN(parseFloat(expression))) {
                try {
                    let num = parseFloat(expression);
                    if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-5 && Math.abs(num) !== 0) || num.toString().length > maxLength) {
                        display.value = num.toExponential(Math.max(1, maxLength - 7));
                    } else {
                        display.value = num.toString().slice(0, maxLength);
                    }
                } catch {
                     display.value = "..." + displayValue.slice(-maxLength + 3);
                }
            } else {
                display.value = "..." + displayValue.slice(-maxLength + 3);
            }
        } else {
            display.value = displayValue;
        }
    }

    function getDisplayableExpression(exprStr) {
        return exprStr.replace(/\*/g, '×').replace(/\//g, '÷');
    }

    function isOperator(char) {
        return ['+', '-', '*', '/'].includes(char);
    }

    function addToHistory(expr, res) {
        if (expr === res) return;
        
        calculationHistory.unshift({ expression: expr, result: res });
        if (calculationHistory.length > MAX_HISTORY_ITEMS) {
            calculationHistory.pop();
        }
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (calculationHistory.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No history yet.';
            li.style.textAlign = 'center';
            li.style.color = 'var(--history-text)';
            li.style.fontStyle = 'italic';
            li.style.boxShadow = 'none';
            li.style.background = 'transparent';
            historyList.appendChild(li);
            return;
        }

        calculationHistory.forEach(item => {
            const li = document.createElement('li');
            
            const exprSpan = document.createElement('span');
            exprSpan.className = 'history-expression';
            exprSpan.textContent = item.expression + ' =';
            
            const resultSpan = document.createElement('span');
            resultSpan.className = 'history-result';
            resultSpan.textContent = item.result;

            li.addEventListener('click', () => {
                expression = item.result;
                hasEvaluated = true;
                updateDisplay();
            });
            
            li.appendChild(exprSpan);
            li.appendChild(resultSpan);
            historyList.appendChild(li);
        });
    }

    updateDisplay();
    renderHistory();
});