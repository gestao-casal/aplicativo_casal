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

function toggleSubmenu(submenuId, arrowId) {
  const submenu = document.getElementById(submenuId);
  const arrow = document.getElementById(arrowId);

  if (submenu.style.display === "block") {
    submenu.style.display = "none";
    if (arrow) arrow.textContent = "▼";
  } else {
    document.querySelectorAll('.submenu').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.arrow').forEach(el => el.textContent = '▼');

    submenu.style.display = "block";
    if (arrow) arrow.textContent = "▲";
  }
}

async function loadMenu() {
  const menuDiv = $("menu");
  if (!menuDiv) return;
  
  try {
    const response = await fetch("menu.html", { cache: "no-cache" });
    if (!response.ok) throw new Error("Erro ao carregar menu");
    menuDiv.innerHTML = await response.text();
    
    const page = document.body.dataset.page;

    document.querySelectorAll(".nav button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === page);
    });

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

    // REDIRECIONA PARA A NOVA HOME
    window.location.href = "home.html"; 
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

// ==========================================
// INJETAR BOTÃO DE INÍCIO NO CELULAR
// ==========================================
function injetarBotaoMobile() {
  if (window.innerWidth <= 768) {
    const page = document.body.dataset.page;
    // Não mostra o botão home na tela de login nem na própria home
    if (page !== 'login' && page !== 'home' && !document.querySelector('.btn-mobile-home')) {
      const btnHome = document.createElement('button');
      btnHome.className = 'btn-mobile-home';
      btnHome.innerHTML = '🏠';
      btnHome.onclick = () => { window.location.href = 'home.html'; };
      document.body.appendChild(btnHome);
    }
  }
}

// ==========================================
// INICIALIZAÇÃO DO SISTEMA
// ==========================================
document.addEventListener("DOMContentLoaded", async function () {
  const page = document.body.dataset.page;

  // 1. Tela de Login
  if (page === "login" || $("loginForm")) {
    await initLogin();
    return;
  }

  // 2. Páginas Protegidas (Incluindo a própria Home)
  const paginasProtegidas = [
    "home", // <--- Adicionado aqui
    "ferias", "financeiro", "movimentacoes", "relatorio_detalhe", "membros",
    "checklists", "checklist_detalhe", "filmes", "listas_compras",
    "lista_detalhe", "restaurantes", "veiculos", "abastecimento", 
    "historico_km", "manutencao", "agenda", "agenda-lista"
  ];
  
  if (paginasProtegidas.includes(page)) {
    const auth = await requireAuth();
    
    if (auth) {
      await loadMenu();
      
      // Se NÃO for a home, injeta o botão de voltar
      if (page !== "home") {
        injetarBotaoMobile();
      }
    }
    return; 
  }
});