document.addEventListener("DOMContentLoaded", () => {
  const expressionDisplay = document.getElementById("calcExpression");
  const previewDisplay = document.getElementById("calcPreview");
  const grid = document.getElementById("calculatorGrid");
  let expression = "";
  let lastResult = "";
  const operators = ["+", "-", "*", "/"];

  function render() {
    expressionDisplay.textContent = expression || "0";
    const preview = safeEvaluate(expression);
    previewDisplay.textContent = preview === null ? "Ready" : format(preview);
    expressionDisplay.scrollLeft = expressionDisplay.scrollWidth;
    previewDisplay.scrollLeft = previewDisplay.scrollWidth;
  }

  function append(value) {
    const last = expression.slice(-1);
    if (operators.includes(value) && operators.includes(last)) {
      expression = expression.slice(0, -1) + value;
    } else if (value !== "." || !currentNumber().includes(".")) {
      expression += value;
    }
    render();
  }

  function calculate() {
    const result = safeEvaluate(expression);
    if (result === null) {
      previewDisplay.textContent = "Invalid expression";
      SmartToolkit.toast("Invalid expression");
      return;
    }
    lastResult = format(result);
    SmartToolkit.addHistory("Calculator", expression, lastResult, "Advanced calculator result");
    expression = lastResult;
    render();
  }

  function safeEvaluate(input) {
    if (!input || operators.includes(input.slice(-1))) return null;
    try {
      const converted = input.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
      if (/\/\s*0(?![\d.])/.test(converted)) throw new Error("Division by zero");
      if (!/^[\d+\-*/().%\s]+$/.test(converted)) throw new Error("Unsafe input");
      const result = Function(`"use strict"; return (${converted})`)();
      return Number.isFinite(result) ? result : null;
    } catch {
      return null;
    }
  }

  function currentNumber() {
    return expression.split(/[+\-*/]/).pop();
  }

  function format(value) {
    const rounded = Number(value.toPrecision(12));
    return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/\.?0+$/, "");
  }

  grid.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.value) append(button.dataset.value);
    if (button.dataset.action === "clear") expression = "";
    if (button.dataset.action === "delete") expression = expression.slice(0, -1);
    if (button.dataset.action === "equals") return calculate();
    render();
  });

  document.addEventListener("keydown", event => {
    if (/^[0-9+\-*/().%]$/.test(event.key)) {
      event.preventDefault();
      append(event.key);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      calculate();
    }
    if (event.key === "Backspace") {
      expression = expression.slice(0, -1);
      render();
    }
    if (event.key === "Escape") {
      expression = "";
      lastResult = "";
      render();
    }
  });

  document.getElementById("copyCalculator").addEventListener("click", () => {
    SmartToolkit.copy(lastResult || previewDisplay.textContent);
  });

  document.getElementById("resetCalculator").addEventListener("click", () => {
    expression = "";
    lastResult = "";
    render();
    SmartToolkit.toast("Calculator reset");
  });

  render();
});
