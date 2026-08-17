import { Ejabi } from '@/components/Ejabi';
import { fetchCatalog } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const catalog = await fetchCatalog();
  return <Ejabi initialCatalog={catalog} />;
}
