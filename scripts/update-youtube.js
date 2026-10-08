/* Récupère les dernières vidéos de la chaîne YouTube et écrit videos.json.
   Lancé automatiquement par GitHub Actions (voir .github/workflows/youtube.yml). */
const fs = require("fs");
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCFXWCSlM2JC4oOg95Tn6Y4A";
const decode = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&");

function parse(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => {
    const e = m[1], pick = re => (e.match(re) || [])[1];
    const id = pick(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    return id && { id, t: decode(pick(/<title>([^<]*)<\/title>/) || ""), date: pick(/<published>([^<]+)<\/published>/) || "" };
  }).filter(Boolean);
}
module.exports = parse;

if (require.main === module) {
  (async () => {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`);
    if (!r.ok) throw new Error("YouTube a répondu " + r.status);
    const list = parse(await r.text()).slice(0, 30);
    if (!list.length) throw new Error("Aucune vidéo trouvée : fichier laissé inchangé");
    fs.writeFileSync("videos.json", JSON.stringify(list, null, 1) + "\n");
    console.log(list.length + " vidéos enregistrées");
  })().catch(e => { console.error(e.message); process.exit(1); });
}
