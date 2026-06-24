import { Suspense, lazy, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Database,
  Layers,
  ListChecks,
  Moon,
  Sparkles,
  Sun,
  Workflow,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useThemeStore } from "../store/themeStore";

const Hero3D = lazy(() =>
  import("../components/Landing/Hero3D").then((m) => ({ default: m.Hero3D })),
);

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: Workflow,
    title: "Step-through query plans",
    body: "Watch SQLite's EXPLAIN QUERY PLAN as an animated tree. Click any node to see why it's there.",
  },
  {
    icon: Layers,
    title: "Compare two queries side-by-side",
    body: "Run a rewrite next to the original. Diff rings highlight what changed in the plan.",
  },
  {
    icon: ListChecks,
    title: "Rule-based performance tips",
    body: "Spot full scans, sort B-trees, and correlated subqueries. Get a copy-pasteable CREATE INDEX.",
  },
  {
    icon: Database,
    title: "Four real-shaped datasets",
    body: "E-commerce, music, employees, social. ERD on demand, schema-aware autocomplete.",
  },
  {
    icon: Sparkles,
    title: "Nine hand-picked challenges",
    body: "Easy to hard, validated against a live solution query. Hints, attempts, best-time tracked.",
  },
];

export default function Landing() {
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const featuresRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Show everything immediately, no smooth-scroll, no reveals.
      return undefined;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);
    ScrollTrigger.refresh();

    const ctx = gsap.context(() => {
      const cards = featuresRef.current?.querySelectorAll("[data-feature]");
      if (!cards) return;
      cards.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    }, featuresRef);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg-primary text-text-primary">
      <a
        href="#features"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-border/40 bg-bg-primary/70 px-6 py-3 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Database size={16} />
          </div>
          <span className="font-display text-sm font-bold tracking-tight">SQLViz</span>
        </Link>
        <nav className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-elevated text-text-muted transition-colors hover:border-border-glow hover:text-text-primary"
          >
            {themeMode === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <Link
            to="/play"
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all hover:bg-accent/90"
          >
            Open playground
            <ArrowRight size={13} />
          </Link>
        </nav>
      </header>

      <section className="relative flex min-h-[100vh] items-center justify-center px-6 pt-24">
        <div className="pointer-events-none absolute inset-0">
          <Suspense fallback={null}>
            <Hero3D />
          </Suspense>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-bg-elevated/60 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-text-muted backdrop-blur">
            <Sparkles size={11} className="text-accent" /> In-browser · zero backend
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Write SQL.{" "}
            <span className="bg-gradient-to-r from-accent via-cyan-400 to-accent bg-clip-text text-transparent">
              See it run.
            </span>{" "}
            Understand <em className="not-italic text-accent">why.</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-text-muted sm:text-lg">
            SQLViz is a SQL playground that runs SQLite right in your browser, visualizes
            the query plan step by step, and shows you what's slow before it ever
            hits production.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/play"
              className="group flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:bg-accent/90"
            >
              Launch the playground
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <a
              href="#features"
              className="rounded-md border border-border bg-bg-elevated/70 px-5 py-2.5 text-sm font-medium text-text-muted backdrop-blur transition-colors hover:border-border-glow hover:text-text-primary"
            >
              See what's inside
            </a>
          </div>
        </div>
      </section>

      <section
        id="features"
        ref={featuresRef}
        className="mx-auto max-w-6xl px-6 py-32"
      >
        <div className="mx-auto max-w-2xl text-center" data-feature>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Built to teach you why a query is slow.
          </h2>
          <p className="mt-4 text-text-muted">
            The playground sells itself the moment you click Run. Here's what makes
            it worth your bookmark bar.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              data-feature
              className="rounded-2xl border border-border bg-bg-elevated/60 p-6 backdrop-blur transition-colors hover:border-border-glow"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Icon size={18} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-sm text-text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-32">
        <div
          data-feature
          className="overflow-hidden rounded-3xl border border-border bg-bg-elevated/60 p-8 backdrop-blur sm:p-12"
        >
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-accent">
                Signature
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
                The plan visualization is the point.
              </h2>
              <p className="mt-4 text-text-muted">
                Every query you run gets a hand-drawn execution tree. Color-coded by
                node type, scaled by row estimate, with curved edges that animate in
                execution order. Click any node to see why SQLite chose it. Step
                through, compare rewrites side-by-side, and let the rule-based
                analyzer tell you what to fix.
              </p>
              <Link
                to="/play"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent/80"
              >
                Try a query now
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              {[
                { label: "SCAN", color: "#8B5CF6" },
                { label: "SEARCH", color: "#06B6D4" },
                { label: "SORT", color: "#F97316" },
                { label: "JOIN", color: "#EC4899" },
                { label: "SUBQUERY", color: "#6366F1" },
                { label: "CTE", color: "#14B8A6" },
              ].map((n) => (
                <div
                  key={n.label}
                  className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-3 py-2.5"
                  style={{ color: n.color }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: n.color }}
                  />
                  <span className="text-text-primary">{n.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-32 text-center">
        <div data-feature>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to look at your next query differently?
          </h2>
          <p className="mt-4 text-text-muted">
            No accounts. No backend. Your SQL stays in your browser.
          </p>
          <Link
            to="/play"
            className="group mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:bg-accent/90"
          >
            Open the playground
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-text-muted sm:flex-row">
          <span>
            SQLViz — an in-browser SQL playground with a query plan visualizer.
          </span>
          <span className="font-mono">SQLite via sql.js · WebAssembly</span>
        </div>
      </footer>
    </div>
  );
}
