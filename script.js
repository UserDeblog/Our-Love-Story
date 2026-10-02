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
    if (years) duration.push(`${years} ${years === 1 ? "YEAR" : "YEARS"}`);
    if (months) duration.push(`${months} ${months === 1 ? "MONTH" : "MONTHS"}`);
    duration.push(`${days} ${days === 1 ? "DAY" : "DAYS"}`);

    document.getElementById("loveCounter").textContent = duration.join(" · ");
    document.getElementById("loveCounterTime").textContent =
        `${String(hours).padStart(2, "0")} HOURS · ${String(minutes).padStart(2, "0")} MINUTES · ${String(seconds).padStart(2, "0")} SECONDS`;
    document.getElementById("currentDate").textContent = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
    }).format(now).toLocaleUpperCase("pt-BR");
}

updateLoveCounter();
window.setInterval(updateLoveCounter, 1000);

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
const musicFolderApi = "https://api.github.com/repos/UserDeblog/Our-Love-Story/contents/music/music?ref=master";

const backgroundMusic = document.getElementById("backgroundMusic");
const musicTrackSelect = document.getElementById("musicTrackSelect");
const musicPlayPause = document.getElementById("musicPlayPause");
const musicStatus = document.getElementById("musicStatus");
const musicMixer = document.getElementById("musicMixer");
const musicMixerPanel = document.getElementById("musicMixerPanel");
const musicMixerToggle = document.getElementById("musicMixerToggle");
let currentTrackIndex = 0;

musicMixerToggle.addEventListener("click", () => {
    const isOpen = musicMixer.classList.toggle("is-open");
    musicMixer.classList.toggle("is-collapsed", !isOpen);
    musicMixerToggle.setAttribute("aria-expanded", String(isOpen));
    musicMixerToggle.setAttribute("aria-label", `${isOpen ? "Fechar" : "Abrir"} mixer de música`);
    musicMixerToggle.title = `${isOpen ? "Fechar" : "Abrir"} mixer de música`;
    musicMixerPanel.setAttribute("aria-hidden", String(!isOpen));
});

function loadBackgroundTrack(index, shouldPlay = false) {
    if (!backgroundTracks.length) return;
    currentTrackIndex = (index + backgroundTracks.length) % backgroundTracks.length;
    musicTrackSelect.value = String(currentTrackIndex);
    const file = backgroundTracks[currentTrackIndex].file;
    backgroundMusic.src = `music/music/${file.split("/").map(encodeURIComponent).join("/")}`;
    backgroundMusic.load();
    musicStatus.textContent = backgroundTracks[currentTrackIndex].title;
    if (shouldPlay) playBackgroundMusic();
}

async function playBackgroundMusic() {
    if (!backgroundTracks.length) return;
    try {
        await backgroundMusic.play();
        musicPlayPause.textContent = "❚❚";
        musicPlayPause.setAttribute("aria-label", "Pausar música");
        musicPlayPause.title = "Pausar música";
        musicStatus.textContent = `Tocando: ${backgroundTracks[currentTrackIndex].title}`;
    } catch (error) {
        musicPlayPause.textContent = "▶";
        musicPlayPause.setAttribute("aria-label", "Tocar música");
        musicPlayPause.title = "Tocar música";
        musicStatus.textContent = "Toque em play para começar";
    }
}

function pauseBackgroundMusic() {
    backgroundMusic.pause();
    musicPlayPause.textContent = "▶";
    musicPlayPause.setAttribute("aria-label", "Tocar música");
    musicPlayPause.title = "Tocar música";
    musicStatus.textContent = `Pausado: ${backgroundTracks[currentTrackIndex]?.title || "Música"}`;
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
musicPlayPause.addEventListener("click", () => {
    if (backgroundMusic.paused) playBackgroundMusic();
    else pauseBackgroundMusic();
});
document.getElementById("musicVolume").addEventListener("input", event => {
    backgroundMusic.volume = Number(event.target.value);
    try { localStorage.setItem("loveChronicleMusicVolume", event.target.value); } catch (_) {}
});
backgroundMusic.addEventListener("ended", () => {
    if (backgroundTracks.length) loadBackgroundTrack(currentTrackIndex + 1, true);
});
backgroundMusic.addEventListener("error", () => {
    musicStatus.textContent = "Não foi possível carregar esta música";
});

const savedMusicVolume = (() => {
    try { return localStorage.getItem("loveChronicleMusicVolume"); } catch (_) { return null; }
})();
if (savedMusicVolume !== null) document.getElementById("musicVolume").value = savedMusicVolume;
backgroundMusic.volume = Number(document.getElementById("musicVolume").value);

async function loadBackgroundPlaylist() {
    musicStatus.textContent = "Carregando músicas da pasta…";
    musicTrackSelect.disabled = true;
    document.getElementById("musicPrevious").disabled = true;
    document.getElementById("musicNext").disabled = true;
    musicPlayPause.disabled = true;
    try {
        const response = await fetch(musicFolderApi, {
            headers: { Accept: "application/vnd.github+json" }
        });
        if (!response.ok) throw new Error(`GitHub API respondeu ${response.status}`);
        const files = await response.json();
        const audioExtensions = new Set(["mp3", "m4a", "ogg", "wav", "aac", "flac"]);
        const tracks = files
            .filter(file => file.type === "file" && audioExtensions.has(file.name.split(".").pop().toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }))
            .map(file => ({
                file: file.name,
                title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b[a-z]/g, letter => letter.toUpperCase())
            }));
        if (!tracks.length) throw new Error("Nenhum arquivo de áudio foi encontrado na pasta music/music.");

        backgroundTracks.push(...tracks);
        musicTrackSelect.replaceChildren(...backgroundTracks.map((track, index) => {
            const option = document.createElement("option");
            option.value = String(index);
            option.textContent = track.title;
            return option;
        }));
        musicTrackSelect.disabled = false;
        document.getElementById("musicPrevious").disabled = false;
        document.getElementById("musicNext").disabled = false;
        musicPlayPause.disabled = false;
        loadBackgroundTrack(0);
    } catch (error) {
        console.error("Não foi possível listar as músicas no GitHub.", error);
        musicStatus.textContent = "Não consegui carregar a playlist do GitHub";
    }
}

loadBackgroundPlaylist();

document.addEventListener("pointerdown", event => {
    if (event.target.closest(".music-mixer")) return;
    if (backgroundMusic.paused) playBackgroundMusic();
}, { once: true });


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

const supabaseClient = window.supabase?.createClient(
    window.SUPABASE_CONFIG?.url,
    window.SUPABASE_CONFIG?.publishableKey
);
let uploadedMemories = [];
let galleryAdminUser = null;
let galleryAdminIsAllowed = false;

function buildMemoryDots() {
    const container = document.getElementById("memoryDots");
    container.innerHTML = "";
    memories.forEach((memory, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "memory-dot";
        dot.setAttribute("aria-label", `Mostrar lembrança ${index + 1}: ${memory.title.toLowerCase()}`);
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
        image.alt = memory.title;
    }
    document.getElementById("memoryTitle").textContent = memory.title;
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

let activeGalleryFilter = "all";

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
    const pageCount = Math.max(1, Math.ceil(matchingItems.length / GALLERY_PAGE_SIZE));
    const currentPage = Math.min(Math.max(page, 1), pageCount);
    const pageItems = new Set(matchingItems.slice((currentPage - 1) * GALLERY_PAGE_SIZE, currentPage * GALLERY_PAGE_SIZE));
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

function addGalleryItem(memory) {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.dataset.uploaded = "true";
    if (memory.id) item.dataset.memoryId = memory.id;
    item.dataset.category = memory.category || "us";
    item.dataset.type = memory.type || "image";
    if (memory.type === "video") {
        const video = document.createElement("video");
        video.src = memory.image;
        video.muted = true;
        video.preload = "metadata";
        video.playsInline = true;
        video.addEventListener("click", () => openMedia(memory.image, memory.title, "video"));
        item.appendChild(video);
    } else {
        const image = document.createElement("img");
        image.src = memory.image;
        image.alt = memory.title;
        image.addEventListener("click", () => openMedia(memory.image, memory.title, "image"));
        item.appendChild(image);
    }
    const caption = document.createElement("span");
    caption.className = "gallery-caption";
    const captionTitle = document.createElement("strong");
    captionTitle.textContent = memory.title;
    caption.appendChild(captionTitle);
    const captionMeta = document.createElement("span");
    const categoryLabel = (memory.category || "us").replace("-", " ").toUpperCase();
    captionMeta.textContent = `${memory.type === "video" ? "VIDEO" : "PHOTO"} · ${categoryLabel}`;
    caption.appendChild(captionMeta);
    if (memory.comment) {
        const captionSubtitle = document.createElement("span");
        captionSubtitle.textContent = memory.comment;
        caption.appendChild(captionSubtitle);
    }
    item.appendChild(caption);
    if (memory.id) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "gallery-delete-button";
        deleteButton.textContent = "×";
        deleteButton.setAttribute("aria-label", `Apagar ${memory.title}`);
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
        message.textContent = "O Supabase não está disponível.";
        loginPanel.hidden = true;
        logoutButton.hidden = true;
        return;
    }
    loginPanel.hidden = Boolean(galleryAdminUser);
    logoutButton.hidden = !galleryAdminUser;
    if (galleryAdminIsAllowed) {
        message.textContent = `Modo de administração ativo para ${galleryAdminUser.email}.`;
    } else if (galleryAdminUser) {
        message.textContent = "Esta conta não tem permissão administrativa para gerenciar fotos ou notícias.";
    } else {
        message.textContent = "Entre como administrador para editar ou apagar fotos e notícias.";
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
        else console.error("Não foi possível verificar a permissão administrativa.", error);
    }
    updateGalleryAdminUI();
    renderNews();
}

async function loginGalleryAdmin() {
    const email = document.getElementById("galleryAdminEmail").value.trim();
    const password = document.getElementById("galleryAdminPassword").value;
    const status = document.getElementById("galleryAdminStatus");
    if (!supabaseClient || !email || !password) {
        status.textContent = "Digite o e-mail e a senha da conta administradora.";
        return;
    }
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        status.textContent = "Não foi possível entrar. Confira as credenciais.";
        return;
    }
    galleryAdminUser = data.user;
    document.getElementById("galleryAdminPassword").value = "";
    await refreshGalleryAdminPermission();
    if (!galleryAdminIsAllowed) {
        await supabaseClient.auth.signOut();
        galleryAdminUser = null;
        updateGalleryAdminUI();
        status.textContent = "Este e-mail não está autorizado a apagar fotos.";
        return;
    }
    status.textContent = "Admin conectado. Os botões de exclusão estão disponíveis.";
}

async function logoutGalleryAdmin() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        document.getElementById("galleryAdminStatus").textContent = "Não foi possível sair da conta.";
        return;
    }
    galleryAdminUser = null;
    galleryAdminIsAllowed = false;
    updateGalleryAdminUI();
}

async function deleteGalleryMemory(memoryId) {
    if (!galleryAdminIsAllowed) return;
    const memory = uploadedMemories.find(item => item.id === memoryId);
    if (!memory) return;
    const confirmed = window.confirm(`Apagar “${memory.title}” da galeria? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    const status = document.getElementById("galleryAdminStatus");
    status.textContent = "Apagando lembrança…";
    const { data: removedFiles, error: storageError } = await supabaseClient.storage
        .from("memories")
        .remove([memory.filePath]);
    if (storageError) {
        console.error(storageError);
        status.textContent = "O Supabase recusou apagar o arquivo. Confira a policy de DELETE em storage.objects e execute o SQL atualizado.";
        return;
    }
    if (!removedFiles?.some(file => file.name === memory.filePath)) {
        console.error("Supabase não retornou o arquivo removido.", { filePath: memory.filePath, removedFiles });
        status.textContent = "O Supabase não confirmou a exclusão. Execute novamente o supabase-setup.sql atualizado (ele libera SELECT e DELETE para o administrador) e tente de novo.";
        return;
    }
    const { data: deletedRows, error: rowError } = await supabaseClient
        .from("memories")
        .delete()
        .eq("id", memoryId)
        .select("id");
    if (rowError) {
        console.error(rowError);
        status.textContent = "O arquivo foi apagado, mas não foi possível remover o registro da galeria.";
        return;
    }
    if (!deletedRows?.length) {
        status.textContent = "O arquivo foi apagado, mas o Supabase não removeu o registro. Confira a policy de DELETE em memories.";
        return;
    }

    uploadedMemories = uploadedMemories.filter(item => item.id !== memoryId);
    const carouselMemories = uploadedMemories.slice(0, MEMORY_CAROUSEL_LIMIT);
    memories.splice(0, memories.length,
        ...carouselMemories,
        ...originalMemories.slice(0, MEMORY_CAROUSEL_LIMIT - carouselMemories.length));
    const galleryItem = Array.from(document.querySelector(".gallery").children)
        .find(item => item.dataset.memoryId === memoryId);
    galleryItem?.remove();
    memoryIndex = 0;
    buildMemoryDots();
    showMemory(0);
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
        const carouselMemories = uploadedMemories.slice(0, MEMORY_CAROUSEL_LIMIT);
        memories.splice(0, memories.length,
            ...carouselMemories,
            ...originalMemories.slice(0, MEMORY_CAROUSEL_LIMIT - carouselMemories.length));
        buildMemoryDots();
        showMemory(memoryIndex);
        renderGalleryPage(1);
    } catch (error) {
        console.error("Não foi possível carregar as lembranças do Supabase.", error);
        document.getElementById("uploadStatus").textContent = "Não foi possível carregar as lembranças. Confira a configuração do Supabase.";
    }
}

async function initializeSupabase() {
    if (!supabaseClient) {
        updateGalleryAdminUI();
        document.getElementById("uploadStatus").textContent = "O Supabase não carregou. Verifique a URL, a Publishable key e a conexão.";
        return;
    }
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) console.error("Não foi possível recuperar a sessão do administrador.", error);
    galleryAdminUser = data?.session?.user || null;
    await refreshGalleryAdminPermission();
    await loadSavedMemories();
    try {
        await loadSavedNews();
    } catch (newsError) {
        console.error("Não foi possível carregar as notícias salvas.", newsError);
        document.getElementById("newsStatus").textContent = "Não foi possível carregar as notícias salvas. Execute o SQL atualizado do Supabase.";
    }
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
        status.textContent = "O armazenamento não está disponível. Tente novamente mais tarde.";
        return;
    }
    const title = titleInput.value.trim();
    const subtitle = subtitleInput.value.trim();
    if (!file || !title || !subtitle) {
        status.textContent = "Escolha um arquivo e preencha o título e o subtítulo.";
        return;
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        status.textContent = "Escolha um arquivo de imagem ou vídeo válido.";
        return;
    }
    if (file.size > 100 * 1024 * 1024) {
        status.textContent = "O arquivo precisa ter até 100 MB.";
        return;
    }
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    const filePath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    status.textContent = "Enviando arquivo para o Supabase…";
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
        memories.unshift(memory);
        memories.length = Math.min(memories.length, MEMORY_CAROUSEL_LIMIT);
        addGalleryItem(memory);
        buildMemoryDots();
        showMemory(0);
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
        status.textContent = "Lembrança enviada e compartilhada na galeria!";
    } catch (error) {
        console.error("Falha ao enviar mídia ao Supabase.", error);
        status.textContent = "Não foi possível enviar. Verifique sua conexão e as políticas configuradas no Supabase.";
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
        status.textContent = "O Supabase não está disponível. Confira a configuração do site.";
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
        status.textContent = "Não foi possível salvar. Confira sua conexão e execute o SQL atualizado do Supabase.";
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
        status.textContent = "Não foi possível apagar. Entre como administrador e confira se o SQL atualizado foi executado.";
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
