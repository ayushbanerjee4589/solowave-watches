// ===== SOLOWAVE — PRODUCT PAGE JS =====

/* ── Cart (shared with index) ── */
var cart = JSON.parse(localStorage.getItem('solowaveCart') || '[]');
function saveCart(){ localStorage.setItem('solowaveCart', JSON.stringify(cart)); }
function formatPrice(n){ return 'Rs' + Math.round(n).toLocaleString('en-IN'); }
function getCartTotal(){ return cart.reduce(function(s,i){ return s + parseFloat(String(i.price).replace(/[^0-9.]/g,'')) * i.qty; }, 0); }

/* ── Wishlist ── */
var wishlist = JSON.parse(localStorage.getItem('solowaveWishlist') || '[]');
function saveWishlist(){ localStorage.setItem('solowaveWishlist', JSON.stringify(wishlist)); }

/* ── Current watch data ── */
var currentWatch = null;
var currentQty   = 1;
var currentImg   = '';

/* ── Load product from URL param ── */
function loadProduct(){
  var params = new URLSearchParams(window.location.search);
  var name   = params.get('name') || '';
  var watch  = null;

  if(typeof WATCHES_DATA !== 'undefined'){
    watch = WATCHES_DATA.find(function(w){ return w.name === name; });
    if(!watch) watch = WATCHES_DATA[0];
  }
  if(!watch) return;

  currentWatch = watch;
  currentImg   = watch.img;

  // Page title
  document.title = watch.name + ' — Solowave';

  // Breadcrumb
  var bc = document.getElementById('bcName');
  if(bc) bc.textContent = watch.name;

  // Series / Name / Price
  var s = document.getElementById('infoSeries'); if(s) s.textContent = watch.series;
  var n = document.getElementById('infoName');   if(n) n.textContent = watch.name;
  var p = document.getElementById('infoPrice');  if(p) p.textContent = watch.display;
  var d = document.getElementById('infoDesc');   if(d) d.textContent = watch.desc;

  // Badge
  var badge = document.getElementById('galleryBadge');
  if(badge){ badge.textContent = watch.badge || ''; badge.style.display = watch.badge ? 'block' : 'none'; }

  // Specs
  var specs = document.getElementById('infoSpecs');
  if(specs){
    var rows = [
      ['Material',    watch.mat],
      ['Movement',    watch.mov],
      ['Crystal',     watch.crystal],
      ['Water Resist',watch.water],
      ['Diameter',    watch.diam],
      ['Warranty',    watch.warranty]
    ];
    specs.innerHTML = rows.map(function(r){
      return '<div class="spec-row"><span class="spec-label">'+r[0]+'</span><span class="spec-value">'+r[1]+'</span></div>';
    }).join('');
  }

  // Features pills
  if(watch.features && watch.features.length){
    var fp = document.createElement('div');
    fp.className = 'feature-pills';
    fp.innerHTML = watch.features.map(function(f){
      return '<span class="feature-pill">'+f+'</span>';
    }).join('');
    var actionsEl = document.querySelector('.info-actions');
    if(actionsEl) actionsEl.parentNode.insertBefore(fp, actionsEl);
  }

  // Gallery images
  buildGallery(watch);

  // 360 image
  var img360 = document.getElementById('img360');
  if(img360) img360.src = watch.img2 || watch.img;

  // Video
  var poster = document.getElementById('videoPoster');
  if(poster) poster.src = watch.img;
  var vname = document.getElementById('videoWatchName');   if(vname) vname.textContent = watch.name;
  var vseries = document.getElementById('videoWatchSeries'); if(vseries) vseries.textContent = watch.series;

  // Wishlist button state
  updateWishlistBtn();

  // Related watches
  buildRelated(watch);

  // Cart count
  renderCartCount();
}

/* ── Gallery ── */
function buildGallery(watch){
  var imgs = [watch.img, watch.img2, watch.img3].filter(Boolean);
  var main = document.getElementById('mainImage');
  if(main){ main.src = imgs[0]; main.alt = watch.name; }

  var thumbs = document.getElementById('galleryThumbs');
  if(!thumbs) return;
  thumbs.innerHTML = imgs.map(function(src, i){
    return '<img src="'+src+'" class="gallery-thumb'+(i===0?' active-thumb':'')+'" alt="'+watch.name+' view '+(i+1)+'" onclick="switchMainImg(this,\''+src+'\')" loading="lazy" />';
  }).join('');
}

function switchMainImg(thumb, src){
  currentImg = src;
  var main = document.getElementById('mainImage');
  if(main){
    main.style.opacity = '0';
    main.style.transform = 'scale(0.97)';
    setTimeout(function(){
      main.src = src;
      main.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      main.style.opacity = '1';
      main.style.transform = 'scale(1)';
    }, 200);
  }
  document.querySelectorAll('.gallery-thumb').forEach(function(t){ t.classList.remove('active-thumb'); });
  thumb.classList.add('active-thumb');
}

/* ── View tabs ── */
function switchView(view){
  document.querySelectorAll('.view-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.view-tab').forEach(function(t){ t.classList.remove('active'); });
  var panel = document.getElementById('view-'+view);
  var tab   = document.getElementById('tab-'+view);
  if(panel) panel.classList.add('active');
  if(tab)   tab.classList.add('active');
  if(view === '360') init360();
}

/* ── Fullscreen image zoom modal (mobile tap + desktop click) ── */
function openImgZoom(){
  var img   = document.getElementById('mainImage');
  var modal = document.getElementById('imgZoomModal');
  var mImg  = document.getElementById('zoomModalImg');
  if(!img || !modal || !mImg) return;
  mImg.src = img.src;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Swipe down to close on mobile
  var startY = 0;
  mImg.addEventListener('touchstart', function(e){
    startY = e.touches[0].clientY;
  }, { passive: true, once: false });
  mImg._swipeHandler = function(e){
    if(e.touches[0].clientY - startY > 80) closeImgZoom();
  };
  mImg.addEventListener('touchmove', mImg._swipeHandler, { passive: true });
}

function closeImgZoom(){
  var modal = document.getElementById('imgZoomModal');
  var mImg  = document.getElementById('zoomModalImg');
  if(modal) modal.style.display = 'none';
  if(mImg && mImg._swipeHandler){
    mImg.removeEventListener('touchmove', mImg._swipeHandler);
  }
  document.body.style.overflow = 'auto';
}

/* ── Zoom on hover — DESKTOP only ── */
/* ── Mobile: tap image → zoomed view appears BELOW image ── */
function initZoom(){
  var img    = document.getElementById('mainImage');
  var lens   = document.getElementById('zoomLens');
  var result = document.getElementById('zoomResult');
  var hint   = document.getElementById('zoomHint');
  var wrap   = document.getElementById('galleryWrap');

  if(!img || !lens || !result || !wrap) return;

  var ZOOM = 3;
  var active = false;
  var isMobile = window.innerWidth < 900;

  function updateBg(w, h){
    result.style.backgroundImage  = 'url("' + img.src + '")';
    result.style.backgroundSize   = (w * ZOOM) + 'px ' + (h * ZOOM) + 'px';
    result.style.backgroundRepeat = 'no-repeat';
  }

  /* ── DESKTOP: hover zoom (right side panel) ── */
  if(!isMobile){
    img.addEventListener('mouseenter', function(){
      active = true;
      updateBg(img.offsetWidth, img.offsetHeight);
      lens.style.display   = 'block';
      result.style.display = 'block';
      if(hint) hint.style.opacity = '0';
    });
    img.addEventListener('mouseleave', function(){
      active = false;
      lens.style.display   = 'none';
      result.style.display = 'none';
      if(hint) hint.style.opacity = '1';
    });
    img.addEventListener('mousemove', function(e){
      if(!active) return;
      var imgRect  = img.getBoundingClientRect();
      var wrapRect = wrap.getBoundingClientRect();
      var x = e.clientX - imgRect.left;
      var y = e.clientY - imgRect.top;
      var lw = lens.offsetWidth  / 2;
      var lh = lens.offsetHeight / 2;
      var cx = Math.max(lw, Math.min(x, img.offsetWidth  - lw));
      var cy = Math.max(lh, Math.min(y, img.offsetHeight - lh));
      lens.style.left = (cx - lw + imgRect.left - wrapRect.left) + 'px';
      lens.style.top  = (cy - lh + imgRect.top  - wrapRect.top)  + 'px';
      var rw = result.offsetWidth  || 320;
      var rh = result.offsetHeight || 320;
      var rx = imgRect.right + 16;
      var ry = e.clientY - rh / 2;
      if(rx + rw > window.innerWidth - 8) rx = imgRect.left - rw - 16;
      ry = Math.max(8, Math.min(ry, window.innerHeight - rh - 8));
      result.style.left = rx + 'px';
      result.style.top  = ry + 'px';
      result.style.backgroundPosition =
        '-' + (cx * ZOOM - rw / 2) + 'px ' +
        '-' + (cy * ZOOM - rh / 2) + 'px';
    });
    img.addEventListener('load', function(){ if(active) updateBg(img.offsetWidth, img.offsetHeight); });
    return; // desktop done
  }

  /* ── MOBILE: touch → zoomed strip BELOW image ── */
  // Create inline zoom strip below image (only once)
  var strip = document.getElementById('mobileZoomStrip');
  if(!strip){
    strip = document.createElement('div');
    strip.id = 'mobileZoomStrip';
    strip.style.cssText = [
      'display:none',
      'width:100%',
      'height:220px',
      'overflow:hidden',
      'border-radius:12px',
      'border:1px solid rgba(201,168,76,0.3)',
      'background:#111',
      'margin-top:10px',
      'position:relative',
      'touch-action:none'
    ].join(';');
    // Insert after galleryWrap
    wrap.parentNode.insertBefore(strip, wrap.nextSibling);
  }

  var stripActive = false;

  function showStrip(clientX, clientY){
    var imgRect = img.getBoundingClientRect();
    var x = Math.max(0, Math.min(clientX - imgRect.left, img.offsetWidth));
    var y = Math.max(0, Math.min(clientY - imgRect.top,  img.offsetHeight));

    var sw = strip.offsetWidth  || img.offsetWidth;
    var sh = strip.offsetHeight || 220;

    strip.style.backgroundImage    = 'url("' + img.src + '")';
    strip.style.backgroundRepeat   = 'no-repeat';
    strip.style.backgroundSize     = (img.offsetWidth * ZOOM) + 'px ' + (img.offsetHeight * ZOOM) + 'px';
    strip.style.backgroundPosition =
      '-' + (x * ZOOM - sw / 2) + 'px ' +
      '-' + (y * ZOOM - sh / 2) + 'px';
  }

  img.addEventListener('touchstart', function(e){
    if(e.touches.length !== 1) return;
    e.preventDefault();
    stripActive = true;
    strip.style.display = 'block';
    updateBg(img.offsetWidth, img.offsetHeight);
    showStrip(e.touches[0].clientX, e.touches[0].clientY);
    if(hint) hint.style.opacity = '0';
  }, { passive: false });

  img.addEventListener('touchmove', function(e){
    if(!stripActive || e.touches.length !== 1) return;
    e.preventDefault();
    showStrip(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  img.addEventListener('touchend', function(){
    stripActive = false;
    strip.style.display = 'none';
    if(hint) hint.style.opacity = '1';
  });
  img.addEventListener('touchcancel', function(){
    stripActive = false;
    strip.style.display = 'none';
    if(hint) hint.style.opacity = '1';
  });
}

/* ── 360° rotation ── */
var rot360 = { angle: 0, dragging: false, startX: 0, autoTimer: null };

function init360(){
  var canvas = document.getElementById('canvas360');
  if(!canvas || canvas.dataset.init) return;
  canvas.dataset.init = '1';

  canvas.addEventListener('mousedown',  function(e){ rot360.dragging = true; rot360.startX = e.clientX; stopAutoRotate(); });
  canvas.addEventListener('touchstart', function(e){ rot360.dragging = true; rot360.startX = e.touches[0].clientX; stopAutoRotate(); }, {passive:true});

  document.addEventListener('mousemove', function(e){
    if(!rot360.dragging) return;
    var delta = e.clientX - rot360.startX;
    rot360.startX = e.clientX;
    applyRotation(delta);
    var hint = document.getElementById('dragHint');
    if(hint) hint.style.opacity = '0';
  });
  document.addEventListener('touchmove', function(e){
    if(!rot360.dragging) return;
    var delta = e.touches[0].clientX - rot360.startX;
    rot360.startX = e.touches[0].clientX;
    applyRotation(delta);
  }, {passive:true});

  document.addEventListener('mouseup',  function(){ rot360.dragging = false; });
  document.addEventListener('touchend', function(){ rot360.dragging = false; });
}

function applyRotation(delta){
  rot360.angle += delta * 0.5;
  var img = document.getElementById('img360');
  if(img) img.style.transform = 'rotateY('+rot360.angle+'deg) scale(1.02)';
  var bar = document.getElementById('rotBar');
  if(bar) bar.style.width = ((rot360.angle % 360 + 360) % 360 / 360 * 100) + '%';
}

function rotate360(dir){
  applyRotation(dir * 30);
}

var autoRotating = false;
function toggleAutoRotate(){
  autoRotating = !autoRotating;
  var btn = document.getElementById('autoRotBtn');
  if(autoRotating){
    if(btn) btn.classList.add('active');
    rot360.autoTimer = setInterval(function(){ applyRotation(1.5); }, 30);
  } else {
    stopAutoRotate();
    if(btn) btn.classList.remove('active');
  }
}
function stopAutoRotate(){
  autoRotating = false;
  clearInterval(rot360.autoTimer);
  var btn = document.getElementById('autoRotBtn');
  if(btn) btn.classList.remove('active');
}

/* ── Video ── */
function startWatchVideo(){
  if(!currentWatch) return;
  var overlay = document.getElementById('videoThumbOverlay');
  var loading = document.getElementById('videoLoading');
  var iframeWrap = document.getElementById('videoIframeWrap');
  var iframe  = document.getElementById('watchVideoIframe');

  if(overlay) overlay.style.display = 'none';
  if(loading){ loading.style.display = 'flex'; }

  var videoUrl = (currentWatch.video || 'https://www.youtube.com/embed/tFnGHFBMBrg') + '?autoplay=1&rel=0';
  setTimeout(function(){
    if(loading) loading.style.display = 'none';
    if(iframeWrap) iframeWrap.style.display = 'block';
    if(iframe) iframe.src = videoUrl;
  }, 800);
}

/* ── AR Notify ── */
function arNotify(){
  var msg = document.getElementById('arNotifyMsg');
  if(msg){
    msg.textContent = '✓ You\'ll be notified when AR Try-On launches!';
    msg.style.cssText = 'color:#3a8a3a;font-size:0.8rem;margin-top:12px;';
    var emails = JSON.parse(localStorage.getItem('arNotifyList') || '[]');
    emails.push({ date: Date.now() });
    localStorage.setItem('arNotifyList', JSON.stringify(emails));
  }
}

/* ── Quantity ── */
function changeQtyInput(delta){
  currentQty = Math.max(1, Math.min(10, currentQty + delta));
  var el = document.getElementById('qtyVal');
  if(el) el.textContent = currentQty;
}

/* ── Add to Cart ── */
function handleAddToCart(){
  if(!currentWatch) return;
  var found = false;
  for(var i = 0; i < cart.length; i++){
    if(cart[i].name === currentWatch.name){ cart[i].qty += currentQty; found = true; break; }
  }
  if(!found){
    cart.push({ name: currentWatch.name, price: currentWatch.display, img: currentWatch.img, series: currentWatch.series, qty: currentQty });
  }
  saveCart(); renderCartCount();
  var btn = document.getElementById('btnAddCart');
  if(btn){
    var orig = btn.innerHTML;
    btn.innerHTML = '✓ Added to Cart';
    btn.style.background = 'linear-gradient(135deg,#2a5a2a,#3a8a3a)';
    setTimeout(function(){ btn.innerHTML = orig; btn.style.background = ''; }, 2000);
  }
  showToastMsg(currentWatch.name + ' added to cart ✓');
  openCart();
}

/* ── Buy Now ── */
function handleBuyNow(){
  handleAddToCart();
  setTimeout(function(){ window.location.href = 'checkout.html'; }, 400);
}

/* ── Wishlist ── */
function toggleWishlist(){
  if(!currentWatch) return;
  var idx = wishlist.indexOf(currentWatch.name);
  if(idx === -1){
    wishlist.push(currentWatch.name);
    showToastMsg(currentWatch.name + ' added to wishlist ♥');
  } else {
    wishlist.splice(idx, 1);
    showToastMsg('Removed from wishlist');
  }
  saveWishlist();
  updateWishlistBtn();
}

function updateWishlistBtn(){
  var btn = document.getElementById('btnWishlist');
  if(!btn || !currentWatch) return;
  var inList = wishlist.indexOf(currentWatch.name) !== -1;
  btn.classList.toggle('wishlisted', inList);
  btn.title = inList ? 'Remove from Wishlist' : 'Add to Wishlist';
  btn.innerHTML = inList
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
}

/* ── Related watches ── */
function buildRelated(watch){
  var grid = document.getElementById('relatedGrid');
  if(!grid || typeof WATCHES_DATA === 'undefined') return;
  var related = WATCHES_DATA.filter(function(w){ return w.name !== watch.name; })
    .sort(function(){ return Math.random() - 0.5 }).slice(0, 4);

  grid.innerHTML = related.map(function(w){
    return '<div class="related-card" onclick="window.location.href=\'product.html?name=\'+encodeURIComponent(\''+w.name+'\')">'
      + '<div class="related-img-wrap"><img src="'+w.img+'" alt="'+w.name+'" class="related-img" loading="lazy" /></div>'
      + '<div class="related-info">'
      + '<div class="related-series">'+w.series+'</div>'
      + '<div class="related-name">'+w.name+'</div>'
      + '<div class="related-price">'+w.display+'</div>'
      + '</div></div>';
  }).join('');
}

/* ── Cart drawer ── */
function renderCartCount(){
  var total = cart.reduce(function(s,i){ return s + i.qty; }, 0);
  var el = document.getElementById('cartCount');
  if(el){ el.textContent = total; el.classList.toggle('visible', total > 0); }
  var ic = document.getElementById('cartItemCount');
  if(ic) ic.textContent = total + (total === 1 ? ' item' : ' items');
}

function renderCart(){
  var ie = document.getElementById('cartItems');
  var ee = document.getElementById('cartEmpty');
  var fe = document.getElementById('cartFooter');
  if(!ie || !ee || !fe) return;
  renderCartCount();
  if(cart.length === 0){ ee.style.display='flex'; ie.style.display='none'; fe.style.display='none'; return; }
  ee.style.display='none'; ie.style.display='block'; fe.style.display='block';
  var h = '';
  cart.forEach(function(it, i){
    h += '<div class="cart-item" id="cart-item-'+i+'">'
      + '<div class="cart-item-img-wrap"><img src="'+it.img+'" class="cart-item-img"></div>'
      + '<div class="cart-item-info">'
      + '<div class="cart-item-name">'+it.name+'</div>'
      + '<div class="cart-item-series">'+it.series+'</div>'
      + '<div class="cart-item-price">'+it.price+'</div>'
      + '<div class="cart-item-controls">'
      + '<button class="qty-btn" onclick="ppChangeQty('+i+',-1)">&#8722;</button>'
      + '<span class="qty-num">'+it.qty+'</span>'
      + '<button class="qty-btn" onclick="ppChangeQty('+i+',1)">+</button>'
      + '<button class="remove-btn" onclick="ppRemoveItem('+i+')">Remove</button>'
      + '</div></div></div>';
  });
  ie.innerHTML = h;
  var sub = getCartTotal(), tax = sub * 0.08;
  var cs = document.getElementById('cartSubtotal'); if(cs) cs.textContent = formatPrice(sub);
  var ct = document.getElementById('cartTax');      if(ct) ct.textContent = formatPrice(tax);
  var ctt= document.getElementById('cartTotal');    if(ctt) ctt.textContent = formatPrice(sub + tax);
}

function ppChangeQty(idx, delta){
  if(!cart[idx]) return;
  cart[idx].qty += delta;
  if(cart[idx].qty <= 0){ ppRemoveItem(idx); return; }
  saveCart(); renderCart();
}
function ppRemoveItem(idx){
  cart.splice(idx, 1); saveCart(); renderCart();
}

function openCart(){
  var d = document.getElementById('cartDrawer'), o = document.getElementById('cartOverlay');
  if(d) d.classList.add('open');
  if(o) o.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCart();
}
function closeCart(){
  var d = document.getElementById('cartDrawer'), o = document.getElementById('cartOverlay');
  if(d) d.classList.remove('open');
  if(o) o.classList.remove('open');
  document.body.style.overflow = 'auto';
}
function handleCheckout(){ window.location.href = 'checkout.html'; }
function closeCheckout(){
  var cm = document.getElementById('checkoutModal');
  if(cm) cm.classList.remove('open');
}

/* ── Pay modal (Buy Now inline) ── */
var payQty = 1;
function openPayModal(){
  if(!currentWatch) return;
  var ov = document.getElementById('payModalOverlay');
  if(!ov) return;
  document.getElementById('payModalName').textContent        = currentWatch.name;
  document.getElementById('payModalPrice').textContent       = currentWatch.display;
  document.getElementById('payModalImg').src                 = currentWatch.img;
  document.getElementById('payModalProductName').textContent = currentWatch.name;
  document.getElementById('payModalSeries').textContent      = currentWatch.series;
  payQty = currentQty;
  document.getElementById('payQtyVal').textContent = payQty;
  updatePayTotal();
  ov.classList.add('open');
  document.body.style.overflow = 'hidden';
  goPayStep(1);
}
function closePayModal(){
  var ov = document.getElementById('payModalOverlay');
  if(ov) ov.classList.remove('open');
  document.body.style.overflow = 'auto';
}
function payQtyChange(d){
  payQty = Math.max(1, Math.min(10, payQty + d));
  var el = document.getElementById('payQtyVal');
  if(el) el.textContent = payQty;
  updatePayTotal();
}
function updatePayTotal(){
  if(!currentWatch) return;
  var total = parseInt(currentWatch.price) * payQty;
  var el = document.getElementById('payModalTotal');
  if(el) el.textContent = formatPrice(total);
}
function goPayStep(n){
  [1,2,3].forEach(function(i){
    var c = document.getElementById('payStep'+i);
    var b = document.getElementById('step'+i+'Btn');
    if(c) c.style.display = (i === n) ? 'block' : 'none';
    if(b){ b.classList.toggle('active', i === n); b.classList.toggle('done', i < n); }
  });
}
function selectPayMethod(m){
  document.querySelectorAll('.pay-method').forEach(function(el){ el.classList.remove('active'); });
  var el = document.getElementById('pm-'+m);
  if(el) el.classList.add('active');
  document.querySelectorAll('.pm-extra').forEach(function(e){ e.style.display='none'; });
  var ex = document.getElementById('pm-extra-'+m);
  if(ex) ex.style.display = 'block';
}
function setUpiApp(app){
  document.querySelectorAll('.upi-app-btn').forEach(function(b){ b.classList.remove('active'); });
  event.currentTarget.classList.add('active');
  var inp = document.getElementById('payUpiId');
  var sfx = { gpay:'@okicici', phonepe:'@ybl', paytmupi:'@paytm', bhim:'@upi' };
  if(inp) inp.placeholder = 'yourname' + (sfx[app] || '@upi');
}
function fmtCard(inp){
  var v = inp.value.replace(/\D/g,'').substring(0,16);
  var f = v.match(/.{1,4}/g);
  inp.value = f ? f.join(' ') : v;
  updCardPreview();
}
function fmtExp(inp){
  var v = inp.value.replace(/\D/g,'');
  if(v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2,4);
  inp.value = v;
  var el = document.getElementById('pcpExpiry');
  if(el) el.textContent = inp.value || 'MM/YY';
}
function updCardPreview(){
  var num  = document.getElementById('payCardNum');
  var name = document.getElementById('payCardName');
  var pn   = document.getElementById('pcpNumber');
  var pna  = document.getElementById('pcpName');
  if(num && pn){
    var n = num.value.replace(/\s/g,'');
    var m = '';
    for(var i=0;i<16;i++){ if(i>0&&i%4===0) m+=' '; m += (n[i]&&i<12)?'•':(n[i]||'•'); }
    pn.textContent = m;
  }
  if(name && pna) pna.textContent = name.value.toUpperCase() || 'YOUR NAME';
}
function payStep1Next(){
  var fn = document.getElementById('payFirstName');
  var em = document.getElementById('payEmail');
  var ph = document.getElementById('payPhone');
  var ad = document.getElementById('payAddr');
  if(!fn||!fn.value.trim()){ fn.focus(); showToastMsg('Please enter your name'); return; }
  if(!em||!em.value.includes('@')){ em.focus(); showToastMsg('Please enter a valid email'); return; }
  if(!ph||!ph.value.trim()){ ph.focus(); showToastMsg('Please enter your phone'); return; }
  if(!ad||!ad.value.trim()){ ad.focus(); showToastMsg('Please enter your address'); return; }
  goPayStep(2);
}
function processPayment(){
  var btn = document.getElementById('payNowBtn');
  var txt = document.getElementById('payNowText');
  if(btn) btn.disabled = true;
  if(txt) txt.textContent = 'Processing…';
  setTimeout(function(){
    var orderId = 'SLW-' + Date.now().toString(36).toUpperCase();
    // Save order
    try {
      var fn = document.getElementById('payFirstName').value;
      var em = document.getElementById('payEmail').value;
      var orders = JSON.parse(localStorage.getItem('solowaveOrders') || '[]');
      orders.unshift({
        id: orderId, name: fn, email: em,
        product: currentWatch.name, qty: payQty,
        price: parseInt(currentWatch.price) * payQty,
        payment: 'Online', status: 'confirmed', date: Date.now()
      });
      localStorage.setItem('solowaveOrders', JSON.stringify(orders));
    } catch(e){}
    // Show success
    goPayStep(3);
    var so = document.getElementById('paySuccessOrder');
    if(so) so.textContent = 'Order ID: ' + orderId;
    var sd = document.getElementById('paySuccessDetails');
    if(sd) sd.innerHTML = 'Watch: <strong>'+currentWatch.name+'</strong><br>Amount: <strong>'+formatPrice(parseInt(currentWatch.price)*payQty)+'</strong><br>Delivery: <strong>7–14 Business Days</strong>';
    // Animate SVG
    setTimeout(function(){
      var c = document.getElementById('paySuccessCircle'), k = document.getElementById('paySuccessCheck');
      if(c) c.style.cssText += 'transition:stroke-dashoffset 0.8s ease;stroke-dashoffset:0;';
      if(k) setTimeout(function(){ k.style.cssText += 'transition:stroke-dashoffset 0.5s ease;stroke-dashoffset:0;'; }, 500);
    }, 100);
    if(btn){ btn.disabled = false; }
    if(txt){ txt.textContent = 'Pay Now 🔒'; }
  }, 1400);
}

/* ── Toast ── */
function showToastMsg(msg){
  var t = document.getElementById('cartToast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2800);
}

/* ── Navbar scroll ── */
window.addEventListener('scroll', function(){
  var nb = document.getElementById('navbar');
  if(nb){ nb.classList.toggle('scrolled', window.scrollY > 60); }
});

/* ── Keyboard ── */
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){ closeCart(); closePayModal(); closeImgZoom(); }
});

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function(){
  loadProduct();
  initZoom();

  // Wishlist button — inject if not present
  var actions = document.querySelector('.info-actions');
  if(actions && !document.getElementById('btnWishlist')){
    var wb = document.createElement('button');
    wb.id = 'btnWishlist';
    wb.className = 'btn-wishlist';
    wb.onclick = toggleWishlist;
    wb.title = 'Add to Wishlist';
    wb.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
    actions.appendChild(wb);
  }
});
