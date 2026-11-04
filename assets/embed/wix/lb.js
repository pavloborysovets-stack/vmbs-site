/* VMBS.TECH embed: click an image to enlarge. Asks the Wix page (Velo) to open a viewer modal; falls back to opening the image in a new tab. */
(function(){
  var imgs=[].slice.call(document.querySelectorAll('img')).filter(function(i){return !i.closest('a')});
  if(!imgs.length)return;
  var st=document.createElement('style');st.textContent='img.vz{cursor:zoom-in}';document.head.appendChild(st);
  var acked=false;
  window.addEventListener('message',function(e){if(e.data==='vmbs-zoom-ack')acked=true});
  function src(i){return imgs[i].currentSrc||imgs[i].src}
  function open(i){
    acked=false;
    var list=imgs.map(function(im,j){return [src(j),im.alt||'']});
    try{window.parent.postMessage({type:'vmbs-zoom',list:list,index:i},'*')}catch(e){}
    setTimeout(function(){if(!acked){window.open('https://pavloborysovets-stack.github.io/vmbs-site/assets/embed/wix/viewer.html#'+encodeURIComponent(JSON.stringify({l:list,i:i})),'_blank')}},1500);
  }
  imgs.forEach(function(im,i){im.classList.add('vz');im.setAttribute('tabindex','0');im.setAttribute('role','button');im.setAttribute('aria-label','Enlarge image: '+(im.alt||''));
    im.addEventListener('click',function(){open(i)});im.addEventListener('keydown',function(e){if(e.key==='Enter')open(i)});});
})();
