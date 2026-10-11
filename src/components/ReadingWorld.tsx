'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwiseIcon, ArrowsLeftRightIcon } from '@phosphor-icons/react';
import { Brand } from './Brand';

// Three.js is imported only for onboarding, after preference and capability checks.
export function ReadingWorld({
  step,
  active,
  ambient = false,
}: {
  step: number;
  active: boolean;
  ambient?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({ step, active, ambient, yaw: -0.2, pitch: 0 });
  const resume = useRef(() => {});
  const [rendered, setRendered] = useState(false);
  useEffect(() => {
    state.current.step = step;
    state.current.active = active;
    state.current.ambient = ambient;
    resume.current();
  }, [step, active, ambient]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup = () => {};
    let cancelled = false;
    let generation = 0;
    const start = async () => {
      const run = ++generation;
      cleanup();
      cleanup = () => {};
      setRendered(false);
      if (reduced.matches) return;
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection;
      if (connection?.saveData) return;
      try {
        const T = await import('three');
        if (cancelled || run !== generation) return;
        const renderer = new T.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = T.SRGBColorSpace;
        element.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('aria-hidden', 'true');
        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(35, 1, 0.1, 50);
        camera.position.set(0, 0.5, 6.5);
        camera.lookAt(0, 0, 0);
        scene.add(new T.HemisphereLight(0xfff4d7, 0x345845, 3));
        const sun = new T.DirectionalLight(0xffffff, 3);
        sun.position.set(-2, 4, 3);
        scene.add(sun);
        const book = new T.Group();
        scene.add(book);
        const green = new T.MeshStandardMaterial({
          color: 0x2f6b4f,
          roughness: 0.42,
          metalness: 0.08,
        });
        const paper = new T.MeshStandardMaterial({ color: 0xf8edcf, roughness: 0.8 });
        const gold = new T.MeshStandardMaterial({
          color: 0xeab972,
          roughness: 0.5,
          metalness: 0.25,
        });
        const geometries: import('three').BufferGeometry[] = [];
        const box = (x: number, y: number, z: number, material: import('three').Material) => {
          const geometry = new T.BoxGeometry(x, y, z);
          geometries.push(geometry);
          return new T.Mesh(geometry, material);
        };
        const left = new T.Group(),
          right = new T.Group();
        book.add(left, right);
        [left, right].forEach((wing, i) => {
          const direction = i === 0 ? -1 : 1;
          const cover = box(1.25, 1.7, 0.07, green);
          cover.position.set(direction * 0.635, 0, -0.06);
          wing.add(cover);
          const pages = box(1.19, 1.61, 0.11, paper);
          pages.position.set(direction * 0.615, 0, 0.04);
          wing.add(pages);
          for (let j = 0; j < 5; j++) {
            const line = box(0.8 - (j % 2) * 0.13, 0.018, 0.005, gold);
            line.position.set(direction * 0.62, 0.44 - j * 0.17, 0.099);
            wing.add(line);
          }
        });
        const spine = box(0.12, 1.7, 0.16, green);
        book.add(spine);
        const bookmark = box(0.15, 0.55, 0.02, gold);
        bookmark.position.set(0.73, -0.69, -0.065);
        right.add(bookmark);
        const sparkleGeometry = new T.OctahedronGeometry(0.07);
        geometries.push(sparkleGeometry);
        const sparks = Array.from({ length: 16 }, (_, i) => {
          const mesh = new T.Mesh(sparkleGeometry, i % 3 === 0 ? green : gold);
          const angle = (i * Math.PI * 2) / 16;
          mesh.position.set(
            Math.cos(angle) * (1.6 + (i % 3) * 0.15),
            Math.sin(angle) * 1.3,
            -0.4 - (i % 4) * 0.15,
          );
          scene.add(mesh);
          return mesh;
        });
        const size = () => {
          const { width, height } = element.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(size);
        observer.observe(element);
        size();
        let frame = 0,
          previous = 0,
          time = 0;
        const draw = (now: number) => {
          frame = 0;
          if (document.hidden || !state.current.active) return;
          frame = requestAnimationFrame(draw);
          if (now - previous < 1000 / 30) return;
          book.visible = !state.current.ambient;
          time += Math.min((now - previous) / 1000, 0.05);
          previous = now;
          book.rotation.y += (state.current.yaw - book.rotation.y) * 0.08;
          book.rotation.x += (state.current.pitch + 0.12 - book.rotation.x) * 0.08;
          book.rotation.z = Math.sin(time * 0.45) * 0.035;
          book.position.y = Math.sin(time * 0.8) * 0.1;
          const spread = state.current.step === 5 ? 0.12 : 0.32;
          left.rotation.y += (-spread - left.rotation.y) * 0.05;
          right.rotation.y += (spread - right.rotation.y) * 0.05;
          sparks.forEach((spark, i) => {
            spark.rotation.y = time * 0.3 + i;
            spark.position.y += Math.sin(time + i) * 0.0015;
          });
          renderer.render(scene, camera);
        };
        const restart = () => {
          if (document.hidden || !state.current.active) {
            cancelAnimationFrame(frame);
            frame = 0;
          } else if (!frame) frame = requestAnimationFrame(draw);
        };
        resume.current = restart;
        document.addEventListener('visibilitychange', restart);
        restart();
        const lost = (event: Event) => {
          event.preventDefault();
          setRendered(false);
        };
        renderer.domElement.addEventListener('webglcontextlost', lost);
        setRendered(true);
        cleanup = () => {
          cancelAnimationFrame(frame);
          resume.current = () => {};
          document.removeEventListener('visibilitychange', restart);
          observer.disconnect();
          renderer.domElement.removeEventListener('webglcontextlost', lost);
          geometries.forEach((geometry) => geometry.dispose());
          green.dispose();
          paper.dispose();
          gold.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement.remove();
        };
      } catch {
        /* Static illustration remains available when WebGL cannot start. */
      }
    };
    void start();
    const preference = () => void start();
    reduced.addEventListener('change', preference);
    return () => {
      cancelled = true;
      generation++;
      reduced.removeEventListener('change', preference);
      cleanup();
    };
  }, []);
  const drag = useRef<{ x: number; yaw: number } | null>(null);
  return (
    <div
      aria-hidden={ambient || undefined}
      className={
        ambient
          ? 'pointer-events-none absolute inset-0 opacity-15'
          : `onboarding-art relative shrink-0 overflow-hidden rounded-[32px] ${active ? 'h-56 sm:h-64' : 'hidden'}`
      }
    >
      {!rendered && !ambient && (
        <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <div className="relative rounded-[30px] bg-hl p-10 shadow-xl">
            <Brand compact />
            <span className="absolute -right-4 -top-3 text-4xl text-ac">✦</span>
          </div>
        </div>
      )}
      <div
        ref={host}
        className="absolute inset-0 touch-pan-y"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, yaw: state.current.yaw };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current)
            state.current.yaw = drag.current.yaw + (event.clientX - drag.current.x) * 0.009;
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      />
      {rendered && !ambient && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          <button
            aria-label="Turn the 3D book"
            title="Turn the book"
            onClick={() => {
              state.current.yaw += 0.7;
            }}
            className="glass grid size-11 place-items-center rounded-full"
          >
            <ArrowsLeftRightIcon size={18} />
          </button>
          <button
            aria-label="Reset the 3D book"
            title="Reset the book"
            onClick={() => {
              state.current.yaw = -0.2;
            }}
            className="glass grid size-11 place-items-center rounded-full"
          >
            <ArrowCounterClockwiseIcon size={18} />
          </button>
        </div>
      )}
      <span className="sr-only">
        An open book with floating sparks. Drag or use the turn button to explore.
      </span>
    </div>
  );
}
