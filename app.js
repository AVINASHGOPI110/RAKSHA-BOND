const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

const outfits = {
  brother: {
    marigold: {
      label: "Marigold kurta",
      primary: "#d88424",
      trim: "#f4d06f",
      pants: "#f6e0b3"
    },
    royal: {
      label: "Royal sherwani",
      primary: "#6f3ca5",
      trim: "#d6b64c",
      pants: "#2f244f"
    },
    teal: {
      label: "Teal nehru set",
      primary: "#087f83",
      trim: "#f1bb5c",
      pants: "#f3eadb"
    }
  },
  sister: {
    rose: {
      label: "Rose lehenga",
      primary: "#c63d69",
      trim: "#f0bd54",
      pants: "#8f2449"
    },
    peacock: {
      label: "Peacock anarkali",
      primary: "#087f83",
      trim: "#e7b94b",
      pants: "#075c61"
    },
    gold: {
      label: "Gold saree",
      primary: "#d69a29",
      trim: "#bf345f",
      pants: "#a06b1b"
    }
  }
};

const rakhiModels = {
  classic: "Classic",
  floral: "Floral",
  royal: "Royal",
  pearl: "Pearl"
};

const rakhiColors = {
  crimson: { label: "Crimson", thread: "#c83355", center: "#f5bf43" },
  saffron: { label: "Saffron", thread: "#df8a1f", center: "#ba334f" },
  peacock: { label: "Peacock", thread: "#087f83", center: "#f2c95a" },
  rose: { label: "Rose", thread: "#c14b77", center: "#f6d9a0" }
};

const reactionMeta = {
  smile: { label: "Big smile", color: "#df8a1f" },
  blessed: { label: "Blessings", color: "#087f83" },
  moved: { label: "Happy tears", color: "#3f8fc8" },
  hug: { label: "Heart hug", color: "#c63d69" }
};

let draft = {
  sisterName: "",
  brotherName: "",
  sisterAge: 13,
  brotherAge: 15,
  sisterOutfit: "rose",
  brotherOutfit: "marigold",
  rakhiModel: "classic",
  rakhiColor: "crimson"
};

let countdownTimer = null;
let ceremonyTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clampAge(age) {
  const number = Number(age);
  if (!Number.isFinite(number)) return 12;
  return Math.min(150, Math.max(5, Math.round(number)));
}

function cleanText(value, fallback) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text || fallback;
}

function serialize(data) {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function deserialize(token) {
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    return null;
  }
}

function buildUrl(mode, data) {
  return `${window.location.href.split("#")[0]}#${mode}=${serialize(data)}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function clearTimers() {
  window.clearInterval(countdownTimer);
  window.clearTimeout(ceremonyTimer);
}

function ageScale(age) {
  const safeAge = clampAge(age);
  if (safeAge <= 18) return 0.58 + ((safeAge - 5) / 13) * 0.34;
  if (safeAge <= 40) return 0.92 + ((safeAge - 18) / 22) * 0.12;
  return 1.04 + Math.min((safeAge - 40) / 110, 1) * 0.05;
}

function ageGroup(age) {
  const safeAge = clampAge(age);
  if (safeAge < 13) return "child";
  if (safeAge < 20) return "teen";
  if (safeAge < 60) return "adult";
  if (safeAge < 90) return "senior";
  return "elder";
}

function getRakhiTheme(data) {
  return rakhiColors[data.rakhiColor] || rakhiColors.crimson;
}

function rakhiMarkup(data, extraClass = "") {
  const theme = getRakhiTheme(data);
  const model = data.rakhiModel || "classic";
  return `
    <div class="rakhi-token model-${escapeHtml(model)} ${extraClass}" style="--thread: ${theme.thread}; --center: ${theme.center};" aria-hidden="true">
      <span class="rakhi-center"></span>
    </div>
  `;
}

function avatarMarkup(role, age, outfitKey) {
  const palette = outfits[role][outfitKey] || Object.values(outfits[role])[0];
  const safeAge = clampAge(age);
  const headExtras = role === "sister" ? '<span class="bindi"></span>' : '<span class="tilak"></span>';
  const bodyExtras = role === "sister" ? '<span class="jewelry"></span><span class="dupatta"></span><span class="skirt"></span>' : "";
  return `
    <div
      class="avatar avatar--${role} age-${ageGroup(safeAge)}"
      style="--age-scale: ${ageScale(safeAge).toFixed(2)}; --cloth: ${palette.primary}; --trim: ${palette.trim}; --pants: ${palette.pants}; --skin: #d69a73; --skin-shadow: rgba(106, 58, 39, 0.12);"
      aria-hidden="true"
    >
      <span class="avatar-shadow"></span>
      <span class="hair"></span>
      <span class="ear ear-left"></span>
      <span class="ear ear-right"></span>
      <span class="head">
        <span class="cheek cheek-left"></span>
        <span class="cheek cheek-right"></span>
        <span class="face-detail"></span>
        <span class="nose"></span>
        ${headExtras}
      </span>
      ${bodyExtras}
      <span class="topwear"></span>
      ${role === "brother" ? '<span class="legs"></span>' : ""}
      <span class="arm arm-left"><span class="hand"></span></span>
      <span class="arm arm-right"><span class="hand"></span><span class="wrist-band"></span></span>
      <span class="feet"></span>
    </div>
  `;
}

function normalizeReactions(value) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(raw)].filter((reaction) => reactionMeta[reaction]);
}

function reactionStagesMarkup(reactions) {
  return normalizeReactions(reactions)
    .map((reaction, index) => {
      const color = reactionMeta[reaction].color;
      return `
        <div
          class="reaction-stage reaction-stage--${index % 4}"
          data-reaction="${escapeHtml(reaction)}"
          style="--burst-color: ${color};"
          aria-hidden="true"
        >
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      `;
    })
    .join("");
}

function stageMarkup(data, options = {}) {
  const phaseClass = options.phase ? ` is-${options.phase}` : "";
  const sisterName = cleanText(data.sisterName, "Sister");
  const brotherName = cleanText(data.brotherName, "Brother");
  const showCenterRakhi = options.centerRakhi === true;
  const showMotionRakhi = options.motionRakhi === true;
  const count = options.count;
  const reactions = normalizeReactions(options.reactions ?? options.reaction);

  return `
    <div class="festival-stage${phaseClass}" id="preview">
      <span class="stage-light"></span>
      <div class="character character--sister">
        ${avatarMarkup("sister", data.sisterAge, data.sisterOutfit)}
        <span class="character-name">${escapeHtml(sisterName)}</span>
      </div>
      <div class="character character--brother">
        ${avatarMarkup("brother", data.brotherAge, data.brotherOutfit)}
        <span class="character-name">${escapeHtml(brotherName)}</span>
      </div>
      ${showCenterRakhi ? `<div class="stage-rakhi">${rakhiMarkup(data)}</div>` : ""}
      ${showMotionRakhi ? rakhiMarkup(data, "rakhi-in-motion") : ""}
      ${reactionStagesMarkup(reactions)}
      ${Number.isFinite(count) ? `
        <div class="countdown-overlay">
          <span class="count-number">${count}</span>
        </div>
      ` : ""}
    </div>
  `;
}

function choiceButton(type, key, selected, label, color) {
  return `
    <button class="choice${selected ? " is-selected" : ""}" type="button" data-choice="${type}" data-value="${escapeHtml(key)}" aria-pressed="${selected}">
      <span class="swatch" style="--swatch: ${color};" aria-hidden="true"></span>
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

function renderBuilder(linkData = null) {
  clearTimers();
  app.innerHTML = `
    <section class="screen builder-layout">
      <div>
        <div class="intro-copy">
          <p class="eyebrow">Raksha Bandhan, even from far away</p>
          <h1>Digital Rakhi</h1>
          <p class="note">
            <strong>A small celebration for brothers and sisters who are living apart.</strong>
            Create your characters, choose a rakhi, share a ceremony link, and keep the promise note together.
          </p>
        </div>

        <form class="panel form-panel" id="builder-form">
          <div class="panel-header">
            <div>
              <h2>Create the ceremony</h2>
              <p>Names, ages, outfits, and rakhi style.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label for="sisterName">Sister name</label>
              <input class="input" id="sisterName" name="sisterName" maxlength="24" value="${escapeHtml(draft.sisterName)}" autocomplete="given-name">
            </div>
            <div class="field">
              <label for="brotherName">Brother name</label>
              <input class="input" id="brotherName" name="brotherName" maxlength="24" value="${escapeHtml(draft.brotherName)}" autocomplete="given-name">
            </div>
            <div class="field">
              <label for="sisterAge">Sister age</label>
              <div class="age-row">
                <input id="sisterAge" name="sisterAge" type="range" min="5" max="150" value="${draft.sisterAge}">
                <span class="age-badge" id="sisterAgeValue">${draft.sisterAge}</span>
              </div>
            </div>
            <div class="field">
              <label for="brotherAge">Brother age</label>
              <div class="age-row">
                <input id="brotherAge" name="brotherAge" type="range" min="5" max="150" value="${draft.brotherAge}">
                <span class="age-badge" id="brotherAgeValue">${draft.brotherAge}</span>
              </div>
            </div>
          </div>

          <div class="choice-group">
            <span class="group-label">Sister outfit</span>
            <div class="choice-grid">
              ${Object.entries(outfits.sister)
                .map(([key, item]) => choiceButton("sisterOutfit", key, draft.sisterOutfit === key, item.label, item.primary))
                .join("")}
            </div>
          </div>

          <div class="choice-group">
            <span class="group-label">Brother outfit</span>
            <div class="choice-grid">
              ${Object.entries(outfits.brother)
                .map(([key, item]) => choiceButton("brotherOutfit", key, draft.brotherOutfit === key, item.label, item.primary))
                .join("")}
            </div>
          </div>

          <hr class="section-rule">

          <div class="choice-group">
            <span class="group-label">Rakhi model</span>
            <div class="choice-grid rakhi-grid">
              ${Object.entries(rakhiModels)
                .map(([key, label]) => `
                  <button class="choice${draft.rakhiModel === key ? " is-selected" : ""}" type="button" data-choice="rakhiModel" data-value="${escapeHtml(key)}" aria-pressed="${draft.rakhiModel === key}">
                    ${rakhiMarkup({ ...draft, rakhiModel: key }, "")}
                    <span>${escapeHtml(label)}</span>
                  </button>
                `)
                .join("")}
            </div>
          </div>

          <div class="choice-group">
            <span class="group-label">Rakhi color</span>
            <div class="choice-grid rakhi-grid">
              ${Object.entries(rakhiColors)
                .map(([key, item]) => choiceButton("rakhiColor", key, draft.rakhiColor === key, item.label, item.thread))
                .join("")}
            </div>
          </div>

          <div class="actions">
            <button class="button primary" type="submit">Create brother link</button>
            <button class="button ghost" type="button" id="resetDraft">Reset</button>
          </div>

          ${linkData ? `
            <div class="link-box" id="brother-link-box">
              <div class="status-line">Share this link with the brother</div>
              <a class="link-output" href="${escapeHtml(linkData.url)}">${escapeHtml(linkData.url)}</a>
              <div class="actions">
                <button class="button secondary" type="button" data-copy="${escapeHtml(linkData.url)}">Copy link</button>
                <a class="button ghost" href="${escapeHtml(linkData.url)}">Open ceremony</a>
              </div>
            </div>
          ` : ""}
        </form>
      </div>

      <aside class="panel preview-panel" aria-label="Ceremony preview">
        <div class="preview-toolbar">
          <h2>Live ceremony preview</h2>
          <span class="mini-chip">${escapeHtml(rakhiModels[draft.rakhiModel])} rakhi</span>
        </div>
        <div class="stage-wrap" id="builder-stage">
          ${stageMarkup(draft, { centerRakhi: true })}
        </div>
      </aside>
    </section>
  `;

  bindBuilder();
}

function bindBuilder() {
  const form = document.querySelector("#builder-form");
  const stage = document.querySelector("#builder-stage");

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (!target.name) return;

    if (target.name === "sisterAge" || target.name === "brotherAge") {
      draft[target.name] = clampAge(target.value);
      document.querySelector(`#${target.name}Value`).textContent = draft[target.name];
    } else {
      draft[target.name] = target.value;
    }

    stage.innerHTML = stageMarkup(draft, { centerRakhi: true });
  });

  form.addEventListener("click", async (event) => {
    const choice = event.target.closest("[data-choice]");
    const copy = event.target.closest("[data-copy]");

    if (choice) {
      draft[choice.dataset.choice] = choice.dataset.value;
      renderBuilder();
      return;
    }

    if (copy) {
      await copyLink(copy.dataset.copy);
      return;
    }

    if (event.target.closest("#resetDraft")) {
      draft = {
        sisterName: "",
        brotherName: "",
        sisterAge: 13,
        brotherAge: 15,
        sisterOutfit: "rose",
        brotherOutfit: "marigold",
        rakhiModel: "classic",
        rakhiColor: "crimson"
      };
      renderBuilder();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const ceremony = {
      sisterName: cleanText(draft.sisterName, "Sister"),
      brotherName: cleanText(draft.brotherName, "Brother"),
      sisterAge: clampAge(draft.sisterAge),
      brotherAge: clampAge(draft.brotherAge),
      sisterOutfit: outfits.sister[draft.sisterOutfit] ? draft.sisterOutfit : "rose",
      brotherOutfit: outfits.brother[draft.brotherOutfit] ? draft.brotherOutfit : "marigold",
      rakhiModel: rakhiModels[draft.rakhiModel] ? draft.rakhiModel : "classic",
      rakhiColor: rakhiColors[draft.rakhiColor] ? draft.rakhiColor : "crimson",
      createdAt: new Date().toISOString()
    };
    const url = buildUrl("brother", ceremony);
    renderBuilder({ url });
    document.querySelector("#brother-link-box")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showToast("Brother link is ready.");
  });
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copied.");
  } catch (error) {
    showToast("Select the link and copy it.");
  }
}

function renderBrotherIntro(data) {
  clearTimers();
  app.innerHTML = `
    <section class="screen ceremony-screen">
      <div class="ceremony-shell">
        <div class="panel preview-panel">
          <div class="stage-wrap" id="ceremony-stage">
            ${stageMarkup(data, { count: 5 })}
          </div>
        </div>
        <aside class="panel side-panel">
          <p class="eyebrow">For ${escapeHtml(cleanText(data.brotherName, "Brother"))}</p>
          <h1>${escapeHtml(cleanText(data.sisterName, "Sister"))} sent you a Rakhi</h1>
          <p>The ceremony starts now.</p>
        </aside>
      </div>
    </section>
  `;
  startCountdown(data);
}

function startCountdown(data) {
  const stage = document.querySelector("#ceremony-stage");
  let count = 5;
  stage.innerHTML = stageMarkup(data, { count });
  countdownTimer = window.setInterval(() => {
    count -= 1;
    if (count > 0) {
      stage.innerHTML = stageMarkup(data, { count });
      return;
    }
    window.clearInterval(countdownTimer);
    startTyingAnimation(data);
  }, 1000);
}

function startTyingAnimation(data) {
  const stage = document.querySelector("#ceremony-stage");
  stage.innerHTML = stageMarkup(data, { phase: "tying", motionRakhi: true });
  ceremonyTimer = window.setTimeout(() => {
    renderBrotherResponse(data);
  }, 10100);
}

function renderBrotherResponse(data, selectedReactions = []) {
  clearTimers();
  const reactions = normalizeReactions(selectedReactions);
  app.innerHTML = `
    <section class="screen ceremony-screen">
      <div class="ceremony-shell">
        <div class="panel preview-panel">
          <div class="stage-wrap" id="ceremony-stage">
            ${stageMarkup(data, { phase: "complete", reactions })}
          </div>
        </div>
        <aside class="panel side-panel">
          <p class="eyebrow">Rakhi tied</p>
          <h1>Send your reaction and promise</h1>
          <p>${escapeHtml(cleanText(data.sisterName, "Sister"))} will see both when she opens your return link.</p>

          <div class="reaction-grid" id="reaction-grid">
            ${Object.entries(reactionMeta)
              .map(([key, item]) => `
                <button
                  class="reaction-button${reactions.includes(key) ? " is-selected" : ""}"
                  type="button"
                  data-reaction="${escapeHtml(key)}"
                  style="--reaction-color: ${item.color};"
                  aria-pressed="${reactions.includes(key)}"
                >
                  ${escapeHtml(item.label)}
                </button>
              `)
              .join("")}
          </div>

          <div class="promise-card">
            <label class="group-label" for="promise">Promise note</label>
            <textarea class="textarea" id="promise" maxlength="420" placeholder="Write a promise for your sister."></textarea>
          </div>

          <div class="actions">
            <button class="button primary" type="button" id="createReturnLink" ${reactions.length ? "" : "disabled"}>Create sister link</button>
          </div>

          <div id="return-link-slot"></div>
        </aside>
      </div>
    </section>
  `;

  bindBrotherResponse(data, reactions);
}

function bindBrotherResponse(data, selectedReactions) {
  let reactions = normalizeReactions(selectedReactions);
  const reactionGrid = document.querySelector("#reaction-grid");
  const createButton = document.querySelector("#createReturnLink");
  const promise = document.querySelector("#promise");
  const slot = document.querySelector("#return-link-slot");

  reactionGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-reaction]");
    if (!button) return;
    const reaction = button.dataset.reaction;
    reactions = reactions.includes(reaction)
      ? reactions.filter((item) => item !== reaction)
      : [...reactions, reaction];
    document.querySelectorAll(".reaction-button").forEach((item) => {
      const selected = reactions.includes(item.dataset.reaction);
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    document.querySelector("#ceremony-stage").innerHTML = stageMarkup(data, { phase: "complete", reactions });
    createButton.disabled = reactions.length === 0;
  });

  createButton.addEventListener("click", async () => {
    const promiseText = promise.value.trim();
    if (!reactions.length) {
      showToast("Choose at least one reaction.");
      return;
    }
    if (!promiseText) {
      showToast("Write a promise note.");
      promise.focus();
      return;
    }

    const result = {
      ...data,
      reactions,
      reaction: reactions[0],
      promise: promiseText,
      respondedAt: new Date().toISOString()
    };
    const url = buildUrl("sister", result);
    slot.innerHTML = `
      <div class="link-box">
        <div class="status-line">Share this link with the sister</div>
        <a class="link-output" href="${escapeHtml(url)}">${escapeHtml(url)}</a>
        <div class="actions">
          <button class="button secondary" type="button" data-copy-return="${escapeHtml(url)}">Copy link</button>
          <a class="button ghost" href="${escapeHtml(url)}">Open final view</a>
        </div>
      </div>
    `;
    await copyLink(url);
  });

  slot.addEventListener("click", async (event) => {
    const copy = event.target.closest("[data-copy-return]");
    if (!copy) return;
    await copyLink(copy.dataset.copyReturn);
  });
}

function renderSisterResult(data) {
  clearTimers();
  const reactions = normalizeReactions(data.reactions ?? data.reaction);
  const reactionLabel = reactions.length
    ? reactions.map((reaction) => reactionMeta[reaction].label).join(", ")
    : "A warm reaction";
  const promise = String(data.promise || "").trim() || "I will always stand by you.";

  app.innerHTML = `
    <section class="screen ceremony-screen">
      <div class="ceremony-shell">
        <div class="panel preview-panel">
          <div class="stage-wrap">
            ${stageMarkup(data, { phase: "complete", reactions: reactions.length ? reactions : ["hug"] })}
          </div>
        </div>
        <aside class="panel side-panel">
          <p class="eyebrow">Return from ${escapeHtml(cleanText(data.brotherName, "Brother"))}</p>
          <h1>Your Rakhi reached him</h1>
          <div class="final-card">
            <div class="status-line">Reactions: ${escapeHtml(reactionLabel)}</div>
            <blockquote class="promise-note">${escapeHtml(promise)}</blockquote>
          </div>
          <div class="actions">
            <a class="button primary" href="./index.html">Create another Rakhi</a>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function parseRoute() {
  const hash = window.location.hash.slice(1);
  if (!hash) return { mode: "builder" };
  const index = hash.indexOf("=");
  if (index === -1) return { mode: "builder" };
  const mode = hash.slice(0, index);
  const token = hash.slice(index + 1);
  return { mode, data: deserialize(token) };
}

function renderRoute() {
  const route = parseRoute();
  if (route.mode === "brother" && route.data) {
    renderBrotherIntro(route.data);
    return;
  }
  if (route.mode === "sister" && route.data) {
    renderSisterResult(route.data);
    return;
  }
  if (window.location.hash) {
    history.replaceState(null, "", window.location.href.split("#")[0]);
    showToast("That link could not be opened.");
  }
  renderBuilder();
}

window.addEventListener("hashchange", renderRoute);
renderRoute();
