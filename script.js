
document.getElementById("archiveSelect").addEventListener("change", e => {
  const path = e.target.value;
  if (!path) return;

  fetch(path)
    .then(r => r.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const chatlog = doc.querySelector(".chatlog");

      const chat = document.getElementById("chat");
      chat.innerHTML = "";

      if (!chatlog) {
        chat.textContent = "Invalid Discord archive.";
        return;
      }

      chat.appendChild(chatlog);
    })
    .catch(err => {
      document.getElementById("chat").textContent = "Failed to load archive.";
      console.error(err);
    });
});
