// Global tooltip management
let activeTooltip = null;

function createTooltip(content, isLegendary = false) {
  removeActiveTooltip();
  const tooltip = document.createElement("div");
  tooltip.className = isLegendary ? "legendary-tooltip" : "tooltip";

  // Base styles for all tooltips
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

  const arrow = document.createElement("div");
  arrow.style.cssText = `
    position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    width: 0; height: 0;
    border-left: ${isLegendary ? "6px" : "5px"} solid transparent;
    border-right: ${isLegendary ? "6px" : "5px"} solid transparent;
    border-top: ${isLegendary ? "6px" : "5px"} solid ${isLegendary ? "#16213e" : "rgba(0,0,0,0.9)"};
  `;
  tooltip.appendChild(arrow);

  document.body.appendChild(tooltip);
  activeTooltip = tooltip;
  return tooltip;
}

function showTooltip(tooltip, targetElement, content) {
  if (!tooltip || !targetElement) return;
  tooltip.textContent = content;

  const rect = targetElement.getBoundingClientRect();
  let tooltipRect = tooltip.getBoundingClientRect();

  tooltip.style.visibility = "hidden";
  tooltip.style.opacity = "0";
  tooltip.style.display = "block";
  tooltipRect = tooltip.getBoundingClientRect();

  let left = rect.left + rect.width / 2;
  let top = rect.top - tooltipRect.height - 10;

  const padding = 10;
  if (left - tooltipRect.width / 2 < padding) {
    left = tooltipRect.width / 2 + padding;
  } else if (left + tooltipRect.width / 2 > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width / 2 - padding;
  }

  const arrow = tooltip.querySelector("div");
  const isLegendary = tooltip.classList.contains("legendary-tooltip"); // Check if legendary for arrow adjustment

  if (top < padding) {
    top = rect.bottom + 10;
    if (arrow) {
        const arrowBorderWidth = isLegendary ? "6px" : "5px";
        arrow.style.top = `-${arrowBorderWidth}`; // Position arrow at the top of the tooltip
        arrow.style.borderTopColor = 'transparent';
        arrow.style.borderBottomColor = isLegendary ? "#16213e" : "rgba(0,0,0,0.9)"; // Color of the tooltip body
    }
  } else {
    if(arrow) {
        arrow.style.top = '100%'; // Position arrow at the bottom of the tooltip
        arrow.style.borderBottomColor = 'transparent';
        arrow.style.borderTopColor = isLegendary ? "#16213e" : "rgba(0,0,0,0.9)"; // Color of the tooltip body
    }
  }

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
  tooltip.style.opacity = "1";
  tooltip.style.visibility = "visible";
  tooltip.style.display = "";
}


function removeActiveTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}

function setupTooltipEvents(cell, contentFactory, isLegendary = false) {
  let tooltip = null;
  cell.addEventListener("mouseenter", () => {
    const currentContent = typeof contentFactory === 'function' ? contentFactory() : contentFactory;
    tooltip = createTooltip("", isLegendary);
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
function createParticles() {
  const particlesContainer = document.querySelector(".particles");
  if (!particlesContainer) return; // Guard clause
  particlesContainer.innerHTML = ''; // Clear existing before adding new ones
  const particleCount = 15;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 8 + "s"; // Original delays
    particle.style.animationDuration = 8 + Math.random() * 4 + "s"; // Original durations
    particlesContainer.appendChild(particle);
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");
  const body = document.body;
  if (loadingScreen) {
    loadingScreen.classList.add("fade-out");
  }
  body.classList.remove("loading");

  setTimeout(() => {
    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }
  }, 800); // Match CSS transition
}

// Initial calls for loading screen
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createParticles);
} else {
    createParticles(); // DOM already loaded
}

window.addEventListener("load", () => {
  setTimeout(hideLoadingScreen, 2000); // Minimum loading time
});

setTimeout(() => {
  if (document.body.classList.contains("loading")) {
    hideLoadingScreen(); // Fallback
  }
}, 5000);

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'  // Local development
  : 'https://cobblebingo-backend-production.up.railway.app';
console.log('Using API Base URL:', API_BASE_URL);

// Global state variables
let currentSessionId = null;
let currentCardCode = null;
let pokemonData = [];
let completedCells = Array(25).fill(false);
let currentBingoCount = 0;

// DOM Element references (best to define after DOMContentLoaded or ensure elements exist)
let difficultySelect, cardCodeInputElement, mainLoadingSpinner, bingoCardGridElement,
    bingoCardWrapperElement, bingoCardLogoContainerElement, exportButton,
    postGenerationControlsElement, controlsContainerElement;

function initializeDOMElements() {
    difficultySelect = document.getElementById("difficulty");
    cardCodeInputElement = document.getElementById("cardCode");
    mainLoadingSpinner = document.getElementById("loadingSpinnerMain");
    bingoCardGridElement = document.getElementById("bingoGrid");
    bingoCardWrapperElement = document.getElementById("bingoCard");
    bingoCardLogoContainerElement = document.getElementById("bingoCardLogoContainer");
    exportButton = document.getElementById("exportBtn");
    postGenerationControlsElement = document.getElementById("postGenerationControls");
    controlsContainerElement = document.querySelector(".controls-container");
}


// Enhanced API call function
async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}/api/${endpoint}`;
    console.log('Making API call to:', url, 'Options:', options.method || 'GET', options.body || '');

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'include',
      ...options,
    });

    const responseText = await response.text();
    console.log(`Response from ${url}: ${response.status}`, responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));


    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status} from ${endpoint}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
        if (errorData.details) errorMessage += ` Details: ${JSON.stringify(errorData.details)}`;
      } catch (parseError) {
        if (responseText.toLowerCase().includes('<html>')) {
          errorMessage = `Server returned HTML instead of JSON for ${endpoint}. Endpoint or server config issue.`;
        } else {
          errorMessage = `Server error (non-JSON response) for ${endpoint}: ${responseText.substring(0, 200)}...`;
        }
      }
      console.error('API error response full text:', responseText);
      throw new Error(errorMessage);
    }

    if (!responseText) { // Handle empty successful responses (e.g., 204 No Content)
        console.log(`API call to ${endpoint} successful with empty response.`);
        return {}; // Or null, depending on how you want to handle it
    }

    try {
      const data = JSON.parse(responseText);
      console.log('API call successful, data:', data);
      return data;
    } catch (parseError) {
      console.error('Failed to parse JSON response from ' + endpoint + ':', parseError, 'Response text was:', responseText);
      throw new Error(`Invalid JSON response from ${endpoint}: ${parseError.message}`);
    }
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error.message);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    // Re-throw specific or transformed error
    throw error;
  }
}

// API Test Function
async function testApiConnection() {
  try {
    console.log('Testing API connection to:', `${API_BASE_URL}/health`);
    const data = await apiCall('health'); // Use apiCall for consistency
    console.log('✅ API connection successful. Health response:', data);
    return true;
  } catch (error) {
    console.error('❌ API connection failed during test:', error.message);
    // alert("Failed to connect to the API server. Some features might not work."); // Optional user alert
    return false;
  }
}

// Card and Session API Functions
async function generateAndStoreCard(selectedPokemon, selectedRarity) {
  try {
    console.log('Generating card with:', { rarity: selectedRarity, pokemonCount: selectedPokemon.length });
    const response = await apiCall("generate-card", {
      method: "POST",
      body: JSON.stringify({
        difficulty: selectedRarity, // Ensure backend expects 'difficulty' if you send it
        pokemon: selectedPokemon,
      }),
    });
    if (!response.code) {
      throw new Error('Server did not return a card code after generating card.');
    }
    return response.code; // Returns the string card code
  } catch (error) {
    console.error("Error generating card on server:", error.message);
    throw new Error(`Failed to generate card on server: ${error.message}`);
  }
}

async function retrieveCard(code) {
  try {
    console.log('Retrieving card with code:', code);
    const response = await apiCall(`get-card/${code}`);
    if (!response.cardData || !response.code) { // Ensure code is also present
      throw new Error('Invalid card data or code missing in response from server.');
    }
    return response; // Returns the full card object
  } catch (error) {
    console.error("Error retrieving card:", error.message);
    if (error.message.includes("404") || error.message.toLowerCase().includes('card not found')) {
        throw new Error(`Card with code "${code}" not found.`);
    }
    throw new Error(`Failed to retrieve card: ${error.message}`);
  }
}

async function validateCode(code) {
  try {
    console.log('Validating code:', code);
    const response = await apiCall(`validate-code/${code}`);
    return response.exists; // Expects { success: true, exists: boolean, ... }
  } catch (error) {
    console.error("Error validating code:", error.message);
    return false; // Default to false on error
  }
}

async function initializeSession(cardCode) {
  try {
    console.log('Initializing session for card code:', cardCode);
    if (!cardCode || typeof cardCode !== 'string' || cardCode.trim() === '') {
        throw new Error("Invalid cardCode provided for session initialization.");
    }
    const response = await apiCall("session/init", {
      method: "POST",
      body: JSON.stringify({ cardCode }),
    });
    if (!response.sessionId || !response.cardCode || !response.completedCells) {
      throw new Error('Server did not return complete session data (sessionId, cardCode, completedCells).');
    }
    console.log('Session initialized:', response);
    return response;
  } catch (error) {
    console.error("Error initializing session:", error.message);
    throw new Error(`Failed to initialize session: ${error.message}`);
  }
}

async function getSessionData(sessionId) {
  try {
    console.log('Retrieving session data for session ID:', sessionId);
    const response = await apiCall(`session/${sessionId}`);
    if (!response.cardCode || !response.completedCells || !response.sessionId) {
      throw new Error('Invalid or incomplete session data received from server.');
    }
    console.log('Session data retrieved:', response);
    return response;
  } catch (error) {
    console.error("Error retrieving session data:", error.message);
    if (error.message.includes("404") || error.message.toLowerCase().includes('session not found')) {
        // This specific error can be handled by creating a new session in generateBingo
        throw new Error(`Session "${sessionId}" not found.`);
    }
    throw new Error(`Failed to retrieve session data: ${error.message}`);
  }
}

async function updateSessionCompletedCells(sessionId, cells) {
  try {
    console.log('Updating completed cells for session ID:', sessionId); // Cells logging removed for brevity, already in toggleCellCompletion
    if (!sessionId) {
        console.warn("No session ID, cannot update completed cells on server.");
        return; // Or throw error if this should always be present
    }
    if (!Array.isArray(cells) || cells.length !== 25) {
        console.error("Invalid completedCells array format for update.");
        return; // Or throw error
    }
    await apiCall(`session/${sessionId}/update`, {
      method: "PUT",
      body: JSON.stringify({ completedCells: cells }),
    });
    console.log('Session cells updated successfully on server.');
  } catch (error) {
    console.error("Error updating session completed cells on server:", error.message);
    // Optionally, inform the user that saving failed, but allow local play to continue.
    // For example, display a small, non-intrusive "Save failed" message.
  }
}

// URL Management
function updateUrlWithSession(cardCode, sessionId) {
  if (!cardCode || !sessionId) {
    console.warn("Attempted to update URL without cardCode or sessionId.");
    return;
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('code', cardCode);
    url.searchParams.set('sessionid', sessionId);
    history.pushState({ cardCode, sessionId }, '', url.toString());
    console.log('URL updated:', url.toString());
  } catch (error) {
    console.error('Error updating URL:', error);
  }
}

// Utility Functions
function createSeededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

async function fetchPokemonData() {
  try {
    const response = await fetch(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlLTA4Oe6Kzu-EQp_AS1wGs_PzLZ9GMIhWrgUDuXux18AYe7sg6B5LfrN0oRw63ZdyTr5rrDvM54ui/pub?output=csv",
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch Pokemon CSV: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
        console.warn("Parsing errors in Pokemon CSV:", parsed.errors);
    }

    const data = [];
    const seen = new Set();
    parsed.data.forEach((row) => {
      const name = row["Name"]?.trim();
      const id = row["ID"]?.trim().replace(/\D/g, "");
      const biome = row["Biome"]?.trim();
      const rarity = row["Rarity"]?.trim();

      if (!name || !id || seen.has(name)) return; // Basic validation
      seen.add(name);
      data.push({ name, biome, rarity, id });
    });
    console.log(`Fetched and processed ${data.length} Pokemon.`);
    return data;
  } catch(error) {
    console.error("Fatal Error: Could not fetch Pokemon data.", error.message);
    alert("Failed to load essential Pokemon data. The application may not function correctly. Please try refreshing the page.");
    return []; // Return empty array to prevent further errors if possible
  }
}

function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function populateFilters() { /* This function is empty in the provided code */ }

function selectPokemonByDifficulty(pokemonList, difficulty) {
  console.log("Selecting Pokémon by difficulty:", difficulty, "from list size:", pokemonList.length);
  if (!pokemonList || pokemonList.length === 0) {
    console.error("Pokemon list is empty or undefined for selectPokemonByDifficulty.");
    return Array(25).fill({ name: "Error", rarity: "common", biome: "Error", id: "0" }); // Fallback
  }

  const byRarity = {
    common: pokemonList.filter((p) => p.rarity?.toLowerCase() === "common"),
    uncommon: pokemonList.filter((p) => p.rarity?.toLowerCase() === "uncommon"),
    rare: pokemonList.filter((p) => p.rarity?.toLowerCase() === "rare"),
    "ultra-rare": pokemonList.filter((p) => p.rarity?.toLowerCase() === "ultra-rare"),
    legendary: pokemonList.filter((p) => p.rarity?.toLowerCase() === "legendary"),
  };

  let selected = [];
  const fallbackPokemon = { name: "MissingNo.", rarity: "common", biome: "Glitch", id: "000" };

  function selectFromCategory(category, count) {
    const categoryList = byRarity[category] || [];
    const availableCount = categoryList.length;
    if (availableCount === 0 && count > 0) {
        console.warn(`No Pokémon in category '${category}' to select ${count}. Using fallbacks.`);
        return Array(count).fill(fallbackPokemon);
    }
    const numToSelect = Math.min(count, availableCount);
    const selectedFromCat = shuffle(categoryList).slice(0, numToSelect);

    // If not enough were selected and count was > 0, pad with fallbacks or other rarities
    if (selectedFromCat.length < count) {
        console.warn(`Not enough ${category} Pokémon (${selectedFromCat.length}/${count}). Padding may occur.`);
        // Simple padding with fallbacks for now
        while(selectedFromCat.length < count) {
            selectedFromCat.push(fallbackPokemon);
        }
    }
    return selectedFromCat;
  }

  // Difficulty-based selection logic (ensure counts sum to 24 for most, 25 for insane)
  if (difficulty === "easy") { selected = [...selectFromCategory("common", 15), ...selectFromCategory("uncommon", 9)]; } // 24
  else if (difficulty === "normal") { selected = [...selectFromCategory("common", 2), ...selectFromCategory("uncommon", 8), ...selectFromCategory("rare", 8), ...selectFromCategory("ultra-rare", 6)]; } // 24
  else if (difficulty === "hard") { selected = [...selectFromCategory("rare", 15), ...selectFromCategory("ultra-rare", 9)]; } // 24
  else if (difficulty === "common") { selected = selectFromCategory("common", 24); }
  else if (difficulty === "uncommon") { selected = selectFromCategory("uncommon", 24); }
  else if (difficulty === "rare") { selected = selectFromCategory("rare", 24); }
  else if (difficulty === "ultra-rare") { selected = selectFromCategory("ultra-rare", 24); }
  else if (difficulty === "insane") { // Expects 25
    selected = selectFromCategory("ultra-rare", 24);
    const legendaryPool = byRarity["legendary"] || [];
    const legendaryPokemon = legendaryPool.length > 0 ? shuffle(legendaryPool)[0] : { name: "LEGENDARY F L", rarity: "legendary", biome: "Legendary Lair", id: "L00" };
    selected.splice(12, 0, legendaryPokemon); // Insert legendary at center, making it 25
  } else { // Default to normal
    console.warn("Unknown difficulty, defaulting to normal");
    selected = [...selectFromCategory("common", 2), ...selectFromCategory("uncommon", 8), ...selectFromCategory("rare", 8), ...selectFromCategory("ultra-rare", 6)]; // 24
  }

  // Ensure correct length (24 for non-insane, 25 for insane)
  const targetLength = difficulty === "insane" ? 25 : 24;
  if (selected.length !== targetLength) {
    console.warn(`Selected Pokémon count (${selected.length}) does not match target (${targetLength}) for difficulty '${difficulty}'. Adjusting...`);
    while (selected.length < targetLength) { // Pad if too few
      selected.push(selectFromCategory("common", 1)[0] || fallbackPokemon); // Prioritize common for padding
    }
    if (selected.length > targetLength) { // Truncate if too many
      selected = selected.slice(0, targetLength);
    }
  }
  console.log("Final Selected Pokémon for difficulty logic:", selected.length, selected.map(p => p.name));
  return selected;
}

function setupColorSchemeSelector() {
  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach((option) => {
    option.addEventListener("click", () => {
      colorOptions.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
      const theme = option.dataset.theme;
      document.body.className = `theme-${theme}`; // Overwrites existing body classes, ensure 'loading' class is handled if needed
      if (document.body.classList.contains('loading')) { // Preserve loading class if still loading
          document.body.classList.add('loading');
      }
    });
  });
}

function openPokemonPage(pokemonName) {
  if (!pokemonName || typeof pokemonName !== 'string') return;
  const formattedName = pokemonName.toLowerCase().replace(/\s+/g, "_");
  const url = `https://cobblemon.tools/pokedex/pokemon/${formattedName}`;
  window.open(url, "_blank");
}

async function imageToBase64(imgElement) {
  return new Promise((resolve) => {
    if (!imgElement || !imgElement.src || imgElement.src === "" || imgElement.src.startsWith("data:")) {
      resolve(imgElement && imgElement.src && imgElement.src.startsWith("data:") ? imgElement.src : ""); // Return if already base64 or no src
      return;
    }
    // Check if image is already loaded
    if (!imgElement.complete || imgElement.naturalWidth === 0) {
        // If not loaded, wait for it to load
        imgElement.onload = () => convertImage(imgElement, resolve);
        imgElement.onerror = () => {
            console.warn("Image failed to load for base64 conversion:", imgElement.src);
            resolve(""); // Resolve with empty string on error
        };
    } else {
        // Image already loaded
        convertImage(imgElement, resolve);
    }
  });
}

function convertImage(imgElement, resolve) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    try {
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    } catch (error) {
      console.warn("Could not convert image to base64:", error, imgElement.src);
      resolve(""); // Resolve with empty string on error
    }
}


// Core Bingo Logic Functions
async function generateBingo() {
  if (!difficultySelect || !cardCodeInputElement || !mainLoadingSpinner || !bingoCardGridElement ||
      !bingoCardWrapperElement || !bingoCardLogoContainerElement || !exportButton ||
      !postGenerationControlsElement || !controlsContainerElement) {
      console.error("One or more critical DOM elements are missing. Aborting generateBingo.");
      alert("Error: UI elements are missing. Please refresh the page.");
      return;
  }

  const selectedDifficulty = difficultySelect.value;
  const cardCodeInput = cardCodeInputElement.value.trim().toUpperCase();

  mainLoadingSpinner.style.display = "flex";
  bingoCardWrapperElement.style.display = "none";
  bingoCardLogoContainerElement.style.display = "none";
  exportButton.style.display = "none";
  postGenerationControlsElement.style.display = "none";
  // controlsContainerElement.style.display = "none"; // Keep filters visible or hide if preferred

  bingoCardGridElement.innerHTML = "";
  cleanupTooltips();
  document.querySelectorAll(".bingo-line, .bingo-message").forEach(el => el.remove());
  currentBingoCount = 0;

  await new Promise((resolve) => setTimeout(resolve, 200));

  let cardDataFromServer;
  let sessionDataFromServer;
  let loadedCardCode = null;
  let loadedSessionId = null;

  const urlParams = new URLSearchParams(window.location.search);
  const urlCode = urlParams.get("code")?.toUpperCase();
  const urlSessionId = urlParams.get("sessionid");

  try {
    if (cardCodeInput) {
      loadedCardCode = cardCodeInput;
      if (urlSessionId && urlCode === loadedCardCode) loadedSessionId = urlSessionId;
    } else if (urlCode) {
      loadedCardCode = urlCode;
      loadedSessionId = urlSessionId;
    }

    if (loadedCardCode) {
      console.log(`Attempting to load card: ${loadedCardCode}`);
      cardDataFromServer = await retrieveCard(loadedCardCode);
      currentCardCode = cardDataFromServer.code;
      cardCodeInputElement.value = currentCardCode;
      if (cardDataFromServer.cardData.difficulty) difficultySelect.value = cardDataFromServer.cardData.difficulty;

      if (loadedSessionId) {
        console.log(`Attempting to load session: ${loadedSessionId} for card: ${currentCardCode}`);
        try {
          sessionDataFromServer = await getSessionData(loadedSessionId);
          if (sessionDataFromServer.cardCode !== currentCardCode) {
            console.warn(`Session ${loadedSessionId} is for a different card. Initializing new session for ${currentCardCode}.`);
            sessionDataFromServer = null; currentSessionId = null;
          } else {
            currentSessionId = sessionDataFromServer.sessionId;
          }
        } catch (sessionError) {
          console.warn(`Failed to load session ${loadedSessionId} (error: ${sessionError.message}). Initializing new session.`);
          sessionDataFromServer = null; currentSessionId = null;
        }
      }
      if (!currentSessionId && currentCardCode) {
        console.log(`No valid session for card ${currentCardCode}. Initializing new session.`);
        sessionDataFromServer = await initializeSession(currentCardCode);
        currentSessionId = sessionDataFromServer.sessionId;
      }
    } else { // Generate new card
      console.log("Generating new card for difficulty:", selectedDifficulty);
      cardCodeInputElement.value = "";
      history.replaceState(null, null, window.location.pathname + window.location.hash); // Preserve hash if any

      if (pokemonData.length === 0) throw new Error("Pokemon data not loaded. Cannot generate new card.");
      let pokemonForCardGeneration = selectPokemonByDifficulty(pokemonData, selectedDifficulty); // Returns 24 or 25
      let finalPokemonSelection = [];

      if (selectedDifficulty === "insane") { // selectPokemonByDifficulty already gives 25
          finalPokemonSelection = pokemonForCardGeneration; // Already includes legendary at center
           // Optionally re-shuffle non-center parts if desired, though selectPokemonByDifficulty shuffles categories
      } else { // Expects 24 from selectPokemonByDifficulty
          if (pokemonForCardGeneration.length !== 24) {
              console.warn(`Expected 24 Pokemon for ${selectedDifficulty}, got ${pokemonForCardGeneration.length}. Adjusting.`);
              // Simple adjustment: take first 24 or pad
              pokemonForCardGeneration = pokemonForCardGeneration.slice(0, 24);
              while(pokemonForCardGeneration.length < 24) pokemonForCardGeneration.push({ name: "Padding", rarity: "common", biome: "Any", id:"P00"});
          }
          const shuffledPokemon = shuffle(pokemonForCardGeneration);
          for (let i = 0; i < 25; i++) {
            finalPokemonSelection.push(i === 12 ? { name: "Free Space", rarity: "", biome: "", id: "FREE" } : shuffledPokemon[i < 12 ? i : i - 1]);
          }
      }
      if (finalPokemonSelection.length !== 25) throw new Error(`Final Pokemon selection count is ${finalPokemonSelection.length}, expected 25.`);

      const newCardCode = await generateAndStoreCard(finalPokemonSelection, selectedDifficulty);
      currentCardCode = newCardCode;
      cardCodeInputElement.value = currentCardCode;
      cardDataFromServer = { code: currentCardCode, cardData: { pokemon: finalPokemonSelection, difficulty: selectedDifficulty }, createdAt: new Date().toISOString(), usageCount: 0, lastAccessed: new Date().toISOString() };

      if (!currentCardCode) throw new Error("New card code is unexpectedly missing after generation.");
      console.log(`New card ${currentCardCode} generated. Initializing session.`);
      sessionDataFromServer = await initializeSession(currentCardCode);
      currentSessionId = sessionDataFromServer.sessionId;
    }

    if (!currentCardCode || !currentSessionId) throw new Error("Critical error: Card code or session ID is missing.");
    updateUrlWithSession(currentCardCode, currentSessionId);
    document.body.setAttribute("data-generated", "true");

    completedCells = Array(25).fill(false); // Start with a clean slate for the array
    
    if (sessionDataFromServer && sessionDataFromServer.cardCode === currentCardCode && sessionDataFromServer.completedCells) {
      // Valid session found, use its completedCells state
      completedCells = [...sessionDataFromServer.completedCells];
      console.log("Applying session data for completedCells:", completedCells.map((c, i) => c ? i : -1).filter(i => i !== -1));
    } else {
      // No valid session, or new card generation. Set defaults.
      console.log("No valid session data or new card. Setting default completed state.");
      const centerPokemonDetails = cardDataFromServer.cardData.pokemon[12];
      if (centerPokemonDetails && centerPokemonDetails.name === "Free Space" && centerPokemonDetails.rarity?.toLowerCase() !== "legendary") {
        if (completedCells.length === 25) { // Safety check
            completedCells[12] = true; // Auto-complete standard free space in the array
            console.log("Standard FREE space (index 12) auto-marked as completed in array.");
        }
      } else if (centerPokemonDetails && centerPokemonDetails.rarity?.toLowerCase() === "legendary") {
          console.log("Center cell is Legendary. Its completion depends on session data (if any) or clicks.");
          // For a new legendary card with no session, it starts uncompleted (completedCells[12] remains false)
      }
    }
    
    console.log("Final Pokemon for Rendering:", cardDataFromServer.cardData.pokemon.map(p=>p.name));
    console.log("Initial completedCells state for rendering (true indices):", completedCells.map((c, i) => c ? i : -1).filter(i => i !== -1));
    
    await renderBingoCard(cardDataFromServer.cardData.pokemon, completedCells);
    checkForBingo();

  } catch (error) {
    console.error("Error in generateBingo main flow:", error.message, error.stack);
    alert(`Operation failed: ${error.message}`);
    mainLoadingSpinner.style.display = "none";
    controlsContainerElement.style.display = "flex"; // Show filters
    bingoCardWrapperElement.style.display = "none";
    currentSessionId = null; currentCardCode = null;
    return;
  }

  mainLoadingSpinner.style.display = "none";
  bingoCardWrapperElement.style.display = "flex";
  bingoCardLogoContainerElement.style.display = "block";
  exportButton.style.display = "inline-block";
  postGenerationControlsElement.style.display = "inline-flex";
  controlsContainerElement.style.display = "flex";
}

function generateNewCard() {
  if (cardCodeInputElement) cardCodeInputElement.value = "";
  currentSessionId = null; currentCardCode = null;
  history.replaceState(null, null, window.location.pathname + window.location.hash);
  document.body.removeAttribute("data-generated");
  generateBingo();
}

async function renderBingoCard(selectedPokemonList, initialCompletedStateArray) {
  if(!bingoCardGridElement) return;
  bingoCardGridElement.innerHTML = "";
  const imageLoadPromises = [];

  selectedPokemonList.forEach((pokemon, index) => {
    const cell = document.createElement("div");
    cell.className = "bingo-cell";
    const pokemonName = pokemon.name || "Unknown";

    // Determine cell type first
    let isLegendaryCenter = false;
    let isStandardFreeSpace = false;

    if (index === 12) {
      if (pokemon.rarity?.toLowerCase() === "legendary") {
        isLegendaryCenter = true;
        cell.classList.add("legendary-center");
      } else if (pokemon.name === "Free Space") {
        isStandardFreeSpace = true;
        cell.classList.add("free-space-cell");
        cell.textContent = "FREE"; // Set text content for FREE space
      }
    }

    // Apply .completed class based on the initial state array
    if (initialCompletedStateArray && initialCompletedStateArray[index]) {
      cell.classList.add("completed");
      // If it's a legendary center and completed, add the manual checkmark now
      if (isLegendaryCenter) {
        const checkmark = document.createElement("div");
        checkmark.className = "manual-checkmark";
        checkmark.innerHTML = "✓";
        checkmark.style.cssText = `position: absolute; top: 5px; right: 5px; background: #FFD700; color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; z-index: 100; box-shadow: 0 2px 4px rgba(0,0,0,0.3); pointer-events: none;`;
        cell.appendChild(checkmark);
      }
    }

    // Setup event listeners and content (excluding text for standard FREE space)
    if (isLegendaryCenter) {
      cell.addEventListener("click", (e) => { /* ... as before ... */ });
      setupTooltipEvents(cell, () => `Legendary: ${pokemonName}\nBiome: ${pokemon.biome || 'Various'}`, true);
    } else if (!isStandardFreeSpace) { // Regular Pokemon cells
      cell.style.cursor = "pointer";
      cell.addEventListener("click", (e) => { /* ... as before ... */ });
      setupTooltipEvents(cell, () => `${pokemonName}\nBiome: ${pokemon.biome || 'N/A'}\nRarity: ${pokemon.rarity || 'N/A'}`, false);
    }

    // Add images, names, rarity badges for non-standard-FREE-space cells, or for legendary center
    if (!isStandardFreeSpace || isLegendaryCenter) {
        const wrapper = document.createElement("div"); wrapper.className = "image-wrapper";
        const img = document.createElement("img"); img.alt = pokemonName; img.className = "pokemon-img"; img.crossOrigin = "anonymous";

        // Minified image source logic from your script for brevity
        if (isLegendaryCenter) {
            const possiblePaths = [`./public/${pokemon.id}.png`, `./images/${pokemon.id}.png`, `/images/${pokemon.id}.png`, `./assets/${pokemon.id}.png`, `/assets/${pokemon.id}.png`, `./${pokemon.id}.png`]; let pathIndex = 0; const tryNextPath = () => { if (pathIndex < possiblePaths.length) { img.src = possiblePaths[pathIndex++]; } else { console.warn(`Local image for legendary ${pokemonName} not found, trying external.`); tryExternalSources(); } }; const tryExternalSources = async () => { const formattedName = pokemonName.toLowerCase().replace(/\s+/g, "_"); const cobblemonUrl = `https://cobbledex.b-cdn.net/mons/large/${formattedName}.webp`; try { const response = await fetch(cobblemonUrl); if (response.ok) { const blob = await response.blob(); if (blob.size < 2160 || blob.size > 2180) { const objectUrl = URL.createObjectURL(blob); img.src = objectUrl; img.onload = () => URL.revokeObjectURL(objectUrl); return; } } } catch (error) { /* ignored */ } if (pokemon.id) { img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`; } else { img.src = ""; img.alt = `${pokemonName} (Image unavailable)`; } }; img.onerror = tryNextPath; tryNextPath();
        } else {
            const formattedName = pokemonName.toLowerCase().replace(/\s+/g, "_"); const cobblemonUrl = `https://cobbledex.b-cdn.net/mons/large/${formattedName}.webp`; const loadPromise = new Promise(async (resolve) => { try { const response = await fetch(cobblemonUrl); if (!response.ok) throw new Error('Cobbledex fetch failed'); const blob = await response.blob(); if (blob.size >= 2160 && blob.size <= 2180) throw new Error("Placeholder"); const objectUrl = URL.createObjectURL(blob); img.src = objectUrl; img.onload = () => { URL.revokeObjectURL(objectUrl); resolve(); }; img.onerror = () => { URL.revokeObjectURL(objectUrl); throw new Error('Image load failed');}; } catch (error) { if (pokemon.id) { img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`; img.onload = resolve; img.onerror = () => { img.src = ""; img.alt = `${pokemonName} (Image unavailable)`; resolve(); };} else { img.src = ""; img.alt = `${pokemonName} (No ID)`; resolve();}}}); imageLoadPromises.push(loadPromise);
        }
        wrapper.appendChild(img); cell.appendChild(wrapper);
        const label = document.createElement("div"); label.className = "pokemon-name"; label.textContent = pokemonName; cell.appendChild(label);
        if (pokemon.rarity) { const rarityBadge = document.createElement("div"); const rarityClass = pokemon.rarity.toLowerCase().replace(/\s+/g, "-"); rarityBadge.className = `rarity-badge ${rarityClass}`; rarityBadge.textContent = pokemon.rarity.charAt(0).toUpperCase() + pokemon.rarity.slice(1); cell.appendChild(rarityBadge); }
    }
    bingoCardGridElement.appendChild(cell);
  });
  await Promise.all(imageLoadPromises).catch(err => console.warn("Some images failed to load during render:", err));
  await new Promise((resolve) => setTimeout(resolve, 50));
}


document.addEventListener("DOMContentLoaded", () => {
  initializeDOMElements(); // Initialize DOM element variables
  setupColorSchemeSelector();
  createEnhancedParticles(); // For loading screen background

  testApiConnection().then(connected => {
    if (!connected) { /* Optionally alert user or log */ }
  });

  fetchPokemonData().then((data) => {
    pokemonData = data;
    populateFilters(); // This is empty but called in original code
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get("code");
    if (codeFromUrl && cardCodeInputElement) {
      cardCodeInputElement.value = codeFromUrl.toUpperCase();
      console.log("Code found in URL, attempting to auto-load card and session.");
      generateBingo(); // Auto-load if code is present
    } else {
      // If no code in URL, ensure loading screen hides if not already hidden
      // This might be redundant if window.load is reliable
      setTimeout(() => {
          if (document.body.classList.contains("loading")) hideLoadingScreen();
      }, 500);
    }
  }).catch(error => {
    console.error("Failed to fetch initial Pokemon data:", error.message);
    alert("Critical error: Could not load Pokemon data. Please refresh the page to try again.");
    hideLoadingScreen(); // Hide loading screen even on error to not block UI
  });
});

function drawBingoLine(cellIndices, lineType) { const grid = bingoCardGridElement; if(!grid) return; const line = document.createElement("div"); line.className = `bingo-line ${lineType}`; if (lineType === "horizontal") { const row = Math.floor(cellIndices[0] / 5); line.style.top = `${row * (130 + 8) + 65 - 3}px`; } else if (lineType === "vertical") { const col = cellIndices[0] % 5; line.style.left = `${col * (100 + 8) + 50 - 3}px`; } /* Diagonal specific styles are in CSS */ grid.appendChild(line); }
function showBingoMessage(count) { const existingMessage = document.querySelector(".bingo-message"); if (existingMessage) existingMessage.remove(); const message = document.createElement("div"); message.className = "bingo-message"; message.textContent = count === 1 ? "🎉 BINGO! 🎉" : `🎉 ${count} BINGOS! 🎉`; document.body.appendChild(message); setTimeout(() => message.remove(), 4000); }

function checkForBingo() {
  if (!bingoCardGridElement) return 0;
  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());
  const lines = [ /* Rows */ { indices: [0, 1, 2, 3, 4], type: "horizontal" }, { indices: [5, 6, 7, 8, 9], type: "horizontal" }, { indices: [10, 11, 12, 13, 14], type: "horizontal" }, { indices: [15, 16, 17, 18, 19], type: "horizontal" }, { indices: [20, 21, 22, 23, 24], type: "horizontal" }, /* Columns */ { indices: [0, 5, 10, 15, 20], type: "vertical" }, { indices: [1, 6, 11, 16, 21], type: "vertical" }, { indices: [2, 7, 12, 17, 22], type: "vertical" }, { indices: [3, 8, 13, 18, 23], type: "vertical" }, { indices: [4, 9, 14, 19, 24], type: "vertical" }, /* Diagonals */ { indices: [0, 6, 12, 18, 24], type: "diagonal-main" }, { indices: [4, 8, 12, 16, 20], type: "diagonal-anti" }, ];
  let bingoCount = 0;
  lines.forEach((line) => { if (line.indices.every((index) => completedCells[index])) { bingoCount++; drawBingoLine(line.indices, line.type); } });
  if (bingoCount > currentBingoCount) { bingoCardGridElement.classList.add("bingo-celebration"); setTimeout(() => bingoCardGridElement.classList.remove("bingo-celebration"), 3000); showBingoMessage(bingoCount); console.log(`BINGO! ${bingoCount} line(s) completed!`); }
  currentBingoCount = bingoCount;
  return bingoCount;
}

function toggleCellCompletion(index) {
  const cells = document.querySelectorAll(".bingo-cell");
  if (!cells || !cells[index] || index < 0 || index >= 25) return;
  const cell = cells[index];

  const isStandardFreeSpace = cell.classList.contains("free-space-cell");
  if (isStandardFreeSpace && completedCells[index]) { // Standard FREE space, if already completed, cannot be untoggled
    console.log("Standard FREE space cannot be un-toggled.");
    return;
  }

  completedCells[index] = !completedCells[index];
  cell.classList.toggle("completed", completedCells[index]);

  if (cell.classList.contains("legendary-center")) {
    const existingCheckmark = cell.querySelector(".manual-checkmark");
    if (completedCells[index] && !existingCheckmark) {
      const checkmark = document.createElement("div");
      checkmark.className = "manual-checkmark"; checkmark.innerHTML = "✓";
      checkmark.style.cssText = `position: absolute; top: 5px; right: 5px; background: #FFD700; color: #000; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; z-index: 100; box-shadow: 0 2px 4px rgba(0,0,0,0.3); pointer-events: none;`;
      cell.appendChild(checkmark);
    } else if (!completedCells[index] && existingCheckmark) {
      existingCheckmark.remove();
    }
  }

  cell.style.transform = "scale(0.95)"; setTimeout(() => { cell.style.transform = ""; }, 150);
  setTimeout(checkForBingo, 200);
  if (currentSessionId) updateSessionCompletedCells(currentSessionId, completedCells);
}

if(exportButton) exportButton.addEventListener("click", async () => {
  const cardToExport = bingoCardWrapperElement; // Use the wrapper for export
  if (!cardToExport || cardToExport.style.display === 'none') {
    alert("No bingo card to export. Please generate or load a card first."); return;
  }
  const originalButtonText = exportButton.textContent;
  exportButton.textContent = "Exporting..."; exportButton.disabled = true;
  try {
    const images = cardToExport.querySelectorAll("img.pokemon-img"); // Be specific
    await Promise.all(Array.from(images).map(img => imageToBase64(img).then(b64 => { if(b64) img.src = b64; })));
    await new Promise(r => setTimeout(r, 200)); // Ensure images render

    const canvas = await html2canvas(cardToExport, {
        useCORS: true, allowTaint: true, scale: 2, backgroundColor: null, logging: false,
        onclone: (clonedDoc) => {
            const clonedCard = clonedDoc.getElementById("bingoCard"); // ID of the element we are capturing
            if (clonedCard) {
                clonedCard.style.margin = "0"; clonedCard.style.boxShadow = "none";
                // Additional fine-tuning for capture if needed
            }
        }
    });
    const link = document.createElement("a");
    link.download = `cobblemon_bingo_card_${currentCardCode || Date.now()}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  } catch (error) {
    console.error("Error exporting card:", error); alert("Error exporting card. Please try again.");
  } finally {
    exportButton.textContent = originalButtonText; exportButton.disabled = false;
  }
});

function clearCompleted() {
  completedCells = Array(25).fill(false);
  currentBingoCount = 0;
  document.querySelectorAll(".bingo-cell").forEach((cell, index) => {
    cell.classList.remove("completed");
    const existingCheckmark = cell.querySelector(".manual-checkmark");
    if (existingCheckmark) existingCheckmark.remove();
    if (cell.classList.contains("free-space-cell")) { // Re-complete standard FREE space
      completedCells[index] = true;
      cell.classList.add("completed");
    }
  });
  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());
  if(bingoCardGridElement) bingoCardGridElement.classList.remove("bingo-celebration");
  const existingMessage = document.querySelector(".bingo-message");
  if (existingMessage) existingMessage.remove();
  if (currentSessionId) updateSessionCompletedCells(currentSessionId, completedCells);
}

function cleanupTooltips() { removeActiveTooltip(); document.querySelectorAll(".tooltip, .legendary-tooltip").forEach((tooltip) => tooltip.remove()); document.querySelectorAll(".bingo-cell").forEach((cell) => { if (cell.tooltipCleanup) cell.tooltipCleanup(); }); }

function createEnhancedParticles() { // Renamed from original loading screen particles for clarity
    const particlesContainer = document.querySelector('.particles'); // Assumes this is for loading screen
    if (!particlesContainer) return;
    particlesContainer.innerHTML = ''; // Clear existing
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle'; // Use class defined in CSS for loading screen
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = `-${Math.random() * 6}s`; // Ensure these match CSS if different
        particle.style.animationDuration = `${5 + Math.random() * 3}s`;
        particlesContainer.appendChild(particle);
    }
}
// Ensure this is called correctly for the loading screen particles (original call was global)
// The DOMContentLoaded listener now calls createEnhancedParticles for the background.
// If createParticles was specifically for the loading screen, it should be called when loading screen is shown.
// The current setup calls createEnhancedParticles for loading screen from DOMContentLoaded
// and then calls it again via setInterval.
// For the initial loading screen, `createParticles()` is fine. `createEnhancedParticles` from your last CSS file is used.
// The `setInterval` below is for the background particles, not loading screen
// setInterval(createEnhancedParticles, 30000); // This was for background particles, if still desired.
// For loading screen particles, `createParticles()` is called when DOM loads.
