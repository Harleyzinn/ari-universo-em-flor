(function () {
  'use strict';
  var c = window.PRESENTE;
  var $ = function (id) { return document.getElementById(id); };
  var ns = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var positions = [[150,296],[108,263],[72,219],[47,167],[55,111],[99,79],[151,101],[209,101],[261,79],[305,111],[313,167],[288,219],[252,263],[210,296]];
  var flowers = [], elapsed = 0, last = null, frame = null, started = false;
  var paused = false, inspecting = false, modalOpen = false, suspended = false;
  var completed = false, current = -1, shown = -1, returnFocus = null;
  var opened = {}, extraShown = false;
  function svg(tag, attrs, parent) {
    var el = document.createElementNS(ns, tag);
    Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    if (parent) parent.appendChild(el);
    return el;
  }
  function para(text, parent, cls) {
    var el = document.createElement('p'); el.textContent = text;
    if (cls) el.className = cls;
    parent.appendChild(el); return el;
  }
  Object.keys(c.paleta).forEach(function (key) { document.documentElement.style.setProperty('--' + key, c.paleta[key]); });
  $('name').textContent = c.apelido;
  $('dedication').querySelector('text').textContent = c.apelido;
  $('opening-text').textContent = c.abertura;
  $('signature').textContent = c.assinatura;
  $('final-text').textContent = c.final;
  document.title = c.apelido + ', meu universo em flor';
  var skyCount = window.innerWidth <= 414 ? 18 : 27;
  for (var s = 0; s < skyCount; s++) {
    var sx = 18 + ((s * 83) % 325), sy = 24 + ((s * 113) % 318);
    svg('circle', { cx:sx, cy:sy, r:s % 5 === 0 ? 1.35 : .65, fill:c.paleta.ouro, opacity:s % 3 === 0 ? .65 : .25 }, $('sky'));
  }
  function bloom(parent, x, y, index, small) {
    var group = svg('g', {transform:'translate(' + x + ' ' + y + ') scale(' + (small ? .65 : 1) + ')'}, parent);
    var color = [c.paleta.rosa,c.paleta.lavanda,c.paleta.pessego][index % 3];
    var petals = index % 3 === 1 ? 8 : 5;
    for (var p = 0; p < petals; p++) {
      svg('path', {d: index % 3 === 2 ? 'M0 2 C-15 -4 -16 -20 -6 -18 C-1 -24 7 -20 8 -15 C17 -12 11 0 0 2Z' : 'M0 2 C-11 -1 -13 -14 -6 -18 C1 -23 10 -16 8 -9 C7 -3 3 0 0 2Z', fill:color,'fill-opacity':.72,stroke:color,'stroke-width':.6,transform:'rotate(' + (360 * p / petals + index * 19) + ')'}, group);
      svg('path', {d:'M0 0 Q-3 -8 -4 -13',fill:'none',stroke:'#fff4e6','stroke-opacity':.35,'stroke-width':.45,transform:'rotate(' + (360 * p / petals + index * 19) + ')'}, group);
    }
    svg('circle',{r:3.7,fill:c.paleta.ouro},group);
    for(var d=0;d<5;d++)svg('circle',{cx:Math.cos(d*1.256)*2,cy:Math.sin(d*1.256)*2,r:.55,fill:'#514539'},group);
    return group;
  }
  positions.forEach(function (pos, i) {
    var x = pos[0], y = pos[1], prev = i === 0 ? [180,326] : positions[i-1];
    var group = svg('g',{},$('botanical'));
    var connection = svg('path',{d:'M'+prev[0]+' '+prev[1]+' Q'+((prev[0]+x)/2)+' '+(y+18)+' '+x+' '+y,class:'constellation'},group);
    var bx = x + (x < 180 ? 24 : -24), by = y + 43;
    var stem = svg('path',{d:'M'+bx+' '+by+' C'+(x+18)+' '+(y+27)+' '+(x-8)+' '+(y+21)+' '+x+' '+y,class:'stem'},group);
    var leaf = svg('path',{d:'M'+(x+7)+' '+(y+26)+' q-29 -2 -26 -20 q19 1 26 20 M'+(x+10)+' '+(y+31)+' q23 -10 20 -23 q-18 5 -20 23',class:'leaf unrevealed'},group);
    var flower = bloom(group,x,y,i,false); flower.classList.add('bloom');
    var star = svg('path',{d:'M'+(x-22)+' '+(y-21)+'v8 m-4 -4h8',stroke:c.paleta.ouro,'stroke-width':.65,class:'unrevealed'},group);
    var paths = [connection,stem];
    paths.forEach(function(path){var length=path.getTotalLength();path.dataset.length=length;path.style.strokeDasharray=length;path.style.strokeDashoffset=length;});
    var button = document.createElement('button');
    button.className='flower-touch'; button.style.left=(x/360*100)+'%';button.style.top=(y/370*100)+'%';
    button.setAttribute('aria-label','Flor '+(i+1)+': '+c.recados[i]);button.setAttribute('tabindex','-1');
    button.addEventListener('click',function(){openNote(i);});$('flower-buttons').appendChild(button);
    flowers.push({paths:paths,flower:flower,leaf:leaf,star:star,button:button,visible:false});
  });
  svg('path',{d:'M178 345Q193 324 180 313',class:'stem'},$('extra-flower'));
  bloom($('extra-flower'),180,313,1,true);
  function setFlower(i, progress) {
    var f=flowers[i];
    if(f.progress===progress)return;
    f.progress=progress;
    f.paths.forEach(function(path){path.style.strokeDashoffset=Number(path.dataset.length)*(1-progress);});
    var visible=progress>.65;
    if(f.visible!==visible){
      f.visible=visible;f.flower.classList.toggle('visible',visible);f.leaf.classList.toggle('revealed',visible);f.star.classList.toggle('revealed',visible);
      f.button.classList.toggle('available',visible);f.button.setAttribute('tabindex',visible?'0':'-1');
    }
  }
  function note(i, user) {
    current=i;$('note-label').textContent='UMA FLOR, UM CARINHO · '+(i+1)+' / '+c.recados.length;
    $('note-text').textContent=c.recados[i];
    if(user){opened[i]=true;flowers[i].button.classList.add('opened');flowers[i].button.setAttribute('aria-label','Flor '+(i+1)+', já lida: '+c.recados[i]);}
  }
  function openNote(i) {
    if(!started){start();}
    inspecting=true;note(i,true);$('close-note').hidden=false;sync();
    // A deliberate touch opens the card; automatic narrative never moves focus.
    $('note-card').setAttribute('tabindex','-1');$('note-card').focus();
    $('note-card').scrollIntoView({block:'nearest',behavior:'auto'});
  }
  function render() {
    var normalized=elapsed/c.duracao, time=normalized*75000;
    var stage=Math.min(13,Math.floor((time-3000)/5000));
    for(var i=0;i<flowers.length;i++)setFlower(i,Math.max(0,Math.min(1,(time-3000-i*5000)/1600)));
    if(stage>=0&&stage!==shown){shown=stage;if(!inspecting)note(stage,false);}
    $('count').textContent=flowers.filter(function(f){return f.visible;}).length+' / '+c.recados.length;
    $('progress-fill').style.transform='scaleX('+Math.min(1,normalized)+')';
    $('progress-fill').parentNode.setAttribute('aria-valuenow',String(Math.round(normalized*100)));
    if(stage>=0&&time<73000){
      var f=flowers[stage], fraction=Math.max(0,Math.min(1,(time-3000-stage*5000)/1600));
      var path=f.paths[fraction<.5?0:1];var point=path.getPointAtLength(Number(path.dataset.length)*(fraction<.5?fraction*2:(fraction-.5)*2));
      ['light','light-halo'].forEach(function(id){$(id).setAttribute('cx',point.x);$(id).setAttribute('cy',point.y);});
    }
    $('dedication').classList.toggle('revealed',time>=71000);
    $('light').style.opacity=time>=74000?'0':'1';$('light-halo').style.opacity=time>=74000?'0':'1';
    if(normalized>=1){completed=true;$('ending').hidden=false;$('chapter').textContent='Um jardim inteiro pra você';}
    else $('chapter').textContent=stage<0?'O primeiro pontinho de luz':stage<5?'O céu aprende a florescer':stage<10?'Cada detalhe, um carinho':'Meu universo tem seu nome';
  }
  function isRunning(){return started&&!paused&&!inspecting&&!modalOpen&&!document.hidden&&!suspended&&!completed;}
  function tick(now){frame=null;if(!isRunning()){last=null;return;}if(last!==null)elapsed=Math.min(c.duracao,elapsed+Math.min(now-last,250));last=now;render();if(isRunning())frame=requestAnimationFrame(tick);else sync();}
  function sync(){
    if(frame!==null){cancelAnimationFrame(frame);frame=null;}last=null;
    $('pause').textContent=completed?'Jardim completo':paused?'Continuar':inspecting?'Continuar':'Pausar';$('pause').disabled=completed;
    if(isRunning())frame=requestAnimationFrame(tick);
  }
  function start(){started=true;$('opening').hidden=true;$('story').hidden=false;if(reduced.matches){elapsed=c.duracao;render();}sync();}
  $('start').addEventListener('click',start);
  $('pause').addEventListener('click',function(){if(inspecting){inspecting=false;$('close-note').hidden=true;paused=false;if(shown>=0)note(shown,false);}else paused=!paused;sync();});
  $('close-note').addEventListener('click',function(){inspecting=false;$('close-note').hidden=true;if(shown>=0)note(shown,false);sync();});
  $('previous').addEventListener('click',function(){openNote((current-1+c.recados.length)%c.recados.length);});
  $('next').addEventListener('click',function(){openNote((current+1)%c.recados.length);});
  $('reveal').addEventListener('click',function(){inspecting=false;$('close-note').hidden=true;elapsed=c.duracao;render();sync();});
  $('restart').addEventListener('click',function(){
    elapsed=0;started=false;paused=false;inspecting=false;completed=false;current=-1;shown=-1;opened={};extraShown=false;
    flowers.forEach(function(f,i){f.button.classList.remove('opened');f.button.setAttribute('aria-label','Flor '+(i+1)+': '+c.recados[i]);});
    $('extra-flower').classList.remove('revealed');$('extra').textContent='Um carinho extra';$('ending').hidden=true;$('close-note').hidden=true;
    $('note-label').textContent='TUDO COMEÇA COM CARINHO';$('note-text').textContent='Às vezes, um sentimento é tão grande que vira um universo inteiro.';
    $('opening').hidden=false;$('story').hidden=true;render();sync();$('start').focus();
  });
  function showModal(title,fill){
    returnFocus=document.activeElement;modalOpen=true;sync();$('modal-title').textContent=title;$('modal-content').textContent='';fill($('modal-content'));
    $('modal').hidden=false;$('main').setAttribute('aria-hidden','true');document.body.style.overflow='hidden';$('modal-content').scrollTop=0;$('modal-close').focus();
  }
  function closeModal(){modalOpen=false;$('modal').hidden=true;$('main').removeAttribute('aria-hidden');document.body.style.overflow='';if(returnFocus)returnFocus.focus();sync();}
  $('modal-close').addEventListener('click',closeModal);
  $('modal').addEventListener('click',function(e){if(e.target===$('modal'))closeModal();});
  document.addEventListener('keydown',function(e){if(!modalOpen)return;if(e.key==='Escape'){e.preventDefault();closeModal();}if(e.key==='Tab'){
    var controls=$('modal').querySelectorAll('button,[tabindex="0"],a[href]');var first=controls[0],end=controls[controls.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}
  }});
  $('all').addEventListener('click',function(){showModal('Um jardim de recados',function(container){var list=document.createElement('ol');c.recados.forEach(function(text){var item=document.createElement('li');item.textContent=text;list.appendChild(item);});container.appendChild(list);para(c.secreto,container);para(c.extra,container);});});
  $('letter').addEventListener('click',function(){showModal('Uma carta pra você',function(container){c.carta.forEach(function(text,i){para(text,container,i===c.carta.length-1?'letter-signature':'');});});});
  $('secret').addEventListener('click',function(){showModal('Só entre a gente',function(container){para(c.secreto,container);});});
  $('extra').addEventListener('click',function(){if(!extraShown){extraShown=true;$('extra-flower').classList.add('revealed');$('extra').textContent='Seu carinho extra';}showModal('Sempre cabe mais carinho',function(container){para(c.extra,container);});});
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',function(){suspended=true;sync();});
  window.addEventListener('pageshow',function(){suspended=false;sync();});
  var motionChange=function(){if(reduced.matches&&started){elapsed=c.duracao;render();sync();}};
  if(reduced.addEventListener)reduced.addEventListener('change',motionChange);else if(reduced.addListener)reduced.addListener(motionChange);
  render();
}());
