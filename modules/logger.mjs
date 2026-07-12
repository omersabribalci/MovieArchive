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
    console.log("Log yazılırken bir hata oluştu.", error);
  }
};

const logInfo = (message) => logMessage("INFO", message);
const logWarn = (message) => logMessage("WARN", message);
const logError = (message) => logMessage("ERROR", message);

export { logMessage, logInfo, logWarn, logError };
