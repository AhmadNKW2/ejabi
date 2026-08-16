import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'uploads', 'universities');
const UA = 'EjabiCatalog/1.0 (university campus images for educational catalog)';
const SKIP = /seal|coat|logo|svg|shield|arms|flag|icon|wordmark|crest|signature/i;

const universities = [
  { slug: 'harvard', files: ['Memorial Hall Harvard University Cambridge MA.jpg', 'Harvard Yard 1.jpg', 'Widener Library.jpg'], search: 'Harvard University campus building' },
  { slug: 'asu', files: ['Old Main Arizona State University.jpg', 'Old Main (Arizona State University).jpg'], search: 'Arizona State University Tempe campus Old Main' },
  { slug: 'umich', files: ['Angell Hall.jpg', 'University of Michigan campus.jpg', 'Angell Hall University of Michigan.JPG'], search: 'University of Michigan Ann Arbor campus building' },
  { slug: 'bu', files: ['Marsh Chapel.jpg', 'Boston University Marsh Chapel.jpg'], search: 'Boston University campus Marsh Chapel' },
  { slug: 'manchester', files: ['Whitworth Hall.jpg', 'Whitworth Hall, University of Manchester.jpg'], search: 'University of Manchester Whitworth Hall campus' },
  { slug: 'leeds', files: ['Parkinson Building.jpg', 'Parkinson Building, University of Leeds.jpg'], search: 'University of Leeds Parkinson Building' },
  { slug: 'coventry', files: ['Coventry University.jpg', 'Coventry University campus.jpg'], search: 'Coventry University campus building' },
  { slug: 'westminster', files: ['University of Westminster.jpg', '309 Regent Street.jpg'], search: 'University of Westminster Regent Street building' },
  { slug: 'qu', files: ['Qatar University.jpg', 'Qatar University campus.jpg'], search: 'Qatar University campus building' },
  { slug: 'hbku', files: ['Minaretein.jpg', 'Education City Mosque.jpg', 'Hamad Bin Khalifa University.jpg'], search: 'Hamad Bin Khalifa University Education City Doha building' },
  { slug: 'cmuq', files: ['Carnegiemellonqatar building entrance.jpg'], search: 'Carnegie Mellon University Qatar campus building' },
  { slug: 'vcuq', files: ['VCU Arts Qatar.jpg'], search: 'VCU Qatar campus building' },
  { slug: 'aus', files: ['American University of Sharjah.jpg', 'AUS Main Building.jpg'], search: 'American University of Sharjah campus building' },
  { slug: 'ud', files: ['University of Dubai.jpg'], search: 'University of Dubai campus building' },
  { slug: 'hwdubai', files: ['Heriot-Watt University Dubai.jpg'], search: 'Heriot-Watt University Dubai campus building' },
  { slug: 'mdxdubai', files: ['Middlesex University Dubai.jpg'], search: 'Middlesex University Dubai campus building' },
  { slug: 'tsu', files: ['Tbilisi State University.jpg', 'Ivane Javakhishvili Tbilisi State University.jpg'], search: 'Tbilisi State University campus building' },
  { slug: 'gau', files: ['Georgian American University.jpg'], search: 'Georgian American University Tbilisi campus' },
  { slug: 'ug', files: ['University of Georgia Tbilisi.jpg'], search: 'University of Georgia Tbilisi campus building' },
  { slug: 'cug', files: ['Caucasus University.jpg'], search: 'Caucasus University Tbilisi campus building' },
  { slug: 'cairo', files: ['Cairo University.jpg', 'Cairo University campus.jpg'], search: 'Cairo University campus building' },
  { slug: 'ainshams', files: ['Ain Shams University.jpg'], search: 'Ain Shams University campus building' },
  { slug: 'guc', files: ['German University in Cairo.jpg'], search: 'German University in Cairo campus building' },
  { slug: 'auc', files: ['American University in Cairo.jpg', 'AUC campus.jpg'], search: 'American University in Cairo campus building' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wiki(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function pickImage(pages) {
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    const title = page.title || '';
    if (!info) continue;
    if (SKIP.test(title) || SKIP.test(info.url || '')) continue;
    if (!/^image\/(jpeg|png|webp)$/i.test(info.mime || '')) continue;
    if ((info.size || 0) < 20000 && !info.thumburl) continue;
    return info.thumburl || info.url;
  }
  return null;
}

async function fromFiles(names) {
  const titles = names.map((n) => `File:${n}`).join('|');
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
    '&iiprop=url|mime|size&iiurlwidth=1400&titles=' +
    encodeURIComponent(titles);
  const data = await wiki(url);
  return pickImage(Object.values(data.query?.pages || {}));
}

async function fromSearch(q) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    '&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1400&gsrsearch=' +
    encodeURIComponent(q);
  const data = await wiki(url);
  return pickImage(Object.values(data.query?.pages || {}));
}

async function fromOpenverse(q) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=8&license_type=all`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = await res.json();
  const hit = (data.results || []).find((r) => r.url && !SKIP.test(r.title || '') && !SKIP.test(r.url));
  return hit?.url || null;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4000) throw new Error(`too small ${url}`);
  writeFileSync(dest, buf);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const uni of universities) {
    const dest = join(OUT_DIR, `${uni.slug}.jpg`);
    let url = null;
    try {
      url = await fromFiles(uni.files);
    } catch (err) {
      console.warn(`${uni.slug} files failed: ${err.message}`);
    }
    await sleep(900);
    if (!url) {
      try {
        url = await fromSearch(uni.search);
      } catch (err) {
        console.warn(`${uni.slug} search failed: ${err.message}`);
      }
      await sleep(900);
    }
    if (!url) {
      try {
        url = await fromOpenverse(uni.search);
      } catch (err) {
        console.warn(`${uni.slug} openverse failed: ${err.message}`);
      }
      await sleep(400);
    }
    if (!url) {
      console.error(`MISSING ${uni.slug}`);
      continue;
    }
    try {
      await download(url, dest);
      console.log(`OK ${uni.slug} <- ${url}`);
    } catch (err) {
      console.error(`FAIL ${uni.slug}: ${err.message}`);
    }
    await sleep(400);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
