import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, "..", "logs", "app.log");

const logMessage = async (logName, message) => {
  const now = new Date();

  try {
    await fs.appendFile(
      logFilePath,
      `[${now.toLocaleString("sv-SE")}] ${logName}: ${message}\n`,
    );
  } catch (error) {
    console.log("Dosya yazılırken bir hata oluştu.", error);
  }
};

export { logMessage };
