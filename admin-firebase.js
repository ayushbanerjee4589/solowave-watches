// ============================================================
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
