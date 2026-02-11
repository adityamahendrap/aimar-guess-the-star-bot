// networkLogger.js
const fs = require("fs");
const path = require("path");
const { handleAnswerKey } = require("./answerKeyWriter");

const LOG_DIR = path.join(__dirname, "logs");
const LOG_FILE = path.join(LOG_DIR, "network-log.json");

let lastRoundContext = null;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function readLogs() {
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  fs.writeFileSync(
    LOG_FILE,
    JSON.stringify(logs, null, 2)
  );
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function attachRequestLogger(page, { filter }) {
  page.on("request", (request) => {
    const type = request.resourceType();
    if (!filter(type)) return;

    const logs = readLogs();

    logs.push({
      timestamp: new Date().toISOString(),
      event: "request",
      method: request.method(),
      url: request.url(),
      payload: safeParseJSON(request.postData()),
    });

    writeLogs(logs);
  });
}

function attachResponseLogger(page, { filter }) {
  page.on("response", async (response) => {
    const request = response.request();
    const type = request.resourceType();
    if (!filter(type)) return;

    let body;
    try {
      body = safeParseJSON(await response.text());
    } catch {
      body = null;
    }

    // const logs = readLogs();
    // logs.push({
    //   timestamp: new Date().toISOString(),
    //   event: "response",
    //   method: request.method(),
    //   url: response.url(),
    //   status: response.status(),
    //   body,
    // });
    // writeLogs(logs);

    if (
      response.url().includes("/api/v1/game/round") &&
      body?.image_id
    ) {
      lastRoundContext = {
        image_id: body.image_id,
        image_url: body.image_url,
        round_id: body.round_id,
      };
    }

    if (
      response.url().includes("/api/v1/game/answer") &&
      body?.correct_id &&
      lastRoundContext
    ) {
      handleAnswerKey(body, lastRoundContext);
      lastRoundContext = null;
    }
  });
}

function attachNetworkLogger(page, options = {}) {
  const {
    enabled = true,
    filter = (type) => type === "xhr" || type === "fetch",
    request = true,
    response = true,
  } = options;

  if (!enabled) return;

  if (request) attachRequestLogger(page, { filter });
  if (response) attachResponseLogger(page, { filter });
}

module.exports = attachNetworkLogger;

