/* =========================================
   OUR LOVE CHRONICLE
   JavaScript
========================================= */


/* =========================================
   DATA DO RELACIONAMENTO
========================================= */

// MUDE ESTA DATA PARA A DATA EM QUE A HISTÓRIA
// DE VOCÊS COMEÇOU.

const relationshipStart = new Date("2025-01-01");


/* =========================================
   CONTADOR
========================================= */

function updateLoveCounter() {

    const today = new Date();

    const difference =
        today.getTime() - relationshipStart.getTime();

    const days =
        Math.floor(difference / (1000 * 60 * 60 * 24));

    document.getElementById("loveCounter").textContent =
        `${days} DAYS`;

}

updateLoveCounter();


/* =========================================
   CARROSSEL DE LEMBRANÇAS DA CAPA
========================================= */

const memories = [
    {
        image: "images/foto31.jpeg",
        title: "UM DOS DIAS QUE PASSAMOS MAIS TEMPO JUNTOS",
        comment: "Dizem que alguns minutos mudam tudo, e mudam mesmo. A nossa realidade se transforma em momentos quando passamos tempo de qualidade juntos."
    },
    {
        image: "images/foto8.jpeg",
        title: "VIMOS O PÔR DO SOL JUNTOS",
        comment: "Foi um dia que a gente foi no mirante, no quebrando silencio. Vimos o pôr do sol juntos. Primeira vez que a gente viu um pôr do sol juntos."
    },
    {
        image: "images/foto9.jpeg",
        title: "MINHA MÃE TIROU A FOTO DA GENTE",
        comment: "Tentando ficar charmosos, mas a gente não consegue, e minha mãe não ajuda. Mas mesmo assim, a gente se ama e isso é o que importa."
    },
    {
        image: "images/foto34.jpeg",
        title: "DIA NA IGREJA COM A GABI",
        comment: "Foi um dia que a gente foi na igreja, e a gente se divertiu muito."
    },
    {
        image: "images/foto28.jpeg",
        title: "FUI NA CASA DA GABI",
        comment: "Algumas memórias não precisam de grandes acontecimentos. Estar junto já faz qualquer momento valer a pena."
    },
    {
        image: "images/foto50.jpeg",
        title: "NÓS DOIS, FAZENDO GRACINHA",
        comment: "Estarmos juntos já é motivo suficiente para transformar qualquer dia em uma lembrança especial."
    }
];
const originalMemories = memories.slice();
const MEMORY_CAROUSEL_LIMIT = 6;
const GALLERY_PAGE_SIZE = 24;

const MEMORY_DB_NAME = "ourLoveChronicleMedia";
const MEMORY_STORE_NAME = "memories";
let uploadedMemories = [];
let uploadedObjectUrls = [];

function openMemoryDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(MEMORY_DB_NAME, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(MEMORY_STORE_NAME)) {
                request.result.createObjectStore(MEMORY_STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getSavedMemories() {
    const database = await openMemoryDatabase();
    return new Promise((resolve, reject) => {
        const request = database.transaction(MEMORY_STORE_NAME).objectStore(MEMORY_STORE_NAME).getAll();
        request.onsuccess = () => { database.close(); resolve(request.result); };
        request.onerror = () => { database.close(); reject(request.error); };
    });
}

async function saveMemory(record) {
    const database = await openMemoryDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(MEMORY_STORE_NAME, "readwrite");
        transaction.objectStore(MEMORY_STORE_NAME).put(record);
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onerror = () => { database.close(); reject(transaction.error); };
    });
}

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
window.setInterval(() => showMemory(memoryIndex + 1), 4000);

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
    document.querySelector(".gallery").append(item);
}

renderGalleryPage(1);

async function loadSavedMemories() {
    try {
        const records = await getSavedMemories();
        const savedMemories = records.sort((a, b) => a.createdAt - b.createdAt).map(record => {
            const image = URL.createObjectURL(record.file);
            uploadedObjectUrls.push(image);
            return { image, title: record.title, comment: record.subtitle, type: record.type, category: record.category || "us" };
        });
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
        console.error("Não foi possível carregar as lembranças salvas.", error);
    }
}

loadSavedMemories();

async function addMemoryUpload() {
    const fileInput = document.getElementById("memoryFile");
    const titleInput = document.getElementById("memoryUploadTitle");
    const subtitleInput = document.getElementById("memoryUploadSubtitle");
    const categoryInput = document.getElementById("memoryUploadCategory");
    const status = document.getElementById("uploadStatus");
    const file = fileInput.files[0];
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
    const record = {
        id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
        title,
        subtitle,
        category: categoryInput.value,
        type: file.type.startsWith("video/") ? "video" : "image",
        file,
        createdAt: Date.now()
    };
    status.textContent = "Salvando lembrança…";
    try {
        await saveMemory(record);
        const image = URL.createObjectURL(file);
        uploadedObjectUrls.push(image);
        const memory = { image, title, comment: subtitle, type: record.type, category: record.category };
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
            || (activeGalleryFilter === "videos" && (record.type === "video" || record.category === "videos"))
            || activeGalleryFilter === record.category;
        renderGalleryPage(uploadedMatchesFilter ? Math.ceil(matchingCount / GALLERY_PAGE_SIZE) : 1);
        fileInput.value = "";
        titleInput.value = "";
        subtitleInput.value = "";
        categoryInput.value = "us";
        status.textContent = "Lembrança adicionada à galeria e ao carrossel!";
    } catch (error) {
        console.error(error);
        status.textContent = "Não foi possível salvar. Verifique o espaço disponível no navegador e tente novamente.";
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

let news = [

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


/* =========================================
   RENDERIZAR NOTÍCIAS
========================================= */

function renderNews() {

    const homeContainer =
        document.getElementById("homeNews");

    const allContainer =
        document.getElementById("allNews");

    homeContainer.innerHTML = "";
    allContainer.innerHTML = "";


    news.forEach(item => {

        const element = document.createElement("article");

        element.className = "news-item";

        element.innerHTML = `

            <div class="news-date">
                ${item.date}
            </div>

            <div>

                <h3>
                    ${item.title}
                </h3>

                <p>
                    ${item.description}
                </p>

            </div>

        `;

        allContainer.appendChild(
            element.cloneNode(true)
        );

    });


    news
        .slice(0, 2)
        .forEach(item => {

            const element =
                document.createElement("article");

            element.className =
                "news-item";

            element.innerHTML = `

                <div class="news-date">
                    ${item.date}
                </div>

                <div>

                    <h3>
                        ${item.title}
                    </h3>

                    <p>
                        ${item.description}
                    </p>

                </div>

            `;

            homeContainer.appendChild(element);

        });

}

renderNews();


/* =========================================
   ADICIONAR NOTÍCIA
========================================= */

function addNews() {

    const title =
        document.getElementById("newsTitle").value.trim();

    const description =
        document
            .getElementById("newsDescription")
            .value
            .trim();


    if (!title || !description) {

        alert(
            "Preencha o título e a descrição da notícia."
        );

        return;

    }


    const today =
        new Date();


    const date =
        today
            .toLocaleDateString(
                "en-US",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )
            .toUpperCase();


    news.unshift({

        date: date,

        title: title,

        description: description

    });


    document.getElementById("newsTitle").value = "";

    document.getElementById("newsDescription").value = "";


    renderNews();


    alert(
        "📰 Notícia publicada no Our Love Chronicle!"
    );

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
