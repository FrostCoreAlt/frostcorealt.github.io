// ===== Theme Initialization =====
const themeButton = document.getElementById("theme-toggle");

// Determine theme: localStorage or OS preference
let theme = localStorage.getItem("theme");
if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    localStorage.setItem("theme", theme);
}

// Apply theme immediately
document.documentElement.classList.toggle("light", theme === "light");

// Update toggle button text
function updateButtonText() {
    if (!themeButton) return;
    themeButton.textContent = document.documentElement.classList.contains("light") ? "🌙" : "☀️";
}
updateButtonText();

if (themeButton) {
    themeButton.addEventListener("click", () => {
        document.documentElement.classList.toggle("light");
        localStorage.setItem(
            "theme",
            document.documentElement.classList.contains("light") ? "light" : "dark"
        );
        updateButtonText();
    });
}

// ===== Blog SPA =====
const postsListEl = document.getElementById("posts-list");
const postContentEl = document.getElementById("post-content");
let posts = [];

fetch('posts.json')
    .then(res => res.json())
    .then(data => {
        posts = data;

        // Render post boxes
        posts.forEach(post => {
            const box = document.createElement("div");
            box.className = "post-box";

            const title = document.createElement("h2");
            title.textContent = post.title;
            box.appendChild(title);

            const date = document.createElement("div");
            date.className = "post-date";
            date.textContent = post.date;
            box.appendChild(date);

            const summary = document.createElement("div");
            summary.className = "post-summary";
            summary.textContent = post.summary || ""; // optional summary field
            box.appendChild(summary);

            const readBtn = document.createElement("button");
            readBtn.textContent = "Read post";
            readBtn.addEventListener("click", () => {
                location.hash = post.file.replace(/^posts\//, '').replace(/\.md$/, '');
            });
            box.appendChild(readBtn);

            postsListEl.appendChild(box);
        });

        // Load post if hash exists
        if (location.hash) loadPostFromHash();
    })
    .catch(err => {
        postsListEl.innerHTML = `<p style="color:red;">Failed to load posts.json: ${err}</p>`;
    });

// Hash change listener
window.addEventListener("hashchange", loadPostFromHash);

function loadPostFromHash() {
    const hash = location.hash.slice(1);
    if (!hash) return;

    const post = posts.find(p => p.file.includes(hash));
    if (!post) return;

    fetch(post.file)
        .then(res => res.text())
        .then(md => {
            const html = marked.parse(md);
            postContentEl.innerHTML = html;

            // Add code-block class and highlight syntax
            postContentEl.querySelectorAll("pre > code").forEach(codeEl => {
                const pre = codeEl.parentElement;
                pre.classList.add("code-block");

                // Highlight with highlight.js
                hljs.highlightElement(codeEl);
            });
        })
        .catch(err => {
            postContentEl.innerHTML = `<p style="color:red;">Failed to load post: ${err}</p>`;
        });
}
