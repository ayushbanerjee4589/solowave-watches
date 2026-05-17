"""
SOLOWAVE 777 — Full-Stack Generator
Writes all remaining files needed to complete the full-stack integration
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

def write(filename, content):
    path = os.path.join(BASE, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  wrote: {filename}")

# ============================================================
# 1. wishlist.html — add db.js module
# ============================================================
wl_path = os.path.join(BASE, 'wishlist.html')
with open(wl_path, 'r', encoding='utf-8') as f:
    wl = f.read()

if 'db.js' not in wl:
    wl = wl.replace(
        '<script src="watches-data.js"></script>',
        '<script type="module" src="db.js"></script>\n<script src="watches-data.js"></script>'
    )
    # Add wishlist Firebase sync after saveWishlist function
    wl = wl.replace(
        'function saveWishlist(){ localStorage.setItem(\'solowaveWishlist\', JSON.stringify(wishlist)); }',
        '''function saveWishlist(){
  localStorage.setItem('solowaveWishlist', JSON.stringify(wishlist));
  if(typeof window.swSyncWishlist === 'function') window.swSyncWishlist(wishlist);
}'''
    )
    with open(wl_path, 'w', encoding='utf-8') as f:
        f.write(wl)
    print("  updated: wishlist.html")
else:
    print("  skipped: wishlist.html (already has db.js)")

# ============================================================
# 2. fullstack.js — shared utility loaded on every page
# ============================================================
write('fullstack.js', r'''// ============================================================
// SOLOWAVE 777 — Full-Stack Shared Utilities
// Loaded on every page. Handles: auth state, nav UI,
// wishlist sync, newsletter, analytics tracking
// ============================================================

(function() {
  'use strict';

  /* ── Theme ─────────────────────────────────────────────── */
  var saved = localStorage.getItem('solowaveTheme');
  if (!saved) {
    saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'night' : 'day';
  }
  if (saved === 'day') document.body.classList.add('day-mode');

  /* ── Auth state → update navbar ────────────────────────── */
  window.addEventListener('solowaveAuthChange', function(e) {
    var detail = e.detail || {};
    updateNavAuth(detail.loggedIn, detail.user);
  });

  // Also check localStorage on load (for pages without auth.js)
  var storedUser = null;
  try { storedUser = JSON.parse(localStorage.getItem('solowaveCurrentUser')); } catch(e) {}
  if (storedUser && storedUser.isLoggedIn) {
    updateNavAuth(true, storedUser);
  }

  function updateNavAuth(loggedIn, user) {
    // Login button
    var loginBtn = document.getElementById('navLoginBtn');
    if (loginBtn) {
      if (loggedIn && user) {
        loginBtn.title = 'Hi, ' + (user.firstName || user.email || 'User');
        loginBtn.href  = 'orders.html';
      } else {
        loginBtn.title = 'Sign In';
        loginBtn.href  = 'login.html';
      }
    }

    // Greeting on orders page
    var greet = document.getElementById('userGreet');
    if (greet && loggedIn && user && user.firstName) {
      greet.textContent = 'Welcome back, ' + user.firstName + '. Here are your orders.';
    }
  }

  /* ── Cart badge ─────────────────────────────────────────── */
  function updateCartBadge() {
    var cart  = [];
    try { cart = JSON.parse(localStorage.getItem('solowaveCart') || '[]'); } catch(e) {}
    var total = cart.reduce(function(s, i) { return s + (i.qty || 1); }, 0);
    var badges = document.querySelectorAll('.cart-count, #cartCount, .cart-badge');
    badges.forEach(function(b) {
      b.textContent = total;
      if (b.classList.contains('cart-count') || b.classList.contains('cart-badge')) {
        b.classList.toggle('visible', total > 0);
        if (total === 0) b.style.display = 'none';
        else b.style.display = '';
      }
    });
  }
  updateCartBadge();
  window.addEventListener('storage', function(e) {
    if (e.key === 'solowaveCart') updateCartBadge();
  });

  /* ── Wishlist badge ─────────────────────────────────────── */
  function updateWishlistBadge() {
    var wl = [];
    try { wl = JSON.parse(localStorage.getItem('solowaveWishlist') || '[]'); } catch(e) {}
    var badge = document.getElementById('navWlCount');
    if (badge) {
      badge.textContent = wl.length || '';
      badge.style.display = wl.length > 0 ? 'flex' : 'none';
    }
  }
  updateWishlistBadge();
  window.addEventListener('storage', function(e) {
    if (e.key === 'solowaveWishlist') updateWishlistBadge();
  });

  /* ── Affiliate bar ──────────────────────────────────────── */
  var affBar = document.getElementById('affiliateBar');
  if (affBar && localStorage.getItem('affBarClosed') === '1') {
    affBar.style.display = 'none';
  }

  /* ── Newsletter form (any page) ─────────────────────────── */
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form.classList.contains('newsletter-form') &&
        form.id !== 'newsletterForm') return;
    e.preventDefault();
    var input = form.querySelector('input[type="email"]');
    if (!input || !input.value.trim()) return;
    var email = input.value.trim();
    if (typeof window.swSaveSubscriber === 'function') {
      window.swSaveSubscriber(email);
    } else {
      var subs = [];
      try { subs = JSON.parse(localStorage.getItem('solowaveSubscribers') || '[]'); } catch(e) {}
      if (!subs.some(function(s) { return s.email === email; })) {
        subs.push({ email: email, date: Date.now() });
        localStorage.setItem('solowaveSubscribers', JSON.stringify(subs));
      }
    }
    input.value = '';
    // Show toast if available
    var toast = document.getElementById('toast') || document.getElementById('cartToast');
    if (toast) {
      toast.textContent = 'Subscribed! Welcome to the Solowave Circle.';
      toast.classList.add('show');
      setTimeout(function() { toast.classList.remove('show'); }, 3000);
    } else {
      alert('Subscribed! Welcome to the Solowave Circle.');
    }
  });

  /* ── Track page view ────────────────────────────────────── */
  setTimeout(function() {
    if (typeof window.swTrackEvent === 'function') {
      window.swTrackEvent('page_view', { title: document.title, path: location.pathname });
    }
  }, 1000);

  /* ── Logout helper (called from any page) ───────────────── */
  window.solowaveLogout = function() {
    if (typeof window.swLogout === 'function') {
      window.swLogout();
    } else {
      localStorage.removeItem('solowaveCurrentUser');
      sessionStorage.removeItem('solowaveCurrentUser');
      window.location.href = 'index.html';
    }
  };

  console.log('✅ Solowave fullstack.js loaded');
})();
''')

# ============================================================
# 3. Add fullstack.js to all HTML pages
# ============================================================
html_files = [
    'index.html', 'login.html', 'orders.html', 'wishlist.html',
    'checkout.html', 'product.html', 'contact.html'
]

for fname in html_files:
    fpath = os.path.join(BASE, fname)
    if not os.path.exists(fpath):
        print(f"  skip (not found): {fname}")
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'fullstack.js' in content:
        print(f"  skip (already has fullstack.js): {fname}")
        continue
    # Add before </body>
    content = content.replace('</body>', '<script src="fullstack.js"></script>\n</body>', 1)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  updated: {fname}")

# ============================================================
# 4. admin-firebase.js — connects admin panel to Firestore
# ============================================================
write('admin-firebase.js', r'''// ============================================================
// SOLOWAVE ADMIN — Firebase Real-Time Bridge
// Connects admin panel to live Firestore data
// Include AFTER admin.html's main script
// ============================================================

(function waitForFirebase() {
  // Wait until db.js exports are available
  if (typeof window.swListenOrders !== 'function' &&
      typeof window.swGetAllOrders !== 'function') {
    setTimeout(waitForFirebase, 300);
    return;
  }

  console.log('✅ Admin Firebase bridge active');

  /* ── Real-time Orders ─────────────────────────────────── */
  if (typeof window.swListenOrders === 'function') {
    window.swListenOrders(function(orders) {
      localStorage.setItem('solowaveOrders', JSON.stringify(orders));
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderOrders   === 'function') renderOrders();
      console.log('🔄 Orders updated from Firestore:', orders.length);
    });
  } else {
    window.swGetAllOrders(function(orders) {
      localStorage.setItem('solowaveOrders', JSON.stringify(orders));
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderOrders   === 'function') renderOrders();
    });
  }

  /* ── Real-time Messages ───────────────────────────────── */
  if (typeof window.swListenMessages === 'function') {
    window.swListenMessages(function(msgs) {
      localStorage.setItem('solowaveMessages', JSON.stringify(msgs));
      if (typeof renderMessages      === 'function') renderMessages();
      if (typeof updateUnreadBadge   === 'function') updateUnreadBadge();
    });
  } else if (typeof window.swGetMessages === 'function') {
    window.swGetMessages(function(msgs) {
      localStorage.setItem('solowaveMessages', JSON.stringify(msgs));
      if (typeof renderMessages    === 'function') renderMessages();
      if (typeof updateUnreadBadge === 'function') updateUnreadBadge();
    });
  }

  /* ── Users ────────────────────────────────────────────── */
  var getUsersFn = window.swGetAllUsers || window.swGetUsers;
  if (typeof getUsersFn === 'function') {
    getUsersFn(function(users) {
      localStorage.setItem('solowaveUsers', JSON.stringify(users));
      if (typeof renderCustomers === 'function') renderCustomers();
    });
  }

  /* ── Override order status update to use Firestore ───── */
  var origUpdateStatus = window.updateOrderStatus;
  window.updateOrderStatus = function(orderId, newStatus) {
    // Update localStorage
    var orders = JSON.parse(localStorage.getItem('solowaveOrders') || '[]');
    var order  = orders.find(function(o) {
      return o.id === orderId || o.firebaseId === orderId;
    });
    if (order) {
      order.status = newStatus;
      localStorage.setItem('solowaveOrders', JSON.stringify(orders));
    }
    // Update Firestore
    if (typeof window.swUpdateOrderStatus === 'function' && order && order.firebaseId) {
      window.swUpdateOrderStatus(order.firebaseId, newStatus);
    }
    // Re-render
    if (typeof renderOrders    === 'function') renderOrders();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof origUpdateStatus === 'function') origUpdateStatus(orderId, newStatus);
  };

})();
''')

# ============================================================
# 5. Add admin-firebase.js + db.js to admin.html
# ============================================================
admin_path = os.path.join(BASE, 'admin.html')
with open(admin_path, 'r', encoding='utf-8') as f:
    admin = f.read()

changed = False
if 'admin-firebase.js' not in admin:
    admin = admin.replace(
        '</body>',
        '<script type="module" src="db.js"></script>\n<script src="admin-firebase.js"></script>\n</body>',
        1
    )
    changed = True

if changed:
    with open(admin_path, 'w', encoding='utf-8') as f:
        f.write(admin)
    print("  updated: admin.html")
else:
    print("  skipped: admin.html (already updated)")

# ============================================================
# 6. orders.html — load from Firebase on init
# ============================================================
orders_path = os.path.join(BASE, 'orders.html')
with open(orders_path, 'r', encoding='utf-8') as f:
    orders_html = f.read()

if 'swGetOrders' not in orders_html:
    # Add Firebase sync before </script> at end
    orders_html = orders_html.replace(
        'renderSummary();\nrenderOrders();',
        '''renderSummary();
renderOrders();

// Firebase sync
function syncOrdersFromFirebase() {
  var fn = window.swGetOrders || window.swGetAllOrders;
  if (typeof fn === 'function') {
    fn(function(orders) {
      if (orders && orders.length > 0) {
        localStorage.setItem('solowaveOrders', JSON.stringify(orders));
        renderSummary();
        renderOrders();
      }
    });
  }
}
syncOrdersFromFirebase();
setTimeout(syncOrdersFromFirebase, 2500);'''
    )
    with open(orders_path, 'w', encoding='utf-8') as f:
        f.write(orders_html)
    print("  updated: orders.html (Firebase sync)")
else:
    print("  skipped: orders.html (already has swGetOrders)")

# ============================================================
# 7. README — full-stack setup guide
# ============================================================
write('FULLSTACK_SETUP.md', r'''# Solowave 777 — Full-Stack Setup Guide

## What's Connected

| Feature | Technology | Status |
|---------|-----------|--------|
| User Auth (Login/Register) | Firebase Auth | ✅ |
| Orders | Firestore + localStorage | ✅ |
| Wishlist | Firestore + localStorage | ✅ |
| Messages/Contact | Firestore + localStorage | ✅ |
| Newsletter | Firestore + localStorage | ✅ |
| Admin Panel | Real-time Firestore | ✅ |
| Stock Management | Firestore + localStorage | ✅ |
| Analytics | Firestore | ✅ |
| Payment | Razorpay (test mode) | ✅ |

## Firebase Setup (Already Done)
Your Firebase config is in `firebase-config.js`:
- Project: `solowave-watches`
- Auth, Firestore enabled

## To Go Live

### 1. Enable Firebase Auth
- Go to Firebase Console → Authentication → Sign-in method
- Enable: Email/Password

### 2. Firestore Rules (paste in Firebase Console → Firestore → Rules)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{doc} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.admin == true);
      allow create: if request.auth != null;
      allow update: if request.auth.token.admin == true;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    match /messages/{doc} {
      allow create: if true;
      allow read, update: if request.auth.token.admin == true;
    }
    match /subscribers/{doc} {
      allow create: if true;
      allow read: if request.auth.token.admin == true;
    }
    match /analytics/{doc} {
      allow create: if true;
    }
    match /settings/{doc} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### 3. Razorpay Payment
- Get key from: https://dashboard.razorpay.com/app/keys
- Replace in `checkout.js`: `var RAZORPAY_KEY_ID = 'rzp_live_XXXXXXXX';`

### 4. Admin Panel
- Open: `admin.html`
- Password: `solowave2024`
- All orders/messages sync from Firestore in real-time

## File Structure
```
watch/
├── index.html          # Homepage
├── login.html          # Auth (Firebase)
├── orders.html         # Order history (Firebase)
├── wishlist.html       # Wishlist (Firebase sync)
├── checkout.html       # Checkout (Razorpay)
├── product.html        # Product detail
├── contact.html        # Contact (Firebase)
├── admin.html          # Admin dashboard (Firebase real-time)
├── auth.js             # Firebase Auth module
├── db.js               # Firestore CRUD module
├── firebase.js         # Legacy Firebase module
├── fullstack.js        # Shared utilities (all pages)
├── admin-firebase.js   # Admin real-time bridge
├── checkout.js         # Payment logic
├── script.js           # Main site script
└── watches-data.js     # Product catalog
```
''')

print("\n✅ Full-stack generation complete!")
print("   Files created/updated:")
print("   - fullstack.js (shared utilities)")
print("   - admin-firebase.js (real-time admin bridge)")
print("   - FULLSTACK_SETUP.md (setup guide)")
print("   - All HTML files updated with Firebase modules")
