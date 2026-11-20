/* puretk.com.sa — menu, reveal, portfolio, contact form */
(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var y=$("#yr");if(y)y.textContent=new Date().getFullYear();

  /* mobile menu */
  var mb=$(".menu-btn"),nav=$("#nav");
  if(mb&&nav)mb.addEventListener("click",function(){var o=nav.classList.toggle("open");mb.setAttribute("aria-expanded",o)});

  /* reveal on scroll */
  var rv=$$(".reveal");
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});
    rv.forEach(function(el){io.observe(el)});
  }else rv.forEach(function(el){el.classList.add("in")});

  function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}

  /* portfolio */
  var grid=$("#work-grid");
  if(grid&&window.WORK){
    var ytId=function(u){var m=String(u).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);return m?m[1]:String(u)};
    var vmId=function(u){var m=String(u).match(/(\d{6,})/);return m?m[1]:u};
    var media=function(w){
      if(w.type==="youtube"){var id=ytId(w.url);return '<img src="https://i.ytimg.com/vi/'+esc(id)+'/hqdefault.jpg" alt="" loading="lazy"><button class="play" data-yt="'+esc(id)+'" aria-label="شغّل '+esc(w.title)+'"><i></i></button>'}
      if(w.type==="vimeo")return '<iframe src="https://player.vimeo.com/video/'+esc(vmId(w.url))+'" loading="lazy" allow="fullscreen; picture-in-picture" title="'+esc(w.title)+'"></iframe>';
      if(w.type==="image")return '<img src="'+esc(w.url)+'" alt="'+esc(w.title)+'" loading="lazy">';
      if(w.type==="video")return '<video src="'+esc(w.url)+'" controls preload="metadata"'+(w.poster?' poster="'+esc(w.poster)+'"':'')+'></video>';
      return '<div class="ph"><b>قالب جاهز</b>يُضاف العمل هنا</div>';
    };
    var draw=function(f){
      grid.innerHTML=window.WORK.filter(function(w){return f==="all"||w.cat===f}).map(function(w){
        return '<article class="work'+(w.type?'':' template')+'"><div class="media">'+media(w)+'</div><div class="body"><span class="cat">'+esc((window.WORK_CATS||{})[w.cat]||"")+(w.client?' · '+esc(w.client):'')+'</span><h3>'+esc(w.title)+'</h3><p>'+esc(w.desc)+'</p></div></article>';
      }).join("")||'<p style="color:var(--dim)">لا أعمال في هذا التصنيف بعد.</p>';
    };
    draw("all");
    $$(".filters button").forEach(function(b){b.addEventListener("click",function(){$$(".filters button").forEach(function(x){x.setAttribute("aria-pressed",x===b)});draw(b.dataset.f)})});
    grid.addEventListener("click",function(e){var p=e.target.closest(".play");if(!p)return;p.parentNode.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+p.dataset.yt+'?autoplay=1&rel=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="فيديو"></iframe>'});
  }

  /* contact form */
  var form=$("#contact-form");
  if(form&&window.SVC){
    var chips=$("#chips"),cur="media",qs=new URLSearchParams(location.search);
    var setTab=function(p,pre){
      cur=window.SVC[p]?p:"media";
      $$(".tabs button").forEach(function(b){b.setAttribute("aria-selected",b.dataset.p===cur)});
      chips.innerHTML=window.SVC[cur].map(function(s){return '<label><input type="checkbox" value="'+esc(s[1])+'" data-id="'+esc(s[0])+'"'+(s[0]===pre?' checked':'')+'><span>'+esc(s[1])+'</span></label>'}).join("");
    };
    setTab(qs.get("p")||"media",qs.get("s"));
    $$(".tabs button").forEach(function(b){b.addEventListener("click",function(){setTab(b.dataset.p)})});
    var st=$("#status"),btn=$("#send");
    form.addEventListener("submit",function(e){
      e.preventDefault();
      st.className="status";
      var bad=$$("[required]",form).filter(function(i){return !i.value.trim()});
      var mail=$("#f-email").value.trim();
      if(bad.length){st.textContent="فضلاً أكمل الحقول المطلوبة (*).";st.className="status err";bad[0].focus();return}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)){st.textContent="تحقق من البريد الإلكتروني.";st.className="status err";$("#f-email").focus();return}
      var picked=$$("input[type=checkbox]:checked",chips).map(function(c){return c.value});
      var data={};new FormData(form).forEach(function(v,k){data[k]=v});
      data["الغرض"]=window.TABS[cur];
      data["الخدمات"]=picked.join("، ")||"لم يحدد";
      data.subject="طلب جديد من puretk.com.sa — "+window.TABS[cur]+(picked.length?" — "+picked[0]:"");
      data.from_name="موقع خدمات بيور تيكنولوجيز";
      data.replyto=mail;
      btn.disabled=true;btn.textContent="جارٍ الإرسال…";
      fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(data)})
      .then(function(r){return r.json()}).then(function(j){
        if(j.success){form.reset();setTab(cur);st.textContent="وصلنا طلبك، شكراً لك. نرد عليك خلال يومي عمل على البريد أو الجوال.";st.className="status ok"}
        else throw new Error(j.message||"fail");
      }).catch(function(){st.innerHTML='تعذّر الإرسال الآن. راسلنا مباشرة على <a href="mailto:info@puretk.sa">info@puretk.sa</a>.';st.className="status err"})
      .then(function(){btn.disabled=false;btn.textContent="أرسل الطلب"});
    });
  }
})();
