const fs = require("node:fs/promises");
const path = require("node:path");

const filePath = path.join(__dirname, "..", "data", "films.json");

const getAllFilms = async () => {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getAllFilms };
