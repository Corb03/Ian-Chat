document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     MESSAGE INPUT / SLASH MENU
     ============================ */

  const messageInput = document.getElementById("message-input");
  const slashDropdown = document.getElementById("slash-dropdown");

  if (messageInput && slashDropdown) {
    messageInput.addEventListener("input", (e) => {
      const value = e.target.value;
      if (value.startsWith("/")) {
        slashDropdown.style.display = "block";
      } else {
        slashDropdown.style.display = "none";
      }
    });
  }

  /* ============================
     SEARCH SYSTEM
     ============================ */

  const searchInput = document.getElementById("search");
  const searchToggle = document.getElementById("search-toggle");
  const searchHelp = document.getElementById("search-help");

  if (searchInput) {

    const messages = Array.from(document.querySelectorAll(".message"));

    function applyFilters(query) {
      const q = query.trim().toLowerCase();

      messages.forEach(msg => {
        const user =
          msg.querySelector(".message-nickname")?.textContent.toLowerCase() || "";
        const text =
          msg.querySelector(".content")?.textContent.toLowerCase() || "";

        let visible = true;

        if (q.startsWith("from:")) {
          const name = q.slice(5).trim();
          visible = user.includes(name);
        } else if (q === "has:link") {
          visible = msg.querySelector("a") !== null;
        } else if (q.length > 0) {
          visible = user.includes(q) || text.includes(q);
        }

        msg.style.display = visible ? "" : "none";
      });
    }

    searchInput.addEventListener("input", () => {
      applyFilters(searchInput.value);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        applyFilters("");
        searchInput.blur();
        if (searchHelp) searchHelp.style.display = "none";
      }
    });

    if (searchToggle && searchHelp) {
      searchToggle.addEventListener("click", () => {
        searchHelp.style.display =
          searchHelp.style.display === "block" ? "none" : "block";
      });
    }

    // clickable filter inserts
    document.querySelectorAll("[data-insert]").forEach(el => {
      el.addEventListener("click", () => {
        searchInput.value = el.dataset.insert;
        searchInput.focus();
        applyFilters(searchInput.value);
      });
    });
  }

  /* ============================
     JUMP BUTTONS
     ============================ */

  const randomBtn = document.getElementById("random-message-btn");
  const jumpTopBtn = document.getElementById("scroll-jump-btn");

  const allMessages = Array.from(document.querySelectorAll(".message"));

  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      const visible = allMessages.filter(m => m.style.display !== "none");
      if (!visible.length) return;

      const pick = visible[Math.floor(Math.random() * visible.length)];
      pick.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  if (jumpTopBtn) {
    jumpTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

});

/* ============================
   REPLY MENU
   ============================ */

let selectedMessage = null;

document.addEventListener("contextmenu", (e) => {
  const message = e.target.closest(".message");
  if (!message) return;

  e.preventDefault();
  selectedMessage = message;

  const menu = document.getElementById("reply-menu");
  menu.style.display = "block";
  menu.style.top = `${e.pageY}px`;
  menu.style.left = `${e.pageX}px`;
});

document.addEventListener("click", () => {
  const menu = document.getElementById("reply-menu");
  if (menu) menu.style.display = "none";
});

function replyToSelected() {
  if (!selectedMessage) return;

  const user =
    selectedMessage.querySelector(".message-nickname")?.textContent || "User";
  const input = document.getElementById("message-input");

  input.value = `@${user} `;
  input.focus();
}
