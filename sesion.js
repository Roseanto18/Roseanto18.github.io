// Hash SHA-256 local
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Credencial demo (Usuario: admin@uaemex.mx / Contraseña: admin123)
const REGISTERED_USER = "miguellopez@gmail.com";
const REGISTERED_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

let failedAttempts = parseInt(localStorage.getItem('failed_attempts') || '0');
let lockUntil = parseInt(localStorage.getItem('lock_until') || '0');

function checkSession() {
  const token = localStorage.getItem('auth_token');
  const sessionOverlay = document.getElementById('loginModal');
  const mainContainer = document.querySelector('.container');
  
  if (!token) {
    if (sessionOverlay) sessionOverlay.style.display = 'flex';
    if (mainContainer) mainContainer.style.display = 'none'; // Oculta contenido si no hay sesión
  } else {
    if (sessionOverlay) sessionOverlay.style.display = 'none';
    if (mainContainer) mainContainer.style.display = 'block'; // Muestra contenido
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const now = Date.now();
  const errorMessage = document.getElementById('loginError');

  if (now < lockUntil) {
    const remainingSeconds = Math.ceil((lockUntil - now) / 1000);
    errorMessage.textContent = `Cuenta bloqueada. Intente en ${remainingSeconds}s.`;
    return;
  }

  const email = document.getElementById('userEmail').value;
  const pass = document.getElementById('userPassword').value;

  const inputHash = await hashPassword(pass);

  if (email === REGISTERED_USER && inputHash === REGISTERED_HASH) {
    // Generación de Token Simulado
    const token = btoa(JSON.stringify({ user: email, exp: Date.now() + 3600000 }));
    localStorage.setItem('auth_token', token);
    localStorage.setItem('failed_attempts', '0');
    location.reload();
  } else {
    failedAttempts++;
    localStorage.setItem('failed_attempts', failedAttempts.toString());

    if (failedAttempts >= 3) {
      lockUntil = Date.now() + 30000; // Bloqueo de 30 segundos
      localStorage.setItem('lock_until', lockUntil.toString());
      errorMessage.textContent = "Demasiados intentos fallidos. Bloqueado por 30 segundos.";
    } else {
      errorMessage.textContent = `Credenciales incorrectas. Intentos fallidos: ${failedAttempts}/3`;
    }
  }
}

function logout() {
  localStorage.removeItem('auth_token');
  location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  const form = document.getElementById('loginForm');
  if (form) form.addEventListener('submit', handleLogin);
});
