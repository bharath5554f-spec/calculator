const SmartToolkit = {
  storageKeys: {
    theme: "sst-theme",
    history: "sst-history",
    cgpaRows: "sst-cgpa-rows"
  },
  state: {
    chart: null
  },
  getHistory() {
    return JSON.parse(localStorage.getItem(this.storageKeys.history)) || [];
  },
  setHistory(records) {
    localStorage.setItem(this.storageKeys.history, JSON.stringify(records));
    document.dispatchEvent(new CustomEvent("history:updated"));
  },
  addHistory(type, title, value, details = "") {
    const record = {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      type,
      title,
      value,
      details,
      createdAt: new Date().toLocaleString()
    };
    this.setHistory([record, ...this.getHistory()].slice(0, 80));
    this.toast(`${type} saved to history`);
  },
  deleteHistory(id) {
    this.setHistory(this.getHistory().filter(record => record.id !== id));
  },
  clearHistory() {
    this.setHistory([]);
    this.toast("History cleared");
  },
  toast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove("show"), 1700);
  },
  copy(text) {
    navigator.clipboard.writeText(text).then(
      () => this.toast("Copied to clipboard"),
      () => this.toast("Copy is unavailable in this browser")
    );
  },
  navigate(sectionId) {
    document.querySelectorAll(".page-section").forEach(section => {
      section.classList.toggle("active", section.dataset.page === sectionId);
    });
    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle("active", link.dataset.section === sectionId);
    });
  },
  updateDashboard() {
    const records = this.getHistory();
    const latest = type => records.find(record => record.type === type);
    document.getElementById("statCgpa").textContent = latest("CGPA")?.value || "--";
    document.getElementById("statAttendance").textContent = latest("Attendance")?.value || "--";
    document.getElementById("statPercentage").textContent = latest("Percentage")?.value || "--";
    document.getElementById("statHistory").textContent = String(records.length);
    this.renderRecent(records.slice(0, 4));
    this.renderChart(records);
  },
  renderRecent(records) {
    const holder = document.getElementById("recentRecords");
    if (!records.length) {
      holder.innerHTML = '<p class="empty-state">No records yet. Use any tool to create one.</p>';
      return;
    }
    holder.innerHTML = records.map(record => `
      <article class="mini-record">
        <span>${record.type} - ${record.createdAt}</span>
        <strong>${record.value}</strong>
        <div>${record.title}</div>
      </article>
    `).join("");
  },
  renderChart(records) {
    const canvas = document.getElementById("analyticsChart");
    if (!window.Chart || !canvas) return;

    const counts = ["Calculator", "CGPA", "Attendance", "Percentage"].map(type =>
      records.filter(record => record.type === type).length
    );

    if (this.state.chart) {
      this.state.chart.data.datasets[0].data = counts;
      this.state.chart.update();
      return;
    }

    this.state.chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Calculator", "CGPA", "Attendance", "Percentage"],
        datasets: [{
          data: counts,
          backgroundColor: ["#176bff", "#00a693", "#ffb020", "#e5484d"],
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: getComputedStyle(document.body).getPropertyValue("--text") }
          }
        },
        cutout: "68%"
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem(SmartToolkit.storageKeys.theme) || "dark";
  document.body.classList.toggle("dark", savedTheme === "dark");

  document.querySelectorAll("[data-section]").forEach(control => {
    control.addEventListener("click", event => {
      event.preventDefault();
      SmartToolkit.navigate(control.dataset.section);
    });
  });

  document.getElementById("themeToggle").addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem(SmartToolkit.storageKeys.theme, isDark ? "dark" : "light");
    SmartToolkit.toast(`${isDark ? "Dark" : "Light"} mode enabled`);
    SmartToolkit.updateDashboard();
  });

  document.getElementById("exportPdf").addEventListener("click", () => {
    SmartToolkit.toast("Opening print dialog for PDF export");
    window.print();
  });

  document.addEventListener("history:updated", () => SmartToolkit.updateDashboard());
  SmartToolkit.updateDashboard();

  setTimeout(() => document.getElementById("loadingScreen").classList.add("hide"), 550);
});
