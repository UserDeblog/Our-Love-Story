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

    const modal =
        document.getElementById("imageModal");

    const modalImage =
        document.getElementById("modalImage");

    modalImage.src =
        image.src;

    modalImage.alt =
        image.alt;

    modal.classList.add("show");

}


function closeImage() {

    document
        .getElementById("imageModal")
        .classList.remove("show");

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

    "Casal continua escrevendo a história mais bonita de todas.",

    "URGENTE: Gabi continua sendo considerada a pessoa mais importante desta redação.",

    "EXCLUSIVO: fontes confirmam que o amor continua crescendo.",

    "PLANTÃO: mais um dia ao lado da pessoa amada entra para o arquivo.",

    "ÚLTIMA HORA: especialistas afirmam que estar juntos continua sendo a melhor parte do dia.",

    "BREAKING: não há previsão para o fim dessa história."

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