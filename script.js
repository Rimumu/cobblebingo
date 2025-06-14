// Global val null
let currentSessionId = null;
let activeTooltip = null;

function showNotice(title, message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('notice-overlay');
        const titleEl = document.getElementById('notice-title');
        const messageEl = document.getElementById('notice-message');
        const closeBtn = document.getElementById('close-notice-btn');

        if (!overlay || !titleEl || !messageEl || !closeBtn) {
            alert(message);
            return resolve();
        }

        titleEl.textContent = title;
        messageEl.textContent = message;
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('visible'), 10);

        const removeListeners = () => {
            closeBtn.removeEventListener('click', closeHandler);
            document.removeEventListener('keydown', keydownHandler);
        };

        const closeHandler = () => {
            overlay.classList.remove('visible');
            removeListeners();
            setTimeout(() => {
                overlay.style.display = 'none';
                resolve();
            }, 300); // Match CSS transition time
        };
        
        const keydownHandler = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                closeHandler();
            }
        };

        closeBtn.addEventListener('click', closeHandler);
        document.addEventListener('keydown', keydownHandler);
    });
}

function promptForSessionName() {
    return new Promise((resolve, reject) => {
        const overlay = document.getElementById('save-session-overlay');
        const input = document.getElementById('session-name-input');
        const confirmBtn = document.getElementById('confirm-save-session-btn');
        const cancelBtn = document.getElementById('cancel-save-session-btn');
        
        if (!overlay || !input || !confirmBtn || !cancelBtn) {
            const name = prompt("Enter a name for this session:", "My Bingo Card");
            if (name) { resolve(name); } else { reject(); }
            return;
        }

        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('visible'), 10);
        
        input.value = `My Bingo Card - ${new Date().toLocaleDateString()}`;
        input.focus();
        input.select();

        const removeListeners = () => {
            confirmBtn.removeEventListener('click', confirmHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
            document.removeEventListener('keydown', keydownHandler);
        };

        const cleanup = () => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        };

        const confirmHandler = () => {
            const sessionName = input.value.trim();
            if (sessionName) {
                removeListeners();
                cleanup();
                resolve(sessionName);
            }
        };

        const cancelHandler = () => {
            removeListeners();
            cleanup();
            reject(); // Reject without an error for clean cancellation
        };

        const keydownHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmHandler();
            } else if (e.key === 'Escape') {
                cancelHandler();
            }
        };
        
        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', cancelHandler);
        document.addEventListener('keydown', keydownHandler);
    });
}


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
  if (!particlesContainer) return;
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

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            const selectedValue = option.getAttribute('data-value');
            originalSelect.value = selectedValue;
            triggerText.textContent = option.textContent;
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            customSelect.classList.remove('open');
        });
    });

    window.addEventListener('click', () => {
        if (customSelect.classList.contains('open')) {
            customSelect.classList.remove('open');
        }
    });
}

// Updated API Configuration for Frontend
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : 'https://cobblebingo-backend-production.up.railway.app';

console.log('Using API Base URL:', API_BASE_URL);

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
        errorMessage = `Server error: ${responseText.substring(0, 100)}...`;
      }
      console.error('API error response:', errorMessage);
      throw new Error(errorMessage);
    }

    return responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    throw error;
  }
}

async function generateAndStoreCard(selectedPokemon, selectedRarity) {
  try {
    const response = await apiCall("generate-card", {
      method: "POST",
      body: JSON.stringify({ rarity: selectedRarity, pokemon: selectedPokemon }),
    });
    if (!response.code) throw new Error('Server did not return a card code');
    return response.code;
  } catch (error) {
    console.error("Error generating card:", error);
    throw new Error(`Failed to generate card: ${error.message}`);
  }
}

async function retrieveCard(code) {
  try {
    const response = await apiCall(`get-card/${code}`);
    if (!response.cardData) throw new Error('Invalid card data received from server');
    return response;
  } catch (error) {
    console.error("Error retrieving card:", error);
    throw new Error(`Failed to retrieve card: ${error.message}`);
  }
}

async function initSession(cardCode) {
  try {
    const response = await apiCall("session/init", {
      method: "POST",
      body: JSON.stringify({ cardCode }),
    });
    if (!response.sessionId) throw new Error("Server did not return a session ID");
    return response;
  } catch (error) {
    console.error("Error initializing session:", error);
    throw new Error(`Failed to initialize session: ${error.message}`);
  }
}

async function getSession(sessionId) {
  try {
    const response = await apiCall(`session/${sessionId}`);
    if (!response.success) throw new Error(response.error || 'Failed to retrieve session data');
    return response;
  } catch (error) {
    console.error("Error retrieving session:", error);
    if (error.message.includes('not found')) return null;
    throw new Error(`Failed to retrieve session: ${error.message}`);
  }
}

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

async function fetchPokemonData() {
  const response = await fetch(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlLTA4Oe6Kzu-EQp_AS1wGs_PzLZ9GMIhWrgUDuXux18AYe7sg6B5LfrN0oRw63ZdyTr5rrDvM54ui/pub?output=csv",
  );
  const csvText = await response.text();
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const data = [];
  const seen = new Set();
  parsed.data.forEach((row) => {
    const name = row["Name"];
    if (!name || !row["ID"] || seen.has(name)) return;
    seen.add(name);
    data.push({
      name: name.trim(),
      biome: (row["Biome"] || '').trim(),
      rarity: (row["Rarity"] || '').trim(),
      id: row["ID"].trim().replace(/\D/g, ""),
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
    const byRarity = {
        common: pokemonList.filter((p) => p.rarity.toLowerCase() === "common"),
        uncommon: pokemonList.filter((p) => p.rarity.toLowerCase() === "uncommon"),
        rare: pokemonList.filter((p) => p.rarity.toLowerCase() === "rare"),
        "ultra-rare": pokemonList.filter((p) => p.rarity.toLowerCase() === "ultra-rare"),
        legendary: pokemonList.filter((p) => p.rarity.toLowerCase() === "legendary"),
    };

    let selected = [];

    const selectFromCategory = (category, count) => shuffle(byRarity[category]).slice(0, count);

    const compositions = {
        easy: { common: 15, uncommon: 9 },
        normal: { common: 2, uncommon: 8, rare: 8, "ultra-rare": 6 },
        hard: { rare: 15, "ultra-rare": 9 },
        common: { common: 24 },
        uncommon: { uncommon: 24 },
        rare: { rare: 24 },
        "ultra-rare": { "ultra-rare": 24 },
        insane: { "ultra-rare": 24, legendary: 1 },
        nightmare: { legendary: 5, "ultra-rare": 20 }
    };
    
    const composition = compositions[difficulty] || compositions.normal;

    for (const category in composition) {
        if (category !== 'legendary' || difficulty !== 'insane') {
             selected.push(...selectFromCategory(category, composition[category]));
        }
    }
    
    if(difficulty === 'insane') {
        const legendaryPokemon = selectFromCategory('legendary', 1)[0];
        selected.splice(12, 0, legendaryPokemon || { name: "LEGENDARY", rarity: "legendary", biome: "Legendary", id: "0" });
    } else if(difficulty === 'nightmare') {
        const centerLegendary = selected.splice(0, 1)[0]; 
        selected = shuffle(selected);
        selected.splice(12, 0, centerLegendary);
    }
    
    const targetCount = (difficulty === 'insane' || difficulty === 'nightmare') ? 25 : 24;
    while(selected.length < targetCount) {
        selected.push(selectFromCategory('uncommon', 1)[0]);
    }
    
    return selected.slice(0, targetCount);
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
fetchPokemonData().then((data) => { pokemonData = data; });

async function imageToBase64(imgElement) {
  return new Promise((resolve) => {
    if (!imgElement.src || imgElement.src === "") return resolve("");
    const canvas = document.createElement("canvas");
    canvas.width = imgElement.naturalWidth || imgElement.width || 150;
    canvas.height = imgElement.naturalHeight || imgElement.height || 150;
    try {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgElement, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    } catch (error) {
      console.warn("Could not convert image to base64:", error);
      resolve("");
    }
  });
}

async function generateBingo() {
  const loadingSpinner = document.getElementById("loadingSpinner");
  const bingoCardWrapper = document.getElementById("bingoCard");
  const exportBtn = document.getElementById("exportBtn");
  const cardCodeInput = document.getElementById("cardCode").value.trim().toUpperCase();

  loadingSpinner.style.display = "flex";
  bingoCardWrapper.style.display = "none";
  exportBtn.style.display = "none";
  document.querySelector(".controls-container").style.display = "none";
  document.getElementById("bingoGrid").innerHTML = "";
  
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
          document.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
          selectedOption.classList.add('selected');
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
    
    await renderBingoCard(cardData.cardData.pokemon, difficultyToUse); 
    initializeCompletedCells();
    checkForBingo();

  } catch (error) {
    console.error("Error in generateBingo:", error);
    alert(`Error: ${error.message || "Failed to generate/load bingo card"}`);
  } finally {
      loadingSpinner.style.display = "none";
      bingoCardWrapper.style.display = "flex";
      exportBtn.style.display = "inline-block";
      document.getElementById("postGenerationControls").style.display = "inline-flex";
      document.querySelector(".controls-container").style.display = "flex";
  }
}

function generateNewCard() {
  document.getElementById("cardCode").value = "";
  history.replaceState(null, null, window.location.pathname);
  generateBingo();
}

async function renderBingoCard(selectedPokemon, difficulty) {
    const bingoCard = document.getElementById("bingoGrid");
    bingoCard.innerHTML = ""; // Clear the card before rendering

    const imageLoadPromises = [];

    // Count the number of legendary Pokémon to create a reliable styling rule,
    // as the 'difficulty' string can be unreliable when loading saved cards.
    const legendaryCount = selectedPokemon.filter(p => p.rarity?.toLowerCase() === 'legendary').length;

    // This is a helper function to avoid repeating rendering logic
    const createPokemonCell = (cell, pokemon, isLegendaryStyled) => {
        if (isLegendaryStyled) {
            cell.classList.add("legendary-styled");
        }
        
        cell.style.cursor = "pointer";
        cell.addEventListener("click", () => {
            const index = Array.from(bingoCard.children).indexOf(cell);
            toggleCellCompletion(index);
        });

        setupTooltipEvents(cell, `Biome: ${pokemon.biome}`, isLegendaryStyled);
        
        const wrapper = document.createElement("a");
        wrapper.className = "pokemon-img-link";
        wrapper.href = `https://cobblemon.tools/pokedex/pokemon/${pokemon.name.toLowerCase().replace(/\s+/g, "_")}`;
        wrapper.target = "_blank";
        wrapper.onclick = (e) => e.stopPropagation();

        const img = document.createElement("img");
        img.alt = pokemon.name;
        img.className = "pokemon-img";
        img.crossOrigin = "anonymous";
        
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

        // --- Robust Image Fallback Logic ---
        const loadPromise = new Promise(async (resolve) => {
            const cobblemonUrl = `https://cobbledex.b-cdn.net/mons/large/${pokemon.name.toLowerCase().replace(/\s+/g, "_")}.webp`;
            try {
                const response = await fetch(cobblemonUrl);
                if (!response.ok) throw new Error('Cobbledex image not found.');
                const blob = await response.blob();
                // Check if the image is the Cobbledex placeholder
                const PLACEHOLDER_SIZE_MIN = 2160;
                const PLACEHOLDER_SIZE_MAX = 2180;
                if (blob.size >= PLACEHOLDER_SIZE_MIN && blob.size <= PLACEHOLDER_SIZE_MAX) {
                    throw new Error("Placeholder image detected");
                }
                const objectUrl = URL.createObjectURL(blob);
                img.src = objectUrl;
                img.onload = () => URL.revokeObjectURL(objectUrl);
            } catch (error) {
                console.warn(`Cobbledex failed for ${pokemon.name}, falling back to PokeAPI.`);
                if (pokemon.id) {
                    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
                } else {
                    img.src = "";
                    img.alt = `${pokemon.name} (Image not available)`;
                }
            }
            // Use event listeners to resolve the promise, ensuring it always completes
            const finalResolve = () => resolve();
            img.addEventListener('load', finalResolve, { once: true });
            img.addEventListener('error', finalResolve, { once: true });
        });
        imageLoadPromises.push(loadPromise);
    };

    selectedPokemon.forEach((pokemon, index) => {
        const cell = document.createElement("div");
        cell.className = "bingo-cell";
        const isLegendary = pokemon.rarity?.toLowerCase() === 'legendary';

        // Determine if the special legendary styling should be applied based on the data itself.
        let styleAsLegendary = false;
        if (isLegendary) {
            // If there are 5+ legendaries, it's a Nightmare-style card. Style all of them.
            if (legendaryCount >= 5) {
                styleAsLegendary = true;
            } 
            // If there's 1 legendary, it's an Insane-style card. Only style it if it's in the center.
            else if (legendaryCount === 1 && index === 12) {
                styleAsLegendary = true;
            }
        }
        
        // Handle the "Free Space" cell separately
        if (index === 12 && pokemon.name === 'Free Space') {
            cell.textContent = "FREE";
            cell.style.backgroundColor = "#ffd700";
            cell.style.fontWeight = "bold";
            cell.style.fontSize = "18px";
            cell.style.color = "#000";
        } else {
            // For all Pokémon cells (including legendary ones), use the helper
            createPokemonCell(cell, pokemon, styleAsLegendary);
        }
        
        bingoCard.appendChild(cell);
    });

    await Promise.all(imageLoadPromises);
}


document.addEventListener("DOMContentLoaded", () => {
  setupColorSchemeSelector();
  setupCustomDifficultySelector();
  
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  if (code) {
    document.getElementById("cardCode").value = code;
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
  }
  currentBingoCount = bingoCount;
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
              try {
                  const sessionName = await promptForSessionName();
                  // This part only runs if the user clicks "Save"
                  await saveSession(currentSessionId, sessionName, token);
                  await showNotice('Session Saved!', `Your bingo session has been successfully saved as "${sessionName}".`);
              } catch (error) {
                  // This block runs if the user clicks "Cancel" or an error occurs
                  if (error && error.message) {
                    // This handles actual errors from the saveSession call
                    await showNotice('Error', `Could not save session: ${error.message}`);
                  } else {
                    // If 'error' is undefined, it means the user just canceled the prompt, so we do nothing.
                    console.log("Save session cancelled.");
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
  if (!card) return alert("No bingo card to export. Please generate a card first.");
  const exportBtn = document.getElementById("exportBtn");
  exportBtn.textContent = "Exporting...";
  exportBtn.disabled = true;
  try {
    const images = card.querySelectorAll("img");
    for (const img of images) {
      if (img.src && !img.src.startsWith("data:")) {
        try {
          const base64 = await imageToBase64(img);
          if (base64) img.src = base64;
        } catch (error) {
          console.warn("Failed to convert image to base64:", error);
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    const canvas = await html2canvas(card, {
      useCORS: true, allowTaint: true, scale: 2, backgroundColor: null, logging: false
    });
    const link = document.createElement("a");
    link.download = `cobblemon_bingo_card_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  } catch (error) {
    console.error("Error exporting card:", error);
    alert("Error exporting card. Please try again.");
  } finally {
    exportBtn.textContent = "Export Card as PNG";
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
  });
  document.querySelectorAll(".bingo-line").forEach((el) => el.remove());
  if (currentSessionId) {
    updateSession(currentSessionId, completedCells);
  }
}

function initializeCompletedCells() {
  const centerCell = document.querySelector(".bingo-cell:nth-child(13)");
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
    if (cell.tooltipCleanup) cell.tooltipCleanup();
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
