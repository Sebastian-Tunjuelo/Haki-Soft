import { MarketplaceHarness } from '@/src/components/marketplace-harness';

export const metadata = {
  title: 'Marketplace · TaskStream AI',
  description: 'Catálogo de servicios y publicaciones con custodia Open Payments.',
};

export default function MarketplacePage() {
  return <MarketplaceHarness />;
}
