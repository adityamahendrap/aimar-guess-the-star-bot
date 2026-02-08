  const { getAnswerByImageId, getAnswerStats  } = require("./answerKeyReader");
  const { saveGameResult } = require("./gameResultWriter");

  class GamePlayer {
    constructor(page) {
      this.page = page;
    }

    async delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async showStats() {
      const stats = getAnswerStats();
      console.log(`\n📊 Answer Key Stats:`);
      console.log(`   Total entries: ${stats.total}`);
      console.log(`   Unique images: ${stats.uniqueImages}`);
    }

    async getCurrentImageId() {
      const imgSrc = await this.page.$eval("#gameImage", (img) => img.src);
      // Extract image ID from URL like /api/v1/images/595c3fd6-71bb-42d1-831c-0f776727aa29
      const match = imgSrc.match(/\/images\/([a-f0-9-]+)/);
      return match ? match[1] : null;
    }

    async getChoices() {
      return await this.page.$$eval(".choice-btn", (buttons) =>
        buttons.map((btn) => ({
          id: btn.getAttribute("data-id"),
          text: btn.textContent,
          element: btn,
        }))
      );
    }

    async waitForQuestion(timeout = 8000) {
      try {
        await this.page.waitForSelector(".choice-btn", {
          visible: true,
          timeout,
        });
        return true;
      } catch {
        return false;
      }
    }

    async playRound() {
      // tunggu sampai benar-benar siap
      const ready = await this.waitForQuestion();
      if (!ready) {
        console.log("⏳ Question not ready yet, waiting...");
        return;
      }

      const imageId = await this.getCurrentImageId();
      console.log(`Current image ID: ${imageId}`);

      const answerKey = getAnswerByImageId(imageId);

      let selectedId;
      if (answerKey) {
        selectedId = answerKey.correct_id;
        console.log(`✓ Found answer in key: ${answerKey.correct_name}`);
      } else {
        const choices = await this.page.$$eval(".choice-btn", (buttons) =>
          buttons.map((btn) => btn.getAttribute("data-id"))
        );
        selectedId = choices[Math.floor(Math.random() * choices.length)];
        console.log(`? No answer found, picking random: ${selectedId}`);
      }

      await this.page.click(`button.choice-btn[data-id="${selectedId}"]`);
      console.log(`Clicked: ${selectedId}`);
    }

    async handleResultContinue() {
      try {
        await this.page.waitForSelector("#resultContinue", {
          visible: true,
          timeout: 2000,
        });

        // ambil result text
        const result = await this.page.evaluate(() => {
          const statusEl = document.querySelector("#resultStatus");
          const detailEl = document.querySelector("#resultDetail");

          const status = statusEl ? statusEl.textContent.trim() : null;
          const detail = detailEl ? detailEl.textContent.trim() : null;

          // extract score: contoh "4/10"
          let score = null;
          let correct = null;
          let total = null;

          if (detail) {
            const match = detail.match(/(\d+)\s*\/\s*(\d+)/);
            if (match) {
              correct = Number(match[1]);
              total = Number(match[2]);
              score = `${correct}/${total}`;
            }
          }

          return {
            timestamp: new Date().toISOString(),
            status,
            detail,
            score,     // "4/10"
            correct,   // 4
            total,     // 10
          };
        });

        // simpan ke file
        saveGameResult(result);

        console.log(
          `\n📊 Result saved: ${JSON.stringify(result)}`
        );

        // ▶ lanjutkan game
        await this.page.click("#resultContinue");
        await this.delay(1500);

      } catch {
        // result tidak muncul → normal
      }
    }

    async playGame() {
      let round = 1;
      while (true) {
        try {
          console.log(`\n🎮 Round ${round}`);
          await this.playRound();
          await this.handleResultContinue();
          round++;
        } catch (error) {
          console.error(`❌ Error in round ${round}:`, error);

          // recovery delay biar tidak spam error
          await this.delay(3000);
        }
      }
    }
  }

  module.exports = GamePlayer;
