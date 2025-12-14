const chatContainer = document.getElementById("chat-container");
const archiveSelect = document.getElementById("archiveSelect");

/* 🔹 LIST YOUR ARCHIVES HERE */
const ARCHIVES = [
  "Head Facts.html",
  "VIP Lounge.html"
];

/* Populate dropdown */
ARCHIVES.forEach(file => {
  const opt = document.createElement("option");
  opt.value = file;
  opt.textContent = file.replace(".html", "");
  archiveSelect.appendChild(opt);
});

archiveSelect.addEventListener("change", () => {
  if (!archiveSelect.value) return;
  loadArchive(archiveSelect.value);
});

function loadArchive(file) {
  fetch(`archives/${file}`)
    .then(res => res.text())
    .then(html => {
      chatContainer.innerHTML = html;
    })
    .catch(err => {
      chatContainer.innerHTML = `<p class="error">Failed to load archive.</p>`;
      console.error(err);
    });
}
