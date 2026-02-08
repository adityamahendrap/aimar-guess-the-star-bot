class Authenticator {
  constructor(page) {
    this.page = page;
  }

  async openModal() {
    await this.page.waitForSelector("#openProfile");
    await this.page.click("#openProfile");
    await this.page.waitForSelector("#authSection", { visible: true });
  }

  async switchToRegister() {
    await this.page.click("#showRegisterLink");
    await this.page.waitForSelector("#registerActions", { visible: true });
  }

  async switchToLogin() {
    await this.page.click("#showLoginLink");
    await this.page.waitForSelector("#loginActions", { visible: true });
  }

  async login(username, password) {
    await this.page.type("#authUsername", username);
    await this.page.type("#authPassword", password);
    await this.page.click("#loginBtn");
  }

  async register(username, name, password) {
    await this.switchToRegister();
    await this.page.type("#authUsername", username);
    await this.page.type("#authName", name);
    await this.page.type("#authPassword", password);
    await this.page.click("#registerBtn");
  }

  async checkLogin() {
    if (await this.page.$("#logoutBtn")) {
      return true;
    }
  }

  async getError() {
    return await this.page.$eval("#authError", (el) => el.textContent);
  }
}

module.exports = Authenticator;
