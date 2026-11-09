// Función para generar el hash SHA-256 localmente de forma transparente
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Credenciales registradas
// Usuario registrado: miguellopez@gmail.com
// Hash SHA-256 equivalente a la contraseña: admin123
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
    if (mainContainer) mainContainer.style.display = 'none';
  } else {
    if (sessionOverlay) sessionOverlay.style.display = 'none';
    if (mainContainer) mainContainer.style.display = 'block';
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

  // trim() quita espacios accidentales y toLowerCase() quita problemas de mayúsculas
  const email = document.getElementById('userEmail').value.trim().toLowerCase();
  const pass = document.getElementById('userPassword').value.trim();

  const inputHash = await hashPassword(pass);

  if (email === REGISTERED_USER.toLowerCase() && inputHash === REGISTERED_HASH) {
    // Generación de Token Simulado
    const token = btoa(JSON.stringify({ user: email, exp: Date.now() + 3600000 }));
    localStorage.setItem('auth_token', token);
    localStorage.setItem('failed_attempts', '0');
    location.reload();
  } else {
    failedAttempts++;
    localStorage.setItem('failed_attempts', failedAttempts.toString());

    if (failedAttempts >= 3) {
      lockUntil = Date.now() + 30000; // Bloqueo de 30 segundos tras 3 intentos
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
