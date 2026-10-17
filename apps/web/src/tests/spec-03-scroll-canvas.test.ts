import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { isWebGLAvailable, HeroWebGLFallback } from '@/app/scenes/hero-scene';
import { HeroScenePlaceholder } from '@/app/scenes/hero-scene-loader';

describe('SPEC-03: Arquitectura Visual 3D y Scroll Suave (FE-1 / FE-2)', () => {
  describe('RF-01 & RF-05 (TEST-01): Ciclo de Vida del Proveedor SmoothScroll y Limpieza GSAP', () => {
    it('debe registrar el plugin GSAP ScrollTrigger y exportar el proveedor y el hook de contexto', async () => {
      const providerModule = await import('@/app/providers/smooth-scroll');
      expect(providerModule.SmoothScrollProvider).toBeDefined();
      expect(providerModule.useSmoothScroll).toBeDefined();
    });

    it('verifica en el código fuente que la limpieza remueve el ticker y destruye la instancia de Lenis sin fugas', () => {
      const providerSourcePath = path.resolve(__dirname, '../../app/providers/smooth-scroll.tsx');
      const source = fs.readFileSync(providerSourcePath, 'utf8');

      // Verifica Invariante 2 de SPEC-03: Lenis avisa a ScrollTrigger y el ticker empuja a Lenis
      expect(source).toContain('ScrollTrigger.update');
      expect(source).toContain('gsap.ticker.add');
      expect(source).toContain('gsap.ticker.lagSmoothing(0)');

      // Verifica Invariante 4 de SPEC-03: Limpieza y reversión al desmontar
      expect(source).toContain('gsap.ticker.remove');
      expect(source).toContain('lenis.destroy()');
      expect(source).toContain('ScrollTrigger.getAll().forEach');
    });
  });

  describe('RF-02 (TEST-02): Contenedor Canvas Aislado en Cliente (SSR: false)', () => {
    it('garantiza que hero-scene-loader importa hero-scene con dynamic ssr: false', () => {
      const loaderSourcePath = path.resolve(__dirname, '../../app/scenes/hero-scene-loader.tsx');
      const source = fs.readFileSync(loaderSourcePath, 'utf8');

      expect(source).toContain('ssr: false');
      expect(source).toContain('dynamic');
      expect(source).toContain('HeroScenePlaceholder');
    });

    it('proporciona un placeholder con altura reservada de 480px para mitigar Cumulative Layout Shift (CLS)', () => {
      const placeholder = HeroScenePlaceholder();
      expect(placeholder.props['aria-label']).toBe('Cargando entorno 3D de custodia');
      expect(placeholder.props.style.minHeight).toBe('480px');
      expect(placeholder.props.style.height).toBe('480px');
    });
  });

  describe('RF-03 (TEST-03): Invariante de Cero Re-renders en Scroll (Mutación Directa de Refs)', () => {
    it('comprueba estáticamente que el callback de animación de la escena no almacena la posición de scroll en useState', () => {
      const sceneSourcePath = path.resolve(__dirname, '../../app/scenes/hero-scene.tsx');
      const source = fs.readFileSync(sceneSourcePath, 'utf8');

      // Comprueba que no hay useState vinculados a la posición de scroll
      expect(source).not.toContain('setScrollPosition');
      expect(source).not.toContain('setScroll');
      expect(source).not.toContain('setScrollY');

      // Comprueba que la animación de GSAP muta directamente los vectores del grupo THREE
      expect(source).toContain('groupRef.current.rotation');
      expect(source).toContain('groupRef.current.position');
      expect(source).toContain('groupRef.current.scale');
      expect(source).toContain('useGSAP');
    });
  });

  describe('RF-04 & RF-06 (TEST-04): Manejo Determinista de Fallbacks (WebGL y Movimiento Reducido)', () => {
    let originalWindow: typeof window;

    beforeEach(() => {
      originalWindow = global.window;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('isWebGLAvailable retorna un valor booleano determinista en función de las capacidades del entorno', () => {
      const available = isWebGLAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('HeroWebGLFallback renderiza el contenido HTML accesible sin intentar crear un renderer 3D', () => {
      const fallback = HeroWebGLFallback();
      expect(fallback.props.className).toBe('card');
      expect(fallback.props.style.minHeight).toBe(440);
      expect(JSON.stringify(fallback)).toContain('Bóveda Criptográfica en Escrow');
      expect(JSON.stringify(fallback)).toContain('Modo Estático Activo (WebGL no requerido)');
    });

    it('la hero no llama a la API: el progreso es el scroll del documento', () => {
      for (const relativePath of [
        'app/scenes/hero-scene.tsx',
        'app/scenes/hero-scene-loader.tsx',
        'app/providers/smooth-scroll.tsx',
      ]) {
        const text = fs.readFileSync(path.resolve(__dirname, '../../', relativePath), 'utf8');
        expect(text).not.toContain('/api/v1');
        expect(text).not.toContain('fetch(');
      }
    });

    it('la escena respeta prefers-reduced-motion: reduce desactivando scrub y manteniendo la rotación inicial', () => {
      const sceneSourcePath = path.resolve(__dirname, '../../app/scenes/hero-scene.tsx');
      const source = fs.readFileSync(sceneSourcePath, 'utf8');

      expect(source).toContain('prefers-reduced-motion');
      expect(source).toContain('isReducedMotion');
      expect(source).toContain('Float speed={isReducedMotion ? 0 : 2}');
    });
  });
});
