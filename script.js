const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const SAVED_KEY = "wordly-saved-words";
const THEME_KEY = "wordly-theme";

const form = document.getElementById("search-form");
const input = document.getElementById("word-input");
const searchBtn = document.getElementById("search-btn");
const errorBox = document.getElementById("error-message");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const resultWord = document.getElementById("result-word");
const resultPhonetic = document.getElementById("result-phonetic");
const audioBtn = document.getElementById("audio-btn");
const saveBtn = document.getElementById("save-btn");
const meaningsBox = document.getElementById("meanings");
const sourceLink = document.getElementById("source-link");
const savedList = document.getElementById("saved-list");
const savedEmpty = document.getElementById("saved-empty");
const themeToggle = document.getElementById("theme-toggle");

let currentWord = "";
let currentAudioUrls = [];
let savedWords = loadSavedWords();

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function setLoading(isLoading) {
  loading.classList.toggle("hidden", !isLoading);
  searchBtn.disabled = isLoading;
}

function isValidWord(word) {
  return /^[a-zA-Z][a-zA-Z\s'-]*$/.test(word);
}

async function fetchWord(word) {
  const response = await fetch(API_URL + encodeURIComponent(word));
  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }
  if (!response.ok) {
    throw new Error("API_ERROR");
  }
  return response.json();
}

function getPhonetic(entries) {
  for (const entry of entries) {
    if (entry.phonetic) {
      return entry.phonetic;
    }
    const withText = (entry.phonetics || []).find((item) => item.text);
    if (withText) {
      return withText.text;
    }
  }
  return "";
}

function getAudioUrls(entries) {
  const urls = [];
  entries.forEach((entry) => {
    (entry.phonetics || []).forEach((item) => {
      if (item.audio) {
        urls.push(item.audio.startsWith("//") ? "https:" + item.audio : item.audio);
      }
    });
  });
  return [...new Set(urls)];
}

function collectSynonyms(meaning) {
  const all = [...(meaning.synonyms || [])];
  (meaning.definitions || []).forEach((definition) => {
    all.push(...(definition.synonyms || []));
  });
  return [...new Set(all)].slice(0, 8);
}

function createMeaningElement(meaning) {
  const wrapper = document.createElement("div");
  wrapper.className = "meaning";

  const partOfSpeech = document.createElement("p");
  partOfSpeech.className = "part-of-speech";
  partOfSpeech.textContent = meaning.partOfSpeech || "unknown";

  const list = document.createElement("ol");
  list.className = "definition-list";

  (meaning.definitions || []).forEach((definition) => {
    const item = document.createElement("li");
    item.textContent = definition.definition;

    const example = document.createElement("span");
    example.className = "example";
    example.textContent = definition.example
      ? `"${definition.example}"`
      : "No example available.";
    item.appendChild(example);

    list.appendChild(item);
  });

  const synonyms = document.createElement("p");
  synonyms.className = "synonyms";
  const synonymList = collectSynonyms(meaning);
  synonyms.textContent = synonymList.length
    ? `Synonyms: ${synonymList.join(", ")}`
    : "Synonyms: none available";

  wrapper.append(partOfSpeech, list, synonyms);
  return wrapper;
}

function renderResult(entries) {
  currentWord = entries[0].word.toLowerCase();
  currentAudioUrls = getAudioUrls(entries);

  resultWord.textContent = entries[0].word;
  resultPhonetic.textContent = getPhonetic(entries) || "Pronunciation not available";
  audioBtn.classList.toggle("hidden", currentAudioUrls.length === 0);

  meaningsBox.replaceChildren();
  entries.forEach((entry) => {
    (entry.meanings || []).forEach((meaning) => {
      meaningsBox.appendChild(createMeaningElement(meaning));
    });
  });

  const sourceUrl = entries[0].sourceUrls && entries[0].sourceUrls[0];
  if (sourceUrl) {
    sourceLink.href = sourceUrl;
    sourceLink.textContent = sourceUrl;
    sourceLink.parentElement.classList.remove("hidden");
  } else {
    sourceLink.parentElement.classList.add("hidden");
  }

  updateSaveState();
  results.classList.remove("hidden");
}

async function searchWord(rawWord) {
  const word = rawWord.trim();
  clearError();

  if (!word) {
    showError("Please enter a word to search.");
    return;
  }
  if (!isValidWord(word)) {
    showError("Please use letters only (hyphens and apostrophes are allowed).");
    return;
  }

  results.classList.add("hidden");
  setLoading(true);

  try {
    const entries = await fetchWord(word);
    renderResult(entries);
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      showError(`No definitions found for "${word}". Check the spelling and try again.`);
    } else {
      showError("Something went wrong while contacting the dictionary. Check your connection and try again.");
    }
  } finally {
    setLoading(false);
  }
}

async function playAudio() {
  clearError();
  for (const url of currentAudioUrls) {
    try {
      await new Audio(url).play();
      return;
    } catch {
      continue;
    }
  }
  showError("Audio could not be played for this word.");
}

function loadSavedWords() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function persistSavedWords() {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedWords));
  } catch {
    showError("Could not save your words in this browser.");
  }
}

function updateSaveState() {
  const isSaved = savedWords.includes(currentWord);
  saveBtn.textContent = isSaved ? "Remove saved" : "Save word";
  results.classList.toggle("is-saved", isSaved);
}

function toggleSave() {
  if (!currentWord) {
    return;
  }
  savedWords = savedWords.includes(currentWord)
    ? savedWords.filter((word) => word !== currentWord)
    : [...savedWords, currentWord];

  persistSavedWords();
  renderSavedWords();
  updateSaveState();
}

function renderSavedWords() {
  savedList.replaceChildren();
  savedEmpty.classList.toggle("hidden", savedWords.length > 0);

  savedWords.forEach((word) => {
    const item = document.createElement("li");

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.dataset.action = "open";
    openBtn.dataset.word = word;
    openBtn.textContent = word;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.dataset.action = "remove";
    removeBtn.dataset.word = word;
    removeBtn.textContent = "×";
    removeBtn.setAttribute("aria-label", `Remove ${word} from saved words`);

    item.append(openBtn, removeBtn);
    savedList.appendChild(item);
  });
}

function handleSavedClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const { action, word } = button.dataset;

  if (action === "open") {
    input.value = word;
    searchWord(word);
  }

  if (action === "remove") {
    savedWords = savedWords.filter((saved) => saved !== word);
    persistSavedWords();
    renderSavedWords();
    updateSaveState();
  }
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "light";
  } catch {
    return "light";
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    return;
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  saveTheme(theme);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchWord(input.value);
});

audioBtn.addEventListener("click", playAudio);
saveBtn.addEventListener("click", toggleSave);
savedList.addEventListener("click", handleSavedClick);

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
});

applyTheme(loadTheme());
renderSavedWords();