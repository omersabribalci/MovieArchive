const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const eventBus = require("./modules/eventBus.cjs");
const { getAllFilms } = require("./modules/fileManager.cjs");
const { logMessage } = require("./modules/logger.mjs");

eventBus.on("filmViewed", async (title) => {
  await logMessage("EVENT", `filmViewed - Film: ${title}`);
});

eventBus.on("reportGenerated", async (fileName) => {
  await logMessage("EVENT", `reportGenerated - File: ${fileName}`);
});

const server = http.createServer(async (req, res) => {
  await logMessage("INFO", `${req.method} ${req.url}`);

  if (req.url === "/") {
    const data = await getAllFilms();
    const films = data.films;
    res.writeHead(200, { "Content-Type": "text/html" });

    const homePagePath = path.join(__dirname, "templates", "home.html");
    const title = "Film Arşivi Yönetimi";
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

    let averageRating = (totalRating / films.length).toFixed(1);

    let lastThreeAdded = films.slice(films.length - 3);

    let lastAddedList = `
    <ul>
      ${lastThreeAdded.map((film) => `<li>${film.title} (${film.year})</li>`).join("")}
    </ul>
    `;

    let html = fs.readFileSync(homePagePath, "utf-8");

    html = html.replaceAll("{{title}}", title);
    html = html.replace("{{totalfilmCount}}", totalfilmCount);
    html = html.replace("{{watchedCount}}", watchedCount);
    html = html.replace("{{notWatchedCount}}", notWatchedCount);
    html = html.replace("{{averageRating}}", averageRating);
    html = html.replace("{{lastAddedList}}", lastAddedList);

    res.end(html);
  } else if (req.url === "/films") {
    const data = await getAllFilms();
    const films = data.films;
    res.writeHead(200, { "Content-Type": "text/html" });

    const filmsPagePath = path.join(__dirname, "templates", "films.html");
    const title = "Filmler";
    const categoriesSet = new Set(films.map((film) => film.category));
    const categories = Array.from(categoriesSet);

    const categoryLinks = `
        <a href="/films"><li>Hepsini Göster</li></a>
        ${categories
          .map((cat) => {
            return `<a href="/films/category/${cat}"><li>${cat}</li></a>`;
          })
          .join("")}
    `;
    const content = `
        ${films
          .map((film) => {
            return `
          <div  class="film">
            <img />
            <div>${film.title}</div>
            <div>${film.year}</div>
            <div>${film.rating}</div>
            <a href="/films/${film.id}"> Film detayına git ➡️</a>
          </div>
          `;
          })
          .join("")}
    `;

    let html = fs.readFileSync(filmsPagePath, "utf-8");

    html = html.replaceAll("{{title}}", title);
    html = html.replace("{{categoryLinks}}", categoryLinks);
    html = html.replace("{{content}}", content);

    res.end(html);
  } else if (req.url.startsWith("/films/category")) {
    const category = req.url.split("/")[3];

    const data = await getAllFilms();
    const films = data.films;

    const categorizedFilms = films.filter((film) => film.category === category);

    res.writeHead(200, { "Content-Type": "text/html" });

    const filmsPagePath = path.join(__dirname, "templates", "films.html");
    const title = "Filmler";
    const categoriesSet = new Set(films.map((film) => film.category));
    const categories = Array.from(categoriesSet);

    const categoryLinks = `
        <a href="/films"><li>Hepsini Göster</li></a>
        ${categories
          .map((cat) => {
            return `<a href="/films/category/${cat}"><li>${cat}</li></a>`;
          })
          .join("")}
    `;

    const content = `
        ${categorizedFilms
          .map((film) => {
            return `
          <div  class="film">
            <img />
            <div>${film.title}</div>
            <div>${film.year}</div>
            <div>${film.rating}</div>
            <a href="/films/${film.id}"> Film detayına git ➡️</a>
          </div>
          `;
          })
          .join("")}
    `;

    let html = fs.readFileSync(filmsPagePath, "utf-8");

    html = html.replaceAll("{{title}}", title);
    html = html.replace("{{categoryLinks}}", categoryLinks);
    html = html.replace("{{content}}", content);

    res.end(html);
  } else if (req.url.startsWith("/films/")) {
    const id = req.url.split("/")[2];

    const data = await getAllFilms();
    const films = data.films;

    const film = films.find((film) => film.id.toString() === id);

    if (film) {
      res.writeHead(200, { "Content-Type": "text/html" });

      eventBus.emit("filmViewed", film.title);
      let title = film.title;
      let content = `
            <img />
            <div>${film.title}</div>
            <div>${film.director}</div>
            <div>${film.year}</div>
            <div>${film.rating}</div>
            <div>${film.category}</div>
            <div>${film.watched ? "İzlendi" : "İzlenmedi"}</div>
      `;
      const filmDetailsPath = path.join(
        __dirname,
        "templates",
        "film-detail.html",
      );
      let html = fs.readFileSync(filmDetailsPath, "utf-8");
      html = html.replaceAll("{{title}}", title);
      html = html.replaceAll("{{content}}", content);
      res.end(html);
    } else {
      res.writeHead(404, { "Content-Type": "text/html" });
      const notFoundPagePath = path.join(__dirname, "templates", "404.html");
      let html = fs.readFileSync(notFoundPagePath, "utf-8");
      res.end(html);
    }
  } else if (req.url === "/api/films") {
    const filmsJsonPath = path.join(__dirname, "data", "films.json");
    let json = fs.readFileSync(filmsJsonPath, "utf-8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(json);
  } else if (req.url === "/api/stats") {
    const data = await getAllFilms();
    const films = data.films;

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

    let averageRating = (totalRating / films.length).toFixed(1);

    const categories = films.map((film) => film.category);
    let lookup = {};
    for (let cat of categories) {
      lookup[cat] = (lookup[cat] || 0) + 1;
    }

    let statistics = {
      stats: {
        totalFilms: films.length,
        watchedFilms: watchedCount,
        notWatchedFilmes: notWatchedCount,
        averageRating: averageRating,
        categories: lookup,
      },
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(statistics));
  } else if (req.url === "/reports/export") {
    const data = await getAllFilms();
    const films = data.films;
    res.writeHead(200, { "Content-Type": "text/html" });

    const reportPath = path.join(__dirname, "reports", "films-export.txt");
    const writeStream = fs.createWriteStream(reportPath);
    writeStream.write("=== Film Arşivi Raporu ===\n");
    writeStream.write(`Oluşturulma: ${new Date().toLocaleString("sv-SE")}\n`);
    writeStream.write(`Toplam: ${films.length} film\n`);
    writeStream.write("================================\n\n");

    films.forEach((film) => {
      writeStream.write(`${film.id}. ${film.title} (${film.year})\n`);
      writeStream.write(`   Yönetmen: ${film.director}\n`);
      writeStream.write(
        `   Kategori: ${film.category} | Puan: ${film.rating}\n`,
      );
      writeStream.write(
        `   Durum: ${film.watched ? "✓ İzlendi" : "✗ İzlenmedi"}\n\n`,
      );
    });

    eventBus.emit("reportGenerated", "films-export.txt");

    res.end("<p>Report is created successfully in reports folder.</p>");
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    const notFoundPagePath = path.join(__dirname, "templates", "404.html");
    let html = fs.readFileSync(notFoundPagePath, "utf-8");
    res.end(html);
  }
});

server.listen(3000, async () => {
  await logMessage("INFO", "Server started on port 3000");
  console.log(`Server running on port 3000`);
});
