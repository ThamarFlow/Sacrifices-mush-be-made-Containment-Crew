// client/js/dialogueUI.js
export default class DialogueUI {
  constructor() {
    this.box = document.getElementById("dialogueBox");
    this.textEl = document.getElementById("dialogueText");
  }

  show(text) {
    if (!this.box || !this.textEl) return;
    this.textEl.textContent = text;
    this.box.style.display = "block";
  }

  hide() {
    if (!this.box) return;
    this.box.style.display = "none";
  }
}
