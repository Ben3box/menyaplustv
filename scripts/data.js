
/* ===== CONFIGURATION : à modifier ===== */
const STREAM_URL = "";            // lien du direct (.m3u8) fourni par votre plateforme de streaming
const CONTACT_EMAIL = "menyaplustv@gmail.com";
const CONTACT_ENDPOINT = "https://formsubmit.co/ajax/" + CONTACT_EMAIL;   // envoi direct vers l'e-mail de la TV (service FormSubmit ; activation à la 1re utilisation)

/* ===== RÉSEAUX SOCIAUX : comptes officiels de la TV (laisser "" pour masquer un réseau) ===== */
const HASHTAG = "#Menyaplustv";
const SOCIAL = {
    youtube: "https://youtube.com/@menyaplustv-p2x",
    facebook: "https://www.facebook.com/profile.php?id=61593883538607",
    x: "https://x.com/menyaplustv",
    instagram: "",   // à compléter : lien du profil Instagram de la TV
    linkedin: "",    // à compléter : lien de la page LinkedIn de la TV
    tiktok: ""       // à compléter si la TV a un compte TikTok
};
/* Rediffusion (page Direct) : par défaut, un clic sur un programme propose vos comptes SOCIAL ci-dessus.
   Pour envoyer vers la vidéo exacte d'un secteur, ajoutez ses liens ici (exemple ci-dessous) */
const REPLAY = {
    // culture: { youtube: "https://youtube.com/playlist?list=...", facebook: "https://facebook.com/.../videos/..." }
};
const YOUTUBE_CHANNEL_ID = "UCFXWCSlM2JC4oOg95Tn6Y4A";   // identifiant de la chaîne (sert à la page Actualités)
/* Classement automatique des vidéos YouTube par secteur, d'après des mots du titre (à compléter à votre guise) */
const SECTOR_KEYWORDS = {
    politique: ["assemblée", "gouvernement", "loi ", "élection", "ministre", "politi", "inama"],
    economie: ["économie", "ubukungu", "entrepren", "commerce", "agricult"],
    education: ["éducation", "école", "université", "amashuri", "élève"],
    sante: ["santé", "ubuzima", "paludisme", "hôpital", "médecin"],
    culture: ["culture", "umuco", "tambour", "danse", "tradition"],
    societe: ["famille", "société", "religion", "diaspora"],
    environnement: ["environnement", "climat", "ibidukikije", "reboisement", "pluie"],
    sport: ["sport", "football", "match", "umupira", "championnat"]
};
const PLATFORMS = { youtube: "YouTube", facebook: "Facebook", instagram: "Instagram", x: "X", linkedin: "LinkedIn", tiktok: "TikTok" };

const SECTORS = [
    { id: "politique", name: "Politique et gouvernance", d: "Institutions, élections, justice, droits du citoyen." },
    { id: "economie", name: "Économie et entrepreneuriat", d: "Emploi, commerce, agriculture, startups et marchés." },
    { id: "education", name: "Éducation et jeunesse", d: "Écoles, universités, orientation, bourses et concours." },
    { id: "sante", name: "Santé et bien-être", d: "Prévention, conseils de médecins, alertes sanitaires." },
    { id: "culture", name: "Culture et traditions", d: "Patrimoine, musique, danse, artisanat et histoire." },
    { id: "societe", name: "Société et famille", d: "Vie familiale, cohésion sociale, religion, diaspora." },
    { id: "environnement", name: "Environnement et climat", d: "Eau, reboisement, énergies, météo et biodiversité." },
    { id: "sport", name: "Sport et divertissement", d: "Matchs en direct, musique, humour, séries et jeux." }
];
/* Les émissions suivantes sont des exemples : remplacez-les par vos vraies vidéos (u = lien de la vidéo) */
/* Pour chaque émission : p = liens de la publication sur chaque réseau (laisser de côté ceux qui n'existent pas) */
const VIDEOS = [
    {
        s: "politique", t: "Assemblée nationale : adoption du projet de loi sur l'accès à l'information", d: "Actualité", u: "#", tag: "#Menyaplustv",
        p: {
            youtube: "https://youtube.com/@menyaplustv-p2x",
            instagram: "https://www.instagram.com/p/DeNOV5mOCkB/",
            x: "https://x.com/menyaplustv/status/2107805172931981487",
            facebook: "https://m.facebook.com/story.php?story_fbid=pfbid02YbJU9jKfeGmbQuN8eD4hYmQnuRru4iGso4jTt1gM9Sr4Cz1Jn8Faagj3vR2oKWCol&id=61593883538607",
            linkedin: "https://lnkd.in/p/eAQ27Kvg"
        }
    },
    { s: "politique", t: "Le débat de la semaine", d: "45 min", u: "#" },
    { s: "economie", t: "Entreprendre au pays", d: "26 min", u: "#" },
    { s: "education", t: "Orientation : choisir sa filière", d: "30 min", u: "#" },
    { s: "sante", t: "Consultation : prévenir le paludisme", d: "35 min", u: "#" },
    { s: "culture", t: "Sur les pas des tambourinaires", d: "52 min", u: "#" },
    { s: "societe", t: "Parents et adolescents : se parler", d: "40 min", u: "#" },
    { s: "environnement", t: "Reboiser nos collines", d: "24 min", u: "#" },
    { s: "sport", t: "Magazine sportif du week-end", d: "38 min", u: "#" }
];
const S = Object.fromEntries(SECTORS.map(x => [x.id, x.name]));
const GRID = {
    sem: [["06h-08h", "Matinale : infos, revue de presse, météo"], ["08h-10h", "Éducation et jeunesse"], ["10h-12h", "Santé (lun., mer.) · Environnement (mar., jeu.) · Société (ven.)"], ["12h-13h", "Journal de midi"], ["13h-15h", "Économie et entrepreneuriat"], ["15h-17h", "Culture et traditions (lun., mer., ven.) · Rediffusions"], ["17h-19h", "Sport et divertissement"], ["19h-20h", "Journal du soir"], ["20h-21h30", "Débat politique (lun., mer., jeu.) · Talk-show société (mar., ven.)"], ["21h30-23h", "Séries, films, humour"], ["23h-06h", "Rediffusions et musique"]],
    sam: [["06h-08h", "Matinale week-end"], ["08h-10h", "Éducation et jeunesse"], ["10h-12h", "Magazine santé et bien-être"], ["12h-13h", "Journal de midi"], ["13h-15h", "Environnement et climat"], ["15h-17h", "Sport en direct"], ["17h-19h", "Culture et traditions"], ["19h-20h", "Journal du soir"], ["20h-21h30", "Concert, spectacle ou festival"], ["21h30-23h", "Film ou soirée musicale"], ["23h-06h", "Rediffusions et musique"]],
    dim: [["06h-08h", "Spiritualité : émissions religieuses"], ["08h-10h", "Spiritualité et famille"], ["10h-12h", "Société et famille"], ["12h-13h", "Journal de midi"], ["13h-15h", "Rediffusion des meilleures émissions"], ["15h-17h", "Sport en direct"], ["17h-19h", "Documentaires : culture, environnement"], ["19h-20h", "Journal du soir"], ["20h-21h30", "Bilan de la semaine"], ["21h30-23h", "Film ou série"], ["23h-06h", "Rediffusions et musique"]]
};
