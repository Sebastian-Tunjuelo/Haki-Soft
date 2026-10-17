import Link from 'next/link';
import {
  Wallet,
  ArrowLeftRight,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { HeroWalletStage } from '@/src/components/home/hero-wallet-stage';
import { LandingAvatarStrip, LandingModules } from '@/src/components/home/landing-modules';
import { PageReveal } from '@/src/components/page-reveal';

export default function HomePage() {
  return (
    <PageReveal className="ts-page ts-page--landing">
      <header className="ld-hero ts-reveal">
        <div className="ld-hero__grid">
          <div className="ld-hero__copy">
            <div className="ld-stars">
              <i>★★★★★</i>
              <b>Open Payments</b>
              <span className="ld-muted">· escrow · GNAP · 96/4</span>
            </div>

            <p className="ts-eyebrow">
              <Sparkles size={16} />
              <span>TaskStream AI · custodia sin fricción</span>
            </p>

            <h1 className="ts-title">
              El marketplace con escrow{' '}
              <span className="ts-title__accent">Open Payments</span>
            </h1>

            <p className="ts-lead">
              Publica, negocia y cobra con custodia GNAP: liberación 96/4, preview protegido y
              revisión IA en imagen y texto — sin esperas de 14 días.
            </p>

            <div className="ld-checks">
              <span>Custodia 100% en escrow</span>
              <span>Sin suscripción</span>
              <span>Reembolso 100% si aplica</span>
            </div>

            <div className="ld-cta">
              <Link href="/onboarding/wallet" className="btn btn-primary">
                <Wallet size={17} />
                <span>Verificar billetera</span>
                <ArrowRight size={15} />
              </Link>
              <Link href="/settings/mode" className="btn btn-secondary">
                <ArrowLeftRight size={17} />
                <span>Modo Buyer / Seller</span>
              </Link>
              <a href="#how" className="btn btn-outline">
                <Layers size={17} />
                <span>Cómo funciona</span>
              </a>
            </div>

            <p className="ld-muted ld-sm" style={{ marginTop: 16 }}>
              ¿Ya tienes cuenta?{' '}
              <Link href="/marketplace" style={{ textDecoration: 'underline' }}>
                Ir al marketplace
              </Link>
            </p>

            <LandingAvatarStrip />
          </div>

          <div className="ts-reveal ld-hero__stage">
            <HeroWalletStage />
          </div>
        </div>
      </header>

      <LandingModules />
    </PageReveal>
  );
}
