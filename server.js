// tekrar eden kodları tek seferde createServerdan sonra ortak mı oluşturmalı?

const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const fss = require("node:fs"); // stream için

const eventBus = require("./modules/eventBus.cjs");
const {
  getAllFilms,
  getFilmIstatistics,
  renderFilmsList,
  renderCategoryLinks,
} = require("./modules/fileManager.cjs");
const { logMessage } = require("./modules/logger.mjs");

eventBus.on("filmViewed", (title) => {
  logMessage("EVENT", `filmViewed - Film: ${title}`);
});

eventBus.on("reportGenerated", (fileName) => {
  logMessage("EVENT", `reportGenerated - File: ${fileName}`);
});

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathName = parsedUrl.pathname;

    logMessage("INFO", `${req.method} ${req.url}`);

    if (pathName === "/") {
      const data = await getAllFilms();
      const films = data.films;

      const {
        totalfilmCount,
        watchedCount,
        notWatchedCount,
        averageRating,
        lastAddedList,
      } = getFilmIstatistics(films);

      res.writeHead(200, { "Content-Type": "text/html" });

      const homePagePath = path.join(__dirname, "templates", "home.html");
      const title = "Film Arşivi Yönetimi";

      let html = await fs.readFile(homePagePath, "utf-8");

      html = html.replace("{{title}}", title);
      html = html.replace("{{totalfilmCount}}", totalfilmCount);
      html = html.replace("{{watchedCount}}", watchedCount);
      html = html.replace("{{notWatchedCount}}", notWatchedCount);
      html = html.replace("{{averageRating}}", averageRating);
      html = html.replace("{{lastAddedList}}", lastAddedList);

      res.end(html);
    } else if (pathName === "/films") {
      const data = await getAllFilms();
      const films = data.films;

      res.writeHead(200, { "Content-Type": "text/html" });

      const filmsPagePath = path.join(__dirname, "templates", "films.html");
      const title = "Filmler";

      const { categoryLinks } = renderCategoryLinks(films);
      const { content } = renderFilmsList(films);

      let html = await fs.readFile(filmsPagePath, "utf-8");

      html = html.replace("{{title}}", title);
      html = html.replace("{{categoryLinks}}", categoryLinks);
      html = html.replace("{{content}}", content);

      res.end(html);
    } else if (pathName.startsWith("/films/category")) {
      const data = await getAllFilms();
      const films = data.films;

      const category = pathName.split("/")[3];
      const categorizedFilms = films.filter(
        (film) => film.category === category,
      );

      res.writeHead(200, { "Content-Type": "text/html" });

      const filmsPagePath = path.join(__dirname, "templates", "films.html");
      const title = "Filmler";

      const { categoryLinks } = renderCategoryLinks(films);
      const { content } = renderFilmsList(categorizedFilms);

      let html = await fs.readFile(filmsPagePath, "utf-8");

      html = html.replace("{{title}}", title);
      html = html.replace("{{categoryLinks}}", categoryLinks);
      html = html.replace("{{content}}", content);

      res.end(html);
    } else if (pathName.startsWith("/films/")) {
      const data = await getAllFilms();
      const films = data.films;

      const id = pathName.split("/")[2];
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
        let html = await fs.readFile(filmDetailsPath, "utf-8");
        html = html.replace("{{title}}", title);
        html = html.replace("{{content}}", content);
        res.end(html);
      } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        const notFoundPagePath = path.join(__dirname, "templates", "404.html");
        logMessage("ERROR", "Film bulunamadı...");
        let html = await fs.readFile(notFoundPagePath, "utf-8");
        res.end(html);
      }
    } else if (pathName === "/api/films") {
      const filmsJsonPath = path.join(__dirname, "data", "films.json");
      let json = await fs.readFile(filmsJsonPath, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(json);
    } else if (pathName === "/api/stats") {
      const data = await getAllFilms();
      const films = data.films;
      const {
        totalfilmCount,
        watchedCount,
        notWatchedCount,
        averageRating,
        categoryBased,
      } = getFilmIstatistics(films);

      let statistics = {
        stats: {
          totalFilms: totalfilmCount,
          watchedFilms: watchedCount,
          notWatchedFilmes: notWatchedCount,
          averageRating: averageRating,
          categories: categoryBased,
        },
      };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(statistics));
    } else if (pathName === "/reports/export") {
      const data = await getAllFilms();
      const films = data.films;

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

      const reportPath = path.join(__dirname, "reports", "films-export.txt");
      const writeStream = fss.createWriteStream(reportPath);

      writeStream.on("error", (err) => {
        logMessage("ERROR", "Rapor yazılırken hata oluştu");
        console.error("Rapor yazılırken hata oluştu:", err);
        if (!res.headersSent) res.end("<p>Rapor oluşturulamadı.</p>");
      });

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

      writeStream.end(() => {
        eventBus.emit("reportGenerated", "films-export.txt");
        res.end("<p>Rapor reports klasörüne başarıyla oluşturuldu.</p>");
      });
    } else {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      const notFoundPagePath = path.join(__dirname, "templates", "404.html");
      logMessage("ERROR", "Sayfa bulunamadı...");
      let html = await fs.readFile(notFoundPagePath, "utf-8");
      res.end(html);
    }
  } catch (error) {
    logMessage("ERROR", `Sunucu Hatası: ${error.message}`);
    console.error("Kritik Sunucu Hatası:", error);

    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("500 - Sunucu İçi Hata. Lütfen daha sonra tekrar deneyin.");
    }
  }
});

server.listen(3000, () => {
  logMessage("INFO", "Server started on port 3000");
  console.log(`Server running on port 3000`);
});
