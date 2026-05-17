// SOLOWAVE WATCHES - SCRIPT.JS
var cart = JSON.parse(localStorage.getItem('solowaveCart') || '[]');
function saveCart(){localStorage.setItem('solowaveCart',JSON.stringify(cart));}
// Sync cart images with latest WATCHES_DATA on load
function syncCartImages(){
  if(typeof WATCHES_DATA === 'undefined') return;
  cart.forEach(function(item){
    var w = WATCHES_DATA.find(function(w){ return w.name === item.name; });
    if(w && w.img) item.img = w.img;
  });
  saveCart();
}
document.addEventListener('DOMContentLoaded', syncCartImages);
function getCartTotal(){return cart.reduce(function(s,i){return s+parseFloat(i.price.replace(/[^0-9.]/g,''))*i.qty;},0);}
function formatPrice(n){function fmtINR(n){return 'Rs'+Math.round(n).toLocaleString('en-IN');}return fmtINR(n);}
function renderCart(){
  var ie=document.getElementById('cartItems'),ee=document.getElementById('cartEmpty'),fe=document.getElementById('cartFooter'),ce=document.getElementById('cartCount'),ic=document.getElementById('cartItemCount');
  if(!ie||!ee||!fe||!ce||!ic)return;
  var q=0;for(var k=0;k<cart.length;k++)q+=cart[k].qty;
  ce.textContent=q;if(q>0)ce.classList.add('visible');else ce.classList.remove('visible');
  ic.textContent=q+(q===1?' item':' items');
  if(cart.length===0){ee.style.display='flex';ie.style.display='none';fe.style.display='none';return;}
  ee.style.display='none';ie.style.display='block';fe.style.display='block';
  var h='';for(var i=0;i<cart.length;i++){var it=cart[i];
    h+='<div class="cart-item" id="cart-item-'+i+'"><div class="cart-item-img-wrap"><img src="'+it.img+'" class="cart-item-img"></div><div class="cart-item-info"><div class="cart-item-name">'+it.name+'</div><div class="cart-item-series">'+it.series+'</div><div class="cart-item-price">'+it.price+'</div><div class="cart-item-controls"><button class="qty-btn" onclick="changeQty('+i+',-1)">&#8722;</button><span class="qty-num">'+it.qty+'</span><button class="qty-btn" onclick="changeQty('+i+',1)">+</button><button class="remove-btn" onclick="removeItem('+i+')">Remove</button></div></div></div>';
  }ie.innerHTML=h;
  var sub=getCartTotal(),tax=sub*0.08;
  document.getElementById('cartSubtotal').textContent=formatPrice(sub);
  document.getElementById('cartTax').textContent=formatPrice(tax);
  document.getElementById('cartTotal').textContent=formatPrice(sub+tax);
}
function addToCartDirect(name,price,img,series){
  series=series||name.replace('Solowave ','')+' Series';img=img||'';
  var found=false;for(var i=0;i<cart.length;i++){if(cart[i].name===name){cart[i].qty++;found=true;break;}}
  if(!found)cart.push({name:name,price:price,img:img,series:series,qty:1});
  saveCart();renderCart();showToast(name+' added \u2713');openCart();
}
function addToCartFromModal(){
  var n=document.getElementById('modalName').textContent;
  var p=document.getElementById('modalPrice').textContent;
  var mi=document.querySelector('.modal-watch-img');
  addToCartDirect(n,p,mi?mi.src:'');
}
function changeQty(idx,delta){if(!cart[idx])return;cart[idx].qty+=delta;if(cart[idx].qty<=0){removeItem(idx);return;}saveCart();renderCart();}
function removeItem(idx){var el=document.getElementById('cart-item-'+idx);if(el){el.style.transition='all 0.3s ease';el.style.opacity='0';el.style.transform='translateX(40px)';setTimeout(function(){cart.splice(idx,1);saveCart();renderCart();},300);}else{cart.splice(idx,1);saveCart();renderCart();}}
function clearCart(){cart=[];saveCart();renderCart();}
function openCart(){
  var d=document.getElementById('cartDrawer'),o=document.getElementById('cartOverlay');
  if(!d||!o)return;
  d.classList.add('open');o.classList.add('open');
  document.body.style.overflow='hidden';renderCart();
}
function closeCart(){var d=document.getElementById('cartDrawer'),o=document.getElementById('cartOverlay');if(d)d.classList.remove('open');if(o)o.classList.remove('open');document.body.style.overflow='auto';}
function handleCheckout(){if(!cart.length)return;var id='ZYP-'+Date.now().toString(36).toUpperCase();var oe=document.getElementById('checkoutOrderId');if(oe)oe.textContent='Order ID: '+id;var cm=document.getElementById('checkoutModal');if(cm)cm.classList.add('open');clearCart();closeCart();}
function closeCheckout(){var cm=document.getElementById('checkoutModal');if(cm)cm.classList.remove('open');}
function showToast(msg){var t=document.getElementById('cartToast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2800);}
function openModal(name,price,desc){
  var ne=document.getElementById('modalName'),pe=document.getElementById('modalPrice'),de=document.getElementById('modalDesc');
  if(ne)ne.textContent=name;if(pe)pe.textContent=price;if(de)de.textContent=desc;
  var src='https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80&fit=crop';
  document.querySelectorAll('.watch-card').forEach(function(card){
    var cn=card.querySelector('.card-name');
    if(cn&&cn.textContent===name){var im=card.querySelector('.watch-img');if(im)src=im.src;}
  });
  var mi=document.querySelector('.modal-watch-img');if(mi)mi.src=src;
  var ov=document.getElementById('modalOverlay');if(ov)ov.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){var ov=document.getElementById('modalOverlay');if(ov)ov.classList.remove('open');document.body.style.overflow='auto';}
document.addEventListener('click',function(e){
  var tgt=e.target;

  // Quick View
  if(tgt.classList.contains('btn-qv-card')||tgt.classList.contains('btn-quickview')){
    var card=tgt.closest('.watch-card');if(!card)return;
    var name  = card.querySelector('.card-name')  ? card.querySelector('.card-name').textContent  : '';
    var price = card.querySelector('.card-price') ? card.querySelector('.card-price').textContent : '';
    var desc  = card.getAttribute('data-desc')    || '';
    openModal(name,price,desc);
    return;
  }

  // Add to Cart
  if(tgt.classList.contains('btn-cart-card')||tgt.classList.contains('btn-cart')){
    var card=tgt.closest('.watch-card');if(!card)return;
    var n  = card.querySelector('.card-name')       ? card.querySelector('.card-name').textContent       : '';
    var p  = card.querySelector('.card-price')      ? card.querySelector('.card-price').textContent      : '';
    var sr = card.querySelector('.card-collection') ? card.querySelector('.card-collection').textContent : '';
    var im = card.querySelector('.watch-img')       ? card.querySelector('.watch-img').src               : '';
    addToCartDirect(n,p,im,sr);
    var orig=tgt.textContent;
    tgt.textContent='\u2713 Added';tgt.style.background='linear-gradient(135deg,#2a5a2a,#3a8a3a)';tgt.style.color='#fff';
    setTimeout(function(){tgt.textContent=orig;tgt.style.background='';tgt.style.color='';},1800);
    return;
  }

  // Buy Now
  if(tgt.classList.contains('btn-buynow-card')||tgt.classList.contains('btn-buynow')){
    var c2=tgt.closest('.watch-card');if(!c2)return;
    var ne=c2.querySelector('.card-name');
    if(ne)window.location.href='product.html?name='+encodeURIComponent(ne.textContent);
    return;
  }
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeModal();closeCart();closeCheckout();}});
window.addEventListener('load', function(){
  setTimeout(function(){
    var l = document.getElementById('loader');
    if(l) l.classList.add('hidden');
    document.body.style.overflow = 'auto';
    initReveal();
    renderCart();
  }, 1800);
});
document.body.style.overflow = 'hidden';
var navbar=document.getElementById('navbar');window.addEventListener('scroll',function(){if(!navbar)return;if(window.scrollY>60)navbar.classList.add('scrolled');else navbar.classList.remove('scrolled');});
document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}});});
function initReveal(){var obs=new IntersectionObserver(function(entries){entries.forEach(function(entry,i){if(entry.isIntersecting){setTimeout(function(){entry.target.classList.add('visible');},i*80);obs.unobserve(entry.target);}});},{threshold:0.1,rootMargin:'0px 0px -60px 0px'});document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});}
function createTicks(c){for(var i=0;i<60;i++){var t=document.createElement('div'),isH=i%5===0;t.classList.add('tick');t.style.cssText='position:absolute;background:var(--gold);width:'+(isH?'2px':'1px')+';height:'+(isH?'10px':'5px')+';top:'+(isH?'6px':'8px')+';left:50%;margin-left:'+(isH?'-1px':'-0.5px')+';transform:rotate('+(i*6)+'deg);transform-origin:bottom center;opacity:'+(isH?'1':'0.4')+';';c.appendChild(t);}}
document.querySelectorAll('.tick-marks').forEach(function(c){createTicks(c);});
function updateHands(){var now=new Date(),h=now.getHours()%12,m=now.getMinutes(),s=now.getSeconds(),ms=now.getMilliseconds();var hD=h*30+m*0.5,mD=m*6+s*0.1,sD=s*6+ms*0.006;function sh(a,b,c){var he=document.getElementById(a),me=document.getElementById(b),se=document.getElementById(c);if(he)he.style.transform='rotate('+hD+'deg)';if(me)me.style.transform='rotate('+mD+'deg)';if(se)se.style.transform='rotate('+sD+'deg)';}sh('hourHand','minuteHand','secondHand');sh('productHour','productMinute','productSecond');var sub=document.getElementById('subdialHand');if(sub)sub.style.transform='rotate('+sD+'deg)';}
updateHands();setInterval(updateHands,50);
var currentTestimonial=0,tCards=document.querySelectorAll('.testimonial-card'),tDots=document.querySelectorAll('.t-dot');
function goToTestimonial(index){if(!tCards.length)return;tCards[currentTestimonial].classList.remove('active');tDots[currentTestimonial].classList.remove('active');currentTestimonial=(index+tCards.length)%tCards.length;tCards[currentTestimonial].classList.add('active');tDots[currentTestimonial].classList.add('active');}
var tn=document.getElementById('tNext'),tp=document.getElementById('tPrev');if(tn)tn.addEventListener('click',function(){goToTestimonial(currentTestimonial+1);});if(tp)tp.addEventListener('click',function(){goToTestimonial(currentTestimonial-1);});setInterval(function(){goToTestimonial(currentTestimonial+1);},5000);
function handleNewsletter(e){
  e.preventDefault();
  var btn = e.target.querySelector('.btn-newsletter');
  var inp = e.target.querySelector('.newsletter-input');
  var email = inp ? inp.value.trim() : '';

  if(!email || !email.includes('@')){
    if(inp){ inp.style.borderColor='#e05555'; inp.focus(); }
    return;
  }
  if(inp) inp.style.borderColor = '';

  // Save subscriber to Firebase + localStorage
  var subs = JSON.parse(localStorage.getItem('solowaveSubscribers') || '[]');
  var already = subs.some(function(s){ return s.email === email; });
  if(!already){
    subs.push({ email: email, date: Date.now() });
    localStorage.setItem('solowaveSubscribers', JSON.stringify(subs));
  }
  if(typeof window.swSaveSubscriber === 'function'){
    window.swSaveSubscriber(email);
  }

  if(btn){
    btn.textContent = already ? '✓ Already Subscribed' : '✓ Welcome to the Club';
    btn.style.background = 'linear-gradient(135deg,#2a5a2a,#3a8a3a)';
  }
  if(inp) inp.value = '';
  setTimeout(function(){
    if(btn){ btn.textContent = 'Join Now'; btn.style.background = ''; }
  }, 3500);
}
/* ── Mobile Menu ── */
function openMobileMenu(){
  var menu    = document.getElementById('mobileMenu');
  var overlay = document.getElementById('mobileMenuOverlay');
  var toggle  = document.getElementById('navToggle');
  if(menu)    menu.classList.add('open');
  if(overlay) overlay.classList.add('open');
  if(toggle)  toggle.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu(){
  var menu    = document.getElementById('mobileMenu');
  var overlay = document.getElementById('mobileMenuOverlay');
  var toggle  = document.getElementById('navToggle');
  if(menu)    menu.classList.remove('open');
  if(overlay) overlay.classList.remove('open');
  if(toggle)  toggle.classList.remove('active');
  document.body.style.overflow = 'auto';
}

/* Wire up hamburger after DOM is ready */
document.addEventListener('DOMContentLoaded', function(){
  var navToggle = document.getElementById('navToggle');
  if(navToggle){
    navToggle.addEventListener('click', function(e){
      e.stopPropagation();
      var menu = document.getElementById('mobileMenu');
      if(menu && menu.classList.contains('open')){
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  /* Mobile theme toggle syncs with main toggle */
  var mobileThemeBtn = document.getElementById('themeToggleMobile');
  if(mobileThemeBtn){
    mobileThemeBtn.addEventListener('click', function(){
      var mainToggle = document.getElementById('themeToggle');
      if(mainToggle) mainToggle.click();
    });
  }
});

/* Close mobile menu on Escape */
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape') closeMobileMenu();
});
var cg=document.createElement('div');cg.style.cssText='position:fixed;width:300px;height:300px;background:radial-gradient(circle,rgba(201,168,76,0.04),transparent 70%);border-radius:50%;pointer-events:none;z-index:0;transform:translate(-50%,-50%);transition:left 0.3s ease,top 0.3s ease;';document.body.appendChild(cg);document.addEventListener('mousemove',function(e){cg.style.left=e.clientX+'px';cg.style.top=e.clientY+'px';});
function switchProductImg(thumb,newSrc){var mi=document.getElementById('productMainImg');if(!mi)return;mi.style.opacity='0';mi.style.transform='scale(0.97)';setTimeout(function(){mi.src=newSrc;mi.style.transition='opacity 0.4s ease,transform 0.4s ease';mi.style.opacity='1';mi.style.transform='scale(1)';},250);document.querySelectorAll('.product-thumb').forEach(function(t){t.classList.remove('active-thumb');});thumb.classList.add('active-thumb');}


/* ============================================================
   DAY / NIGHT MODE TOGGLE
   ============================================================ */
(function(){
  var DAY_KEY = 'solowaveTheme';

  // Create flash overlay
  var flash = document.createElement('div');
  flash.className = 'theme-flash';
  document.body.appendChild(flash);

  // Apply saved preference immediately (before paint)
  var saved = localStorage.getItem(DAY_KEY);

  // Auto-detect system preference if no saved value
  if (!saved) {
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    saved = prefersDark ? 'night' : 'day';
  }

  function applyTheme(mode, animate) {
    var isDay = mode === 'day';
    if (isDay) {
      document.body.classList.add('day-mode');
    } else {
      document.body.classList.remove('day-mode');
    }
    localStorage.setItem(DAY_KEY, mode);

    // Update toggle aria-label
    var btn = document.getElementById('themeToggle');
    if (btn) btn.setAttribute('aria-label', isDay ? 'Switch to Night Mode' : 'Switch to Day Mode');

    // Flash animation
    if (animate) {
      flash.className = 'theme-flash ' + (isDay ? 'sunrise' : 'sunset');
      flash.classList.add('active');
      setTimeout(function(){ flash.classList.remove('active'); }, 600);
    }

    // Close mobile menu if open when theme changes
    closeMobileMenu();
  }

  // Apply on load (no animation)
  applyTheme(saved, false);

  // Wire up button after DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.addEventListener('click', function(){
      var isDay = document.body.classList.contains('day-mode');
      applyTheme(isDay ? 'night' : 'day', true);
    });
  });

  // Listen for system preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e){
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(DAY_KEY)) {
        applyTheme(e.matches ? 'night' : 'day', true);
      }
    });
  }
})();


/* ============================================================
   SMART SEARCH & FILTER
   ============================================================ */
(function(){

  /* ── Price parser: "Rs10,37,500" → 1037500 ── */
  function parsePrice(str){
    return parseInt((str||'').replace(/[^0-9]/g,''), 10) || 0;
  }

  /* ── Determine category tags for each card ── */
  function getCategories(card){
    var cats = [];
    var series = (card.querySelector('.card-collection')||{}).textContent || '';
    var name   = (card.getAttribute('data-name') || '').toLowerCase();
    var desc   = (card.getAttribute('data-desc') || '').toLowerCase();
    var price  = parsePrice(card.getAttribute('data-price'));

    // Sport
    if(/sport/i.test(series) || /sport|running|diving|triathlon|gym|sprint|tactical|aqua|summit|blaze|volt|iron|peak|stealth/i.test(name+desc)){
      cats.push('sport');
    }
    // Luxury (non-sport)
    if(!/sport/i.test(series) && price > 0){
      cats.push('luxury');
    }
    // Limited / rare
    var badge = (card.querySelector('.card-badge')||{}).textContent || '';
    if(/limited|exclusive|rare|bespoke|platinum|1 of|worldwide|pieces/i.test(badge+desc)){
      cats.push('limited');
    }
    // Price bands
    if(price > 0 && price < 500000)  cats.push('under5l');
    if(price >= 500000 && price <= 2000000) cats.push('5to20l');
    if(price > 2000000) cats.push('above20l');

    return cats;
  }

  /* ── Highlight matched text inside an element ── */
  function highlightText(el, query){
    if(!el) return;
    // Restore original text first
    if(el.dataset.origHtml !== undefined){
      el.innerHTML = el.dataset.origHtml;
    } else {
      el.dataset.origHtml = el.innerHTML;
    }
    if(!query) return;
    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    var re = new RegExp('('+escaped+')', 'gi');
    el.innerHTML = el.dataset.origHtml.replace(re, '<mark class="sf-highlight">$1</mark>');
  }

  /* ── Restore all highlights ── */
  function clearHighlights(){
    document.querySelectorAll('[data-orig-html]').forEach(function(el){
      el.innerHTML = el.dataset.origHtml;
      delete el.dataset.origHtml;
    });
  }

  /* ── State ── */
  var state = { query: '', filter: 'all', sort: 'default' };

  /* ── Main filter + sort function ── */
  function applyFilters(){
    var cards = Array.from(document.querySelectorAll('#collectionGrid .watch-card'));
    var q     = state.query.trim().toLowerCase();
    var f     = state.filter;

    clearHighlights();

    // 1. Filter
    var visible = [];
    cards.forEach(function(card){
      var name   = (card.getAttribute('data-name')  || '').toLowerCase();
      var desc   = (card.getAttribute('data-desc')  || '').toLowerCase();
      var series = ((card.querySelector('.card-collection')||{}).textContent||'').toLowerCase();
      var price  = (card.getAttribute('data-price') || '').toLowerCase();

      var matchesQuery = !q ||
        name.includes(q) || desc.includes(q) ||
        series.includes(q) || price.includes(q);

      var cats = getCategories(card);
      var matchesFilter = f === 'all' || cats.indexOf(f) !== -1;

      if(matchesQuery && matchesFilter){
        visible.push(card);
        card.classList.remove('sf-hidden');
      } else {
        card.classList.add('sf-hidden');
      }
    });

    // 2. Sort visible cards
    var grid = document.getElementById('collectionGrid');
    if(state.sort !== 'default' && visible.length > 1){
      visible.sort(function(a, b){
        var pa = parsePrice(a.getAttribute('data-price'));
        var pb = parsePrice(b.getAttribute('data-price'));
        var na = (a.getAttribute('data-name')||'').toLowerCase();
        var nb = (b.getAttribute('data-name')||'').toLowerCase();
        if(state.sort === 'price-asc')  return pa - pb;
        if(state.sort === 'price-desc') return pb - pa;
        if(state.sort === 'name-asc')   return na < nb ? -1 : na > nb ? 1 : 0;
        if(state.sort === 'name-desc')  return na > nb ? -1 : na < nb ? 1 : 0;
        return 0;
      });
      // Re-append in sorted order
      visible.forEach(function(card){
        card.classList.add('sf-fade-in');
        grid.appendChild(card);
        setTimeout(function(){ card.classList.remove('sf-fade-in'); }, 400);
      });
    }

    // 3. Highlight query in visible cards
    if(q){
      visible.forEach(function(card){
        highlightText(card.querySelector('.card-name'), q);
        highlightText(card.querySelector('.card-collection'), q);
      });
    }

    // 4. Update count
    updateMeta(visible.length, cards.length);

    // 5. Show/hide empty state
    var emptyEl = document.getElementById('sfEmpty');
    var gridEl  = document.getElementById('collectionGrid');
    if(emptyEl && gridEl){
      if(visible.length === 0){
        emptyEl.style.display = 'block';
        gridEl.style.opacity  = '0.3';
      } else {
        emptyEl.style.display = 'none';
        gridEl.style.opacity  = '1';
      }
    }
  }

  /* ── Update result count & active tags ── */
  function updateMeta(shown, total){
    var countEl = document.getElementById('sfCount');
    var tagsEl  = document.getElementById('sfActiveTags');
    if(countEl){
      if(state.query || state.filter !== 'all'){
        countEl.innerHTML = 'Showing <strong>'+shown+'</strong> of '+total+' watches';
      } else {
        countEl.innerHTML = '<strong>'+total+'</strong> watches';
      }
    }
    if(tagsEl){
      tagsEl.innerHTML = '';
      if(state.query){
        tagsEl.appendChild(makeTag('Search: "'+state.query+'"', function(){
          document.getElementById('sfInput').value = '';
          state.query = '';
          updateClearBtn();
          applyFilters();
        }));
      }
      if(state.filter !== 'all'){
        var label = (document.querySelector('.sf-pill[data-filter="'+state.filter+'"]')||{}).textContent || state.filter;
        tagsEl.appendChild(makeTag(label, function(){
          state.filter = 'all';
          document.querySelectorAll('.sf-pill').forEach(function(p){ p.classList.remove('active'); });
          document.querySelector('.sf-pill[data-filter="all"]').classList.add('active');
          applyFilters();
        }));
      }
    }
  }

  function makeTag(text, onRemove){
    var tag = document.createElement('span');
    tag.className = 'sf-tag';
    tag.innerHTML = text + '<span class="sf-tag-remove" title="Remove">✕</span>';
    tag.querySelector('.sf-tag-remove').addEventListener('click', onRemove);
    return tag;
  }

  /* ── Clear button visibility ── */
  function updateClearBtn(){
    var btn = document.getElementById('sfClear');
    if(!btn) return;
    if(state.query){ btn.classList.add('visible'); }
    else            { btn.classList.remove('visible'); }
  }

  /* ── Global reset ── */
  window.sfReset = function(){
    state.query  = 'all';
    state.filter = 'all';
    state.sort   = 'default';
    var inp = document.getElementById('sfInput');
    if(inp) inp.value = '';
    var sort = document.getElementById('sfSort');
    if(sort) sort.value = 'default';
    document.querySelectorAll('.sf-pill').forEach(function(p){ p.classList.remove('active'); });
    var allPill = document.querySelector('.sf-pill[data-filter="all"]');
    if(allPill) allPill.classList.add('active');
    state.query = '';
    updateClearBtn();
    applyFilters();
  };

  /* ── Wire up events after DOM ready ── */
  document.addEventListener('DOMContentLoaded', function(){

    // Search input — debounced
    var inp = document.getElementById('sfInput');
    var debTimer;
    if(inp){
      inp.addEventListener('input', function(){
        clearTimeout(debTimer);
        debTimer = setTimeout(function(){
          state.query = inp.value;
          updateClearBtn();
          applyFilters();
        }, 180);
      });
      // Keyboard shortcut: Ctrl/Cmd + K focuses search
      document.addEventListener('keydown', function(e){
        if((e.ctrlKey || e.metaKey) && e.key === 'k'){
          e.preventDefault();
          inp.focus();
          inp.select();
          // Scroll to collection
          var col = document.getElementById('collection');
          if(col) col.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Escape clears search
        if(e.key === 'Escape' && document.activeElement === inp){
          inp.value = '';
          state.query = '';
          updateClearBtn();
          applyFilters();
          inp.blur();
        }
      });
    }

    // Clear button
    var clearBtn = document.getElementById('sfClear');
    if(clearBtn){
      clearBtn.addEventListener('click', function(){
        if(inp) inp.value = '';
        state.query = '';
        updateClearBtn();
        applyFilters();
        if(inp) inp.focus();
      });
    }

    // Filter pills
    document.querySelectorAll('.sf-pill').forEach(function(pill){
      pill.addEventListener('click', function(){
        document.querySelectorAll('.sf-pill').forEach(function(p){ p.classList.remove('active'); });
        pill.classList.add('active');
        state.filter = pill.getAttribute('data-filter');
        applyFilters();
      });
    });

    // Sort
    var sortEl = document.getElementById('sfSort');
    if(sortEl){
      sortEl.addEventListener('change', function(){
        state.sort = sortEl.value;
        applyFilters();
      });
    }

    // Initial count render
    applyFilters();
  });

})();


/* ============================================================
   GLOBAL SEARCH OVERLAY
   ============================================================ */
(function(){

  var overlay, input, resultsEl, backdrop, closeBtn;
  var allCards = [];
  var focusedIndex = -1;

  /* ── Open overlay ── */
  function openSearch(){
    if(!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function(){ if(input) input.focus(); }, 100);
    renderResults('');
  }

  /* ── Close overlay ── */
  function closeSearch(){
    if(!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = 'auto';
    if(input) input.value = '';
    focusedIndex = -1;
  }

  /* ── Highlight matched text ── */
  function highlightMatch(text, query){
    if(!query) return text;
    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    var re = new RegExp('('+escaped+')', 'gi');
    return text.replace(re, '<mark class="gsearch-hl">$1</mark>');
  }

  /* ── Render results ── */
  function renderResults(query){
    if(!resultsEl) return;
    var q = query.trim().toLowerCase();

    // Get all watch cards
    if(allCards.length === 0){
      allCards = Array.from(document.querySelectorAll('#collectionGrid .watch-card')).map(function(card){
        return {
          name:   card.getAttribute('data-name') || '',
          price:  card.getAttribute('data-price') || '',
          desc:   card.getAttribute('data-desc') || '',
          series: (card.querySelector('.card-collection')||{}).textContent || '',
          img:    (card.querySelector('.watch-img')||{}).src || '',
          card:   card
        };
      });
    }

    // Empty state
    if(!q){
      resultsEl.innerHTML = '<div class="gsearch-state"><div class="gsearch-state-icon">⌨️</div><div class="gsearch-state-title">Start typing to search</div><div class="gsearch-state-sub">Try "gold", "sport", "limited", or any watch name</div></div>';
      focusedIndex = -1;
      return;
    }

    // Filter
    var matches = allCards.filter(function(w){
      return w.name.toLowerCase().includes(q) ||
             w.desc.toLowerCase().includes(q) ||
             w.series.toLowerCase().includes(q) ||
             w.price.toLowerCase().includes(q);
    });

    // No results
    if(matches.length === 0){
      resultsEl.innerHTML = '<div class="gsearch-state"><div class="gsearch-state-icon">🔍</div><div class="gsearch-state-title">No watches found</div><div class="gsearch-state-sub">Try a different search term</div></div>';
      focusedIndex = -1;
      return;
    }

    // Render items
    var html = '';
    matches.forEach(function(w, i){
      html += '<div class="gsearch-item" data-idx="'+i+'">';
      html += '<img src="'+w.img+'" class="gsearch-thumb" alt="'+w.name+'" />';
      html += '<div class="gsearch-item-info">';
      html += '<div class="gsearch-item-series">'+highlightMatch(w.series, q)+'</div>';
      html += '<div class="gsearch-item-name">'+highlightMatch(w.name, q)+'</div>';
      html += '<div class="gsearch-item-desc">'+highlightMatch(w.desc.substring(0,60), q)+'…</div>';
      html += '</div>';
      html += '<div class="gsearch-item-right">';
      html += '<div class="gsearch-item-price">'+w.price+'</div>';
      html += '<div class="gsearch-item-action">Quick View</div>';
      html += '</div>';
      html += '</div>';
    });
    resultsEl.innerHTML = html;
    focusedIndex = -1;

    // Wire up clicks
    resultsEl.querySelectorAll('.gsearch-item').forEach(function(item, idx){
      item.addEventListener('click', function(){
        var w = matches[idx];
        closeSearch();
        // Open modal
        openModal(w.name, w.price, w.desc);
      });
      item.addEventListener('mouseenter', function(){
        focusedIndex = idx;
        updateFocus();
      });
    });
  }

  /* ── Update focused item ── */
  function updateFocus(){
    if(!resultsEl) return;
    var items = resultsEl.querySelectorAll('.gsearch-item');
    items.forEach(function(item, i){
      if(i === focusedIndex){
        item.classList.add('focused');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('focused');
      }
    });
  }

  /* ── Keyboard navigation ── */
  function handleKeyNav(e){
    if(!overlay || !overlay.classList.contains('open')) return;
    var items = resultsEl ? resultsEl.querySelectorAll('.gsearch-item') : [];
    var count = items.length;

    // Arrow down
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      if(count > 0){
        focusedIndex = (focusedIndex + 1) % count;
        updateFocus();
      }
    }
    // Arrow up
    else if(e.key === 'ArrowUp'){
      e.preventDefault();
      if(count > 0){
        focusedIndex = (focusedIndex - 1 + count) % count;
        updateFocus();
      }
    }
    // Enter — trigger focused item
    else if(e.key === 'Enter'){
      if(focusedIndex >= 0 && items[focusedIndex]){
        items[focusedIndex].click();
      }
    }
    // Escape — close
    else if(e.key === 'Escape'){
      closeSearch();
    }
  }

  /* ── Init after DOM ready ── */
  document.addEventListener('DOMContentLoaded', function(){
    overlay    = document.getElementById('gsearchOverlay');
    input      = document.getElementById('gsearchInput');
    resultsEl  = document.getElementById('gsearchResults');
    backdrop   = document.getElementById('gsearchBackdrop');
    closeBtn   = document.getElementById('gsearchClose');

    if(!overlay) return;

    // Open button in navbar
    var navBtn = document.getElementById('navSearchBtn');
    if(navBtn){
      navBtn.addEventListener('click', openSearch);
    }

    // Close button
    if(closeBtn){
      closeBtn.addEventListener('click', closeSearch);
    }

    // Backdrop click
    if(backdrop){
      backdrop.addEventListener('click', closeSearch);
    }

    // Input — debounced search
    var debTimer;
    if(input){
      input.addEventListener('input', function(){
        clearTimeout(debTimer);
        debTimer = setTimeout(function(){
          renderResults(input.value);
        }, 150);
      });
    }

    // Quick filter chips
    document.querySelectorAll('.gsearch-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        var q = chip.getAttribute('data-q');
        if(input) input.value = q;
        renderResults(q);
        // Toggle active
        document.querySelectorAll('.gsearch-chip').forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e){
      // Ctrl/Cmd + K — open search
      if((e.ctrlKey || e.metaKey) && e.key === 'k'){
        e.preventDefault();
        if(!overlay.classList.contains('open')){
          openSearch();
        } else {
          closeSearch();
        }
      }
      // Navigation inside overlay
      handleKeyNav(e);
    });

  });

})();


/* ============================================================
   LAZY LOADING — Images
   ============================================================ */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    // Add loading="lazy" to all watch card images
    document.querySelectorAll('.watch-img, .cat-watch, .related-img').forEach(function(img){
      if(!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
    });

    // Native IntersectionObserver lazy load for browsers that need it
    if('IntersectionObserver' in window){
      var lazyImgs = document.querySelectorAll('img[loading="lazy"]');
      var observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            var img = entry.target;
            if(img.dataset.src){ img.src = img.dataset.src; delete img.dataset.src; }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });
      lazyImgs.forEach(function(img){ observer.observe(img); });
    }
  });
})();

/* ============================================================
   WISHLIST — Heart buttons on collection cards
   ============================================================ */
(function(){
  var wishlist = JSON.parse(localStorage.getItem('solowaveWishlist') || '[]');
  function saveWL(){ localStorage.setItem('solowaveWishlist', JSON.stringify(wishlist)); }

  function addWishlistBtns(){
    document.querySelectorAll('.watch-card').forEach(function(card){
      if(card.querySelector('.wl-btn')) return; // already added
      var name = card.getAttribute('data-name') || '';
      var btn  = document.createElement('button');
      btn.className = 'wl-btn';
      btn.title = 'Add to Wishlist';
      btn.setAttribute('aria-label', 'Wishlist');
      var inList = wishlist.indexOf(name) !== -1;
      btn.innerHTML = inList
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="#e05555"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
      if(inList) btn.classList.add('wl-active');

      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var idx = wishlist.indexOf(name);
        if(idx === -1){
          wishlist.push(name);
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#e05555"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
          btn.classList.add('wl-active');
          showToast(name + ' added to wishlist ♥');
        } else {
          wishlist.splice(idx, 1);
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
          btn.classList.remove('wl-active');
          showToast('Removed from wishlist');
        }
        saveWL();
        // Animate
        btn.style.transform = 'scale(1.4)';
        setTimeout(function(){ btn.style.transform = ''; }, 200);
      });

      card.appendChild(btn);
    });
  }

  document.addEventListener('DOMContentLoaded', addWishlistBtns);
})();


/* ============================================================
   NAV USER BUTTONS — wishlist count + user name
   ============================================================ */
(function(){
  document.addEventListener('DOMContentLoaded', function(){

    // Wishlist count badge
    function updateNavWlCount(){
      var wl  = JSON.parse(localStorage.getItem('solowaveWishlist') || '[]');
      var el  = document.getElementById('navWlCount');
      if(!el) return;
      if(wl.length > 0){
        el.textContent = wl.length > 9 ? '9+' : wl.length;
        el.classList.add('visible');
      } else {
        el.classList.remove('visible');
      }
    }
    updateNavWlCount();

    // Update on storage change (other tabs)
    window.addEventListener('storage', function(e){
      if(e.key === 'solowaveWishlist') updateNavWlCount();
    });

    // Show user name if logged in
    var user = JSON.parse(localStorage.getItem('solowaveCurrentUser') || 'null');
    var loginBtn = document.getElementById('navLoginBtn');
    if(user && user.firstName && loginBtn){
      loginBtn.title = 'Hi, ' + user.firstName + ' — Account';
      loginBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.8" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    }
  });
})();

/* ============================================================
   STOCK SYSTEM — reads solowaveStock, marks cards
   ============================================================ */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var stockData = JSON.parse(localStorage.getItem('solowaveStock') || '{}');

    document.querySelectorAll('.watch-card').forEach(function(card){
      var name   = card.getAttribute('data-name') || '';
      var status = stockData[name] || 'In Stock';

      // Remove old badges
      card.querySelectorAll('.stock-badge').forEach(function(b){ b.remove(); });
      card.classList.remove('out-of-stock');

      if(status === 'Out of Stock'){
        card.classList.add('out-of-stock');
        var badge = document.createElement('div');
        badge.className = 'stock-badge stock-badge-out';
        badge.textContent = 'Out of Stock';
        var visual = card.querySelector('.card-watch-visual');
        if(visual) visual.appendChild(badge);
      } else if(status === 'Limited'){
        var badge = document.createElement('div');
        badge.className = 'stock-badge stock-badge-limited';
        badge.textContent = 'Limited Stock';
        var visual = card.querySelector('.card-watch-visual');
        if(visual) visual.appendChild(badge);
      }
    });

    // Re-apply when admin changes stock
    window.addEventListener('storage', function(e){
      if(e.key === 'solowaveStock'){
        stockData = JSON.parse(e.newValue || '{}');
        document.querySelectorAll('.watch-card').forEach(function(card){
          var name   = card.getAttribute('data-name') || '';
          var status = stockData[name] || 'In Stock';
          card.querySelectorAll('.stock-badge').forEach(function(b){ b.remove(); });
          card.classList.remove('out-of-stock');
          if(status === 'Out of Stock'){
            card.classList.add('out-of-stock');
            var badge = document.createElement('div');
            badge.className = 'stock-badge stock-badge-out';
            badge.textContent = 'Out of Stock';
            var visual = card.querySelector('.card-watch-visual');
            if(visual) visual.appendChild(badge);
          } else if(status === 'Limited'){
            var badge = document.createElement('div');
            badge.className = 'stock-badge stock-badge-limited';
            badge.textContent = 'Limited Stock';
            var visual = card.querySelector('.card-watch-visual');
            if(visual) visual.appendChild(badge);
          }
        });
      }
    });
  });
})();


/* ── Affiliate bar — hide if already closed ── */
(function(){
  if(localStorage.getItem('affBarClosed') === '1'){
    var bar = document.getElementById('affiliateBar');
    if(bar) bar.style.display = 'none';
  }
})();
