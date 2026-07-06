const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const eventBus = require("./modules/eventBus.cjs");
const { getAllFilms } = require("./modules/fileManager.cjs");
const { logMessage } = require("./modules/logger.mjs");

const server = http.createServer(async (req, res) => {
  await logMessage("INFO", `${req.method} ${req.url}`);

  if (req.url === "/") {
    const data = await getAllFilms();
    const films = data.films;
    res.writeHead(200, { "Content-Type": "text/html" });

    const homePagePath = path.join(__dirname, "templates", "home.html");
    const title = "🎬 Film Arşivi Yönetimi";
    const totalMovieCount = films.length;

    let watchedCount = 0;
    let notWatchedCount = 0;
    let totalRating = 0;

    for (let movie of films) {
      if (movie.watched) {
        watchedCount++;
      } else {
        notWatchedCount++;
      }
      totalRating += movie.rating;
    }

    let averageRating = totalRating / films.length;

    let html = fs.readFileSync(homePagePath, "utf-8");

    html = html.replaceAll("{{title}}", title);
    html = html.replace("{{totalMovieCount}}", totalMovieCount);
    html = html.replace("{{watchedCount}}", watchedCount);
    html = html.replace("{{notWatchedCount}}", notWatchedCount);
    html = html.replace("{{averageRating}}", averageRating);

    res.end(html);
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
