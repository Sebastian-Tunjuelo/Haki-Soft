import { MarketplaceHarness } from '@/src/components/marketplace-harness';

export const metadata = {
  title: 'Marketplace · TaskStream AI (SPEC-04)',
  description: 'Harness mínimo para validar el catálogo de 6 categorías, Gigs y publicaciones.',
};

export default function MarketplacePage() {
  return <MarketplaceHarness />;
}
