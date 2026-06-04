document.addEventListener("DOMContentLoaded", () => {
  const rows = document.getElementById("cgpaRows");
  const result = document.getElementById("cgpaResult");
  const summary = document.getElementById("cgpaSummary");
  const grades = { "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "F": 0 };

  function savedRows() {
    return JSON.parse(localStorage.getItem(SmartToolkit.storageKeys.cgpaRows)) || [
      { subject: "Mathematics", grade: "A+", credits: 4 },
      { subject: "Programming", grade: "A", credits: 3 },
      { subject: "Physics", grade: "B+", credits: 3 }
    ];
  }

  function renderRows(data = savedRows()) {
    rows.innerHTML = data.map((row, index) => `
      <tr>
        <td><input data-field="subject" data-index="${index}" value="${escapeAttribute(row.subject)}" aria-label="Subject"></td>
        <td>
          <select data-field="grade" data-index="${index}" aria-label="Grade">
            ${Object.keys(grades).map(grade => `<option ${grade === row.grade ? "selected" : ""}>${grade}</option>`).join("")}
          </select>
        </td>
        <td><input data-field="credits" data-index="${index}" type="number" min="1" max="10" value="${row.credits}" aria-label="Credits"></td>
        <td><button class="delete-row" data-remove="${index}" type="button">X</button></td>
      </tr>
    `).join("");
    calculate();
  }

  function escapeAttribute(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function readRows() {
    const data = [];
    rows.querySelectorAll("tr").forEach(row => {
      data.push({
        subject: row.querySelector('[data-field="subject"]').value.trim() || "Subject",
        grade: row.querySelector('[data-field="grade"]').value,
        credits: Number(row.querySelector('[data-field="credits"]').value) || 0
      });
    });
    localStorage.setItem(SmartToolkit.storageKeys.cgpaRows, JSON.stringify(data));
    return data;
  }

  function calculate() {
    const data = readRows();
    const credits = data.reduce((sum, row) => sum + row.credits, 0);
    const points = data.reduce((sum, row) => sum + grades[row.grade] * row.credits, 0);
    const cgpa = credits ? points / credits : 0;
    result.textContent = cgpa.toFixed(2);
    summary.textContent = `${data.length} subjects, ${credits} total credits. Estimated percentage: ${(cgpa * 9.5).toFixed(1)}%.`;
    return { cgpa, credits, subjects: data.length };
  }

  rows.addEventListener("input", calculate);
  rows.addEventListener("change", calculate);
  rows.addEventListener("click", event => {
    const remove = event.target.closest("[data-remove]");
    if (!remove) return;
    const data = readRows().filter((_, index) => index !== Number(remove.dataset.remove));
    renderRows(data.length ? data : [{ subject: "New Subject", grade: "A", credits: 3 }]);
  });

  document.getElementById("addSemester").addEventListener("click", () => {
    renderRows([...readRows(), { subject: "New Subject", grade: "A", credits: 3 }]);
  });

  document.getElementById("resetCgpa").addEventListener("click", () => {
    localStorage.removeItem(SmartToolkit.storageKeys.cgpaRows);
    renderRows();
    SmartToolkit.toast("CGPA module reset");
  });

  document.getElementById("saveCgpa").addEventListener("click", () => {
    const data = calculate();
    SmartToolkit.addHistory("CGPA", "Semester CGPA calculation", data.cgpa.toFixed(2), `${data.subjects} subjects and ${data.credits} credits`);
  });

  renderRows();
});
