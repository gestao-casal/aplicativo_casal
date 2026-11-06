/* =========================================================
   CONFIGURAÇÃO DO SUPABASE
   ========================================================= */
const SUPABASE_URL = "https://tzolokxetilunyfzovav.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0HJWnbqDMg1LFwLuhaRLDg_FvEXwxZd";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.db = db;

let currentUser = null;

function $(id) { return document.getElementById(id); }

function go(page) {
  if (page.includes('.html') || page.includes('?')) {
    window.location.href = page;
  } else {
    window.location.href = page + ".html";
  }
}

// Atualize a função de toggle para receber a seta
function toggleSubmenu(submenuId, arrowId) {
  const submenu = document.getElementById(submenuId);
  const arrow = document.getElementById(arrowId);

  if (submenu.style.display === "block") {
    submenu.style.display = "none";
    if (arrow) arrow.textContent = "▼";
  } else {
    // Fecha todos os outros submenus abertos antes de abrir o novo
    document.querySelectorAll('.submenu').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.arrow').forEach(el => el.textContent = '▼');

    submenu.style.display = "block";
    if (arrow) arrow.textContent = "▲";
  }
}

// Atualize a função loadMenu para abrir o submenu correto
async function loadMenu() {
  const menuDiv = $("menu");
  if (!menuDiv) return;
  
  try {
    const response = await fetch("menu.html", { cache: "no-cache" });
    if (!response.ok) throw new Error("Erro ao carregar menu");
    menuDiv.innerHTML = await response.text();
    
    const page = document.body.dataset.page;

    // Marca o botão ativo
    document.querySelectorAll(".nav button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === page);
    });

    // Abre o submenu correto se estiver em uma página filha
    if (['financeiro', 'movimentacoes', 'membros'].includes(page)) {
      const submenu = document.getElementById('submenu-financeiro');
      const arrow = document.getElementById('arrow-financeiro');
      if (submenu) submenu.style.display = "block";
      if (arrow) arrow.textContent = "▲";
    } 
    else if (['veiculos', 'manutencao', 'abastecimento'].includes(page)) {
      const submenu = document.getElementById('submenu-veiculos');
      const arrow = document.getElementById('arrow-veiculos');
      if (submenu) submenu.style.display = "block";
      if (arrow) arrow.textContent = "▲";
    }

  } catch (error) {
    console.error("Erro no menu:", error);
  }
}

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

document.addEventListener("DOMContentLoaded", async function () {
  const page = document.body.dataset.page;

  if (page === "login" || $("loginForm")) {
    await initLogin();
    return;
  }

  // ATUALIZADO: Adicionado 'checklists' e 'checklist_detalhe'
  const paginasProtegidas = [
    "ferias", 
    "financeiro", 
    "movimentacoes", 
    "relatorio_detalhe", 
    "membros",
    "checklists",
    "checklist_detalhe",
    "filmes",
    "listas_compras",
    "lista_detalhe",
    "restaurantes", "veiculos", "abastecimento", "historico_km", "manutencao", "agenda","agenda-lista"
  ];
  
  if (paginasProtegidas.includes(page)) {
    const auth = await requireAuth();
    if (auth) {
      await loadMenu();
    }
    return;
  }
});