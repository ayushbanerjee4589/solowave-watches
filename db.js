// ============================================================
// SOLOWAVE 777 — Firestore Database Module (ES Module)
// Full CRUD: Orders, Wishlist, Cart, Messages, Stock, Reviews
// ============================================================

import { initializeApp }                          from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs,
         doc, setDoc, updateDoc, getDoc, deleteDoc,
         query, orderBy, limit, where,
         serverTimestamp, onSnapshot }            from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth }                                from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDkT5YIlpVHeK1E4c7wzT2gZmdllG8zXJw",
  authDomain:        "solowave-watches.firebaseapp.com",
  projectId:         "solowave-watches",
  storageBucket:     "solowave-watches.firebasestorage.app",
  messagingSenderId: "34518522637",
  appId:             "1:34518522637:web:469020465c12059fbdee44"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

window._swDB   = db;
window._swAuth = auth;

// ── Helpers ──────────────────────────────────────────────────
function tsToMs(ts) { return ts?.toMillis ? ts.toMillis() : (ts || Date.now()); }
function uid()      { return auth.currentUser?.uid || null; }
function userEmail(){ return auth.currentUser?.email || null; }

// ── LOCAL STORAGE FALLBACK ───────────────────────────────────
function lsGet(key)       { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function lsSet(key, val)  { localStorage.setItem(key, JSON.stringify(val)); }

// ============================================================
// ORDERS
// ============================================================
window.swSaveOrder = async function(orderData) {
  // Always save to localStorage first
  const orders = lsGet('solowaveOrders') || [];
  orders.unshift(orderData);
  lsSet('solowaveOrders', orders);

  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      userId:    uid(),
      userEmail: userEmail(),
      createdAt: serverTimestamp(),
      status:    orderData.status || 'confirmed'
    });
    orderData.firebaseId = docRef.id;
    orders[0].firebaseId = docRef.id;
    lsSet('solowaveOrders', orders);
    console.log('✅ Order saved to Firestore:', docRef.id);
    return docRef.id;
  } catch(e) {
    console.warn('⚠️ Order Firestore save failed (localStorage backup used):', e.message);
    return null;
  }
};

window.swGetOrders = async function(callback) {
  try {
    const currentUid = uid();
    let q;
    if (currentUid) {
      q = query(collection(db, 'orders'), where('userId', '==', currentUid), orderBy('createdAt', 'desc'), limit(100));
    } else {
      q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
    }
    const snap = await getDocs(q);
    const orders = [];
    snap.forEach(d => {
      const data = d.data();
      data.firebaseId = d.id;
      data.date = tsToMs(data.createdAt);
      orders.push(data);
    });
    lsSet('solowaveOrders', orders);
    callback(orders);
  } catch(e) {
    console.warn('⚠️ getOrders fallback to localStorage:', e.message);
    callback(lsGet('solowaveOrders') || []);
  }
};

window.swGetAllOrders = async function(callback) {
  // Admin: get ALL orders
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500));
    const snap = await getDocs(q);
    const orders = [];
    snap.forEach(d => {
      const data = d.data();
      data.firebaseId = d.id;
      data.date = tsToMs(data.createdAt);
      orders.push(data);
    });
    callback(orders);
  } catch(e) {
    callback(lsGet('solowaveOrders') || []);
  }
};

window.swUpdateOrderStatus = async function(firebaseId, status) {
  if (!firebaseId) return;
  try {
    await updateDoc(doc(db, 'orders', firebaseId), { status, updatedAt: serverTimestamp() });
    console.log('✅ Order status updated:', firebaseId, '->', status);
  } catch(e) {
    console.warn('⚠️ Status update failed:', e.message);
  }
};

// ── Real-time order listener (for admin) ─────────────────────
window.swListenOrders = function(callback) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(q, (snap) => {
    const orders = [];
    snap.forEach(d => {
      const data = d.data();
      data.firebaseId = d.id;
      data.date = tsToMs(data.createdAt);
      orders.push(data);
    });
    callback(orders);
  }, (e) => console.warn('Listen error:', e));
};

// ============================================================
// USERS / PROFILE
// ============================================================
window.swSaveUser = async function(userData) {
  const users = lsGet('solowaveUsers') || [];
  const idx = users.findIndex(u => u.email === userData.email);
  if (idx === -1) users.push(userData); else users[idx] = userData;
  lsSet('solowaveUsers', users);

  try {
    const docId = userData.uid || userData.email.replace(/\./g, '_');
    await setDoc(doc(db, 'users', docId), {
      ...userData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch(e) {
    console.warn('⚠️ User save failed:', e.message);
  }
};

window.swGetAllUsers = async function(callback) {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users = [];
    snap.forEach(d => users.push({ ...d.data(), uid: d.id }));
    callback(users);
  } catch(e) {
    callback(lsGet('solowaveUsers') || []);
  }
};

window.swGetUserProfile = async function(userId, callback) {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    callback(snap.exists() ? snap.data() : null);
  } catch(e) {
    callback(null);
  }
};

// ============================================================
// WISHLIST (synced per user)
// ============================================================
window.swSyncWishlist = async function(wishlistArr) {
  lsSet('solowaveWishlist', wishlistArr);
  const userId = uid();
  if (!userId) return;
  try {
    await setDoc(doc(db, 'wishlists', userId), {
      items: wishlistArr,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch(e) {
    console.warn('⚠️ Wishlist sync failed:', e.message);
  }
};

window.swGetWishlist = async function(callback) {
  const userId = uid();
  if (!userId) { callback(lsGet('solowaveWishlist') || []); return; }
  try {
    const snap = await getDoc(doc(db, 'wishlists', userId));
    if (snap.exists()) {
      const items = snap.data().items || [];
      lsSet('solowaveWishlist', items);
      callback(items);
    } else {
      callback(lsGet('solowaveWishlist') || []);
    }
  } catch(e) {
    callback(lsGet('solowaveWishlist') || []);
  }
};

// ============================================================
// MESSAGES / CONTACT
// ============================================================
window.swSaveMessage = async function(msgData) {
  const msgs = lsGet('solowaveMessages') || [];
  msgs.unshift(msgData);
  lsSet('solowaveMessages', msgs);
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...msgData,
      createdAt: serverTimestamp(),
      read: false,
      userId: uid()
    });
    return docRef.id;
  } catch(e) {
    console.warn('⚠️ Message save failed:', e.message);
    return null;
  }
};

window.swGetMessages = async function(callback) {
  try {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    const msgs = [];
    snap.forEach(d => {
      const data = d.data();
      data.firebaseId = d.id;
      data.date = tsToMs(data.createdAt);
      msgs.push(data);
    });
    callback(msgs);
  } catch(e) {
    callback(lsGet('solowaveMessages') || []);
  }
};

window.swMarkMessageRead = async function(firebaseId) {
  try {
    await updateDoc(doc(db, 'messages', firebaseId), { read: true });
  } catch(e) {}
};

// ── Real-time messages listener ──────────────────────────────
window.swListenMessages = function(callback) {
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    const msgs = [];
    snap.forEach(d => {
      const data = d.data();
      data.firebaseId = d.id;
      data.date = tsToMs(data.createdAt);
      msgs.push(data);
    });
    callback(msgs);
  });
};

// ============================================================
// NEWSLETTER SUBSCRIBERS
// ============================================================
window.swSaveSubscriber = async function(email) {
  const subs = lsGet('solowaveSubscribers') || [];
  if (!subs.some(s => s.email === email)) {
    subs.push({ email, date: Date.now() });
    lsSet('solowaveSubscribers', subs);
  }
  try {
    await setDoc(doc(db, 'subscribers', email.replace(/\./g, '_')), {
      email,
      subscribedAt: serverTimestamp()
    }, { merge: true });
  } catch(e) {
    console.warn('⚠️ Subscriber save failed:', e.message);
  }
};

// ============================================================
// STOCK MANAGEMENT
// ============================================================
window.swSaveStock = async function(stockData) {
  lsSet('solowaveStock', stockData);
  try {
    await setDoc(doc(db, 'settings', 'stock'), {
      data: stockData,
      updatedAt: serverTimestamp()
    });
  } catch(e) {}
};

window.swGetStock = async function(callback) {
  try {
    const snap = await getDoc(doc(db, 'settings', 'stock'));
    if (snap.exists() && snap.data().data) {
      const stock = snap.data().data;
      lsSet('solowaveStock', stock);
      callback(stock);
    } else {
      callback(lsGet('solowaveStock') || {});
    }
  } catch(e) {
    callback(lsGet('solowaveStock') || {});
  }
};

// ============================================================
// PRODUCT REVIEWS
// ============================================================
window.swSaveReview = async function(productName, reviewData) {
  try {
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      productName,
      userId:    uid(),
      userEmail: userEmail(),
      createdAt: serverTimestamp(),
      approved:  false
    });
    return docRef.id;
  } catch(e) {
    console.warn('⚠️ Review save failed:', e.message);
    return null;
  }
};

window.swGetReviews = async function(productName, callback) {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('productName', '==', productName),
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const reviews = [];
    snap.forEach(d => reviews.push({ ...d.data(), id: d.id }));
    callback(reviews);
  } catch(e) {
    callback([]);
  }
};

// ============================================================
// ANALYTICS (page views, events)
// ============================================================
window.swTrackEvent = async function(eventName, data = {}) {
  try {
    await addDoc(collection(db, 'analytics'), {
      event:     eventName,
      data,
      userId:    uid(),
      page:      window.location.pathname,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent.substring(0, 100)
    });
  } catch(e) {} // Silent fail for analytics
};

// ── Track page view automatically ────────────────────────────
window.swTrackEvent('page_view', { title: document.title });

console.log('✅ Solowave DB module loaded');
