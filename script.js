
"use strict";

// One array is the source of truth for saved trails.
const STORAGE_KEY = "trailFinderSavedIds";

let trails = [];
let savedIds = loadSavedIds();

// Get HTML elements.
const trailList = document.querySelector("#trail-list");
const savedList = document.querySelector("#saved-list");
const savedCount = document.querySelector("#saved-count");
const headerCount = document.querySelector("#header-count");
const trailCount = document.querySelector("#trail-count");
const clearAllButton = document.querySelector("#clear-all");

// Read saved trails when the page loads.
function loadSavedIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    // Only allow unique, valid trail IDs.
    return [...new Set(
      parsed.filter(id =>
        Number.isInteger(id) && id > 0
      )
    )];

  } catch (error) {
    console.error("Error reading saved trails:", error);
    return [];
  }
}

// Save the entire array to localStorage.
function saveToStorage() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(savedIds)
    );
  } catch (error) {
    console.error("Could not save trails:", error);
  }
}

// Create a trail card.
function createTrailCard(trail, isSavedSection = false) {
  const card = document.createElement("article");

  card.className = "trail-card";
  card.dataset.id = trail.id;

  const icon = document.createElement("div");
  icon.className = "card-icon";
  icon.textContent = "";

  const title = document.createElement("h3");
  title.textContent = trail.name;

  const park = document.createElement("p");
  park.className = "park-name";
  park.textContent = " " + trail.park;

  const info = document.createElement("div");
  info.className = "trail-info";

  const distance = document.createElement("span");
  distance.textContent = "🥾 " + trail.miles + " miles";

  const difficulty = document.createElement("span");
  difficulty.className =
    "difficulty " + trail.difficulty.toLowerCase();
  difficulty.textContent = trail.difficulty;

  info.append(distance, difficulty);

  const button = document.createElement("button");
  button.type = "button";

  if (isSavedSection) {
    button.className = "remove-button";
    button.dataset.action = "remove";
    button.textContent = "× Remove";

  } else {
    const isSaved = savedIds.includes(trail.id);

    button.className = isSaved
      ? "save-button is-saved"
      : "save-button";

    button.dataset.action = "toggle";
    button.textContent = isSaved
      ? "★ Saved"
      : "☆ Save";

    button.setAttribute(
      "aria-pressed",
      String(isSaved)
    );
  }

  card.append(icon, title, park, info, button);

  return card;
}

// Re-render everything from the savedIds array.
function render() {
  // Display all trails.
  trailList.replaceChildren(
    ...trails.map(trail => createTrailCard(trail))
  );

  // Preserve the order in which trails were saved.
  const savedTrails = savedIds
    .map(id => trails.find(trail => trail.id === id))
    .filter(Boolean);

  // Display saved trails only.
  savedList.replaceChildren(
    ...savedTrails.map(trail =>
      createTrailCard(trail, true)
    )
  );

  const count = savedTrails.length;

  savedCount.textContent = "Saved: " + count;
  headerCount.textContent = count;

  clearAllButton.disabled = count === 0;

  // Friendly empty message.
  if (count === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-message";

    const heading = document.createElement("h3");
    heading.textContent = "No saved trails yet";

    const message = document.createElement("p");
    message.textContent =
      "Explore the trails above and save your favorites!";

    empty.append(heading, message);
    savedList.append(empty);
  }
}

// Handle clicks using event delegation.
function handleTrailClick(event) {
  const button = event.target.closest(
    "button[data-action]"
  );

  if (!button) {
    return;
  }

  if (!event.currentTarget.contains(button)) {
    return;
  }

  const card = button.closest(".trail-card[data-id]");

  if (!card) {
    return;
  }

  const id = Number(card.dataset.id);

  if (!trails.some(trail => trail.id === id)) {
    return;
  }

  const action = button.dataset.action;

  if (action === "remove") {
    // Remove a trail from saved trails.
    savedIds = savedIds.filter(savedId =>
      savedId !== id
    );

  } else if (action === "toggle") {
    if (savedIds.includes(id)) {
      // Unsave an existing trail.
      savedIds = savedIds.filter(savedId =>
        savedId !== id
      );
    } else {
      // Save the trail at the end of the array.
      savedIds.push(id);
    }
  } else {
    return;
  }

  // Save and re-render after every change.
  saveToStorage();
  render();
}

// One click listener for each card container.
trailList.addEventListener("click", handleTrailClick);
savedList.addEventListener("click", handleTrailClick);

// Optional challenge: Clear all saved trails.
clearAllButton.addEventListener("click", () => {
  savedIds = [];

  saveToStorage();
  render();
});

// Load the provided JSON dataset.
async function loadTrails() {
  try {
    const response = await fetch("./trails.json");

    if (!response.ok) {
      throw new Error("Could not load trails.json");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid trail dataset");
    }

    trails = data;

    // Remove saved IDs that do not exist in the dataset.
    savedIds = savedIds.filter(id =>
      trails.some(trail => trail.id === id)
    );

    saveToStorage();

    trailCount.textContent =
      trails.length + " Trails";

    render();

  } catch (error) {
    console.error("Error loading trails:", error);

    trailCount.textContent = "Error";

    const message = document.createElement("p");
    message.className = "error-message";
    message.textContent =
      "Unable to load trails. Run this website with " +
      "Live Server and check that trails.json exists.";

    trailList.replaceChildren(message);
  }
}

// Start the application.
loadTrails();
