import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'uploads', 'universities');
const UA = 'EjabiCatalog/1.0 (university campus images; educational catalog)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const jobs = [
  { slug: 'umich', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Angell%20Hall.jpg?width=1280',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/University_of_Michigan_Museum_of_Art%2C_University_of_Michigan%2C_State_Street_and_University_Avenue%2C_Ann_Arbor%2C_MI.jpg/1280px-University_of_Michigan_Museum_of_Art%2C_University_of_Michigan%2C_State_Street_and_University_Avenue%2C_Ann_Arbor%2C_MI.jpg',
  ], search: 'University of Michigan Angell Hall campus' },
  { slug: 'manchester', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Whitworth%20Hall.jpg?width=1280',
  ], search: 'University of Manchester Whitworth Hall' },
  { slug: 'leeds', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Parkinson%20Building,%20University%20of%20Leeds.jpg?width=1280',
  ], search: 'Parkinson Building University of Leeds' },
  { slug: 'hbku', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Education%20City%20Mosque.jpg?width=1280',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Minaretein.jpg?width=1280',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Qatar%20Faculty%20of%20Islamic%20Studies.jpg?width=1280',
  ], search: 'Education City Doha mosque campus' },
  { slug: 'cmuq', urls: [
    'https://upload.wikimedia.org/wikipedia/en/b/bc/Carnegiemellonqatar_building_entrance.jpg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/LAS%20Building%20at%20Education%20City.jpg?width=1280',
  ], search: 'Carnegie Mellon Qatar Education City' },
  { slug: 'vcuq', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/VCU%20Arts%20Qatar.jpg?width=1280',
  ], search: 'VCU Qatar Education City building' },
  { slug: 'hwdubai', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Heriot-Watt%20University.jpg?width=1280',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Heriot-Watt%20University%20Edinburgh%20campus.jpg?width=1280',
  ], search: 'Heriot-Watt University campus building' },
  { slug: 'mdxdubai', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Middlesex%20University.jpg?width=1280',
    'https://commons.wikimedia.org/wiki/Special:FilePath/College%20Building,%20Middlesex%20University.jpg?width=1280',
  ], search: 'Middlesex University campus building' },
  { slug: 'tsu', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Tbilisi%20State%20University.jpg?width=1280',
    'https://commons.wikimedia.org/wiki/Special:FilePath/1st%20building%20of%20Tbilisi%20State%20University.jpg?width=1280',
  ], search: 'Tbilisi State University building' },
  { slug: 'gau', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Georgian%20American%20University.jpg?width=1280',
  ], search: 'Tbilisi university campus building' },
  { slug: 'ug', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/University%20of%20Georgia.jpg?width=1280',
  ], search: 'University of Georgia Tbilisi building' },
  { slug: 'cug', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Caucasus%20University.jpg?width=1280',
  ], search: 'Caucasus University Tbilisi' },
  { slug: 'guc', urls: [
    'https://commons.wikimedia.org/wiki/Special:FilePath/German%20University%20in%20Cairo.jpg?width=1280',
    'https://commons.wikimedia.org/wiki/Special:FilePath/GUC.jpg?width=1280',
  ], search: 'German University in Cairo campus' },
];

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'image/*,*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status}`);
  const type = res.headers.get('content-type') || '';
  if (type.includes('text/html')) throw new Error('html');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20000) throw new Error(`small ${buf.length}`);
  return buf;
}

async function openverse(q) {
  const res = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=10`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`openverse ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r) => r.url).filter(Boolean);
}

async function main() {
  for (const job of jobs) {
    let saved = false;
    for (const url of job.urls) {
      try {
        const buf = await download(url);
        writeFileSync(join(OUT, `${job.slug}.jpg`), buf);
        console.log(`OK ${job.slug} direct ${buf.length} ${url}`);
        saved = true;
        break;
      } catch (err) {
        console.warn(`${job.slug} skip ${err.message} ${url}`);
      }
      await sleep(2500);
    }
    if (!saved) {
      try {
        const urls = await openverse(job.search);
        for (const url of urls.slice(0, 5)) {
          try {
            const buf = await download(url);
            writeFileSync(join(OUT, `${job.slug}.jpg`), buf);
            console.log(`OK ${job.slug} openverse ${buf.length} ${url}`);
            saved = true;
            break;
          } catch (err) {
            console.warn(`${job.slug} ov skip ${err.message}`);
          }
          await sleep(1500);
        }
      } catch (err) {
        console.warn(`${job.slug} openverse failed ${err.message}`);
      }
    }
    if (!saved) console.error(`MISSING ${job.slug}`);
    await sleep(2000);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
