// ============================================================
// SOLOWAVE 777 — Firebase Auth Module (ES Module)
// Full-stack: Login, Register, Logout, Session, Profile
// ============================================================

import { initializeApp }                    from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, doc, setDoc,
         getDoc, serverTimestamp }          from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, signOut,
         onAuthStateChanged, sendPasswordResetEmail,
         updateProfile }                    from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDkT5YIlpVHeK1E4c7wzT2gZmdllG8zXJw",
  authDomain:        "solowave-watches.firebaseapp.com",
  projectId:         "solowave-watches",
  storageBucket:     "solowave-watches.firebasestorage.app",
  messagingSenderId: "34518522637",
  appId:             "1:34518522637:web:469020465c12059fbdee44"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Expose globally ──────────────────────────────────────────
window._swAuth = auth;
window._swDB   = db;

// ── Auth State Observer ──────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Fetch user profile from Firestore
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const profile = snap.exists() ? snap.data() : {};
      const userData = {
        uid:       user.uid,
        email:     user.email,
        firstName: profile.firstName || user.displayName?.split(' ')[0] || '',
        lastName:  profile.lastName  || user.displayName?.split(' ')[1] || '',
        phone:     profile.phone     || '',
        createdAt: profile.createdAt || null,
        isLoggedIn: true
      };
      localStorage.setItem('solowaveCurrentUser', JSON.stringify(userData));
      window.SOLOWAVE_USER = userData;
    } catch(e) {
      const fallback = {
        uid: user.uid, email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        isLoggedIn: true
      };
      localStorage.setItem('solowaveCurrentUser', JSON.stringify(fallback));
      window.SOLOWAVE_USER = fallback;
    }
    // Dispatch event so pages can react
    window.dispatchEvent(new CustomEvent('solowaveAuthChange', { detail: { loggedIn: true, user: window.SOLOWAVE_USER } }));
    updateNavUI(true, window.SOLOWAVE_USER);
  } else {
    localStorage.removeItem('solowaveCurrentUser');
    window.SOLOWAVE_USER = null;
    window.dispatchEvent(new CustomEvent('solowaveAuthChange', { detail: { loggedIn: false } }));
    updateNavUI(false, null);
  }
});

// ── Update Navbar UI ─────────────────────────────────────────
function updateNavUI(loggedIn, user) {
  const loginBtn = document.getElementById('navLoginBtn');
  if (!loginBtn) return;
  if (loggedIn && user) {
    loginBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    loginBtn.title = user.firstName || user.email;
    loginBtn.href  = 'orders.html';
  } else {
    loginBtn.href  = 'login.html';
    loginBtn.title = 'Sign In';
  }
}

// ── REGISTER ─────────────────────────────────────────────────
window.swRegister = async function({ firstName, lastName, email, phone, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // Update display name
  await updateProfile(user, { displayName: `${firstName} ${lastName}` });

  // Save to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    firstName, lastName, email, phone,
    createdAt: serverTimestamp(),
    wishlist: [],
    orders: []
  });

  return user;
};

// ── LOGIN ─────────────────────────────────────────────────────
window.swLogin = async function(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// ── LOGOUT ───────────────────────────────────────────────────
window.swLogout = async function() {
  await signOut(auth);
  localStorage.removeItem('solowaveCurrentUser');
  window.location.href = 'index.html';
};

// ── FORGOT PASSWORD ──────────────────────────────────────────
window.swForgotPassword = async function(email) {
  await sendPasswordResetEmail(auth, email);
};

// ── GET CURRENT USER ─────────────────────────────────────────
window.swGetCurrentUser = function() {
  return auth.currentUser || JSON.parse(localStorage.getItem('solowaveCurrentUser') || 'null');
};

// ── REQUIRE AUTH (redirect if not logged in) ─────────────────
window.swRequireAuth = function(redirectTo = 'login.html') {
  const user = JSON.parse(localStorage.getItem('solowaveCurrentUser') || 'null');
  if (!user || !user.isLoggedIn) {
    window.location.href = redirectTo + '?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
};

console.log('✅ Solowave Auth module loaded');
