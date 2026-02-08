require('dotenv').config();
const puppeteer = require("puppeteer");
const Authenticator = require("./auth");
const attachNetworkLogger = require("./networkLogger");
const GamePlayer = require("./gamePlayer");

const URL = "https://guess-the-star.aimar.id/";

const username = process.env.USERNAME_Q;
const password = process.env.PASSWORD_Q;


(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  const page = await browser.newPage();

  attachNetworkLogger(page, {
    request: false,
    response: true,
  });

  await page.goto(URL, {
    waitUntil: "networkidle2",
  });

  const auth = new Authenticator(page);
  
  console.log("Username:", username);
  console.log("Password:", password);

  try {
    console.log("Opening login modal...");
    await auth.openModal();

    console.log("Performing login...");
    if(!username || !password){
      throw new Error("Username or password is missing");
    }

    // Ganti dengan username dan password yang sesuai
    await auth.login(username, password);
    await auth.delay(3000);

    // Tunggu navigasi atau feedback setelah login
    const isLogin = await auth.checkLogin();
    if (!isLogin) {
      throw new Error("Login failed");
    }
    console.log("Login successful!");

    // Start playing the game
    const gamePlayer = new GamePlayer(page);
    await gamePlayer.showAnswerKeyStats();

    console.log("\n🎮 Starting game...");
    await gamePlayer.playGame(); // Play 10 rounds
    
  } catch (error) {
    console.error(error);
  }
})();
