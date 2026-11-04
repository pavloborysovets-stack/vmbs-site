/* VMBS.TECH embed lightbox: click an image to view it full screen (arrows, Esc, swipe). */
(function(){
  var imgs=[].slice.call(document.querySelectorAll('img')).filter(function(i){return !i.closest('a')});
  if(!imgs.length)return;
  var css=document.createElement('style');
  css.textContent='img.vz{cursor:zoom-in}#vlb{position:fixed;inset:0;z-index:99;background:rgba(20,28,38,.96);display:none;align-items:center;justify-content:center}#vlb.on{display:flex}#vlb img{max-width:94vw;max-height:90vh;object-fit:contain;display:block;box-shadow:0 8px 40px rgba(0,0,0,.4)}#vlb button{position:absolute;background:transparent;border:0;color:#fff;font:300 44px/1 Georgia,serif;cursor:pointer;padding:12px 18px;opacity:.85}#vlb button:hover{opacity:1;color:#d9a679}#vlb .x{top:8px;right:8px;font-size:38px}#vlb .p{left:8px;top:50%;transform:translateY(-50%)}#vlb .n{right:8px;top:50%;transform:translateY(-50%)}#vlb .c{position:absolute;bottom:14px;left:0;right:0;text-align:center;color:#fff;font:14px Georgia,serif;opacity:.8}';
  document.head.appendChild(css);
  var o=document.createElement('div');o.id='vlb';o.setAttribute('role','dialog');o.setAttribute('aria-label','Image viewer');
  o.innerHTML='<button class="x" aria-label="Close">&times;</button><button class="p" aria-label="Previous">&#8249;</button><img alt=""><button class="n" aria-label="Next">&#8250;</button><div class="c"></div>';
  document.body.appendChild(o);
  var big=o.querySelector('img'),cap=o.querySelector('.c'),k=0;
  if(imgs.length<2){o.querySelector('.p').style.display='none';o.querySelector('.n').style.display='none';}
  function show(i){k=(i+imgs.length)%imgs.length;big.src=imgs[k].currentSrc||imgs[k].src;big.alt=imgs[k].alt||'';cap.textContent=(imgs[k].alt||'')+(imgs.length>1?'  ·  '+(k+1)+' / '+imgs.length:'');}
  function fsEl(){return document.fullscreenElement||document.webkitFullscreenElement}
  function close(){o.classList.remove('on');if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document)}}
  function open(i){
    var rq=o.requestFullscreen||o.webkitRequestFullscreen;
    var ok=rq&&(document.fullscreenEnabled||document.webkitFullscreenEnabled);
    if(!ok){window.open(imgs[i].currentSrc||imgs[i].src,'_blank');return;}
    show(i);o.classList.add('on');
    try{var p=rq.call(o);if(p&&p.catch)p.catch(function(){o.classList.remove('on');window.open(imgs[i].currentSrc||imgs[i].src,'_blank');});}catch(e){o.classList.remove('on');window.open(imgs[i].src,'_blank');}
  }
  imgs.forEach(function(im,i){im.classList.add('vz');im.setAttribute('tabindex','0');im.addEventListener('click',function(){open(i)});im.addEventListener('keydown',function(e){if(e.key==='Enter')open(i)});});
  o.querySelector('.x').onclick=close;
  o.querySelector('.p').onclick=function(e){e.stopPropagation();show(k-1)};
  o.querySelector('.n').onclick=function(e){e.stopPropagation();show(k+1)};
  o.addEventListener('click',function(e){if(e.target===o)close()});
  document.addEventListener('keydown',function(e){if(!o.classList.contains('on'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(k-1);if(e.key==='ArrowRight')show(k+1);});
  ['fullscreenchange','webkitfullscreenchange'].forEach(function(ev){document.addEventListener(ev,function(){if(!fsEl())o.classList.remove('on')})});
  var x0=null;o.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
  o.addEventListener('touchend',function(e){if(x0===null)return;var d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>40)show(k+(d<0?1:-1));x0=null});
})();
