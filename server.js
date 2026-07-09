const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const eventBus = require("./modules/eventBus.cjs");
const { getAllFilms } = require("./modules/fileManager.cjs");
const { logMessage } = require("./modules/logger.mjs");

eventBus.on("filmViewed", async (title) => {
  await logMessage("EVENT", `filmViewed - Film: ${title}`);
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
    html = html.replaceAll("{{content}}", content);

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
