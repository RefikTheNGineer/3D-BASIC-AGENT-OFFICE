# 🏢 3D AI Agent Team Office (VS Code Copilot QA Team)

An interactive **3D Three.js Web Office** and modular **VS Code Copilot Agent Team** (`Tester`, `Reviewer`, `Fixer`) designed for automated code testing, auditing, and bug-fixing workflows.

🌐 **Live 3D Demo:** [https://RefikTheNGineer.github.io/3D-BASIC-AGENT-OFFICE/](https://RefikTheNGineer.github.io/3D-BASIC-AGENT-OFFICE/)

---

## 🚀 Features

- **3D Interactive Agent Office (`index.html`):** Built with Three.js. Supports real-time **EN / TR** language switching. Click on any 3D agent character (`Tester`, `Reviewer`, `Fixer`) to assign tasks or copy role-specific prompts directly into VS Code Copilot Chat.
- **Modular Custom Modes (`.github/chatmodes/`):** Run each specialist individually from the VS Code Chat mode selector:
  - 🔵 **Tester:** Executes project builds/tests and reports failures with exact line numbers.
  - 🟣 **Reviewer:** Audits code for logic bugs, edge cases, and structural flaws.
  - 🟠 **Fixer:** Resolves reported issues at the root cause and re-verifies via tests.
- **Single-Command Team Orchestration (`/run-qa-team`):** Runs all three agents sequentially in an automated loop until all tests pass and the reviewer approves.

---

## 🛠️ How to Use in Your VS Code Project

1. Copy the `.github/` folder from this repository into the root directory of your own project.
2. Open **Copilot Chat** in VS Code (`Ctrl + Alt + I`).
3. **Run Individually:** Select `tester`, `reviewer`, or `fixer` from the Chat mode dropdown menu.
4. **Run as a Team:** Type `/run-qa-team` in the chat input and press Enter.
5. **3D Visual Interface:** Open `index.html` in your browser (or via the Live Demo link above), click a 3D agent, type your question, and paste the generated prompt into Copilot Chat.

---

## 🇹🇷 Türkçe Özet

Bu proje, VS Code Copilot üzerinde çalışan otonom bir **Test ve Kod Denetim Takımı** (`Tester`, `Reviewer`, `Fixer`) ile bu ajanlara 3D sahne üzerinden tıklayıp soru sormanızı sağlayan **Three.js tabanlı 3D Ajan Ofisi** arayüzünü içerir.

- **Tek Komutla Takım Çalışması:** Kendi projenizin ana dizinine `.github` klasörünü kopyalayın ve VS Code Chat panelinde `/run-qa-team` komutunu çalıştırın.
- **Canlı 3D Arayüz:** Sağ üstteki `TR / EN` butonu ile dili değiştirebilir, karakterlerin üzerine tıklayarak ilgili ajana özel komutu tek tıkla kopyalayabilirsiniz.