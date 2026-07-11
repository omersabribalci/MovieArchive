const fs = require("node:fs/promises");
const path = require("node:path");
const { logMessage } = require("./logger.mjs");

const getAllFilms = async () => {
  const filePath = path.join(__dirname, "..", "data", "films.json");
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    logMessage("ERROR", "Filmler çekilirken bir hata oluştu.");
    console.log(error);
  }
};

module.exports = { getAllFilms };
