// Global tooltip management
let activeTooltip = null;

function createTooltip(content, isLegendary = false) {
  removeActiveTooltip();
  const tooltip = document.createElement("div");
  tooltip.className = isLegendary ? "legendary-tooltip" : "tooltip";

  // Base styles for all tooltips (can be overridden by CSS classes if preferred)
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
  // Arrow styles are now better handled in CSS for easier maintenance, but this JS approach is kept if it was intended.
  // For consistency, consider moving all tooltip styling to CSS and just toggling classes here.
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
  tooltip.innerHTML = ''; // Clear previous content, especially if it had an arrow
  
  const textNode = document.createTextNode(content);
  tooltip.appendChild(textNode);

  const arrow = document.createElement("div"); // Re-create arrow for proper styling if tooltip is reused
  const isLegendary = tooltip.classList.contains("legendary-tooltip");
  arrow.style.cssText = `
    position: absolute; left: 50%; transform: translateX(-50%);
    width: 0; height: 0;
    border-left: ${isLegendary ? "6px" : "5px"} solid transparent;
    border-right: ${isLegendary ? "6px" : "5px"} solid transparent;
  `;

  tooltip.appendChild(arrow); // Add arrow to the tooltip DOM


  const rect = targetElement.getBoundingClientRect();
  let tooltipRect = tooltip.getBoundingClientRect();

  tooltip.style.visibility = "hidden";
  tooltip.style.opacity = "0";
  tooltip.style.display = "block"; // Temporarily display to measure
  tooltipRect = tooltip.getBoundingClientRect(); // Get updated dimensions

  let left = rect.left + rect.width / 2;
  let top = rect.top - tooltipRect.height - 10; // 10px gap

  const padding = 10; // Window edge padding

  // Adjust horizontal position
  if (left - tooltipRect.width / 2 < padding) {
    left = tooltipRect.width / 2 + padding;
  } else if (left + tooltipRect.width / 2 > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width / 2 - padding;
  }

  // Adjust vertical position and arrow
  if (top < padding) { // Not enough space on top, show below
    top = rect.bottom + 10;
    arrow.style.top = `-${isLegendary ? "6px" : "5px"}`; // Arrow points upwards
    arrow.style.borderTopColor = 'transparent';
    arrow.style.borderBottomColor = isLegendary ? (tooltip.style.backgroundColor || "#16213e") : (tooltip.style.backgroundColor || "rgba(0,0,0,0.9)");
  } else { // Show on top
    arrow.style.top = '100%'; // Arrow points downwards
    arrow.style.borderBottomColor = 'transparent';
    arrow.style.borderTopColor = isLegendary ? (tooltip.style.backgroundColor || "#16213e") : (tooltip.style.backgroundColor || "rgba(0,0,0,0.9)");
  }

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
  tooltip.style.opacity = "1";
  tooltip.style.visibility = "visible";
  tooltip.style.display = ""; // Revert to default display (usually inline-block or block via CSS)
}


function removeActiveTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}

function setupTooltipEvents(cell, contentFactory, isLegendary = false) {
  let tooltip = null;
  cell.addEventListener("mouseenter", (event) => {
    const currentContent = typeof contentFactory === 'function' ? contentFactory() : contentFactory;
    tooltip = createTooltip("", isLegendary); // Create empty, showTooltip will set content
    showTooltip(tooltip, cell, currentContent);
  });
  cell.addEventListener("mouseleave", () => {
    removeActiveTooltip();
    tooltip = null;
  });
  // Cleanup function to be called if cell is removed from DOM
  cell.tooltipCleanup = () => {
    if (tooltip) tooltip.remove();
    tooltip = null;
  };
}

// Loading Screen Animation and Management
function createParticles() {
  const particlesContainer = document.querySelector(".particles");
  if (!particlesContainer) return;
  particlesContainer.innerHTML = ''; 
  const particleCount = 15;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle"; // CSS will handle styling and animation
    // JS can set random delays/durations if needed, but CSS @keyframes are often smoother
    particle.style.left = Math.random() * 100 + "%";
    // Example: if CSS doesn't have varied animation delays/durations via :nth-child
    particle.style.animationDelay = (Math.random() * 5) + "s"; // Adjust as per your CSS
    particle.style.animationDuration = (5 + Math.random() * 5) + "s"; // Adjust
    particlesContainer.appendChild(particle);
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");
  const body = document.body;
  if (loadingScreen) {
    loadingScreen.classList.add("fade-out");
  }
  body.classList.remove("loading"); // Allow main content to be scrollable/interactive

  // Remove from DOM after transition to prevent interference
  setTimeout(() => {
    if (loadingScreen) {
        loadingScreen.style.display = "none"; // Or loadingScreen.remove();
    }
  }, 800); // Match CSS transition duration
}

// Initial calls for loading screen
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createParticles);
} else {
    createParticles(); 
}

window.addEventListener("load", () => {
  // Ensure loading screen stays for a minimum perceptible time
  setTimeout(hideLoadingScreen, 1000); // Reduced from 2000 for faster perceived load
});

// Fallback to hide loading screen if 'load' event is unusually delayed
setTimeout(() => {
  if (document.body.classList.contains("loading")) {
    console.warn("Load event fallback triggered to hide loading screen.");
    hideLoadingScreen(); 
  }
}, 7000); // Increased fallback time

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000' 
  : 'https://cobblebingo-backend-production.up.railway.app';
console.log('Using API Base URL:', API_BASE_URL);

// Global state variables
let currentSessionId = null;
let currentCardCode = null;
let pokemonData = [];
let completedCells = Array(25).fill(false);
let currentBingoCount = 0;

// DOM Element references
let difficultySelect, cardCodeInputElement, mainLoadingSpinner, bingoCardGridElement,
    bingoCardWrapperElement, bingoCardLogoContainerElement, exportButton,
    postGenerationControlsElement, controlsContainerElement, clearButtonElement;

function initializeDOMElements() {
    difficultySelect = document.getElementById("difficulty");
    cardCodeInputElement = document.getElementById("cardCode");
    mainLoadingSpinner = document.getElementById("loadingSpinnerMain");
    bingoCardGridElement = document.getElementById("bingoGrid");
    bingoCardWrapperElement = document.getElementById("bingoCard");
    bingoCardLogoContainerElement = document.getElementById("bingoCardLogoContainer");
    exportButton = document.getElementById("exportBtn");
    postGenerationControlsElement = document.getElementById("postGenerationControls");
    controlsContainerElement = document.querySelector(".controls-container"); // This might be #filters or a wrapper
    clearButtonElement = document.getElementById("clearBtn");

    // Add event listener for the clear button
    if (clearButtonElement) {
        clearButtonElement.addEventListener("click", clearCompleted);
    } else {
        console.warn("Clear button not found.");
    }
     const generateNewButton = document.querySelector("#filters button.generate-new");
    if (generateNewButton) {
        generateNewButton.addEventListener("click", generateNewCard);
    }
    const loadCardButton = document.querySelector("#filters button.load-card");
    if (loadCardButton) {
        loadCardButton.addEventListener("click", generateBingo); // Assuming generateBingo handles loading too
    }

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
      // credentials: 'include', // Only if your backend explicitly requires and handles cookies/auth headers from cross-origin requests
      ...options,
    });

    const responseText = await response.text();
    // console.log(`Response from ${url}: ${response.status}`, responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));


    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status} from ${endpoint}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
        if (errorData.details) errorMessage += ` Details: ${JSON.stringify(errorData.details)}`;
      } catch (parseError) {
        if (responseText.toLowerCase().includes('<html>')) {
          errorMessage = `Server returned HTML instead of JSON for ${endpoint}. Check endpoint or server config.`;
        } else if (responseText) {
          errorMessage = `Server error (non-JSON response) for ${endpoint}: ${responseText.substring(0, 200)}...`;
        }
        // else the default errorMessage is fine
      }
      console.error('API error response full text for', endpoint, ':', responseText);
      throw new Error(errorMessage);
    }

    if (!responseText) { 
        console.log(`API call to ${endpoint} successful with empty response (e.g., 204 No Content).`);
        return {}; 
    }

    try {
      const data = JSON.parse(responseText);
      // console.log('API call successful, data for', endpoint, ':', data);
      return data;
    } catch (parseError) {
      console.error('Failed to parse JSON response from ' + endpoint + ':', parseError, 'Response text was:', responseText);
      throw new Error(`Invalid JSON response from ${endpoint}: ${parseError.message}. Response: ${responseText.substring(0,200)}`);
    }
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error.message);
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection and if the server is running.');
    }
    throw error; // Re-throw other errors
  }
}

// API Test Function
async function testApiConnection() {
  try {
    console.log('Testing API connection to health endpoint...');
    const data = await apiCall('health'); 
    console.log('✅ API connection successful. Health response:', data);
    if (data.status === 'healthy' || data.message === 'API is running') return true; // Adjust based on actual health check response
    return true; // Assume any valid JSON response means connection is okay for now
  } catch (error) {
    console.error('❌ API connection failed during test:', error.message);
    // It's better to show a non-blocking notification if connection fails rather than an alert
    // For instance, a small banner at the top or bottom of the page.
    // alert("Failed to connect to the API server. Some features might not work correctly."); 
    return false;
  }
}

// Card and Session API Functions
async function generateAndStoreCard(selectedPokemon, selectedRarity) {
  try {
    console.log('Generating card with:', { rarity: selectedRarity, pokemonCount: selectedPokemon.length });
    const payload = {
        difficulty: selectedRarity,
        pokemon: selectedPokemon, // This should be an array of 25 Pokemon objects
      };
    // console.log("Payload to generate-card:", JSON.stringify(payload));
    const response = await apiCall("generate-card", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.code) {
      console.error("Server response missing card code:", response);
      throw new Error('Server did not return a card code after generating card.');
    }
    return response.code; 
  } catch (error) {
    console.error("Error generating card on server:", error.message);
    throw new Error(`Failed to generate card on server: ${error.message}`);
  }
}

async function retrieveCard(code) {
  try {
    console.log('Retrieving card with code:', code);
    const response = await apiCall(`get-card/${code}`);
    if (!response.cardData || !response.code) { 
      console.error("Invalid card data received from server:", response)
      throw new Error('Invalid card data or code missing in response from server.');
    }
    // Ensure cardData.pokemon is an array of 25
    if (!Array.isArray(response.cardData.pokemon) || response.cardData.pokemon.length !== 25) {
        console.error("Retrieved card data has invalid pokemon list:", response.cardData.pokemon);
        throw new Error('Retrieved card data has an invalid Pokémon list format or length.');
    }
    return response; 
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
    const response = await apiCall(`validate-code/${code}`); // Backend should return { exists: boolean }
    return response.exists; 
  } catch (error) {
    console.error("Error validating code:", error.message);
    // If validation fails due to network or server error, it's not necessarily that the code "doesn't exist"
    // but rather that we couldn't confirm. For simplicity here, treating errors as "does not exist" for now.
    return false;
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
    if (!response.sessionId || !response.cardCode || !Array.isArray(response.completedCells)) {
      console.error("Server response missing session data:", response);
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
    if (!response.cardCode || !Array.isArray(response.completedCells) || !response.sessionId) {
      console.error("Invalid session data from server:", response);
      throw new Error('Invalid or incomplete session data received from server.');
    }
    console.log('Session data retrieved:', response);
    return response;
  } catch (error) {
    console.error("Error retrieving session data:", error.message);
    if (error.message.includes("404") || error.message.toLowerCase().includes('session not found')) {
        throw new Error(`Session "${sessionId}" not found.`); // Specific error for handling
    }
    throw new Error(`Failed to retrieve session data: ${error.message}`);
  }
}

async function updateSessionCompletedCells(sessionId, cells) {
  try {
    // console.log('Updating completed cells for session ID:', sessionId, 'Cells:', cells.map((c,i)=>c?i:-1).filter(i=>i!==-1))); 
    if (!sessionId) {
        console.warn("No session ID, cannot update completed cells on server.");
        return; // Or throw error if this state is unexpected
    }
    if (!Array.isArray(cells) || cells.length !== 25) {
        console.error("Invalid completedCells array format for update:", cells);
        throw new Error("Invalid format for completed cells array during update.");
    }
    // Note: Server might return 204 No Content, which apiCall handles by returning {}
    await apiCall(`session/${sessionId}/update`, {
      method: "PUT",
      body: JSON.stringify({ completedCells: cells }),
    });
    console.log('Session cells updated successfully on server for session:', sessionId);
  } catch (error) {
    console.error("Error updating session completed cells on server:", error.message);
    // Optionally, inform user non-intrusively that save failed.
    // throw error; // Re-throw if caller needs to handle this
  }
}

// URL Management
function updateUrlWithSession(cardCode, sessionId) {
  if (!cardCode || !sessionId) {
    console.warn("Attempted to update URL without cardCode or sessionId.", {cardCode, sessionId});
    return;
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('code', cardCode);
    url.searchParams.set('sessionid', sessionId);
    // Use replaceState to avoid polluting history too much if not desired
    history.replaceState({ cardCode, sessionId }, '', url.toString());
    // history.pushState({ cardCode, sessionId }, '', url.toString());
    console.log('URL updated:', url.toString());
  } catch (error) {
    console.error('Error updating URL:', error);
  }
}

// Utility Functions
// createSeededRandom is not used in the provided code. If needed, ensure it's robust.
// function createSeededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

async function fetchPokemonData() {
  try {
    const response = await fetch(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlLTA4Oe6Kzu-EQp_AS1wGs_PzLZ9GMIhWrgUDuXux18AYe7sg6B5LfrN0oRw63ZdyTr5rrDvM54ui/pub?output=csv&cachebust=" + new Date().getTime(), // Cache busting
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch Pokemon CSV: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
        console.warn("Parsing errors in Pokemon CSV:", parsed.errors);
        // Decide if any errors are critical. For now, proceed with valid data.
    }

    const data = [];
    const seenNames = new Set(); // To avoid duplicates by name
    parsed.data.forEach((row, rowIndex) => {
      const name = row["Name"]?.trim();
      const id = row["ID"]?.trim().replace(/\D/g, ""); // Ensure ID is numeric string
      const biome = row["Biome"]?.trim() || "Various"; // Default biome
      const rarity = row["Rarity"]?.trim().toLowerCase() || "common"; // Default rarity, ensure lowercase

      if (!name || !id) {
        // console.warn(`Skipping row ${rowIndex + 2} due to missing Name or ID:`, row);
        return;
      }
      if (seenNames.has(name)) {
        // console.warn(`Skipping duplicate Pokémon name: ${name}`);
        return;
      }
      seenNames.add(name);
      data.push({ name, biome, rarity, id });
    });
    console.log(`Fetched and processed ${data.length} unique Pokemon.`);
    if (data.length === 0) {
        throw new Error("No Pokémon data processed from CSV. Check CSV format or content.");
    }
    return data;
  } catch(error) {
    console.error("Fatal Error: Could not fetch or process Pokemon data.", error.message);
    alert("Failed to load essential Pokemon data. The application may not function correctly. Please try refreshing the page or check the data source.");
    return []; 
  }
}

function shuffle(array) {
  const shuffled = [...array]; // Create a new array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
}

function populateFilters() { 
    /* This function is empty. If it's meant to populate biome/rarity filters, 
       it would need access to `pokemonData` and then update the respective select elements.
       Example:
       const biomeSelect = document.getElementById('biomeFilter'); // Assuming an ID
       const rarities = [...new Set(pokemonData.map(p => p.rarity))];
       // then populate these into select options.
    */
   console.log("populateFilters called, but is currently a stub.");
}

function selectPokemonByDifficulty(pokemonList, difficulty) {
  console.log("Selecting Pokémon for difficulty:", difficulty, "from list size:", pokemonList.length);
  if (!pokemonList || pokemonList.length === 0) {
    console.error("Pokemon list is empty. Cannot select by difficulty.");
    // Return a default structure to prevent crashes, clearly marked as error state
    return Array(24).fill({ name: "Load Error", rarity: "common", biome: "Error Biome", id: "ERR" });
  }

  const byRarity = {
    common: pokemonList.filter((p) => p.rarity === "common"),
    uncommon: pokemonList.filter((p) => p.rarity === "uncommon"),
    rare: pokemonList.filter((p) => p.rarity === "rare"),
    "ultra-rare": pokemonList.filter((p) => p.rarity === "ultra-rare" || p.rarity === "ultrarare"), // Allow for variations
    legendary: pokemonList.filter((p) => p.rarity === "legendary"),
  };
  // Log counts for debugging
  // Object.keys(byRarity).forEach(r => console.log(`${r}: ${byRarity[r].length}`));


  let selected = [];
  const fallbackPokemon = { name: "MissingNo.", rarity: "common", biome: "Glitch Zone", id: "000" };

  function selectFromCategory(category, count, excludeList = []) {
    let availableInCategory = byRarity[category] || [];
    // Filter out already selected Pokémon if excludeList is used (e.g., for legendaries)
    availableInCategory = availableInCategory.filter(p => !excludeList.some(ex => ex.name === p.name));

    const selectedFromCat = [];
    const shuffledCategory = shuffle(availableInCategory);

    for (let i = 0; i < count; i++) {
        if (shuffledCategory.length > i) {
            selectedFromCat.push(shuffledCategory[i]);
        } else {
            console.warn(`Not enough Pokémon in category '${category}' (needed ${count}, found ${shuffledCategory.length} available). Using fallback.`);
            selectedFromCat.push(fallbackPokemon);
        }
    }
    return selectedFromCat;
  }
  
  // Difficulty-based selection logic. Target is 24 Pokemon for the grid (excluding FREE space).
  // For "insane", we select 24 + 1 legendary for the center.
  if (difficulty === "easy") { selected = [...selectFromCategory("common", 15), ...selectFromCategory("uncommon", 9)]; } 
  else if (difficulty === "normal") { selected = [...selectFromCategory("common", 2), ...selectFromCategory("uncommon", 8), ...selectFromCategory("rare", 8), ...selectFromCategory("ultra-rare", 6)]; } 
  else if (difficulty === "hard") { selected = [...selectFromCategory("rare", 15), ...selectFromCategory("ultra-rare", 9)];} 
  else if (difficulty === "common") { selected = selectFromCategory("common", 24); } 
  else if (difficulty === "uncommon") { selected = selectFromCategory("uncommon", 24); } 
  else if (difficulty === "rare") { selected = selectFromCategory("rare", 24); } 
  else if (difficulty === "ultra-rare") { selected = selectFromCategory("ultra-rare", 24); } 
  else if (difficulty === "insane") { 
    // For insane, we pick 24 ultra-rares, then one distinct legendary for the center
    selected = selectFromCategory("ultra-rare", 24);
    const legendaryPool = shuffle(byRarity["legendary"] || []);
    const legendaryForCenter = legendaryPool.length > 0 ? legendaryPool[0] : {...fallbackPokemon, name: "LEGENDARY F L", rarity: "legendary"};
    // This function now returns 24 (or 25 if insane, where the 25th is the legendary)
    // The generateBingo will handle placing the legendary or FREE space.
    // So for insane, we actually need 25.
    // Let's re-think: selectPokemonByDifficulty should return the 25 items for the board.
    // If insane, the center IS the legendary. Otherwise, center is FREE.
    
    // If insane: select 24 ultra-rare, and 1 legendary. The legendary will be put in center by generateBingo.
    const ultraRaresForInsane = selectFromCategory("ultra-rare", 24);
    const legendaryForInsane = selectFromCategory("legendary", 1, ultraRaresForInsane)[0]; // Select 1, ensuring it's not in the ultra-rares
    selected = [...ultraRaresForInsane]; // Start with 24
    // The calling function (generateBingo) will place the legendary at index 12 for "insane"
    // So, this function should return 24, and the special legendary separately, or a list of 25.
    // Let's make it return the list of 25 items for the grid directly.
    
    // New "insane" logic: 24 ultra-rares, 1 legendary. This function will return them.
    // The `generateBingo` will use this list. For "insane", it takes all 25.
    // For other difficulties, it takes 24 and adds "Free Space".
    const insaneSelection = [...selectFromCategory("ultra-rare", 24)];
    const insaneLegendary = selectFromCategory("legendary", 1, insaneSelection)[0]; // Pass current selection to avoid duplicates
    if (insaneLegendary === fallbackPokemon && (byRarity.legendary && byRarity.legendary.length > 0)) {
        // if fallback was chosen but legendaries exist, it means all were in the main 24. This is unlikely with good data.
        console.warn("Insane mode: Fallback legendary chosen despite available legendaries. Possible duplicate issue or small pool.");
    }
    selected = insaneSelection; // these are 24
    // The generateBingo will insert the legendary for insane. So this function should return 24 for insane too.
    // OR, this function should return all 25 grid items. Let's go with returning 25 grid items.

    selected = selectFromCategory("ultra-rare", 24); // Start with 24 ultra-rares
    let centerLegendary = selectFromCategory("legendary", 1, selected)[0]; // Pick one legendary not in the 24
    // We need a list of 25.
    const finalInsaneList = [...selected]; // 24 ultra-rares
    finalInsaneList.splice(12, 0, centerLegendary); // Insert legendary at the center.
    selected = finalInsaneList; // Now selected has 25 items.

  } else { // Default to normal if difficulty is unknown
    console.warn("Unknown difficulty provided:", difficulty, ". Defaulting to normal.");
    selected = [...selectFromCategory("common", 2), ...selectFromCategory("uncommon", 8), ...selectFromCategory("rare", 8), ...selectFromCategory("ultra-rare", 6)];
  }

  // Ensure correct length
  const targetLength = (difficulty === "insane") ? 25 : 24; // Insane needs 25 for the legendary center, others 24 for FREE space.

  if (selected.length !== targetLength) {
    console.warn(`Selected Pokémon count (${selected.length}) for difficulty '${difficulty}' does not match target (${targetLength}). Adjusting...`);
    while (selected.length < targetLength) {
      // Try to pad with common, then uncommon, etc., or just fallback
      const paddingPokemon = selectFromCategory("common", 1, selected)[0] || fallbackPokemon;
      selected.push(paddingPokemon);
    }
    if (selected.length > targetLength) {
      selected = selected.slice(0, targetLength);
    }
  }
  
  console.log(`Final selected Pokémon for difficulty '${difficulty}': ${selected.length} items.`, selected.map(p=>p.name).join(', '));
  return selected; // Returns 24 for standard, 25 for insane (with legendary embedded)
}


function setupColorSchemeSelector() {
  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach((option) => {
    option.addEventListener("click", () => {
      colorOptions.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
      
      const themeToSet = option.dataset.theme;

      // Remove any existing theme- prefixed classes from body
      const bodyClasses = Array.from(document.body.classList);
      bodyClasses.forEach(className => {
        if (className.startsWith('theme-')) {
          document.body.classList.remove(className);
        }
      });

      // Add the new theme class to body
      if (themeToSet) {
        document.body.classList.add(`theme-${themeToSet}`);
        console.log(`Theme changed to: theme-${themeToSet}`);
      } else {
        console.warn("No theme specified for color option:", option);
        // Optionally, revert to a default theme if themeToSet is undefined/empty
        // document.body.classList.add('theme-default'); 
      }
    });
  });

  // Set initial theme based on HTML, or default to first option
  let initialThemeSet = false;
  const activeOption = document.querySelector(".color-option.active");
  if (activeOption) {
      const initialTheme = activeOption.dataset.theme;
      if (initialTheme) {
        document.body.classList.add(`theme-${initialTheme}`);
        initialThemeSet = true;
        console.log(`Initial theme set from active HTML: theme-${initialTheme}`);
      }
  }
  
  if (!initialThemeSet) {
      const firstOption = document.querySelector(".color-option");
      if (firstOption) {
          firstOption.classList.add("active");
          const defaultTheme = firstOption.dataset.theme;
          if (defaultTheme) {
            document.body.classList.add(`theme-${defaultTheme}`);
            console.log(`Initial theme set to default (first option): theme-${defaultTheme}`);
          }
      } else {
          console.warn("No color options found to set an initial theme.");
          // Fallback to a hardcoded default if no options exist at all
          // document.body.classList.add('theme-default'); 
      }
  }
}


function openPokemonPage(pokemonName) {
  if (!pokemonName || typeof pokemonName !== 'string') {
    console.warn("Invalid Pokemon name for wiki link:", pokemonName);
    return;
  }
  // Format name for Cobblemon Wiki (e.g., "Mr. Mime" -> "mr._mime", "Nidoran♀" -> "nidoran♀")
  const formattedName = pokemonName.toLowerCase()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_♀♂.-]/g, ""); // Remove special characters except gender symbols, dot, hyphen

  const url = `https://cobblemon.tools/pokedex/pokemon/${formattedName}`;
  window.open(url, "_blank");
}

async function imageToBase64(imgElement) {
  return new Promise((resolve) => {
    if (!imgElement || !imgElement.src || imgElement.src === "" ) {
        // console.warn("Image element or src is invalid for base64 conversion.", imgElement);
        resolve(""); // Resolve with empty if no src
        return;
    }
    if (imgElement.src.startsWith("data:")) {
        resolve(imgElement.src); // Already base64
        return;
    }

    // Create a new Image object to handle loading, helps with CORS and tainted canvas
    const image = new Image();
    image.crossOrigin = "Anonymous"; // Attempt to prevent tainted canvas
    
    image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const ctx = canvas.getContext("2d");
        try {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        } catch (error) {
            console.warn("Could not convert image to base64 (canvas draw error):", error, image.src);
            resolve(""); // Resolve with empty string on error
        }
    };
    image.onerror = () => {
        console.warn("Image failed to load for base64 conversion:", imgElement.src);
        resolve(""); // Resolve with empty string on error
    };
    image.src = imgElement.src; // Set src to trigger loading
  });
}


// Core Bingo Logic Functions
async function generateBingo() {
  // Ensure DOM elements are ready (though initializeDOMElements should have run)
  if (!difficultySelect || !cardCodeInputElement || !mainLoadingSpinner || !bingoCardGridElement ||
      !bingoCardWrapperElement || !bingoCardLogoContainerElement || !exportButton ||
      !postGenerationControlsElement || !controlsContainerElement) {
      console.error("Critical DOM elements missing. Re-initializing or refresh needed.");
      initializeDOMElements(); // Try to re-initialize just in case
      // Add a more robust check after re-init if necessary
      if (!bingoCardGridElement) { // Example check
        alert("Error: UI elements are still missing. Please refresh the page.");
        return;
      }
  }

  const selectedDifficulty = difficultySelect.value;
  const cardCodeInputVal = cardCodeInputElement.value.trim().toUpperCase();

  // UI updates for loading state
  mainLoadingSpinner.style.display = "flex";
  bingoCardWrapperElement.style.display = "none";
  bingoCardLogoContainerElement.style.display = "none";
  exportButton.style.display = "none";
  postGenerationControlsElement.style.display = "none";
  // controlsContainerElement.style.display = "none"; // Decide if filters should hide

  bingoCardGridElement.innerHTML = ""; // Clear previous grid
  cleanupTooltips(); // Clean up any stray tooltips
  document.querySelectorAll(".bingo-line, .bingo-message").forEach(el => el.remove());
  currentBingoCount = 0; // Reset bingo count

  await new Promise((resolve) => setTimeout(resolve, 100)); // Brief pause for UI to update

  let cardDataFromServer;
  let sessionDataFromServer;
  let effectiveCardCode = null;
  let effectiveSessionId = null;

  const urlParams = new URLSearchParams(window.location.search);
  const urlCode = urlParams.get("code")?.toUpperCase();
  const urlSessionId = urlParams.get("sessionid");

  try {
    if (cardCodeInputVal) { // User entered a code
      effectiveCardCode = cardCodeInputVal;
      // If URL has a session ID for *this specific code*, use it. Otherwise, new session for this code.
      if (urlSessionId && urlCode === effectiveCardCode) {
        effectiveSessionId = urlSessionId;
      }
    } else if (urlCode) { // Code from URL, no user input
      effectiveCardCode = urlCode;
      effectiveSessionId = urlSessionId; // Use session from URL if code also from URL
    }

    if (effectiveCardCode) {
      console.log(`Attempting to load card: ${effectiveCardCode}`);
      cardDataFromServer = await retrieveCard(effectiveCardCode);
      currentCardCode = cardDataFromServer.code; // Use code from server response for consistency
      cardCodeInputElement.value = currentCardCode; // Update input field
      if (cardDataFromServer.cardData.difficulty) {
        difficultySelect.value = cardDataFromServer.cardData.difficulty;
      }

      if (effectiveSessionId) {
        console.log(`Attempting to load session: ${effectiveSessionId} for card: ${currentCardCode}`);
        try {
          sessionDataFromServer = await getSessionData(effectiveSessionId);
          // Validate session belongs to the current card
          if (sessionDataFromServer.cardCode !== currentCardCode) {
            console.warn(`Session ${effectiveSessionId} is for a different card (${sessionDataFromServer.cardCode}). Initializing new session for ${currentCardCode}.`);
            sessionDataFromServer = null; // Discard mismatched session data
            currentSessionId = null; // Reset session ID
          } else {
            currentSessionId = sessionDataFromServer.sessionId; // Use valid session
          }
        } catch (sessionError) {
          console.warn(`Failed to load session ${effectiveSessionId} (error: ${sessionError.message}). Initializing new session.`);
          sessionDataFromServer = null; currentSessionId = null;
        }
      }
      // If no valid session ID by now (either not provided, mismatched, or failed to load), initialize new one
      if (!currentSessionId && currentCardCode) {
        console.log(`No valid session for card ${currentCardCode}, or initializing after mismatch. Creating new session.`);
        sessionDataFromServer = await initializeSession(currentCardCode);
        currentSessionId = sessionDataFromServer.sessionId;
      }
    } else { // No code input, no URL code: Generate a new card
      console.log("Generating new card for difficulty:", selectedDifficulty);
      cardCodeInputElement.value = ""; // Clear input field
      history.replaceState(null, '', window.location.pathname + (window.location.hash || '')); // Clear query params

      if (pokemonData.length === 0) {
        throw new Error("Pokemon data not loaded. Cannot generate new card.");
      }
      
      // `selectPokemonByDifficulty` returns 24 for normal difficulties, 25 for insane (legendary embedded)
      let pokemonForGrid = selectPokemonByDifficulty(pokemonData, selectedDifficulty);
      let finalPokemonSelectionForCardObject = []; // This will always be 25 for the card object

      if (selectedDifficulty === "insane") {
          if (pokemonForGrid.length !== 25) throw new Error("Insane difficulty selection failed to return 25 Pokemon.");
          finalPokemonSelectionForCardObject = pokemonForGrid; // Already has legendary at center
      } else {
          // Standard difficulties: pokemonForGrid has 24 items. Add "Free Space".
          if (pokemonForGrid.length !== 24) throw new Error(`Expected 24 Pokemon for ${selectedDifficulty}, got ${pokemonForGrid.length}.`);
          const shuffledForGrid = shuffle(pokemonForGrid); // Shuffle the 24
          finalPokemonSelectionForCardObject = [];
          for (let i = 0; i < 25; i++) {
            if (i === 12) { // Center position
              finalPokemonSelectionForCardObject.push({ name: "Free Space", rarity: "free", biome: "", id: "FREE" });
            } else {
              finalPokemonSelectionForCardObject.push(shuffledForGrid[i < 12 ? i : i - 1]);
            }
          }
      }
      
      if (finalPokemonSelectionForCardObject.length !== 25) {
          throw new Error(`Internal error: Final Pokemon selection for card object is not 25 (count: ${finalPokemonSelectionForCardObject.length}).`);
      }

      const newCardCode = await generateAndStoreCard(finalPokemonSelectionForCardObject, selectedDifficulty);
      currentCardCode = newCardCode;
      cardCodeInputElement.value = currentCardCode;
      // Mock cardDataFromServer for new card to avoid another fetch
      cardDataFromServer = { 
        code: currentCardCode, 
        cardData: { pokemon: finalPokemonSelectionForCardObject, difficulty: selectedDifficulty },
        // Other fields like createdAt, usageCount, lastAccessed would be set by backend
      };

      if (!currentCardCode) throw new Error("New card code is unexpectedly missing after generation and storage.");
      console.log(`New card ${currentCardCode} generated. Initializing session.`);
      sessionDataFromServer = await initializeSession(currentCardCode);
      currentSessionId = sessionDataFromServer.sessionId;
    }

    if (!currentCardCode || !currentSessionId) {
      throw new Error("Critical error: Card code or session ID is missing after processing.");
    }
    updateUrlWithSession(currentCardCode, currentSessionId);
    document.body.setAttribute("data-generated", "true"); // For CSS hooks if needed

    // Initialize completedCells array for the current card
    completedCells = Array(25).fill(false); 
    
    if (sessionDataFromServer && sessionDataFromServer.cardCode === currentCardCode && Array.isArray(sessionDataFromServer.completedCells)) {
      if (sessionDataFromServer.completedCells.length === 25) {
        completedCells = [...sessionDataFromServer.completedCells];
        console.log("Applying session data for completedCells. True indices:", completedCells.map((c, i) => c ? i : -1).filter(i => i !== -1).join(', '));
      } else {
        console.warn("Session data for completedCells has incorrect length. Ignoring.");
      }
    } else {
      // New card or no valid session: set default completion for FREE space
      const centerPokemonDetails = cardDataFromServer.cardData.pokemon[12];
      if (centerPokemonDetails && centerPokemonDetails.name === "Free Space" && centerPokemonDetails.rarity !== "legendary") { // Standard Free Space
        if (completedCells.length === 25) {
            completedCells[12] = true; 
            console.log("Standard FREE space (index 12) auto-marked as completed in local array.");
        }
      }
      // For legendary center on a new "insane" card, it starts uncompleted.
    }
    
    // console.log("Pokemon list for rendering:", cardDataFromServer.cardData.pokemon.map(p=>p.name));
    // console.log("Initial completedCells state for rendering (true indices):", completedCells.map((c, i) => c ? i : -1).filter(i => i !== -1));
    
    await renderBingoCard(cardDataFromServer.cardData.pokemon, completedCells);
    checkForBingo(); // Check for any initial bingos (e.g., if loading a partially completed card)

  } catch (error) {
    console.error("Error in generateBingo main flow:", error.message, error.stack);
    alert(`Operation failed: ${error.message}. Please try again or check console for details.`);
    // Reset UI to a safe state
    mainLoadingSpinner.style.display = "none";
    if(controlsContainerElement) controlsContainerElement.style.display = "flex"; // Show filters again
    bingoCardWrapperElement.style.display = "none";
    currentSessionId = null; currentCardCode = null; // Reset state
    // Potentially clear URL params if generation failed completely?
    // history.replaceState(null, '', window.location.pathname + (window.location.hash || ''));
    return;
  }

  // UI updates for successful generation/load
  mainLoadingSpinner.style.display = "none";
  bingoCardWrapperElement.style.display = "flex";
  if(bingoCardLogoContainerElement) bingoCardLogoContainerElement.style.display = "block";
  if(exportButton) exportButton.style.display = "inline-block";
  if(postGenerationControlsElement) postGenerationControlsElement.style.display = "inline-flex"; // Or flex
  if(controlsContainerElement) controlsContainerElement.style.display = "flex";
}

function generateNewCard() {
  if (cardCodeInputElement) cardCodeInputElement.value = ""; // Clear the code input
  // currentSessionId = null; // Will be reset by generateBingo
  // currentCardCode = null;  // Will be reset by generateBingo
  // No need to clear URL here, generateBingo will do it if it generates a new card.
  document.body.removeAttribute("data-generated");
  // Hide current card display elements before generating new one
  if (bingoCardWrapperElement) bingoCardWrapperElement.style.display = "none";
  if (postGenerationControlsElement) postGenerationControlsElement.style.display = "none";
  if (exportButton) exportButton.style.display = "none";

  generateBingo(); // This will now handle logic for new card generation
}

async function renderBingoCard(pokemonListForGrid, initialCompletedStateArray) {
  if (!bingoCardGridElement) {
    console.error("Bingo grid element not found for rendering.");
    return;
  }
  bingoCardGridElement.innerHTML = ""; // Clear previous content
  const imageLoadPromises = []; // For preloading images if desired (more complex)

  if (!Array.isArray(pokemonListForGrid) || pokemonListForGrid.length !== 25) {
    console.error("Invalid pokemonListForGrid for rendering. Expected array of 25.", pokemonListForGrid);
    bingoCardGridElement.textContent = "Error: Could not load card data properly.";
    return;
  }

  pokemonListForGrid.forEach((pokemon, index) => {
    const cell = document.createElement("div");
    cell.className = "bingo-cell";
    const pokemonName = pokemon.name || "Unknown";
    const pokemonId = pokemon.id || "0"; // Used for image URLs

    // Cell type determination
    let isLegendaryCenter = false;
    let isStandardFreeSpace = false;

    if (index === 12) { // Center cell
      if (pokemon.rarity?.toLowerCase() === "legendary") {
        isLegendaryCenter = true;
        cell.classList.add("legendary-center");
      } else if (pokemon.name === "Free Space" || pokemon.id === "FREE") {
        isStandardFreeSpace = true;
        cell.classList.add("free-space-cell");
        cell.textContent = "FREE"; 
      }
    }
    
    // Apply .completed class from the state array
    if (initialCompletedStateArray && initialCompletedStateArray[index]) {
      cell.classList.add("completed");
      // If it's a legendary center and marked completed in the array, add visual checkmark
      if (isLegendaryCenter) {
        const checkmark = document.createElement("div");
        checkmark.className = "manual-checkmark"; // Style this in CSS
        checkmark.innerHTML = "✓";
        // checkmark.style.cssText = `...`; // Inline styles removed, prefer CSS
        cell.appendChild(checkmark);
      }
    }

    // Event listeners and content (excluding text for FREE space already set)
    if (isLegendaryCenter) {
      cell.style.cursor = "pointer";
      cell.addEventListener("click", () => toggleCellCompletion(index));
      setupTooltipEvents(cell, () => `Legendary: ${pokemonName}\nBiome: ${pokemon.biome || 'Various'}\nRarity: ${pokemon.rarity || 'Legendary'}`, true);
    } else if (!isStandardFreeSpace) { // Regular Pokemon cells
      cell.style.cursor = "pointer";
      cell.addEventListener("click", () => toggleCellCompletion(index));
      setupTooltipEvents(cell, () => `${pokemonName}\nBiome: ${pokemon.biome || 'N/A'}\nRarity: ${pokemon.rarity || 'N/A'}`, false);
    } else if (isStandardFreeSpace) {
        cell.style.cursor = "default"; // Free space is not clickable to un-toggle
    }

    // Add images, names, rarity badges (for non-standard-FREE-space, or for legendary center)
    if (!isStandardFreeSpace || isLegendaryCenter) { // Render content for legendaries and normal Pokemon
        const wrapper = document.createElement("div"); 
        wrapper.className = "image-wrapper";
        
        const img = document.createElement("img"); 
        img.alt = pokemonName; 
        img.className = "pokemon-img";
        img.crossOrigin = "anonymous"; // For html2canvas

        // Simplified image source logic (ensure paths are correct)
        // Prefer Cobbledex, fallback to PokeAPI, then placeholder.
        const formattedNameForUrl = pokemonName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_♀♂.-]/g, "");
        const cobblemonImageUrl = `https://cobbledex.b-cdn.net/mons/large/${formattedNameForUrl}.webp`;
        const pokeApiImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
        const placeholderImageUrl = `./assets/pokeball_placeholder.png`; // Local placeholder

        img.src = cobblemonImageUrl; // Start with Cobbledex
        
        let sourcesTried = 0;
        img.onerror = function() {
            sourcesTried++;
            if (sourcesTried === 1 && pokemonId !== "0" && pokemonId !== "FREE" && pokemonId !== "ERR" ) { // pokemonId is valid string for PokeAPI
                img.src = pokeApiImageUrl;
            } else if (sourcesTried === 2) {
                img.src = placeholderImageUrl; // Fallback to local placeholder
                // console.warn(`Image not found for ${pokemonName} (ID: ${pokemonId}) after trying Cobbledex and PokeAPI. Using placeholder.`);
            } else if (sourcesTried > 2) {
                img.alt = `${pokemonName} (Image unavailable)`;
                img.onerror = null; // Prevent infinite loop if placeholder also fails
            }
        };
        
        // Preloading logic could be added here with imageLoadPromises if performance is an issue
        // const loadPromise = new Promise(resolve => { img.onload = resolve; img.onerror = () => { /* handle error */ resolve();};});
        // imageLoadPromises.push(loadPromise);

        wrapper.appendChild(img); 
        cell.appendChild(wrapper);
        
        const label = document.createElement("div"); 
        label.className = "pokemon-name"; 
        label.textContent = pokemonName; 
        cell.appendChild(label);

        if (pokemon.rarity && pokemon.rarity.toLowerCase() !== "free") { 
            const rarityBadge = document.createElement("div"); 
            const rarityClass = pokemon.rarity.toLowerCase().replace(/\s+/g, "-"); 
            rarityBadge.className = `rarity-badge ${rarityClass}`; 
            rarityBadge.textContent = pokemon.rarity.charAt(0).toUpperCase() + pokemon.rarity.slice(1); 
            cell.appendChild(rarityBadge); 
        }
    }
    bingoCardGridElement.appendChild(cell);
  });

  // await Promise.all(imageLoadPromises).catch(err => console.warn("Some images failed to load during render:", err));
  // Add a small delay if needed for images to start rendering before other operations
  await new Promise((resolve) => setTimeout(resolve, 100)); 
}


document.addEventListener("DOMContentLoaded", () => {
  initializeDOMElements(); 
  setupColorSchemeSelector();
  // createEnhancedParticles(); // If this is for a persistent background, call it here. Original was createParticles for loading.
  // The loading screen's createParticles is called earlier.

  testApiConnection().then(connected => {
    if (!connected) { 
        console.warn("API connection test failed on DOMContentLoaded. Some features might be impaired.");
        // Optionally display a non-blocking warning to the user
    }
  });

  fetchPokemonData().then((data) => {
    pokemonData = data;
    if (pokemonData.length > 0) {
        populateFilters(); // Call even if empty, it might be filled later
        
        const urlParams = new URLSearchParams(window.location.search);
        const codeFromUrl = urlParams.get("code");
        const sessionIdFromUrl = urlParams.get("sessionid"); // Also check for session

        if (codeFromUrl && cardCodeInputElement) { // Only auto-load if code is present
          cardCodeInputElement.value = codeFromUrl.toUpperCase(); // Populate field
          console.log("Code and/or session found in URL, attempting to auto-load card and session.");
          generateBingo(); // This will use the code from input/URL and session from URL
        } else {
          // No code in URL, normal page load, hide loading screen if not already handled by window.load
          setTimeout(() => {
              if (document.body.classList.contains("loading")) hideLoadingScreen();
          }, 500); // Short delay
        }
    } else {
        console.error("Pokemon data is empty after fetching. Cannot proceed with bingo generation.");
        alert("Failed to load any Pokemon data. The bingo card cannot be generated. Please check the data source or refresh.");
        hideLoadingScreen(); // Ensure loading screen doesn't stick
    }
  }).catch(error => {
    console.error("Failed to fetch initial Pokemon data on DOMContentLoaded:", error.message);
    alert("Critical error: Could not load Pokemon data. Bingo functionality will be unavailable. Please refresh the page to try again.");
    hideLoadingScreen(); 
  });
});

function drawBingoLine(cellIndices, lineType) { 
    const grid = bingoCardGridElement; 
    if(!grid) return; 
    const line = document.createElement("div"); 
    line.className = `bingo-line ${lineType}`; 
    // Basic positioning; refined in CSS, especially for diagonals
    if (lineType === "horizontal") { 
        const row = Math.floor(cellIndices[0] / 5); 
        // Adjustments based on cell size (130px height + 10px gap) and line thickness (6px)
        line.style.top = `${row * (130 + 10) + (130/2) - 3}px`; 
    } else if (lineType === "vertical") { 
        const col = cellIndices[0] % 5; 
        // Adjustments based on cell size (100px width + 10px gap) and line thickness (6px)
        line.style.left = `${col * (100 + 10) + (100/2) - 3}px`; 
    } 
    // Diagonal lines are typically harder with just top/left and rely more on transform in CSS
    grid.appendChild(line); 
}
function showBingoMessage(count) { 
    const existingMessage = document.querySelector(".bingo-message"); 
    if (existingMessage) existingMessage.remove(); 
    
    const message = document.createElement("div"); 
    message.className = "bingo-message"; 
    message.textContent = count === 1 ? "🎉 BINGO! 🎉" : `🎉 ${count} BINGOS! 🎉`; 
    document.body.appendChild(message); 
    
    // Animation for message appearance and disappearance can be handled by CSS
    setTimeout(() => message.remove(), 4000); // Remove after 4 seconds
}

function checkForBingo() {
  if (!bingoCardGridElement || completedCells.length !== 25) {
    // console.warn("Cannot check for bingo: Grid not ready or completedCells invalid.");
    return 0;
  }
  // Remove previous lines
  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());

  const lines = [ 
    /* Rows */ 
    { indices: [0, 1, 2, 3, 4], type: "horizontal" }, { indices: [5, 6, 7, 8, 9], type: "horizontal" }, 
    { indices: [10, 11, 12, 13, 14], type: "horizontal" }, { indices: [15, 16, 17, 18, 19], type: "horizontal" }, 
    { indices: [20, 21, 22, 23, 24], type: "horizontal" }, 
    /* Columns */ 
    { indices: [0, 5, 10, 15, 20], type: "vertical" }, { indices: [1, 6, 11, 16, 21], type: "vertical" }, 
    { indices: [2, 7, 12, 17, 22], type: "vertical" }, { indices: [3, 8, 13, 18, 23], type: "vertical" }, 
    { indices: [4, 9, 14, 19, 24], type: "vertical" }, 
    /* Diagonals */ 
    { indices: [0, 6, 12, 18, 24], type: "diagonal-main" }, { indices: [4, 8, 12, 16, 20], type: "diagonal-anti" }, 
  ];
  let newBingoCount = 0;
  lines.forEach((line) => { 
    if (line.indices.every((index) => completedCells[index])) { 
      newBingoCount++; 
      drawBingoLine(line.indices, line.type); 
    } 
  });

  if (newBingoCount > 0 && newBingoCount > currentBingoCount) { // Only show message for NEW bingos or increased count
    if (bingoCardGridElement) bingoCardGridElement.classList.add("bingo-celebration");
    setTimeout(() => {
        if(bingoCardGridElement) bingoCardGridElement.classList.remove("bingo-celebration");
    }, 3000); // Duration of celebration animation
    showBingoMessage(newBingoCount);
    console.log(`BINGO! ${newBingoCount} line(s) completed!`);
  } else if (newBingoCount === 0 && currentBingoCount > 0) {
    // Lost a bingo (e.g. by unchecking a cell)
    console.log("Lost a bingo condition.");
  }
  
  currentBingoCount = newBingoCount; // Update global count
  return newBingoCount;
}

function toggleCellCompletion(index) {
  const cells = bingoCardGridElement ? bingoCardGridElement.querySelectorAll(".bingo-cell") : [];
  if (!cells || !cells[index] || index < 0 || index >= 25) {
    console.warn("Invalid cell index for toggle:", index);
    return;
  }
  const cell = cells[index];

  // Prevent un-toggling the standard "FREE" space if it's marked as completed by default
  const isStandardFreeSpace = cell.classList.contains("free-space-cell") && !cell.classList.contains("legendary-center");
  if (isStandardFreeSpace && completedCells[index]) {
    // This check means if the FREE space was initially completed, it can't be un-toggled.
    // If you want to allow un-toggling a FREE space that was set by loading a session, remove this block.
    // However, standard FREE space is usually fixed.
    // The generateBingo logic already sets completedCells[12]=true for standard free space.
    console.log("Standard FREE space cannot be un-toggled once completed by default.");
    return; 
  }

  // Toggle the state in the array
  completedCells[index] = !completedCells[index];
  // Toggle the visual class on the DOM element
  cell.classList.toggle("completed", completedCells[index]);

  // Specific handling for legendary center's manual checkmark
  if (cell.classList.contains("legendary-center")) {
    const existingCheckmark = cell.querySelector(".manual-checkmark");
    if (completedCells[index] && !existingCheckmark) { // If completed and no checkmark, add one
      const checkmark = document.createElement("div");
      checkmark.className = "manual-checkmark"; 
      checkmark.innerHTML = "✓";
      // checkmark.style.cssText = `...`; // Prefer CSS for styling
      cell.appendChild(checkmark);
    } else if (!completedCells[index] && existingCheckmark) { // If not completed and checkmark exists, remove it
      existingCheckmark.remove();
    }
  }
  
  // Optional: Add a small visual feedback animation
  cell.style.transform = "scale(0.95)"; 
  setTimeout(() => { cell.style.transform = ""; }, 150);

  // Check for bingo conditions after a short delay to allow UI to update
  setTimeout(checkForBingo, 10); // Reduced delay

  // Update session on server if session ID exists
  if (currentSessionId) {
    updateSessionCompletedCells(currentSessionId, completedCells)
      .catch(err => console.warn("Failed to save completion state to server:", err.message)); // Non-blocking error
  }
}


if(exportButton) {
    exportButton.addEventListener("click", async () => {
      const cardToExport = bingoCardWrapperElement; 
      if (!cardToExport || cardToExport.style.display === 'none') {
        alert("No bingo card to export. Please generate or load a card first."); return;
      }
      const originalButtonText = exportButton.textContent;
      exportButton.textContent = "Exporting..."; exportButton.disabled = true;
      
      try {
        // Ensure all images are loaded and converted to base64 to embed them in the canvas
        const images = Array.from(cardToExport.querySelectorAll("img.pokemon-img"));
        await Promise.all(images.map(async (img) => {
            if (img.src && !img.src.startsWith("data:")) { // Only convert if not already base64
                const base64Src = await imageToBase64(img);
                if (base64Src) {
                    img.src = base64Src;
                } else {
                    console.warn("Failed to convert an image to base64 for export:", img.alt);
                    // Optionally, replace with a placeholder or leave as is if html2canvas can handle external URLs (with CORS)
                }
            }
        }));

        await new Promise(r => setTimeout(r, 300)); // Small delay for images to re-render if src changed

        const canvas = await html2canvas(cardToExport, {
            useCORS: true, // Important for external images if not all converted to base64
            allowTaint: true, // May be needed if CORS fails for some images
            scale: 2, // Higher resolution export
            backgroundColor: null, // Use element's background or make transparent if styled so
            logging: false, // Set to true for debugging html2canvas
            onclone: (clonedDoc) => { // Modify the cloned document before rendering
                const clonedCard = clonedDoc.getElementById("bingoCard"); 
                if (clonedCard) {
                    // Ensure styles that might interfere with capture are reset or adjusted
                    clonedCard.style.margin = "0"; 
                    clonedCard.style.boxShadow = "none";
                    // Example: Ensure background of the cloned body is what you want if card is transparent
                    // clonedDoc.body.style.backgroundColor = '#0a0a0a'; // Or your theme's bg
                }
            }
        });
        const link = document.createElement("a");
        link.download = `cobblemon_bingo_card_${currentCardCode || Date.now()}.png`;
        link.href = canvas.toDataURL("image/png", 1.0); // Opaque PNG
        link.click();
      } catch (error) {
        console.error("Error exporting card:", error); 
        alert("Error exporting card. Please check the console for details and try again. Ensure all images are accessible.");
      } finally {
        exportButton.textContent = originalButtonText; 
        exportButton.disabled = false;
        // Optionally, revert images from base64 if they were changed, though usually not necessary
        // renderBingoCard(cardDataFromServer.cardData.pokemon, completedCells); // Re-render to restore original image srcs
      }
    });
} else {
    console.warn("Export button not found during initial setup.");
}

function clearCompleted() {
  if (completedCells.every(c => c === false)) { // If already all false (except potential FREE space)
    // Check if FREE space is the only thing completed.
    let onlyFreeSpaceCompleted = true;
    for(let i=0; i<25; i++) {
        if (i === 12 && cardDataFromServer?.cardData?.pokemon[12]?.name === "Free Space") {
            if (!completedCells[i]) onlyFreeSpaceCompleted = false; // FREE not completed
        } else {
            if (completedCells[i]) onlyFreeSpaceCompleted = false; // Other cell completed
        }
    }
    if(onlyFreeSpaceCompleted && completedCells[12]) {
        console.log("Board already effectively cleared or only FREE space is marked.");
        return;
    }
  }


  completedCells = Array(25).fill(false);
  currentBingoCount = 0; // Reset bingo count

  const cells = bingoCardGridElement ? bingoCardGridElement.querySelectorAll(".bingo-cell") : [];
  cells.forEach((cell, index) => {
    cell.classList.remove("completed");
    const existingCheckmark = cell.querySelector(".manual-checkmark");
    if (existingCheckmark) existingCheckmark.remove();

    // Re-complete the standard FREE space if it exists and isn't legendary
    const pokemonForCell = cardDataFromServer?.cardData?.pokemon[index];
    if (index === 12 && pokemonForCell && pokemonForCell.name === "Free Space" && pokemonForCell.rarity?.toLowerCase() !== "legendary") {
      completedCells[index] = true;
      cell.classList.add("completed"); // Visually mark FREE space as completed again
      // Note: The CSS for .free-space-cell.completed should define its look.
    }
  });

  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());
  if(bingoCardGridElement) bingoCardGridElement.classList.remove("bingo-celebration");
  const existingMessage = document.querySelector(".bingo-message");
  if (existingMessage) existingMessage.remove();
  
  checkForBingo(); // Re-check, should result in 0 bingos unless free space itself forms one (unlikely)

  if (currentSessionId) {
    updateSessionCompletedCells(currentSessionId, completedCells)
      .catch(err => console.warn("Failed to save cleared state to server:", err.message));
  }
  console.log("Bingo board completions cleared.");
}


function cleanupTooltips() { 
    removeActiveTooltip(); 
    document.querySelectorAll(".tooltip, .legendary-tooltip").forEach((tooltip) => tooltip.remove()); 
    // If cells store a cleanup function for their tooltips:
    const bingoCells = bingoCardGridElement ? bingoCardGridElement.querySelectorAll(".bingo-cell") : [];
    bingoCells.forEach((cell) => { 
        if (typeof cell.tooltipCleanup === 'function') {
            cell.tooltipCleanup(); 
        }
    }); 
}

// Background particles - if this is desired for the main page, not just loading screen
function createEnhancedBackgroundParticles() { 
    const bgParticlesContainer = document.getElementById('background-particles'); // Assume a dedicated container
    if (!bgParticlesContainer) return;
    
    // Limit particle creation to avoid performance issues if called too often
    if (bgParticlesContainer.children.length > 30) return; // Example limit

    bgParticlesContainer.innerHTML = ''; // Clear existing if you want to refresh them
    for (let i = 0; i < 15; i++) { // Adjust count as needed
        const particle = document.createElement('div');
        particle.className = 'background-particle'; // Use a distinct class
        // Styles like left, animation-delay, animation-duration should be in CSS for .background-particle
        // Or set randomly here if dynamic behavior is complex
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = `-${Math.random() * 10}s`; 
        particle.style.animationDuration = `${8 + Math.random() * 7}s`;
        bgParticlesContainer.appendChild(particle);
    }
}
// Example: Call background particles once, or on an interval if they are meant to refresh
// document.addEventListener('DOMContentLoaded', () => {
//   createEnhancedBackgroundParticles();
//   setInterval(createEnhancedBackgroundParticles, 30000); // Refresh every 30s if desired
// });
