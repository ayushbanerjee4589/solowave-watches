// ============================================================
// SOLOWAVE — FIREBASE CONFIG
// ============================================================
// Step 1: firebase.google.com pe jao
// Step 2: New project banao → Firestore enable karo (test mode)
// Step 3: Project Settings → Your Apps → Web → Config copy karo
// Step 4: Neeche apni config paste karo
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDkT5YIlpVHeK1E4c7wzT2gZmdllG8zXJw",
  authDomain:        "solowave-watches.firebaseapp.com",
  projectId:         "solowave-watches",
  storageBucket:     "solowave-watches.firebasestorage.app",
  messagingSenderId: "34518522637",
  appId:             "1:34518522637:web:469020465c12059fbdee44"
};

// ============================================================
// DO NOT EDIT BELOW THIS LINE
// ============================================================

// Check if config is filled
window.FIREBASE_READY = (
  FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY" &&
  FIREBASE_CONFIG.projectId !== "YOUR_PROJECT_ID"
);

if(!window.FIREBASE_READY){
  console.warn("⚠️ Solowave: Firebase config not set. Using localStorage fallback.");
}

window.SOLOWAVE_FB_CONFIG = FIREBASE_CONFIG;
