/* مختبر ١١ قلم — invite gate. Content is AES-GCM encrypted; the key is unwrapped only with a valid invite code + password. */
(function(){
  var $=function(s){return document.querySelector(s)};
  var subtle=window.crypto&&window.crypto.subtle,enc=new TextEncoder();
  var ub=function(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0)})};
  var bu=function(u){var s="";u.forEach(function(b){s+=String.fromCharCode(b)});return btoa(s)};
  var hex=function(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return("0"+b.toString(16)).slice(-2)}).join("")};
  var store={get:function(k){return sessionStorage.getItem(k)||localStorage.getItem(k)},
    set:function(k,v,rem){sessionStorage.setItem(k,v);if(rem)localStorage.setItem(k,v)},
    clear:function(){["lab_k","lab_invite"].forEach(function(k){sessionStorage.removeItem(k);localStorage.removeItem(k)})}};

  function normCode(v){v=String(v).toUpperCase().replace(/[\s_]/g,"").replace(/[٠-٩]/g,function(d){return"٠١٢٣٤٥٦٧٨٩".indexOf(d)});if(!/^11Q/.test(v))v="11Q-"+v.replace(/^-/,"");return v.replace(/^11Q-?/,"11Q-")}
  function normPass(v){v=String(v).toLowerCase().replace(/\s/g,"");if(/^[a-z0-9]{8}$/.test(v))v=v.slice(0,4)+"-"+v.slice(4);return v}

  function show(){
    $("#gate").hidden=true;$("#lab").hidden=false;
    $("#who-code").textContent=store.get("lab_invite")||"";
    sessionStorage.setItem("lab_k",store.get("lab_k"));sessionStorage.setItem("lab_invite",store.get("lab_invite"));
  }
  if(store.get("lab_k"))show();

  $("#gate-form").addEventListener("submit",function(e){
    e.preventDefault();
    var st=$("#g-status"),btn=$("#g-btn");st.className="status";
    if(!subtle){st.textContent="متصفحك لا يدعم الدخول. جرّب Chrome أو Safari حديثاً.";st.className="status err";return}
    var code=normCode($("#g-code").value),pass=normPass($("#g-pass").value);
    if(code.length<8||pass.length<9){st.textContent="تحقق من رقم الدعوة وكلمة المرور.";st.className="status err";return}
    btn.disabled=true;btn.textContent="جارٍ التحقق…";
    var entry;
    fetch("/lab/invites.json",{cache:"no-store"}).then(function(r){return r.json()}).then(function(inv){
      return subtle.digest("SHA-256",enc.encode("11Q|"+code)).then(function(h){entry=inv[hex(h)];if(!entry)throw 0;
        return subtle.importKey("raw",enc.encode(code+"|"+pass),"PBKDF2",false,["deriveKey"])});
    }).then(function(base){
      return subtle.deriveKey({name:"PBKDF2",salt:ub(entry.s),iterations:200000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
    }).then(function(wk){return subtle.decrypt({name:"AES-GCM",iv:ub(entry.iv)},wk,ub(entry.ct))
    }).then(function(raw){
      var rem=$("#g-rem").checked;store.set("lab_k",bu(new Uint8Array(raw)),rem);store.set("lab_invite",code,rem);show();window.scrollTo(0,0);
    }).catch(function(){st.textContent="رقم الدعوة أو كلمة المرور غير صحيحة.";st.className="status err"})
    .then(function(){btn.disabled=false;btn.textContent="ادخل المختبر"});
  });

  $("#logout").addEventListener("click",function(){store.clear();location.reload()});

  $("#fb-form").addEventListener("submit",function(e){
    e.preventDefault();var st=$("#fb-status"),btn=$("#fb-btn"),f=e.target;st.className="status";
    if(!$("#fb-msg").value.trim()){st.textContent="اكتب ملاحظتك أولاً.";st.className="status err";return}
    var d={};new FormData(f).forEach(function(v,k){d[k]=v});
    d.access_key=window.W3F;d.from_name="مختبر ١١ قلم";d["الدعوة"]=store.get("lab_invite")||"-";
    d.subject="١١ قلم — ملاحظة تجربة — "+d["الخدمة"]+" — "+d["الدعوة"];
    if(!d.email)delete d.email;
    btn.disabled=true;btn.textContent="جارٍ الإرسال…";
    fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(d)})
    .then(function(r){return r.json()}).then(function(j){if(!j.success)throw 0;f.reset();st.textContent="وصلتنا ملاحظتك، شكراً لك.";st.className="status ok"})
    .catch(function(){st.textContent="تعذّر الإرسال. أرسلها إلى info@puretk.sa";st.className="status err"})
    .then(function(){btn.disabled=false;btn.textContent="أرسل الملاحظة"});
  });
})();
