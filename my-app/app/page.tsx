'use client';

import { FormEvent, useEffect, useRef, useState } from "react";

import { getPublicSupabaseClient } from "@/lib/supabaseClient";

type ShapeType = "circle" | "square" | "rectangle" | "triangle";

type Shape = {
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationVelocity: number;
  color: string;
  opacity: number;
};

type Bounds = { width: number; height: number };

const DEFAULT_SHAPE_COUNT = 36;
const SHAPE_TYPES: ShapeType[] = ["circle", "square", "rectangle", "triangle"];

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const pick = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const randomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = randomBetween(55, 85);
  const lightness = randomBetween(45, 75);
  const alpha = randomBetween(0.55, 0.9);
  return `hsla(${hue}deg ${saturation}% ${lightness}% / ${alpha})`;
};

const createShape = (bounds: Bounds): Shape => {
  const type = pick(SHAPE_TYPES);
  const base = randomBetween(40, 120);
  const width =
    type === "rectangle" ? base * randomBetween(1.2, 2.4) : base;
  const height =
    type === "rectangle" ? base * randomBetween(0.6, 1.3) : base;
  const safeWidth = Math.min(width, bounds.width);
  const safeHeight = Math.min(height, bounds.height);

  const x = randomBetween(0, Math.max(0, bounds.width - safeWidth));
  const y = randomBetween(0, Math.max(0, bounds.height - safeHeight));
  const vx = randomBetween(-0.6, 0.6) || 0.35;
  const vy = randomBetween(-0.6, 0.6) || -0.35;

  return {
    type,
    x,
    y,
    width: safeWidth,
    height: safeHeight,
    vx,
    vy,
    rotation: randomBetween(0, 360),
    rotationVelocity: randomBetween(-0.4, 0.4),
    color: randomColor(),
    opacity: randomBetween(0.55, 0.9),
  };
};

const applyShapeAppearance = (element: HTMLDivElement | null, shape: Shape) => {
  if (!element) return;

  element.style.width = `${shape.width}px`;
  element.style.height = `${shape.height}px`;
  element.style.opacity = `${shape.opacity}`;
  element.style.background = shape.color;
  element.style.borderRadius = "0.95rem";
  element.style.mixBlendMode = "normal";
  element.style.filter = "none";
  element.style.boxShadow = `0 25px 60px ${shape.color}55`;
  element.style.clipPath = "";

  if (shape.type === "circle") {
    element.style.borderRadius = "999px";
  }

  if (shape.type === "square") {
    element.style.borderRadius = "0.35rem";
  }

  if (shape.type === "triangle") {
    element.style.borderRadius = "0";
    element.style.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
  }
};

const applyShapeTransform = (element: HTMLDivElement | null, shape: Shape) => {
  if (!element) return;
  element.style.transform = `translate3d(${shape.x}px, ${shape.y}px, 0) rotate(${shape.rotation}deg)`;
};

const isColliding = (a: Shape, b: Shape) => {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  const dx = ax - bx;
  const dy = ay - by;
  const distance = Math.hypot(dx, dy) || 0.0001;
  const radiusA = Math.max(a.width, a.height) / 2;
  const radiusB = Math.max(b.width, b.height) / 2;
  return distance < radiusA + radiusB;
};

const pushApart = (a: Shape, b: Shape) => {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  let dx = ax - bx;
  let dy = ay - by;
  let distance = Math.hypot(dx, dy);

  if (distance === 0) {
    distance = 0.0001;
    dx = 0.01;
    dy = 0.01;
  }

  const overlap =
    Math.max(a.width, a.height) / 2 +
    Math.max(b.width, b.height) / 2 -
    distance;
  if (overlap <= 0) return;

  const nx = dx / distance;
  const ny = dy / distance;

  a.x += (nx * overlap) / 2;
  a.y += (ny * overlap) / 2;
  b.x -= (nx * overlap) / 2;
  b.y -= (ny * overlap) / 2;
};

const clampShapeToBounds = (shape: Shape, bounds: Bounds) => {
  shape.x = clamp(shape.x, 0, Math.max(0, bounds.width - shape.width));
  shape.y = clamp(shape.y, 0, Math.max(0, bounds.height - shape.height));
};

const FloatingShapes = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shapesRef = useRef<Shape[]>([]);
  const boundsRef = useRef<Bounds>({ width: 0, height: 0 });
  const frameRef = useRef<number | null>(null);
  const [nodeCount, setNodeCount] = useState(DEFAULT_SHAPE_COUNT);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measureBounds = () => {
      const rect = container.getBoundingClientRect();
      boundsRef.current = { width: rect.width, height: rect.height };
    };

    measureBounds();

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const shapeCount =
      typeof window !== "undefined" && window.innerWidth < 768
        ? Math.floor(DEFAULT_SHAPE_COUNT * 0.55)
        : DEFAULT_SHAPE_COUNT;

    shapesRef.current = Array.from({ length: shapeCount }, () =>
      createShape(boundsRef.current),
    );
    setNodeCount(shapeCount);
    shapesRef.current.forEach((shape, index) => {
      applyShapeAppearance(nodeRefs.current[index], shape);
      applyShapeTransform(nodeRefs.current[index], shape);
    });

    const animate = () => {
      const bounds = boundsRef.current;
      const shapes = shapesRef.current;

      for (const shape of shapes) {
        shape.x += shape.vx;
        shape.y += shape.vy;
        shape.rotation += shape.rotationVelocity;

        if (shape.x <= 0 || shape.x + shape.width >= bounds.width) {
          shape.vx *= -1;
          shape.x = clamp(shape.x, 0, bounds.width - shape.width);
        }
        if (shape.y <= 0 || shape.y + shape.height >= bounds.height) {
          shape.vy *= -1;
          shape.y = clamp(shape.y, 0, bounds.height - shape.height);
        }
      }

      for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
          const a = shapes[i];
          const b = shapes[j];
          if (!isColliding(a, b)) continue;

          const oldVx = a.vx;
          const oldVy = a.vy;
          a.vx = b.vx;
          a.vy = b.vy;
          b.vx = oldVx;
          b.vy = oldVy;
          pushApart(a, b);
          clampShapeToBounds(a, bounds);
          clampShapeToBounds(b, bounds);
        }
      }

      shapes.forEach((shape, index) => {
        applyShapeTransform(nodeRefs.current[index], shape);
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    if (!prefersReducedMotion) {
      frameRef.current = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      measureBounds();
      shapesRef.current.forEach((shape, index) => {
        clampShapeToBounds(shape, boundsRef.current);
        applyShapeTransform(nodeRefs.current[index], shape);
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: nodeCount }).map((_, index) => (
        <div
          key={index}
          ref={(node) => {
            nodeRefs.current[index] = node;
          }}
          className="absolute"
        />
      ))}
    </div>
  );
};

export default function Home() {
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [understanding, setUnderstanding] = useState("3");
  const [partnerUnderstanding, setPartnerUnderstanding] = useState("3");
  const [exitTicket, setExitTicket] = useState("");
  const [questions, setQuestions] = useState("");
  const [mode, setMode] = useState<"individual" | "partner">("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<
    { type: "success" | "error"; message: string } | undefined
  >();

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }

    return "Something went wrong saving your ticket. Please try again.";
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitRecord = async () => {
      const supabase = getPublicSupabaseClient();
      try {
        setIsSubmitting(true);
        setSubmitState(undefined);
        const { error } = await supabase.from("exit_tickets").insert([
          {
            mode,
            student_name: name,
            partner_names: mode === "partner" ? partnerName : null,
            understanding: Number(understanding),
            partner_understanding:
              mode === "partner" ? Number(partnerUnderstanding) : null,
            exit_ticket_response: exitTicket,
            lingering_questions: questions || null,
          },
        ]);
        if (error) {
          throw error;
        }
        setSubmitState({
          type: "success",
          message: "Ticket recorded. Thanks for sharing!",
        });
        setName("");
        setPartnerName("");
        setUnderstanding("3");
        setPartnerUnderstanding("3");
        setExitTicket("");
        setQuestions("");
      } catch (error) {
        console.error("Failed to save exit ticket", error);
        setSubmitState({
          type: "error",
          message: getErrorMessage(error),
        });
      } finally {
        setIsSubmitting(false);
      }
    };
    void submitRecord();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-100 px-4 py-10 font-sans text-slate-900 dark:bg-black">
      <FloatingShapes />
      <main className="relative z-10 w-full max-w-4xl rounded-3xl border border-white/30 bg-white/90 p-6 shadow-2xl backdrop-blur-md backdrop-opacity-20 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 sm:p-8 md:max-w-3xl md:p-10">
        <header className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            Exit Ticket
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Quick check-in before you head out 🚀
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Share how the lesson went, ace the exit question, and drop any
            lingering questions.
          </p>
        </header>
        <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-2 text-sm font-semibold text-zinc-600 dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-300">
          <p className="px-4 text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            Choose ticket type
          </p>
          <div className="grid gap-3 p-2 sm:grid-cols-2">
            {[
              {
                id: "individual",
                title: "Individual",
                description: "Solo reflection on your understanding",
              },
              {
                id: "partner",
                title: "Partner",
                description: "Submit one ticket for your pair",
              },
            ].map((option) => {
              const active = mode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    active
                      ? "border-0 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-400/30"
                      : "border border-zinc-200 bg-white/70 text-zinc-700 hover:border-amber-300 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
                  }`}
                  onClick={() =>
                    setMode(option.id as "individual" | "partner")
                  }
                >
                  <p className="text-lg font-semibold">{option.title}</p>
                  <p
                    className={`text-sm font-normal ${
                      active ? "text-white/80" : "text-zinc-500"
                    }`}
                  >
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Name
              <input
                autoComplete="name"
                className="w-full rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 text-base text-zinc-900 outline-none ring-offset-2 transition focus:ring-2 focus:ring-amber-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
                placeholder="e.g., Alex Rivera"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            {mode === "partner" ? (
              <label className="flex flex-col gap-2 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Partner name(s)
                <input
                  autoComplete="name"
                  className="w-full rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 text-base text-zinc-900 outline-none ring-offset-2 transition focus:ring-2 focus:ring-amber-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
                  placeholder="e.g., Jamie + Taylor"
                  value={partnerName}
                  onChange={(event) => setPartnerName(event.target.value)}
                  required
                />
              </label>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
          <fieldset className="flex flex-col gap-3 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            <legend>Understanding today&apos;s lesson</legend>
            <div className="grid grid-cols-2 gap-2 text-center text-xs text-zinc-500 dark:text-zinc-400 sm:grid-cols-3 md:grid-cols-5">
              {["1", "2", "3", "4", "5"].map((value, index) => (
                <label
                  key={value}
                  className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-200 bg-white/80 p-2 text-center text-[11px] font-medium text-zinc-700 transition hover:border-amber-300 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white sm:h-20"
                >
                  <input
                    type="radio"
                    name="understanding"
                    className="sr-only"
                    value={value}
                    checked={understanding === value}
                    onChange={() => setUnderstanding(value)}
                  />
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold ${
                      understanding === value
                        ? "bg-amber-500 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <small className="text-[11px]">
                    {index === 0 && "Confused"}
                    {index === 2 && "Neutral"}
                    {index === 4 && "Got it"}
                  </small>
                </label>
              ))}
            </div>
          </fieldset>
            {mode === "partner" && (
              <fieldset className="flex flex-col gap-3 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                <legend>How well did your partner understand?</legend>
                <div className="grid grid-cols-2 gap-2 text-center text-xs text-zinc-500 dark:text-zinc-400 sm:grid-cols-3 md:grid-cols-5">
                  {["1", "2", "3", "4", "5"].map((value, index) => (
                    <label
                      key={value}
                      className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-zinc-200 bg-white/80 p-2 text-center text-[11px] font-medium text-zinc-700 transition hover:border-amber-300 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white sm:h-20"
                    >
                      <input
                        type="radio"
                        name="partner-understanding"
                        className="sr-only"
                        value={value}
                        checked={partnerUnderstanding === value}
                        onChange={() => setPartnerUnderstanding(value)}
                      />
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold ${
                          partnerUnderstanding === value
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <small className="text-[11px]">
                        {index === 0 && "Needs help"}
                        {index === 2 && "Pretty good"}
                        {index === 4 && "Nailed it"}
                      </small>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          <label className="flex flex-col gap-2 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Exit ticket awnser
            <textarea
              className="min-h-[120px] rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 text-base text-zinc-900 outline-none ring-offset-2 transition focus:ring-2 focus:ring-amber-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
              placeholder="Summarize the key idea from today in your own words."
              value={exitTicket}
              onChange={(event) => setExitTicket(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            What questions are still on your mind?
            <textarea
              className="min-h-[120px] rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 text-base text-zinc-900 outline-none ring-offset-2 transition focus:ring-2 focus:ring-amber-400 dark:border-white/10 dark:bg-zinc-900/60 dark:text-white"
              placeholder="Drop any blockers or curiosities here."
              value={questions}
              onChange={(event) => setQuestions(event.target.value)}
            />
          </label>
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 dark:focus-visible:ring-offset-zinc-900"
            >
              {isSubmitting ? "Saving your ticket..." : "Submit check-in"}
            </button>
            {submitState && (
              <p
                className={`text-center text-sm font-medium ${
                  submitState.type === "success"
                    ? "text-emerald-600"
                    : "text-rose-500"
                }`}
                role="status"
                aria-live="polite"
              >
                {submitState.message}
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
