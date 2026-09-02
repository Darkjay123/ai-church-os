export type BibleTranslation = "web" | "kjv";

export type BibleLookup = {
  reference: string;
  text: string;
  translation: BibleTranslation;
  translationName: string;
  attribution: string;
};

export type ScriptureContent = BibleLookup & {
  kind: "scripture";
  background: string;
  textSize: number;
  textAlign: "left" | "center" | "right";
  textPosition: "top" | "center" | "bottom";
  fontFamily: "serif" | "sans";
  showReference: boolean;
};

export type MediaContent = {
  kind: "image" | "video";
  name: string;
  assetPath: string;
  previewUrl: string;
};

export type LiveContent = ScriptureContent | MediaContent;

export type LiveOutputMessage = {
  type: "ai-church-os:live-content" | "ai-church-os:request-live-content";
  content?: LiveContent | null;
};

export type ScriptureSuggestion = {
  reference: string;
  confidence: number;
};
