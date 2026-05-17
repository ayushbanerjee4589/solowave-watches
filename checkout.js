// ===== SOLOWAVE CHECKOUT JS =====

// ============================================================
// CONFIG — Apni Razorpay Key ID yahan daalo
// Razorpay Dashboard: https://dashboard.razorpay.com/app/keys
// ============================================================
var RAZORPAY_KEY_ID = 'rzp_test_XXXXXXXXXXXXXXXX'; // <-- apni key yahan daalo

// ============================================================
// CART LOAD
// ============================================================
var cart = JSON.parse(localStorage.getItem('solowaveCart') || '[]');
var selectedPayment = 'razorpay';
var promoApplied = false;
var promoDiscount = 0;

function getSubtotal() {
  return cart.reduce(function(s, i) {
    return s + parseFloat(String(i.price).replace(/[^0-9.]/g, '')) * i.qty;
  }, 0);
}

function formatPrice(n) {
  return 'Rs' + Math.round(n).toLocaleString('en-IN');
}

function formatINR(n) {
  return 'Rs' + Math.round(n).toLocaleString('en-IN');
}

function renderOrderSummary() {
  var container = document.getElementById('orderItems');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:20px 0;">Your cart is empty. <a href="index.html" style="color:var(--gold)">Go back</a></p>';
    document.getElementById('sumSubtotal').textContent = '$0';
    document.getElementById('sumTax').textContent = '$0';
    document.getElementById('sumTotal').textContent = '$0';
    return;
  }

  container.innerHTML = cart.map(function(item) {
    return '<div class="order-item">'
      + '<img src="' + item.img + '" class="order-item-img" alt="' + item.name + '">'
      + '<div class="order-item-info">'
      + '<div class="order-item-name">' + item.name + '</div>'
      + '<div class="order-item-series">' + item.series + '</div>'
      + '<div class="order-item-qty">Qty: ' + item.qty + '</div>'
      + '</div>'
      + '<div class="order-item-price">' + item.price + '</div>'
      + '</div>';
  }).join('');

  var sub   = getSubtotal() - promoDiscount;
  var tax   = sub * 0.08;
  var total = sub + tax;

  document.getElementById('sumSubtotal').textContent = formatPrice(sub);
  document.getElementById('sumTax').textContent      = formatPrice(tax);
  document.getElementById('sumTotal').textContent    = formatPrice(total);
}

// ============================================================
// PAYMENT METHOD SELECTION
// ============================================================
function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('.pay-option').forEach(function(el) {
    el.classList.remove('active');
  });
  var opt = document.getElementById('opt-' + method);
  if (opt) opt.classList.add('active');

  // Show/hide forms
  var cardForm = document.getElementById('cardForm');
  var upiForm  = document.getElementById('upiForm');
  if (cardForm) cardForm.classList.toggle('show', method === 'card');
  if (upiForm)  upiForm.classList.toggle('show',  method === 'upi');
}

// ============================================================
// CARD PREVIEW
// ============================================================
function formatCardNumber(input) {
  var v = input.value.replace(/\D/g, '').substring(0, 16);
  var formatted = v.match(/.{1,4}/g);
  input.value = formatted ? formatted.join(' ') : v;
  updateCardPreview();
  detectCardNetwork(v);
}

function formatExpiry(input) {
  var v = input.value.replace(/\D/g, '');
  if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
  input.value = v;
  var expEl = document.getElementById('previewExpiry');
  if (expEl) expEl.textContent = input.value || 'MM/YY';
}

function updateCardPreview() {
  var numEl  = document.getElementById('cardNumber');
  var nameEl = document.getElementById('cardName');
  var prevNum  = document.getElementById('previewNumber');
  var prevName = document.getElementById('previewName');
  if (numEl && prevNum) {
    var num = numEl.value.replace(/\s/g, '');
    var masked = '';
    for (var i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) masked += ' ';
      masked += (num[i] && i < 12) ? '•' : (num[i] || '•');
    }
    prevNum.textContent = masked;
  }
  if (nameEl && prevName) {
    prevName.textContent = nameEl.value.toUpperCase() || 'YOUR NAME';
  }
}

function detectCardNetwork(num) {
  var logo = document.getElementById('cardNetworkLogo');
  if (!logo) return;
  if (/^4/.test(num)) {
    logo.innerHTML = '<svg width="50" height="30" viewBox="0 0 60 35"><text x="2" y="26" font-size="22" font-weight="900" fill="#1a1f71" font-family="Arial">VISA</text></svg>';
  } else if (/^5[1-5]/.test(num)) {
    logo.innerHTML = '<svg width="50" height="30" viewBox="0 0 60 35"><circle cx="18" cy="17" r="13" fill="#EB001B" opacity="0.9"/><circle cx="38" cy="17" r="13" fill="#F79E1B" opacity="0.9"/></svg>';
  } else if (/^6/.test(num)) {
    logo.innerHTML = '<svg width="50" height="30" viewBox="0 0 60 35"><text x="2" y="24" font-size="14" font-weight="900" fill="#097939" font-family="Arial">RuPay</text></svg>';
  } else if (/^3[47]/.test(num)) {
    logo.innerHTML = '<svg width="50" height="30" viewBox="0 0 60 35"><text x="2" y="24" font-size="11" font-weight="900" fill="#007bc1" font-family="Arial">AMEX</text></svg>';
  } else {
    logo.innerHTML = '<svg width="40" height="25" viewBox="0 0 50 30"><circle cx="18" cy="15" r="12" fill="#EB001B" opacity="0.9"/><circle cx="32" cy="15" r="12" fill="#F79E1B" opacity="0.9"/></svg>';
  }
}

// ============================================================
// UPI APP SELECT
// ============================================================
function setUpiApp(app) {
  document.querySelectorAll('.upi-app').forEach(function(el) { el.classList.remove('selected'); });
  event.currentTarget.classList.add('selected');
  var upiInput = document.getElementById('upiId');
  var suffixes = { gpay: '@okicici', phonepe: '@ybl', paytm: '@paytm', bhim: '@upi' };
  if (upiInput && !upiInput.value.includes('@')) {
    upiInput.placeholder = 'yourname' + (suffixes[app] || '@upi');
  }
}

// ============================================================
// PROMO CODE
// ============================================================
var PROMO_CODES = {
  'SOLOWAVE10': 10,
  'LUXURY20':   20,
  'AYUSH15':    15,
  'FIRST50':    50,
  'SWISS5':      5,
  'GOLD25':     25,
  'ELITE30':    30,
  'WELCOME10':  10,
  'SAVE15':     15,
  'VIP40':      40
};

function applyPromo() {
  var code = document.getElementById('promoInput').value.trim().toUpperCase();
  var msgEl = document.getElementById('promoMsg');
  if (!code) { msgEl.textContent = 'Please enter a promo code.'; msgEl.className = 'promo-msg error'; return; }
  if (PROMO_CODES[code]) {
    var pct = PROMO_CODES[code];
    promoDiscount = getSubtotal() * (pct / 100);
    promoApplied  = true;
    msgEl.textContent = pct + '% discount applied! You save ' + formatPrice(promoDiscount);
    msgEl.className = 'promo-msg success';
    renderOrderSummary();
  } else {
    msgEl.textContent = 'Invalid promo code. Try SOLOWAVE10';
    msgEl.className = 'promo-msg error';
  }
}

// ============================================================
// VALIDATION
// ============================================================
function validate() {
  var fields = [
    { id: 'firstName', label: 'First Name' },
    { id: 'email',     label: 'Email' },
    { id: 'phone',     label: 'Phone' },
    { id: 'addr1',     label: 'Address' },
    { id: 'city',      label: 'City' },
    { id: 'pin',       label: 'PIN Code' }
  ];
  for (var i = 0; i < fields.length; i++) {
    var el = document.getElementById(fields[i].id);
    if (!el || !el.value.trim()) {
      el.style.borderColor = 'var(--red)';
      el.focus();
      showAlert(fields[i].label + ' is required.');
      return false;
    }
    el.style.borderColor = '';
  }
  if (selectedPayment === 'card') {
    var cn = document.getElementById('cardNumber').value.replace(/\s/g, '');
    if (cn.length < 16) { showAlert('Please enter a valid 16-digit card number.'); return false; }
    var exp = document.getElementById('cardExpiry').value;
    if (exp.length < 5) { showAlert('Please enter card expiry date.'); return false; }
    var cvv = document.getElementById('cardCvv').value;
    if (cvv.length < 3) { showAlert('Please enter CVV.'); return false; }
  }
  if (selectedPayment === 'upi') {
    var upi = document.getElementById('upiId').value.trim();
    if (!upi.includes('@')) { showAlert('Please enter a valid UPI ID (e.g. name@upi).'); return false; }
  }
  return true;
}

function showAlert(msg) {
  var existing = document.getElementById('co-alert');
  if (existing) existing.remove();
  var div = document.createElement('div');
  div.id = 'co-alert';
  div.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#e05555;color:#fff;padding:12px 28px;border-radius:8px;font-size:0.8rem;font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(function() { if (div.parentNode) div.remove(); }, 3000);
}

// ============================================================
// PLACE ORDER — PAYMENT GATEWAY ROUTING
// ============================================================
function placeOrder() {
  if (cart.length === 0) { showAlert('Your cart is empty!'); return; }
  if (!validate()) return;

  var btn = document.getElementById('btnPlaceOrder');
  var btnText = document.getElementById('btnText');
  btn.classList.add('loading');
  btnText.textContent = 'Processing...';

  setTimeout(function() {
    if (selectedPayment === 'razorpay') {
      payWithRazorpay();
    } else if (selectedPayment === 'paytm') {
      payWithPaytm();
    } else if (selectedPayment === 'paypal') {
      payWithPaypal();
    } else if (selectedPayment === 'card') {
      payWithCard();
    } else if (selectedPayment === 'upi') {
      payWithUPI();
    }
    btn.classList.remove('loading');
    btnText.textContent = 'Place Order Securely';
  }, 800);
}

// ============================================================
// RAZORPAY PAYMENT
// ============================================================
function payWithRazorpay() {
  var sub   = getSubtotal() - promoDiscount;
  var total = Math.round((sub + sub * 0.08) * 83 * 100); // paise (INR)
  var name  = (document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value).trim();
  var email = document.getElementById('email').value;
  var phone = document.getElementById('phone').value.replace(/\D/g, '');

  var options = {
    key:         RAZORPAY_KEY_ID,
    amount:      total,
    currency:    'INR',
    name:        'Solowave Watches',
    description: 'Luxury Timepiece Purchase',
    image:       '',
    prefill: {
      name:    name,
      email:   email,
      contact: phone
    },
    theme: { color: '#c9a84c' },
    handler: function(response) {
      showSuccess('Razorpay', response.razorpay_payment_id);
    },
    modal: {
      ondismiss: function() {
        showAlert('Payment cancelled. Please try again.');
      }
    }
  };

  // Check if Razorpay is loaded
  if (typeof Razorpay === 'undefined') {
    // Demo mode — show success anyway for testing
    showAlert('Razorpay SDK not loaded. Add your API key to go live. Showing demo success...');
    setTimeout(function() { showSuccess('Razorpay', 'DEMO_' + Date.now().toString(36).toUpperCase()); }, 1500);
    return;
  }

  var rzp = new Razorpay(options);
  rzp.on('payment.failed', function(resp) {
    showAlert('Payment failed: ' + resp.error.description);
  });
  rzp.open();
}

// ============================================================
// PAYTM PAYMENT
// ============================================================
function payWithPaytm() {
  // Paytm requires backend integration for token generation
  // For now show demo success with instructions
  showAlert('Paytm: Add your Merchant ID & backend token API to go live.');
  setTimeout(function() {
    showSuccess('Paytm', 'PAYTM_' + Date.now().toString(36).toUpperCase());
  }, 1500);
}

// ============================================================
// PAYPAL PAYMENT
// ============================================================
function payWithPaypal() {
  var sub   = getSubtotal() - promoDiscount;
  var total = (sub + sub * 0.08).toFixed(2);
  // PayPal standard checkout URL (replace with your PayPal.me or Business account)
  var paypalUrl = 'https://www.paypal.com/paypalme/YOUR_PAYPAL_ID/' + total + 'USD';
  showAlert('PayPal: Replace YOUR_PAYPAL_ID in checkout.js with your PayPal.me username.');
  setTimeout(function() {
    // window.open(paypalUrl, '_blank'); // Uncomment after adding your PayPal ID
    showSuccess('PayPal', 'PP_' + Date.now().toString(36).toUpperCase());
  }, 1500);
}

// ============================================================
// CARD PAYMENT (via Razorpay card flow)
// ============================================================
function payWithCard() {
  var sub   = getSubtotal() - promoDiscount;
  var total = Math.round((sub + sub * 0.08) * 83 * 100);
  var cardNum = document.getElementById('cardNumber').value.replace(/\s/g, '');
  var expiry  = document.getElementById('cardExpiry').value.split('/');
  var cvv     = document.getElementById('cardCvv').value;
  var name    = document.getElementById('cardName').value;

  if (typeof Razorpay === 'undefined') {
    showAlert('Add Razorpay Key ID to process real card payments. Showing demo...');
    setTimeout(function() { showSuccess('Card', 'CARD_' + Date.now().toString(36).toUpperCase()); }, 1500);
    return;
  }

  var options = {
    key:      RAZORPAY_KEY_ID,
    amount:   total,
    currency: 'INR',
    name:     'Solowave Watches',
    description: 'Card Payment',
    theme: { color: '#c9a84c' },
    method: { card: true, upi: false, netbanking: false, wallet: false },
    prefill: { name: name, email: document.getElementById('email').value },
    handler: function(response) {
      showSuccess('Card', response.razorpay_payment_id);
    }
  };
  var rzp = new Razorpay(options);
  rzp.open();
}

// ============================================================
// UPI PAYMENT
// ============================================================
function payWithUPI() {
  var upiId = document.getElementById('upiId').value.trim();
  var sub   = getSubtotal() - promoDiscount;
  var total = Math.round((sub + sub * 0.08) * 83 * 100);

  if (typeof Razorpay === 'undefined') {
    showAlert('Add Razorpay Key ID for UPI payments. Showing demo...');
    setTimeout(function() { showSuccess('UPI', 'UPI_' + Date.now().toString(36).toUpperCase()); }, 1500);
    return;
  }

  var options = {
    key:      RAZORPAY_KEY_ID,
    amount:   total,
    currency: 'INR',
    name:     'Solowave Watches',
    description: 'UPI Payment',
    theme: { color: '#c9a84c' },
    method: { upi: true, card: false, netbanking: false, wallet: false },
    prefill: { vpa: upiId, email: document.getElementById('email').value },
    handler: function(response) {
      showSuccess('UPI', response.razorpay_payment_id);
    }
  };
  var rzp = new Razorpay(options);
  rzp.open();
}

// ============================================================
// SUCCESS SCREEN
// ============================================================
function showSuccess(method, paymentId) {
  // Save order to admin panel
  // Save order to Firebase + localStorage
  try {
    var fn = document.getElementById("firstName") ? document.getElementById("firstName").value : "";
    var ln = document.getElementById("lastName")  ? document.getElementById("lastName").value  : "";
    var em = document.getElementById("email")     ? document.getElementById("email").value     : "";
    var ph = document.getElementById("phone")     ? document.getElementById("phone").value     : "";
    var ad = document.getElementById("addr1")     ? document.getElementById("addr1").value     : "";
    var ct = document.getElementById("city")      ? document.getElementById("city").value      : "";
    var sub = getSubtotal() - promoDiscount;
    var tax = Math.round(sub * 0.08);
    var tot = sub + tax;
    var orderId = "SLW-" + Date.now().toString(36).toUpperCase();
    var orderObj = {
      id:      orderId,
      name:    (fn + " " + ln).trim(),
      email:   em, phone: ph, city: ct, address: ad,
      product: cart.map(function(i){ return i.name; }).join(', '),
      qty:     cart.reduce(function(s,i){ return s+i.qty; }, 0),
      price:   sub,
      tax:     tax, total: tot,
      payment: method, status: "confirmed",
      date:    Date.now()
    };
    // Use Firebase if available, else localStorage
    if(typeof window.swSaveOrder === 'function'){
      window.swSaveOrder(orderObj);
    } else {
      var existingOrders = JSON.parse(localStorage.getItem("solowaveOrders") || "[]");
      existingOrders.unshift(orderObj);
      localStorage.setItem("solowaveOrders", JSON.stringify(existingOrders));
    }
  } catch(e) {}

  var orderId = 'ZYP-' + Date.now().toString(36).toUpperCase();
  var name    = document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value;
  var email   = document.getElementById('email').value;
  var sub     = getSubtotal() - promoDiscount;
  var total   = sub + sub * 0.08;

  document.getElementById('successOrderId').textContent = 'Order ID: ' + orderId;
  document.getElementById('successDetails').innerHTML =
    '<strong style="color:var(--text)">' + name + '</strong><br>' +
    email + '<br><br>' +
    'Payment via: <strong style="color:var(--gold)">' + method + '</strong><br>' +
    'Payment ID: ' + paymentId + '<br>' +
    'Amount: <strong style="color:var(--gold-light)">' + formatPrice(total) + '</strong><br><br>' +
    'Estimated Delivery: <strong style="color:var(--text)">7–14 Business Days</strong>';

  var modal = document.getElementById('successModal');
  modal.classList.add('open');

  // Animate SVG check
  setTimeout(function() {
    var circle = document.getElementById('successCircle');
    var check  = document.getElementById('successCheck');
    if (circle) circle.style.cssText += 'transition:stroke-dashoffset 0.8s ease;stroke-dashoffset:0;';
    if (check)  setTimeout(function() { check.style.cssText += 'transition:stroke-dashoffset 0.5s ease 0.6s;stroke-dashoffset:0;'; }, 300);
  }, 100);

  // Clear cart
  localStorage.removeItem('solowaveCart');
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  renderOrderSummary();
  if (cart.length === 0) {
    document.getElementById('btnPlaceOrder').style.opacity = '0.5';
    document.getElementById('btnPlaceOrder').style.pointerEvents = 'none';
  }
});
