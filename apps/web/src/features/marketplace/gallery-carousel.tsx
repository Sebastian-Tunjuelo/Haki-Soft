'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { GalleryItem } from './storefront-types';
import styles from './gallery-carousel.module.css';

type AnimOpts = KeyframeAnimationOptions;

/** Abanico de imágenes (ref. PruebaAdd): hover, lightbox FLIP, tilt 3D. Sin fondo de página. */
export function GalleryCarousel({
  items,
  editable,
  onUpload,
  onRemove,
  uploading,
}: {
  items: GalleryItem[];
  editable?: boolean;
  onUpload?: (file: File) => Promise<void>;
  onRemove?: (mediaId: string) => Promise<void>;
  uploading?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openMediaId, setOpenMediaId] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const lbRef = useRef<HTMLDivElement>(null);
  const bigRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const openSlotRef = useRef<HTMLButtonElement | null>(null);
  const openHoveredRef = useRef(false);
  const busyRef = useRef(false);
  const dragEndRef = useRef(0);
  const tiltRectRef = useRef<DOMRect | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, moved: false });

  const mid = items.length <= 1 ? 0 : (items.length - 1) / 2;
  const openItem = items.find((item) => item.mediaId === openMediaId) ?? null;
  const selected =
    items.find((item) => item.mediaId === selectedId) ?? items[items.length - 1] ?? null;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (selectedId && !items.some((item) => item.mediaId === selectedId)) {
      setSelectedId(items[0]?.mediaId ?? null);
    }
  }, [items, selectedId]);

  const animOpts = useCallback((): AnimOpts => {
    return {
      duration: reduceMotion ? 0 : 450,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'both',
    };
  }, [reduceMotion]);

  const fromSlot = useCallback((slot: HTMLElement, hovered: boolean) => {
    const card = slot.querySelector(`.${styles.card}`) as HTMLElement | null;
    const big = bigRef.current;
    if (!card || !big) return 'none';
    const r = card.getBoundingClientRect();
    const b = big.getBoundingClientRect();
    const i = Number.parseFloat(slot.style.getPropertyValue('--i') || '0');
    const midVal = Number.parseFloat(slot.style.getPropertyValue('--mid') || '0');
    const stepRaw = getComputedStyle(slot).getPropertyValue('--fan-step').trim() || '8deg';
    const step = Number.parseFloat(stepRaw) || 8;
    const ang = (i - midVal) * step;
    const scale = (card.offsetWidth * (hovered ? 1.1 : 1)) / Math.max(big.offsetWidth, 1);
    const dx = r.left + r.width / 2 - (b.left + b.width / 2);
    const dy = r.top + r.height / 2 - (b.top + b.height / 2);
    return `translate(${dx}px,${dy}px) rotate(${ang}deg) scale(${scale})`;
  }, []);

  const setTilt = useCallback((rx: number, ry: number) => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    tilt.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, []);

  const resetTilt = useCallback(
    (now: boolean) => {
      const tilt = tiltRef.current;
      if (!tilt) return;
      tilt.classList.remove(styles.tiltDragging);
      tilt.style.transition = now || reduceMotion ? 'none' : 'transform .7s cubic-bezier(.2,1.5,.4,1)';
      setTilt(0, 0);
    },
    [reduceMotion, setTilt],
  );

  const closeLightbox = useCallback(() => {
    const slot = openSlotRef.current;
    const lb = lbRef.current;
    const big = bigRef.current;
    const closeBtn = closeRef.current;
    if (!slot || !lb || !big || !closeBtn || busyRef.current || !openMediaId) return;

    busyRef.current = true;
    resetTilt(true);
    const to = fromSlot(slot, false);
    const a = big.animate([{ transform: 'none' }, { transform: to }], animOpts());
    lb.animate([{ opacity: 1 }, { opacity: 0 }], animOpts());
    closeBtn.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: reduceMotion ? 0 : 150,
      fill: 'both',
    });

    a.onfinish = () => {
      [lb, big, closeBtn].forEach((el) => el.getAnimations().forEach((x) => x.cancel()));
      slot.classList.remove(styles.slotOpen);
      if (shellRef.current) shellRef.current.inert = false;
      openSlotRef.current = null;
      busyRef.current = false;
      setOpenMediaId(null);
      slot.focus({ preventScroll: true });
    };
  }, [animOpts, fromSlot, openMediaId, reduceMotion, resetTilt]);

  /** Al montar la imagen en el lightbox, anima desde el slot del abanico. */
  useEffect(() => {
    if (!openMediaId) return;
    const slot = openSlotRef.current;
    const lb = lbRef.current;
    const big = bigRef.current;
    const closeBtn = closeRef.current;
    if (!slot || !lb || !big || !closeBtn) return;

    const from = fromSlot(slot, openHoveredRef.current);
    slot.classList.add(styles.slotOpen);
    if (shellRef.current) shellRef.current.inert = true;
    lb.animate([{ opacity: 0 }, { opacity: 1 }], animOpts());
    big.animate([{ transform: from }, { transform: 'none' }], animOpts());
    closeBtn.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], animOpts());
    closeBtn.focus({ preventScroll: true });
  }, [animOpts, fromSlot, openMediaId]);

  useEffect(() => {
    if (!openMediaId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeLightbox, openMediaId]);

  function openLightbox(slot: HTMLButtonElement, mediaId: string) {
    if (openMediaId || busyRef.current) return;
    openSlotRef.current = slot;
    openHoveredRef.current = slot.matches(':hover, :focus-visible');
    setSelectedId(mediaId);
    setOpenMediaId(mediaId);
  }

  function onTiltPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const tilt = tiltRef.current;
    if (!tilt) return;
    tilt.setPointerCapture(event.pointerId);
    tiltRectRef.current = tilt.getBoundingClientRect();
    dragStartRef.current = { x: event.clientX, y: event.clientY, moved: false };
    tilt.style.transition = 'transform .12s ease-out';
    tilt.classList.add(styles.tiltDragging);
  }

  function onTiltPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const tilt = tiltRef.current;
    if (!tilt?.classList.contains(styles.tiltDragging)) return;
    const { x, y } = dragStartRef.current;
    const dx = event.clientX - x;
    const dy = event.clientY - y;
    if (Math.abs(dx) + Math.abs(dy) > 4) dragStartRef.current.moved = true;
    setTilt(-22 * Math.tanh(dy / 140), 22 * Math.tanh(dx / 140));
    const rect = tiltRectRef.current;
    if (rect) {
      tilt.style.setProperty('--gx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      tilt.style.setProperty('--gy', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    }
  }

  function endTiltDrag() {
    const tilt = tiltRef.current;
    if (!tilt?.classList.contains(styles.tiltDragging)) return;
    if (dragStartRef.current.moved) dragEndRef.current = performance.now();
    resetTilt(false);
  }

  return (
    <section className={styles.wrap}>
      <div ref={shellRef} className={styles.fanShell}>
        {items.length === 0 ? (
          <p className={styles.empty}>Aún no hay imágenes en la galería</p>
        ) : (
          <div className={styles.fan} role="list">
            {items.map((item, index) => (
              <button
                key={item.mediaId}
                type="button"
                role="listitem"
                className={styles.slot}
                style={
                  {
                    '--i': index,
                    '--mid': mid,
                  } as CSSProperties
                }
                tabIndex={0}
                aria-label={`Trabajo ${index + 1}`}
                onFocus={() => setSelectedId(item.mediaId)}
                onClick={(event) => openLightbox(event.currentTarget, item.mediaId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightbox(event.currentTarget, item.mediaId);
                  }
                }}
              >
                <div className={styles.card}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.cardImg} src={item.url} alt="" draggable={false} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <p className={styles.hint}>Pasa el mouse sobre una imagen y haz clic para ampliarla.</p>
      ) : null}

      <div
        ref={lbRef}
        className={styles.lightbox}
        role="dialog"
        aria-modal="true"
        aria-label="Imagen ampliada"
        hidden={!openMediaId}
        onClick={(event) => {
          if (performance.now() - dragEndRef.current < 300) return;
          if (stageRef.current && !stageRef.current.contains(event.target as Node)) {
            closeLightbox();
          }
        }}
      >
        <div ref={stageRef} className={styles.stage}>
          <div
            ref={tiltRef}
            className={styles.tilt}
            onPointerDown={onTiltPointerDown}
            onPointerMove={onTiltPointerMove}
            onPointerUp={endTiltDrag}
            onPointerCancel={endTiltDrag}
          >
            <div ref={bigRef} className={styles.card}>
              {openItem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.cardImg} src={openItem.url} alt="" draggable={false} />
              ) : null}
            </div>
            <div className={styles.glare} />
          </div>
          <p className={styles.tip}>Arrastra la imagen para girarla</p>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            aria-label="Cerrar"
            onClick={closeLightbox}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>
      </div>

      {editable ? (
        <div className={styles.controls}>
          <label
            className="btn btn-secondary"
            style={{ cursor: uploading || items.length >= 6 ? 'not-allowed' : 'pointer' }}
          >
            {uploading ? 'Subiendo…' : items.length >= 6 ? 'Máximo 6 imágenes' : 'Añadir imagen'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              disabled={uploading || items.length >= 6 || !onUpload}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && onUpload) void onUpload(file);
                event.target.value = '';
              }}
            />
          </label>
          {selected && onRemove ? (
            <button type="button" className="btn btn-secondary" onClick={() => void onRemove(selected.mediaId)}>
              Quitar imagen seleccionada
            </button>
          ) : null}
          <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            {items.length}/6 · abanico interactivo
          </span>
        </div>
      ) : null}
    </section>
  );
}
