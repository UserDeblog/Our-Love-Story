/* =========================================
   OUR LOVE CHRONICLE
   JavaScript
========================================= */


/* =========================================
   DATA DO RELACIONAMENTO
========================================= */

// Início da contagem: 3 de abril de 2026, à meia-noite no horário local.
const relationshipStart = new Date(2026, 3, 3, 0, 0, 0, 0);


/* =========================================
   CONTADOR
========================================= */

function updateLoveCounter() {
    const now = new Date();
    const elapsedMs = Math.max(0, now.getTime() - relationshipStart.getTime());
    let cursor = new Date(relationshipStart);

    let years = now.getFullYear() - cursor.getFullYear();
    cursor.setFullYear(cursor.getFullYear() + years);
    if (cursor > now) {
        years--;
        cursor = new Date(relationshipStart);
        cursor.setFullYear(cursor.getFullYear() + years);
    }

    let months = (now.getFullYear() - cursor.getFullYear()) * 12 + now.getMonth() - cursor.getMonth();
    cursor.setMonth(cursor.getMonth() + months);
    if (cursor > now) {
        months--;
        cursor = new Date(relationshipStart);
        cursor.setFullYear(cursor.getFullYear() + years);
        cursor.setMonth(cursor.getMonth() + months);
    }

    const dayNumber = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
    const days = Math.max(0, Math.floor(dayNumber(now) - dayNumber(cursor)));
    cursor.setDate(cursor.getDate() + days);
    let remainingMs = Math.max(0, now.getTime() - cursor.getTime());
    const hours = Math.floor(remainingMs / 3600000);
    remainingMs %= 3600000;
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);

    const duration = [];
    if (years) duration.push(`${years} ${years === 1 ? "ANO" : "ANOS"}`);
    if (months) duration.push(`${months} ${months === 1 ? "MÊS" : "MESES"}`);
    duration.push(`${days} ${days === 1 ? "DIA" : "DIAS"}`);

    document.getElementById("loveCounter").textContent = duration.join(" · ");
    document.getElementById("loveCounterTime").textContent =
        `${String(hours).padStart(2, "0")} H · ${String(minutes).padStart(2, "0")} MIN · ${String(seconds).padStart(2, "0")} SEG`;
    const compactDate = new Intl.DateTimeFormat("pt-BR", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric"
    }).format(now).replace(/\./g, "").toLocaleUpperCase("pt-BR");
    document.getElementById("currentDate").textContent = `${compactDate} · NOSSO JORNAL`;
}

updateLoveCounter();
window.setInterval(updateLoveCounter, 1000);

const themeToggle = document.getElementById("themeToggle");
const savedTheme = (() => { try { return localStorage.getItem("loveChronicleTheme"); } catch (_) { return null; } })();
function setPageTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Ativar modo claro" : "Ativar modo escuro");
    themeToggle.querySelector("span").textContent = isDark ? "☀" : "☾";
    try { localStorage.setItem("loveChronicleTheme", isDark ? "dark" : "light"); } catch (_) {}
}
setPageTheme(savedTheme === "dark");
themeToggle.addEventListener("click", () => {
    const nextIsDark = !document.body.classList.contains("dark-mode");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { setPageTheme(nextIsDark); return; }

    const bounds = themeToggle.getBoundingClientRect();
    document.documentElement.style.setProperty("--theme-origin-x", `${bounds.left + bounds.width / 2}px`);
    document.documentElement.style.setProperty("--theme-origin-y", `${bounds.top + bounds.height / 2}px`);
    themeToggle.classList.add("is-changing");

    if (typeof document.startViewTransition === "function") {
        const transition = document.startViewTransition(() => setPageTheme(nextIsDark));
        const cleanupTransition = () => {
            themeToggle.classList.remove("is-changing");
            document.documentElement.style.removeProperty("--theme-origin-x");
            document.documentElement.style.removeProperty("--theme-origin-y");
        };
        transition.finished.then(cleanupTransition, cleanupTransition);
    } else {
        document.body.classList.add("theme-is-changing");
        window.setTimeout(() => setPageTheme(nextIsDark), 280);
        window.setTimeout(() => {
            themeToggle.classList.remove("is-changing");
            document.body.classList.remove("theme-is-changing");
            document.documentElement.style.removeProperty("--theme-origin-x");
            document.documentElement.style.removeProperty("--theme-origin-y");
        }, 800);
    }
});

const loveIntro = document.getElementById("loveIntro");
const enterLoveSiteButton = document.getElementById("enterLoveSite");
enterLoveSiteButton.focus({ preventScroll: true });
enterLoveSiteButton.addEventListener("click", () => {
    loveIntro.classList.add("is-leaving");
    loveIntro.setAttribute("aria-hidden", "true");
    document.body.classList.remove("intro-active");
    window.setTimeout(() => {
        loveIntro.hidden = true;
        document.querySelector(".nav-btn.active")?.focus({ preventScroll: true });
    }, 700);
});


/* =========================================
   MIXER DE MÚSICA DE FUNDO
========================================= */

const backgroundTracks = [];
const musicFolderApi = "https://api.github.com/repos/UserDeblog/Our-Love-Story/git/trees/master?recursive=1";
const musicFolderPath = "music/music/";
const MUSIC_PAGE_SIZE = 8;
const MUSIC_PLAYLISTS = ["Animadas", "Calmas", "Piano", "Românticas"];

const backgroundMusic = document.getElementById("backgroundMusic");
backgroundMusic.crossOrigin = "anonymous";
const musicTrackSelect = document.getElementById("musicTrackSelect");
const musicPlaylistSelect = document.getElementById("musicPlaylistSelect");
const musicPagination = document.getElementById("musicPagination");
const musicPlayPause = document.getElementById("musicPlayPause");
const musicStatus = document.getElementById("musicStatus");
const musicMixer = document.getElementById("musicMixer");
const musicMixerPanel = document.getElementById("musicMixerPanel");
const musicMixerToggle = document.getElementById("musicMixerToggle");
let currentTrackIndex = 0;
let currentMusicPage = 1;
let activePlaylist = "all";
let musicAudioContext = null;
let musicGainNode = null;
let musicMediaSource = null;

function getMusicVolume() {
    return Number(document.getElementById("musicVolume").value);
}

function setupMusicVolume() {
    if (musicGainNode) return true;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    try {
        musicAudioContext = new AudioContextClass();
        musicMediaSource = musicAudioContext.createMediaElementSource(backgroundMusic);
        musicGainNode = musicAudioContext.createGain();
        musicGainNode.gain.value = getMusicVolume();
        musicMediaSource.connect(musicGainNode);
        musicGainNode.connect(musicAudioContext.destination);
        return true;
    } catch (error) {
        console.warn("Controle de ganho de áudio indisponível neste navegador.", error);
        musicAudioContext = null;
        musicGainNode = null;
        musicMediaSource = null;
        return false;
    }
}

function applyMusicVolume(value) {
    const volume = Math.min(1, Math.max(0, Number(value)));
    if (musicGainNode && musicAudioContext) {
        musicGainNode.gain.setTargetAtTime(volume, musicAudioContext.currentTime, 0.015);
    } else {
        // Fallback para navegadores sem Web Audio.
        backgroundMusic.volume = volume;
    }
}

function setMusicPlaying(isPlaying) {
    musicMixer.classList.toggle("is-playing", isPlaying);
    musicPlayPause.innerHTML = isPlaying
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h3v12H8zM15 6h3v12h-3z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 10 6-10 6V6Z"/></svg>';
    musicPlayPause.setAttribute("aria-label", isPlaying ? "Pausar música" : "Tocar música");
    musicPlayPause.title = isPlaying ? "Pausar música" : "Tocar música";
}

musicMixerToggle.addEventListener("click", () => {
    const isOpen = musicMixer.classList.toggle("is-open");
    musicMixer.classList.toggle("is-collapsed", !isOpen);
    musicMixerToggle.setAttribute("aria-expanded", String(isOpen));
    musicMixerToggle.setAttribute("aria-label", `${isOpen ? "Fechar" : "Abrir"} mixer de música`);
    musicMixerToggle.title = `${isOpen ? "Fechar" : "Abrir"} mixer de música`;
    musicMixerPanel.setAttribute("aria-hidden", String(!isOpen));
});

document.getElementById("memoryFile")?.addEventListener("change", event => {
    const file = event.currentTarget.files?.[0];
    const fileName = document.getElementById("memoryFileName");
    if (fileName) fileName.textContent = file?.name || "Nenhum arquivo escolhido";
});

function getVisiblePlaylistTracks() {
    return activePlaylist === "all"
        ? backgroundTracks
        : backgroundTracks.filter(track => track.playlist === activePlaylist);
}

function renderMusicTrackOptions() {
    const tracks = getVisiblePlaylistTracks();
    const pageCount = Math.max(1, Math.ceil(tracks.length / MUSIC_PAGE_SIZE));
    currentMusicPage = Math.min(Math.max(currentMusicPage, 1), pageCount);
    const firstTrack = (currentMusicPage - 1) * MUSIC_PAGE_SIZE;
    const pageTracks = tracks.slice(firstTrack, firstTrack + MUSIC_PAGE_SIZE);
    musicTrackSelect.replaceChildren(...pageTracks.map((track, index) => {
        const label = activePlaylist === "all" && track.playlist !== "Geral"
            ? `${track.title} · ${track.playlist}`
            : track.title;
        return new Option(label, String(firstTrack + index));
    }));
    musicTrackSelect.disabled = pageTracks.length === 0;
    musicPagination.replaceChildren();
    for (let page = 1; page <= pageCount; page++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `music-page-button${page === currentMusicPage ? " active" : ""}`;
        button.textContent = String(page);
        button.setAttribute("aria-label", `Página ${page} das músicas`);
        button.setAttribute("aria-current", page === currentMusicPage ? "page" : "false");
        button.addEventListener("click", () => {
            currentMusicPage = page;
            renderMusicTrackOptions();
            const firstIndex = (page - 1) * MUSIC_PAGE_SIZE;
            musicTrackSelect.value = String(currentTrackIndex >= firstIndex && currentTrackIndex < firstIndex + MUSIC_PAGE_SIZE
                ? currentTrackIndex
                : firstIndex);
        });
        musicPagination.append(button);
    }
    musicPagination.hidden = pageCount <= 1;
}

function loadBackgroundTrack(index, shouldPlay = false) {
    const tracks = getVisiblePlaylistTracks();
    if (!tracks.length) return;
    currentTrackIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentTrackIndex];
    currentMusicPage = Math.floor(currentTrackIndex / MUSIC_PAGE_SIZE) + 1;
    renderMusicTrackOptions();
    musicTrackSelect.value = String(currentTrackIndex);
    backgroundMusic.src = track.url || `music/music/${track.file.split("/").map(encodeURIComponent).join("/")}`;
    backgroundMusic.load();
    musicStatus.textContent = track.title;
    if (shouldPlay) playBackgroundMusic();
}

async function playBackgroundMusic() {
    if (!backgroundTracks.length) return;
    try {
        if (setupMusicVolume() && musicAudioContext.state === "suspended") {
            await musicAudioContext.resume();
        }
        await backgroundMusic.play();
        setMusicPlaying(true);
        musicStatus.textContent = `Tocando: ${getVisiblePlaylistTracks()[currentTrackIndex]?.title || "Música"}`;
    } catch (error) {
        setMusicPlaying(false);
        musicStatus.textContent = "Toque em play para começar";
    }
}

function pauseBackgroundMusic() {
    backgroundMusic.pause();
    setMusicPlaying(false);
    musicStatus.textContent = `Pausado: ${getVisiblePlaylistTracks()[currentTrackIndex]?.title || "Música"}`;
}

document.getElementById("musicPrevious").addEventListener("click", () => {
    loadBackgroundTrack(currentTrackIndex - 1, !backgroundMusic.paused);
});
document.getElementById("musicNext").addEventListener("click", () => {
    loadBackgroundTrack(currentTrackIndex + 1, !backgroundMusic.paused);
});
musicTrackSelect.addEventListener("change", () => {
    loadBackgroundTrack(Number(musicTrackSelect.value), true);
});
musicPlaylistSelect.addEventListener("change", () => {
    activePlaylist = musicPlaylistSelect.value;
    currentMusicPage = 1;
    currentTrackIndex = 0;
    renderMusicTrackOptions();
    const tracks = getVisiblePlaylistTracks();
    if (tracks.length) loadBackgroundTrack(0, true);
    else {
        backgroundMusic.pause();
        setMusicPlaying(false);
        musicStatus.textContent = "Adicione músicas a esta pasta para ouvir a playlist";
    }
});
musicPlayPause.addEventListener("click", () => {
    if (backgroundMusic.paused) playBackgroundMusic();
    else pauseBackgroundMusic();
});
document.getElementById("musicVolume").addEventListener("input", event => {
    applyMusicVolume(event.target.value);
    try { localStorage.setItem("loveChronicleMusicVolume", event.target.value); } catch (_) {}
});
backgroundMusic.addEventListener("ended", () => {
    if (getVisiblePlaylistTracks().length) loadBackgroundTrack(currentTrackIndex + 1, true);
});
backgroundMusic.addEventListener("error", () => {
    const track = getVisiblePlaylistTracks()[currentTrackIndex];
    musicStatus.textContent = `Não foi possível carregar: ${track?.title || "esta música"}`;
    console.error("Falha ao carregar faixa de áudio.", track, backgroundMusic.error);
});

const savedMusicVolume = (() => {
    try { return localStorage.getItem("loveChronicleMusicVolume"); } catch (_) { return null; }
})();
if (savedMusicVolume !== null) document.getElementById("musicVolume").value = savedMusicVolume;
applyMusicVolume(getMusicVolume());

async function loadBackgroundPlaylist() {
    musicStatus.textContent = "Carregando músicas…";
    musicTrackSelect.disabled = true;
    musicPlaylistSelect.disabled = true;
    document.getElementById("musicPrevious").disabled = true;
    document.getElementById("musicNext").disabled = true;
    musicPlayPause.disabled = true;
    try {
        const response = await fetch(musicFolderApi, {
            headers: { Accept: "application/vnd.github+json" }
        });
        if (!response.ok) throw new Error(`GitHub API respondeu ${response.status}`);
        const repositoryTree = await response.json();
        if (!Array.isArray(repositoryTree.tree)) throw new Error("A árvore de arquivos do repositório não está disponível.");
        const audioExtensions = new Set(["mp3", "m4a", "ogg", "wav", "aac", "flac"]);
        const folderEntries = repositoryTree.tree.filter(entry => entry.path.startsWith(musicFolderPath));
        const audioFiles = folderEntries
            .filter(entry => entry.type === "blob" && audioExtensions.has(entry.path.split(".").pop().toLowerCase()));
        const githubAudioUrl = path => `https://raw.githubusercontent.com/UserDeblog/Our-Love-Story/master/${path.split("/").map(encodeURIComponent).join("/")}`;
        const directoryNames = [...new Set([
            ...MUSIC_PLAYLISTS,
            ...folderEntries.filter(entry => entry.type === "tree")
                .map(entry => entry.path.slice(musicFolderPath.length).split("/")[0])
        ])];
        backgroundTracks.push(...audioFiles
            .map(file => {
                const relativePath = file.path.slice(musicFolderPath.length);
                const segments = relativePath.split("/");
                return {
                    file: relativePath,
                    url: githubAudioUrl(file.path),
                    playlist: segments.length > 1 ? segments[0] : "Geral"
                };
            })
            .filter(Boolean));
        backgroundTracks.forEach(track => {
            track.title = track.file.split("/").pop().replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")
                .replace(/\b[a-z]/g, letter => letter.toUpperCase());
        });
        backgroundTracks.sort((a, b) => a.playlist.localeCompare(b.playlist, "pt-BR", { sensitivity: "base" })
            || a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }));
        if (!backgroundTracks.length) throw new Error("Nenhum arquivo de áudio foi encontrado em music/music.");

        const playlistNames = [...new Set(["Geral", ...directoryNames])];
        musicPlaylistSelect.replaceChildren(new Option("Todas as músicas", "all"),
            ...playlistNames.map(name => new Option(name, name)));
        activePlaylist = "all";
        musicPlaylistSelect.value = activePlaylist;
        renderMusicTrackOptions();
        musicTrackSelect.disabled = false;
        musicPlaylistSelect.disabled = false;
        document.getElementById("musicPrevious").disabled = false;
        document.getElementById("musicNext").disabled = false;
        musicPlayPause.disabled = false;
        loadBackgroundTrack(0);
    } catch (error) {
        console.error("Não foi possível listar as músicas no GitHub.", error);
        musicStatus.textContent = "Não consegui carregar as músicas do GitHub";
    }
}

loadBackgroundPlaylist();

document.addEventListener("pointerdown", event => {
    if (event.target.closest(".music-mixer")) return;
    if (backgroundMusic.paused && backgroundTracks.length) playBackgroundMusic();
});


/* =========================================
   CARROSSEL DE LEMBRANÇAS DA CAPA
========================================= */

const memories = [
    {
        image: "images/foto1.jpg",
        title: "UM DOS DIAS QUE PASSAMOS MAIS TEMPO JUNTOS",
        comment: "Dizem que alguns minutos mudam tudo, e mudam mesmo. A nossa realidade se transforma em momentos quando passamos tempo de qualidade juntos."
    },
    {
        image: "images/foto2.jpg",
        title: "VIMOS O PÔR DO SOL JUNTOS",
        comment: "Foi um dia que a gente foi no mirante, no quebrando silencio. Vimos o pôr do sol juntos. Primeira vez que a gente viu um pôr do sol juntos."
    },
    {
        image: "images/foto3.jpg",
        title: "MINHA MÃE TIROU A FOTO DA GENTE",
        comment: "Tentando ficar charmosos, mas a gente não consegue, e minha mãe não ajuda. Mas mesmo assim, a gente se ama e isso é o que importa."
    },
    {
        image: "images/foto4.jpg",
        title: "DIA NA IGREJA COM A GABI",
        comment: "Foi um dia que a gente foi na igreja, e a gente se divertiu muito."
    },
    {
        image: "images/foto5.jpg",
        title: "FUI NA CASA DA GABI",
        comment: "Algumas memórias não precisam de grandes acontecimentos. Estar junto já faz qualquer momento valer a pena."
    },
    {
        image: "images/foto6.jpg",
        title: "NÓS DOIS, FAZENDO GRACINHA",
        comment: "Estarmos juntos já é motivo suficiente para transformar qualquer dia em uma lembrança especial."
    }
];
const originalMemories = memories.slice();
const MEMORY_CAROUSEL_LIMIT = 6;
const GALLERY_PAGE_SIZE = 24;
const NEWS_PAGE_SIZE = 6;

function refreshMemoryCarousel(preferredMemoryId = null) {
    const carouselMemories = uploadedMemories
        .filter(memory => Boolean(memory.comment?.trim()))
        .slice(0, MEMORY_CAROUSEL_LIMIT);
    const carousel = [
        ...carouselMemories,
        ...originalMemories.slice(0, MEMORY_CAROUSEL_LIMIT - carouselMemories.length)
    ];
    memories.splice(0, memories.length, ...carousel);
    const preferredIndex = preferredMemoryId
        ? memories.findIndex(memory => memory.id === preferredMemoryId)
        : -1;
    memoryIndex = preferredIndex >= 0 ? preferredIndex : Math.min(memoryIndex, memories.length - 1);
    buildMemoryDots();
    showMemory(memoryIndex);
}

const supabaseClient = window.supabase?.createClient(
    window.SUPABASE_CONFIG?.url,
    window.SUPABASE_CONFIG?.publishableKey
);
let uploadedMemories = [];
let galleryAdminUser = null;
let galleryAdminIsAllowed = false;

/* =========================================
   CARTINHAS, MAPA E CHECKLIST DO CASAL
========================================= */

const plansStorageKeys = {
    letters: "loveChronicleLetters",
    places: "loveChroniclePlaces",
    checklist: "loveChronicleChecklist"
};
const planData = Object.fromEntries(Object.entries(plansStorageKeys).map(([key, storageKey]) => {
    try { return [key, JSON.parse(localStorage.getItem(storageKey) || "[]")]; }
    catch (_) { return [key, []]; }
}));
planData.capsules = [];
let selectedMapPoint = null;
let editingLetterId = null;
let editingPlaceId = null;
let activeLetterDetail = null;
let lovePlacesMap = null;
let lovePlacesMapReady = false;
let selectedPointMarker = null;
let taubateDefaultMarker = null;
let lovePlaceMarkers = [];
const todayISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
document.getElementById("letterOpenDate").min = todayISO();

const taubateStartingPoint = { longitude: -45.5553, latitude: -23.0264 };
selectedMapPoint = taubateStartingPoint;
document.getElementById("placeName").value = "Taubaté, São Paulo, Brasil";
document.getElementById("placeCoordinates").textContent = "Ponto inicial selecionado em Taubaté, São Paulo. Você pode mudar o ponto tocando no globo.";

function initializeLovePlacesMap() {
    const maplibregl = window.maplibregl;
    if (!maplibregl || lovePlacesMap) return;
    lovePlacesMap = new maplibregl.Map({
        container: "loveMapCanvas",
        style: {
            version: 8,
            sources: {
                imagery: {
                    type: "raster",
                    tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
                    tileSize: 256,
                    maxzoom: 19,
                    attribution: "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community"
                }
            },
            layers: [{ id: "world-imagery", type: "raster", source: "imagery" }]
        },
        center: [taubateStartingPoint.longitude, taubateStartingPoint.latitude],
        zoom: 2.1,
        maxZoom: 18,
        minZoom: 1.2,
        attributionControl: { compact: false }
    });
    lovePlacesMap.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    lovePlacesMap.on("style.load", () => lovePlacesMap.setProjection({ type: "globe" }));
    lovePlacesMap.on("moveend", () => { if (lovePlacesMapReady) renderPlaceMarkers(); });
    lovePlacesMap.on("resize", () => { if (lovePlacesMapReady) renderPlaceMarkers(); });
    lovePlacesMap.on("click", event => {
        selectedMapPoint = { longitude: Number(event.lngLat.lng.toFixed(5)), latitude: Number(event.lngLat.lat.toFixed(5)) };
        if (taubateDefaultMarker) { taubateDefaultMarker.remove(); taubateDefaultMarker = null; }
        document.getElementById("placeCoordinates").textContent = `Ponto selecionado: ${selectedMapPoint.latitude}°, ${selectedMapPoint.longitude}°. Dê um nome ao lugar ou mantenha Taubaté.`;
        if (selectedPointMarker) selectedPointMarker.remove();
        selectedPointMarker = new maplibregl.Marker({ color: "#dc6e86" }).setLngLat([selectedMapPoint.longitude, selectedMapPoint.latitude]).addTo(lovePlacesMap);
    });
    lovePlacesMap.on("error", event => {
        console.warn("Não foi possível carregar o mundo, da uma atualizada ai bb.", event.error);
        if (!lovePlacesMapReady) {
            document.getElementById("mapLoading").hidden = false;
            document.getElementById("mapLoading").textContent = "O globo não carregou bb, Fala com o Samuel kk.";
        }
    });
    lovePlacesMap.once("load", () => {
        lovePlacesMapReady = true;
        document.getElementById("mapLoading").hidden = true;
        renderPlaces();
    });
}

window.addEventListener("maplibre-ready", initializeLovePlacesMap, { once: true });
if (window.maplibregl) initializeLovePlacesMap();
document.getElementById("mapGoTaubate").addEventListener("click", () => {
    selectedMapPoint = taubateStartingPoint;
    document.getElementById("placeName").value = "Taubaté, São Paulo, Brasil";
    document.getElementById("placeCoordinates").textContent = "Ponto inicial selecionado em Taubaté, São Paulo. Fofinha, vc pode mudar o ponto tocando no globo.";
    lovePlacesMap?.flyTo({ center: [taubateStartingPoint.longitude, taubateStartingPoint.latitude], zoom: 9, essential: true });
    if (selectedPointMarker) selectedPointMarker.remove(); selectedPointMarker = null;
    if (lovePlacesMapReady) renderPlaces();
});

const mapFullscreenButton = document.getElementById("mapFullscreenButton");
const loveMapContainer = document.getElementById("loveMap");
function updateMapFullscreenState() {
    const active = document.fullscreenElement === loveMapContainer || loveMapContainer.classList.contains("is-fullscreen");
    mapFullscreenButton.textContent = active ? "× Sair da tela cheia" : "⛶ Tela cheia";
    mapFullscreenButton.setAttribute("aria-pressed", String(active));
    document.body.classList.toggle("map-fullscreen-open", active);
    window.setTimeout(() => lovePlacesMap?.resize(), 80);
}
mapFullscreenButton.addEventListener("click", async () => {
    if (document.fullscreenElement === loveMapContainer || loveMapContainer.classList.contains("is-fullscreen")) {
        if (document.fullscreenElement) await document.exitFullscreen?.();
        else loveMapContainer.classList.remove("is-fullscreen");
        updateMapFullscreenState();
        return;
    }
    if (loveMapContainer.requestFullscreen) {
        try { await loveMapContainer.requestFullscreen(); }
        catch (_) { loveMapContainer.classList.add("is-fullscreen"); }
    } else loveMapContainer.classList.add("is-fullscreen");
    updateMapFullscreenState();
});
document.addEventListener("fullscreenchange", updateMapFullscreenState);

const addressSearchCacheKey = "loveChronicleAddressSearchCache";
let lastAddressSearchAt = 0;
document.getElementById("searchPlaceAddress").addEventListener("click", async () => {
    const query = document.getElementById("placeAddress").value.trim();
    const status = document.getElementById("addressSearchStatus");
    const resultsWrap = document.getElementById("addressResultsWrap");
    const resultsSelect = document.getElementById("addressResults");
    if (!query) { status.textContent = "Digite uma cidade ou lugar para buscar bb."; return; }
    const button = document.getElementById("searchPlaceAddress");
    button.disabled = true; status.textContent = "Buscando opções fofa…"; resultsWrap.hidden = true;
    try {
        let cache = {};
        try { cache = JSON.parse(localStorage.getItem(addressSearchCacheKey) || "{}"); } catch (_) {}
        const cacheKey = query.toLocaleLowerCase("pt-BR");
        let found = cache[cacheKey];
        if (!found) {
            const wait = Math.max(0, 1100 - (Date.now() - lastAddressSearchAt));
            if (wait) await new Promise(resolve => window.setTimeout(resolve, wait));
            lastAddressSearchAt = Date.now();
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`;
            const response = await fetch(url, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error("Busca indisponível");
            found = await response.json();
            cache[cacheKey] = found;
            try { localStorage.setItem(addressSearchCacheKey, JSON.stringify(cache)); } catch (_) {}
        }
        if (!found.length) { status.textContent = "Nenhum resultado encontrado amorzinho. Tenta escreve outro ai, esse treco é meio bugado."; return; }
        resultsSelect.replaceChildren();
        found.forEach((item, index) => {
            const option = document.createElement("option"); option.value = String(index); option.textContent = item.display_name; resultsSelect.append(option);
        });
        resultsSelect.onchange = () => {
            const item = found[Number(resultsSelect.value)];
            if (!item) return;
            selectedMapPoint = { longitude: Number(item.lon), latitude: Number(item.lat) };
            document.getElementById("placeName").value = item.display_name.split(",").slice(0, 3).join(",");
            document.getElementById("placeCoordinates").textContent = `Local selecionado: ${item.display_name}. O ponto foi movido no globo bb.`;
            if (taubateDefaultMarker) { taubateDefaultMarker.remove(); taubateDefaultMarker = null; }
            if (selectedPointMarker) selectedPointMarker.remove();
            selectedPointMarker = new window.maplibregl.Marker({ color: "#dc6e86" }).setLngLat([selectedMapPoint.longitude, selectedMapPoint.latitude]).addTo(lovePlacesMap);
            lovePlacesMap.flyTo({ center: [selectedMapPoint.longitude, selectedMapPoint.latitude], zoom: Math.max(lovePlacesMap.getZoom(), 9), essential: true });
        };
        resultsWrap.hidden = false;
        resultsSelect.dispatchEvent(new Event("change"));
        status.textContent = "Escolha uma opção para mover o ponto princesa. © OpenStreetMap contributors.";
    } catch (_) {
        status.textContent = "Princesa, desculpa mas foi possível buscar agora. Você ainda pode tocar no globo para escolher o ponto.";
    } finally { button.disabled = false; }
});

function savePlanLocally(kind) {
    try { localStorage.setItem(plansStorageKeys[kind], JSON.stringify(planData[kind])); } catch (_) {}
}

function planDateLabel(date) {
    if (!date) return "";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" })
        .format(new Date(`${date}T00:00:00Z`));
}

function renderLetters() {
    document.getElementById("letterPermissions").hidden = !galleryAdminIsAllowed;
    const container = document.getElementById("lettersList");
    container.replaceChildren();
    const letters = [...planData.letters].sort((a, b) => String(a.open_on).localeCompare(String(b.open_on)));
    if (!letters.length) {
        container.innerHTML = '<p class="empty-plan-state">A primeira cartinha nossa começa aqui 💌</p>';
        return;
    }
    letters.forEach(letter => {
        const card = document.createElement("button");
        card.type = "button";
        const isOpen = !letter.open_on || letter.open_on <= todayISO();
        card.className = `letter-card letter-card-button${isOpen ? " is-open" : ""}`;
        const content = document.createElement("span"); content.className = "letter-card-content";
        const title = document.createElement("strong");
        title.textContent = letter.title;
        const meta = document.createElement("span");
        meta.className = "letter-meta";
        meta.textContent = `${letter.author || "Nós dois"} · ${isOpen ? "Toque para abrir" : `Abre em ${planDateLabel(letter.open_on)}`}`;
        const icon = document.createElement("span"); icon.className = "letter-card-icon"; icon.textContent = isOpen ? "💌" : "🔒";
        content.append(title, meta);
        card.append(content, icon);
        card.addEventListener("click", () => openLetterDetail(letter.id));
        container.append(card);
    });
}

function openLetterDetail(letterId) {
    const letter = planData.letters.find(item => String(item.id) === String(letterId));
    if (!letter) return;
    activeLetterDetail = letter;
    const isOpen = !letter.open_on || letter.open_on <= todayISO();
    document.getElementById("letterDetailTitle").textContent = letter.title;
    document.getElementById("letterDetailMeta").textContent = `${letter.author || "Nós dois"} · Criada em ${planDateLabel(String(letter.created_at || "").slice(0, 10))}${letter.open_on ? ` · ${isOpen ? "Aberta em" : "Abre em"} ${planDateLabel(letter.open_on)}` : ""}`;
    document.getElementById("letterDetailBody").textContent = isOpen ? letter.message : `🔒 Fofinha, Esta cartinha fica fechada até ${planDateLabel(letter.open_on)}.`;
    const actions = document.getElementById("letterDetailActions");
    actions.replaceChildren();
    if (galleryAdminIsAllowed && letter.editable !== false && isOpen) {
        const edit = document.createElement("button"); edit.type = "button"; edit.className = "secondary-plan-button"; edit.textContent = "Editar cartinha";
        edit.addEventListener("click", () => startLetterEdit(letter)); actions.append(edit);
    }
    if (galleryAdminIsAllowed && letter.deletable !== false) {
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "plan-delete"; remove.textContent = "Apagar cartinha";
        remove.addEventListener("click", () => deleteLetter(letter)); actions.append(remove);
    }
    const modal = document.getElementById("letterDetailModal");
    modal.hidden = false; document.body.classList.add("letter-detail-open");
    document.getElementById("closeLetterDetail").focus({ preventScroll: true });
}

function closeLetterDetail() {
    document.getElementById("letterDetailModal").hidden = true;
    document.body.classList.remove("letter-detail-open");
    activeLetterDetail = null;
}

function startLetterEdit(letter) {
    if (!galleryAdminIsAllowed || letter.editable === false) return;
    editingLetterId = letter.id;
    document.getElementById("letterTitle").value = letter.title;
    document.getElementById("letterMessage").value = letter.message;
    document.getElementById("letterOpenDate").value = letter.open_on || "";
    document.getElementById("letterAuthor").value = letter.author || "Nós dois";
    document.getElementById("letterCanEdit").checked = letter.editable !== false;
    document.getElementById("letterCanDelete").checked = letter.deletable !== false;
    document.getElementById("saveLetterButton").textContent = "SALVAR ALTERAÇÕES";
    document.getElementById("cancelLetterEdit").hidden = false;
    document.getElementById("lettersPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    closeLetterDetail();
    document.getElementById("letterTitle").focus({ preventScroll: true });
}

async function deleteLetter(letter) {
    if (!galleryAdminIsAllowed || letter.deletable === false) return;
    if (!window.confirm(`Apagar a cartinha “${letter.title}”?`)) return;
    const { error } = await supabaseClient.from("love_letters").delete().eq("id", letter.id);
    if (error) { document.getElementById("letterStatus").textContent = "Me desculpa fofa, Não deu pra apaga a cartinha, problema de conexão."; return; }
    planData.letters = planData.letters.filter(item => String(item.id) !== String(letter.id));
    savePlanLocally("letters"); renderLetters(); closeLetterDetail();
}

function renderCapsules() {
    const container = document.getElementById("capsulesList");
    const gate = document.getElementById("capsuleAdminGate");
    const form = document.getElementById("capsuleForm");
    const isAdmin = Boolean(galleryAdminIsAllowed);
    gate.hidden = isAdmin;
    form.hidden = !isAdmin;
    container.replaceChildren();
    if (!planData.capsules.length) {
        container.innerHTML = '<p class="empty-plan-state">Nenhuma cápsula foi guardada ainda xuxu.</p>';
        return;
    }
    [...planData.capsules].sort((a, b) => String(a.open_on).localeCompare(String(b.open_on))).forEach(capsule => {
        const isOpen = capsule.open_on <= todayISO();
        const card = document.createElement("article"); card.className = `letter-card capsule-card${isOpen ? " is-open" : ""}`;
        const title = document.createElement("h4"); title.textContent = capsule.title;
        const meta = document.createElement("span"); meta.className = "letter-meta";
        meta.textContent = `${capsule.author || "Nós dois"} · ${isOpen ? `Pode ser aberta desde ${planDateLabel(capsule.open_on)}` : `Trancada até ${planDateLabel(capsule.open_on)}`}`;
        const content = document.createElement("div"); content.className = "capsule-content";
        if (!isAdmin || !isOpen) {
            content.textContent = isOpen ? "🔒 Entre no modo administrador para ler esta cápsula fofa." : "🔒 Princesa, o que foi escrito continua guardado até a data acaba.";
        } else if (capsule.message) {
            content.textContent = capsule.message;
        } else {
            content.textContent = "Não acreidito, o texto não deu pra carrega. Deve ser problema de conexão.";
        }
        card.append(title, meta, content);
        if (isAdmin) {
            const remove = document.createElement("button"); remove.type = "button"; remove.className = "plan-delete"; remove.textContent = "Apagar cápsula";
            remove.addEventListener("click", () => deleteCapsule(capsule)); card.append(remove);
        }
        container.append(card);
    });
}

async function deleteCapsule(capsule) {
    if (!galleryAdminIsAllowed || !window.confirm(`Apagar a cápsula “${capsule.title}”?`)) return;
    const { error } = await supabaseClient.from("love_capsules").delete().eq("id", capsule.id);
    if (error) { document.getElementById("capsuleStatus").textContent = "Não acreidito, o texto não deu pra carrega. Deve ser problema de conexão."; return; }
    planData.capsules = planData.capsules.filter(item => String(item.id) !== String(capsule.id));
    renderCapsules();
}

function startPlaceEdit(place) {
    editingPlaceId = place.id;
    document.getElementById("placeName").value = place.name;
    document.getElementById("placeKind").value = place.kind;
    document.getElementById("placeDate").value = place.visited_on || "";
    document.getElementById("placePhoto").value = "";
    document.getElementById("placePhotoName").textContent = "Nenhuma foto escolhida";
    selectedMapPoint = { longitude: Number(place.longitude), latitude: Number(place.latitude) };
    document.getElementById("placeCoordinates").textContent = `Editando ponto selecionado: ${selectedMapPoint.latitude}°, ${selectedMapPoint.longitude}°. Escolha uma nova foto se quiser substituir a atual bbzinho.`;
    document.getElementById("savePlaceButton").textContent = "SALVAR ALTERAÇÕES";
    document.getElementById("cancelPlaceEdit").hidden = false;
    if (selectedPointMarker) selectedPointMarker.remove();
    selectedPointMarker = window.maplibregl && lovePlacesMap
        ? new window.maplibregl.Marker({ color: "#dc6e86" }).setLngLat([selectedMapPoint.longitude, selectedMapPoint.latitude]).addTo(lovePlacesMap)
        : null;
    lovePlacesMap?.flyTo({ center: [selectedMapPoint.longitude, selectedMapPoint.latitude], zoom: 9, essential: true });
    document.getElementById("placeForm").scrollIntoView({ behavior: "smooth", block: "center" });
}

function cancelPlaceEdit() {
    editingPlaceId = null;
    document.getElementById("placeForm").reset();
    document.getElementById("placePhotoName").textContent = "Nenhuma foto escolhida";
    document.getElementById("placeName").value = "Taubaté, São Paulo, Brasil";
    document.getElementById("placeKind").value = "visited";
    document.getElementById("savePlaceButton").textContent = "ADICIONAR AO MAPA";
    document.getElementById("cancelPlaceEdit").hidden = true;
    if (selectedPointMarker) selectedPointMarker.remove();
    selectedPointMarker = null;
    selectedMapPoint = taubateStartingPoint;
    document.getElementById("placeCoordinates").textContent = "Ponto inicial selecionado em Taubaté, São Paulo. Você pode mudar o ponto tocando no globo fofa.";
    if (lovePlacesMapReady) renderPlaces();
}

function renderPlaces() {
    const list = document.getElementById("placesList");
    list.replaceChildren();
    renderPlaceMarkers();
    if (!planData.places.length) list.innerHTML = '<p class="empty-plan-state">Os lugares especiais pra gente vão aparecer aqui.</p>';
    planData.places.forEach(place => {
        const card = document.createElement("article");
        card.className = `place-card${place.kind === "dream" ? " dream" : ""}`;
        const icon = document.createElement("span"); icon.className = "place-card-icon"; icon.textContent = place.kind === "dream" ? "✦" : "♥";
        const content = document.createElement("div"); content.className = "place-card-content";
        if (place.photo_url) { const photo = document.createElement("img"); photo.className = "place-card-photo"; photo.src = place.photo_url; photo.alt = `Abrir foto de ${place.name}`; photo.loading = "lazy"; photo.addEventListener("click", () => openMedia(place.photo_url, `Foto de ${place.name}`, "image")); card.append(photo); }
        const title = document.createElement("h4"); title.textContent = place.name;
        const meta = document.createElement("span"); meta.className = "place-meta";
        meta.textContent = `${place.kind === "dream" ? "Queremos conhecer" : "Já visitamos"}${place.visited_on ? ` · ${planDateLabel(place.visited_on)}` : ""}${place.note ? ` · ${place.note}` : ""}`;
        content.append(title, meta);
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "plan-delete"; remove.textContent = "×"; remove.setAttribute("aria-label", `Apagar ${place.name}`);
        remove.addEventListener("click", () => removePlanItem("places", place.id));
        const edit = document.createElement("button"); edit.type = "button"; edit.className = "plan-edit"; edit.textContent = "Editar"; edit.setAttribute("aria-label", `Editar ${place.name}`);
        edit.addEventListener("click", () => startPlaceEdit(place));
        card.append(icon, content, edit, remove); list.append(card);
        card.addEventListener("click", event => {
            if (event.target.closest("button, img")) return;
            lovePlacesMap?.flyTo({ center: [Number(place.longitude), Number(place.latitude)], zoom: 9, essential: true });
        });
    });
}

function renderPlaceMarkers() {
    if (!lovePlacesMapReady || !lovePlacesMap || !window.maplibregl) return;
    lovePlaceMarkers.forEach(marker => marker.remove()); lovePlaceMarkers = [];
    const taubateIsSaved = planData.places.some(place => Math.abs(Number(place.latitude) - taubateStartingPoint.latitude) < 0.02 && Math.abs(Number(place.longitude) - taubateStartingPoint.longitude) < 0.02);
    if (taubateIsSaved && taubateDefaultMarker) { taubateDefaultMarker.remove(); taubateDefaultMarker = null; }
    if (!taubateIsSaved && !taubateDefaultMarker) {
        const pin = document.createElement("span"); pin.className = "maplibre-place-marker map-marker-placeholder"; pin.textContent = "⌖";
        const popupContent = document.createElement("div"); popupContent.className = "place-popup";
        const title = document.createElement("strong"); title.textContent = "Taubaté, São Paulo";
        const note = document.createElement("span"); note.textContent = "Ponto inicial — adicione a foto de vocês pelo formulário. não esquece."; popupContent.append(title, note);
        taubateDefaultMarker = new window.maplibregl.Marker({ element: pin, anchor: "center" }).setLngLat([taubateStartingPoint.longitude, taubateStartingPoint.latitude]).setPopup(new window.maplibregl.Popup({ offset: 18 }).setDOMContent(popupContent)).addTo(lovePlacesMap);
    }
    const places = planData.places.filter(place => Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude)));
    const projected = places.map(place => ({ place, point: lovePlacesMap.project([Number(place.longitude), Number(place.latitude)]) }))
        .filter(item => item.point.x >= -80 && item.point.x <= loveMapContainer.clientWidth + 80 && item.point.y >= -80 && item.point.y <= loveMapContainer.clientHeight + 80);
    const threshold = Math.max(30, 142 - lovePlacesMap.getZoom() * 11);
    const groups = [];
    projected.forEach(item => {
        let group = groups.find(candidate => Math.hypot(candidate.x / candidate.count - item.point.x, candidate.y / candidate.count - item.point.y) < threshold);
        if (!group) { group = { items: [], x: 0, y: 0, count: 0 }; groups.push(group); }
        group.items.push(item.place); group.x += item.point.x; group.y += item.point.y; group.count++;
    });
    groups.forEach(group => {
        const primary = group.items[0];
        const el = document.createElement("button"); el.type = "button";
        el.className = `maplibre-place-marker${group.count > 1 ? " is-cluster" : ""}${primary.kind === "dream" ? " dream" : ""}`;
        el.setAttribute("aria-label", group.count > 1 ? `${group.count} lugares agrupados no mapa` : `Ver ${primary.name} no mapa`);
        group.items.slice(0, 3).forEach((place, index) => {
            if (!place.photo_url) return;
            const thumb = document.createElement("img"); thumb.src = place.photo_url; thumb.alt = ""; thumb.loading = "lazy"; thumb.className = `map-marker-thumb thumb-${index}`; el.append(thumb);
        });
        if (group.items.every(place => !place.photo_url)) { const fallback = document.createElement("span"); fallback.className = "map-marker-fallback"; fallback.textContent = primary.kind === "dream" ? "✦" : "⌖"; el.append(fallback); }
        if (group.count > 1) { const count = document.createElement("span"); count.className = "map-cluster-count"; count.textContent = String(group.count); el.append(count); }
        const center = [group.items.reduce((sum, place) => sum + Number(place.longitude), 0) / group.count, group.items.reduce((sum, place) => sum + Number(place.latitude), 0) / group.count];
        let popup;
        if (group.count === 1) {
            const popupContent = document.createElement("div"); popupContent.className = "place-popup";
            if (primary.photo_url) { const photo = document.createElement("img"); photo.src = primary.photo_url; photo.alt = `Foto de ${primary.name}`; photo.loading = "lazy"; photo.addEventListener("click", () => openMedia(primary.photo_url, `Foto de ${primary.name}`, "image")); popupContent.append(photo); }
            const title = document.createElement("strong"); title.textContent = primary.name;
            const meta = document.createElement("span"); meta.textContent = `${primary.kind === "dream" ? "Queremos conhecer" : "Já fomos"}${primary.visited_on ? ` · ${planDateLabel(primary.visited_on)}` : ""}`; popupContent.append(title, meta);
            if (primary.note) { const note = document.createElement("p"); note.textContent = primary.note; popupContent.append(note); }
            popup = new window.maplibregl.Popup({ offset: 22, closeButton: true }).setDOMContent(popupContent);
        } else if (lovePlacesMap.getZoom() >= 13) {
            const popupContent = document.createElement("div"); popupContent.className = "place-popup";
            group.items.forEach(place => { const row = document.createElement("button"); row.type = "button"; row.className = "cluster-place-row"; row.textContent = `${place.photo_url ? "▣ " : "⌖ "}${place.name}`; row.addEventListener("click", () => { lovePlacesMap.flyTo({ center: [Number(place.longitude), Number(place.latitude)], zoom: 15 }); }); popupContent.append(row); });
            popup = new window.maplibregl.Popup({ offset: 22, closeButton: true }).setDOMContent(popupContent);
        }
        const marker = new window.maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(center);
        if (popup) marker.setPopup(popup);
        marker.addTo(lovePlacesMap);
        el.addEventListener("click", event => { if (group.count > 1) { event.stopPropagation(); if (lovePlacesMap.getZoom() < 13) lovePlacesMap.easeTo({ center, zoom: Math.min(13, lovePlacesMap.getZoom() + 2.5), duration: 550 }); } });
        lovePlaceMarkers.push(marker);
    });
}

function renderChecklist() {
    const list = document.getElementById("checklistItems");
    list.replaceChildren();
    planData.checklist.forEach(item => {
        const row = document.createElement("li"); row.className = `checklist-item${item.done ? " is-done" : ""}`;
        const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = Boolean(item.done); checkbox.setAttribute("aria-label", `Marcar ${item.text} como ${item.done ? "não concluído" : "concluído"}`);
        checkbox.addEventListener("change", () => updateChecklistItem(item.id, checkbox.checked));
        const label = document.createElement("span"); label.textContent = item.text;
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "plan-delete"; remove.textContent = "×"; remove.setAttribute("aria-label", `Apagar ${item.text}`);
        remove.addEventListener("click", () => removePlanItem("checklist", item.id));
        row.append(checkbox, label, remove); list.append(row);
    });
    const done = planData.checklist.filter(item => item.done).length;
    const total = planData.checklist.length;
    document.getElementById("checklistProgress").textContent = `${done} de ${total} ${total === 1 ? "concluído" : "concluídos"}`;
    document.getElementById("checklistProgressBar").style.width = `${total ? (done / total) * 100 : 0}%`;
}

function renderCouplePlans() { renderLetters(); renderCapsules(); renderPlaces(); renderChecklist(); }

async function persistPlanItem(kind, item) {
    planData[kind].push(item); savePlanLocally(kind); renderCouplePlans();
    if (!supabaseClient) return false;
    const table = { letters: "love_letters", places: "love_places", checklist: "love_checklist" }[kind];
    const { error } = await supabaseClient.from(table).insert(item);
    if (error) {
        console.error(`Princesa, Não foi possível sincronizar ${table}.`, error);
        return false;
    }
    return true;
}

async function removePlanItem(kind, id) {
    planData[kind] = planData[kind].filter(item => String(item.id) !== String(id));
    savePlanLocally(kind); renderCouplePlans();
    if (supabaseClient) {
        const table = { letters: "love_letters", places: "love_places", checklist: "love_checklist" }[kind];
        const { error } = await supabaseClient.from(table).delete().eq("id", id);
        if (error) console.error(`Princesa, Não foi possível remover o item de ${table}.`, error);
    }
}

async function updateChecklistItem(id, done) {
    const item = planData.checklist.find(entry => String(entry.id) === String(id));
    if (!item) return;
    item.done = done; savePlanLocally("checklist"); renderChecklist();
    if (supabaseClient) {
        const { error } = await supabaseClient.from("love_checklist").update({ done }).eq("id", id);
        if (error) console.error("Princesa, Não foi possível sincronizar a checklist.", error);
    }
}

async function loadCouplePlans() {
    if (!supabaseClient) { renderCouplePlans(); return; }
    const tables = { letters: "love_letters", places: "love_places", checklist: "love_checklist", capsules: "love_capsules" };
    await Promise.all(Object.entries(tables).map(async ([kind, table]) => {
        const fields = kind === "capsules" ? "id, title, open_on, author, created_at" : "*";
        const { data, error } = await supabaseClient.from(table).select(fields).order("created_at", { ascending: true });
        if (error) { console.warn(`Princesa, Não foi possível carregar ${table}; mantendo os dados locais, chama o Samuel.`, error); return; }
        if (kind === "capsules") planData.capsules = data || [];
        else { planData[kind] = data || []; savePlanLocally(kind); }
    }));
    if (galleryAdminIsAllowed) {
        const dueIds = planData.capsules.filter(item => item.open_on <= todayISO()).map(item => item.id);
        if (dueIds.length) {
            const { data: contents, error } = await supabaseClient.from("love_capsule_contents").select("capsule_id, message").in("capsule_id", dueIds);
            if (error) console.warn("Princesa, O sistema não liberou o conteúdo das cápsulas.", error);
            else {
                const messageById = new Map((contents || []).map(item => [String(item.capsule_id), item.message]));
                planData.capsules.forEach(item => { item.message = messageById.get(String(item.id)) || ""; });
            }
        }
    }
    renderCouplePlans();
}

document.getElementById("letterForm").addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.getElementById("letterStatus");
    const openOn = document.getElementById("letterOpenDate").value || null;
    const letter = {
        title: document.getElementById("letterTitle").value.trim(),
        message: document.getElementById("letterMessage").value.trim(), open_on: openOn,
        author: document.getElementById("letterAuthor").value,
        editable: galleryAdminIsAllowed ? document.getElementById("letterCanEdit").checked : true,
        deletable: galleryAdminIsAllowed ? document.getElementById("letterCanDelete").checked : true
    };
    if (!letter.title || !letter.message) return;
    if (editingLetterId) {
        if (!galleryAdminIsAllowed) return;
        const { data, error } = await supabaseClient.from("love_letters").update(letter).eq("id", editingLetterId).select("*").single();
        if (error) { status.textContent = "Princesa, Não deu pra salvar. Esta cartinha pode estar marcada como não editável."; return; }
        planData.letters = planData.letters.map(item => String(item.id) === String(editingLetterId) ? data : item);
        status.textContent = "Princesa, Cartinha atualizada.";
    } else {
        const id = crypto.randomUUID();
        const fullLetter = { id, ...letter, created_at: new Date().toISOString() };
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from("love_letters").insert(fullLetter).select("*").single();
            if (error) { status.textContent = "Princesa, Não foi possível guardar a cartinha. Avisa o Samuel que o sistema caiu."; return; }
            planData.letters.push(data);
            status.textContent = "Princesa, Cartinha guardada pra gente 💌";
        } else {
            planData.letters.push(fullLetter); status.textContent = "Princesa, Cartinha guardada neste navegador.";
        }
    }
    savePlanLocally("letters"); renderLetters();
    document.getElementById("letterForm").reset(); editingLetterId = null;
    document.getElementById("saveLetterButton").textContent = "GUARDAR CARTINHA ♥";
    document.getElementById("cancelLetterEdit").hidden = true;
    document.getElementById("letterOpenDate").min = todayISO();
});

document.getElementById("cancelLetterEdit").addEventListener("click", () => {
    editingLetterId = null; document.getElementById("letterForm").reset();
    document.getElementById("saveLetterButton").textContent = "GUARDAR CARTINHA ♥";
    document.getElementById("cancelLetterEdit").hidden = true;
});

document.getElementById("lettersTab").addEventListener("click", () => setMessagePanel("letters"));
document.getElementById("capsulesTab").addEventListener("click", () => setMessagePanel("capsules"));
function setMessagePanel(panel) {
    const isLetters = panel === "letters";
    document.getElementById("lettersTab").classList.toggle("active", isLetters);
    document.getElementById("capsulesTab").classList.toggle("active", !isLetters);
    document.getElementById("lettersTab").setAttribute("aria-selected", String(isLetters));
    document.getElementById("capsulesTab").setAttribute("aria-selected", String(!isLetters));
    document.getElementById("lettersPanel").hidden = !isLetters;
    document.getElementById("capsulesPanel").hidden = isLetters;
}

document.querySelectorAll("[data-capsule-years]").forEach(button => button.addEventListener("click", () => {
    const date = new Date(); date.setFullYear(date.getFullYear() + Number(button.dataset.capsuleYears));
    document.getElementById("capsuleOpenDate").value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}));

document.getElementById("capsuleForm").addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.getElementById("capsuleStatus");
    if (!galleryAdminIsAllowed || !supabaseClient) { status.textContent = "Entre no modo administrador para guardar uma cápsula."; return; }
    const openOn = document.getElementById("capsuleOpenDate").value;
    if (openOn <= todayISO()) { status.textContent = "A cápsula precisa ser marcada para uma data futura."; return; }
    const title = document.getElementById("capsuleTitle").value.trim();
    const message = document.getElementById("capsuleMessage").value.trim();
    if (!title || !message) return;
    const metadata = { id: crypto.randomUUID(), title, open_on: openOn, author: document.getElementById("capsuleAuthor").value, created_at: new Date().toISOString() };
    const { error: metadataError } = await supabaseClient.from("love_capsules").insert(metadata);
    if (metadataError) { status.textContent = "Princesa, Não foi possível criar a cápsula. Avisa o Samuel que o sistema caiu."; return; }
    const { error: contentError } = await supabaseClient.from("love_capsule_contents").insert({ capsule_id: metadata.id, message });
    if (contentError) {
        await supabaseClient.from("love_capsules").delete().eq("id", metadata.id);
        status.textContent = "Princesa, Não foi possível selar o texto. Avisa o Samuel que o sistema caiu."; return;
    }
    planData.capsules.push(metadata); renderCapsules();
    document.getElementById("capsuleForm").reset(); status.textContent = "Cápsula selada. O texto ficará protegido até a data escolhida fofa. 🔒";
});

document.getElementById("goToAdminLogin").addEventListener("click", () => {
    openPage("photos");
    window.setTimeout(() => document.getElementById("galleryAdminEmail").focus({ preventScroll: true }), 250);
});

document.getElementById("closeLetterDetail").addEventListener("click", closeLetterDetail);
document.getElementById("letterDetailModal").addEventListener("click", event => {
    if (event.target.id === "letterDetailModal") closeLetterDetail();
});
document.addEventListener("keydown", event => { if (event.key === "Escape" && !document.getElementById("letterDetailModal").hidden) closeLetterDetail(); });

document.getElementById("placePhoto").addEventListener("change", event => {
    const file = event.currentTarget.files?.[0];
    document.getElementById("placePhotoName").textContent = file ? file.name : "Nenhuma foto escolhida";
});

document.getElementById("placeForm").addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.getElementById("placeStatus");
    if (!selectedMapPoint) { status.textContent = "Toque no globo para escolher onde fica o lugar."; return; }
    const photoInput = document.getElementById("placePhoto");
    const photoFile = photoInput.files[0];
    const placeName = document.getElementById("placeName").value.trim();
    if (!placeName) { status.textContent = "Dê um nome para este lugar."; return; }
    if (photoFile && (!photoFile.type.startsWith("image/") || photoFile.size > 25 * 1024 * 1024)) {
        status.textContent = "Princesa, escolha uma foto de até 25 MB."; return;
    }
    let photoUrl = null;
    let photoPath = null;
    if (photoFile) {
        if (!supabaseClient) { status.textContent = "Princesa, Para guardar a foto e ver em outros lugars, configure o Supabase primeiro."; return; }
        status.textContent = "Enviando foto…";
        const safeName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        photoPath = `places/${crypto.randomUUID()}-${safeName}`;
        const { error: photoError } = await supabaseClient.storage.from("memories").upload(photoPath, photoFile, { contentType: photoFile.type, upsert: false });
        if (photoError) { console.error("Não foi possível enviar a foto do lugar.", photoError); status.textContent = "Princesa, Não foi possível enviar a foto. Talvez seja pesado, ou o tipo do arquivo."; return; }
        photoUrl = supabaseClient.storage.from("memories").getPublicUrl(photoPath).data.publicUrl;
    } else if (editingPlaceId) {
        const existingPlace = planData.places.find(item => String(item.id) === String(editingPlaceId));
        photoUrl = existingPlace?.photo_url || null;
        photoPath = existingPlace?.photo_path || null;
    }
    const currentPlace = planData.places.find(item => String(item.id) === String(editingPlaceId));
    const place = {
        id: editingPlaceId || crypto.randomUUID(), name: placeName, kind: document.getElementById("placeKind").value,
        note: currentPlace?.note || "", visited_on: document.getElementById("placeDate").value || null,
        photo_url: photoUrl, photo_path: photoPath, ...selectedMapPoint,
        created_at: planData.places.find(item => String(item.id) === String(editingPlaceId))?.created_at || new Date().toISOString()
    };
    let synced = false;
    if (editingPlaceId) {
        if (supabaseClient) {
            const { data, error } = await supabaseClient.from("love_places").update(place).eq("id", editingPlaceId).select("*").single();
            if (error) { status.textContent = "Baby, Não foi possível atualizar este lugar. Avisa o Samuel que o sistema caiu."; return; }
            planData.places = planData.places.map(item => String(item.id) === String(editingPlaceId) ? data : item);
            synced = true;
        } else {
            planData.places = planData.places.map(item => String(item.id) === String(editingPlaceId) ? place : item);
        }
        savePlanLocally("places"); renderPlaces();
    } else {
        synced = await persistPlanItem("places", place);
    }
    const wasEditing = Boolean(editingPlaceId);
    editingPlaceId = null;
    document.getElementById("placeForm").reset(); selectedMapPoint = taubateStartingPoint;
    document.getElementById("placePhotoName").textContent = "Nenhuma foto escolhida";
    document.getElementById("placeName").value = "Taubaté, São Paulo, Brasil";
    document.getElementById("placeKind").value = "visited";
    document.getElementById("savePlaceButton").textContent = "ADICIONAR AO MAPA";
    document.getElementById("cancelPlaceEdit").hidden = true;
    document.getElementById("placeCoordinates").textContent = "Ponto inicial selecionado em Taubaté, São Paulo. Você pode mudar o ponto tocando no globo.";
    if (selectedPointMarker) selectedPointMarker.remove(); selectedPointMarker = null;
    lovePlacesMap?.flyTo({ center: [taubateStartingPoint.longitude, taubateStartingPoint.latitude], zoom: 3.5 });
    status.textContent = synced ? (wasEditing ? "Lugar atualizado pra nós dois" : "Lugar e foto guardados pra nós dois") : (wasEditing ? "Lugar atualizado neste navegador." : "Lugar guardado neste navegador. Configure o SQL do Supabase para enviar na nuvem, avisa pro Samuel que o sistema ta ruim.");
});

document.getElementById("cancelPlaceEdit").addEventListener("click", cancelPlaceEdit);

document.getElementById("checklistForm").addEventListener("submit", async event => {
    event.preventDefault();
    const input = document.getElementById("checklistText");
    const text = input.value.trim(); if (!text) return;
    const synced = await persistPlanItem("checklist", { id: crypto.randomUUID(), text, done: false, created_at: new Date().toISOString() });
    input.value = "";
    input.setAttribute("aria-describedby", "checklistProgress");
    if (!synced && supabaseClient) document.getElementById("checklistProgress").textContent += " · salvo neste navegador bb; SQL do Supabase pendente ainda";
});

renderCouplePlans();

function buildMemoryDots() {
    const container = document.getElementById("memoryDots");
    container.innerHTML = "";
    memories.forEach((memory, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "memory-dot";
        dot.setAttribute("aria-label", `Mostrar lembrança ${index + 1}: ${(memory.title || memory.comment || "Um momento nosso").toLowerCase()}`);
        dot.addEventListener("click", () => showMemory(index));
        container.appendChild(dot);
    });
}

let memoryIndex = 0;

function showMemory(index) {
    memoryIndex = (index + memories.length) % memories.length;
    const memory = memories[memoryIndex];

    const image = document.getElementById("memoryImage");
    const video = document.getElementById("memoryVideo");
    if (memory.type === "video") {
        image.hidden = true;
        video.hidden = false;
        if (video.src !== memory.image) video.src = memory.image;
        video.play().catch(() => {});
    } else {
        video.pause();
        video.hidden = true;
        image.hidden = false;
        image.src = memory.image;
        image.alt = memory.title || memory.comment || "Um momento nosso";
    }
    document.getElementById("memoryTitle").textContent = memory.title || "UM MOMENTO NOSSO";
    document.getElementById("memoryComment").textContent = memory.comment;
    document.getElementById("memoryDate").textContent = `LEMBRANÇA ${memoryIndex + 1} DE ${memories.length}`;

    document.querySelectorAll(".memory-dot").forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === memoryIndex);
        dot.setAttribute("aria-current", dotIndex === memoryIndex ? "true" : "false");
    });
}

buildMemoryDots();

showMemory(0);
window.setInterval(() => showMemory(memoryIndex + 1), 9000);

document.querySelectorAll("[data-timeline-scroll]").forEach(button => {
    button.addEventListener("click", () => {
        const timeline = document.querySelector(".timeline");
        if (!timeline) return;
        const direction = Number(button.dataset.timelineScroll) || 1;
        const card = timeline.querySelector(".timeline-item");
        const distance = (card?.getBoundingClientRect().width || 320) + 22;
        timeline.scrollBy({ left: direction * distance, behavior: "smooth" });
    });
});

const timelineTrack = document.getElementById("timelineTrack");
const timelineStorageKey = "loveChronicleTimeline";
const timelinePhotoDialog = document.getElementById("timelinePhotoDialog");
const timelinePhotoChoices = document.getElementById("timelinePhotoChoices");
const timelineChapterForm = document.getElementById("timelineChapterForm");
let editingTimelineChapterId = null;
function readInitialTimeline() {
    return Array.from(timelineTrack.querySelectorAll(".timeline-item")).map((item, index) => ({
        id: `chapter-${index + 1}`,
        date: index === 3 ? new Date().toISOString().slice(0, 10) : index < 2 ? "2026-05-01" : "2026-07-01",
        title: item.querySelector(".timeline-card h3")?.textContent.trim() || `Capítulo ${index + 1}`,
        comment: item.querySelector(".timeline-card p")?.textContent.trim() || "",
        image: item.querySelector(".timeline-card img")?.getAttribute("src") || "",
        isFuture: item.classList.contains("timeline-item") && item.querySelector(".timeline-card.future") !== null
    }));
}
const initialTimelineChapters = readInitialTimeline();
let timelineChapters = (() => {
    try {
        const saved = localStorage.getItem(timelineStorageKey);
        return saved === null ? initialTimelineChapters : JSON.parse(saved);
    } catch (_) { return initialTimelineChapters; }
})();

function formatTimelineDate(value) {
    if (!value) return "DATA A DEFINIR";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date).toLocaleUpperCase("pt-BR");
}

function persistTimelineLocally() {
    try { localStorage.setItem(timelineStorageKey, JSON.stringify(timelineChapters)); }
    catch (error) { console.warn("Não foi possível guardar a timeline nesse celular podre.", error); }
}

function renderTimeline() {
    timelineTrack.replaceChildren();
    timelineChapters.forEach((chapter, index) => {
        const item = document.createElement("article");
        item.className = "timeline-item";
        const date = document.createElement("div");
        date.className = "timeline-date";
        date.textContent = formatTimelineDate(chapter.date);
        const dot = document.createElement("div");
        dot.className = "timeline-dot";
        const card = document.createElement("div");
        card.className = `timeline-card${chapter.isFuture ? " future" : ""}`;
        if (chapter.image) {
            const image = document.createElement("img");
            image.src = chapter.image;
            image.alt = chapter.title;
            image.loading = "lazy";
            card.append(image);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "timeline-card-placeholder";
            placeholder.textContent = chapter.isFuture ? "♥" : "✦";
            card.append(placeholder);
        }
        const content = document.createElement("div");
        const heading = document.createElement("div");
        heading.className = "timeline-chapter-heading";
        const label = document.createElement("span");
        label.textContent = `CHAPTER ${String(index + 1).padStart(2, "0")}`;
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "timeline-edit-button";
        edit.dataset.editChapter = chapter.id;
        edit.setAttribute("aria-label", `Editar capítulo ${chapter.title}`);
        edit.textContent = "✎";
        heading.append(label, edit);
        const title = document.createElement("h3");
        title.textContent = chapter.title;
        const comment = document.createElement("p");
        comment.textContent = chapter.comment;
        content.append(heading, title, comment);
        if (chapter.isFuture) {
            const nextStep = document.createElement("button");
            nextStep.type = "button";
            nextStep.className = "timeline-next-step";
            nextStep.innerHTML = "Escolher nosso próximo capítulo <span>→</span>";
            nextStep.addEventListener("click", () => openPage("our-plans"));
            content.append(nextStep);
        } else {
            const location = document.createElement("button");
            location.type = "button";
            location.className = "timeline-location";
            location.setAttribute("aria-label", "Abrir nosso mapa");
            location.innerHTML = '<span class="timeline-globe" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="21"/><path d="M4 24h40M24 3c7 6 10 13 10 21S31 39 24 45M24 3c-7 6-10 13-10 21s3 15 10 21M8 12h32M8 36h32"/></svg><i>♥</i></span><span><strong>LOCAL DA LEMBRANÇA</strong><small>Marcar no nosso mapa <b>↗</b></small></span>';
            location.addEventListener("click", () => openPage("our-plans"));
            content.append(location);
        }
        card.append(content);
        item.append(date, dot, card);
        timelineTrack.append(item);
    });
}

function timelineRow(chapter, position) {
    return { id: chapter.id, event_date: chapter.date, title: chapter.title, comment: chapter.comment, image_url: chapter.image || null, position, is_future: Boolean(chapter.isFuture) };
}

async function syncTimelineChapter(chapter, position) {
    if (!supabaseClient) return false;
    const { error } = await supabaseClient.from("love_timeline").upsert(timelineRow(chapter, position));
    if (error) { console.warn("A timeline ficou salva neste aparelho, mas não sincronizou. Execute o SQL atualizado do Supabase samuca.", error); return false; }
    return true;
}

async function syncAllTimelineChapters() {
    if (!supabaseClient) return false;
    const results = await Promise.all(timelineChapters.map((chapter, index) => syncTimelineChapter(chapter, index)));
    return results.every(Boolean);
}

async function loadTimelineChapters() {
    if (!supabaseClient) { renderTimeline(); return; }
    const { data, error } = await supabaseClient.from("love_timeline").select("*").order("position", { ascending: true });
    if (error) { console.warn("Tabela love_timeline indisponível; usando dados locais.", error); renderTimeline(); return; }
    if (data?.length) {
        timelineChapters = data.map(row => ({ id: row.id, date: row.event_date, title: row.title, comment: row.comment, image: row.image_url || "", isFuture: Boolean(row.is_future) }));
        persistTimelineLocally();
    } else {
        await syncAllTimelineChapters();
    }
    renderTimeline();
}

function openTimelineEditor(chapter = null) {
    editingTimelineChapterId = chapter?.id || null;
    document.getElementById("timelineTitleInput").value = chapter?.title || "";
    document.getElementById("timelineDateInput").value = chapter?.date || new Date().toISOString().slice(0, 10);
    document.getElementById("timelineCommentInput").value = chapter?.comment || "";
    document.getElementById("timelinePhotoUrl").value = chapter?.image || "";
    const preview = document.getElementById("timelinePhotoPreview");
    preview.hidden = !chapter?.image;
    preview.src = chapter?.image || "";
    document.getElementById("timelinePhotoName").textContent = chapter?.image ? "Foto selecionada" : "Nenhuma foto selecionada";
    document.getElementById("timelineEditorStatus").textContent = "";
    document.querySelector(".timeline-editor-heading .section-label").textContent = chapter ? "EDITAR CAPÍTULO" : "NOVO CAPÍTULO";
    document.querySelector(".timeline-editor-heading h3").textContent = chapter ? "Atualizar esta lembrança" : "Guardar mais uma lembrança";
    document.querySelector(".timeline-editor-actions button[type='submit']").textContent = chapter ? "Salvar alterações" : "Salvar capítulo";
    document.getElementById("deleteTimelineChapter").hidden = !chapter;
    timelineChapterForm.hidden = false;
    timelineChapterForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.getElementById("addTimelineChapter").addEventListener("click", () => openTimelineEditor());
document.getElementById("cancelTimelineEdit").addEventListener("click", () => { timelineChapterForm.hidden = true; });
document.getElementById("deleteTimelineChapter").addEventListener("click", async () => {
    const chapterId = editingTimelineChapterId;
    const chapter = timelineChapters.find(item => item.id === chapterId);
    if (!chapter || !window.confirm(`Apagar o capítulo “${chapter.title}”? Essa ação não pode ser desfeita, ja era.`)) return;
    const status = document.getElementById("timelineEditorStatus");
    const button = document.getElementById("deleteTimelineChapter");
    button.disabled = true;
    status.textContent = "Apagando capítulo…";
    if (supabaseClient) {
        const { error } = await supabaseClient.from("love_timeline").delete().eq("id", chapterId);
        if (error) {
            status.textContent = "Não foi possível apagar o capítulo sincronizado, chama o Samuel ou Tente novamente.";
            button.disabled = false;
            return;
        }
    }
    timelineChapters = timelineChapters.filter(item => item.id !== chapterId);
    persistTimelineLocally();
    renderTimeline();
    timelineChapterForm.hidden = true;
    editingTimelineChapterId = null;
    document.getElementById("timelineSaveStatus").textContent = supabaseClient ? "Capítulo apagado da timeline." : "Capítulo apagado deste celular podre.";
    if (supabaseClient) await syncAllTimelineChapters();
});
timelineTrack.addEventListener("click", event => {
    const button = event.target.closest("[data-edit-chapter]");
    if (!button) return;
    const chapter = timelineChapters.find(item => item.id === button.dataset.editChapter);
    if (chapter) openTimelineEditor(chapter);
});

timelineChapterForm.addEventListener("submit", async event => {
    event.preventDefault();
    const chapter = {
        id: editingTimelineChapterId || crypto.randomUUID(),
        date: document.getElementById("timelineDateInput").value,
        title: document.getElementById("timelineTitleInput").value.trim(),
        comment: document.getElementById("timelineCommentInput").value.trim(),
        image: document.getElementById("timelinePhotoUrl").value,
        isFuture: false
    };
    const existingIndex = timelineChapters.findIndex(item => item.id === chapter.id);
    if (existingIndex >= 0) chapter.isFuture = Boolean(timelineChapters[existingIndex].isFuture);
    if (existingIndex >= 0) timelineChapters[existingIndex] = chapter;
    else {
        const futureIndex = timelineChapters.findIndex(item => item.isFuture);
        if (futureIndex >= 0) timelineChapters.splice(futureIndex, 0, chapter);
        else timelineChapters.push(chapter);
    }
    persistTimelineLocally();
    renderTimeline();
    timelineChapterForm.hidden = true;
    document.getElementById("timelineSaveStatus").textContent = "Capítulo salvo nesse celular podre…";
    const synced = await syncAllTimelineChapters();
    document.getElementById("timelineSaveStatus").textContent = synced ? "Capítulo salvo e sincronizado pra nós dois" : "Capítulo salvo nesse celular veio. Para sincronizar, Chama o samuca e atualiza o SQL do Supabase.";
});

function populateTimelinePhotoChoices() {
    timelinePhotoChoices.replaceChildren();
    const seen = new Set();
    const images = Array.from(document.querySelectorAll(".gallery-item img"));
    if (!images.length) {
        const empty = document.createElement("p");
        empty.className = "timeline-photo-empty";
        empty.textContent = "Ainda não tem fotos carregados em Our Photos. Espera ai tio, ta carregar e tente novamente.";
        timelinePhotoChoices.append(empty);
        return;
    }
    images.forEach(image => {
        const url = image.currentSrc || image.src;
        if (!url || seen.has(url)) return;
        seen.add(url);
        const choice = document.createElement("button");
        choice.type = "button";
        choice.className = "timeline-photo-choice";
        const thumb = document.createElement("img");
        thumb.src = url;
        thumb.alt = "";
        const title = image.alt || image.closest(".gallery-item")?.querySelector(".gallery-caption strong")?.textContent || "Foto da galeria";
        const label = document.createElement("span");
        label.textContent = title;
        choice.append(thumb, label);
        choice.addEventListener("click", () => {
            document.getElementById("timelinePhotoUrl").value = url;
            const preview = document.getElementById("timelinePhotoPreview");
            preview.src = url;
            preview.hidden = false;
            document.getElementById("timelinePhotoName").textContent = title;
            timelinePhotoDialog.close();
        });
        timelinePhotoChoices.append(choice);
    });
}
document.getElementById("chooseTimelinePhoto").addEventListener("click", () => { populateTimelinePhotoChoices(); timelinePhotoDialog.showModal(); });
document.getElementById("closeTimelinePhotoDialog").addEventListener("click", () => timelinePhotoDialog.close());
timelinePhotoDialog.addEventListener("click", event => { if (event.target === timelinePhotoDialog) timelinePhotoDialog.close(); });
renderTimeline();

const defaultDateIdeas = ["Café e conversa sem pressa", "Noite de filme com pipoca", "Piquenique no fim da tarde", "Cozinhar uma receita juntos", "Passeio surpresa", "Jogo de perguntas de casal", "Recriar o primeiro encontro", "Escrever uma cartinha um para o outro"];
const dateIdeasStorageKey = "loveChronicleDateIdeas";
let dateIdeas = (() => {
    try { return JSON.parse(localStorage.getItem(dateIdeasStorageKey) || "null") || defaultDateIdeas.slice(); }
    catch (_) { return defaultDateIdeas.slice(); }
})();
let dateIdeasSyncQueue = Promise.resolve();
let editingDateIdeaIndex = null;
let dateWheelRotation = 0;
const wheelSymbols = ["☕", "🎬", "✦", "♫", "♥", "☀", "✉", "✧", "♡", "☕", "✦", "♥"];
const wheelColors = ["#f6cfda", "#fff2f5", "#edb8c6", "#fff7f8", "#f2c6d2", "#fff4f6", "#e9b1c0", "#fff9fa"];
function renderDateIdeas() {
    const list = document.getElementById("dateIdeaList");
    list.replaceChildren();
    dateIdeas.forEach((idea, index) => {
        const row = document.createElement("li");
        row.className = "date-idea-item";
        const label = document.createElement("span");
        label.textContent = idea;
        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "Editar";
        edit.setAttribute("aria-label", `Editar ideia: ${idea}`);
        edit.addEventListener("click", () => {
            editingDateIdeaIndex = index;
            document.getElementById("dateIdeaInput").value = idea;
            document.getElementById("saveDateIdea").textContent = "Salvar";
            document.getElementById("cancelDateIdeaEdit").hidden = false;
            document.getElementById("dateIdeaInput").focus();
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Remover ideia: ${idea}`);
        remove.addEventListener("click", async () => {
            dateIdeas.splice(index, 1);
            if (editingDateIdeaIndex === index) cancelDateIdeaEdit();
            else if (editingDateIdeaIndex !== null && editingDateIdeaIndex > index) editingDateIdeaIndex--;
            renderDateIdeas();
            const synced = await saveDateIdeas();
            document.getElementById("dateIdeaStatus").textContent = synced ? "Ideia removida e sincronizada na nuvem." : "Ideia removida neste aparelho; a nuvem não sincronizou.";
        });
        row.append(label, edit, remove);
        list.append(row);
    });
    renderDateWheel();
}
async function saveDateIdeas() {
    try { localStorage.setItem(dateIdeasStorageKey, JSON.stringify(dateIdeas)); } catch (_) {}
    if (!supabaseClient) return false;
    const ideasSnapshot = dateIdeas.slice();
    const syncRequest = dateIdeasSyncQueue.then(async () => {
        const { error } = await supabaseClient.from("love_date_ideas").upsert({ id: 1, ideas: ideasSnapshot, updated_at: new Date().toISOString() }, { onConflict: "id" });
        if (error) {
            console.warn("As ideias da roleta ficaram salvas neste Celular podre, mas não sincronizaram.", error);
            return false;
        }
        return true;
    });
    dateIdeasSyncQueue = syncRequest.catch(() => false);
    return syncRequest;
}
async function loadDateIdeasFromCloud() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.from("love_date_ideas").select("ideas").eq("id", 1).maybeSingle();
    if (error) {
        console.warn("Não foi possível carregar as ideias da roleta na nuvem bb. Chama o Samuel.", error);
        document.getElementById("dateIdeaStatus").textContent = "Não consegui sincronizar as ideias agora. Elas continuam salvas neste Celular podre.";
        return;
    }
    if (data && Array.isArray(data.ideas)) {
        dateIdeas = data.ideas.filter(idea => typeof idea === "string" && idea.trim()).slice(0, 12);
        try { localStorage.setItem(dateIdeasStorageKey, JSON.stringify(dateIdeas)); } catch (_) {}
        renderDateIdeas();
        document.getElementById("dateIdeaStatus").textContent = "";
    } else {
        const synced = await saveDateIdeas();
        document.getElementById("dateIdeaStatus").textContent = synced ? "Suas ideias foram salvas na nuvem." : "Ideias neste Celular podre. A nuvem não sincronizou.";
    }
}
function cancelDateIdeaEdit() {
    editingDateIdeaIndex = null;
    document.getElementById("dateIdeaInput").value = "";
    document.getElementById("saveDateIdea").textContent = "Adicionar";
    document.getElementById("cancelDateIdeaEdit").hidden = true;
}
function renderDateWheel() {
    const wheel = document.getElementById("dateWheel");
    const center = wheel.querySelector(".wheel-center");
    wheel.replaceChildren(center);
    if (!dateIdeas.length) {
        wheel.style.background = "conic-gradient(#f6cfda 0deg 360deg)";
        return;
    }
    const slice = 360 / dateIdeas.length;
    wheel.style.background = `conic-gradient(${dateIdeas.map((_, index) => `${wheelColors[index % wheelColors.length]} ${index * slice}deg ${(index + 1) * slice}deg`).join(",")})`;
    dateIdeas.forEach((_, index) => {
        const symbol = document.createElement("span");
        symbol.className = "wheel-symbol";
        symbol.style.setProperty("--angle", `${index * slice + slice / 2}deg`);
        symbol.style.setProperty("--counter-angle", `${-(index * slice + slice / 2)}deg`);
        symbol.textContent = wheelSymbols[index % wheelSymbols.length];
        wheel.append(symbol);
    });
    dateWheelRotation = 0;
    wheel.style.transition = "none";
    wheel.style.transform = "rotate(0deg)";
    requestAnimationFrame(() => { wheel.style.transition = ""; });
}
document.getElementById("dateIdeaForm").addEventListener("submit", async event => {
    event.preventDefault();
    const value = document.getElementById("dateIdeaInput").value.trim();
    const status = document.getElementById("dateIdeaStatus");
    if (!value) return;
    if (editingDateIdeaIndex === null && dateIdeas.length >= 15) {
        status.textContent = "A roleta aceita até 15 ideias bb, desculpa.";
        return;
    }
    if (editingDateIdeaIndex === null) dateIdeas.push(value);
    else dateIdeas[editingDateIdeaIndex] = value;
    cancelDateIdeaEdit();
    renderDateIdeas();
    const synced = await saveDateIdeas();
    status.textContent = synced ? "Ideia salva e sincronizada na nuvem princesa" : "Ideia salva neste Celular podre; a nuvem não sincronizou.";
});
document.getElementById("cancelDateIdeaEdit").addEventListener("click", cancelDateIdeaEdit);
renderDateIdeas();
document.getElementById("spinDateRoulette").addEventListener("click", event => {
    const button = event.currentTarget;
    if (button.disabled) return;
    if (!dateIdeas.length) {
        document.getElementById("dateRouletteResult").textContent = "Coloca alguma coisa ai ne bb, para girar a roleta.";
        return;
    }
    button.disabled = true;
    const roulette = document.querySelector(".date-roulette");
    const wheel = document.getElementById("dateWheel");
    const result = document.getElementById("dateRouletteResult");
    const ideasForThisSpin = dateIdeas.slice();
    const index = Math.floor(Math.random() * ideasForThisSpin.length);
    const slice = 360 / ideasForThisSpin.length;
    const targetAngle = (360 - (index * slice + slice / 2) + 360) % 360;
    const currentAngle = dateWheelRotation % 360;
    dateWheelRotation += 360 * (5 + Math.floor(Math.random() * 3)) + ((targetAngle - currentAngle + 360) % 360);
    roulette.classList.add("is-spinning");
    roulette.querySelector(".date-idea-manager").setAttribute("inert", "");
    result.textContent = "A sorte está escolhendo…";
    wheel.style.transform = `rotate(${dateWheelRotation}deg)`;
    window.setTimeout(() => {
        roulette.classList.remove("is-spinning");
        roulette.querySelector(".date-idea-manager").removeAttribute("inert");
        result.textContent = `O encontro sorteado: ${ideasForThisSpin[index]} ♥`;
        button.disabled = false;
    }, 4550);
});

let activeGalleryFilter = "all";
let gallerySortOrder = "newest";

document.getElementById("gallerySortOrder").addEventListener("change", event => {
    gallerySortOrder = event.target.value;
    renderGalleryPage(1);
});

document.querySelectorAll(".gallery-item").forEach(item => {
    item.dataset.category = "us";
    item.dataset.type = "image";
});

document.querySelectorAll(".photo-filter").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.filter === activeGalleryFilter));
    button.addEventListener("click", () => {
        activeGalleryFilter = button.dataset.filter;
        document.querySelectorAll(".photo-filter").forEach(filterButton => {
            const active = filterButton === button;
            filterButton.classList.toggle("active", active);
            filterButton.setAttribute("aria-pressed", String(active));
        });
        renderGalleryPage(1);
    });
});

function renderGalleryPage(page = 1) {
    const gallery = document.querySelector(".gallery");
    const items = Array.from(gallery.children);
    const matchingItems = items.filter(item => {
        if (activeGalleryFilter === "all") return true;
        if (activeGalleryFilter === "videos") return item.dataset.type === "video" || item.dataset.category === "videos";
        return item.dataset.category === activeGalleryFilter;
    });
    const orderedItems = sortGalleryItems(matchingItems);
    const pageCount = Math.max(1, Math.ceil(orderedItems.length / GALLERY_PAGE_SIZE));
    const currentPage = Math.min(Math.max(page, 1), pageCount);
    const pageItems = new Set(orderedItems.slice((currentPage - 1) * GALLERY_PAGE_SIZE, currentPage * GALLERY_PAGE_SIZE));
    items.forEach(item => {
        item.hidden = !pageItems.has(item);
    });
    const pagination = document.getElementById("galleryPagination");
    pagination.innerHTML = "";
    for (let number = 1; number <= pageCount; number++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `gallery-page-button${number === currentPage ? " active" : ""}`;
        button.textContent = number;
        button.setAttribute("aria-label", `Página ${number}`);
        button.setAttribute("aria-current", number === currentPage ? "page" : "false");
        button.addEventListener("click", () => renderGalleryPage(number));
        pagination.appendChild(button);
    }
}

function sortGalleryItems(items) {
    return items.map((item, index) => ({ item, index, date: Date.parse(item.dataset.createdAt || "") || null }))
        .sort((a, b) => {
            if (a.date && b.date && a.date !== b.date) return gallerySortOrder === "newest" ? b.date - a.date : a.date - b.date;
            if (a.date && !b.date) return -1;
            if (!a.date && b.date) return 1;
            return gallerySortOrder === "newest" ? a.index - b.index : b.index - a.index;
        }).map(entry => entry.item);
}

function addGalleryItem(memory) {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.dataset.uploaded = "true";
    if (memory.id) item.dataset.memoryId = memory.id;
    item.dataset.category = memory.category || "us";
    item.dataset.type = memory.type || "image";
    if (memory.createdAt) item.dataset.createdAt = memory.createdAt;
    if (memory.type === "video") {
        const video = document.createElement("video");
        video.src = memory.image;
        video.muted = true;
        video.preload = "metadata";
        video.playsInline = true;
        video.addEventListener("click", () => openGalleryItem(item));
        item.appendChild(video);
    } else {
        const image = document.createElement("img");
        image.src = memory.image;
        image.alt = memory.title || "Foto da galeria";
        image.addEventListener("click", () => openGalleryItem(item));
        item.appendChild(image);
    }
    if (memory.id) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "gallery-delete-button";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", `Apagar ${memory.title || "foto da galeria"}`);
        deleteButton.title = "Apagar esta lembrança";
        deleteButton.hidden = !galleryAdminIsAllowed;
        deleteButton.addEventListener("click", () => deleteGalleryMemory(memory.id));
        item.appendChild(deleteButton);
    }
    document.querySelector(".gallery").append(item);
}

function updateGalleryAdminUI() {
    const message = document.getElementById("galleryAdminMessage");
    const loginPanel = document.getElementById("galleryAdminLogin");
    const logoutButton = document.getElementById("galleryAdminLogout");
    if (!supabaseClient) {
        message.textContent = "O Supabase não está disponível, desiste.";
        loginPanel.hidden = true;
        logoutButton.hidden = true;
        return;
    }
    loginPanel.hidden = Boolean(galleryAdminUser);
    logoutButton.hidden = !galleryAdminUser;
    if (galleryAdminIsAllowed) {
        message.textContent = `Modo de administração ativo para ${galleryAdminUser.email}.`;
    } else if (galleryAdminUser) {
        message.textContent = "Esta conta não tem permissão pra nada, recomendo sair, ladrãozinho. ou vc errou msm.";
    } else {
        message.textContent = "Entre como ADM pra editar ou apagar fotos e notícias de tudo.";
    }
    document.querySelectorAll(".gallery-delete-button").forEach(button => {
        button.hidden = !galleryAdminIsAllowed;
    });
}

async function refreshGalleryAdminPermission() {
    galleryAdminIsAllowed = false;
    if (supabaseClient && galleryAdminUser) {
        const { data, error } = await supabaseClient.rpc("is_gallery_admin");
        if (!error) galleryAdminIsAllowed = data === true;
        else console.error("Não foi possível ver a permissão administrativa, Chama o Samuel.", error);
    }
    if (!galleryAdminIsAllowed) planData.capsules.forEach(capsule => { delete capsule.message; });
    updateGalleryAdminUI();
    renderNews();
    await loadCouplePlans();
}

async function loginGalleryAdmin() {
    const email = document.getElementById("galleryAdminEmail").value.trim();
    const password = document.getElementById("galleryAdminPassword").value;
    const status = document.getElementById("galleryAdminStatus");
    if (!supabaseClient || !email || !password) {
        status.textContent = "Digite o e-mail e a senha da conta ADM.";
        return;
    }
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        status.textContent = "Não foi possível entrar irmão. Confira as credenciais ai.";
        return;
    }
    galleryAdminUser = data.user;
    document.getElementById("galleryAdminPassword").value = "";
    await refreshGalleryAdminPermission();
    if (!galleryAdminIsAllowed) {
        await supabaseClient.auth.signOut();
        galleryAdminUser = null;
        updateGalleryAdminUI();
        status.textContent = "Este e-mail não está autorizado a apagar fotos. Sai agora, ladrãozinho.";
        return;
    }
    status.textContent = "Bem vindo de volta ADMS. Os botões de exclusão estão disponíveis pra vcs.";
}

async function logoutGalleryAdmin() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        document.getElementById("galleryAdminStatus").textContent = "Não foi possível sair da conta. bugou";
        return;
    }
    galleryAdminUser = null;
    galleryAdminIsAllowed = false;
    planData.capsules.forEach(capsule => { delete capsule.message; });
    updateGalleryAdminUI();
    renderCouplePlans();
}

async function deleteGalleryMemory(memoryId) {
    if (!galleryAdminIsAllowed) return;
    const memory = uploadedMemories.find(item => item.id === memoryId);
    if (!memory) return;
    const confirmed = window.confirm(`Apagar “${memory.title || memory.comment || "esta foto"}” da galeria? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    const status = document.getElementById("galleryAdminStatus");
    status.textContent = "Apagando lembrança…";
    const { data: removedFiles, error: storageError } = await supabaseClient.storage
        .from("memories")
        .remove([memory.filePath]);
    if (storageError) {
        console.error(storageError);
        status.textContent = "O sistema recusou apagar o arquivo. Chama o Samuel agora, se não vai explodir.";
        return;
    }
    if (!removedFiles?.some(file => file.name === memory.filePath)) {
        console.error("Supabase não retornou o arquivo removido.", { filePath: memory.filePath, removedFiles });
        status.textContent = "O Sistema não confirmou a exclusão. Execute novamente o supabase-setup.sql atualizado (ele libera SELECT e DELETE para o administrador) ou, Chama o Samuel ai";
        return;
    }
    const { data: deletedRows, error: rowError } = await supabaseClient
        .from("memories")
        .delete()
        .eq("id", memoryId)
        .select("id");
    if (rowError) {
        console.error(rowError);
        status.textContent = "O arquivo foi apagado, mas não foi possível remover o registro da galeria bb, desculpa.";
        return;
    }
    if (!deletedRows?.length) {
        status.textContent = "O arquivo foi apagado bb, mas o Supabase não removeu o registro. Confira a policy de DELETE em memories.";
        return;
    }

    uploadedMemories = uploadedMemories.filter(item => item.id !== memoryId);
    refreshMemoryCarousel();
    const galleryItem = Array.from(document.querySelector(".gallery").children)
        .find(item => item.dataset.memoryId === memoryId);
    galleryItem?.remove();
    renderGalleryPage(1);
    status.textContent = "Lembrança apagada da galeria.";
}

window.loginGalleryAdmin = loginGalleryAdmin;
window.logoutGalleryAdmin = logoutGalleryAdmin;

renderGalleryPage(1);

async function loadSavedMemories() {
    if (!supabaseClient) return;
    try {
        const { data: records, error } = await supabaseClient
            .from("memories")
            .select("id, title, subtitle, category, media_type, file_path, created_at")
            .order("created_at", { ascending: true });
        if (error) throw error;

        const savedMemories = records.map(record => {
            const { data } = supabaseClient.storage.from("memories").getPublicUrl(record.file_path);
            return {
                id: record.id,
                image: data.publicUrl,
                title: record.title,
                comment: record.subtitle,
                type: record.media_type,
                category: record.category,
                filePath: record.file_path,
                createdAt: record.created_at
            };
        });
        document.querySelectorAll(".gallery-item[data-uploaded='true']").forEach(item => item.remove());
        savedMemories.forEach(addGalleryItem);
        uploadedMemories = savedMemories.slice().reverse();
        refreshMemoryCarousel();
        renderGalleryPage(1);
    } catch (error) {
        console.error("Não foi possível carregar as lembranças do Supabase.", error);
        document.getElementById("uploadStatus").textContent = "Não foi possível carregar as nossas lembranças princesa. Confira a configuração do Supabase.";
    }
}

async function initializeSupabase() {
    if (!supabaseClient) {
        updateGalleryAdminUI();
        document.getElementById("uploadStatus").textContent = "O Supabase não carregou. Verifique a URL, a Publishable key e a conexão.";
        return;
    }
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) console.error("Não foi possível recuperar a sessão do ADM.", error);
    galleryAdminUser = data?.session?.user || null;
    await refreshGalleryAdminPermission();
    await loadDateIdeasFromCloud();
    await loadSavedMemories();
    await loadTimelineChapters();
    try {
        await loadSavedNews();
    } catch (newsError) {
        console.error("Não foi possível carregar as notícias salvas princesa.", newsError);
        document.getElementById("newsStatus").textContent = "Não foi possível carregar as notícias salvas princesa. Execute o SQL atualizado do Supabase.";
    }
    await loadCouplePlans();
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        galleryAdminUser = session?.user || null;
        galleryAdminIsAllowed = false;
        updateGalleryAdminUI();
        window.setTimeout(() => refreshGalleryAdminPermission(), 0);
    });
}

initializeSupabase();

async function addMemoryUpload() {
    const fileInput = document.getElementById("memoryFile");
    const titleInput = document.getElementById("memoryUploadTitle");
    const subtitleInput = document.getElementById("memoryUploadSubtitle");
    const categoryInput = document.getElementById("memoryUploadCategory");
    const status = document.getElementById("uploadStatus");
    const file = fileInput.files[0];
    if (!supabaseClient) {
        status.textContent = "O armazenamento não está disponível, Provavelmente acabou tudo, Chama o Samuel.";
        return;
    }
    const title = titleInput.value.trim();
    const subtitle = subtitleInput.value.trim();
    if (!file) {
        status.textContent = "Escolha uma foto ou vídeo para enviar bb.";
        return;
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        status.textContent = "Escolha um arquivo de imagem ou vídeo válido, logico.";
        return;
    }
    if (file.size > 100 * 1024 * 1024) {
        status.textContent = "O arquivo precisa ter até 100 MB, não esquece.";
        return;
    }
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    const filePath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    status.textContent = "Enviando arquivo para nuvem…";
    try {
        const { error: storageError } = await supabaseClient.storage
            .from("memories")
            .upload(filePath, file, { contentType: file.type, upsert: false });
        if (storageError) throw storageError;

        const { data: publicFile } = supabaseClient.storage.from("memories").getPublicUrl(filePath);
        const { data: inserted, error: rowError } = await supabaseClient
            .from("memories")
            .insert({
                title,
                subtitle,
                category: categoryInput.value,
                media_type: mediaType,
                file_path: filePath
            })
            .select("id, created_at")
            .single();
        if (rowError) {
            await supabaseClient.storage.from("memories").remove([filePath]);
            throw rowError;
        }

        const memory = {
            id: inserted.id,
            image: publicFile.publicUrl,
            title,
            comment: subtitle,
            type: mediaType,
            category: categoryInput.value,
            filePath,
            createdAt: inserted.created_at
        };
        uploadedMemories.unshift(memory);
        addGalleryItem(memory);
        if (subtitle) refreshMemoryCarousel(inserted.id);
        const galleryItems = Array.from(document.querySelector(".gallery").children);
        const matchingCount = galleryItems.filter(item => activeGalleryFilter === "all"
            || (activeGalleryFilter === "videos" && (item.dataset.type === "video" || item.dataset.category === "videos"))
            || item.dataset.category === activeGalleryFilter).length;
        const uploadedMatchesFilter = activeGalleryFilter === "all"
            || (activeGalleryFilter === "videos" && (mediaType === "video" || categoryInput.value === "videos"))
            || activeGalleryFilter === categoryInput.value;
        renderGalleryPage(uploadedMatchesFilter ? Math.ceil(matchingCount / GALLERY_PAGE_SIZE) : 1);
        fileInput.value = "";
        titleInput.value = "";
        subtitleInput.value = "";
        categoryInput.value = "us";
        status.textContent = subtitle
            ? "Foto enviada para a galeria e adicionada ao carrosselzao de lembranças"
            : "Foto enviada para a galeria. Só galeria bb, ela ficou fora do carrossel.";
    } catch (error) {
        console.error("Falha ao enviar mídia na nuvem (-_-)", error);
        status.textContent = "Não foi possível enviar bb. Verifique sua conexão e as políticas configuradas no Supabase.";
    }
}


/* =========================================
   NAVEGAÇÃO
========================================= */

const navButtons =
    document.querySelectorAll(".nav-btn");

const pages =
    document.querySelectorAll(".page");


function openPage(pageName) {

    pages.forEach(page => {
        page.classList.remove("active-page");
    });

    navButtons.forEach(button => {
        button.classList.remove("active");
    });

    const selectedPage =
        document.getElementById(pageName);

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }

    const selectedButton =
        document.querySelector(
            `[data-page="${pageName}"]`
        );

    if (selectedButton) {
        selectedButton.classList.add("active");
    }

    if (pageName === "our-plans") window.setTimeout(() => lovePlacesMap?.resize(), 180);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


navButtons.forEach(button => {

    button.addEventListener("click", () => {

        const page =
            button.dataset.page;

        openPage(page);

    });

});


/* =========================================
   NOTÍCIAS INICIAIS
========================================= */

const starterNews = [

    {
        date: "14 SEP 2026",
        title: "CASAL PASSA MAIS UM DIA ESCREVENDO SUA HISTÓRIA",
        description:
            "Fontes próximas afirmam que o dia foi marcado por conversas, risadas e mais uma memória para guardar."
    },

    {
        date: "13 SEP 2026",
        title: "MAIS UMA NOITE ENTRA PARA O ARQUIVO",
        description:
            "O casal passou mais uma noite juntos, provando que até os momentos mais simples podem virar grandes lembranças."
    },

    {
        date: "12 SEP 2026",
        title: "AMOR CONTINUA SENDO A PRINCIPAL NOTÍCIA",
        description:
            "Segundo a nossa redação, não há previsão para o fim dessa história."
    }

];
let news = starterNews.slice();
let editingNewsId = null;
let newsPage = 1;


/* =========================================
   RENDERIZAR NOTÍCIAS
========================================= */

function renderNews(page = newsPage) {
    const homeContainer = document.getElementById("homeNews");
    const allContainer = document.getElementById("allNews");
    homeContainer.replaceChildren();
    allContainer.replaceChildren();

    const createNewsElement = (item, includeActions) => {
        const element = document.createElement("article");
        element.className = "news-item";
        const date = document.createElement("div");
        date.className = "news-date";
        date.textContent = item.date;
        const content = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = item.title;
        const description = document.createElement("p");
        description.textContent = item.description;
        content.append(title, description);
        element.append(date, content);

        if (includeActions && item.id && galleryAdminIsAllowed) {
            const actions = document.createElement("div");
            actions.className = "news-actions";
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "EDIT";
            editButton.addEventListener("click", () => editNews(item.id));
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "DELETE";
            deleteButton.addEventListener("click", () => deleteNews(item.id));
            actions.append(editButton, deleteButton);
            element.appendChild(actions);
        }
        return element;
    };

    const pageCount = Math.max(1, Math.ceil(news.length / NEWS_PAGE_SIZE));
    newsPage = Math.min(Math.max(page, 1), pageCount);
    const visibleNews = news.slice((newsPage - 1) * NEWS_PAGE_SIZE, newsPage * NEWS_PAGE_SIZE);
    visibleNews.forEach(item => allContainer.appendChild(createNewsElement(item, true)));
    news.slice(0, 2).forEach(item => homeContainer.appendChild(createNewsElement(item, false)));

    const pagination = document.getElementById("newsPagination");
    pagination.replaceChildren();
    for (let number = 1; number <= pageCount; number++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `gallery-page-button${number === newsPage ? " active" : ""}`;
        button.textContent = number;
        button.setAttribute("aria-label", `Página ${number} das notícias`);
        button.setAttribute("aria-current", number === newsPage ? "page" : "false");
        button.addEventListener("click", () => {
            renderNews(number);
            document.getElementById("news").scrollIntoView({ behavior: "smooth", block: "start" });
        });
        pagination.appendChild(button);
    }
}

renderNews();


/* =========================================
   ADICIONAR NOTÍCIA
========================================= */

async function addNews() {
    const title = document.getElementById("newsTitle").value.trim();
    const description = document.getElementById("newsDescription").value.trim();
    const status = document.getElementById("newsStatus");
    const saveButton = document.getElementById("saveNewsButton");
    if (!title || !description) {
        status.textContent = "Preencha o título e a descrição da notícia.";
        return;
    }
    if (!supabaseClient) {
        status.textContent = "O Supabase não está disponível (-_-). Confira a configuração do site.";
        return;
    }

    saveButton.disabled = true;
    status.textContent = editingNewsId ? "Salvando alterações…" : "Publicando notícia…";
    try {
        const query = editingNewsId
            ? supabaseClient.from("daily_news").update({ title, description }).eq("id", editingNewsId)
            : supabaseClient.from("daily_news").insert({ title, description });
        const { data, error } = await query
            .select("id, title, description, published_on, created_at")
            .single();
        if (error) throw error;
        const savedItem = mapSavedNews(data);
        if (editingNewsId) news = news.map(item => item.id === editingNewsId ? savedItem : item);
        else {
            news.unshift(savedItem);
            newsPage = 1;
        }
        const wasEditing = Boolean(editingNewsId);
        cancelNewsEdit();
        renderNews();
        status.textContent = wasEditing ? "Notícia atualizada e salva." : "Notícia publicada e salva para todos.";
    } catch (error) {
        console.error("Não foi possível salvar a notícia.", error);
        status.textContent = "Não foi possível salvar, deve ser a conexão bb. Confira sua conexão e execute o SQL atualizado do Supabase.";
    } finally {
        saveButton.disabled = false;
    }
}

function mapSavedNews(record) {
    const publishedDate = new Date(`${record.published_on}T00:00:00`);
    return {
        id: record.id,
        date: publishedDate.toLocaleDateString("en-US", {
            day: "2-digit", month: "short", year: "numeric"
        }).toUpperCase(),
        title: record.title,
        description: record.description
    };
}

async function loadSavedNews() {
    const { data, error } = await supabaseClient.from("daily_news")
        .select("id, title, description, published_on, created_at")
        .order("created_at", { ascending: false });
    if (error) throw error;
    news = [...(data || []).map(mapSavedNews), ...starterNews];
    renderNews();
}

function editNews(newsId) {
    if (!galleryAdminIsAllowed) return;
    const item = news.find(entry => entry.id === newsId);
    if (!item) return;
    editingNewsId = newsId;
    document.getElementById("newsTitle").value = item.title;
    document.getElementById("newsDescription").value = item.description;
    document.getElementById("saveNewsButton").textContent = "SAVE CHANGES";
    document.getElementById("cancelNewsEdit").hidden = false;
    document.getElementById("newsStatus").textContent = "Editando notícia. Salve para aplicar as mudanças.";
    document.getElementById("newsTitle").focus();
}

function cancelNewsEdit() {
    editingNewsId = null;
    document.getElementById("newsTitle").value = "";
    document.getElementById("newsDescription").value = "";
    document.getElementById("saveNewsButton").textContent = "PUBLISH NEWS";
    document.getElementById("cancelNewsEdit").hidden = true;
}

async function deleteNews(newsId) {
    if (!galleryAdminIsAllowed) return;
    const item = news.find(entry => entry.id === newsId);
    if (!item || !window.confirm(`Apagar a notícia “${item.title}”? Essa ação não pode ser desfeita.`)) return;
    const status = document.getElementById("newsStatus");
    status.textContent = "Apagando notícia…";
    const { data, error } = await supabaseClient.from("daily_news")
        .delete().eq("id", newsId).select("id");
    if (error || !data?.length) {
        console.error("Não foi possível apagar a notícia.", error);
        status.textContent = "Não foi possível apagar. Entra como ADM e confira se o SQL atualizado foi executado.";
        return;
    }
    news = news.filter(entry => entry.id !== newsId);
    if (editingNewsId === newsId) cancelNewsEdit();
    renderNews();
    status.textContent = "Notícia apagada.";
}


/* =========================================
   GALERIA / MODAL
========================================= */

function openImage(image) {
    openMedia(image.src, image.alt, "image");
}

let galleryModalItems = [];
let galleryModalIndex = -1;

function openGalleryItem(item) {
    const items = Array.from(document.querySelector(".gallery").children).filter(candidate => {
        if (activeGalleryFilter === "all") return true;
        if (activeGalleryFilter === "videos") return candidate.dataset.type === "video" || candidate.dataset.category === "videos";
        return candidate.dataset.category === activeGalleryFilter;
    });
    galleryModalItems = sortGalleryItems(items);
    galleryModalIndex = galleryModalItems.indexOf(item);
    displayGalleryModalItem();
}

function displayGalleryModalItem() {
    const item = galleryModalItems[galleryModalIndex];
    if (!item) return;
    const media = item.querySelector("img, video");
    if (!media) return;
    openMedia(media.currentSrc || media.src, media.alt || "Vídeo da galeria", media.tagName.toLowerCase() === "video" ? "video" : "image");
    const hasNavigation = galleryModalItems.length > 1;
    document.querySelectorAll(".modal-gallery-nav").forEach(button => { button.hidden = !hasNavigation; });
    document.getElementById("modalGalleryPosition").textContent = hasNavigation ? `${galleryModalIndex + 1} de ${galleryModalItems.length}` : "";
}

function stepGalleryModal(direction) {
    if (galleryModalItems.length < 2) return;
    galleryModalIndex = (galleryModalIndex + direction + galleryModalItems.length) % galleryModalItems.length;
    displayGalleryModalItem();
}

document.querySelector(".modal-gallery-previous").addEventListener("click", () => stepGalleryModal(-1));
document.querySelector(".modal-gallery-next").addEventListener("click", () => stepGalleryModal(1));

function openMedia(source, title, type) {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    const modalVideo = document.getElementById("modalVideo");
    if (type === "video") {
        modalImage.hidden = true;
        modalVideo.hidden = false;
        modalVideo.src = source;
        modalVideo.play().catch(() => {});
    } else {
        modalVideo.pause();
        modalVideo.removeAttribute("src");
        modalVideo.load();
        modalVideo.hidden = true;
        modalImage.hidden = false;
        modalImage.src = source;
        modalImage.alt = title;
    }
    modal.classList.add("show");
}


function closeImage() {
    const modal = document.getElementById("imageModal");
    const video = document.getElementById("modalVideo");
    video.pause();
    video.removeAttribute("src");
    video.load();
    modal.classList.remove("show");
    galleryModalItems = [];
    galleryModalIndex = -1;
    document.querySelectorAll(".modal-gallery-nav").forEach(button => { button.hidden = true; });
    document.getElementById("modalGalleryPosition").textContent = "";
}


document
    .getElementById("imageModal")
    .addEventListener(
        "click",
        function(event) {

            if (
                event.target === this
            ) {

                closeImage();

            }

        }
    );


/* =========================================
   ESC FECHA MODAL
========================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (document.getElementById("imageModal").classList.contains("show")) {
            if (event.key === "ArrowLeft") stepGalleryModal(-1);
            if (event.key === "ArrowRight") stepGalleryModal(1);
        }

        if (event.key === "Escape") {

            closeImage();

        }

    }
);


/* =========================================
   FRASES DE BREAKING NEWS
========================================= */

const breakingNews = [

    "Jesus continua escrevendo a história mais bonita de todas.",

    "URGENTE: A Gabi continua sendo considerada a pessoa mais importante na vida do Samuel.",

    "EXCLUSIVO: Jesus confirma que o amor continuara crescendo até ele voltar.",

    "PLANTÃO: Diz Samuel: mais um dia ao lado da gabi é melhor coisa do mundo.",

    "ÚLTIMA HORA: especialistas afirmam que quando estão juntos é a melhor parte do dia.",

    "BREAKING: Eles ficarão juntos até o Fim dos tempos."

];


let breakingIndex = 0;


setInterval(() => {

    breakingIndex++;

    if (
        breakingIndex >=
        breakingNews.length
    ) {

        breakingIndex = 0;

    }

    document.getElementById(
        "breakingNews"
    ).textContent =
        breakingNews[breakingIndex];

}, 5000);
