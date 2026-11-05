/* Shared behaviour: header/footer, rendering, filters, forms. No dependencies. */
(function () {
  "use strict";
  var C = window.CONFIG, P = window.PROJECTS || [], A = window.ARTICLES || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var page = document.body.getAttribute("data-page");
  var params = new URLSearchParams(location.search);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  /* Minimal, safe markdown: headings, lists, bold, italic, code, links, paragraphs */
  function inline(t) {
    return esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|[\w\-./?=#]+)\)/g, function (m, a, b) {
        var ext = /^https?:/.test(b);
        return '<a href="' + b + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + a + "</a>";
      });
  }
  function md(src) {
    var out = [], list = false, para = [];
    function flushP() { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } }
    function endList() { if (list) { out.push("</ul>"); list = false; } }
    String(src || "").split(/\r?\n/).forEach(function (line) {
      var m;
      if (!line.trim()) { flushP(); endList(); return; }
      if ((m = line.match(/^(#{1,3})\s+(.*)/))) { flushP(); endList(); var l = m[1].length + 1; out.push("<h" + l + ">" + inline(m[2]) + "</h" + l + ">"); return; }
      if ((m = line.match(/^[-*]\s+(.*)/))) { flushP(); if (!list) { out.push("<ul>"); list = true; } out.push("<li>" + inline(m[1]) + "</li>"); return; }
      endList(); para.push(line.trim());
    });
    flushP(); endList();
    return out.join("\n");
  }

  function ext(url, label, cls) { return '<a class="' + (cls || "btn btn-ghost btn-sm") + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + label + "</a>"; }
  function fmtDate(d) { if (!d) return ""; var x = new Date(d + "T00:00:00"); return isNaN(x) ? d : x.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }); }
  function readTime(t) { return Math.max(1, Math.round(String(t || "").split(/\s+/).length / 200)) + " min read"; }
  function setTitle(t) { document.title = t + " | " + C.name; }

  /* ---------- Header & footer ---------- */
  var NAV = [["index.html", "Home", "home"], ["about.html", "About Me", "about"], ["projects.html", "Projects", "projects"], ["learning.html", "Learning Journey", "learning"], ["insights.html", "Insights", "insights"], ["contact.html", "Contact", "contact"]];
  var parent = { project: "projects", article: "insights" };

  function renderHeader() {
    var el = $("#site-header"); if (!el) return;
    var cur = parent[page] || page;
    var links = NAV.map(function (n) { return '<li><a href="' + n[0] + '"' + (n[2] === cur ? ' aria-current="page"' : "") + ">" + n[1] + "</a></li>"; }).join("");
    el.innerHTML =
      '<header class="site-header"><div class="container nav">' +
      '<a class="brand" href="index.html" aria-label="' + esc(C.name) + ', home"><span class="monogram" aria-hidden="true">' + esc(C.initials) + '</span><span class="brand-name">' + esc(C.name.split(" ").slice(0, 2).join(" ")) + "<small>Cybersecurity Analyst</small></span></a>" +
      '<nav aria-label="Primary"><ul class="nav-links" id="nav-links">' + links + "</ul></nav>" +
      '<div class="nav-actions">' + (C.resumeUrl ? ext(C.resumeUrl, "Resume", "btn btn-ghost btn-sm") : "") +
            '<button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="nav-links" aria-label="Toggle menu"><span></span><span></span><span></span></button></div>' +
      "</div></header>";
    var btn = $("#menu-btn"), ul = $("#nav-links");
    btn.addEventListener("click", function () { var o = ul.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && ul.classList.contains("open")) { ul.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
  }

  function renderFooter() {
    var el = $("#site-footer"); if (!el) return;
    el.innerHTML =
      '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
      '<div><a class="brand" href="index.html"><span class="monogram" aria-hidden="true">' + esc(C.initials) + '</span><span class="brand-name">' + esc(C.name) + "<small>" + esc(C.title) + "</small></span></a>" +
      '<p style="margin-top:1rem;max-width:36ch">Security operations, with a growing focus on cloud, identity and the business side of cybersecurity.</p></div>' +
      "<div><h4>Explore</h4><ul>" + NAV.slice(1).map(function (n) { return '<li><a href="' + n[0] + '">' + n[1] + "</a></li>"; }).join("") + "</ul></div>" +
      "<div><h4>Connect</h4><ul>" +
      '<li><a href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a></li>" +
      '<li><a href="' + esc(C.linkedin) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>' +
      (C.github ? '<li><a href="' + esc(C.github) + '" target="_blank" rel="noopener noreferrer">GitHub</a></li>' : "") +
      (C.resumeUrl ? '<li><a href="' + esc(C.resumeUrl) + '" target="_blank" rel="noopener noreferrer">Resume</a></li>' : "") +
      "</ul></div></div>" +
      '<div class="copyright"><span>&copy; ' + new Date().getFullYear() + " " + esc(C.name) + ". All rights reserved.</span><span>Views are my own.</span></div></div></footer>";
  }

  /* ---------- Shared UI helpers ---------- */
  function portrait() {
    $$("[data-portrait]").forEach(function (box) {
      box.innerHTML = '<img src="' + esc(C.portrait) + '" alt="' + esc(C.portraitAlt) + '" width="800" height="1000" loading="eager" decoding="async">';
      box.firstChild.addEventListener("error", function () { this.onerror = null; this.src = "assets/img/portrait-placeholder.svg"; });
    });
  }
  function links() {
    $$("[data-link='linkedin']").forEach(function (a) { a.href = C.linkedin; a.target = "_blank"; a.rel = "noopener noreferrer"; });
    $$("[data-link='github']").forEach(function (a) { if (C.github) { a.href = C.github; a.target = "_blank"; a.rel = "noopener noreferrer"; } else { a.style.display = "none"; } });
    $$("[data-link='resume']").forEach(function (a) { if (C.resumeUrl) { a.href = C.resumeUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; } else { a.style.display = "none"; } });
  }
  function reveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  }
  function observeNew(root) { $$(".reveal", root).forEach(function (e) { e.classList.add("in"); }); }

  /* ---------- Projects ---------- */
  function projectCard(p) {
    var href = "project.html?id=" + encodeURIComponent(p.id);
    var media = p.image ? '<a href="' + href + '" tabindex="-1" aria-hidden="true"><img src="' + esc(p.image) + '" alt="" loading="lazy" width="640" height="360"></a>' : '<a href="' + href + '" tabindex="-1" aria-hidden="true"><span>' + esc(p.title) + "</span></a>";
    return '<article class="card project-card hoverable">' +
      '<div class="project-media">' + media + "</div>" +
      '<div class="project-body"><div class="meta-row"><span class="badge">' + esc(p.category) + '</span><span class="badge status">' + esc(p.status) + "</span></div>" +
      '<h3><a href="' + href + '" style="color:inherit;text-decoration:none">' + esc(p.title) + "</a></h3>" +
      (p.problem ? '<p class="problem"><strong>Problem:</strong> ' + esc(p.problem) + "</p>" : "") + (p.summary ? "<p>" + esc(p.summary) + "</p>" : "") +
      (p.tools && p.tools.length ? '<div class="meta-row">' + p.tools.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") +
      '<div class="project-actions"><a class="btn btn-primary btn-sm" href="' + href + '">View Case Study</a>' + (p.repo ? ext(p.repo, "View Source Code") : "") + "</div></div></article>";
  }

  function initProjectList(opts) {
    var list = $(opts.list), fb = $(opts.filters), sb = opts.search ? $(opts.search) : null;
    if (!list) return;
    var items = P.filter(function (p) { return opts.featured ? p.featured : true; });
    if (opts.featured) items = items.slice(0, 4);
    var cats = window.PROJECT_CATEGORIES.slice(), active = "All";
    var extra = items.map(function (p) { return p.category; }).filter(function (c) { return cats.indexOf(c) < 0; });
    cats = cats.concat(extra.filter(function (c, i) { return extra.indexOf(c) === i; }));
    if (fb) fb.innerHTML = ["All"].concat(cats).map(function (c) { return '<button type="button" class="chip" aria-pressed="' + (c === "All") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>"; }).join("");
    function draw() {
      var q = sb ? sb.value.trim().toLowerCase() : "";
      var shown = items.filter(function (p) {
        var hay = [p.title, p.summary, p.problem, p.category, p.status, (p.tools || []).join(" ")].join(" ").toLowerCase();
        return (active === "All" || p.category === active) && (!q || hay.indexOf(q) > -1);
      });
      list.innerHTML = shown.length ? shown.map(projectCard).join("") : '<div class="empty" style="grid-column:1/-1">No projects match yet. More work is being published as it is completed.</div>';
      var st = $(opts.status); if (st) st.textContent = shown.length + " project" + (shown.length === 1 ? "" : "s") + " shown";
    }
    if (fb) fb.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; active = b.getAttribute("data-cat");
      $$("button", fb).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); draw();
    });
    if (sb) sb.addEventListener("input", draw);
    draw();
  }

  var SECTIONS = [["overview", "Project overview"], ["problem", "Problem statement"], ["objectives", "Project objectives"], ["environment", "Environment and architecture"], ["threatModel", "Threat model and security considerations"], ["methodology", "Implementation methodology"], ["workflow", "Investigation / technical workflow"], ["evidence", "Screenshots and evidence"], ["findings", "Key findings"], ["controls", "Security controls implemented or recommended"], ["results", "Results and validation"], ["challenges", "Challenges and lessons learned"], ["limitations", "Limitations"], ["improvements", "What I would improve next"], ["documentation", "Project documentation"]];

  function projectDetail() {
    var root = $("#case"); if (!root) return;
    var p = P.filter(function (x) { return x.id === params.get("id"); })[0];
    if (!p) { root.innerHTML = '<div class="empty">Project not found. <a href="projects.html">Back to all projects</a></div>'; setTitle("Project not found"); return; }
    setTitle(p.title);
    var s = p.sections || {}, html = "", toc = [];
    SECTIONS.forEach(function (sec) {
      var key = sec[0], body = "";
      if (key === "problem") body = s.problem || p.problem;
      else if (key === "evidence") {
        if (p.screenshots && p.screenshots.length) body = "__shots__"; else if (s.evidence) body = s.evidence;
      } else body = s[key];
      if (!body) return;
      toc.push([key, sec[1]]);
      var inner = body === "__shots__" ? '<div class="shots">' + p.screenshots.map(function (sh, i) { return '<button type="button" class="shot" data-i="' + i + '"><img src="' + esc(sh.src) + '" alt="' + esc(sh.caption || "Screenshot") + '" loading="lazy"><span>' + esc(sh.caption || "") + "</span></button>"; }).join("") + "</div>" : '<div class="prose">' + md(body) + "</div>";
      html += '<section class="case-section" id="' + key + '"><h2>' + sec[1] + "</h2>" + inner + "</section>";
    });
    if (p.tools && p.tools.length) { html += '<section class="case-section" id="tools"><h2>Tools and technologies</h2><div class="meta-row">' + p.tools.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div></section>"; }
    var rel = (p.related || []).map(function (id) { return P.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    if (rel.length) html += '<section class="case-section" id="related"><h2>Related projects</h2><div class="grid grid-2">' + rel.map(projectCard).join("") + "</div></section>";
    root.innerHTML =
      '<div class="page-hero container"><p class="crumbs"><a href="projects.html">Projects</a> / ' + esc(p.category) + '</p><div class="meta-row" style="margin-bottom:1rem"><span class="badge">' + esc(p.category) + '</span><span class="badge status">' + esc(p.status) + "</span></div><h1>" + esc(p.title) + '</h1>' + (p.summary ? '<p class="lead">' + esc(p.summary) + "</p>" : "") + "</div>" +
      '<div class="container section" style="padding-top:1rem"><div class="case-grid"><div>' + (html || '<div class="empty">The full case study for this project is being written. Check back soon.</div>') + '</div><aside class="case-side"><div class="card"><span class="snap-label">Type</span><p class="snap-value">' + esc(p.category) + '</p></div><div class="card"><span class="snap-label">Status</span><p class="snap-value">' + esc(p.status) + "</p></div>" + (p.repo ? '<div class="card"><span class="snap-label">Source</span>' + ext(p.repo, "GitHub repository") + "</div>" : "") + (toc.length ? '<div class="card"><span class="snap-label">On this page</span><ul class="toc">' + toc.map(function (t) { return '<li><a href="#' + t[0] + '">' + t[1] + "</a></li>"; }).join("") + "</ul></div>" : "") + "</aside></div></div>";
    // lightbox
    var dlg = document.createElement("dialog"); dlg.className = "lightbox"; dlg.innerHTML = '<img alt=""><p></p><button class="btn btn-ghost btn-sm" type="button" style="margin-top:.8rem">Close</button>'; document.body.appendChild(dlg);
    $("button", dlg).addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    $$(".shot", root).forEach(function (b) { b.addEventListener("click", function () { var sh = p.screenshots[b.getAttribute("data-i")]; $("img", dlg).src = sh.src; $("img", dlg).alt = sh.caption || "Screenshot"; $("p", dlg).textContent = sh.caption || ""; dlg.showModal(); }); });
  }

  /* ---------- Learning: heading + intro line only (notes appear only if added in admin) ---------- */
  function learning() {
    var root = $("#tracks"); if (!root) return;
    root.innerHTML = (window.LEARNING || []).map(function (t) {
      var notes = (t.notes || []).map(function (n) {
        return '<div class="card" style="margin-top:1rem"><h3>' + esc(n.title) + "</h3>" + (n.date ? '<time class="accent">' + fmtDate(n.date) + "</time>" : "") + '<div class="prose" style="margin-top:.6rem">' + md(n.body) + "</div></div>";
      }).join("");
      return '<section class="section reveal" id="' + esc(t.id) + '"><div class="container"><div class="meta-row" style="margin-bottom:.8rem"><span class="badge">' + esc(t.label) + "</span></div><h2>" + esc(t.title) + '</h2><p class="lead">' + esc(t.intro) + "</p>" + notes + "</div></section>";
    }).join("");
    observeNew(root);
  }

  /* ---------- About: experience (added in admin) ---------- */
  function experience() {
    var root = $("#experience"); if (!root) return;
    var X = window.EXPERIENCE || [];
    if (!X.length) { root.style.display = "none"; return; }
    root.innerHTML = X.map(function (x) {
      return '<div class="card" style="margin:1rem 0"><h3>' + esc(x.role) + "</h3>" + (x.org || x.period ? "<p>" + (x.org ? "<strong>" + esc(x.org) + "</strong>" : "") + (x.org && x.period ? " · " : "") + esc(x.period || "") + "</p>" : "") +
        (x.details ? '<div class="prose">' + md(x.details) + "</div>" : "") +
        (x.tools && x.tools.length ? '<div class="meta-row" style="margin-top:.8rem">' + x.tools.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") + "</div>";
    }).join("");
  }

  /* ---------- Insights ---------- */
  function articleCard(a) {
    return '<article class="card hoverable"><div class="meta-row"><span class="badge">' + esc(a.category) + "</span>" + "</div><h3 style=\"margin-top:.8rem\"><a href=\"article.html?id=" + encodeURIComponent(a.id) + '" style="color:inherit;text-decoration:none">' + esc(a.title) + "</a></h3><p>" + esc(a.summary) + '</p><div class="meta-row"><span class="tag">' + fmtDate(a.date) + '</span><span class="tag">' + readTime(a.body) + "</span>" + (a.tags || []).map(function (t) { return '<span class="tag">#' + esc(t) + "</span>"; }).join("") + "</div></article>";
  }
  function insights() {
    var list = $("#article-list"); if (!list) return;
    A = A.slice().sort(function (x, y) { return String(y.date || "").localeCompare(String(x.date || "")); });
    var fb = $("#article-filters"), sb = $("#article-search"), active = "All";
    var cats = window.ARTICLE_CATEGORIES.filter(function (c) { return A.some(function (a) { return a.category === c; }); });
    fb.innerHTML = ["All"].concat(cats).map(function (c) { return '<button type="button" class="chip" aria-pressed="' + (c === "All") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>"; }).join("");
    function draw() {
      var q = sb.value.trim().toLowerCase();
      var r = A.filter(function (a) { return (active === "All" || a.category === active) && (!q || [a.title, a.summary, a.category, (a.tags || []).join(" "), a.body].join(" ").toLowerCase().indexOf(q) > -1); });
      list.innerHTML = r.length ? r.map(articleCard).join("") : '<div class="empty" style="grid-column:1/-1">' + (A.length ? "No articles match." : "Articles will appear here as they are published.") + "</div>";
    }
    fb.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; active = b.getAttribute("data-cat"); $$("button", fb).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); draw(); });
    sb.addEventListener("input", draw); draw();
  }
  function articleDetail() {
    var root = $("#article"); if (!root) return;
    var a = A.filter(function (x) { return x.id === params.get("id"); })[0];
    if (!a) { root.innerHTML = '<div class="empty">Article not found. <a href="insights.html">Back to Insights</a></div>'; setTitle("Article not found"); return; }
    setTitle(a.title);
    var rel = (a.related || []).map(function (id) { return P.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
    var url = (C.siteUrl ? C.siteUrl.replace(/\/$/, "") + "/" : location.href.split("?")[0].replace(/[^/]*$/, "")) + "article.html?id=" + encodeURIComponent(a.id);
    root.innerHTML = '<p class="crumbs"><a href="insights.html">Insights</a> / ' + esc(a.category) + '</p><div class="meta-row" style="margin-bottom:1rem"><span class="badge">' + esc(a.category) + "</span>" + "</div><h1>" + esc(a.title) + '</h1><p class="lead">' + esc(a.summary) + '</p><div class="meta-row" style="margin:1rem 0 2rem"><span class="tag">' + fmtDate(a.date) + '</span><span class="tag">' + readTime(a.body) + "</span>" + (a.tags || []).map(function (t) { return '<span class="tag">#' + esc(t) + "</span>"; }).join("") + '</div><div class="prose">' + md(a.body) + "</div>" +
      '<div class="callout info" style="margin-top:2rem"><p>Shareable link: <a href="' + esc(url) + '">' + esc(url) + "</a></p></div>" +
      (rel.length ? '<h2 style="margin-top:3rem">Related projects</h2><div class="grid grid-2">' + rel.map(projectCard).join("") + "</div>" : "");
  }

  /* ---------- Contact ---------- */
  function contact() {
    var box = $("#contact-list"); if (!box) return;
    box.innerHTML =
      '<li><div><small>Email</small><a href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a></div></li>" +
      '<li><div><small>LinkedIn</small><a href="' + esc(C.linkedin) + '" target="_blank" rel="noopener noreferrer">Durojaiye Rofiat on LinkedIn</a></div></li>' +
      (C.github ? '<li><div><small>GitHub</small><a href="' + esc(C.github) + '" target="_blank" rel="noopener noreferrer">' + esc(C.github.replace(/^https?:\/\//, "")) + "</a></div></li>" : "") +
      (C.showPhone ? '<li><div><small>Phone</small><a href="tel:' + esc(C.phone.replace(/\s/g, "")) + '">' + esc(C.phone) + "</a></div></li>" : "");
    var f = $("#contact-form"), st = $("#form-status");
    var note = $("#form-note");
    if (!C.formEndpoint) note.innerHTML = '<p>Prefer email? Write to <a href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a>.</p>";
    function setErr(id, msg) { var i = $("#" + id), e = $("#" + id + "-err"); e.textContent = msg || ""; if (msg) i.setAttribute("aria-invalid", "true"); else i.removeAttribute("aria-invalid"); return !msg; }
    function show(msg, err) { st.textContent = msg; st.className = "form-status show" + (err ? " err" : ""); }
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = { name: f.name.value.trim(), email: f.email.value.trim(), subject: f.subject.value.trim(), message: f.message.value.trim() };
      var ok = setErr("name", v.name ? "" : "Please enter your name.");
      ok = setErr("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) ? "" : "Please enter a valid email address.") && ok;
      ok = setErr("subject", v.subject ? "" : "Please enter a subject.") && ok;
      ok = setErr("message", v.message.length >= 10 ? "" : "Please write a message of at least 10 characters.") && ok;
      if (!ok) { show("Please fix the highlighted fields.", true); var first = $("[aria-invalid='true']", f); if (first) first.focus(); return; }
      if (f.website.value) return; // honeypot: bots fill this hidden field
      if (!C.formEndpoint) { location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent(v.subject) + "&body=" + encodeURIComponent(v.message + "\n\n" + v.name + " (" + v.email + ")"); show("Opening your email app. Nothing has been sent until you press send there."); return; }
      show("Sending…");
      fetch(C.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ name: v.name, email: v.email, subject: v.subject, message: v.message, _subject: "Portfolio message: " + v.subject, _template: "table", _captcha: "false" }) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { if (j && (j.success === false || j.success === "false")) throw new Error("rejected"); show("Thank you. Your message has been sent to Rofiat."); f.reset(); })
        .catch(function () { show("Your message could not be sent. Please email " + C.email + " directly.", true); });
    });
  }

  /* ---------- Boot ---------- */
  renderHeader(); renderFooter(); portrait(); links();
  if (page === "home") initProjectList({ list: "#featured-list", filters: "#featured-filters", featured: true, status: "#featured-status" });
  if (page === "projects") initProjectList({ list: "#project-list", filters: "#project-filters", search: "#project-search", status: "#project-status" });
  projectDetail(); learning(); experience(); insights(); articleDetail(); contact();
  reveal();
})();
