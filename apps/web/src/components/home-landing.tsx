'use client';

import { type CSSProperties } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { useHomeTheme } from '@/src/lib/use-home-theme';
import styles from './home-landing.module.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '800'],
  display: 'swap',
});

function Ph({
  a,
  b,
  className,
  style,
}: {
  a: string;
  b: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={[styles.ph, className].filter(Boolean).join(' ')}
      style={{ ['--a' as string]: a, ['--b' as string]: b, ...style }}
    />
  );
}

/**
 * Réplica directa del diseño PruebaAdd/headshotly-landing.html.
 * Tema día/noche: controlado desde el Navbar (izquierda de Salir).
 */
export function HomeLanding() {
  const { theme } = useHomeTheme();

  return (
    <div className={`${styles.root} ${inter.className}`} data-theme={theme}>
      <header className={styles.hero}>
        <div className={styles.w}>
          <div className={styles.stars}>
            <i>★★★★★</i>
            <b>4.8</b> · 1,200+ reviews
          </div>
          <div className={styles.eyebrow}>Professional headshots without a studio</div>
          <h1>The AI headshot generator for professional headshots</h1>
          <p className={styles.heroS}>
            Studio-quality AI headshots in as little as 15 minutes, from a few selfies, right from home. For individuals
            or your whole team.
          </p>
          <div className={styles.checks}>
            <span>Ready in under 30 minutes</span>
            <span>No subscription</span>
            <span>100% money-back guarantee</span>
          </div>
          <div className={styles.cta}>
            <Link href="/marketplace" className={styles.btn}>
              Start now
            </Link>
            <a href="#reviews" className={styles.btnO}>
              See real before &amp; afters
            </a>
          </div>
          <p className={styles.mu} style={{ marginTop: 16, fontSize: '0.9rem' }}>
            Buying for a team?{' '}
            <a href="#pricing" style={{ textDecoration: 'underline' }}>
              See team plans
            </a>
          </p>
          <div className={styles.strip}>
            <Ph a="#e05f0a" b="#f2b27a" />
            <Ph a="#342f6b" b="#6f69c9" />
            <Ph a="#556599" b="#9fb0e6" />
            <Ph a="#516715" b="#a6c24d" />
            <Ph a="#e7995c" b="#f6d3b0" />
            <Ph a="#7a3b6f" b="#d88fcb" />
            <Ph a="#1f6f78" b="#79d2d8" />
          </div>
        </div>
      </header>

      <section className={styles.section} style={{ padding: '32px 0' }}>
        <div className={`${styles.w} ${styles.c}`}>
          <p className={styles.mu}>Trusted by 50,000+ customers</p>
          <h3 style={{ marginTop: 6 }}>From solo professionals to large companies</h3>
          <div className={styles.logos}>
            <span>Northlake</span>
            <span>Brightline</span>
            <span>PrintCo</span>
            <span>Grape&amp;Co</span>
            <span>Solvia</span>
            <span>Clinic+</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.w} ${styles.g2}`}>
          <div>
            <div className={styles.eyebrow}>The first impression</div>
            <h2>Every recruiter, client, and new hire forms their first impression from your photo.</h2>
            <p className={styles.mu} style={{ marginTop: 14 }}>
              So give them a good one. A few selfies are all it takes. Pick your favorites and use the same current
              photo on LinkedIn, your resume and your company bio that evening.
            </p>
          </div>
          <div className={styles.card}>
            <div className={styles.li}>
              <Ph a="#342f6b" b="#8a84e0" />
              <div>
                <b>Sofia Reyes</b>
                <div className={styles.mu} style={{ fontSize: '0.9rem' }}>
                  Senior Account Director · Northlake Partners
                </div>
                <div className={styles.mu} style={{ fontSize: '0.85rem' }}>
                  Austin, Texas · 500+ connections
                </div>
              </div>
            </div>
            <span className={styles.pill}>Connect</span>
            <span className={styles.pill}>Message</span>
            <span className={styles.pill} style={{ background: 'var(--ac)', color: 'var(--on)' }}>
              <b>12×</b> more clicks on LinkedIn
            </span>
          </div>
        </div>
      </section>

      <section id="how" className={styles.section} style={{ background: 'var(--soft)' }}>
        <div className={styles.w}>
          <div className={styles.c}>
            <div className={styles.eyebrow}>How it works</div>
            <h2>From selfie to studio-quality headshots, in three steps.</h2>
          </div>
          <div className={styles.g3} style={{ marginTop: 40 }}>
            <div className={styles.card}>
              <div className={styles.mini}>
                <Ph a="#556599" b="#9fb0e6" className={styles.sq} />
                <Ph a="#e7995c" b="#f6d3b0" className={styles.sq} />
                <Ph a="#516715" b="#a6c24d" className={styles.sq} />
                <Ph a="#bbb" b="#eee" className={styles.sq} />
              </div>
              <div className={styles.stepN}>STEP 01</div>
              <h3>Upload a few selfies.</h3>
              <p className={styles.mu}>From your phone or laptop. No studio, no photographer, no appointment.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.mini}>
                <Ph a="#342f6b" b="#6f69c9" className={styles.sq} />
                <Ph a="#e05f0a" b="#f2b27a" className={styles.sq} />
                <Ph a="#1f6f78" b="#79d2d8" className={styles.sq} />
                <Ph a="#7a3b6f" b="#d88fcb" className={styles.sq} />
              </div>
              <div className={styles.stepN}>STEP 02</div>
              <h3>Pick your styles (or let us pick).</h3>
              <p className={styles.mu}>
                Thousands of backdrop and outfit combinations, or tap “Choose for me”.
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.mini}>
                <Ph a="#e05f0a" b="#f2b27a" className={styles.sq} />
                <Ph a="#556599" b="#9fb0e6" className={styles.sq} />
                <Ph a="#516715" b="#a6c24d" className={styles.sq} />
                <Ph a="#342f6b" b="#6f69c9" className={styles.sq} />
              </div>
              <div className={styles.stepN}>STEP 03</div>
              <h3>Get 30 to 70 headshots in under 30 minutes.</h3>
              <p className={styles.mu}>Download single JPEGs or the full ZIP. Edit any photo. Optional 4K upscale.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className={styles.section}>
        <div className={`${styles.w} ${styles.c}`}>
          <div className={styles.eyebrow}>Customer examples</div>
          <h2>Real selfies in. Real headshots out.</h2>
          <p className={styles.mu} style={{ marginTop: 10 }}>
            Every photo is made from a single selfie. This is the quality you can expect.
          </p>
          <div className={styles.ba}>
            <Ph a="#9a9a9a" b="#d0d0d0" />
            <Ph a="#342f6b" b="#6f69c9" />
            <Ph a="#e05f0a" b="#f2b27a" />
            <Ph a="#556599" b="#9fb0e6" />
            <Ph a="#516715" b="#a6c24d" />
          </div>
          <p className={styles.mu} style={{ marginTop: 12, fontSize: '0.85rem' }}>
            Their selfie → their results
          </p>
        </div>
      </section>

      <section className={styles.section} style={{ background: 'var(--soft)' }}>
        <div className={styles.w}>
          <div className={styles.c}>
            <div className={styles.eyebrow}>Features</div>
            <h2>How our generator creates photos that look like you</h2>
          </div>
          <div className={styles.feat}>
            <div className={styles.card}>
              <h3>A few selfies in. 30 to 70 headshots out.</h3>
              <ul>
                <li>
                  <b>We never train AI on your photos</b> · used once, then deleted
                </li>
                <li>
                  <b>Ready in as little as 15 minutes</b>
                </li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3>Thousands of looks. Pick yours.</h3>
              <ul>
                <li>
                  <b>Not locked to one look</b> · swap backdrops or outfits later
                </li>
                <li>
                  <b>Outfits for every job</b> · suits, blouses, scrubs, casual
                </li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3>Ready for LinkedIn, your resume, anywhere.</h3>
              <ul>
                <li>
                  <b>Logo + text overlay</b> · brand your photos
                </li>
                <li>
                  <b>One-click crop</b> · LinkedIn, Slack, email or print
                </li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3>Don’t love one? Change it and try again.</h3>
              <ul>
                <li>
                  <b>Edit credits per person</b> · swap outfits, remove blemishes
                </li>
                <li>
                  <b>100% money-back guarantee</b> · no expiry
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className={styles.section}>
        <div className={styles.w}>
          <div className={styles.c}>
            <h2>Built for one professional. Or a thousand.</h2>
          </div>
          <div className={styles.g3} style={{ marginTop: 36 }}>
            <div className={styles.card}>
              <div className={styles.mu}>For individuals · 1 person</div>
              <div className={styles.priceBig}>From $29</div>
              <p className={styles.mu}>Pay once, no subscription. Dozens of headshots in under 30 minutes.</p>
              <p style={{ marginTop: 16 }}>
                <Link href="/marketplace" className={styles.btn}>
                  Get started
                </Link>
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.mu}>For teams · 5 to 1,000</div>
              <div className={styles.priceBig}>Credits + discounts</div>
              <p className={styles.mu}>
                Admins set the style, members upload from any device. Volume discounts included.
              </p>
              <p style={{ marginTop: 16 }}>
                <a href="#pricing" className={styles.btnO}>
                  See team plans
                </a>
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.mu}>For enterprise · 1,000+</div>
              <div className={styles.priceBig}>SSO, DPA, custom</div>
              <p className={styles.mu}>SAML SSO, custom email templates and phased rollout across offices.</p>
              <p style={{ marginTop: 16 }}>
                <Link href="/sign-up" className={styles.btnO}>
                  Talk to sales
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.w}>
          <div className={styles.band}>
            <div className={styles.eyebrow}>100% realism guaranteed</div>
            <h2>96.7% customer satisfaction, backed by a money-back guarantee.</h2>
            <p style={{ marginTop: 10, opacity: 0.85 }}>No questions asked. Based on 40,000+ purchases.</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.w}>
          <div className={styles.c}>
            <div className={styles.eyebrow}>Customer stories</div>
            <h2>Hear from customers like you.</h2>
          </div>
          <div className={styles.g3} style={{ marginTop: 36 }}>
            <div className={`${styles.card} ${styles.q}`}>
              <h3>“The headshots are excellent, the process couldn’t be easier.”</h3>
              <p className={styles.mu}>Great support and a product that keeps getting better.</p>
              <div className={styles.li}>
                <Ph a="#342f6b" b="#8a84e0" />
                <div>
                  <b>Alex Morgan</b>
                  <div className={styles.mu} style={{ fontSize: '0.85rem' }}>
                    Sales Director
                  </div>
                </div>
              </div>
            </div>
            <div className={`${styles.card} ${styles.q}`}>
              <h3>“We struggled to keep headshots consistent across offices.”</h3>
              <p className={styles.mu}>Now every location shares the same polished style.</p>
              <div className={styles.li}>
                <Ph a="#e05f0a" b="#f2b27a" />
                <div>
                  <b>Jordan Lee</b>
                  <div className={styles.mu} style={{ fontSize: '0.85rem' }}>
                    Content Strategy Lead
                  </div>
                </div>
              </div>
            </div>
            <div className={`${styles.card} ${styles.q}`}>
              <h3>“Simple and cost-effective to get consistent photos.”</h3>
              <p className={styles.mu}>Every team member gets a professional headshot in minutes.</p>
              <div className={styles.li}>
                <Ph a="#1f6f78" b="#79d2d8" />
                <div>
                  <b>Sam Rivera</b>
                  <div className={styles.mu} style={{ fontSize: '0.85rem' }}>
                    VP of Marketing
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ background: 'var(--soft)' }}>
        <div className={styles.w}>
          <div className={styles.c}>
            <h2>AI headshots vs. a studio shoot</h2>
            <p className={styles.mu} style={{ margin: '10px 0 28px' }}>
              Both get you a professional photo. They just ask different things of you first.
            </p>
          </div>
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th />
                  <th>Studio shoot</th>
                  <th>Headshotly</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cost</td>
                  <td>$300–$800 per session</td>
                  <td>From $29, one time</td>
                </tr>
                <tr>
                  <td>Time</td>
                  <td>Booked weeks out</td>
                  <td>Done in 15–30 minutes</td>
                </tr>
                <tr>
                  <td>Location</td>
                  <td>Travel to the studio</td>
                  <td>From anywhere, any device</td>
                </tr>
                <tr>
                  <td>Variations</td>
                  <td>One outfit, one backdrop</td>
                  <td>30–70 headshots, many styles</td>
                </tr>
                <tr>
                  <td>Redo</td>
                  <td>Re-book and pay again</td>
                  <td>Free retry + money-back guarantee</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="faq" className={styles.section}>
        <div className={`${styles.w} ${styles.faq}`} style={{ maxWidth: 760 }}>
          <div className={styles.c}>
            <h2>Frequently asked questions</h2>
          </div>
          <details>
            <summary>How much do professional headshots cost?</summary>
            <p>
              Individual packages start at $29. Teams buy credits with volume discounts, and credits never expire.
            </p>
          </details>
          <details>
            <summary>Is there a subscription?</summary>
            <p>No. Individuals pay once. Teams buy credits as needed.</p>
          </details>
          <details>
            <summary>How does the AI headshot generator work?</summary>
            <p>
              Upload a handful of selfies, choose your styles, and get a full set of headshots to keep, edit or
              download.
            </p>
          </details>
          <details>
            <summary>Are AI headshots good enough for LinkedIn?</summary>
            <p>Yes. A LinkedIn optimizer crops to the exact dimensions the platform expects.</p>
          </details>
          <details>
            <summary>Do AI headshots look fake?</summary>
            <p>
              Current models produce natural results. If yours doesn’t look like you, the money-back guarantee covers
              it.
            </p>
          </details>
          <details>
            <summary>Do you train AI on my photos?</summary>
            <p>No. Input photos are deleted automatically 30 days after generation.</p>
          </details>
        </div>
      </section>

      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.w}>
          <div className={`${styles.final} ${styles.c}`}>
            <h2>Get your professional AI headshots today.</h2>
            <p className={styles.mu} style={{ margin: '12px 0 24px' }}>
              Join thousands of professionals. Get yours in under 30 minutes, with money back if it doesn’t look like
              you.
            </p>
            <div className={styles.cta}>
              <Link href="/marketplace" className={styles.btn}>
                Start now
              </Link>
              <a href="#pricing" className={styles.btnO}>
                See pricing
              </a>
            </div>
            <p className={styles.mu} style={{ marginTop: 14, fontSize: '0.85rem' }}>
              No subscription · 100% money-back, no questions asked
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
