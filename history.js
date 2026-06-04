document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("historyList");
  const search = document.getElementById("historySearch");

  function renderHistory() {
    const query = search.value.trim().toLowerCase();
    const records = SmartToolkit.getHistory().filter(record =>
      [record.type, record.title, record.value, record.details].join(" ").toLowerCase().includes(query)
    );

    if (!records.length) {
      list.innerHTML = '<p class="empty-state">No matching history records.</p>';
      return;
    }

    list.innerHTML = records.map(record => `
      <article class="history-record">
        <div>
          <span>${record.type} - ${record.createdAt}</span>
          <strong>${record.value}</strong>
          <div>${record.title}</div>
          <span>${record.details}</span>
        </div>
        <div class="record-actions">
          <button data-copy="${record.id}" type="button">Copy</button>
          <button class="delete-record" data-delete="${record.id}" type="button">Delete</button>
        </div>
      </article>
    `).join("");
  }

  list.addEventListener("click", event => {
    const copyButton = event.target.closest("[data-copy]");
    const deleteButton = event.target.closest("[data-delete]");

    if (copyButton) {
      const record = SmartToolkit.getHistory().find(item => item.id === copyButton.dataset.copy);
      SmartToolkit.copy(`${record.type}: ${record.value} - ${record.details}`);
    }

    if (deleteButton) {
      SmartToolkit.deleteHistory(deleteButton.dataset.delete);
    }
  });

  search.addEventListener("input", renderHistory);
  document.getElementById("clearAllHistory").addEventListener("click", () => SmartToolkit.clearHistory());
  document.addEventListener("history:updated", renderHistory);
  renderHistory();
});
