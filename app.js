/* =========================================================
   CONFIGURAÇÃO DO SUPABASE
   ========================================================= */
const SUPABASE_URL = "https://tzolokxetilunyfzovav.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0HJWnbqDMg1LFwLuhaRLDg_FvEXwxZd";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.db = db;

let currentUser = null;

/* =========================================================
   HELPERS
   ========================================================= */
function $(id) { return document.getElementById(id); }

function go(page) {
  window.location.href = page + ".html";
}

// Carrega o menu em qualquer página que tenha a div id="menu"
async function loadMenu() {
  const menuDiv = $("menu");
  if (!menuDiv) return;
  
  try {
    const response = await fetch("menu.html", { cache: "no-cache" });
    if (!response.ok) throw new Error("Erro ao carregar menu");
    menuDiv.innerHTML = await response.text();
    
    // Marca o botão ativo com base na página atual
    const page = document.body.dataset.page;
    document.querySelectorAll(".nav button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === page);
    });
  } catch (error) {
    console.error("Erro no menu:", error);
  }
}

/* =========================================================
   LOGIN E AUTH (Mesma lógica de antes)
   ========================================================= */
async function initLogin() {
  const loginForm = $("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;
    const message = $("loginMessage");
    const button = loginForm.querySelector('button[type="submit"]');

    if (button) { button.disabled = true; button.textContent = "Entrando..."; }
    
    const result = await db.auth.signInWithPassword({ email, password });

    if (result.error) {
      if (message) message.innerHTML = '<div class="message error">' + result.error.message + '</div>';
      if (button) { button.disabled = false; button.textContent = "Entrar"; }
      return;
    }

    window.location.href = "ferias.html";
  });
}

async function requireAuth() {
  const result = await db.auth.getSession();
  
  if (result.error || !result.data.session) {
    window.location.replace("index.html");
    return false;
  }

  currentUser = result.data.session.user;
  window.currentUser = currentUser;

  const userNameElement = document.getElementById("userName");
  if (userNameElement) {
    userNameElement.textContent = currentUser.email || "Usuário Logado";
  }
  return true;
}

async function logout() {
  await db.auth.signOut();
  window.location.replace("index.html");
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
document.addEventListener("DOMContentLoaded", async function () {
  const page = document.body.dataset.page;

  if (page === "login" || $("loginForm")) {
    await initLogin();
    return;
  }

  if (page === "ferias" || page === "dashboard") {
    const auth = await requireAuth();
    if (auth) {
      await loadMenu();
    }
    return;
  }
});