API_BASE = "https://api.thezsmc.co"

async function get_news(limit) {
    if (limit > 0) {url = `${API_BASE}/news?limit=${limit}`;} else {url = `${API_BASE}/news`;}
    try {
        const response = await fetch(url);
        const res = await response.json();
        return res["documents"];
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

async function populate_news_bar() {
        console.log("populate_news_bar called");
    articles = await get_news(3);
    const cont = document.getElementById("news-populate-lim3");
    console.log(cont);
    
    articles.forEach((article) => {
        cont.innerHTML += `
        <article class="research-card">
            <span class="eyebrow">
                ${new Date(article.updated_at).toLocaleDateString()}
            </span>
            <h3>${article.title}</h3>
            <p>${article.news}</p>
        </article>
        `;
    });
}

populate_news_bar();