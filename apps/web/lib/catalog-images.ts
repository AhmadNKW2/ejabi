const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&h=560&q=80`;

const FIELD_IMAGES: Record<string, string> = {
  design: img('photo-1561070791-2526d30994b5'),
  biz: img('photo-1486406146926-c627a92ad1ab'),
  fashion: img('photo-1558769132-cb1aea458c5e'),
  eng: img('photo-1503387762-592deb58ef4e'),
  edu: img('photo-1562774053-701939374585'),
  tech: img('photo-1518770660439-4636190af475'),
  tourism: img('photo-1436491865332-7a61a109cc05'),
  health: img('photo-1584982751601-97dcc096659c'),
  media: img('photo-1478737270239-2f02b77fc618'),
  law: img('photo-1436450412740-6b988f486c6b'),
  science: img('photo-1532094349884-543bc11b234d'),
};

const MAJOR_IMAGES: Record<string, string> = {
  graphic: img('photo-1561070791-2526d30994b5'),
  business: img('photo-1486406146926-c627a92ad1ab'),
  'fashion-des': img('photo-1558769132-cb1aea458c5e'),
  mecheng: img('photo-1581092160562-40aa08e78837'),
  eleceng: img('photo-1518770660439-4636190af475'),
  education: img('photo-1562774053-701939374585'),
  ai: img('photo-1677442136019-21780ecad995'),
  aviation: img('photo-1436491865332-7a61a109cc05'),
  'tourism-mgt': img('photo-1488646953014-85cb44e25828'),
  pharmacy: img('photo-1584308666744-24d5c474f2ae'),
  nursing: img('photo-1584982751601-97dcc096659c'),
  'media-st': img('photo-1478737270239-2f02b77fc618'),
  'law-st': img('photo-1436450412740-6b988f486c6b'),
  'science-st': img('photo-1532094349884-543bc11b234d'),
};

const STAGE_IMAGES: Record<string, string> = {
  diploma: img('photo-1450101215322-bf5cd27642fc'),
  bachelor: img('photo-1541339907198-e08756dedf3f'),
  master: img('photo-1524995997946-a1c2e315a42f'),
  phd: img('photo-1576086213369-97a306d36557'),
};

const FALLBACK = img('photo-1562774053-701939374585');

export function fieldImage(slug: string) {
  return FIELD_IMAGES[slug] || FALLBACK;
}

export function majorImage(slug: string) {
  return MAJOR_IMAGES[slug] || FALLBACK;
}

export function stageImage(slug: string) {
  return STAGE_IMAGES[slug] || FALLBACK;
}
