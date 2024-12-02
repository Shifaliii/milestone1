const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// In-memory storage
let articles = [];
const articlesFile = "articles.json";

// Load articles from file if persistence is enabled
if (fs.existsSync(articlesFile)) {
    const savedArticles = fs.readFileSync(articlesFile, "utf-8");
    articles = JSON.parse(savedArticles);
}

// Helper to save articles to file
const saveArticlesToFile = () => {
    fs.writeFileSync(articlesFile, JSON.stringify(articles, null, 2));
};
// Get All Articles (GET /articles)
app.get("/retrievearticles", (req, res) => {
    res.json({ articles });
});


// Add Article (POST /articles)
app.post("/articles", (req, res) => {
    const { title, content, tags } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required." });
    }

    const newArticle = {
        id: articles.length + 1,
        title,
        content,
        tags: tags || [],
        createdAt: new Date(),
    };

    articles.push(newArticle);
    saveArticlesToFile();
    res.status(201).json({ message: "Article added successfully!", article: newArticle });
});

// Search Articles (GET /articles/search)
app.get("/articles/search", (req, res) => {
    const { keyword, tag, sortBy } = req.query;

    if (!keyword && !tag) {
        return res.status(400).json({ error: "Keyword or tag is required for searching." });
    }

    let results = articles.filter(article => {
        const keywordMatch = keyword
            ? article.title.includes(keyword) || article.content.includes(keyword)
            : true;
        const tagMatch = tag ? article.tags.includes(tag) : true;
        return keywordMatch && tagMatch;
    });

    // Sort results
    if (sortBy === "relevance" && keyword) {
        results = results.sort((a, b) => {
            const keywordFrequency = text => (text.match(new RegExp(keyword, "gi")) || []).length;
            const aRelevance = keywordFrequency(a.title) + keywordFrequency(a.content);
            const bRelevance = keywordFrequency(b.title) + keywordFrequency(b.content);
            return bRelevance - aRelevance;
        });
    } else if (sortBy === "date") {
        results = results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ results });
});

// Get Article by ID (GET /articles/:id)
app.get("/articles/:id", (req, res) => {
    const { id } = req.params;
    const article = articles.find(article => article.id === parseInt(id));

    if (!article) {
        return res.status(404).json({ error: "Article not found." });
    }

    res.json({ article });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Mini Search Engine API running on http://localhost:${PORT}`);
});
