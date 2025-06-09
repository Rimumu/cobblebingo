// Global tooltip management
let currentSessionId = null;
let activeTooltip = null;


function createTooltip(content, isLegendary = false) {
  // Remove any existing tooltip first
  removeActiveTooltip();

  const tooltip = document.createElement("div");
  tooltip.className = isLegendary ? "legendary-tooltip" : "tooltip";
  tooltip.textContent = content;

  // Base styles for all tooltips
  tooltip.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: ${isLegendary ? "8px 12px" : "6px 10px"};
    border-radius: ${isLegendary ? "6px" : "4px"};
    font-size: ${isLegendary ? "12px" : "11px"};
    white-space: pre-wrap;
    word-wrap: break-word
    max-width: 250px
    min-width: 80px
    text-align: center
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 10000;
    pointer-events: none;
    box-shadow: 0 ${isLegendary ? "4px 12px" : "2px 8px"} rgba(0, 0, 0, ${isLegendary ? "0.3" : "0.2"});
    transform: translateX(-50%);
    ${isLegendary ? "border: 1px solid #ffd700;" : ""}
  `;

  // Add tooltip arrow
  const arrow = document.createElement("div");
  arrow.style.cssText = `
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: ${isLegendary ? "6px" : "5px"} solid transparent;
    border-right: ${isLegendary ? "6px" : "5px"} solid transparent;
    border-top: ${isLegendary ? "6px" : "5px"} solid rgba(0, 0, 0, 0.9);
  `;
  tooltip.appendChild(arrow);

  document.body.appendChild(tooltip);
  activeTooltip = tooltip;
  return tooltip;
}

function showTooltip(tooltip, targetElement) {
  if (!tooltip || !targetElement) return;

  const rect = targetElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  // Position tooltip above the target element
  let left = rect.left + rect.width / 2;
  let top = rect.top - 10;

  // Ensure tooltip doesn't go off screen
  const padding = 10;
  if (left - tooltipRect.width / 2 < padding) {
    left = tooltipRect.width / 2 + padding;
  } else if (left + tooltipRect.width / 2 > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width / 2 - padding;
  }

  // If tooltip would go above viewport, show it below instead
  if (top - tooltipRect.height < padding) {
    top = rect.bottom + 10;
    // Flip arrow for bottom position
    const arrow = tooltip.querySelector("div");
    if (arrow) {
      arrow.style.cssText = arrow.style.cssText
        .replace("border-top:", "border-bottom:")
        .replace("top: 100%", "top: -6px");
    }
  }

  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
  tooltip.style.opacity = "1";
  tooltip.style.visibility = "visible";
}

function hideTooltip(tooltip) {
  if (tooltip) {
    tooltip.style.opacity = "0";
    tooltip.style.visibility = "hidden";
  }
}

function removeActiveTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}

function setupTooltipEvents(cell, content, isLegendary = false) {
  let tooltip = null;

  cell.addEventListener("mouseenter", () => {
    tooltip = createTooltip(content, isLegendary);
    showTooltip(tooltip, cell);
  });

  cell.addEventListener("mouseleave", () => {
    removeActiveTooltip();
    tooltip = null;
  });

  // Store reference for cleanup
  cell.tooltipCleanup = () => {
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  };
}

// Loading Screen Animation and Management
function createParticles() {
  const particlesContainer = document.querySelector(".particles");
  const particleCount = 15;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 8 + "s";
    particle.style.animationDuration = 8 + Math.random() * 4 + "s";
    particlesContainer.appendChild(particle);
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");
  const body = document.body;

  loadingScreen.classList.add("fade-out");
  body.classList.remove("loading");

  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 800);
}

// Initialize loading screen
createParticles();

// Simulate loading time and hide loading screen
window.addEventListener("load", () => {
  // Minimum loading time for smooth experience
  setTimeout(() => {
    hideLoadingScreen();
  }, 2000); // 2 seconds minimum loading time
});

// Fallback in case window load event doesn't fire
setTimeout(() => {
  if (document.body.classList.contains("loading")) {
    hideLoadingScreen();
  }
}, 5000); // 5 seconds maximum loading time

// Updated API Configuration for Frontend
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'  // Local development
  : 'https://cobblebingo-backend-production.up.railway.app';  // Fixed: Added https://

console.log('Using API Base URL:', API_BASE_URL);

// --- REPLACE this entire function with the new version below ---
async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}/api/${endpoint}`;
    
    // --- START of updated logic ---
    const token = localStorage.getItem('token');
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // --- END of updated logic ---

    const response = await fetch(url, {
      ...options, // Pass through original options like method and body
      headers: headers, // Use our newly constructed headers
      mode: 'cors',
      credentials: 'include',
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        if (responseText.toLowerCase().includes('<html>')) {
          errorMessage = `Server returned HTML instead of JSON. Check the API endpoint.`;
        } else {
          errorMessage = `Server error: ${responseText.substring(0, 100)}...`;
        }
      }
      console.error('API error response:', errorMessage);
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error(`Invalid JSON response from ${endpoint}: ${parseError.message}`);
    }

    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    throw error;
  }
}

// Enhanced test API connection with better error handling
async function testApiConnection() {
  try {
    console.log('Testing API connection to:', `${API_BASE_URL}/health`);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const responseText = await response.text();
    console.log('Health check raw response:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ API connection successful');
        console.log('API health response:', data);
        return true;
      } catch (parseError) {
        console.warn('⚠️ API responded but with non-JSON:', responseText);
        return false;
      }
    } else {
      console.warn('⚠️ API health check failed:', response.status, response.statusText);
      console.warn('Response body:', responseText);
      return false;
    }
  } catch (error) {
    console.error('❌ API connection failed:', error);
    
    if (error.message.includes('CORS')) {
      console.error('❌ CORS Error: Backend CORS configuration issue');
    }
    
    return false;
  }
}

// Generate and store card on server with better error handling
async function generateAndStoreCard(selectedPokemon, selectedRarity) {
  try {
    console.log('Generating card with:', { rarity: selectedRarity, pokemon: selectedPokemon });
    
    const response = await apiCall("generate-card", {
      method: "POST",
      body: JSON.stringify({
        rarity: selectedRarity,
        pokemon: selectedPokemon,
      }),
    });

    if (!response.code) {
      throw new Error('Server did not return a card code');
    }

    return response.code;
  } catch (error) {
    console.error("Error generating card:", error);
    
    // Provide specific error messages based on the error type
    if (error.message.includes('API endpoint not found')) {
      throw new Error('The card generation service is not available. Please check if the server is running.');
    } else if (error.message.includes('HTML page instead of JSON')) {
      throw new Error('Server configuration error: API endpoint not properly configured.');
    } else {
      throw new Error(`Failed to generate card: ${error.message}`);
    }
  }
}

// Retrieve card from server with better error handling
async function retrieveCard(code) {
  try {
    console.log('Retrieving card with code:', code);
    
    const response = await apiCall(`get-card/${code}`);
    
    if (!response.cardData) {
      throw new Error('Invalid card data received from server');
    }
    
    return response;
  } catch (error) {
    console.error("Error retrieving card:", error);
    
    if (error.message.includes('API endpoint not found')) {
      throw new Error('The card retrieval service is not available. Please check if the server is running.');
    } else if (error.message.includes('HTML page instead of JSON')) {
      throw new Error('Server configuration error: API endpoint not properly configured.');
    } else {
      throw new Error(`Failed to retrieve card: ${error.message}`);
    }
  }
}

// Validate code exists with better error handling
async function validateCode(code) {
  try {
    console.log('Validating code:', code);
    
    const response = await apiCall(`validate-code/${code}`);
    return response.exists;
  } catch (error) {
    console.error("Error validating code:", error);
    
    // For validation, we can be more lenient and just return false
    if (error.message.includes('API endpoint not found') || 
        error.message.includes('HTML page instead of JSON')) {
      console.warn('Code validation service unavailable, assuming code is invalid');
      return false;
    }
    
    return false;
  }
}

// Create or get a session for a card
async function initSession(cardCode) {
  try {
    console.log(`Initializing session for card: ${cardCode}`);
    const response = await apiCall("session/init", {
      method: "POST",
      body: JSON.stringify({ cardCode }),
    });
    if (!response.sessionId) {
      throw new Error("Server did not return a session ID");
    }
    console.log(`✅ Session initialized: ${response.sessionId}`);
    return response;
  } catch (error) {
    console.error("Error initializing session:", error);
    throw new Error(`Failed to initialize session: ${error.message}`);
  }
}

// Get existing session data
async function getSession(sessionId) {
  try {
    console.log(`Retrieving session: ${sessionId}`);
    const response = await apiCall(`session/${sessionId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to retrieve session data');
    }
    console.log('✅ Session data retrieved');
    return response;
  } catch (error) {
    console.error("Error retrieving session:", error);
    // Return null if session not found, so we can create a new one
    if (error.message.includes('not found')) return null;
    throw new Error(`Failed to retrieve session: ${error.message}`);
  }
}

// Update completed cells for a session
async function updateSession(sessionId, cells) {
  try {
    // No console log here to avoid spamming on every click
    await apiCall(`session/${sessionId}/update`, {
      method: "PUT",
      body: JSON.stringify({ completedCells: cells }),
    });
  } catch (error) {
    console.error("Error updating session:", error);
    // Optionally alert the user that saving failed
    // alert("Failed to save your progress. Please check your connection.");
  }
}

// --- Add this new API function for saving a session ---
async function saveSession(sessionId, sessionName, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/save`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sessionName })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
}

// Add a function to test all API endpoints
async function testAllEndpoints() {
  console.log('🔍 Testing all API endpoints...');
  
  const endpoints = [
    { name: 'Health Check', url: `${API_BASE_URL}/health` },
    { name: 'Generate Card', url: `${API_BASE_URL}/api/generate-card` },
    { name: 'Get Card', url: `${API_BASE_URL}/api/get-card/test` },
    { name: 'Validate Code', url: `${API_BASE_URL}/api/validate-code/test` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.name === 'Generate Card' ? 'POST' : 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint.name === 'Generate Card' ? JSON.stringify({
          rarity: 'normal',
          pokemon: []
        }) : undefined
      });
      
      const text = await response.text();
      console.log(`${endpoint.name}: ${response.status} - ${text.substring(0, 100)}...`);
    } catch (error) {
      console.error(`${endpoint.name}: Failed -`, error.message);
    }
  }
}

// Your existing utility functions (keep these)
function createSeededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

async function fetchPokemonData() {
  const response = await fetch(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlLTA4Oe6Kzu-EQp_AS1wGs_PzLZ9GMIhWrgUDuXux18AYe7sg6B5LfrN0oRw63ZdyTr5rrDvM54ui/pub?output=csv",
  );
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const data = [];
  const seen = new Set();

  parsed.data.forEach((row) => {
    const id = row["ID"];
    const name = row["Name"];
    const biome = row["Biome"];
    const rarity = row["Rarity"];

    if (!name || !id || seen.has(name)) return;
    seen.add(name);

    data.push({
      name: name.trim(),
      biome: biome.trim(),
      rarity: rarity.trim(),
      id: row["ID"] ? row["ID"].trim().replace(/\D/g, "") : "",
    });
  });

  return data;
}

function shuffle(array) {
  // Create a copy to avoid mutating the original
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Replace the populateFilters function with:
function populateFilters() {
  // No need to populate dynamically since we have fixed difficulty options
}

// Add this new function to select Pokemon based on difficulty:
function selectPokemonByDifficulty(pokemonList, difficulty) {
  console.log("Selecting Pokémon by difficulty:", difficulty);

  // First categorize all Pokemon by their rarity
  const byRarity = {
    common: pokemonList.filter((p) => p.rarity.toLowerCase() === "common"),
    uncommon: pokemonList.filter((p) => p.rarity.toLowerCase() === "uncommon"),
    rare: pokemonList.filter((p) => p.rarity.toLowerCase() === "rare"),
    "ultra-rare": pokemonList.filter(
      (p) => p.rarity.toLowerCase() === "ultra-rare",
    ),
    legendary: pokemonList.filter(
      (p) => p.rarity.toLowerCase() === "legendary",
    ),
  };

  console.log("Filtered Pokémon by rarity:", byRarity);

  let selected = [];

  // Function to handle Pokémon selection based on category and count
  function selectFromCategory(category, count) {
    console.log(`Attempting to select ${count} Pokémon from ${category}`);
    if (byRarity[category].length >= count) {
      console.log(`Selecting ${count} Pokémon from ${category}`);
      const selectedFromCategory = shuffle(byRarity[category]).slice(0, count);
      console.log(`${category} selected:`, selectedFromCategory);
      return selectedFromCategory;
    } else {
      console.warn(
        `Not enough ${category} Pokémon for difficulty ${difficulty}, selecting all available.`,
      );
      const selectedFromCategory = shuffle(byRarity[category]);
      console.log(
        `${category} selected (not enough Pokémon):`,
        selectedFromCategory,
      );
      return selectedFromCategory;
    }
  }

  // Select Pokémon based on the selected difficulty
  if (difficulty === "easy") {
    selected = selected.concat(
      selectFromCategory("common", 15), // 60% common
      selectFromCategory("uncommon", 9), // 40% uncommon
    );
  } else if (difficulty === "normal") {
    selected = selected.concat(
      selectFromCategory("common", 2),
      selectFromCategory("uncommon", 8),
      selectFromCategory("rare", 8),
      selectFromCategory("ultra-rare", 6),
    );
  } else if (difficulty === "hard") {
    selected = selected.concat(
      selectFromCategory("rare", 15), // 60% rare
      selectFromCategory("ultra-rare", 9), // 40% ultra-rare
    );
  } else if (difficulty === "common") {
    selected = selected.concat(selectFromCategory("common", 24));
  } else if (difficulty === "uncommon") {
    selected = selected.concat(selectFromCategory("uncommon", 24));
  } else if (difficulty === "rare") {
    selected = selected.concat(selectFromCategory("rare", 24));
  } else if (difficulty === "ultra-rare") {
    selected = selected.concat(selectFromCategory("ultra-rare", 24));
  } else if (difficulty === "insane") {
    // Special case: Get 24 ultra-rare Pokémon + 1 legendary at center
    selected = selected.concat(selectFromCategory("ultra-rare", 24));

    // Get 1 legendary Pokémon for the center
    const legendaryPokemon = shuffle(byRarity["legendary"])[0];

    // Insert legendary at position 12 (center) - this makes it 25 total
    if (legendaryPokemon) {
      selected.splice(12, 0, legendaryPokemon);
    } else {
      // Fallback if no legendaries are available
      selected.splice(12, 0, {
        name: "LEGENDARY",
        rarity: "legendary",
        biome: "Legendary",
        id: "0",
      });
    }
  } else {
    console.warn("Unknown difficulty, defaulting to normal");
    selected = selected.concat(
      selectFromCategory("common", 2),
      selectFromCategory("uncommon", 8),
      selectFromCategory("rare", 8),
      selectFromCategory("ultra-rare", 6),
    );
  }

  console.log("Selected Pokémon before padding:", selected);

  // For insane difficulty, we should have exactly 25 (24 + 1 legendary)
  if (difficulty === "insane") {
    if (selected.length !== 25) {
      console.error(
        `Insane difficulty should have 25 Pokémon (got ${selected.length}), padding with ultra-rare`,
      );
      while (selected.length < 25) {
        selected.push(...selectFromCategory("ultra-rare", 1));
      }
      selected = selected.slice(0, 25);
    }
  } else {
    // For all other difficulties, ensure we have exactly 24 Pokémon (FREE space will be added later)
    if (selected.length !== 24) {
      console.error(
        `Difficulty ${difficulty} should have 24 Pokémon (got ${selected.length}), adjusting`,
      );
      while (selected.length < 24) {
        selected.push(...selectFromCategory("ultra-rare", 1));
      }
      selected = selected.slice(0, 24);
    }
  }

  console.log("Final Selected Pokémon:", selected);
  return selected;
}

function setupColorSchemeSelector() {
  const colorOptions = document.querySelectorAll(".color-option");

  colorOptions.forEach((option) => {
    option.addEventListener("click", () => {
      colorOptions.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
      const theme = option.dataset.theme;
      document.body.className = `theme-${theme}`;
    });
  });
}

let pokemonData = [];

fetchPokemonData().then((data) => {
  pokemonData = data;
  populateFilters();
});

function openPokemonPage(pokemonName) {
  const formattedName = pokemonName.toLowerCase().replace(/\s+/g, "_");
  const url = `https://cobblemon.tools/pokedex/pokemon/${formattedName}`;
  window.open(url, "_blank");
}

async function imageToBase64(imgElement) {
  return new Promise((resolve) => {
    if (!imgElement.src || imgElement.src === "") {
      resolve("");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = imgElement.naturalWidth || imgElement.width || 150;
    canvas.height = imgElement.naturalHeight || imgElement.height || 150;

    try {
      ctx.drawImage(imgElement, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    } catch (error) {
      console.warn("Could not convert image to base64:", error);
      resolve("");
    }
  });
}

// Updated generateBingo function with proper new card generation
async function generateBingo() {
  const selectedDifficulty = document.getElementById("difficulty").value;
  const cardCodeInput = document.getElementById("cardCode").value.trim().toUpperCase();
  const loadingSpinner = document.getElementById("loadingSpinner");
  const bingoCard = document.getElementById("bingoGrid");
  const bingoCardWrapper = document.getElementById("bingoCard");
  const exportBtn = document.getElementById("exportBtn");

  loadingSpinner.style.display = "flex";
  bingoCardWrapper.style.display = "none";
  exportBtn.style.display = "none";
  document.querySelector(".controls-container").style.display = "none";
  bingoCard.innerHTML = "";
  
  await new Promise((resolve) => setTimeout(resolve, 300));

  let cardData;
  let sessionData;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get("code");
    const sessionFromUrl = urlParams.get("session");
    const codeToUse = cardCodeInput || codeFromUrl;

    if (codeToUse) {
      // --- Loading an existing card ---
      console.log("Loading card with code:", codeToUse);
      cardData = await retrieveCard(codeToUse);
      document.getElementById("cardCode").value = cardData.code;
      document.getElementById("difficulty").value = cardData.cardData.difficulty;
      
      if (sessionFromUrl) {
        console.log("Found session in URL, attempting to load:", sessionFromUrl);
        sessionData = await getSession(sessionFromUrl);
      }
      
      if (!sessionData) {
        console.log("No valid session found, initializing a new one.");
        sessionData = await initSession(cardData.code);
      }
      
    } else {
      // --- Generating a new card ---
      console.log("Generating new card...");
      let pokemonForCard = selectPokemonByDifficulty(pokemonData, selectedDifficulty);
      let selectedPokemon = [];
      // (The logic to assemble the 25 pokemon array remains the same)
      if (selectedDifficulty === "insane") {
        const centerPokemon = pokemonForCard[12];
        const otherPokemon = [...pokemonForCard.slice(0, 12), ...pokemonForCard.slice(13)];
        const shuffledOther = shuffle(otherPokemon);
        for (let i = 0; i < 25; i++) {
          if (i === 12) {
            selectedPokemon.push(centerPokemon);
          } else {
            const otherIndex = i < 12 ? i : i - 1;
            selectedPokemon.push(shuffledOther[otherIndex]);
          }
        }
      } else {
        const shuffledPokemon = shuffle(pokemonForCard.slice(0, 24));
        for (let i = 0; i < 25; i++) {
          if (i === 12) {
            selectedPokemon.push({ name: "Free Space", rarity: "", biome: "", id: "" });
          } else {
            selectedPokemon.push(shuffledPokemon[i < 12 ? i : i - 1]);
          }
        }
      }

      const newCardCode = await generateAndStoreCard(selectedPokemon, selectedDifficulty);
      cardData = await retrieveCard(newCardCode); // Re-fetch to get the full object
      document.getElementById("cardCode").value = cardData.code;

      console.log("Initializing new session for new card.");
      sessionData = await initSession(cardData.code);
    }
    
    // --- Post-load/generation logic ---
    currentSessionId = sessionData.sessionId;
    completedCells = sessionData.completedCells; // Load progress from session

    // Update URL with both code and session
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set("code", cardData.code);
    currentUrl.searchParams.set("session", currentSessionId);
    history.pushState(null, '', currentUrl.toString());

        // Show/Hide Save button based on login state
    const saveBtn = document.getElementById('saveSessionBtn');
    const token = localStorage.getItem('token');
    if (token) {
        saveBtn.style.display = 'inline-block';
        saveBtn.onclick = async () => {
            const sessionName = prompt("Enter a name for this session:", `My Bingo Card`);
            if (sessionName) {
                try {
                    await saveSession(currentSessionId, sessionName, token);
                    alert(`Session saved as "${sessionName}"!`);
                } catch (e) {
                    alert(`Error: ${e.message}`);
                }
            }
        };
    } else {
        saveBtn.style.display = 'none';
    }
    
    await renderBingoCard(cardData.cardData.pokemon);
    initializeCompletedCells(true); // Pass flag to indicate we're loading from server
    checkForBingo(); // Check for bingos on load

  } catch (error) {
    console.error("Error in generateBingo:", error);
    alert(`Error: ${error.message || "Failed to generate/load bingo card"}`);
    loadingSpinner.style.display = "none";
    return;
  }
  
  loadingSpinner.style.display = "none";
  bingoCardWrapper.style.display = "flex";
  exportBtn.style.display = "inline-block";
  document.getElementById("postGenerationControls").style.display = "inline-flex";
  document.querySelector(".controls-container").style.display = "flex";
}

// Add a function to explicitly generate a new card
function generateNewCard() {
  // Clear the input field and URL
  const cardCodeElement = document.getElementById("cardCode");
  if (cardCodeElement) {
    cardCodeElement.value = "";
  }

  // Clear URL parameter
  history.replaceState(null, null, window.location.pathname);

  // Remove the generated flag so we definitely create a new card
  document.body.removeAttribute("data-generated");

  // Generate the bingo card
  generateBingo();
}

// Updated renderBingoCard function with fixed tooltip positioning
async function renderBingoCard(selected) {
  const bingoCard = document.getElementById("bingoGrid");
  const imageLoadPromises = [];

  selected.forEach((pokemon, index) => {
    const name = pokemon.name;
    const cell = document.createElement("div");
    cell.className = "bingo-cell";

    if (index === 12) {
      if (pokemon.rarity?.toLowerCase() === "legendary") {
        // Legendary center cell - FIXED: Make it clickable and not pre-marked as completed
        cell.classList.add("legendary-center");
        cell.style.cursor = "pointer";
        cell.style.position = "relative";
        cell.style.overflow = "hidden"; // FIXED: Contain shimmer effect within cell
        cell.style.isolation = "isolate"; // Create new stacking context

        // Add click handler for legendary cell
        cell.addEventListener("click", (e) => {
          // Prevent opening Pokemon page if just marking completion
          if (
            e.target === cell ||
            e.target.classList.contains("pokemon-name")
          ) {
            Completion(index);
          } else {
            if (pokemon.rarity.toLowerCase() === "legendary") {
              window.open(
                "https://modrinth.com/datapack/cobblemon-legendary-structures",
                "_blank",
              );
            } else {
              openPokemonPage(pokemon.name);
            }
          }
        });

        setupTooltipEvents(
          cell,
          `Legendary Pokémon | Biome: ${pokemon.biome}`,
          true,
        );

        // Add hover transform effects
        cell.addEventListener("mouseenter", () => {
          cell.style.transform = "translateY(-3px) scale(1.02)";
        });

        cell.addEventListener("mouseleave", () => {
          cell.style.transform = "";
        });

        const wrapper = document.createElement("div");
        wrapper.className = "image-wrapper";
        wrapper.style.position = "relative";
        wrapper.style.overflow = "hidden"; // Contain shimmer within wrapper
        wrapper.style.width = "100%";
        wrapper.style.height = "100%";

        // Use local image for legendary with proper fallback
        const img = document.createElement("img");
        img.alt = name;
        img.className = "pokemon-img";
        img.crossOrigin = "anonymous";

        // Try multiple possible paths for the legendary image
        const possiblePaths = [
          `./public/${pokemon.id}.png`,
          `./images/${pokemon.id}.png`,
          `/images/${pokemon.id}.png`,
          `./assets/${pokemon.id}.png`,
          `/assets/${pokemon.id}.png`,
          `./${pokemon.id}.png`,
        ];

        let pathIndex = 0;

        const tryNextPath = () => {
          if (pathIndex < possiblePaths.length) {
            img.src = possiblePaths[pathIndex];
            pathIndex++;
          } else {
            // All local paths failed, try external sources
            console.warn(
              `Local image not found for legendary ${pokemon.name}, trying external sources`,
            );
            tryExternalSources();
          }
        };

        const tryExternalSources = async () => {
          // Try Cobbledex first
          const formattedName = name.toLowerCase().replace(/\s+/g, "_");
          const cobblemonUrl = `https://cobbledex.b-cdn.net/mons/large/${formattedName}.webp`;

          try {
            const response = await fetch(cobblemonUrl);
            if (response.ok) {
              const blob = await response.blob();
              const PLACEHOLDER_SIZE_MIN = 2160;
              const PLACEHOLDER_SIZE_MAX = 2180;

              if (
                blob.size < PLACEHOLDER_SIZE_MIN ||
                blob.size > PLACEHOLDER_SIZE_MAX
              ) {
                const objectUrl = URL.createObjectURL(blob);
                img.src = objectUrl;
                img.onload = () => URL.revokeObjectURL(objectUrl);
                return;
              }
            }
          } catch (error) {
            console.warn(
              `Cobbledex failed for legendary ${pokemon.name}:`,
              error,
            );
          }

          // Fallback to PokeAPI
          if (pokemon.id) {
            const pokeApiUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
            img.src = pokeApiUrl;
          } else {
            img.src = "";
            img.alt = `${pokemon.name} (Image not available)`;
          }
        };

        img.onerror = tryNextPath;
        tryNextPath(); // Start trying paths

        wrapper.appendChild(img);

        cell.appendChild(wrapper);

        const label = document.createElement("div");
        label.className = "pokemon-name";
        label.textContent = name;
        cell.appendChild(label);

        const rarity = document.createElement("div");
        rarity.className = "rarity-badge legendary";
        rarity.textContent = "Legendary";
        cell.appendChild(rarity);
      } else {
        // Regular FREE space
        cell.textContent = "FREE";
        cell.style.backgroundColor = "#ffd700";
        cell.style.fontWeight = "bold";
        cell.style.display = "flex";
        cell.style.alignItems = "center";
        cell.style.justifyContent = "center";
        cell.style.fontSize = "18px";
        cell.style.color = "#000";
        // FREE space is automatically marked as completed
        cell.classList.add("completed");
      }
    } else {
      // Regular Pokemon cells
      cell.style.cursor = "pointer";
      cell.style.position = "relative";
      cell.style.overflow = "hidden"; // Prevent any overflow issues

      cell.addEventListener("click", (e) => {
        // Prevent opening Pokemon page if just marking completion
        if (e.target === cell || e.target.classList.contains("pokemon-name")) {
          toggleCellCompletion(index);
        } else {
          openPokemonPage(pokemon.name);
        }
      });

      // Setup tooltip for regular cell
      setupTooltipEvents(cell, "Biome: " + pokemon.biome, false);

      // Add hover transform effects
      cell.addEventListener("mouseenter", () => {
        cell.style.transform = "translateY(-3px) scale(1.02)";
      });

      cell.addEventListener("mouseleave", () => {
        cell.style.transform = "";
      });

      const wrapper = document.createElement("div");
      wrapper.className = "image-wrapper";
      wrapper.style.position = "relative";

      const formattedName = name.toLowerCase().replace(/\s+/g, "_");
      const cobblemonUrl = `https://cobbledex.b-cdn.net/mons/large/${formattedName}.webp`;

      const img = document.createElement("img");
      img.alt = name;
      img.className = "pokemon-img";
      img.crossOrigin = "anonymous";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      wrapper.appendChild(img);

      const loadPromise = new Promise(async (resolve) => {
        try {
          const response = await fetch(cobblemonUrl);
          if (!response.ok)
            throw new Error(`Cobbledex failed: ${response.status}`);

          const blob = await response.blob();
          const PLACEHOLDER_SIZE_MIN = 2160;
          const PLACEHOLDER_SIZE_MAX = 2180;

          if (
            blob.size >= PLACEHOLDER_SIZE_MIN &&
            blob.size <= PLACEHOLDER_SIZE_MAX
          ) {
            throw new Error("Placeholder image detected");
          }

          const objectUrl = URL.createObjectURL(blob);
          img.src = objectUrl;

          await new Promise((imgResolve, imgReject) => {
            img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              imgResolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              imgReject(new Error("Image load failed"));
            };
          });
        } catch (error) {
          console.warn(
            `Falling back to PokeAPI for ${pokemon.name}: ${error.message}`,
          );

          if (pokemon.id) {
            const pokeApiUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
            img.crossOrigin = "anonymous";
            img.src = pokeApiUrl;

            await new Promise((imgResolve) => {
              img.onload = imgResolve;
              img.onerror = () => {
                img.src = "";
                img.alt = `${pokemon.name} (Image not available)`;
                imgResolve();
              };
            });
          } else {
            img.src = "";
            img.alt = `${pokemon.name} (No ID available)`;
          }
        }

        resolve();
      });

      imageLoadPromises.push(loadPromise);
      cell.appendChild(wrapper);

      const label = document.createElement("div");
      label.className = "pokemon-name";
      label.textContent = pokemon.name;
      label.style.fontSize = "12px";
      label.style.fontWeight = "bold";
      label.style.textAlign = "center";
      label.style.marginTop = "5px";
      label.style.color = "#333";
      cell.appendChild(label);

      if (pokemon.rarity) {
        const rarity = document.createElement("div");
        const rarityClass = pokemon.rarity.toLowerCase().replace(/\s+/g, "-");
        rarity.className = `rarity-badge ${rarityClass}`;
        rarity.textContent =
          pokemon.rarity.charAt(0).toUpperCase() + pokemon.rarity.slice(1);
        rarity.style.fontSize = "10px";
        rarity.style.padding = "2px 6px";
        rarity.style.borderRadius = "12px";
        rarity.style.fontWeight = "bold";
        rarity.style.textAlign = "center";
        rarity.style.marginTop = "3px";
        cell.appendChild(rarity);
      }
    }

    bingoCard.appendChild(cell);
  });

  // Wait for all images to load
  await Promise.all(imageLoadPromises);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

// Check for code in URL on page load
document.addEventListener("DOMContentLoaded", () => {
  setupColorSchemeSelector();

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  if (code && document.getElementById("cardCode")) {
    document.getElementById("cardCode").value = code;
  }
});

// Improved bingo line drawing
function drawBingoLine(cellIndices, lineType) {
  const grid = document.getElementById("bingoGrid");
  const line = document.createElement("div");
  line.className = "bingo-line";

  // Add specific line type class
  if (lineType === "horizontal") {
    line.classList.add("horizontal");
    const row = Math.floor(cellIndices[0] / 5);
    line.style.top = `${row * (130 + 8) + 65 - 3}px`; // 130px cell height + 8px gap
  } else if (lineType === "vertical") {
    line.classList.add("vertical");
    const col = cellIndices[0] % 5;
    line.style.left = `${col * (100 + 8) + 50 - 3}px`; // 100px cell width + 8px gap
  } else if (lineType === "diagonal-main") {
    line.classList.add("diagonal", "diagonal-main");
  } else if (lineType === "diagonal-anti") {
    line.classList.add("diagonal", "diagonal-anti");
  }

  grid.appendChild(line);
}

// New function to show bingo messages
function showBingoMessage(count) {
  // Remove existing message
  const existingMessage = document.querySelector(".bingo-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const message = document.createElement("div");
  message.className = "bingo-message";

  if (count === 1) {
    message.textContent = "🎉 BINGO! 🎉";
  } else {
    message.textContent = `🎉 ${count} BINGOS! 🎉`;
  }

  document.body.appendChild(message);

  // Remove message after animation
  setTimeout(() => {
    message.remove();
  }, 4000);
}

// Track the current number of bingos to prevent duplicate celebrations
let currentBingoCount = 0;

// Enhanced bingo checking with multiple line detection
function checkForBingo() {
  // Clear existing lines
  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());

  // Define all possible bingo lines with their types
  const lines = [
    // Rows
    { indices: [0, 1, 2, 3, 4], type: "horizontal" },
    { indices: [5, 6, 7, 8, 9], type: "horizontal" },
    { indices: [10, 11, 12, 13, 14], type: "horizontal" },
    { indices: [15, 16, 17, 18, 19], type: "horizontal" },
    { indices: [20, 21, 22, 23, 24], type: "horizontal" },
    // Columns
    { indices: [0, 5, 10, 15, 20], type: "vertical" },
    { indices: [1, 6, 11, 16, 21], type: "vertical" },
    { indices: [2, 7, 12, 17, 22], type: "vertical" },
    { indices: [3, 8, 13, 18, 23], type: "vertical" },
    { indices: [4, 9, 14, 19, 24], type: "vertical" },
    // Diagonals
    { indices: [0, 6, 12, 18, 24], type: "diagonal-main" },
    { indices: [4, 8, 12, 16, 20], type: "diagonal-anti" },
  ];

  let bingoCount = 0;
  const completedLines = [];

  lines.forEach((line) => {
    if (line.indices.every((index) => completedCells[index])) {
      bingoCount++;
      completedLines.push(line);
      drawBingoLine(line.indices, line.type);
    }
  });

  // Handle bingo celebrations
  if (bingoCount > currentBingoCount) {
    const grid = document.getElementById("bingoGrid");

    // Add celebration class
    grid.classList.add("bingo-celebration");
    setTimeout(() => {
      grid.classList.remove("bingo-celebration");
    }, 3000);

    // Show bingo message
    showBingoMessage(bingoCount);

    console.log(
      `BINGO! ${bingoCount} line${bingoCount > 1 ? "s" : ""} completed!`,
    );
  }

  // Update the current bingo count
  currentBingoCount = bingoCount;

  return bingoCount;
}

/* Track completed cells
let completedCells = Array(25).fill(false); // 5x5 grid
completedCells[12] = true; // FREE space is always completed*/

// Enhanced toggle function with better feedback
function toggleCellCompletion(index) {
  const cells = document.querySelectorAll(".bingo-cell");
  const cell = cells[index];

  if (index === 12 && cell.textContent === "FREE") return;

  completedCells[index] = !completedCells[index];
  cell.classList.toggle("completed", completedCells[index]);
  
  // (The manual checkmark logic for legendary cells remains the same)
  if (cell.classList.contains("legendary-center")) {
    const existingCheckmark = cell.querySelector(".manual-checkmark");
    if (completedCells[index] && !existingCheckmark) {
      const checkmark = document.createElement("div");
      checkmark.className = "manual-checkmark";
      checkmark.innerHTML = "✓";
      // (checkmark styles...)
      cell.appendChild(checkmark);
    } else if (!completedCells[index] && existingCheckmark) {
      existingCheckmark.remove();
    }
  }

  cell.style.transform = "scale(0.95)";
  setTimeout(() => {
    cell.style.transform = "";
  }, 150);

  checkForBingo();
  
  // --- Add this line to save progress to the backend ---
  if (currentSessionId) {
    updateSession(currentSessionId, completedCells);
  }
}

// Updated initialization of completed cells - FIXED: Don't pre-mark legendary cells
let completedCells = Array(25).fill(false); // 5x5 grid
// Note: We'll only mark the FREE space as completed after the card is rendered

// Keep your existing export function
document.getElementById("exportBtn").addEventListener("click", async () => {
  const card = document.getElementById("bingoCard");

  if (!card) {
    alert("No bingo card to export. Please generate a card first.");
    return;
  }

  const exportBtn = document.getElementById("exportBtn");
  const originalText = exportBtn.textContent;
  exportBtn.textContent = "Exporting...";
  exportBtn.disabled = true;

  try {
    const images = card.querySelectorAll("img");
    for (const img of images) {
      if (img.src && !img.src.startsWith("data:")) {
        try {
          const base64 = await imageToBase64(img);
          if (base64) {
            img.src = base64;
          }
        } catch (error) {
          console.warn("Failed to convert image to base64:", error);
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    const originalCardStyle = {
      margin: card.style.margin,
      boxShadow: card.style.boxShadow,
    };

    card.style.margin = "0";
    card.style.boxShadow = "none";

    const canvas = await html2canvas(card, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: null,
      logging: false,
      width: card.scrollWidth,
      height: card.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedCard = clonedDoc.getElementById("bingoCard");
        if (clonedCard) {
          clonedCard.style.margin = "0";
          clonedCard.style.boxShadow = "none";

          const badges = clonedCard.querySelectorAll(".rarity-badge");
          badges.forEach((badge) => {
            badge.style.textRendering = "geometricPrecision";
            badge.style.fontKerning = "normal";
            badge.style.fontSmoothing = "antialiased";
            badge.style.webkitFontSmoothing = "antialiased";
          });
        }
      },
    });

    card.style.margin = originalCardStyle.margin;
    card.style.boxShadow = originalCardStyle.boxShadow;

    const link = document.createElement("a");
    link.download = `cobblemon_bingo_card_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting card:", error);
    alert("Error exporting card. Please try again.");
  } finally {
    exportBtn.textContent = originalText;
    exportBtn.disabled = false;
  }
});

// Enhanced clear function
function clearCompleted() {
  // Reset local state
  completedCells = Array(25).fill(false);
  currentBingoCount = 0;

  // Mark the regular FREE space as complete again
  const centerCell = document.querySelector(".bingo-cell:nth-child(13)");
  if (centerCell && centerCell.textContent === "FREE") {
    completedCells[12] = true;
  }
  
  // Update the UI
  document.querySelectorAll(".bingo-cell").forEach((cell, index) => {
    cell.classList.toggle("completed", completedCells[index]);
    // Remove manual checkmarks
    const existingCheckmark = cell.querySelector(".manual-checkmark");
    if (existingCheckmark) existingCheckmark.remove();
  });

  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());
  
  // --- Add this line to save the cleared state to the backend ---
  if (currentSessionId) {
    updateSession(currentSessionId, completedCells);
  }
}

// Add this function to properly initialize completed cells after card generation
function initializeCompletedCells(isLoadingFromServer = false) {
  // If loading from server, the `completedCells` global is already set.
  // We just need to apply the 'completed' class to the rendered cells.
  if (isLoadingFromServer) {
    document.querySelectorAll('.bingo-cell').forEach((cell, index) => {
      if (completedCells[index]) {
        cell.classList.add('completed');
      }
    });
  } else {
    // This is for the old flow, just in case.
    const centerCell = document.querySelector(".bingo-cell:nth-child(13)");
    if (centerCell && centerCell.textContent === "FREE") {
      completedCells[12] = true;
      centerCell.classList.add("completed");
    }
  }
}

// UPDATED cleanup function - Replace your existing cleanupTooltips function
function cleanupTooltips() {
  // Remove the active tooltip
  removeActiveTooltip();

  // Remove any orphaned tooltips
  document
    .querySelectorAll(".tooltip, .legendary-tooltip")
    .forEach((tooltip) => {
      tooltip.remove();
    });

  // Call cleanup on all cells that have it
  document.querySelectorAll(".bingo-cell").forEach((cell) => {
    if (cell.tooltipCleanup) {
      cell.tooltipCleanup();
    }
  });
}

// Enhanced particle generator - add this to the end of script.js
function createEnhancedParticles() {
    const particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) return;

    // Clear existing particles
    particlesContainer.innerHTML = '';

    // Create 15 particles for better visibility
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random horizontal position
        const leftPosition = Math.random() * 100;
        particle.style.left = leftPosition + '%';

        // Random animation delay for staggered effect
        const delay = Math.random() * 6;
        particle.style.animationDelay = `-${delay}s`;

        // Random animation duration for variety
        const duration = 5 + Math.random() * 3; // 5-8 seconds
        particle.style.animationDuration = `${duration}s`;

        particlesContainer.appendChild(particle);
    }
}

// Initialize particles when page loads
document.addEventListener('DOMContentLoaded', createEnhancedParticles);

// Refresh particles every 30 seconds to keep them active
setInterval(createEnhancedParticles, 30000);
