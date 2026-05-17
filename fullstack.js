// ============================================================
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
