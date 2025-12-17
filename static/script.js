// iAN-Chat / iancord script.js (full features + fixed init order)

let currentNickname = "You";
let replyHTML = "";
let replyTo = null;

let messages = []; // search index
let sentMessageCount = 0;
let currentAvatarURL = "/static/avatar.png";
let lastSender = null;

// ------------------------------
// Helpers
// ------------------------------
function formatTimestamp(date) {
  const d = new Date(date);
  return d
    .toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    .replace(/, /g, " ");
}

function enableAutoHideScrollbars(selector) {
  document.querySelectorAll(selector).forEach((container) => {
    let timeout;
    container.addEventListener("scroll", () => {
      container.classList.add("scrolling");
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        container.classList.remove("scrolling");
      }, 1000);
    });
  });
}

// ------------------------------
// Search
// ------------------------------
function applyFilters() {
  const searchEl = document.getElementById("search");
  if (!searchEl) return;

  const query = (searchEl.value || "").toLowerCase().trim();
  const parts = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  messages.forEach(({ element, content, username, hasLink }) => {
    let show = true;

    for (const partRaw of parts) {
      const part = partRaw.replace(/^"|"$/g, ""); // allow "quoted strings"

      if (part.startsWith("has:")) {
        const key = part.slice(4);
        if (key === "link") show = show && hasLink;
        else show = false;
      } else if (part.startsWith("from:")) {
        const name = part.slice(5).trim();
        show = show && username.includes(name);
      } else {
        show = show && (content.includes(part) || username.includes(part));
      }

      if (!show) break;
    }

    element.style.display = show ? "" : "none";
  });

  highlightMatches(query);
}

function highlightMatches(query) {
  // Note: keeps it simple (no span wrapping) to avoid breaking embedded HTML in message content
  // If you want real highlighting later, we’ll implement a safe DOM-walk highlighter.
  const terms = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const highlightable = terms.filter(
    (t) => !t.startsWith("has:") && !t.startsWith("from:")
  );

  if (highlightable.length === 0) return;
}

// ------------------------------
// Message append (user)
// ------------------------------
function appendMessage(content) {
  const chatlog = document.getElementById("chatlog");
  const inputEl = document.getElementById("message-input");
  if (!chatlog) return;

  const timestamp = formatTimestamp(Date.now());
  const container = document.createElement("div");
  container.className = "message user-message";

  const isGrouped = lastSender === currentNickname;
  if (isGrouped) container.classList.add("grouped-message");

  // Avatar (only if not grouped)
  if (!isGrouped) {
    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = currentAvatarURL;
    avatar.alt = "Avatar";
    container.appendChild(avatar);
  }

  // Message block
  const msgContent = document.createElement("div");
  msgContent.className = "message-content";

  // Meta (only if not grouped)
  if (!isGrouped) {
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `${currentNickname} <span class="timestamp">${timestamp}</span>`;
    msgContent.appendChild(meta);
  }

  // Body
  const body = document.createElement("div");
  body.className = "content";
  body.textContent = content;
  msgContent.appendChild(body);

  container.appendChild(msgContent);
  chatlog.appendChild(container);

  // Try to grab reactions from archived DOM (if present)
  try {
    const archivedMessages = document.querySelectorAll(".chatlog__message-container");
    const corresponding = archivedMessages[archivedMessages.length - sentMessageCount - 1];
    if (corresponding) {
      const reactions = corresponding.querySelector(".chatlog__reactions");
      if (reactions) container.appendChild(reactions.cloneNode(true));
    }
  } catch (_) {}

  sentMessageCount++;
  chatlog.scrollTop = chatlog.scrollHeight;

  replyHTML = "";
  replyTo = null;
  lastSender = currentNickname;

  // Clear + focus
  if (inputEl) {
    inputEl.value = "";
    inputEl.focus();
  }
}

function appendSystemMessage(newNick) {
  const chatlog = document.getElementById("chatlog");
  if (!chatlog) return;

  const timestamp = formatTimestamp(Date.now());
  const container = document.createElement("div");
  container.className = "message system";

  // Keep this simple (you can style in CSS)
  container.innerHTML = `
    <div class="message-content">
      <div class="meta">
        <span class="message-nickname">Clyde BOT</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <div class="content">
        Your nickname on this server has been changed to <strong>[${newNick}]</strong>.
        <span class="delete-hint" style="opacity:.65; margin-left:10px; cursor:pointer;">Only you can see this — delete this message</span>
      </div>
    </div>
  `;

  const hint = container.querySelector(".delete-hint");
  if (hint) hint.addEventListener("click", () => container.remove());

  chatlog.appendChild(container);
  chatlog.scrollTop = chatlog.scrollHeight;
}

// ------------------------------
// Jump helpers (used by inline HTML onclick)
// ------------------------------
function jumpToMessage(id) {
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.value = "";
    document.body.classList.remove("searching");
    applyFilters();
  }

  setTimeout(() => {
    const message = document.getElementById(id);
    if (!message) return;

    message.scrollIntoView({ behavior: "auto", block: "center" });
    message.classList.add("flash-jump");
    setTimeout(() => message.classList.remove("flash-jump"), 1700);
  }, 30);
}

// expose for inline onclick calls in templates
window.jumpToMessage = jumpToMessage;

// ------------------------------
// Fallback avatars
// ------------------------------
const fallbackAvatars = Array.from(
  { length: 57 },
  (_, i) => `/static/missing avatars/${i + 1}.png`
);

const avatarAssignments = {};
function getFallbackAvatar(username) {
  if (!avatarAssignments[username]) {
    const index = Math.floor(Math.random() * fallbackAvatars.length);
    avatarAssignments[username] = fallbackAvatars[index];
  }
  return avatarAssignments[username];
}

// ------------------------------
// Main init
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const chatlog = document.getElementById("chatlog");

  // ===== Search dropdown (ⓘ)
  const searchToggle = document.getElementById("search-toggle");
  const searchHelp = document.getElementById("search-help");

  if (searchToggle && searchHelp) {
    searchToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = searchHelp.style.display === "block";
      searchHelp.style.display = isOpen ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (!searchHelp.contains(e.target) && e.target !== searchToggle) {
        searchHelp.style.display = "none";
      }
    });

    document.querySelectorAll("[data-insert]").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const searchInput = document.getElementById("search");
        const value = item.getAttribute("data-insert");
        if (searchInput && value != null) {
          searchInput.value = value;
          searchInput.dispatchEvent(new Event("input"));
        }
        searchHelp.style.display = "none";
      });
    });
  }

  // ===== Message input + slash dropdown (FIX: define message input first)
  const messageInput = document.getElementById("message-input");
  const slashDropdown = document.getElementById("slash-dropdown");

  if (messageInput && slashDropdown) {
    messageInput.addEventListener("input", (e) => {
      const value = e.target.value || "";
      slashDropdown.style.display = value.startsWith("/") ? "block" : "none";
    });
  }

  document.querySelectorAll(".slash-option").forEach((option) => {
    option.addEventListener("click", () => {
      const command = option.dataset.command || "";
      const inputEl = document.getElementById("message-input");
      if (inputEl) {
        inputEl.value = command + " ";
        inputEl.focus();
      }
      const dd = document.getElementById("slash-dropdown");
      if (dd) dd.style.display = "none";
    });
  });

  // ===== Nickname save
  const nicknameSave = document.getElementById("nickname-save");
  if (nicknameSave) {
    nicknameSave.addEventListener("click", () => {
      const inp = document.getElementById("nickname-input");
      const value = (inp?.value || "").trim();
      if (!value) return;

      const username = "@" + value.toLowerCase().replace(/\s+/g, "");

      const usernameDisplay = document.getElementById("username-display");
      const usernameRow = document.getElementById("username-row");
      const nickDisplay = document.getElementById("nickname-display");
      const nickRow = document.getElementById("nickname-row");

      if (usernameDisplay) usernameDisplay.textContent = username;
      if (usernameRow) usernameRow.textContent = username;

      currentNickname = value;

      if (nickDisplay) nickDisplay.textContent = value;
      if (nickRow) nickRow.textContent = value;

      document.querySelectorAll(".message-nickname").forEach((el) => {
        el.textContent = value;
      });

      // persist
      localStorage.setItem("displayName", value);
      localStorage.setItem("username", username);
    });
  }

  // ===== Banner edit + crop
  const editBannerBtn = document.querySelector(".edit-banner");
  const bannerInput = document.getElementById("banner-input");
  if (editBannerBtn && bannerInput) {
    editBannerBtn.addEventListener("click", () => bannerInput.click());

    bannerInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Crop to 960x540 from center
        const cropWidth = 960;
        const cropHeight = 540;
        const sx = Math.max(0, (img.width - cropWidth) / 2);
        const sy = Math.max(0, (img.height - cropHeight) / 2);

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        ctx.drawImage(
          img,
          sx,
          sy,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        const croppedUrl = canvas.toDataURL("image/png");
        const bannerImg = document.querySelector(".profile-banner img");
        if (bannerImg) bannerImg.src = croppedUrl;
      };
    });
  }

  // ===== Mic / headphones toggles (persist)
  const micBtn = document.getElementById("toggle-mic");
  const micImg = micBtn?.querySelector("img");

  const headphonesBtn = document.getElementById("toggle-headphones");
  const headphonesImg = headphonesBtn?.querySelector("img");

  const micKey = "userMicMuted";
  const headphonesKey = "userDeafened";

  if (micImg && localStorage.getItem(micKey) === "true") {
    micImg.src = "/static/icons/mic-off.svg";
  }
  if (headphonesImg && localStorage.getItem(headphonesKey) === "true") {
    headphonesImg.src = "/static/icons/headphone-off.svg";
  }

  micBtn?.addEventListener("click", () => {
    if (!micImg) return;
    const isMuted = micImg.src.includes("mic-off");
    micImg.src = isMuted ? "/static/icons/mic.svg" : "/static/icons/mic-off.svg";
    localStorage.setItem(micKey, String(!isMuted));
  });

  headphonesBtn?.addEventListener("click", () => {
    if (!headphonesImg) return;
    const isDeaf = headphonesImg.src.includes("headphone-off");
    headphonesImg.src = isDeaf
      ? "/static/icons/headphones.svg"
      : "/static/icons/headphone-off.svg";
    localStorage.setItem(headphonesKey, String(!isDeaf));
  });

  // ===== Settings overlay show/hide
  document.querySelector('[data-section="my-account"]')?.addEventListener("click", () => {
    const allSections = document.querySelectorAll(".settings-body > *");
    allSections.forEach((el) => (el.style.display = "none"));
    const myAccount = document.querySelector(".my-account");
    if (myAccount) myAccount.style.display = "flex";
  });

  document.getElementById("settings-btn")?.addEventListener("click", () => {
    const overlay = document.getElementById("settings-overlay");
    if (overlay) overlay.style.display = "flex";
  });

  document.getElementById("close-settings")?.addEventListener("click", () => {
    const overlay = document.getElementById("settings-overlay");
    if (overlay) overlay.style.display = "none";
  });

  // ===== Auto-hide scrollbars
  enableAutoHideScrollbars(".chatlog, .settings-sidebar, .settings-content");

  // ===== Build search index
  messages = Array.from(document.querySelectorAll(".message")).map((msg) => {
    const contentNode = msg.querySelector(".content");
    const nameNode = msg.querySelector(".message-nickname");

    const contentText = (contentNode?.innerText || "").toLowerCase();
    const nameText = (nameNode?.innerText || "").toLowerCase();

    const hasLink = (() => {
      if (!contentNode) return false;
      return Array.from(contentNode.querySelectorAll("a")).some((link) => {
        const href = link.getAttribute("href");
        return href && (href.startsWith("http://") || href.startsWith("https://"));
      });
    })();

    return { element: msg, content: contentText, username: nameText, hasLink };
  });

  // ===== Assign fallback timestamps for "Unknown"
  let lastKnownTimestamp = null;
  messages.forEach(({ element }) => {
    const nameEl = element.querySelector(".message-nickname");
    const timeEl = element.querySelector(".timestamp");
    const username = (nameEl?.textContent || "").trim();
    const timestamp = (timeEl?.textContent || "").trim();

    if (username.toLowerCase() !== "unknown" && timestamp) {
      lastKnownTimestamp = timestamp;
    }

    if (username.toLowerCase() === "unknown" && !timestamp && lastKnownTimestamp) {
      if (timeEl) timeEl.textContent = lastKnownTimestamp;
      else {
        const newSpan = document.createElement("span");
        newSpan.className = "timestamp";
        newSpan.textContent = lastKnownTimestamp;
        element.querySelector(".meta")?.appendChild(newSpan);
      }
    }
  });

  // ===== Wire search input
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const value = (e.target.value || "").trim();
      document.body.classList.toggle("searching", value.length > 0);
      applyFilters();

      // If cleared, jump to bottom (Discord-ish)
      if (value === "" && chatlog) {
        setTimeout(() => {
          chatlog.scrollTop = chatlog.scrollHeight;
        }, 10);
      }
    });
  }

  // ===== Scroll to bottom on load
  window.addEventListener("load", () => {
    if (chatlog) chatlog.scrollTop = chatlog.scrollHeight;
    replyHTML = "";
    replyTo = null;
  });

  // ===== Jump button: top/bottom toggle
  const scrollBtn = document.getElementById("scroll-jump-btn");
  if (scrollBtn && chatlog) {
    scrollBtn.addEventListener("click", () => {
      const toBottom = scrollBtn.textContent === "Jump to Bottom";
      chatlog.scrollTop = toBottom ? chatlog.scrollHeight : 0;
      scrollBtn.textContent = toBottom ? "Jump to Top" : "Jump to Bottom";
    });
  }

  // ===== Random message
  const randomBtn = document.getElementById("random-message-btn");
  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      const all = Array.from(document.querySelectorAll(".message"));
      if (!all.length) return;

      const random = Math.floor(Math.random() * all.length);
      const message = all[random];

      message.scrollIntoView({ behavior: "smooth", block: "center" });
      message.classList.add("flash-jump");
      setTimeout(() => message.classList.remove("flash-jump"), 1700);
    });
  }

  // ===== Sending messages + slash commands
  const sendBtn = document.getElementById("send-button");

  function sendMessage() {
    if (!messageInput) return;

    const raw = messageInput.value.trim();
    if (!raw) return;

    // Slash commands
    if (raw.startsWith("/nick ")) {
      const newNick = raw.slice(6).trim() || "You";
      currentNickname = newNick;
      messageInput.value = "";
      appendSystemMessage(newNick);
      return;
    }

    if (raw === "/tableflip" || raw === "/flip") {
      appendMessage("(╯°□°)╯︵ ┻━┻");
      messageInput.value = "";
      return;
    }

    if (raw === "/unflip") {
      appendMessage("┬─┬ ノ( ゜-゜ノ)");
      messageInput.value = "";
      return;
    }

    if (raw === "/shrug") {
      appendMessage("¯\\_(ツ)_/¯");
      messageInput.value = "";
      return;
    }

    appendMessage(raw);
    messageInput.value = "";
    messageInput.focus();
  }

  if (sendBtn && messageInput) {
    sendBtn.addEventListener("click", sendMessage);

    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // ===== Delete key nukes user messages (as you had)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Delete") {
      document.querySelectorAll(".message.user-message").forEach((msg) => msg.remove());
    }
  });

  // ===== Insert toggles light mode while preserving distance from bottom
  document.addEventListener("keydown", (e) => {
    if (e.key === "Insert") {
      const cl = document.getElementById("chatlog");
      if (!cl) return;

      const distanceFromBottom = cl.scrollHeight - cl.scrollTop;
      document.body.classList.toggle("light-mode");

      requestAnimationFrame(() => {
        cl.scrollTop = cl.scrollHeight - distanceFromBottom;
      });
    }
  });

  // ===== Global shortcuts
  document.addEventListener("keydown", (e) => {
    const active = document.activeElement;
    const searchDropdown = document.getElementById("search-help");

    // Escape: blur inputs + close dropdowns
    if (e.key === "Escape") {
      if (active && (active.id === "message-input" || active.id === "search")) {
        active.blur();
      }
      if (searchDropdown) searchDropdown.style.display = "none";
      if (slashDropdown) slashDropdown.style.display = "none";
    }

    // Enter closes slash dropdown
    if (e.key === "Enter") {
      if (slashDropdown) slashDropdown.style.display = "none";
    }

    // `/` focuses message input
    if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
      if (active !== messageInput) {
        e.preventDefault();
        messageInput?.focus();
      }
    }

    // Ctrl/Cmd+F focuses search input
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      document.getElementById("search")?.focus();
    }
  });

  // ===== Fallback avatar assignment
  document.querySelectorAll("img.fallback-avatar").forEach((img) => {
    const avatar = img.dataset.avatar;
    const username = img.dataset.username || "unknown";

    // If already a data URL, keep it
    if ((img.src || "").startsWith("data:image/")) return;

    if (avatar && avatar.trim()) {
      const testImg = new Image();
      testImg.src = avatar;
      testImg.onload = () => {
        img.src = avatar;
      };
      testImg.onerror = () => {
        img.src = getFallbackAvatar(username);
      };
    } else {
      img.src = getFallbackAvatar(username);
    }
  });
});

// ------------------------------
// Reply menu (context menu)
// ------------------------------
let selectedMessage = null;

document.addEventListener("contextmenu", (e) => {
  const message = e.target.closest(".message");
  if (!message) return;

  e.preventDefault();
  selectedMessage = message;

  const menu = document.getElementById("reply-menu");
  if (!menu) return;

  menu.style.display = "block";
  menu.style.top = `${e.pageY}px`;
  menu.style.left = `${e.pageX}px`;
});

document.addEventListener("click", () => {
  const menu = document.getElementById("reply-menu");
  if (menu) menu.style.display = "none";
});

// For your existing HTML: onclick="replyToSelected()"
function replyToSelected() {
  if (!selectedMessage) return;

  const user =
    selectedMessage.querySelector(".message-nickname")?.textContent || "User";
  const input = document.getElementById("message-input");
  if (!input) return;

  input.value = `@${user} `;
  input.focus();

  const menu = document.getElementById("reply-menu");
  if (menu) menu.style.display = "none";
}

window.replyToSelected = replyToSelected;
