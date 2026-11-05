/* Admin: edit projects, articles, learning notes and experience without touching code.
   Changes are saved by committing data/site-data.js (and any uploaded images) to the
   site's GitHub repository using a personal access token that stays in THIS browser only.
   GitHub Pages then republishes the site automatically (usually within a minute or two). */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function slug(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item"; }
  function getp(o, path) { return path.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setp(o, path, v) { var ks = path.split("."), last = ks.pop(); var t = ks.reduce(function (a, k) { return (a[k] = a[k] || {}); }, o); t[last] = v; }

  var DATA_PATH = "data/site-data.js";
  var data = clone(window.SITE_DATA || {});
  ["projects", "articles", "learning", "experience"].forEach(function (k) { data[k] = data[k] || []; });
  data.config = data.config || {};
  var pending = {};          // image path -> dataURL, committed on publish
  var dirty = false;
  var tab = "projects";
  var conn = { repo: "", branch: "main", token: "", ok: false };

  var CATS = window.PROJECT_CATEGORIES || [], STATS = window.PROJECT_STATUSES || [], ACATS = window.ARTICLE_CATEGORIES || [];

  /* ---------- connection ---------- */
  function loadConn() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem("rd_admin") || "null") || JSON.parse(sessionStorage.getItem("rd_admin") || "null") || {}; } catch (e) {}
    conn.repo = saved.repo || ""; conn.branch = saved.branch || "main"; conn.token = saved.token || "";
    if (!conn.repo && /\.github\.io$/.test(location.hostname)) {
      var seg = location.pathname.split("/").filter(Boolean)[0];
      conn.repo = location.hostname.split(".")[0] + "/" + (seg && seg !== "admin.html" ? seg : location.hostname);
    }
    $("#c-repo").value = conn.repo; $("#c-branch").value = conn.branch; $("#c-token").value = conn.token;
  }
  function saveConn() {
    var rec = JSON.stringify({ repo: conn.repo, branch: conn.branch, token: conn.token });
    try { localStorage.removeItem("rd_admin"); sessionStorage.removeItem("rd_admin"); } catch (e) {}
    try { ($("#c-remember").checked ? localStorage : sessionStorage).setItem("rd_admin", rec); } catch (e) {}
  }
  function api(path, opts) {
    opts = opts || {};
    return fetch("https://api.github.com/repos/" + conn.repo + "/contents/" + path + (opts.method === "PUT" ? "" : "?ref=" + encodeURIComponent(conn.branch)), {
      method: opts.method || "GET",
      headers: { Authorization: "Bearer " + conn.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (r.ok) return r.json();
      var e = new Error(String(r.status)); e.status = r.status; throw e;
    });
  }
  function explain(e) {
    if (e.status === 401) return "GitHub rejected the token. It may be wrong or expired.";
    if (e.status === 403) return "The token is not allowed to write to this repository (it needs Contents: Read and write).";
    if (e.status === 404) return "Repository, branch or file not found. Check the repository name (owner/name) and the token's access.";
    if (e.status === 409 || e.status === 422) return "Someone changed the site at the same time. Click Connect to reload the latest version, then try again.";
    return "Could not reach GitHub (" + (e.message || "network error") + "). Check your internet connection.";
  }
  function b64(str) { var b = new TextEncoder().encode(str), s = ""; for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { var bin = atob(s.replace(/\s/g, "")), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new TextDecoder().decode(a); }
  function setConnStatus(msg, kind) { var el = $("#c-status"); el.textContent = msg; el.className = "adm-status " + (kind || ""); }

  function connect() {
    conn.repo = $("#c-repo").value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$|\/$/g, "");
    conn.branch = $("#c-branch").value.trim() || "main"; conn.token = $("#c-token").value.trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(conn.repo)) { setConnStatus("Enter the repository as owner/name, for example rofiat/portfolio.", "err"); return; }
    if (!conn.token) { setConnStatus("Paste your GitHub token first.", "err"); return; }
    setConnStatus("Connecting…");
    api(DATA_PATH).then(function (f) {
      var txt = unb64(f.content), json = txt.replace(/^\s*window\.SITE_DATA\s*=\s*/, "").replace(/;\s*$/, "");
      if (dirty && !confirm("You have unpublished changes. Loading the latest site content will replace them. Continue?")) { conn.ok = true; setConnStatus("Connected. Your unpublished changes were kept.", "ok"); return; }
      data = JSON.parse(json); ["projects", "articles", "learning", "experience"].forEach(function (k) { data[k] = data[k] || []; }); data.config = data.config || {};
      conn.ok = true; saveConn(); markDirty(false); setConnStatus("Connected to " + conn.repo + ". Latest content loaded.", "ok"); render();
    }).catch(function (e) { conn.ok = false; setConnStatus(explain(e), "err"); });
  }

  function publish() {
    var btn = $("#publish"), st = $("#pub-status");
    if (!conn.ok) { st.textContent = "Connect to GitHub first (top of the page), or use Download backup."; st.className = "adm-status err"; return; }
    btn.disabled = true; st.className = "adm-status"; st.textContent = "Publishing…";
    var paths = Object.keys(pending);
    // keep only images still referenced
    var used = JSON.stringify(data) + "";
    paths = paths.filter(function (p) { return used.indexOf(p) > -1; });
    var chain = Promise.resolve();
    paths.forEach(function (p, i) {
      chain = chain.then(function () {
        st.textContent = "Uploading image " + (i + 1) + " of " + paths.length + "…";
        return api(p, { method: "PUT", body: { message: "Admin: upload " + p.split("/").pop(), content: pending[p].split(",")[1], branch: conn.branch } });
      });
    });
    chain.then(function () { st.textContent = "Saving content…"; return api(DATA_PATH); }).then(function (f) {
      var out = "window.SITE_DATA = " + JSON.stringify(data, null, 2) + ";\n";
      return api(DATA_PATH, { method: "PUT", body: { message: "Admin: update site content", content: b64(out), sha: f.sha, branch: conn.branch } });
    }).then(function () {
      pending = {}; markDirty(false);
      st.textContent = "Published. The live site updates in about a minute or two."; st.className = "adm-status ok";
    }).catch(function (e) { st.textContent = explain(e); st.className = "adm-status err"; })
      .then(function () { btn.disabled = false; });
  }

  function download() {
    var blob = new Blob(["window.SITE_DATA = " + JSON.stringify(data, null, 2) + ";\n"], { type: "text/javascript" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "site-data.js"; document.body.appendChild(a); a.click(); a.remove();
  }

  function markDirty(v) { dirty = v; $("#dirty").hidden = !v; }
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- images ---------- */
  function readImage(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onerror = rej;
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { rej(new Error("That file is not a readable image.")); };
        img.onload = function () {
          var max = 1600, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
          var c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
          var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL("image/jpeg", 0.86));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function addImage(file, base) {
    return readImage(file).then(function (url) {
      var path = "assets/uploads/" + slug(base) + "-" + Date.now().toString(36) + Math.floor(Math.random() * 99) + ".jpg";
      pending[path] = url; return path;
    });
  }
  function imgSrc(p) { return pending[p] || p; }

  /* ---------- generic list + editor ---------- */
  var KINDS = {
    projects: {
      noun: "project", list: function () { return data.projects; },
      title: function (x) { return x.title; },
      sub: function (x) { return x.category + " · " + x.status; },
      blank: function () { return { id: "", title: "", category: CATS[0], status: "In Progress", featured: true, summary: "", problem: "", tools: [], image: "", repo: "", sections: {}, screenshots: [] }; },
      fields: [
        { k: "title", label: "Project title", type: "text", req: true },
        { k: "status", label: "Status", type: "select", options: STATS, help: "You can change this any time. Set it to Completed when the project is done." },
        { k: "category", label: "Category", type: "select", options: CATS },
        { k: "featured", label: "Show this project on the homepage", type: "check" },
        { k: "image", label: "Cover image (shown on the project card)", type: "image" },
        { k: "summary", label: "Short summary (one or two sentences, shown on the card)", type: "textarea", rows: 3 },
        { k: "problem", label: "Problem statement", type: "textarea", rows: 3 },
        { k: "sections.overview", label: "Project overview", type: "textarea", rows: 6, md: true },
        { k: "sections.workflow", label: "Investigation details", type: "textarea", rows: 8, md: true },
        { k: "sections.findings", label: "Key findings", type: "textarea", rows: 6, md: true },
        { k: "sections.challenges", label: "Challenges and lessons learned", type: "textarea", rows: 5, md: true },
        { k: "tools", label: "Tools used (separate with commas)", type: "list" },
        { k: "repo", label: "GitHub link for this project (optional)", type: "text", ph: "https://github.com/..." },
        { k: "screenshots", label: "Screenshots and evidence", type: "shots" }
      ]
    },
    articles: {
      noun: "article", list: function () { return data.articles; },
      title: function (x) { return x.title; },
      sub: function (x) { return (x.date || "No date") + " · " + x.category; },
      blank: function () { return { id: "", title: "", category: ACATS[0], tags: [], date: new Date().toISOString().slice(0, 10), summary: "", body: "", related: [] }; },
      fields: [
        { k: "title", label: "Article title", type: "text", req: true },
        { k: "date", label: "Date published", type: "date", req: true },
        { k: "category", label: "Category", type: "select", options: ACATS },
        { k: "summary", label: "One-sentence summary", type: "textarea", rows: 2 },
        { k: "body", label: "Article text", type: "textarea", rows: 16, md: true, req: true, readtime: true },
        { k: "tags", label: "Tags (separate with commas)", type: "list" }
      ]
    },
    experience: {
      noun: "role", list: function () { return data.experience; },
      title: function (x) { return x.role; },
      sub: function (x) { return [x.org, x.period].filter(Boolean).join(" · "); },
      blank: function () { return { id: "", role: "", org: "", period: "", details: "", tools: [] }; },
      fields: [
        { k: "role", label: "Role / job title", type: "text", req: true },
        { k: "org", label: "Organisation", type: "text" },
        { k: "period", label: "Period (for example 2023 to 2024)", type: "text" },
        { k: "details", label: "Responsibilities (one per line, starting each with a dash)", type: "textarea", rows: 8, md: true },
        { k: "tools", label: "Tools used (separate with commas)", type: "list" }
      ]
    }
  };

  function render() {
    $$("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === tab); });
    $("#editor").innerHTML = "";
    var root = $("#panel");
    if (tab === "learning") return renderLearning(root);
    if (tab === "settings") return renderSettings(root);
    var K = KINDS[tab], items = K.list();
    var h = '<div class="adm-bar"><h2>' + ({ projects: "Projects", articles: "Articles", experience: "About page: experience" })[tab] + '</h2><button class="btn btn-primary btn-sm" data-act="new" type="button">+ Add ' + K.noun + "</button></div>";
    if (tab === "experience") h += '<p class="adm-note">Roles and tools you list here appear in the "My experience in Security Operations" part of the About page.</p>';
    if (!items.length) h += '<div class="empty">Nothing here yet. Click "Add ' + K.noun + '" to create the first one.</div>';
    h += '<ul class="adm-list">' + items.map(function (x, i) {
      var st = tab === "projects" ? '<label class="adm-inline">Status <select data-act="status" data-i="' + i + '">' + STATS.map(function (s) { return "<option" + (s === x.status ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") + "</select></label>" : "";
      return '<li class="card"><div><strong>' + esc(K.title(x) || "(untitled)") + "</strong><small>" + esc(K.sub(x)) + "</small></div><div class=\"adm-row\">" + st +
        '<button class="btn btn-ghost btn-sm" data-act="edit" data-i="' + i + '" type="button">Edit</button><button class="btn btn-ghost btn-sm" data-act="del" data-i="' + i + '" type="button">Delete</button></div></li>';
    }).join("") + "</ul>";
    root.innerHTML = h;
  }

  function fieldHTML(f, item) {
    var v = getp(item, f.k), id = "f-" + f.k.replace(/\./g, "-"), l = '<label for="' + id + '">' + esc(f.label) + (f.req ? " *" : "") + "</label>", help = f.help ? '<p class="adm-note">' + esc(f.help) + "</p>" : "";
    var body;
    if (f.type === "select") body = '<select id="' + id + '">' + f.options.map(function (o) { return "<option" + (o === v ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") + "</select>";
    else if (f.type === "textarea") body = '<textarea id="' + id + '" rows="' + (f.rows || 4) + '">' + esc(v || "") + "</textarea>" + (f.md ? '<p class="adm-note">Formatting: use <code>## Heading</code> for headings, <code>- </code> at the start of a line for bullets, and <code>**bold**</code> for bold text.</p>' : "") + (f.readtime ? '<p class="adm-note" id="rt"></p>' : "");
    else if (f.type === "check") return '<div class="field"><label class="adm-check"><input type="checkbox" id="' + id + '"' + (v ? " checked" : "") + "> " + esc(f.label) + "</label></div>";
    else if (f.type === "list") body = '<input id="' + id + '" value="' + esc((v || []).join(", ")) + '">';
    else if (f.type === "image") body = '<div class="adm-img" id="' + id + '-prev">' + (v ? '<img src="' + esc(imgSrc(v)) + '" alt="">' : "") + '</div><input type="file" accept="image/*" id="' + id + '"><button type="button" class="btn btn-ghost btn-sm" data-act="rmimg" data-k="' + f.k + '">Remove image</button>';
    else if (f.type === "shots") body = '<div id="shots"></div><input type="file" accept="image/*" multiple id="shot-add"><p class="adm-note">Add one or more screenshots, then write a short caption for each.</p>';
    else body = '<input id="' + id + '" type="' + (f.type === "date" ? "date" : "text") + '" value="' + esc(v || "") + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") + ">";
    return '<div class="field">' + l + body + help + "</div>";
  }

  function openEditor(kind, idx) {
    var K = KINDS[kind], isNew = idx == null, item = isNew ? K.blank() : clone(K.list()[idx]);
    var ed = $("#editor");
    ed.innerHTML = '<div class="card adm-form"><h2>' + (isNew ? "New " : "Edit ") + K.noun + "</h2>" + K.fields.map(function (f) { return fieldHTML(f, item); }).join("") +
      '<div class="adm-err" id="ed-err" role="alert"></div><div class="btn-row"><button class="btn btn-primary" id="ed-save" type="button">Save ' + K.noun + '</button><button class="btn btn-ghost" id="ed-cancel" type="button">Cancel</button></div></div>';
    ed.scrollIntoView({ behavior: "smooth", block: "start" });

    function drawShots() {
      var box = $("#shots"); if (!box) return;
      box.innerHTML = (item.screenshots || []).map(function (s, i) {
        return '<div class="adm-shot"><img src="' + esc(imgSrc(s.src)) + '" alt=""><input data-cap="' + i + '" value="' + esc(s.caption || "") + '" placeholder="Caption"><button type="button" class="btn btn-ghost btn-sm" data-rm="' + i + '">Remove</button></div>';
      }).join("");
      $$("[data-cap]", box).forEach(function (inp) { inp.addEventListener("input", function () { item.screenshots[inp.getAttribute("data-cap")].caption = inp.value; }); });
      $$("[data-rm]", box).forEach(function (b) { b.addEventListener("click", function () { item.screenshots.splice(+b.getAttribute("data-rm"), 1); drawShots(); }); });
    }
    drawShots();
    var rt = $("#rt"), body = $("#f-body");
    if (rt && body) { var upd = function () { rt.textContent = "Reading time shown to visitors: " + Math.max(1, Math.round(body.value.trim().split(/\s+/).filter(Boolean).length / 200)) + " min read"; }; body.addEventListener("input", upd); upd(); }

    function showErr(m) { $("#ed-err").textContent = m; }
    var imgIn = $("input[type=file][id^='f-image']", ed);
    if (imgIn) imgIn.addEventListener("change", function () {
      if (!imgIn.files[0]) return;
      addImage(imgIn.files[0], $("#f-title") ? $("#f-title").value : "cover").then(function (p) { item.image = p; $("#f-image-prev").innerHTML = '<img src="' + esc(imgSrc(p)) + '" alt="">'; }).catch(function (e) { showErr(e.message); });
    });
    var rm = $("[data-act=rmimg]", ed); if (rm) rm.addEventListener("click", function () { item.image = ""; $("#f-image-prev").innerHTML = ""; if (imgIn) imgIn.value = ""; });
    var sa = $("#shot-add"); if (sa) sa.addEventListener("change", function () {
      var files = Array.prototype.slice.call(sa.files); sa.value = "";
      files.reduce(function (c, f) { return c.then(function () { return addImage(f, "screenshot").then(function (p) { item.screenshots = item.screenshots || []; item.screenshots.push({ src: p, caption: "" }); }); }); }, Promise.resolve()).then(drawShots).catch(function (e) { showErr(e.message); });
    });

    $("#ed-cancel").addEventListener("click", function () { ed.innerHTML = ""; });
    $("#ed-save").addEventListener("click", function () {
      for (var i = 0; i < K.fields.length; i++) {
        var f = K.fields[i], id = "#f-" + f.k.replace(/\./g, "-"), el = $(id);
        if (!el || f.type === "image" || f.type === "shots") continue;
        var v = f.type === "check" ? el.checked : el.value.trim();
        if (f.req && !v) { showErr("Please fill in: " + f.label); el.focus(); return; }
        if (f.type === "list") v = v ? v.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [];
        setp(item, f.k, v);
      }
      var tk = item.title || item.role;
      if (!item.id) { var base = slug(tk), n = base, c = 1, ids = K.list().map(function (x) { return x.id; }); while (ids.indexOf(n) > -1) n = base + "-" + (++c); item.id = n; }
      if (tab === "projects") { Object.keys(item.sections).forEach(function (k) { if (!item.sections[k]) delete item.sections[k]; }); }
      if (isNew) K.list().push(item); else K.list()[idx] = item;
      markDirty(true); render();
    });
  }

  /* ---------- learning ---------- */
  function renderLearning(root) {
    var h = '<div class="adm-bar"><h2>Learning journey</h2><button class="btn btn-primary btn-sm" data-act="newtrack" type="button">+ Add section</button></div>' +
      '<p class="adm-note">Each section shows a heading and an introductory line. Notes are optional: only add one when you have something real to share.</p><ul class="adm-list">';
    h += data.learning.map(function (t, i) {
      return '<li class="card adm-track"><div class="field"><label>Heading</label><input data-t="' + i + '" data-f="title" value="' + esc(t.title) + '"></div>' +
        '<div class="field"><label>Label</label><input data-t="' + i + '" data-f="label" value="' + esc(t.label) + '"></div>' +
        '<div class="field"><label>Introductory line</label><textarea rows="2" data-t="' + i + '" data-f="intro">' + esc(t.intro) + "</textarea></div>" +
        (t.notes && t.notes.length ? "<ul class=\"adm-list\">" + t.notes.map(function (n, j) { return '<li class="adm-note-row"><span>' + esc(n.title) + " <small>" + esc(n.date || "") + '</small></span><span><button class="btn btn-ghost btn-sm" data-act="editnote" data-i="' + i + '" data-j="' + j + '" type="button">Edit</button> <button class="btn btn-ghost btn-sm" data-act="delnote" data-i="' + i + '" data-j="' + j + '" type="button">Delete</button></span></li>'; }).join("") + "</ul>" : "") +
        '<div class="adm-row"><button class="btn btn-ghost btn-sm" data-act="newnote" data-i="' + i + '" type="button">+ Add a note</button><button class="btn btn-ghost btn-sm" data-act="deltrack" data-i="' + i + '" type="button">Delete section</button></div></li>';
    }).join("") + "</ul>";
    root.innerHTML = h;
    $$("[data-t]", root).forEach(function (inp) { inp.addEventListener("input", function () { data.learning[+inp.getAttribute("data-t")][inp.getAttribute("data-f")] = inp.value; markDirty(true); }); });
  }
  function noteEditor(i, j) {
    var isNew = j == null, n = isNew ? { title: "", date: new Date().toISOString().slice(0, 10), body: "" } : clone(data.learning[i].notes[j]);
    $("#editor").innerHTML = '<div class="card adm-form"><h2>' + (isNew ? "New" : "Edit") + " learning note: " + esc(data.learning[i].title) + '</h2><div class="field"><label for="n-title">Title *</label><input id="n-title" value="' + esc(n.title) + '"></div><div class="field"><label for="n-date">Date</label><input type="date" id="n-date" value="' + esc(n.date) + '"></div><div class="field"><label for="n-body">Note *</label><textarea id="n-body" rows="10">' + esc(n.body) + '</textarea><p class="adm-note">Formatting: <code>## Heading</code>, <code>- </code> for bullets, <code>**bold**</code>.</p></div><div class="adm-err" id="ed-err" role="alert"></div><div class="btn-row"><button class="btn btn-primary" id="n-save" type="button">Save note</button><button class="btn btn-ghost" id="n-cancel" type="button">Cancel</button></div></div>';
    $("#editor").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#n-cancel").addEventListener("click", function () { $("#editor").innerHTML = ""; });
    $("#n-save").addEventListener("click", function () {
      n.title = $("#n-title").value.trim(); n.date = $("#n-date").value; n.body = $("#n-body").value.trim();
      if (!n.title || !n.body) { $("#ed-err").textContent = "Please add a title and the note text."; return; }
      data.learning[i].notes = data.learning[i].notes || [];
      if (isNew) data.learning[i].notes.push(n); else data.learning[i].notes[j] = n;
      markDirty(true); render();
    });
  }

  /* ---------- settings ---------- */
  function renderSettings(root) {
    root.innerHTML = '<div class="adm-bar"><h2>Site settings</h2></div><div class="card adm-form">' +
      '<div class="field"><label for="s-github">GitHub profile link</label><input id="s-github" value="' + esc(data.config.github || "") + '" placeholder="https://github.com/your-username"><p class="adm-note">Shows on the Contact page and in the footer once added.</p></div>' +
      '<div class="field"><label for="s-portrait">Profile picture</label><div class="adm-img" id="s-prev"><img src="' + esc(imgSrc(data.config.portrait || window.CONFIG.portrait)) + '" alt=""></div><input type="file" id="s-portrait" accept="image/*"><p class="adm-note">Appears on the homepage and the About page. A portrait photo (taller than wide) works best.</p></div>' +
      '<div class="adm-err" id="ed-err" role="alert"></div></div>';
    $("#s-github").addEventListener("input", function (e) { data.config.github = e.target.value.trim(); markDirty(true); });
    $("#s-portrait").addEventListener("change", function (e) {
      if (!e.target.files[0]) return;
      addImage(e.target.files[0], "portrait").then(function (p) { data.config.portrait = p; $("#s-prev").innerHTML = '<img src="' + esc(imgSrc(p)) + '" alt="">'; markDirty(true); }).catch(function (er) { $("#ed-err").textContent = er.message; });
    });
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act],[data-tab],#connect,#publish,#download"); if (!t) return;
    if (t.id === "connect") return connect();
    if (t.id === "publish") return publish();
    if (t.id === "download") return download();
    if (t.hasAttribute("data-tab")) { tab = t.getAttribute("data-tab"); return render(); }
    var act = t.getAttribute("data-act"), i = +t.getAttribute("data-i"), j = +t.getAttribute("data-j");
    if (act === "new") return openEditor(tab, null);
    if (act === "edit") return openEditor(tab, i);
    if (act === "del") { var K = KINDS[tab]; if (confirm('Delete "' + (K.title(K.list()[i]) || "this item") + '"? This takes effect when you publish.')) { K.list().splice(i, 1); markDirty(true); render(); } return; }
    if (act === "newtrack") { data.learning.push({ id: "section-" + Date.now().toString(36), title: "New section", label: "Currently exploring", intro: "", notes: [] }); markDirty(true); return render(); }
    if (act === "deltrack") { if (confirm("Delete this learning section?")) { data.learning.splice(i, 1); markDirty(true); render(); } return; }
    if (act === "newnote") return noteEditor(i, null);
    if (act === "editnote") return noteEditor(i, j);
    if (act === "delnote") { if (confirm("Delete this note?")) { data.learning[i].notes.splice(j, 1); markDirty(true); render(); } return; }
  });
  document.addEventListener("change", function (e) {
    var t = e.target; if (t.getAttribute && t.getAttribute("data-act") === "status") { data.projects[+t.getAttribute("data-i")].status = t.value; markDirty(true); render(); }
  });

  loadConn(); markDirty(false); render();
  if (conn.token && conn.repo) connect();
})();
