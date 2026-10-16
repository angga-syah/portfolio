// Leaderboard name filter. Names are already reduced to A–Z, 0–9, space and
// ".-_" before they get here. Two tiers:
//   ANYWHERE — distinctive words, blocked even inside other text (XKONTOLX).
//   WHOLE    — short words that also occur inside innocent words, so they're
//              only blocked as a whole word (ASU yes, MASUK/KASUR/ASUS no).
// No list is complete; the admin page can delete anything that slips through.

const ANYWHERE = [
  // Indonesian / Betawi
  'anjing', 'anjg', 'anjir', 'anjrit', 'anjeng', 'bangsat', 'bangsad', 'bngst', 'bajingan', 'brengsek', 'bangke',
  'kampret', 'keparat', 'kontol', 'kntl', 'memek', 'ngentot', 'ngntt', 'ngewe', 'entot', 'pepek', 'peler', 'titit',
  'jembut', 'colmek', 'sange', 'lonte', 'pelacur', 'perek', 'jablay', 'bencong', 'banci', 'goblok', 'goblog', 'tolol',
  'idiot', 'dungu', 'kafir', 'pantek', 'pukimak', 'kimak', 'tempik', 'toket', 'bokep', 'mesum', 'cabul', 'perkosa',
  'autis', 'monyet',
  // Javanese
  'jancok', 'jancuk', 'dancok', 'diancuk', 'jamput', 'matamu', 'ndasmu', 'raimu', 'gathel', 'jembutmu', 'celeng',
  'kirik', 'pekok', 'goblug', 'turuk', 'silit', 'tempek',
  // Sundanese
  'kehed', 'belegug', 'heunceut', 'koplok', 'lebok',
  // Malay
  'bodoh', 'sundal', 'celaka',
  // English
  'fuck', 'fvck', 'fck', 'shit', 'bitch', 'btch', 'bastard', 'asshole', 'cunt', 'pussy', 'penis', 'vagina', 'boob',
  'whore', 'slut', 'porn', 'horny', 'jizz', 'wank', 'twat', 'bollock', 'motherf', 'retard', 'rapist', 'molest',
  'incest', 'dildo', 'nude', 'naked', 'onlyfans', 'blowjob', 'handjob', 'hentai', 'sexy',
  // Slurs
  'nigg', 'nigga', 'negro', 'faggot', 'tranny', 'wetback', 'gook',
  // Hate figures, groups and symbols
  'hitler', 'adolf', 'nazi', 'fuhrer', 'fuehrer', 'swastika', 'siegheil', 'kukluxklan', 'holocaust',
  'stalin', 'mussolini', 'polpot', 'kimjong', 'jongun', 'jongil', 'kimilsung', 'binladen', 'alqaeda', 'alqaida',
  'daesh', 'taliban', 'teroris', 'terrorist', 'genocide', 'genosida', 'gestapo', 'mengele', 'himmler', 'goebbels',
  'idiamin', 'amrozi', 'noordin', 'breivik', 'tarrant',
  // Drugs / gambling spam
  'narkoba', 'cocaine', 'kokain', 'heroin', 'judol', 'gacor', 'togel', 'casino', 'kasino', 'maxwin', 'http', 'www',
];

// Short or ambiguous words: blocked only when a whole word, so innocent names
// that merely contain them (SABUN, SOSIAL, PEDOMAN, GRAPE, COLIN…) still pass.
const WHOLE = [
  'asu', 'tai', 'taik', 'babi', 'ass', 'arse', 'sex', 'sux', 'fag', 'cum', 'tit', 'tits', 'dick', 'cock', 'anal',
  'nig', 'niga', 'ewe', 'mmk', 'pki', 'kkk', 'ss', 'isis', 'osama', 'reich', 'heil', 'rape', 'pedo', 'cina', 'coon',
  'paki', 'spic', 'kike', 'bomb', 'bom', 'god', 'allah', 'tuhan', 'yesus', 'jesus',
  'nabi', 'sia', 'aing', 'cuk', 'coli', 'itil', 'puki', 'sabu', 'meth', 'ganja', 'judi', 'slot', 'sial', 'haram',
  'bego', 'gelo', 'asem', 'gatel', 'setan', 'iblis', 'cacat', 'fuk', 'kontl',
];

// Leetspeak and look-alikes → letters.
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g' };

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[0-9]/g, (d) => LEET[d] ?? d)
    .replace(/ph/g, 'f')
    .replace(/(.)\1+/g, '$1'); // FUUUCK → fuk, SSSEX → sex
}

const ANY_NORM = [...new Set(ANYWHERE.map((w) => normalize(w.replace(/[^a-z]/g, ''))))].filter((w) => w.length >= 3);
const WHOLE_NORM = new Set(WHOLE.map(normalize));

/** True if the (already cleaned, uppercase) name should be rejected. */
export function isBlockedName(name: string) {
  const words = name.split(/[\s._-]+/).filter(Boolean).map(normalize);
  const joined = normalize(name.replace(/[^a-z0-9]/gi, ''));
  // Also catch names written backwards (RELTIH).
  const reversed = [...joined].reverse().join('');
  if (ANY_NORM.some((w) => joined.includes(w) || reversed.includes(w))) return true;
  if (words.some((w) => WHOLE_NORM.has(w))) return true;
  // Single letters spaced out ("K O N T O L") collapse into one word above via `joined`;
  // whole-word short terms written that way: "A S U".
  if (words.every((w) => w.length === 1) && WHOLE_NORM.has(words.join(''))) return true;
  return false;
}
