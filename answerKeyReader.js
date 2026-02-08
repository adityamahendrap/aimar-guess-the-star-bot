const fs = require("fs");
const path = require("path");

const ANSWER_FILE = path.join(__dirname, "logs", "answer-key.json");

function readAnswerFile() {
  if (!fs.existsSync(ANSWER_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ANSWER_FILE, "utf8"));
  } catch {
    return [];
  }
}

function getAnswerByImageId(imageId) {
  const data = readAnswerFile();
  return data.find((item) => item.image_id === imageId) || null;
}

function getAnswerStats() {
  const data = readAnswerFile();
  return {
    total: data.length,
    uniqueImages: new Set(data.map((d) => d.image_id)).size,
  };
}

module.exports = {
  getAnswerByImageId,
  getAnswerStats,
};
