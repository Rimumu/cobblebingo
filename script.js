// Global val null
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

function setupCustomDifficultySelector() {
    const customSelect = document.querySelector('.custom-select');
    if (!customSelect) return;

    const trigger = customSelect.querySelector('.custom-select__trigger');
    const options = customSelect.querySelectorAll('.custom-option');
    const originalSelect = document.getElementById('difficulty');
    const triggerText = trigger.querySelector('span');

    // Toggle dropdown visibility
    trigger.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the window click listener from closing it immediately
        customSelect.classList.toggle('open');
    });

    // Handle option selection
    options.forEach(option => {
        option.addEventListener('click', () => {
            const selectedValue = option.getAttribute('data-value');

            // Update the hidden <select> so the rest of the app works
            originalSelect.value = selectedValue;

            // Update the text in the trigger
            triggerText.textContent = option.textContent;

            // Update which option is marked as 'selected'
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Close the dropdown
            customSelect.classList.remove('open');
        });
    });

    // Add a listener to close the dropdown when clicking anywhere else
    window.addEventListener('click', () => {
        if (customSelect.classList.contains('open')) {
            customSelect.classList.remove('open');
        }
    });
}

// Updated API Configuration for Frontend
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'  // Local development
  : 'https://cobblebingo-backend-production.up.railway.app';  // Fixed: Added https://

console.log('Using API Base URL:', API_BASE_URL);

// --- REPLACE this entire function with the new version below ---
async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}/api/${endpoint}`;
    
    const token = localStorage.getItem('token');
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: headers,
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
    if (error.message.includes('not found')) return null;
    throw new Error(`Failed to retrieve session: ${error.message}`);
  }
}

// Update completed cells for a session
async function updateSession(sessionId, cells) {
  try {
    await apiCall(`session/${sessionId}/update`, {
      method: "PUT",
      body: JSON.stringify({ completedCells: cells }),
    });
  } catch (error) {
    console.error("Error updating session:", error);
  }
}

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
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function populateFilters() {}

function selectPokemonByDifficulty(pokemonList, difficulty) {
  console.log("Selecting Pokémon by difficulty:", difficulty);

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

  let selected = [];

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

  if (difficulty === "easy") {
    selected = selected.concat(
      selectFromCategory("common", 15),
      selectFromCategory("uncommon", 9),
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
      selectFromCategory("rare", 15),
      selectFromCategory("ultra-rare", 9),
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
    selected = selected.concat(selectFromCategory("ultra-rare", 24));
    const legendaryPokemon = shuffle(byRarity["legendary"])[0];
    if (legendaryPokemon) {
      selected.splice(12, 0, legendaryPokemon);
    } else {
      selected.splice(12, 0, {
        name: "LEGENDARY",
        rarity: "legendary",
        biome: "Legendary",
        id: "0",
      });
    }
  } else if (difficulty === "nightmare") {
    const legendaryPokemon = selectFromCategory("legendary", 5);
    const ultraRarePokemon = selectFromCategory("ultra-rare", 20);
    const centerLegendary = legendaryPokemon.pop();
    const otherPokemon = ultraRarePokemon.concat(legendaryPokemon);
    const shuffledOthers = shuffle(otherPokemon);
    if (centerLegendary) {
        selected.push(...shuffledOthers.slice(0, 12), centerLegendary, ...shuffledOthers.slice(12));
    } else {
        selected = selected.concat(shuffledOthers);
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

  if (difficulty === "insane" || difficulty === "nightmare") {
    if (selected.length !== 25) {
      console.error(
        `Difficulty ${difficulty} should have 25 Pokémon (got ${selected.length}), padding with ultra-rare`,
      );
      while (selected.length < 25) {
        selected.push(...selectFromCategory("ultra-rare", 1));
      }
      selected = selected.slice(0, 25);
    }
  } else {
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

async function generateBingo() {
  const loadingSpinner = document.getElementById("loadingSpinner");
  const bingoCard = document.getElementById("bingoGrid");
  const bingoCardWrapper = document.getElementById("bingoCard");
  const exportBtn = document.getElementById("exportBtn");
  const cardCodeInput = document.getElementById("cardCode").value.trim().toUpperCase();

  loadingSpinner.style.display = "flex";
  bingoCardWrapper.style.display = "none";
  exportBtn.style.display = "none";
  document.querySelector(".controls-container").style.display = "none";
  bingoCard.innerHTML = "";
  
  await new Promise((resolve) => setTimeout(resolve, 300));

  let cardData;
  let sessionData = null;
  let difficultyToUse;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get("code");
    let sessionFromUrl = urlParams.get("session");
    const codeToUse = cardCodeInput || codeFromUrl;

    if (cardCodeInput && cardCodeInput.toUpperCase() !== (codeFromUrl || '').toUpperCase()) {
        sessionFromUrl = null;
    }

    if (codeToUse) {
      cardData = await retrieveCard(codeToUse);
      difficultyToUse = cardData.cardData.difficulty; 
      document.getElementById("cardCode").value = cardData.code;
      document.getElementById("difficulty").value = difficultyToUse;
      const customSelectTrigger = document.querySelector('.custom-select__trigger span');
      const selectedOption = document.querySelector(`.custom-option[data-value="${difficultyToUse}"]`);
      if (customSelectTrigger && selectedOption) {
          customSelectTrigger.textContent = selectedOption.textContent;
      }

      if (sessionFromUrl) {
        sessionData = await getSession(sessionFromUrl);
      }
      
    } else {
      difficultyToUse = document.getElementById("difficulty").value;
      let pokemonForCard = selectPokemonByDifficulty(pokemonData, difficultyToUse);
      let selectedPokemon;

      if (difficultyToUse === "insane" || difficultyToUse === "nightmare") {
        selectedPokemon = pokemonForCard;
      } else {
        selectedPokemon = [];
        const shuffledPokemon = shuffle(pokemonForCard.slice(0, 24));
        for (let i = 0; i < 25; i++) {
          if (i === 12) {
            selectedPokemon.push({ name: "Free Space", rarity: "", biome: "", id: "" });
          } else {
            selectedPokemon.push(shuffledPokemon[i < 12 ? i : i - 1]);
          }
        }
      }

      const newCardCode = await generateAndStoreCard(selectedPokemon, difficultyToUse);
      cardData = await retrieveCard(newCardCode);
      document.getElementById("cardCode").value = cardData.code;
    }
    
    if (sessionData) {
      currentSessionId = sessionData.sessionId;
      completedCells = sessionData.completedCells;
    } else {
      currentSessionId = null;
      completedCells = Array(25).fill(false);
    }

    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set("code", cardData.code);
    if (currentSessionId) {
      currentUrl.searchParams.set("session", currentSessionId);
    } else {
      currentUrl.searchParams.delete("session");
    }
    history.pushState(null, '', currentUrl.toString());

    document.getElementById('saveSessionBtn').style.display = 'none';
    
    await renderBingoCard(cardData.cardData.pokemon);
    initializeCompletedCells();
    checkForBingo();

    const logoContainer = document.getElementById("logoContainer");
    const bingoLogo = document.getElementById("bingoLogo");
    if (bingoLogo && logoContainer) {
        bingoLogo.src = 'https://cdn.glitch.global/fecfc9cc-1e50-454e-a7d0-72e1b03260c4/public_cobblebingo.png?v=1748523580111';
        bingoLogo.onerror = () => {
            logoContainer.innerHTML = "<p style='color: white;'>Logo could not be loaded.</p>";
        };
        logoContainer.style.display = 'block';
    }

  } catch (error) {
    console.error("Error in generateBingo:", error);
    alert(`Error: ${error.message || "Failed to generate/load bingo card"}`);
    
    loadingSpinner.style.display = "none";
    bingoCardWrapper.style.display = "none";
    exportBtn.style.display = "none";
    document.querySelector(".controls-container").style.display = "flex";
    return;
  }
  
  loadingSpinner.style.display = "none";
  bingoCardWrapper.style.display = "flex";
  exportBtn.style.display = "inline-block";
  document.getElementById("postGenerationControls").style.display = "inline-flex";
  document.querySelector(".controls-container").style.display = "flex";
}

function generateNewCard() {
  const cardCodeElement = document.getElementById("cardCode");
  if (cardCodeElement) {
    cardCodeElement.value = "";
  }
  history.replaceState(null, null, window.location.pathname);
  document.body.removeAttribute("data-generated");
  generateBingo();
}

// --- THIS FUNCTION HAS BEEN REWRITTEN FOR RELIABILITY ---
async function renderBingoCard(selectedPokemon) {
  const bingoCard = document.getElementById("bingoGrid");
  const difficulty = document.getElementById("difficulty").value; // Still needed for non-center cells
  bingoCard.innerHTML = ""; // Clear the card before rendering

  const imageLoadPromises = [];

  selectedPokemon.forEach((pokemon, index) => {
    const cell = document.createElement("div");
    cell.className = "bingo-cell";
    const isLegendary = pokemon.rarity?.toLowerCase() === "legendary";

    // This function will render the shared HTML for any Pokémon cell
    const renderPokemonCell = (isCenter) => {
        if(isCenter) cell.classList.add("legendary-center");
        cell.style.cursor = "pointer";
        cell.addEventListener("click", (e) => {
            if (e.target.closest('.pokemon-img-link')) {
                 window.open(e.target.closest('.pokemon-img-link').href, "_blank");
                 return;
            }
            toggleCellCompletion(index);
        });

        setupTooltipEvents(cell, `Biome: ${pokemon.biome}`, isCenter);
        
        const wrapper = document.createElement("a");
        wrapper.className = "pokemon-img-link";
        wrapper.href = `https://cobblemon.tools/pokedex/pokemon/${pokemon.name.toLowerCase().replace(/\s+/g, "_")}`;
        wrapper.target = "_blank"; // Open in new tab
        wrapper.onclick = (e) => e.stopPropagation(); // Prevent card click when image is clicked

        const img = document.createElement("img");
        img.alt = pokemon.name;
        img.className = "pokemon-img";
        img.crossOrigin = "anonymous";
        
        const cobblemonUrl = `https://cobbledex.b-cdn.net/mons/large/${pokemon.name.toLowerCase().replace(/\s+/g, "_")}.webp`;
        img.src = cobblemonUrl;
        img.onerror = () => {
            if(pokemon.id) {
                img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
            } else {
                img.src = "";
                img.alt = `${pokemon.name} (Image not available)`;
            }
        };

        wrapper.appendChild(img);
        cell.appendChild(wrapper);

        const label = document.createElement("div");
        label.className = "pokemon-name";
        label.textContent = pokemon.name;
        cell.appendChild(label);

        if (pokemon.rarity) {
            const rarity = document.createElement("div");
            const rarityClass = pokemon.rarity.toLowerCase().replace(/\s+/g, "-");
            rarity.className = `rarity-badge ${rarityClass}`;
            rarity.textContent = pokemon.rarity.charAt(0).toUpperCase() + pokemon.rarity.slice(1);
            cell.appendChild(rarity);
        }
    };
    
    // --- NEW ROBUST LOGIC ---
    // First, check the center cell specifically by its data, not by difficulty
    if (index === 12) {
      if (isLegendary) {
        renderPokemonCell(true); // true indicates it's the center legendary
      } else {
        cell.textContent = "FREE";
        cell.style.backgroundColor = "#ffd700";
        cell.style.fontWeight = "bold";
        cell.style.fontSize = "18px";
        cell.style.color = "#000";
        // Free space is not clickable to toggle completion
      }
    } 
    // Then, handle other potential legendary cells (for Nightmare mode)
    else if (difficulty === 'nightmare' && isLegendary) {
      renderPokemonCell(false); // false indicates it's a non-center legendary
    } 
    // Finally, handle all other normal cells
    else {
      renderPokemonCell(false);
    }
    
    bingoCard.appendChild(cell);
  });
  
  // No need to await image promises here as onerror handles it
}


document.addEventListener("DOMContentLoaded", () => {
  setupColorSchemeSelector();
  setupCustomDifficultySelector();
  
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const session = urlParams.get("session");

  if (code) {
    const cardCodeInput = document.getElementById("cardCode");
    if (cardCodeInput) {
      cardCodeInput.value = code;
    }
    generateBingo();
  }
});

function drawBingoLine(cellIndices, lineType) {
  const grid = document.getElementById("bingoGrid");
  const line = document.createElement("div");
  line.className = "bingo-line";

  if (lineType === "horizontal") {
    line.classList.add("horizontal");
    const row = Math.floor(cellIndices[0] / 5);
    line.style.top = `${row * (130 + 8) + 65 - 3}px`;
  } else if (lineType === "vertical") {
    line.classList.add("vertical");
    const col = cellIndices[0] % 5;
    line.style.left = `${col * (100 + 8) + 50 - 3}px`;
  } else if (lineType === "diagonal-main") {
    line.classList.add("diagonal", "diagonal-main");
  } else if (lineType === "diagonal-anti") {
    line.classList.add("diagonal", "diagonal-anti");
  }

  grid.appendChild(line);
}

function showBingoMessage(count) {
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

  setTimeout(() => {
    message.remove();
  }, 4000);
}

let currentBingoCount = 0;

function checkForBingo() {
  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());

  const lines = [
    { indices: [0, 1, 2, 3, 4], type: "horizontal" }, { indices: [5, 6, 7, 8, 9], type: "horizontal" },
    { indices: [10, 11, 12, 13, 14], type: "horizontal" }, { indices: [15, 16, 17, 18, 19], type: "horizontal" },
    { indices: [20, 21, 22, 23, 24], type: "horizontal" }, { indices: [0, 5, 10, 15, 20], type: "vertical" },
    { indices: [1, 6, 11, 16, 21], type: "vertical" }, { indices: [2, 7, 12, 17, 22], type: "vertical" },
    { indices: [3, 8, 13, 18, 23], type: "vertical" }, { indices: [4, 9, 14, 19, 24], type: "vertical" },
    { indices: [0, 6, 12, 18, 24], type: "diagonal-main" }, { indices: [4, 8, 12, 16, 20], type: "diagonal-anti" },
  ];

  let bingoCount = 0;
  lines.forEach((line) => {
    if (line.indices.every((index) => completedCells[index])) {
      bingoCount++;
      drawBingoLine(line.indices, line.type);
    }
  });

  if (bingoCount > currentBingoCount) {
    const grid = document.getElementById("bingoGrid");
    grid.classList.add("bingo-celebration");
    setTimeout(() => {
      grid.classList.remove("bingo-celebration");
    }, 3000);
    showBingoMessage(bingoCount);
    console.log(`BINGO! ${bingoCount} line${bingoCount > 1 ? "s" : ""} completed!`);
  }
  currentBingoCount = bingoCount;
  return bingoCount;
}

let completedCells = Array(25).fill(false);

async function toggleCellCompletion(index) {
  const cells = document.querySelectorAll(".bingo-cell");
  const cell = cells[index];

  if (index === 12 && cell.textContent === "FREE") return;

  completedCells[index] = !completedCells[index];
  cell.classList.toggle("completed", completedCells[index]);
  
  cell.style.transform = "scale(0.95)";
  setTimeout(() => {
    cell.style.transform = "";
  }, 150);

  checkForBingo();
  
  if (!currentSessionId) {
    const cardCode = document.getElementById("cardCode").value;
    if (cardCode) {
      try {
        console.log("First interaction: creating session...");
        const sessionData = await initSession(cardCode);
        currentSessionId = sessionData.sessionId;

        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set("session", currentSessionId);
        history.pushState(null, '', currentUrl.toString());

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
        }

      } catch (error) {
        console.error("Failed to create session on first click:", error);
        alert("Warning: Could not create a session. Your progress will not be saved.");
        return;
      }
    }
  }
  
  if (currentSessionId) {
    updateSession(currentSessionId, completedCells);
  }
}

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
      useCORS: true, allowTaint: true, scale: 2, backgroundColor: null, logging: false,
      width: card.scrollWidth, height: card.scrollHeight,
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

function clearCompleted() {
  completedCells = Array(25).fill(false);
  currentBingoCount = 0;
  const centerCell = document.querySelector(".bingo-cell:nth-child(13)");
  if (centerCell && centerCell.textContent === "FREE") {
    completedCells[12] = true;
  }
  document.querySelectorAll(".bingo-cell").forEach((cell, index) => {
    cell.classList.toggle("completed", completedCells[index]);
    const existingCheckmark = cell.querySelector(".manual-checkmark");
    if (existingCheckmark) existingCheckmark.remove();
  });
  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());
  if (currentSessionId) {
    updateSession(currentSessionId, completedCells);
  }
}

function initializeCompletedCells() {
  const centerCell = document.querySelector(".bingo-cell:nth-child(13)");
  // Only auto-complete the FREE space if it's not a legendary cell
  if (centerCell && centerCell.textContent === "FREE") {
    completedCells[12] = true;
  }
  document.querySelectorAll('.bingo-cell').forEach((cell, index) => {
    cell.classList.toggle("completed", !!completedCells[index]);
  });
}

function cleanupTooltips() {
  removeActiveTooltip();
  document.querySelectorAll(".tooltip, .legendary-tooltip").forEach((tooltip) => {
    tooltip.remove();
  });
  document.querySelectorAll(".bingo-cell").forEach((cell) => {
    if (cell.tooltipCleanup) {
      cell.tooltipCleanup();
    }
  });
}

function createEnhancedParticles() {
    const particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) return;
    particlesContainer.innerHTML = '';
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const leftPosition = Math.random() * 100;
        particle.style.left = leftPosition + '%';
        const delay = Math.random() * 6;
        particle.style.animationDelay = `-${delay}s`;
        const duration = 5 + Math.random() * 3;
        particle.style.animationDuration = `${duration}s`;
        particlesContainer.appendChild(particle);
    }
}

document.addEventListener('DOMContentLoaded', createEnhancedParticles);
setInterval(createEnhancedParticles, 30000);
