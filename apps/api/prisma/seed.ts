import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

const uniImage = (slug: string) => `/uploads/universities/${slug}.jpg`;

const countries = [
  { slug: 'usa', iso2: 'US', labelAr: 'أميركا', labelEn: 'United States', sortOrder: 1 },
  { slug: 'uk', iso2: 'GB', labelAr: 'بريطانيا', labelEn: 'United Kingdom', sortOrder: 2 },
  { slug: 'qatar', iso2: 'QA', labelAr: 'قطر', labelEn: 'Qatar', sortOrder: 3 },
  { slug: 'uae', iso2: 'AE', labelAr: 'الامارات', labelEn: 'United Arab Emirates', sortOrder: 4 },
  { slug: 'georgia', iso2: 'GE', labelAr: 'جورجيا', labelEn: 'Georgia', sortOrder: 5 },
  { slug: 'egypt', iso2: 'EG', labelAr: 'مصر', labelEn: 'Egypt', sortOrder: 6 },
];

const fields = [
  { slug: 'design', labelAr: 'التصميم الجرافيكي', labelEn: 'Graphic Design', icon: '', sortOrder: 1 },
  { slug: 'biz', labelAr: 'الأعمال', labelEn: 'Business', icon: '', sortOrder: 2 },
  { slug: 'fashion', labelAr: 'الأزياء', labelEn: 'Fashion', icon: '', sortOrder: 3 },
  { slug: 'eng', labelAr: 'الهندسة', labelEn: 'Engineering', icon: '', sortOrder: 4 },
  { slug: 'edu', labelAr: 'التعليم', labelEn: 'Education', icon: '', sortOrder: 5 },
  { slug: 'tech', labelAr: 'التكنولوجيا', labelEn: 'Technology', icon: '', sortOrder: 6 },
  { slug: 'tourism', labelAr: 'السياحة', labelEn: 'Tourism', icon: '', sortOrder: 7 },
  { slug: 'health', labelAr: 'الصحة', labelEn: 'Health', icon: '', sortOrder: 8 },
  { slug: 'media', labelAr: 'الإعلام', labelEn: 'Media', icon: '', sortOrder: 9 },
  { slug: 'law', labelAr: 'القانون', labelEn: 'Law', icon: '', sortOrder: 10 },
  { slug: 'science', labelAr: 'العلوم', labelEn: 'Science', icon: '', sortOrder: 11 },
];

const majors = [
  { slug: 'graphic', field: 'design', labelAr: 'تصميم جرافيك', labelEn: 'Graphic Design', icon: '', base: 28000, sortOrder: 1 },
  { slug: 'business', field: 'biz', labelAr: 'إدارة أعمال', labelEn: 'Business Administration', icon: '', base: 32000, sortOrder: 1 },
  { slug: 'fashion-des', field: 'fashion', labelAr: 'تصميم أزياء', labelEn: 'Fashion Design', icon: '', base: 30000, sortOrder: 1 },
  { slug: 'mecheng', field: 'eng', labelAr: 'هندسة ميكانيكية', labelEn: 'Mechanical Engineering', icon: '', base: 34000, sortOrder: 1 },
  { slug: 'eleceng', field: 'eng', labelAr: 'هندسة كهرباء', labelEn: 'Electrical Engineering', icon: '', base: 34000, sortOrder: 2 },
  { slug: 'education', field: 'edu', labelAr: 'علوم التربية', labelEn: 'Education', icon: '', base: 22000, sortOrder: 1 },
  { slug: 'ai', field: 'tech', labelAr: 'ذكاء اصطناعي', labelEn: 'Artificial Intelligence', icon: '', base: 38000, sortOrder: 1 },
  { slug: 'aviation', field: 'tourism', labelAr: 'طيران', labelEn: 'Aviation', icon: '', base: 45000, sortOrder: 1 },
  { slug: 'tourism-mgt', field: 'tourism', labelAr: 'إدارة سياحة', labelEn: 'Tourism Management', icon: '', base: 24000, sortOrder: 2 },
  { slug: 'pharmacy', field: 'health', labelAr: 'صيدلة', labelEn: 'Pharmacy', icon: '', base: 40000, sortOrder: 1 },
  { slug: 'nursing', field: 'health', labelAr: 'تمريض', labelEn: 'Nursing', icon: '', base: 30000, sortOrder: 2 },
  { slug: 'media-st', field: 'media', labelAr: 'إعلام', labelEn: 'Media Studies', icon: '', base: 26000, sortOrder: 1 },
  { slug: 'law-st', field: 'law', labelAr: 'قانون', labelEn: 'Law', icon: '', base: 30000, sortOrder: 1 },
  { slug: 'science-st', field: 'science', labelAr: 'علوم عامة', labelEn: 'General Science', icon: '', base: 25000, sortOrder: 1 },
];

const countryPriceFactor: Record<string, number> = {
  usa: 1,
  uk: 0.75,
  qatar: 0.55,
  uae: 0.5,
  georgia: 0.18,
  egypt: 0.12,
};

const stages = [
  { slug: 'diploma', labelAr: 'دبلوم', labelEn: 'Diploma', icon: '', years: 2, sortOrder: 1 },
  { slug: 'bachelor', labelAr: 'بكالوريوس', labelEn: 'Bachelor', icon: '', years: 4, sortOrder: 2 },
  { slug: 'master', labelAr: 'ماجستير', labelEn: 'Master', icon: '', years: 2, sortOrder: 3 },
  { slug: 'phd', labelAr: 'دكتوراه', labelEn: 'PhD', icon: '', years: 4, sortOrder: 4 },
];

const universities: Record<string, { slug: string; labelAr: string; labelEn: string; logoUrl: string }[]> = {
  usa: [
    { slug: 'harvard', labelAr: 'جامعة هارفارد', labelEn: 'Harvard University', logoUrl: uniImage('harvard') },
    { slug: 'asu', labelAr: 'جامعة أريزونا الحكومية', labelEn: 'Arizona State University', logoUrl: uniImage('asu') },
    { slug: 'umich', labelAr: 'جامعة ميشيغن', labelEn: 'University of Michigan', logoUrl: uniImage('umich') },
    { slug: 'bu', labelAr: 'جامعة بوسطن', labelEn: 'Boston University', logoUrl: uniImage('bu') },
  ],
  uk: [
    { slug: 'manchester', labelAr: 'جامعة مانشستر', labelEn: 'University of Manchester', logoUrl: uniImage('manchester') },
    { slug: 'leeds', labelAr: 'جامعة ليدز', labelEn: 'University of Leeds', logoUrl: uniImage('leeds') },
    { slug: 'coventry', labelAr: 'جامعة كوفنتري', labelEn: 'Coventry University', logoUrl: uniImage('coventry') },
    { slug: 'westminster', labelAr: 'جامعة وستمنستر', labelEn: 'University of Westminster', logoUrl: uniImage('westminster') },
  ],
  qatar: [
    { slug: 'qu', labelAr: 'جامعة قطر', labelEn: 'Qatar University', logoUrl: uniImage('qu') },
    { slug: 'hbku', labelAr: 'جامعة حمد بن خليفة', labelEn: 'Hamad Bin Khalifa University', logoUrl: uniImage('hbku') },
    { slug: 'cmuq', labelAr: 'كارنيغي ميلون - قطر', labelEn: 'Carnegie Mellon Qatar', logoUrl: uniImage('cmuq') },
    { slug: 'vcuq', labelAr: 'جامعة فرجينيا كومنولث - قطر', labelEn: 'VCU Qatar', logoUrl: uniImage('vcuq') },
  ],
  uae: [
    { slug: 'aus', labelAr: 'الجامعة الأمريكية في الشارقة', labelEn: 'American University of Sharjah', logoUrl: uniImage('aus') },
    { slug: 'ud', labelAr: 'جامعة دبي', labelEn: 'University of Dubai', logoUrl: uniImage('ud') },
    { slug: 'hwdubai', labelAr: 'جامعة هيريوت وات - دبي', labelEn: 'Heriot-Watt Dubai', logoUrl: uniImage('hwdubai') },
    { slug: 'mdxdubai', labelAr: 'جامعة ميدلسكس - دبي', labelEn: 'Middlesex University Dubai', logoUrl: uniImage('mdxdubai') },
  ],
  georgia: [
    { slug: 'tsu', labelAr: 'جامعة تبليسي الحكومية', labelEn: 'Tbilisi State University', logoUrl: uniImage('tsu') },
    { slug: 'gau', labelAr: 'الجامعة الجورجية الأمريكية', labelEn: 'Georgian American University', logoUrl: uniImage('gau') },
    { slug: 'ug', labelAr: 'جامعة جورجيا (تبليسي)', labelEn: 'University of Georgia Tbilisi', logoUrl: uniImage('ug') },
    { slug: 'cug', labelAr: 'جامعة القوقاز', labelEn: 'Caucasus University', logoUrl: uniImage('cug') },
  ],
  egypt: [
    { slug: 'cairo', labelAr: 'جامعة القاهرة', labelEn: 'Cairo University', logoUrl: uniImage('cairo') },
    { slug: 'ainshams', labelAr: 'جامعة عين شمس', labelEn: 'Ain Shams University', logoUrl: uniImage('ainshams') },
    { slug: 'guc', labelAr: 'الجامعة الألمانية بالقاهرة', labelEn: 'German University in Cairo', logoUrl: uniImage('guc') },
    { slug: 'auc', labelAr: 'الجامعة الأمريكية بالقاهرة', labelEn: 'American University in Cairo', logoUrl: uniImage('auc') },
  ],
};

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ejabi.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const countryRows = [];
  for (const c of countries) {
    countryRows.push(
      await prisma.country.upsert({
        where: { slug: c.slug },
        update: {
          iso2: c.iso2,
          labelAr: c.labelAr,
          labelEn: c.labelEn,
          sortOrder: c.sortOrder,
          isActive: true,
        },
        create: c,
      }),
    );
  }
  const countryBySlug = Object.fromEntries(countryRows.map((c) => [c.slug, c]));

  const fieldRows = [];
  for (const f of fields) {
    fieldRows.push(
      await prisma.field.upsert({
        where: { slug: f.slug },
        update: { labelAr: f.labelAr, labelEn: f.labelEn, icon: f.icon, sortOrder: f.sortOrder, isActive: true },
        create: f,
      }),
    );
  }
  const fieldBySlug = Object.fromEntries(fieldRows.map((f) => [f.slug, f]));

  const majorRows = [];
  for (const m of majors) {
    const fieldId = fieldBySlug[m.field].id;
    const { field, base, ...data } = m;
    majorRows.push(
      await prisma.major.upsert({
        where: { slug: m.slug },
        update: {
          fieldId,
          labelAr: m.labelAr,
          labelEn: m.labelEn,
          icon: m.icon,
          isCustom: false,
          sortOrder: m.sortOrder,
          isActive: true,
        },
        create: { ...data, fieldId },
      }),
    );
  }
  await prisma.major.updateMany({ where: { isCustom: true }, data: { isActive: false } });
  const majorBySlug = Object.fromEntries(majorRows.map((m) => [m.slug, m]));

  const stageRows = [];
  for (const s of stages) {
    stageRows.push(
      await prisma.stage.upsert({
        where: { slug: s.slug },
        update: { labelAr: s.labelAr, labelEn: s.labelEn, icon: s.icon, years: s.years, sortOrder: s.sortOrder, isActive: true },
        create: s,
      }),
    );
  }

  const stageBySlug = Object.fromEntries(stageRows.map((s) => [s.slug, s]));
  const stageSets = [
    ['bachelor', 'master', 'phd'],
    ['diploma', 'bachelor'],
    ['bachelor', 'master'],
    ['diploma', 'bachelor', 'master', 'phd'],
  ];
  const stageCostFactor: Record<string, number> = {
    diploma: 0.55,
    bachelor: 1,
    master: 0.72,
    phd: 1.35,
  };

  const universityRows = [];
  for (const [countrySlug, list] of Object.entries(universities)) {
    const country = countryBySlug[countrySlug];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      universityRows.push(
        await prisma.university.upsert({
          where: { countryId_slug: { countryId: country.id, slug: u.slug } },
          update: { labelAr: u.labelAr, labelEn: u.labelEn, logoUrl: u.logoUrl, sortOrder: i + 1, isActive: true },
          create: {
            slug: u.slug,
            labelAr: u.labelAr,
            labelEn: u.labelEn,
            logoUrl: u.logoUrl,
            countryId: country.id,
            sortOrder: i + 1,
          },
        }),
      );
    }
  }

  await prisma.universityMajorStage.deleteMany();
  await prisma.universityMajor.deleteMany();
  console.log('Seeding university majors and prices...');

  const majorLinks: { universityId: string; majorId: string }[] = [];
  const stagePrices: { universityId: string; majorId: string; stageId: string; costUsd: number }[] = [];

  for (let i = 0; i < universityRows.length; i++) {
    const uni = universityRows[i];
    const countrySlug = Object.keys(countryBySlug).find((slug) => countryBySlug[slug].id === uni.countryId)!;
    const factor = countryPriceFactor[countrySlug] ?? 1;

    for (let mi = 0; mi < majors.length; mi++) {
      const m = majors[mi];
      const major = majorBySlug[m.slug];
      const offeredStages = stageSets[(i + mi) % stageSets.length].map((slug) => stageBySlug[slug]);
      majorLinks.push({ universityId: uni.id, majorId: major.id });
      for (const stage of offeredStages) {
        const costUsd = Math.round((m.base * factor * (stageCostFactor[stage.slug] ?? 1)) / 500) * 500;
        stagePrices.push({ universityId: uni.id, majorId: major.id, stageId: stage.id, costUsd });
      }
    }
  }

  await prisma.universityMajor.createMany({ data: majorLinks, skipDuplicates: true });
  await prisma.universityMajorStage.createMany({ data: stagePrices, skipDuplicates: true });

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'ADMIN', fullName: 'مدير النظام' },
    create: {
      email: adminEmail,
      passwordHash,
      fullName: 'مدير النظام',
      role: 'ADMIN',
    },
  });

  console.log('Seed complete. Admin:', adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
