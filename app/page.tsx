import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ScanEye,
  Palette,
  Leaf,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI idea assistant",
    description:
      "Describe your idea in plain English and let AI turn it into a workable 3D concept in minutes.",
  },
  {
    icon: ScanEye,
    title: "Image to 3D",
    description:
      "Upload reference photos and generate an editable 3D model ready for iteration.",
  },
  {
    icon: Palette,
    title: "Full customization",
    description:
      "Adjust colors, materials, and dimensions in real time before you send anything to production.",
  },
];

const steps = [
  { title: "Describe or upload", body: "Start from a sketch, a photo, or a plain-text brief." },
  { title: "Refine in the studio", body: "Iterate on geometry, materials, and scale with AI assistance." },
  { title: "Send to manufacturing", body: "Export production-ready files or order a run directly." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ink-900 text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-brand-400" strokeWidth={2.25} />
          <span className="text-lg font-bold tracking-tight">Verdant Ideas</span>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium text-white/70 sm:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <Link href="/dashboard/billing" className="transition hover:text-white">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-white/80 transition hover:text-white sm:block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-900/30 transition hover:bg-brand-500"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 text-center sm:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(44,143,95,0.25),_transparent_65%)]"
        />

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          Now generating 3D concepts in minutes
        </div>

        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
          Turn your ideas into
          <span className="text-brand-400"> manufacturable reality</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Upload a photo, describe a concept, or sketch it out. Verdant Ideas uses AI to build
          editable 3D models you can refine and prepare for production.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-950/40 transition hover:bg-brand-500"
          >
            Start creating free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/5"
          >
            Log in
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> No credit card required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Cancel anytime
          </span>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/15">
                <Icon className="h-5 w-5 text-brand-400" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/55">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-14 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-400">
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From concept to production, in three steps
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-brand-500/40 text-sm font-bold text-brand-400">
                  {i + 1}
                </div>
                <h3 className="text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-white/40 sm:flex-row">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-brand-400" />
            <span className="font-semibold text-white/60">Verdant Ideas</span>
          </div>
          <p>© {new Date().getFullYear()} Verdant Ideas. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
