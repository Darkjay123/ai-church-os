"use client";

import { useEffect, useState } from "react";

import type { LiveContent, ScriptureContent } from "@/features/live-output/types";

export function LiveOutputScreen({
  initialContent,
}: {
  initialContent: LiveContent | null;
}) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/live-output", { cache: "no-store" });
        if (!response.ok || !active) return;
        const body = (await response.json()) as { content: LiveContent | null };
        setContent(body.content);
      } catch {
        // The output remains on its last confirmed frame while a poll is unavailable.
      }
    };
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === "ai-church-os:live-content"
      ) {
        setContent(event.data.content ?? null);
      }
    };
    window.addEventListener("message", onMessage);
    const interval = window.setInterval(() => void refresh(), 1500);
    void refresh();
    return () => {
      active = false;
      window.removeEventListener("message", onMessage);
      window.clearInterval(interval);
    };
  }, []);

  if (!content) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#070a0e] p-8 text-center text-white">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-white/45 uppercase">
            AI Church OS · Live output
          </p>
          <h1 className="mt-4 text-3xl font-medium">Standing by</h1>
          <p className="mt-2 text-white/55">The operator has not sent content live.</p>
        </div>
      </main>
    );
  }
  if (content.kind === "image") {
    return (
      <main className="grid min-h-screen place-items-center bg-black">
        <img
          alt={content.name}
          className="h-screen w-screen object-contain"
          src={content.previewUrl}
        />
      </main>
    );
  }
  if (content.kind === "video") {
    return (
      <main className="grid min-h-screen place-items-center bg-black">
        <video
          autoPlay
          className="h-screen w-screen object-contain"
          controls={false}
          key={content.previewUrl}
          loop
          playsInline
          src={content.previewUrl}
        />
      </main>
    );
  }
  if (content.kind === "scripture") return <ScriptureOutput content={content} />;
  return null;
}

function ScriptureOutput({ content }: { content: ScriptureContent }) {
  const alignment =
    content.textAlign === "left"
      ? "text-left"
      : content.textAlign === "right"
        ? "text-right"
        : "text-center";
  const position =
    content.textPosition === "top"
      ? "items-start pt-[12vh]"
      : content.textPosition === "bottom"
        ? "items-end pb-[12vh]"
        : "items-center";
  return (
    <main
      className="relative flex min-h-screen overflow-hidden px-[8vw] text-white"
      style={{ background: content.background }}
    >
      <div className="absolute inset-0 bg-black/35" />
      <div className={`relative z-10 flex w-full ${position}`}>
        <div className={`w-full ${alignment}`}>
          <p
            className={`mx-auto max-w-[1200px] leading-[1.15] tracking-[-0.035em] whitespace-pre-line ${content.fontFamily === "serif" ? "font-serif" : "font-sans"}`}
            style={{ fontSize: `${content.textSize}vw` }}
          >
            {content.text}
          </p>
          {content.showReference ? (
            <p className="mt-10 text-[2.3vw] font-semibold tracking-[0.06em] text-white/85">
              {content.reference} · {content.translationName}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
