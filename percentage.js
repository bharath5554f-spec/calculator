document.addEventListener("DOMContentLoaded", () => {
  const obtained = document.getElementById("obtainedMarks");
  const total = document.getElementById("totalMarks");
  const percentageResult = document.getElementById("percentageResult");
  const gradePrediction = document.getElementById("gradePrediction");

  function calculate() {
    const obtainedValue = Number(obtained.value);
    const totalValue = Number(total.value);

    if (!totalValue || obtainedValue < 0 || obtainedValue > totalValue) {
      percentageResult.textContent = "0%";
      gradePrediction.textContent = "Enter valid marks to predict grade.";
      return null;
    }

    const percentage = (obtainedValue / totalValue) * 100;
    percentageResult.textContent = `${percentage.toFixed(2)}%`;
    gradePrediction.textContent = `Predicted grade: ${gradeFor(percentage)}`;
    return percentage;
  }

  function gradeFor(value) {
    if (value >= 90) return "Outstanding";
    if (value >= 80) return "Excellent";
    if (value >= 70) return "Very Good";
    if (value >= 60) return "Good";
    if (value >= 50) return "Pass";
    return "Needs Improvement";
  }

  document.getElementById("percentageForm").addEventListener("input", calculate);
  document.getElementById("resetPercentage").addEventListener("click", () => {
    obtained.value = "";
    total.value = "";
    calculate();
    SmartToolkit.toast("Percentage module reset");
  });

  document.getElementById("savePercentage").addEventListener("click", () => {
    const percentage = calculate();
    if (percentage === null) {
      SmartToolkit.toast("Enter valid marks before saving");
      return;
    }
    SmartToolkit.addHistory("Percentage", "Marks percentage calculation", `${percentage.toFixed(2)}%`, gradePrediction.textContent);
  });
});
