const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "logs");
const ANSWER_FILE = path.join(LOG_DIR, "answer-key.json");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function readAnswers() {
  if (!fs.existsSync(ANSWER_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ANSWER_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeAnswers(data) {
  fs.writeFileSync(ANSWER_FILE, JSON.stringify(data, null, 2));
}

function isDuplicate(answers, entry) {
  return answers.some(
    (a) =>
      a.image_id === entry.image_id ||
      a.round_id === entry.round_id
  );
}

function saveAnswerKey(entry) {
  const answers = readAnswers();

  if (isDuplicate(answers, entry)) {
    return; 
  }

  answers.push(entry);
  writeAnswers(answers);
}

function handleAnswerKey(answerBody, roundContext) {
  saveAnswerKey({
    timestamp: new Date().toISOString(),
    image_id: roundContext.image_id,
    image_url: roundContext.image_url,
    round_id: roundContext.round_id,
    correct_id: answerBody.correct_id,
    correct_name: answerBody.correct_name,
  });
}


module.exports = { handleAnswerKey };
