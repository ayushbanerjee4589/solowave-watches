// ============================================================
// SOLOWAVE — FIREBASE INTEGRATION v2 (ES Module)
// ============================================================

import { initializeApp }                          from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs,
         doc, setDoc, updateDoc, getDoc,
         orderBy, query, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDkT5YIlpVHeK1E4c7wzT2gZmdllG8zXJw",
  authDomain:        "solowave-watches.firebaseapp.com",
  projectId:         "solowave-watches",
  storageBucket:     "solowave-watches.firebasestorage.app",
  messagingSenderId: "34518522637",
  appId:             "1:34518522637:web:469020465c12059fbdee44"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

window._swDB = db; // expose for other scripts
console.log("✅ Solowave Firebase connected");

/* ── helper: Firestore timestamp → ms ── */
function tsToMs(ts){ return ts && ts.toMillis ? ts.toMillis() : (ts || Date.now()); }

/* ============================================================
   ORDERS
   ============================================================ */
window.swSaveOrder = async function(orderData){
  // localStorage backup
  const orders = JSON.parse(localStorage.getItem('solowaveOrders') || '[]');
  orders.unshift(orderData);
  localStorage.setItem('solowaveOrders', JSON.stringify(orders));
  // Firestore
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: serverTimestamp()
    });
    orderData.firebaseId = docRef.id;
    localStorage.setItem('solowaveOrders', JSON.stringify(orders));
    console.log("Order saved:", docRef.id);
  } catch(e){ console.warn("Order save failed:", e); }
};

window.swGetOrders = async function(callback){
  try {
    const q   = query(collection(db, 'orders'), orderBy('createdAt','desc'), limit(500));
    const snap = await getDocs(q);
    const orders = [];
    snap.forEach(d => {
      const data = d.data();
      data.firebaseId = d.id;
      data.date = tsToMs(data.createdAt);
      orders.push(data);
    });
    // Sync to localStorage
    localStorage.setItem('solowaveOrders', JSON.stringify(orders));
    callback(orders);
  } catch(e){
    console.warn("getOrders fallback:", e);
    callback(JSON.parse(localStorage.getItem('solowaveOrders') || '[]'));
  }
};

window.swUpdateOrderStatus = async function(firebaseId, status){
  if(!firebaseId) return;
  try { await updateDoc(doc(db,'orders',firebaseId), { status }); }
  catch(e){ console.warn("Status update failed:", e); }
};

/* ============================================================
   USERS
   ============================================================ */
window.swSaveUser = async function(userData){
  const users = JSON.parse(localStorage.getItem('solowaveUsers') || '[]');
  const idx = users.findIndex(u => u.email === userData.email);
  if(idx === -1) users.push(userData); else users[idx] = userData;
  localStorage.setItem('solowaveUsers', JSON.stringify(users));
  try {
    await setDoc(doc(db,'users', userData.email.replace(/\./g,'_')), {
      ...userData, updatedAt: serverTimestamp()
    }, { merge: true });
  } catch(e){ console.warn("User save failed:", e); }
};

window.swGetUsers = async function(callback){
  try {
    const snap = await getDocs(collection(db,'users'));
    const users = [];
    snap.forEach(d => users.push(d.data()));
    callback(users);
  } catch(e){
    callback(JSON.parse(localStorage.getItem('solowaveUsers') || '[]'));
  }
};

/* ============================================================
   MESSAGES
   ============================================================ */
window.swSaveMessage = async function(msgData){
  const msgs = JSON.parse(localStorage.getItem('solowaveMessages') || '[]');
  msgs.unshift(msgData);
  localStorage.setItem('solowaveMessages', JSON.stringify(msgs));
  try {
    await addDoc(collection(db,'messages'), {
      ...msgData, createdAt: serverTimestamp(), read: false
    });
  } catch(e){ console.warn("Message save failed:", e); }
};

window.swGetMessages = async function(callback){
  try {
    const q    = query(collection(db,'messages'), orderBy('createdAt','desc'));
    const snap = await getDocs(q);
    const msgs = [];
    snap.forEach(d => {
      const data = d.data();
      data.firebaseId = d.id;
      data.date = tsToMs(data.createdAt);
      msgs.push(data);
    });
    callback(msgs);
  } catch(e){
    callback(JSON.parse(localStorage.getItem('solowaveMessages') || '[]'));
  }
};

/* ============================================================
   SUBSCRIBERS
   ============================================================ */
window.swSaveSubscriber = async function(email){
  const subs = JSON.parse(localStorage.getItem('solowaveSubscribers') || '[]');
  if(!subs.some(s => s.email === email)){
    subs.push({ email, date: Date.now() });
    localStorage.setItem('solowaveSubscribers', JSON.stringify(subs));
  }
  try {
    await setDoc(doc(db,'subscribers', email.replace(/\./g,'_')), {
      email, subscribedAt: serverTimestamp()
    }, { merge: true });
  } catch(e){ console.warn("Subscriber save failed:", e); }
};

/* ============================================================
   STOCK
   ============================================================ */
window.swSaveStock = async function(stockData){
  localStorage.setItem('solowaveStock', JSON.stringify(stockData));
  try {
    await setDoc(doc(db,'settings','stock'), {
      data: stockData, updatedAt: serverTimestamp()
    });
  } catch(e){ console.warn("Stock save failed:", e); }
};

window.swGetStock = async function(callback){
  try {
    const snap = await getDoc(doc(db,'settings','stock'));
    if(snap.exists() && snap.data().data){
      const stock = snap.data().data;
      localStorage.setItem('solowaveStock', JSON.stringify(stock));
      callback(stock);
    } else {
      callback(JSON.parse(localStorage.getItem('solowaveStock') || '{}'));
    }
  } catch(e){
    callback(JSON.parse(localStorage.getItem('solowaveStock') || '{}'));
  }
};
