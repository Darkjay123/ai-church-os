"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  ExternalLink,
  ImageIcon,
  Mic,
  Radio,
  Send,
  Square,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { sendLiveContent } from "@/features/live-output/services/actions";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import type { LivePresentationScope } from "@/features/live-output/services/presentation";
import type {
  BibleLookup,
  BibleTranslation,
  LiveContent,
  ScriptureContent,
  ScriptureSuggestion,
} from "@/features/live-output/types";

const translations: Array<{ id: BibleTranslation; name: string; attribution: string }> =
  [
    {
      id: "web",
      name: "World English Bible",
      attribution: "World English Bible (WEB) · Public Domain",
    },
    {
      id: "kjv",
      name: "King James Version",
      attribution: "King James Version (KJV) · Public Domain",
    },
  ];

const backgrounds = [
  {
    name: "Midnight",
    value: "linear-gradient(135deg, #07131f 0%, #0b2634 55%, #192d40 100%)",
  },
  {
    name: "Warm ember",
    value: "linear-gradient(135deg, #26140e 0%, #5c2a18 55%, #1b1117 100%)",
  },
  {
    name: "Deep plum",
    value: "linear-gradient(135deg, #160d23 0%, #38204d 55%, #102837 100%)",
  },
  { name: "Blackout", value: "#050505" },
];

type RecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
  resultIndex: number;
};

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

export function LivePresentationWorkspace({
  scope,
  initialTab = "media",
}: {
  scope: LivePresentationScope;
  initialTab?: "media" | "scripture";
}) {
  const organization = useAppStore((state) => state.organization);
  const setCurrentScripture = useAppStore((state) => state.setCurrentScripture);
  const setCurrentPresentation = useAppStore((state) => state.setCurrentPresentation);
  const setAiStatus = useAppStore((state) => state.setAiStatus);
  const [preview, setPreview] = useState<LiveContent | null>(null);
  const [activeTab, setActiveTab] = useState<"media" | "scripture">(initialTab);
  const [reference, setReference] = useState("John 3:16");
  const [translation, setTranslation] = useState<BibleTranslation>("web");
  const [lookup, setLookup] = useState<BibleLookup | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [background, setBackground] = useState(backgrounds[0].value);
  const [textSize, setTextSize] = useState(4.8);
  const [textAlign, setTextAlign] = useState<ScriptureContent["textAlign"]>("center");
  const [textPosition, setTextPosition] =
    useState<ScriptureContent["textPosition"]>("center");
  const [fontFamily, setFontFamily] = useState<ScriptureContent["fontFamily"]>("serif");
  const [showReference, setShowReference] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [suggestion, setSuggestion] = useState<ScriptureSuggestion | null>(null);
  const [listening, setListening] = useState(false);
  const [listenError, setListenError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => recognitionRef.current?.stop(), [recognitionRef]);

  async function fetchScripture(nextReference = reference) {
    const canonical = nextReference.trim();
    if (!canonical) return;
    setIsLookingUp(true);
    setLookupError("");
    try {
      const response = await fetch(
        `/api/bible?reference=${encodeURIComponent(canonical)}&translation=${translation}`,
        { headers: { Accept: "application/json" } },
      );
      const result = (await response.json()) as {
        scripture?: BibleLookup;
        error?: string;
      };
      if (!response.ok || !result.scripture)
        throw new Error(result.error ?? "This scripture could not be found.");
      setLookup(result.scripture);
      const content: ScriptureContent = {
        kind: "scripture",
        ...result.scripture,
        background,
        textSize,
        textAlign,
        textPosition,
        fontFamily,
        showReference,
      };
      setPreview(content);
      setCurrentScripture({
        reference: result.scripture.reference,
        translation: result.scripture.translation.toUpperCase(),
      });
    } catch (error) {
      setLookupError(
        error instanceof Error ? error.message : "This scripture could not be found.",
      );
    } finally {
      setIsLookingUp(false);
    }
  }

  function stageScripture() {
    if (!lookup) return fetchScripture();
    setPreview({
      kind: "scripture",
      ...lookup,
      background,
      textSize,
      textAlign,
      textPosition,
      fontFamily,
      showReference,
    });
  }

  async function uploadMedia(file: File) {
    if (!organization) return setUploadError("Your workspace is still loading.");
    const supported = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!supported) return setUploadError("Choose an image or video file.");
    setUploadError("");
    setIsUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "media";
      const path = `${organization.id}/${crypto.randomUUID()}.${extension}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("church-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data, error: urlError } = await supabase.storage
        .from("church-media")
        .createSignedUrl(path, 60 * 60 * 4);
      if (urlError || !data?.signedUrl)
        throw urlError ?? new Error("We could not prepare this media.");
      const content = file.type.startsWith("video/")
        ? {
            kind: "video" as const,
            name: file.name,
            assetPath: path,
            previewUrl: data.signedUrl,
          }
        : {
            kind: "image" as const,
            name: file.name,
            assetPath: path,
            previewUrl: data.signedUrl,
          };
      setPreview(content);
      setCurrentPresentation({ id: path, title: file.name });
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? "Media upload failed. Confirm you have presentation permission and try again."
          : "Media upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function sendLive() {
    if (!preview) return;
    if (!scope.activeServiceTitle)
      return setSendError("Start service mode before sending content live.");
    if (preview.kind !== "scripture" && !scope.canSendMedia)
      return setSendError("You do not have permission to send media live.");
    if (preview.kind === "scripture" && !scope.canSendScripture)
      return setSendError("You do not have permission to send scripture live.");
    setIsSending(true);
    setSendError("");
    setSendSuccess("");
    try {
      const result = await sendLiveContent(preview);
      if (result.error) {
        setSendError(result.error);
        return;
      }
      setSendSuccess(result.success ?? "Content is now live.");
    } catch {
      setSendError("We could not send this item live. Try again.");
    } finally {
      setIsSending(false);
    }
  }

  function startListening() {
    if (listening) return;
    setListenError("");
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition)
      return setListenError(
        "Live listening requires Chrome or Edge on a device with microphone access.",
      );
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = async (event) => {
      const next = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (!next) return;
      setTranscript(next);
      if (next.length < 10) return;
      setAiStatus("processing");
      try {
        const response = await fetch("/api/ai/detect-scripture", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ transcript: next }),
        });
        const result = (await response.json()) as {
          suggestion?: ScriptureSuggestion | null;
        };
        if (result.suggestion) {
          setSuggestion(result.suggestion);
          setAiStatus("attention");
        } else setAiStatus("listening");
      } catch {
        setAiStatus("listening");
      }
    };
    recognition.onerror = (event) => {
      setListenError(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow microphone access, then try again."
          : "Live listening stopped. Check your microphone and try again.",
      );
      setListening(false);
      setAiStatus("ready");
    };
    recognition.onend = () => {
      setListening(false);
      setAiStatus("ready");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setAiStatus("listening");
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    setAiStatus("ready");
  }
  async function previewSuggestion() {
    if (!suggestion) return;
    setReference(suggestion.reference);
    await fetchScripture(suggestion.reference);
  }

  const previewLabel =
    preview?.kind === "scripture"
      ? preview.reference
      : (preview?.name ?? "Nothing staged");
  return (
    <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
      <header className="border-border flex flex-col justify-between gap-4 border-b pb-6 xl:flex-row xl:items-end">
        <div>
          <p className="text-primary flex items-center gap-2 text-sm font-medium">
            <Radio className="size-4" /> Operator presentation
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Preview with intent. Send when ready.
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Only Send Live changes the dedicated congregation output. Media, scripture,
            and AI suggestions remain in operator preview until approved.
          </p>
        </div>
        <a
          className="border-border bg-card hover:bg-muted inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium"
          href="/output"
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-4" /> Open live output
        </a>
      </header>
      {!scope.activeServiceTitle ? (
        <p className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Start a Live Service first. You can stage content now; sending live stays
          locked until service mode is live.
        </p>
      ) : null}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="space-y-6">
          <Preview content={preview} label={previewLabel} />
          <div
            className="border-border flex gap-2 border-b pb-3 lg:hidden"
            role="tablist"
            aria-label="Presentation tools"
          >
            <Button
              aria-selected={activeTab === "media"}
              onClick={() => setActiveTab("media")}
              role="tab"
              size="sm"
              variant={activeTab === "media" ? "default" : "ghost"}
            >
              Media
            </Button>
            <Button
              aria-selected={activeTab === "scripture"}
              onClick={() => setActiveTab("scripture")}
              role="tab"
              size="sm"
              variant={activeTab === "scripture" ? "default" : "ghost"}
            >
              Scripture
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section
              className={`${activeTab === "scripture" ? "hidden lg:block" : "block"} border-border bg-card rounded-xl border p-5`}
            >
              <div className="flex items-center gap-2">
                <Upload className="text-primary size-4" />
                <h2 className="font-semibold">Media to preview</h2>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Image or MP4/WebM/MOV video. Video audio plays through normal system
                audio on the output device.
              </p>
              <label className="border-border bg-background/40 hover:border-primary/60 mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <ImageIcon className="text-muted-foreground size-6" />
                <span className="mt-3 text-sm font-medium">
                  {isUploading ? "Uploading media…" : "Choose image or video"}
                </span>
                <span className="text-muted-foreground mt-1 text-xs">
                  Private to this church workspace
                </span>
                <input
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  disabled={isUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadMedia(file);
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
              {uploadError ? (
                <p className="text-destructive mt-3 text-sm">{uploadError}</p>
              ) : null}
            </section>
            <div className={activeTab === "media" ? "hidden lg:block" : "block"}>
              <ScripturePanel
                background={background}
                fetchScripture={fetchScripture}
                fontFamily={fontFamily}
                lookup={lookup}
                lookupError={lookupError}
                isLookingUp={isLookingUp}
                reference={reference}
                setBackground={setBackground}
                setFontFamily={setFontFamily}
                setReference={setReference}
                setShowReference={setShowReference}
                setTextAlign={setTextAlign}
                setTextPosition={setTextPosition}
                setTextSize={setTextSize}
                showReference={showReference}
                stageScripture={stageScripture}
                textAlign={textAlign}
                textPosition={textPosition}
                textSize={textSize}
                translation={translation}
                setTranslation={setTranslation}
              />
            </div>
          </div>
        </section>
        <aside className="space-y-6">
          <section className="border-border bg-card rounded-xl border p-5">
            <div className="flex items-center gap-2">
              <Mic className="text-primary size-4" />
              <h2 className="font-semibold">AI Scripture assist</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              AI Assist is on. Auto-send is off: every detected reference still requires
              your approval.
            </p>
            <Button
              className="mt-4 w-full"
              onClick={listening ? stopListening : startListening}
              variant={listening ? "destructive" : "default"}
            >
              {listening ? (
                <>
                  <Square className="size-4" /> Stop listening
                </>
              ) : (
                <>
                  <Mic className="size-4" /> Start listening
                </>
              )}
            </Button>
            {listenError ? (
              <p className="text-destructive mt-3 text-sm">{listenError}</p>
            ) : null}
            <div className="border-border bg-background/60 mt-5 rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Live transcript
              </p>
              <p className="mt-2 min-h-12 text-sm leading-6">
                {transcript || "Listening will show recognised speech here."}
              </p>
            </div>
            {suggestion ? (
              <div className="border-primary/30 bg-primary/10 mt-4 rounded-lg border p-4">
                <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                  Detected scripture · {Math.round(suggestion.confidence * 100)}%
                </p>
                <p className="mt-2 text-lg font-semibold">{suggestion.reference}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => void previewSuggestion()}
                    size="sm"
                    variant="secondary"
                  >
                    <BookOpenText className="size-3.5" /> Preview
                  </Button>
                  <p className="text-muted-foreground self-center text-xs">
                    Review the preview, then use Send live.
                  </p>
                </div>
              </div>
            ) : null}
          </section>
          <section className="border-border bg-card rounded-xl border p-5">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Live control
            </p>
            <h2 className="mt-1 text-lg font-semibold">{previewLabel}</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {scope.activeServiceTitle
                ? `${scope.activeServiceTitle} is live. Operator approval is required.`
                : "Service mode is not live."}
            </p>
            {sendError ? (
              <p className="text-destructive mt-3 text-sm">{sendError}</p>
            ) : null}
            {sendSuccess ? (
              <p className="mt-3 text-sm text-emerald-400">{sendSuccess}</p>
            ) : null}
            <Button
              className="mt-5 w-full"
              disabled={!preview || !scope.activeServiceTitle || isSending}
              onClick={() => void sendLive()}
            >
              {isSending ? (
                "Sending live…"
              ) : (
                <>
                  <Send className="size-4" /> Send live
                </>
              )}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Preview({ content, label }: { content: LiveContent | null; label: string }) {
  return (
    <section className="border-border overflow-hidden rounded-xl border bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/60">
        <span>OPERATOR PREVIEW</span>
        <span>{content?.kind.toUpperCase() ?? "STAGED CONTENT"}</span>
      </div>
      <div className="relative aspect-video bg-[#080a0f]">
        {content ? (
          content.kind === "image" ? (
            <Image
              alt={content.name}
              className="object-contain"
              fill
              sizes="(max-width: 1280px) 100vw, 70vw"
              src={content.previewUrl}
              unoptimized
            />
          ) : content.kind === "video" ? (
            <video
              className="h-full w-full object-contain"
              controls
              src={content.previewUrl}
            />
          ) : content.kind === "scripture" ? (
            <div
              className="flex h-full items-center justify-center p-[8%] text-white"
              style={{ background: content.background, textAlign: content.textAlign }}
            >
              <div
                className="max-w-[16ch] text-balance whitespace-pre-line"
                style={{
                  fontFamily:
                    content.fontFamily === "serif"
                      ? "Georgia, serif"
                      : "Arial, sans-serif",
                  fontSize: `${content.textSize}vw`,
                  lineHeight: 1.14,
                }}
              >
                {content.text}
                {content.showReference ? (
                  <p className="mt-7 text-[0.24em] font-semibold tracking-[0.12em] uppercase">
                    {content.reference} · {content.translation.toUpperCase()}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null
        ) : (
          <div className="grid h-full place-items-center text-center text-white/50">
            <div>
              <Radio className="mx-auto size-8" />
              <p className="mt-3 text-sm">
                Stage media or a scripture to preview it here.
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-white/10 px-4 py-3 text-sm text-white/70">
        {label}
      </div>
    </section>
  );
}

function ScripturePanel(props: {
  reference: string;
  setReference: (value: string) => void;
  translation: BibleTranslation;
  setTranslation: (value: BibleTranslation) => void;
  fetchScripture: () => Promise<void>;
  isLookingUp: boolean;
  lookupError: string;
  lookup: BibleLookup | null;
  background: string;
  setBackground: (value: string) => void;
  textSize: number;
  setTextSize: (value: number) => void;
  textAlign: ScriptureContent["textAlign"];
  setTextAlign: (value: ScriptureContent["textAlign"]) => void;
  textPosition: ScriptureContent["textPosition"];
  setTextPosition: (value: ScriptureContent["textPosition"]) => void;
  fontFamily: ScriptureContent["fontFamily"];
  setFontFamily: (value: ScriptureContent["fontFamily"]) => void;
  showReference: boolean;
  setShowReference: (value: boolean) => void;
  stageScripture: () => void;
}) {
  return (
    <section className="border-border bg-card rounded-xl border p-5">
      <div className="flex items-center gap-2">
        <BookOpenText className="text-primary size-4" />
        <h2 className="font-semibold">Manual scripture</h2>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          aria-label="Scripture reference"
          className="field-control"
          onChange={(event) => props.setReference(event.target.value)}
          placeholder="John 3:16"
          value={props.reference}
        />
        <select
          aria-label="Bible translation"
          className="field-control w-36"
          onChange={(event) =>
            props.setTranslation(event.target.value as BibleTranslation)
          }
          value={props.translation}
        >
          {translations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id.toUpperCase()}
            </option>
          ))}
        </select>
        <Button
          disabled={props.isLookingUp}
          onClick={() => void props.fetchScripture()}
          size="sm"
        >
          {props.isLookingUp ? "Finding…" : "Find"}
        </Button>
      </div>
      {props.lookupError ? (
        <p className="text-destructive mt-3 text-sm">{props.lookupError}</p>
      ) : null}
      {props.lookup ? (
        <>
          <p className="text-muted-foreground mt-4 max-h-24 overflow-auto text-sm leading-6">
            {props.lookup.text}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {props.lookup.attribution}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <label>
              Background
              <select
                className="field-control mt-1"
                onChange={(event) => props.setBackground(event.target.value)}
                value={props.background}
              >
                {backgrounds.map((item) => (
                  <option key={item.name} value={item.value}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Text size
              <input
                className="mt-3 w-full"
                max="8"
                min="2"
                onChange={(event) => props.setTextSize(Number(event.target.value))}
                step="0.2"
                type="range"
                value={props.textSize}
              />
            </label>
            <label>
              Alignment
              <select
                className="field-control mt-1"
                onChange={(event) =>
                  props.setTextAlign(
                    event.target.value as ScriptureContent["textAlign"],
                  )
                }
                value={props.textAlign}
              >
                <option value="left">Left</option>
                <option value="center">Centre</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label>
              Position
              <select
                className="field-control mt-1"
                onChange={(event) =>
                  props.setTextPosition(
                    event.target.value as ScriptureContent["textPosition"],
                  )
                }
                value={props.textPosition}
              >
                <option value="top">Top</option>
                <option value="center">Centre</option>
                <option value="bottom">Bottom</option>
              </select>
            </label>
            <label>
              Typeface
              <select
                className="field-control mt-1"
                onChange={(event) =>
                  props.setFontFamily(
                    event.target.value as ScriptureContent["fontFamily"],
                  )
                }
                value={props.fontFamily}
              >
                <option value="serif">Serif</option>
                <option value="sans">Sans</option>
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input
                checked={props.showReference}
                onChange={(event) => props.setShowReference(event.target.checked)}
                type="checkbox"
              />{" "}
              Show reference
            </label>
          </div>
          <Button className="mt-5" onClick={props.stageScripture} variant="secondary">
            Stage scripture preview
          </Button>
        </>
      ) : null}
    </section>
  );
}
