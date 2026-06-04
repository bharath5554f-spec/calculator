document.addEventListener("DOMContentLoaded", () => {
  const attended = document.getElementById("classesAttended");
  const total = document.getElementById("totalClasses");
  const bar = document.getElementById("attendanceBar");
  const targets = document.getElementById("attendanceTargets");

  function calculate() {
    const attendedValue = Number(attended.value);
    const totalValue = Number(total.value);

    if (!totalValue || totalValue < attendedValue || attendedValue < 0) {
      bar.style.width = "0%";
      targets.innerHTML = '<p class="empty-state">Enter valid class counts to calculate targets.</p>';
      return null;
    }

    const current = (attendedValue / totalValue) * 100;
    bar.style.width = `${Math.min(current, 100)}%`;
    targets.innerHTML = [75, 80, 85].map(target => {
      const needed = classesNeeded(attendedValue, totalValue, target);
      return `
        <article class="target-card">
          <span>Target ${target}%</span>
          <strong>${needed}</strong>
          <div>${needed === 0 ? "Already reached" : "classes needed"}</div>
        </article>
      `;
    }).join("");
    SmartToolkit.addHistory("Attendance", "Attendance planner", `${current.toFixed(1)}%`, `${attendedValue}/${totalValue} classes`);
    return current;
  }

  function classesNeeded(attendedValue, totalValue, target) {
    let extra = 0;
    while (((attendedValue + extra) / (totalValue + extra)) * 100 < target) {
      extra += 1;
      if (extra > 1000) break;
    }
    return extra;
  }

  document.getElementById("attendanceForm").addEventListener("input", () => {
    clearTimeout(calculate.timer);
    calculate.timer = setTimeout(calculate, 350);
  });

  document.getElementById("resetAttendance").addEventListener("click", () => {
    attended.value = "";
    total.value = "";
    bar.style.width = "0%";
    targets.innerHTML = '<p class="empty-state">Enter attendance details to start planning.</p>';
    SmartToolkit.toast("Attendance module reset");
  });

  targets.innerHTML = '<p class="empty-state">Enter attendance details to start planning.</p>';
});
