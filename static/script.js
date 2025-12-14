let currentNickname = "You";

let replyHTML = '';
let replyTo = null;
let messages = [];
let sentMessageCount = 0;
let currentAvatarURL = "/static/avatar.png";

document.addEventListener('DOMContentLoaded', () => {
// Search Dropdown
const toggle = document.getElementById('search-toggle');
const dropdown = document.getElementById('search-help');
if (toggle && dropdown) {
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== toggle) {
      dropdown.style.display = "none";
    }
  });

  document.querySelectorAll('[data-insert]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const searchInput = document.getElementById('search');
      const value = item.getAttribute('data-insert');
      if (searchInput) {
        searchInput.value = value;
        searchInput.dispatchEvent(new Event('input'));
      }
      dropdown.style.display = 'none';
    });
  });
}

const slashDropdown = document.getElementById("slash-dropdown");
input?.addEventListener("input", (e) => {
  const value = e.target.value;
  if (value.startsWith("/")) {
    slashDropdown.style.display = "block";
  } else {
    slashDropdown.style.display = "none";
  }
});

document.querySelectorAll('.slash-option').forEach(option => {
  option.addEventListener('click', () => {
    const command = option.dataset.command;
    const input = document.getElementById('message-input');
    if (input) {
      input.value = command + ' ';
      input.focus();
    }
    document.getElementById('slash-dropdown').style.display = 'none';
  });
});

document.getElementById("nickname-save").addEventListener("click", () => {
  const value = document.getElementById("nickname-input").value.trim();
  if (!value) return;

  const username = "@" + value.toLowerCase().replace(/\s+/g, '');

  document.getElementById("username-display").textContent = username;
  document.getElementById("username-row").textContent = username;

  currentNickname = value;

  document.getElementById("nickname-display").textContent = value;
  document.getElementById("nickname-row").textContent = value;

  document.querySelectorAll(".message-nickname").forEach(el => {
    el.textContent = value;
  });

  // ✅ Save display name to localStorage
  localStorage.setItem("displayName", value);
  localStorage.setItem("username", username);
});

document.querySelector(".edit-banner").addEventListener("click", () => {
  document.getElementById("banner-input").click();
});

document.getElementById("banner-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Crop to 960x540 from center
    const cropWidth = 960;
    const cropHeight = 540;

    const sx = Math.max(0, (img.width - cropWidth) / 2);
    const sy = Math.max(0, (img.height - cropHeight) / 2);

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const croppedUrl = canvas.toDataURL("image/png");
    document.querySelector(".profile-banner img").src = croppedUrl;
  };
});

const micBtn = document.getElementById('toggle-mic');
const micImg = micBtn?.querySelector('img');

const headphonesBtn = document.getElementById('toggle-headphones');
const headphonesImg = headphonesBtn?.querySelector('img');

const micKey = "userMicMuted";
const headphonesKey = "userDeafened";

// Load saved states
if (micImg && localStorage.getItem(micKey) === "true") {
  micImg.src = "/static/icons/mic-off.svg";
}

if (headphonesImg && localStorage.getItem(headphonesKey) === "true") {
  headphonesImg.src = "/static/icons/headphone-off.svg";
}

// Mic toggle
micBtn?.addEventListener('click', () => {
  const isMuted = micImg.src.includes("mic-off");
  micImg.src = isMuted
    ? "/static/icons/mic.svg"
    : "/static/icons/mic-off.svg"; // ← red-colored version
  localStorage.setItem(micKey, !isMuted);
});

// Headphones toggle
headphonesBtn?.addEventListener('click', () => {
  const isDeaf = headphonesImg.src.includes("headphone-off");
  headphonesImg.src = isDeaf
    ? "/static/icons/headphones.svg"
    : "/static/icons/headphone-off.svg"; // ← red-colored version
  localStorage.setItem(headphonesKey, !isDeaf);
});

// Show "My Account" content when clicked
document.querySelector('[data-section="my-account"]')?.addEventListener('click', () => {
  const allSections = document.querySelectorAll('.settings-body > *');
  allSections.forEach(el => el.style.display = 'none');

  const myAccount = document.querySelector('.my-account');
  if (myAccount) myAccount.style.display = 'flex';
});

document.getElementById("settings-btn")?.addEventListener("click", () => {
  document.getElementById("settings-overlay").style.display = "flex";
});

document.getElementById("close-settings")?.addEventListener("click", () => {
  document.getElementById("settings-overlay").style.display = "none";
});

function enableAutoHideScrollbars(selector) {
  document.querySelectorAll(selector).forEach(container => {
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

enableAutoHideScrollbars(".chatlog, .settings-sidebar, .settings-content");

const searchInput = document.getElementById('search');
const chatlog = document.getElementById('chatlog');

messages = Array.from(document.querySelectorAll('.message')).map(msg => ({
  element: msg,
  content: msg.querySelector('.content')?.innerText.toLowerCase() || '',
  username: msg.querySelector('.message-nickname')?.innerText.toLowerCase() || '',
  hasLink: (() => {
    const content = msg.querySelector('.content');
    if (!content) return false;
    return Array.from(content.querySelectorAll('a')).some(link => {
      const href = link.getAttribute('href');
      return href && (href.startsWith('http://') || href.startsWith('https://'));
    });
  })()
}));

// Assign fallback timestamps to Unknown messages
let lastKnownTimestamp = null;

messages.forEach(({ element }) => {
  const nameEl = element.querySelector('.message-nickname');
  const timeEl = element.querySelector('.timestamp');

  const username = nameEl?.textContent?.trim() || '';
  const timestamp = timeEl?.textContent?.trim();

  if (username.toLowerCase() !== 'unknown' && timestamp) {
    lastKnownTimestamp = timestamp;
  }

  if (username.toLowerCase() === 'unknown' && (!timestamp || timestamp === '')) {
    if (lastKnownTimestamp) {
      if (timeEl) {
        timeEl.textContent = lastKnownTimestamp;
      } else {
        const newSpan = document.createElement('span');
        newSpan.className = 'timestamp';
        newSpan.textContent = lastKnownTimestamp;
        const meta = element.querySelector('.meta');
        if (meta) meta.appendChild(newSpan);
      }
    }
  }
});

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    document.body.classList.toggle('searching', value.length > 0);
    applyFilters();

    if (value === "" && chatlog) {
      setTimeout(() => {
        chatlog.scrollTop = chatlog.scrollHeight;
      }, 10); // let DOM update first
    }
  });
}});

const scrollBtn = document.getElementById('scroll-jump-btn');

window.addEventListener('load', () => {
  if (chatlog) chatlog.scrollTop = chatlog.scrollHeight;
  replyHTML = '';
  replyTo = null;
});

if (scrollBtn && chatlog) {
  scrollBtn.addEventListener('click', () => {
    const toBottom = scrollBtn.textContent === 'Jump to Bottom';
    chatlog.scrollTop = toBottom ? chatlog.scrollHeight : 0;
    scrollBtn.textContent = toBottom ? 'Jump to Top' : 'Jump to Bottom';
  });
}

const randomBtn = document.getElementById('random-message-btn');

if (randomBtn && chatlog) {
  randomBtn.addEventListener('click', () => {
    const allMessages = document.querySelectorAll(".message");
    if (!allMessages.length) return;

    const random = Math.floor(Math.random() * allMessages.length);
    const message = allMessages[random];

    message.scrollIntoView({ behavior: "smooth", block: "center" });

    // Add fade highlight like Jump
    message.classList.add("flash-jump");
    setTimeout(() => {
      message.classList.remove("flash-jump");
    }, 1700);
  });
}

const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-button');

function formatTimestamp(date) {
  const d = new Date(date);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).replace(/, /g, ' ');
}

let lastSender = null;

function appendMessage(content) {
  const chatlog = document.getElementById('chatlog');
  const timestamp = formatTimestamp(Date.now());

  const container = document.createElement('div');
  container.className = 'message user-message';

  const isGrouped = lastSender === currentNickname;
  if (isGrouped) {
    container.classList.add("grouped-message");
  }

  // Avatar
  if (!isGrouped) {
    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = currentAvatarURL;
    avatar.alt = 'Avatar';
    container.appendChild(avatar);
  }

  // Message block
  const msgContent = document.createElement('div');
  msgContent.className = 'message-content';

  // Optional meta
  if (!isGrouped) {
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      <span class="username">${currentNickname}</span>
      <span class="timestamp">${timestamp}</span>
    `;
    msgContent.appendChild(meta);
  }

  // Actual message text
  const body = document.createElement('div');
  body.className = 'content';
  body.textContent = content;
  msgContent.appendChild(body);

  container.appendChild(msgContent);

  chatlog.appendChild(container);
  // Look for matching archived message to grab reactions
const archivedMessages = document.querySelectorAll('.chatlog__message-container');
const corresponding = archivedMessages[archivedMessages.length - sentMessageCount - 1];

if (corresponding) {
  const reactions = corresponding.querySelector('.chatlog__reactions');
  if (reactions) {
    const clone = reactions.cloneNode(true);
    container.appendChild(clone);
  }
}
sentMessageCount++;

  chatlog.scrollTop = chatlog.scrollHeight;

  replyHTML = '';
  replyTo = null;
  lastSender = currentNickname;

  // Critical: clear the input field so you can send again
  input.value = '';
  input.focus();
}

function appendSystemMessage(newNick) {
  const chatlog = document.getElementById('chatlog');
  const timestamp = formatTimestamp(Date.now());

  const container = document.createElement('div');
  container.className = 'message system';

  container.innerHTML = `
    <img class="avatar" src="/static/clyde.png" alt="Clyde">
    <div class="message-content">
      <div class="meta">
        <span class="username">Clyde</span>
        <span class="bot-tag">BOT</span>
        <span class="timestamp">${timestamp}</span>
      </div>
      <div class="content">Your nickname on this server has been changed to <strong>[${newNick}]</strong>.</div>
      <div class="note">Only you can see this — <span class="delete-hint">delete this message</span></div>
    </div>
  `;

  container.querySelector('.delete-hint').addEventListener('click', () => {
    container.remove();
  });

  chatlog.appendChild(container);
  chatlog.scrollTop = chatlog.scrollHeight;
}

function sendMessage() {
  const raw = input.value.trim();

  if (!raw) return;

  if (raw.startsWith("/nick ")) {
    const newNick = raw.slice(6).trim() || "You";
    currentNickname = newNick;
    input.value = "";
    appendSystemMessage(newNick);
    return;
  }

  if (raw === "/tableflip") {
    appendMessage("(╯°□°)╯︵ ┻━┻");
    input.value = "";
    return;
  }

    if (raw === "/flip") {
    appendMessage("(╯°□°)╯︵ ┻━┻");
    input.value = "";
    return;
  }

  if (raw === "/unflip") {
    appendMessage("┬─┬ ノ( ゜-゜ノ)");
    input.value = "";
    return;
  }

  if (raw === "/shrug") {
    appendMessage("¯\\_(ツ)_/¯");
    input.value = "";
    return;
  }

  appendMessage(raw);
  input.value = "";
  input.focus();
}

if (sendBtn && input) {
  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}


document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete') {
    document.querySelectorAll('.message.user-message').forEach(msg => msg.remove());
  }
});

let selectedMessage = null;

function replyToSelected() {
  if (selectedMessage) {
    setReply(selectedMessage);
    document.getElementById("reply-menu").style.display = "none";
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Insert') {
    const chatlog = document.getElementById('chatlog');

    // Capture current distance from bottom
    const distanceFromBottom = chatlog.scrollHeight - chatlog.scrollTop;

    // Toggle theme
    document.body.classList.toggle('light-mode');

    // Restore distance from bottom after DOM changes settle
    requestAnimationFrame(() => {
      chatlog.scrollTop = chatlog.scrollHeight - distanceFromBottom;
    });
  }
});

document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  const messageInput = document.getElementById("message-input");
  const searchInput = document.getElementById("search");
  const searchDropdown = document.getElementById("search-help");
  const slashDropdown = document.getElementById("slash-dropdown");

  // Escape: blur input and close dropdowns
  if (e.key === "Escape") {
    if (active && (active.id === "message-input" || active.id === "search")) {
      active.blur();
    }
    if (searchDropdown) searchDropdown.style.display = "none";
    if (slashDropdown) slashDropdown.style.display = "none";
  }

  // Enter key closes the slash command dropdown
  if (e.key === "Enter") {
    const slashDropdown = document.getElementById("slash-dropdown");
    if (slashDropdown) {
      slashDropdown.style.display = "none";
    }
  }

  // Pressing `/` focuses the message input
  if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
    if (active !== messageInput) {
      e.preventDefault();
      messageInput?.focus();
    }
  }

  // Ctrl+F or Cmd+F focuses the search input
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    e.preventDefault();
    searchInput?.focus();
  }
});

// ========== Reimplemented Fallback Avatar System ==========
const fallbackAvatars = Array.from({ length: 57 }, (_, i) => `/static/missing avatars/${i + 1}.png`);
const avatarAssignments = {};

function getFallbackAvatar(username) {
  if (!avatarAssignments[username]) {
    const index = Math.floor(Math.random() * fallbackAvatars.length);
    avatarAssignments[username] = fallbackAvatars[index];
  }
  return avatarAssignments[username];
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("img.fallback-avatar").forEach(img => {
    const avatar = img.dataset.avatar;
    const username = img.dataset.username || "unknown";

    if (img.src.startsWith("data:image/")) return;

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

function jumpToMessage(id) {
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.value = "";
    document.body.classList.remove("searching");
    applyFilters();
  }

  setTimeout(() => {
    const message = document.getElementById(id);
    if (message) {
      // Scroll into center
      message.scrollIntoView({ behavior: "auto", block: "center" });

      // Add flash highlight
      message.classList.add("flash-jump");
      setTimeout(() => {
        message.classList.remove("flash-jump");
      }, 1700); // highlight duration
    }
  }, 30);
}

function applyFilters() {
  const query = document.getElementById('search').value.toLowerCase().trim();
  const parts = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  messages.forEach(({ element, content, username, hasLink }) => {
    let show = true;

    for (const part of parts) {
      if (part.startsWith("has:")) {
        const key = part.slice(4);
        if (key === "link") {
          show = show && hasLink;
        } else {
          show = false;
        }
      } else if (part.startsWith("from:")) {
        const name = part.slice(5).trim();
        show = show && username.includes(name);
      } else {
        show = show && (content.includes(part) || username.includes(part));
      }

      if (!show) break;
    }

    element.style.display = show ? '' : 'none';
  });
  
  // Highlight matches
  highlightMatches(query);
}
function highlightMatches(query) {
  const terms = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const highlightable = terms.filter(t => !t.startsWith("has:") && !t.startsWith("from:"));

  messages.forEach(({ element }) => {
    const contentNode = element.querySelector(".content");
    const originalText = contentNode?.textContent || "";

    if (!contentNode || highlightable.length === 0) {
      if (contentNode) contentNode.innerHTML = contentNode.textContent;
      return;
    }

    let html = originalText;
    for (const term of highlightable) {
      const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${safeTerm})`, "gi");
      html = html.replace(regex, "<mark>$1</mark>");
    }

    contentNode.innerHTML = html;
  });
}