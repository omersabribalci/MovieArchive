const fs = require("node:fs/promises");
const path = require("node:path");
const { logError } = require("./logger.mjs");

const getAllFilms = async () => {
  const filePath = path.join(__dirname, "..", "data", "films.json");
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    logError("Filmler çekilirken bir hata oluştu.");
    console.log(err);
  }
};

const getFilmIstatistics = (films) => {
  const totalfilmCount = films.length;
  let watchedCount = 0;
  let notWatchedCount = 0;
  let totalRating = 0;

  for (let film of films) {
    totalRating += film.rating;
    if (film.watched) {
      watchedCount++;
    } else {
      notWatchedCount++;
    }
  }

  let averageRating = (totalRating / totalfilmCount).toFixed(1);

  let lastThreeAdded = films.slice(totalfilmCount - 3);

  let lastAddedList = `
        <ul>
          ${lastThreeAdded.map((film) => `<li>${film.title} (${film.year})</li>`).join("")}
        </ul>
        `;

  const categories = films.map((film) => film.category);
  let categoryBased = {};
  for (let cat of categories) {
    categoryBased[cat] = (categoryBased[cat] || 0) + 1;
  }

  return {
    totalfilmCount,
    watchedCount,
    notWatchedCount,
    averageRating,
    lastAddedList,
    categoryBased,
  };
};

const renderFilmsList = (filmsToRender) => {
  const content = filmsToRender
    .map(
      (film) => `
        <div class="film">
            <img />
            <div>${film.title}</div>
            <div>${film.year}</div>
            <div>${film.rating}</div>
            <a href="/films/${film.id}"> Film detayına git ➡️</a>
        </div>
    `,
    )
    .join("");

  return { content };
};

const renderCategoryLinks = (films) => {
  const categoriesSet = new Set(films.map((f) => f.category));
  const categories = Array.from(categoriesSet);

  const categoryLinks = `
        <a href="/films"><li>Hepsini Göster</li></a>
        ${categories.map((cat) => `<a href="/films/category/${cat}"><li>${cat}</li></a>`).join("")}
    `;

  return { categoryLinks };
};

module.exports = {
  getAllFilms,
  getFilmIstatistics,
  renderFilmsList,
  renderCategoryLinks,
};
