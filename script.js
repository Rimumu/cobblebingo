// Global tooltip management
let activeTooltip = null;

function createTooltip(content, isLegendary = false) {
  removeActiveTooltip();
  const tooltip = document.createElement("div");
  tooltip.className = isLegendary ? "legendary-tooltip" : "tooltip";
  // tooltip.textContent = content; // Set by setupTooltipEvents if needed, or here if always static

  // Base styles for all tooltips (consider moving more to CSS if static)
  tooltip.style.cssText = `
    position: fixed; background: rgba(0, 0, 0, 0.9); color: #fff;
    padding: ${isLegendary ? "8px 12px" : "6px 10px"};
    border-radius: ${isLegendary ? "6px" : "4px"};
    font-size: ${isLegendary ? "12px" : "11px"};
    white-space: pre-wrap; word-wrap: break-word; max-width: 250px; min-width: 80px;
    text-align: center; opacity: 0; visibility: hidden; transition: all 0.3s ease;
    z-index: 10000; pointer-events: none;
    box-shadow: 0 ${isLegendary ? "4px 12px" : "2px 8px"} rgba(0,0,0,${isLegendary ? "0.3" : "0.2"});
    transform: translateX(-50%);
    ${isLegendary ? "border: 2px solid #ffd700;" : "border: 1px solid rgba(255,255,255,0.2);"}
    ${isLegendary ? "background: linear-gradient(135deg, #1a1a2e, #16213e);" : ""}
    ${isLegendary ? "color: #ffd700;" : ""}
  `;
  // Tooltip content is now set in setupTooltipEvents for dynamic content.
  // If content is static and passed here, then tooltip.textContent = content; is fine.

  const arrow = document.createElement("div");
  arrow.style.cssText = `
    position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    width: 0; height: 0;
    border-left: ${isLegendary ? "6px" : "5px"} solid transparent;
    border-right: ${isLegendary ? "6px" : "5px"} solid transparent;
    border-top: ${isLegendary ? "6px" : "5px"} solid ${isLegendary ? "#16213e" : "rgba(0,0,0,0.9)"};
  `; // Match arrow color to tooltip background
  tooltip.appendChild(arrow);

  document.body.appendChild(tooltip);
  activeTooltip = tooltip;
  return tooltip;
}

function showTooltip(tooltip, targetElement, content) { // Added content parameter
  if (!tooltip || !targetElement) return;
  tooltip.textContent = content; // Set content when showing

  const rect = targetElement.getBoundingClientRect();
  let tooltipRect = tooltip.getBoundingClientRect(); // Get initial rect

  // Recalculate position based on content (tooltipRect might change if content changes width)
  tooltip.style.visibility = "hidden"; // Temporarily hide to get correct measurements with new content
  tooltip.style.opacity = "0";
  tooltip.style.display = "block"; // Ensure it's block for measurement
  tooltipRect = tooltip.getBoundingClientRect(); // Re-measure with new content

  let left = rect.left + rect.width / 2;
  let top = rect.top - tooltipRect.height - 10; // Position above, accounting for tooltip height and arrow

  const padding = 10;
  if (left - tooltipRect.width / 2 < padding) {
    left = tooltipRect.width / 2 + padding;
  } else if (left + tooltipRect.width / 2 > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width / 2 - padding;
  }

  const arrow = tooltip.querySelector("div");
  if (top < padding) { // If tooltip would go above viewport, show it below instead
    top = rect.bottom + 10;
    if (arrow) { // Flip arrow for bottom position
        arrow.style.top = `-${isLegendary ? "6px" : "5px"}`;
        arrow.style.borderTopColor = 'transparent';
        arrow.style.borderBottomColor = tooltip.style.borderTopColor; // Match tooltip bg
    }
  } else {
    if(arrow) { // Ensure arrow is pointing up
        arrow.style.top = '100%';
        arrow.style.borderBottomColor = 'transparent';
        arrow.style.borderTopColor = tooltip.style.borderTopColor; // Match tooltip bg
    }
  }

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
  tooltip.style.opacity = "1";
  tooltip.style.visibility = "visible";
  tooltip.style.display = ""; // Reset display if it was set to block
}


function removeActiveTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}

function setupTooltipEvents(cell, contentFactory, isLegendary = false) { // contentFactory can be a function
  let tooltip = null;
  cell.addEventListener("mouseenter", () => {
    const currentContent = typeof contentFactory === 'function' ? contentFactory() : contentFactory;
    tooltip = createTooltip("", isLegendary); // Create empty, showTooltip will set content
    showTooltip(tooltip, cell, currentContent);
  });
  cell.addEventListener("mouseleave", () => {
    removeActiveTooltip();
    tooltip = null;
  });
  cell.tooltipCleanup = () => {
    if (tooltip) tooltip.remove();
    tooltip = null;
  };
}

// Loading Screen Animation and Management
function createParticles() { /* ... (keep existing) ... */ }
function hideLoadingScreen() { /* ... (keep existing) ... */ }
createParticles();
window.addEventListener("load", () => { setTimeout(hideLoadingScreen, 2000); });
setTimeout(() => { if (document.body.classList.contains("loading")) hideLoadingScreen(); }, 5000);

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : 'https://cobblebingo-backend-production.up.railway.app';
console.log('Using API Base URL:', API_BASE_URL);

let currentSessionId = null;
let currentCardCode = null;
let pokemonData = [];
let completedCells = Array(25).fill(false);
let currentBingoCount = 0;

// DOM Element references (consider defining them after DOMContentLoaded if not available globally)
const difficultySelect = document.getElementById("difficulty");
const cardCodeInputElement = document.getElementById("cardCode");
const mainLoadingSpinner = document.getElementById("loadingSpinnerMain");
const bingoCardGridElement = document.getElementById("bingoGrid");
const bingoCardWrapperElement = document.getElementById("bingoCard");
const bingoCardLogoContainerElement = document.getElementById("bingoCardLogoContainer");
const exportButton = document.getElementById("exportBtn");
const postGenerationControlsElement = document.getElementById("postGenerationControls");
const controlsContainerElement = document.querySelector(".controls-container");


async function apiCall(endpoint, options = {}) { /* ... (keep existing, it's robust) ... */ }
async function testApiConnection() { /* ... (keep existing) ... */ }
async function generateAndStoreCard(selectedPokemon, selectedRarity) { /* ... (keep existing) ... */ }
async function retrieveCard(code) { /* ... (keep existing) ... */ }
async function validateCode(code) { /* ... (keep existing) ... */ }
async function initializeSession(cardCode) { /* ... (keep existing) ... */ }
async function getSessionData(sessionId) { /* ... (keep existing) ... */ }
async function updateSessionCompletedCells(sessionId, cells) { /* ... (keep existing) ... */ }
function updateUrlWithSession(cardCode, sessionId) { /* ... (keep existing) ... */ }
function createSeededRandom(seed) { /* ... (keep existing) ... */ }
async function fetchPokemonData() { /* ... (keep existing) ... */ }
function shuffle(array) { /* ... (keep existing) ... */ }
function populateFilters() { /* ... (keep existing) ... */ }
function selectPokemonByDifficulty(pokemonList, difficulty) { /* ... (keep existing) ... */ }
function setupColorSchemeSelector() { /* ... (keep existing) ... */ }
function openPokemonPage(pokemonName) { /* ... (keep existing) ... */ }
async function imageToBase64(imgElement) { /* ... (keep existing) ... */ }


async function generateBingo() {
  const selectedDifficulty = difficultySelect.value;
  console.log("Selected Difficulty:", selectedDifficulty);
  const cardCodeInput = cardCodeInputElement ? cardCodeInputElement.value.trim().toUpperCase() : "";

  // Show loading spinner, hide card and controls
  if(mainLoadingSpinner) mainLoadingSpinner.style.display = "flex";
  if(bingoCardWrapperElement) bingoCardWrapperElement.style.display = "none";
  if(bingoCardLogoContainerElement) bingoCardLogoContainerElement.style.display = "none";
  if(exportButton) exportButton.style.display = "none";
  if(postGenerationControlsElement) postGenerationControlsElement.style.display = "none";
  // controlsContainerElement might still be visible if it contains filters, or hide it too if appropriate.
  // if(controlsContainerElement) controlsContainerElement.style.display = "none"; // If filters should also hide
  if(bingoCardGridElement) bingoCardGridElement.innerHTML = "";

  cleanupTooltips();
  document.querySelectorAll(".bingo-line, .bingo-message").forEach(el => el.remove());
  currentBingoCount = 0;

  await new Promise((resolve) => setTimeout(resolve, 300)); // Short delay for UI update

  let cardDataFromServer;
  let sessionDataFromServer;
  let loadedCardCode = null;
  let loadedSessionId = null;

  const urlParams = new URLSearchParams(window.location.search);
  const urlCode = urlParams.get("code") ? urlParams.get("code").toUpperCase() : null;
  const urlSessionId = urlParams.get("sessionid");

  try {
    if (cardCodeInput) {
      loadedCardCode = cardCodeInput;
      if (urlSessionId && urlCode === loadedCardCode) {
        loadedSessionId = urlSessionId;
      }
    } else if (urlCode) {
      loadedCardCode = urlCode;
      loadedSessionId = urlSessionId;
    }

    if (loadedCardCode) {
      console.log(`Attempting to load card: ${loadedCardCode}`);
      cardDataFromServer = await retrieveCard(loadedCardCode);
      currentCardCode = cardDataFromServer.code;
      if (cardCodeInputElement) cardCodeInputElement.value = currentCardCode;
      if (difficultySelect && cardDataFromServer.cardData.difficulty) {
        difficultySelect.value = cardDataFromServer.cardData.difficulty;
      }

      if (loadedSessionId) {
        console.log(`Attempting to load session: ${loadedSessionId} for card: ${currentCardCode}`);
        try {
          sessionDataFromServer = await getSessionData(loadedSessionId);
          if (sessionDataFromServer.cardCode !== currentCardCode) {
            console.warn(`Session ${loadedSessionId} is for card ${sessionDataFromServer.cardCode}, but current card is ${currentCardCode}. Creating new session.`);
            sessionDataFromServer = null; currentSessionId = null;
          } else {
            currentSessionId = sessionDataFromServer.sessionId;
          }
        } catch (sessionError) {
          console.warn(`Failed to load session ${loadedSessionId} or it's invalid:`, sessionError.message);
          sessionDataFromServer = null; currentSessionId = null;
        }
      }

      if (!currentSessionId && currentCardCode) { // Ensure currentCardCode is valid before init
        console.log(`No valid session for ${currentCardCode}. Initializing new session.`);
        sessionDataFromServer = await initializeSession(currentCardCode);
        currentSessionId = sessionDataFromServer.sessionId;
      }
    } else { // Generate new card
      console.log("Generating new card...");
      if (cardCodeInputElement) cardCodeInputElement.value = "";
      history.replaceState(null, null, window.location.pathname);

      let pokemonForCard = selectPokemonByDifficulty(pokemonData, selectedDifficulty);
      let finalPokemonSelection = [];
      if (selectedDifficulty === "insane") {
        const centerPokemon = pokemonForCard[12];
        const otherPokemon = [...pokemonForCard.slice(0, 12), ...pokemonForCard.slice(13)];
        const shuffledOther = shuffle(otherPokemon);
        for (let i = 0; i < 25; i++) { finalPokemonSelection.push(i === 12 ? centerPokemon : shuffledOther[i < 12 ? i : i - 1]); }
      } else {
        const shuffledPokemon = shuffle(pokemonForCard.slice(0, 24));
        for (let i = 0; i < 25; i++) { finalPokemonSelection.push(i === 12 ? { name: "Free Space", rarity: "", biome: "", id: "" } : shuffledPokemon[i < 12 ? i : i - 1]); }
      }
      if (finalPokemonSelection.length !== 25) throw new Error(`Expected 25 Pokemon for card, got ${finalPokemonSelection.length}`);

      const newCardCode = await generateAndStoreCard(finalPokemonSelection, selectedDifficulty);
      currentCardCode = newCardCode; // Corrected assignment
      if (cardCodeInputElement) cardCodeInputElement.value = currentCardCode;
      cardDataFromServer = { code: currentCardCode, cardData: { pokemon: finalPokemonSelection, difficulty: selectedDifficulty }, createdAt: new Date().toISOString(), usageCount: 0, lastAccessed: new Date().toISOString() };

      if (!currentCardCode) throw new Error("New card code is missing after generation.");
      console.log(`New card ${currentCardCode} generated. Initializing session.`);
      sessionDataFromServer = await initializeSession(currentCardCode);
      currentSessionId = sessionDataFromServer.sessionId;
    }

    if (!currentCardCode || !currentSessionId) throw new Error("Failed to establish a valid card code and session ID.");
    updateUrlWithSession(currentCardCode, currentSessionId);
    document.body.setAttribute("data-generated", "true");

    // Initialize completedCells array: from session or default
    completedCells = Array(25).fill(false); // Reset/Initialize
    if (sessionDataFromServer && sessionDataFromServer.cardCode === currentCardCode && sessionDataFromServer.completedCells) {
        completedCells = [...sessionDataFromServer.completedCells];
        console.log("Applying session data for completedCells:", completedCells);
    } else { // New session for this card or invalid session data
        const centerPokemonDetails = cardDataFromServer.cardData.pokemon[12];
        if (centerPokemonDetails && centerPokemonDetails.name === "Free Space" && centerPokemonDetails.rarity?.toLowerCase() !== "legendary") {
            if (completedCells.length === 25) completedCells[12] = true; // Auto-complete standard free space in array
            console.log("New/reset session for this card, standard free space auto-completed in array state.");
        }
    }

    console.log("Final Pokemon for Rendering:", cardDataFromServer.cardData.pokemon);
    console.log("Initial completedCells state for rendering:", completedCells);

    await renderBingoCard(cardDataFromServer.cardData.pokemon, completedCells); // Pass state to render function
    checkForBingo(); // Check based on the now rendered state reflecting completedCells
    console.log("Rendered cells:", document.querySelectorAll(".bingo-cell").length);

  } catch (error) {
    console.error("Error in generateBingo:", error);
    alert(`Error: ${error.message || "Failed to generate/load bingo card and session"}`);
    if(mainLoadingSpinner) mainLoadingSpinner.style.display = "none";
    if(controlsContainerElement) controlsContainerElement.style.display = "flex"; // Show filters again
    if(bingoCardWrapperElement) bingoCardWrapperElement.style.display = "none";
    currentSessionId = null; currentCardCode = null;
    return;
  }

  // UI updates for success
  if(mainLoadingSpinner) mainLoadingSpinner.style.display = "none";
  if(bingoCardWrapperElement) bingoCardWrapperElement.style.display = "flex";
  if(bingoCardLogoContainerElement) bingoCardLogoContainerElement.style.display = "block";
  if(exportButton) exportButton.style.display = "inline-block";
  if(postGenerationControlsElement) postGenerationControlsElement.style.display = "inline-flex";
  if(controlsContainerElement) controlsContainerElement.style.display = "flex"; // Ensure controls (filters) are visible
}

function generateNewCard() {
  if (cardCodeInputElement) cardCodeInputElement.value = "";
  currentSessionId = null; currentCardCode = null;
  history.replaceState(null, null, window.location.pathname);
  document.body.removeAttribute("data-generated");
  generateBingo();
}

async function renderBingoCard(selectedPokemonList, initialCompletedStateArray) {
  if(bingoCardGridElement) bingoCardGridElement.innerHTML = ""; // Clear previous grid
  const imageLoadPromises = [];

  selectedPokemonList.forEach((pokemon, index) => {
    const name = pokemon.name;
    const cell = document.createElement("div");
    cell.className = "bingo-cell";

    // Apply .completed class based on initialCompletedStateArray
    if (initialCompletedStateArray && initialCompletedStateArray[index]) {
        cell.classList.add("completed");
    }

    if (index === 12) { // Center Cell
      if (pokemon.rarity?.toLowerCase() === "legendary") {
        cell.classList.add("legendary-center");
        // Click handler for legendary cell
        cell.addEventListener("click", (e) => {
          if (e.target === cell || e.target.classList.contains("pokemon-name")) toggleCellCompletion(index);
          else if (pokemon.rarity.toLowerCase() === "legendary") window.open("https://modrinth.com/datapack/cobblemon-legendary-structures", "_blank");
          else openPokemonPage(pokemon.name);
        });
        setupTooltipEvents(cell, () => `Legendary Pokémon: ${name}\nBiome: ${pokemon.biome || 'Various'}`, true); // Content as function

        // Add manual checkmark if legendary and completed
        if (initialCompletedStateArray && initialCompletedStateArray[index]) {
            const checkmark = document.createElement("div");
            checkmark.className = "manual-checkmark";
            checkmark.innerHTML = "✓";
            checkmark.style.cssText = `position: absolute; top: 5px; right: 5px; background: #FFD700; color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; z-index: 100; box-shadow: 0 2px 4px rgba(0,0,0,0.3); pointer-events: none;`;
            cell.appendChild(checkmark);
        }
        // ... (rest of legendary cell DOM structure, images, labels as before)
        const wrapper = document.createElement("div"); wrapper.className = "image-wrapper"; /* ... */
        const img = document.createElement("img"); img.alt = name; img.className = "pokemon-img"; img.crossOrigin = "anonymous";
        // ... (image source logic for legendary as before) ...
        const possiblePaths = [`./public/${pokemon.id}.png`, `./images/${pokemon.id}.png`, `/images/${pokemon.id}.png`, `./assets/${pokemon.id}.png`, `/assets/${pokemon.id}.png`, `./${pokemon.id}.png`];
        let pathIndex = 0;
        const tryNextPath = () => { if (pathIndex < possiblePaths.length) { img.src = possiblePaths[pathIndex++]; } else { console.warn(`Local image not found for legendary ${pokemon.name}, trying external sources`); tryExternalSources(); } };
        const tryExternalSources = async () => { const formattedName = name.toLowerCase().replace(/\s+/g, "_"); const cobblemonUrl = `https://cobbledex.b-cdn.net/mons/large/${formattedName}.webp`; try { const response = await fetch(cobblemonUrl); if (response.ok) { const blob = await response.blob(); const PLACEHOLDER_SIZE_MIN = 2160; const PLACEHOLDER_SIZE_MAX = 2180; if (blob.size < PLACEHOLDER_SIZE_MIN || blob.size > PLACEHOLDER_SIZE_MAX) { const objectUrl = URL.createObjectURL(blob); img.src = objectUrl; img.onload = () => URL.revokeObjectURL(objectUrl); return; } } } catch (error) { console.warn(`Cobbledex failed for legendary ${pokemon.name}:`, error); } if (pokemon.id) { const pokeApiUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`; img.src = pokeApiUrl; } else { img.src = ""; img.alt = `${pokemon.name} (Image not available)`; } };
        img.onerror = tryNextPath; tryNextPath();
        wrapper.appendChild(img); cell.appendChild(wrapper);
        const label = document.createElement("div"); label.className = "pokemon-name"; label.textContent = name; cell.appendChild(label);
        const rarityBadge = document.createElement("div"); rarityBadge.className = "rarity-badge legendary"; rarityBadge.textContent = "Legendary"; cell.appendChild(rarityBadge);

      } else { // Standard FREE space
        cell.textContent = "FREE";
        cell.classList.add("free-space-cell"); // Class for CSS styling
        // .completed class is already added if initialCompletedStateArray[12] was true
      }
    } else { // Regular Pokemon cells
      cell.style.cursor = "pointer";
      cell.addEventListener("click", (e) => {
        if (e.target === cell || e.target.classList.contains("pokemon-name")) toggleCellCompletion(index);
        else openPokemonPage(pokemon.name);
      });
      setupTooltipEvents(cell, () => `Name: ${name}\nBiome: ${pokemon.biome || 'N/A'}\nRarity: ${pokemon.rarity || 'N/A'}`, false); // Content as function
      // ... (rest of regular cell DOM structure, images, labels as before)
      const wrapper = document.createElement("div"); wrapper.className = "image-wrapper"; /* ... */
      const formattedName = name.toLowerCase().replace(/\s+/g, "_"); const cobblemonUrl = `https://cobbledex.b-cdn.net/mons/large/${formattedName}.webp`;
      const img = document.createElement("img"); img.alt = name; img.className = "pokemon-img"; img.crossOrigin = "anonymous"; img.style.maxWidth = "100%"; img.style.height = "auto"; wrapper.appendChild(img);
      const loadPromise = new Promise(async (resolve) => { try { const response = await fetch(cobblemonUrl); if (!response.ok) throw new Error(`Cobbledex failed: ${response.status}`); const blob = await response.blob(); const PLACEHOLDER_SIZE_MIN = 2160; const PLACEHOLDER_SIZE_MAX = 2180; if (blob.size >= PLACEHOLDER_SIZE_MIN && blob.size <= PLACEHOLDER_SIZE_MAX) throw new Error("Placeholder image detected"); const objectUrl = URL.createObjectURL(blob); img.src = objectUrl; await new Promise((imgResolve, imgReject) => { img.onload = () => { URL.revokeObjectURL(objectUrl); imgResolve(); }; img.onerror = () => { URL.revokeObjectURL(objectUrl); imgReject(new Error("Image load failed")); }; }); } catch (error) { console.warn(`Falling back to PokeAPI for ${pokemon.name}: ${error.message}`); if (pokemon.id) { const pokeApiUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`; img.crossOrigin = "anonymous"; img.src = pokeApiUrl; await new Promise((imgResolve) => { img.onload = imgResolve; img.onerror = () => { img.src = ""; img.alt = `${pokemon.name} (Image not available)`; imgResolve(); }; }); } else { img.src = ""; img.alt = `${pokemon.name} (No ID available)`; } } resolve(); });
      imageLoadPromises.push(loadPromise); cell.appendChild(wrapper);
      const label = document.createElement("div"); label.className = "pokemon-name"; label.textContent = pokemon.name; cell.appendChild(label);
      if (pokemon.rarity) { const rarityBadge = document.createElement("div"); const rarityClass = pokemon.rarity.toLowerCase().replace(/\s+/g, "-"); rarityBadge.className = `rarity-badge ${rarityClass}`; rarityBadge.textContent = pokemon.rarity.charAt(0).toUpperCase() + pokemon.rarity.slice(1); cell.appendChild(rarityBadge); }
    }
    if(bingoCardGridElement) bingoCardGridElement.appendChild(cell);
  });

  await Promise.all(imageLoadPromises);
  await new Promise((resolve) => setTimeout(resolve, 100)); // Shorter delay after images
}

document.addEventListener("DOMContentLoaded", () => {
  setupColorSchemeSelector();
  createEnhancedParticles();
  // Test API connection on load (optional)
  // testApiConnection().then(connected => {
  //   if (!connected) alert("Failed to connect to the API server. Some features might not work.");
  // });

  fetchPokemonData().then((data) => {
    pokemonData = data;
    populateFilters(); // Though this function is empty, it's called here.
    // Auto-load if code and sessionid are in URL
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get("code");
    if (codeFromUrl && cardCodeInputElement) {
        cardCodeInputElement.value = codeFromUrl.toUpperCase();
        console.log("Code found in URL, attempting to auto-load card and session.");
        generateBingo(); // Auto-load
    }
  }).catch(error => {
    console.error("Failed to fetch initial Pokemon data:", error);
    alert("Could not load essential Pokemon data. Please refresh the page.");
  });

  // Event listener for export button (already set up by ID, this is just for reference)
  // if(exportButton) exportButton.addEventListener("click", async () => { /* ... export logic ... */ });
});

function drawBingoLine(cellIndices, lineType) { /* ... (keep existing) ... */ }
function showBingoMessage(count) { /* ... (keep existing) ... */ }
function checkForBingo() { /* ... (keep existing) ... */ }

function toggleCellCompletion(index) {
  const cells = document.querySelectorAll(".bingo-cell");
  if (!cells || !cells[index]) return;
  const cell = cells[index];

  const isStandardFreeSpace = cell.classList.contains("free-space-cell");
  // Standard FREE space is initially completed and should not be toggled off by click.
  // Its 'completed' state is managed by the initial setup and clearCompleted.
  if (isStandardFreeSpace && completedCells[index]) return;


  completedCells[index] = !completedCells[index];
  cell.classList.toggle("completed", completedCells[index]);

  if (cell.classList.contains("legendary-center")) {
    const existingCheckmark = cell.querySelector(".manual-checkmark");
    if (completedCells[index] && !existingCheckmark) {
      const checkmark = document.createElement("div");
      checkmark.className = "manual-checkmark";
      checkmark.innerHTML = "✓";
      checkmark.style.cssText = `position: absolute; top: 5px; right: 5px; background: #FFD700; color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; z-index: 100; box-shadow: 0 2px 4px rgba(0,0,0,0.3); pointer-events: none;`;
      cell.appendChild(checkmark);
    } else if (!completedCells[index] && existingCheckmark) {
      existingCheckmark.remove();
    }
  }

  cell.style.transform = "scale(0.95)";
  setTimeout(() => { cell.style.transform = ""; }, 150);
  setTimeout(checkForBingo, 200);

  if (currentSessionId) {
    console.log("Saving completed cells to backend:", completedCells);
    updateSessionCompletedCells(currentSessionId, completedCells);
  } else {
    console.warn("No currentSessionId found, cannot save cell completion state to backend.");
  }
}

// `initializeCompletedCells` is removed as its logic is integrated into generateBingo and renderBingoCard.

// Keep your existing export function
if(exportButton) exportButton.addEventListener("click", async () => { /* ... (keep existing export logic) ... */ });


function clearCompleted() {
  completedCells = Array(25).fill(false); // Reset array state
  currentBingoCount = 0;

  document.querySelectorAll(".bingo-cell").forEach((cell, index) => {
    cell.classList.remove("completed");
    const existingCheckmark = cell.querySelector(".manual-checkmark");
    if (existingCheckmark) existingCheckmark.remove();

    // If it's a standard FREE space, re-mark it as completed in the array and visually
    if (cell.classList.contains("free-space-cell")) {
      completedCells[index] = true; // Set in array
      cell.classList.add("completed"); // Ensure visual style for completed free space
    }
  });

  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());
  const grid = document.getElementById("bingoGrid");
  if(grid) grid.classList.remove("bingo-celebration");
  const existingMessage = document.querySelector(".bingo-message");
  if (existingMessage) existingMessage.remove();

  if (currentSessionId) {
    console.log("Clearing completed cells on backend:", completedCells);
    updateSessionCompletedCells(currentSessionId, completedCells);
  }
}

function cleanupTooltips() { /* ... (keep existing) ... */ }
function createEnhancedParticles() { /* ... (keep existing) ... */ }
// document.addEventListener('DOMContentLoaded', createEnhancedParticles); // Already called above
setInterval(createEnhancedParticles, 30000);
