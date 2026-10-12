/* Menya Plus TV : script commun à toutes les pages (données dans data.js) */
const $ = id => document.getElementById(id);
const now = new Date(), bj = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Bujumbura" })), day = bj.getDay(), hr = bj.getHours();   /* heure du Burundi */
const key = day === 0 ? "dim" : day === 6 ? "sam" : "sem";
const cur = hr >= 23 || hr < 6 ? 10 : hr < 8 ? 0 : hr < 10 ? 1 : hr < 12 ? 2 : hr < 13 ? 3 : hr < 15 ? 4 : hr < 17 ? 5 : hr < 19 ? 6 : hr < 20 ? 7 : hr < 22 ? 8 : 9;

/* menu mobile + page active */
const mb = $("menu");
if (mb) mb.onclick = () => mb.setAttribute("aria-expanded", document.querySelector("nav").classList.toggle("open"));
document.querySelectorAll("nav a").forEach(a => { if (a.getAttribute("href") === document.body.dataset.nav) a.setAttribute("aria-current", "page"); });

/* secteurs */
if ($("sectors")) $("sectors").innerHTML = SECTORS.map(x => `<a class="sector" href="secteur-${x.id}.html"><h3>${x.name}</h3><p>${x.d}</p></a>`).join("");

let shown = [];   /* liste des émissions affichées (sert au bouton Partager) */
/* réseaux sociaux : une pastille par réseau où l'émission est publiée */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
/* liens de l'émission ; à défaut, les comptes officiels de la TV */
const pubs = v => v.p && Object.keys(v.p).length ? v.p : SOCIAL;
const card = (v, i) => {
  const p = pubs(v), links = Object.keys(PLATFORMS).filter(k => p[k]);
  const main = v.u && v.u !== "#" ? v.u : (links.length ? p[links[0]] : "#");
  const soc = links.map(k => `<a class="sn sn-${k}" href="${esc(p[k])}" target="_blank" rel="noopener" aria-label="${PLATFORMS[k]} : ${esc(v.t)}">${PLATFORMS[k]}</a>`).join("");
  return `<article class="card"><a class="thumb" href="${esc(main)}"${main !== "#" ? ' target="_blank" rel="noopener"' : ""} style="text-decoration:none${v.img ? `;background:linear-gradient(rgba(15,33,96,.25),rgba(15,33,96,.8)),url('${esc(v.img)}') center/cover` : ""}">${S[v.s] || "Menya Plus TV"}</a><div class="t"><h3>${v.t}</h3><small>${v.d}${v.tag ? " · " + v.tag : ""}</small>`
    + (links.length ? `<div class="snrow" aria-label="Voir sur les réseaux sociaux">${soc}</div>` : "")
    + `<button class="share" data-share="${i}" type="button">Partager</button></div></article>`;
};

/* émissions (filtre par secteur, limite, ?s=secteur dans l'adresse) */
const box = $("videos");
if (box) {
  let filter = box.dataset.sector || new URLSearchParams(location.search).get("s") || "all";
  const draw = () => {
    if ($("chips")) $("chips").innerHTML = [["all", "Tous"], ...SECTORS.map(x => [x.id, x.name.split(" ")[0]])]
      .map(([i, n]) => `<button class="chip" data-f="${i}" aria-pressed="${i === filter}">${n}</button>`).join("");
    const list = VIDEOS.filter(v => filter === "all" || v.s === filter).slice(0, +box.dataset.limit || 99);
    shown = list;
    box.innerHTML = list.length ? list.map(card).join("") : "<p>Aucune émission pour le moment. Revenez bientôt.</p>";
  };
  draw();
  box.addEventListener("redraw", draw);
  if ($("chips")) $("chips").addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (b) { filter = b.dataset.f; draw(); } });
}

/* bouton Partager : partage natif du téléphone, sinon copie du lien */
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-share]"); if (!b) return;
  const v = shown[+b.dataset.share], p = pubs(v);
  const url = v.u && v.u !== "#" ? v.u : (p[Object.keys(PLATFORMS).find(k => p[k])] || location.href);
  const data = { title: v.t, text: `${v.t} ${v.tag || HASHTAG}`, url };
  try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(`${data.text} ${url}`); b.textContent = "Lien copié ✓"; setTimeout(() => b.textContent = "Partager", 2000); } } catch { }
});

/* réseaux sociaux de la TV dans le pied de page de chaque page */
const ft = document.querySelector("footer .wrap");
if (ft) {
  const own = Object.keys(PLATFORMS).filter(k => SOCIAL[k]);
  if (own.length) {
    const s = document.createElement("div");
    s.className = "social";
    s.innerHTML = `<strong>Suivez-nous</strong><div class="snrow">${own.map(k => `<a class="sn sn-${k}" href="${esc(SOCIAL[k])}" target="_blank" rel="noopener">${PLATFORMS[k]}</a>`).join("")}</div>`;
    ft.insertBefore(s, ft.children[1]);
  }
}

/* vidéos YouTube automatiques : videos.json est mis à jour toutes les 30 min (voir .github/workflows) */
function guessSector(t) {
  t = t.toLowerCase();
  return (Object.keys(SECTOR_KEYWORDS).find(s => SECTOR_KEYWORDS[s].some(w => t.includes(w)))) || "";
}
if (box) {
  fetch("videos.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : []).then(list => {
    const known = JSON.stringify(VIDEOS.map(v => v.p || {}));
    const auto = list.filter(y => !known.includes(y.id)).map(y => {
      const u = "https://www.youtube.com/watch?v=" + y.id;
      return { s: guessSector(y.t), t: y.t, d: new Date(y.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), u, tag: HASHTAG, img: "https://i.ytimg.com/vi/" + y.id + "/mqdefault.jpg", p: { youtube: u } };
    });
    if (auto.length) { VIDEOS.unshift(...auto); box.dispatchEvent(new Event("redraw")); }
  }).catch(() => { });
}

/* fils automatiques : YouTube, Facebook et X (sur les pages qui contiennent #yt, #fb ou #xfeed) */
if ($("yt")) {
  if (YOUTUBE_CHANNEL_ID) {
    $("yt").src = "https://www.youtube.com/embed/videoseries?list=UU" + YOUTUBE_CHANNEL_ID.slice(2);
    if (SOCIAL.youtube && $("ytlink")) $("ytlink").innerHTML = `<a class="sn" href="${SOCIAL.youtube}" target="_blank" rel="noopener">Voir toutes les vidéos sur YouTube</a>`;
  } else $("yt").closest(".embed").style.display = "none";
}
if ($("fb")) {
  if (SOCIAL.facebook) $("fb").src = "https://www.facebook.com/plugins/page.php?href=" + encodeURIComponent(SOCIAL.facebook) + "&tabs=timeline&width=500&height=600&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false";
  else $("fb").parentNode.style.display = "none";
}
if ($("xfeed")) {
  if (SOCIAL.x) {
    $("xfeed").innerHTML = `<a class="twitter-timeline" data-height="600" data-lang="fr" href="${SOCIAL.x}">Publications de Menya Plus TV</a>`;
    const t = document.createElement("script"); t.async = true; t.src = "https://platform.twitter.com/widgets.js"; document.body.appendChild(t);
  } else $("xfeed").parentNode.style.display = "none";
}

/* programme du jour : chaque ligne est un bouton qui ouvre les liens de rediffusion sur les réseaux de la TV */
if ($("today")) {
  const compact = $("today").dataset.compact, from = compact ? Math.max(0, Math.min(cur, GRID[key].length - 4)) : 0;
  const rows = GRID[key].slice(from, compact ? from + 4 : undefined);   /* accueil : en ce moment + les 3 suivants */   /* tout le programme du jour, de la première à la dernière émission */
  /* secteurs cités dans le titre d'un programme (ex. « Culture et traditions ») */
  const sectorsOf = t => SECTORS.filter(x => t.toLowerCase().includes(x.name.split(" ")[0].toLowerCase()));
  /* liens de rediffusion : REPLAY (data.js) pour le secteur, sinon les comptes officiels de la TV */
  const replayLinks = t => {
    const sx = sectorsOf(t), own = sx.map(x => REPLAY[x.id]).find(Boolean) || SOCIAL;
    return Object.keys(PLATFORMS).filter(k => own[k]).map(k => [k, own[k]]);
  };
  $("today").innerHTML = rows.map((r, i) => {
    const on = from + i === cur, links = replayLinks(r[1]), sx = sectorsOf(r[1]);
    const nets = links.length
      ? links.map(([k, u]) => `<a class="sn sn-${k}" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${PLATFORMS[k]}</a>`).join("")
      : "<small>Aucun réseau social n'est encore configuré.</small>";
    const secs = sx.map(x => `<a class="sec" href="secteur-${x.id}.html">Toutes les émissions : ${x.name}</a>`).join("");
    return `<li class="${on ? "cur" : ""}"><button class="prog" type="button" aria-expanded="false" aria-controls="pp${i}"><b>${r[0]}</b><span>${r[1]}${on ? "<small>En ce moment</small>" : ""}</span></button>`
      + `<div class="pp" id="pp${i}" hidden><p>Revoir « ${r[1]} » sur nos réseaux sociaux :</p><div class="snrow">${nets}</div>${secs}</div></li>`;
  }).join("");
  $("today").addEventListener("click", e => {
    const b = e.target.closest(".prog"); if (!b) return;
    const open = b.getAttribute("aria-expanded") !== "true";
    $("today").querySelectorAll(".prog").forEach(x => { x.setAttribute("aria-expanded", "false"); $(x.getAttribute("aria-controls")).hidden = true; });
    b.setAttribute("aria-expanded", open);
    $(b.getAttribute("aria-controls")).hidden = !open;
  });
}

/* réseaux sociaux de la page Contact (liens construits depuis data.js) */
if ($("contact-social")) {
  const own = Object.keys(PLATFORMS).filter(k => SOCIAL[k]);
  if (own.length) $("contact-social").innerHTML = own.map(k => `<a class="sn sn-${k}" href="${esc(SOCIAL[k])}" target="_blank" rel="noopener noreferrer">${PLATFORMS[k]}</a>`).join("");
}

/* grille complète */
if ($("grid")) {
  let tab = key;
  const draw = () => {
    $("tabs").innerHTML = [["sem", "Lundi au vendredi"], ["sam", "Samedi"], ["dim", "Dimanche"]]
      .map(([k, n]) => `<button class="tab" role="tab" data-t="${k}" aria-selected="${k === tab}">${n}</button>`).join("");
    $("grid").innerHTML = GRID[tab].map((r, i) => `<tr class="${tab === key && i === cur ? "cur" : ""}"><th scope="row">${r[0]}</th><td>${r[1]}</td></tr>`).join("");
  };
  draw();
  $("tabs").addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (b) { tab = b.dataset.t; draw(); } });
}

/* lecteur */
const v = $("video");
let hls = null;
const opt = { eco: false, audio: false };
try { Object.assign(opt, JSON.parse(localStorage.getItem("menya-player") || "{}")); } catch { }
const md = new URLSearchParams(location.search).get("mode"); if (md === "eco" || md === "audio") opt[md] = true;   /* liens de l'accueil */
if ($("nowtitle")) $("nowtitle").textContent = GRID[key][cur][0] + " · " + GRID[key][cur][1];
const setPlayer = () => {
  /* qualité la plus basse (niveau 0) en économie de données ou en audio seul ; -1 = automatique */
  if (hls) hls.currentLevel = opt.eco || opt.audio ? 0 : -1;
  if ($("acover")) $("acover").hidden = !(opt.audio && STREAM_URL);
  ["eco", "audio"].forEach(id => $(id) && $(id).setAttribute("aria-pressed", opt[id]));
  const t = [];
  if (opt.eco) t.push("Économie de données : qualité vidéo la plus basse.");
  if (opt.audio) t.push("Audio seul : l'image est désactivée.");
  if (t.length && !STREAM_URL) t.push("Le réglage s'appliquera dès que le direct démarrera.");
  else if (t.length && !hls) t.push("Votre navigateur choisit lui-même la qualité.");
  if ($("pstate")) $("pstate").textContent = t.join(" ");
  try { localStorage.setItem("menya-player", JSON.stringify(opt)); } catch { }
};
if (v && STREAM_URL) {
  $("off").style.display = "none";
  if (window.Hls && Hls.isSupported()) { hls = new Hls({ capLevelToPlayerSize: true }); hls.loadSource(STREAM_URL); hls.attachMedia(v); hls.on(Hls.Events.MANIFEST_PARSED, setPlayer); }
  else if (v.canPlayType("application/vnd.apple.mpegurl")) v.src = STREAM_URL;
}
["eco", "audio"].forEach(id => { if ($(id)) $(id).onclick = () => { opt[id] = !opt[id]; setPlayer(); }; });
if ($("eco") || $("audio")) setPlayer();

/* formulaires (contact, publicité) : vérification des champs puis envoi */
const mailtoLink = (sujet, d) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(sujet + " : " + (d.nom || ""))}&body=${encodeURIComponent(Object.entries(d).map(([k, x]) => k + " : " + x).join("\n"))}`;
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CHECKS = {
  nom: x => x.length >= 2 || "Indiquez votre nom (2 caractères minimum).",
  entreprise: x => x.length >= 2 || "Indiquez le nom de votre entreprise.",
  email: x => MAIL_RE.test(x) || "Saisissez une adresse e-mail valide (exemple : nom@domaine.com).",
  sujet: x => !!x || "Choisissez un sujet.",
  offre: x => !!x || "Choisissez une offre.",
  message: x => x.length >= 10 || "Votre message est trop court (10 caractères minimum)."
};
document.querySelectorAll("form[data-form]").forEach(f => {
  const m = f.querySelector(".msg"), btn = f.querySelector(".send"), label = btn.textContent;
  /* champ piège invisible : seuls les robots le remplissent */
  const hp = document.createElement("div");
  hp.className = "hp"; hp.setAttribute("aria-hidden", "true");
  hp.innerHTML = '<label>Ne pas remplir<input name="website" type="text" tabindex="-1" autocomplete="off"></label>';
  f.insertBefore(hp, btn);
  const err = (el, text) => {
    let e = f.querySelector("#err-" + el.id);
    if (!e) { e = document.createElement("small"); e.className = "err"; e.id = "err-" + el.id; el.parentNode.appendChild(e); }
    e.textContent = text || "";
    el.setAttribute("aria-invalid", !!text);
    if (text) el.setAttribute("aria-describedby", e.id); else el.removeAttribute("aria-describedby");
  };
  const check = el => { const r = (CHECKS[el.name] || (x => !!x || "Ce champ est obligatoire."))(el.value.trim()); err(el, r === true ? "" : r); return r === true; };
  const fields = () => [...f.elements].filter(x => x.required);
  fields().forEach(el => { el.addEventListener("blur", () => check(el)); el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") check(el); }); });

  f.addEventListener("submit", async e => {
    e.preventDefault();
    m.className = "msg"; m.textContent = "";
    const bad = fields().filter(el => !check(el));
    if (bad.length) { m.classList.add("error"); m.textContent = "Veuillez corriger les champs indiqués avant d'envoyer."; bad[0].focus(); return; }
    const d = Object.fromEntries(new FormData(f)), sujet = f.dataset.form;
    Object.keys(d).forEach(k => d[k] = String(d[k]).trim());
    if (d.website) { m.textContent = "Message envoyé. Merci !"; f.reset(); return; }   /* robot : on fait semblant */
    delete d.website;
    btn.disabled = true; btn.textContent = "Envoi en cours…";
    try {
      if (!CONTACT_ENDPOINT) {
        /* sans service d'envoi : ouvre la messagerie avec le message déjà rédigé */
        location.href = mailtoLink(sujet, d);
        m.textContent = "Votre messagerie s'ouvre avec le message prêt. Cliquez sur « Envoyer » dans votre messagerie pour terminer. Si rien ne s'ouvre, écrivez-nous à " + CONTACT_EMAIL + ".";
      } else {
        const r = await fetch(CONTACT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify({ _subject: "Menya Plus TV · " + sujet + " : " + (d.nom || ""), _template: "table", sujet, ...d }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok && String(j.success) !== "false") { m.textContent = "Message envoyé. Merci, nous vous répondrons bientôt !"; f.reset(); fields().forEach(el => err(el, "")); }
        else {
          /* échec : on affiche la raison donnée par le service et on propose l'envoi par messagerie */
          console.warn("Envoi refusé", r.status, j);
          m.classList.add("error");
          m.textContent = "L'envoi automatique a échoué" + (j.message ? " (" + j.message + ")" : r.status ? " (code " + r.status + ")" : "") + ". ";
          const a = document.createElement("a");
          a.href = mailtoLink(sujet, d); a.textContent = "Cliquez ici pour envoyer le message par e-mail.";
          m.appendChild(a);
        }
      }
    } catch (er) {
      console.warn("Envoi impossible", er);
      m.classList.add("error"); m.textContent = "Connexion impossible au service d'envoi. ";
      const a = document.createElement("a"); a.href = mailtoLink(sujet, d); a.textContent = "Cliquez ici pour envoyer le message par e-mail."; m.appendChild(a);
    }
    btn.disabled = false; btn.textContent = label;
  });
});
if ($("y")) $("y").textContent = now.getFullYear();

/* barre de navigation du bas (mobile) + signature du concepteur */
{
  const tabs = [["index.html", "Accueil", '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'], ["grille.html", "TV", '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/>'], ["direct.html", "Direct", '<circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6 6 0 0 0 0 9M16.5 7.5a6 6 0 0 1 0 9"/>'], ["emissions.html", "Vidéos", '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>']], cp = document.body.dataset.nav || "index.html", S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const nb = document.createElement("div"); nb.className = "bnav";
  nb.innerHTML = tabs.map(([h, n, p]) => `<a href="${h}"${h === cp ? ' aria-current="page"' : ""}><svg ${S}>${p}</svg>${n}</a>`).join("")
    + `<button type="button" id="more" aria-label="Plus de pages"><svg ${S}><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>Plus</button>`;
  document.body.appendChild(nb);
  $("more").onclick = () => document.querySelector("nav").classList.toggle("open");
  const cr = $("credit");
  if (cr && DESIGNER.name) {
    cr.innerHTML = "Site conçu par " + (DESIGNER.url ? `<a href="${esc(DESIGNER.url)}" target="_blank" rel="noopener">${esc(DESIGNER.name)}</a>` : `<strong>${esc(DESIGNER.name)}</strong>`);
    const m = document.createElement("meta"); m.name = "author"; m.content = DESIGNER.name; document.head.appendChild(m);
    console.log("%cSite conçu par " + DESIGNER.name, "color:#F5A800;font:700 14px Arial");
  }
}
