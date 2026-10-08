/* Menya Plus TV : script commun à toutes les pages (données dans data.js) */
const $ = id => document.getElementById(id);
const now = new Date(), day = now.getDay(), hr = now.getHours();
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

/* programme du jour */
if ($("today")) {
  const from = Math.max(0, cur - 1);
  $("today").innerHTML = GRID[key].slice(from, from + 5).map((r, i) => {
    const on = from + i === cur;
    return `<li class="${on ? "cur" : ""}"><b>${r[0].split("-")[0]}</b><span>${r[1]}${on ? "<small>En ce moment</small>" : ""}</span></li>`;
  }).join("");
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
if (v && STREAM_URL) {
  $("off").style.display = "none";
  if (window.Hls && Hls.isSupported()) { hls = new Hls({ capLevelToPlayerSize: true }); hls.loadSource(STREAM_URL); hls.attachMedia(v); }
  else if (v.canPlayType("application/vnd.apple.mpegurl")) v.src = STREAM_URL;
}
["eco", "audio"].forEach(id => {
  if ($(id)) $(id).onclick = e => {
    const on = e.target.getAttribute("aria-pressed") !== "true";
    e.target.setAttribute("aria-pressed", on);
    if (id === "audio") v.style.visibility = on ? "hidden" : "visible";
    if (hls) hls.currentLevel = on ? 0 : -1; /* 0 = qualité la plus basse, -1 = automatique */
  };
});

/* formulaires (contact, publicité) */
document.querySelectorAll("form[data-form]").forEach(f => f.addEventListener("submit", async e => {
  e.preventDefault();
  const m = f.querySelector(".msg"), d = Object.fromEntries(new FormData(f));
  if (![...f.elements].filter(x => x.required).every(x => x.value.trim() && x.checkValidity())) { m.textContent = "Remplissez les champs obligatoires avec des informations valides."; return; }
  const sujet = f.dataset.form;
  if (!CONTACT_ENDPOINT) {
    location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(sujet + " : " + (d.nom || ""))}&body=${encodeURIComponent(Object.entries(d).map(([k, x]) => k + " : " + x).join("\n"))}`;
    return;
  }
  try {
    const r = await fetch(CONTACT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sujet, ...d }) });
    m.textContent = r.ok ? "Message envoyé. Merci !" : "L'envoi a échoué. Réessayez dans un instant.";
    if (r.ok) f.reset();
  } catch { m.textContent = "Pas de connexion. Réessayez dans un instant."; }
}));
if ($("y")) $("y").textContent = now.getFullYear();
