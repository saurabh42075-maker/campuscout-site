// Website assistant: floating chat button and panel. Talks to /api/chat.
(function(){
  var ENDPOINT = "/api/chat";
  var KEY = "cc-chat";
  var WHATSAPP = "+1 229 402 0371";
  var STARTERS = ["Is this really free?", "What is CUET and who needs it?", "Can I study in Germany after Class 12?"];

  var history = [];
  try { history = JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch (e) {}
  if (!Array.isArray(history)) history = [];
  function save(){ try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-20))); } catch (e) {} }

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  var launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "chat-launch";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "chat-panel");
  launcher.innerHTML = ICON_CHAT + "<span>Ask a question</span>";

  var panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.id = "chat-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Campuscout assistant");
  panel.innerHTML =
    '<header class="chat-head"><div><b>Ask Campuscout</b><span class="chat-badge">AI assistant</span></div>' +
    '<button type="button" class="chat-close" aria-label="Close chat">' + ICON_X + '</button></header>' +
    '<div class="chat-log" aria-live="polite"></div>' +
    '<form class="chat-form"><label class="sr-only" for="chat-input">Your question</label>' +
    '<textarea id="chat-input" rows="1" maxlength="1000" placeholder="Type your question"></textarea>' +
    '<button type="submit" class="chat-send" aria-label="Send">' + ICON_SEND + '</button></form>' +
    '<p class="chat-note">AI answers can be wrong. For decisions about your child, talk to a counsellor on WhatsApp ' + WHATSAPP + '.</p>';

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  var log = panel.querySelector(".chat-log");
  var form = panel.querySelector(".chat-form");
  var input = panel.querySelector("#chat-input");
  var sendBtn = panel.querySelector(".chat-send");
  var busy = false;

  // Render text safely, turning site paths like /india.html into links.
  function render(el, text){
    el.textContent = "";
    var re = /(\/[a-z0-9-]+\.html(?:#[a-z0-9-]+)?)/gi, last = 0, m;
    while ((m = re.exec(text))) {
      el.appendChild(document.createTextNode(text.slice(last, m.index)));
      var a = document.createElement("a"); a.href = m[1].slice(1); a.textContent = m[1];
      el.appendChild(a); last = m.index + m[1].length;
    }
    el.appendChild(document.createTextNode(text.slice(last)));
  }
  function bubble(role, text){
    var b = document.createElement("div");
    b.className = "chat-msg " + (role === "user" ? "from-user" : "from-bot");
    render(b, text);
    log.appendChild(b); log.scrollTop = log.scrollHeight;
    return b;
  }
  function showStarters(){
    var wrap = document.createElement("div");
    wrap.className = "chat-starters";
    STARTERS.forEach(function(q){
      var s = document.createElement("button"); s.type = "button"; s.textContent = q;
      s.addEventListener("click", function(){ wrap.remove(); ask(q); });
      wrap.appendChild(s);
    });
    log.appendChild(wrap);
  }
  function greet(){
    bubble("assistant", "Hello. I'm Campuscout's AI assistant. Ask me about courses, entrance exams, colleges in India or studying abroad, in English or Hindi.");
    if (!history.length) showStarters();
    history.forEach(function(m){ bubble(m.role, m.content); });
  }

  function setOpen(open){
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("chat-open", open);
    if (open) {
      if (!log.childElementCount) greet();
      setTimeout(function(){ input.focus(); }, 30);
    } else {
      launcher.focus();
    }
  }
  launcher.addEventListener("click", function(){ setOpen(panel.hidden); });
  panel.querySelector(".chat-close").addEventListener("click", function(){ setOpen(false); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && !panel.hidden) setOpen(false); });

  input.addEventListener("input", function(){
    input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });
  input.addEventListener("keydown", function(e){
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit")); }
  });
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var q = input.value.trim();
    if (q) { input.value = ""; input.style.height = "auto"; ask(q); }
  });

  function ask(q){
    if (busy) return;
    busy = true; sendBtn.disabled = true;
    var starters = log.querySelector(".chat-starters"); if (starters) starters.remove();
    bubble("user", q);
    history.push({ role: "user", content: q }); save();
    var b = bubble("assistant", ""); b.classList.add("typing");
    var text = "";

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-20) })
    }).then(function(res){
      if (res.status === 429) throw new Error("rate");
      if (!res.ok || !res.body) throw new Error("http");
      var reader = res.body.getReader(), dec = new TextDecoder();
      function pump(){
        return reader.read().then(function(r){
          if (r.done) return;
          text += dec.decode(r.value, { stream: true });
          b.classList.remove("typing"); render(b, text); log.scrollTop = log.scrollHeight;
          return pump();
        });
      }
      return pump();
    }).then(function(){
      if (!text.trim()) throw new Error("empty");
      history.push({ role: "assistant", content: text }); save();
    }).catch(function(err){
      var msg = err && err.message === "rate"
        ? "You're sending messages quickly. Please wait a minute and try again."
        : "Sorry, I couldn't answer just now. Please try again, or message a counsellor on WhatsApp: " + WHATSAPP + ".";
      b.classList.remove("typing"); render(b, msg);
      history.pop(); save(); // let the person retry the same question
    }).then(function(){
      busy = false; sendBtn.disabled = false;
    });
  }
})();
