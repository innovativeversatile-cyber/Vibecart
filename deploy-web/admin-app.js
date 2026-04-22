const PIN_KEY = "vibecart-admin-device-pin";
const gateCard = document.getElementById("gateCard");
const panelCard = document.getElementById("panelCard");
const pinInput = document.getElementById("devicePin");
const openBtn = document.getElementById("openPanelInApp");
const installBtn = document.getElementById("installAdminApp");
let deferredPrompt = null;

function hashPin(pin) {
  let hash = 0;
  for (let i = 0; i < pin.length; i += 1) {
    hash = (hash << 5) - hash + pin.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function openPanel() {
  gateCard.classList.add("hidden");
  panelCard.classList.remove("hidden");
  window.location.href = "./admin.html";
}

openBtn.addEventListener("click", () => {
  const value = String(pinInput.value || "").trim();
  if (value.length < 6) {
    alert("Use at least 6 characters for device PIN.");
    return;
  }
  const existing = localStorage.getItem(PIN_KEY);
  const hashed = hashPin(value);
  if (existing && existing !== hashed) {
    alert("Wrong device PIN.");
    return;
  }
  if (!existing) {
    localStorage.setItem(PIN_KEY, hashed);
  }
  openPanel();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./admin-app-sw.js?v=20260417ultra").catch(() => {});
  });
}
