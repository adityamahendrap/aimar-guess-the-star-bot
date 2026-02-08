const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "logs");
const RESULT_FILE = path.join(LOG_DIR, "game-results.json");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function readResults() {
  if (!fs.existsSync(RESULT_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(RESULT_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeResults(data) {
  fs.writeFileSync(RESULT_FILE, JSON.stringify(data, null, 2));
}

function saveGameResult(entry) {
  const results = readResults();
  results.push(entry);
  writeResults(results);
}

module.exports = { saveGameResult };
