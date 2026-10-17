import { MarketplaceHarness } from '@/src/components/marketplace-harness';

export const metadata = {
  title: 'Marketplace · MERIDIA',
  description:
    'Marketplace panamericano de servicios y tareas con custodia de bloque único (96% Freelancer / 4% Meridia) y liquidación Open Payments.',
};

export default function MarketplacePage() {
  return <MarketplaceHarness />;
}
