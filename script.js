const button = document.getElementById("theme-toggle");
const body = document.body;
document.body.classList.add("no-transition");
// modals
const modal = document.getElementById("moreInfo");
const openBtn = document.getElementById("openMoreInfo");
const closeBtn = modal.querySelector(".close");

openBtn.addEventListener("click", () => {
    modal.style.display = "block";
});

closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});
// pages
function animateProgressBars(container) {
    const fills = container.querySelectorAll(".fill");

    fills.forEach(fill => {
        const target = parseInt(fill.dataset.percent, 10);
        const text = fill.querySelector(".percent-text");

        // reset state
        fill.style.transition = "none";
        fill.style.width = "0%";
        text.textContent = "0%";

        // force layout
        fill.offsetWidth;

        // re-enable transition
        fill.style.transition = "width 1s ease";

        // animate width next frame
        requestAnimationFrame(() => {
            fill.style.width = target + "%";
        });

        // number animation (sync with 1s)
        const start = performance.now();
        const duration = 1000;

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const value = Math.round(progress * target);
            text.textContent = value + "%";

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                text.textContent = target + "%";
            }
        }

        requestAnimationFrame(tick);
    });
}

function showPage() {
  const hash = window.location.hash || "#about"; // default to home
  const pages = document.querySelectorAll(".page");

  let visiblePage = null;

  pages.forEach(page => {
    if ("#" + page.id === hash) {
      page.style.display = "block"; 
      visiblePage = page;
    } else {
      page.style.display = "none";
    }
  });

  if (visiblePage) {
    requestAnimationFrame(() => {
      animateProgressBars(visiblePage);
    });
  }
  // hide modal
  modal.style.display = "none";
}

window.addEventListener("load", showPage);

window.addEventListener("hashchange", showPage);
// page buttons
document.querySelectorAll("button[data-page]").forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;
    window.location.hash = page;
  });
});

const theme = localStorage.getItem("theme");
if (theme === "light") {
    document.documentElement.classList.add("light");
} else {
    document.documentElement.classList.remove("light");
}
// set theme to os if theme property isnt set
if (theme === null) {
	if (window.matchMedia) {
	    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

	    if (prefersDark) {
		localStorage.setItem("theme", "dark");
	    } else {
		localStorage.setItem("theme", "light");
	    }
	}
}

requestAnimationFrame(() => {
    document.body.classList.remove("no-transition");
});

function updateButtonText() {
    button.textContent = document.documentElement.classList.contains("light")
        ? "🌙"
        : "☀️";
}

updateButtonText();

button.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");

    if (document.documentElement.classList.contains("light")) {
        localStorage.setItem("theme", "light");
    } else {
        localStorage.setItem("theme", "dark");
    }

    updateButtonText();
});
// add to list
function addItemFromInput() {
    const inputField = document.getElementById("itemInput");
    const newItemText = inputField.value;

    if (newItemText.trim() === '') {
        alert("Please type something.");
        return;
    }

    const newItem = document.createElement("li");
    newItem.textContent = newItemText;
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "❌";
    deleteButton.className = "delete-btn";

    deleteButton.onclick = function() {
        deleteItem(this);
    };

    newItem.appendChild(deleteButton);

    const list = document.getElementById("cats");

    // Add the completed LI to the UL
    list.appendChild(newItem);

    // Clear the input field
    inputField.value = '';
    inputField.focus();
}

function deleteItem(deleteButtonElement) {
    const listItem = deleteButtonElement.closest("li");

    if (listItem && listItem.parentNode) {
        listItem.parentNode.removeChild(listItem);
    } else {
        console.error("Could not find the parent <li> element to remove.");
    }
}
