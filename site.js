// Shared behaviour: mobile menu and the floating WhatsApp bar.
(function(){
  var btn = document.querySelector(".menu-btn"), menu = document.getElementById("menu");
  if (btn && menu) {
    function setOpen(open){
      menu.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    btn.addEventListener("click", function(){ setOpen(!menu.classList.contains("open")); });
    menu.addEventListener("click", function(e){ if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") setOpen(false); });
    document.addEventListener("click", function(e){
      if (menu.classList.contains("open") && !e.target.closest(".nav")) setOpen(false);
    });
  }

  // Hide the floating WhatsApp bar while the form or footer is on screen.
  var bar = document.querySelector(".mcta");
  var targets = [document.getElementById("start"), document.getElementById("careers"), document.querySelector("footer"), document.querySelector(".cta-box")]
    .filter(Boolean);
  if (bar && "IntersectionObserver" in window && targets.length) {
    var visible = new Set();
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
      bar.classList.toggle("hide", visible.size > 0);
    }, { threshold: 0.05 });
    targets.forEach(function(t){ io.observe(t); });
  }

})();
