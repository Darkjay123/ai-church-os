export type AIStatus = "ready" | "listening" | "processing" | "attention" | "offline";
export type StreamingStatus = "disconnected" | "connecting" | "live" | "error";

export type OrganizationContext = {
  id: string;
  name: string;
  timezone: string;
};

export type LiveServiceContext = {
  id: string;
  title: string;
  startedAt: string;
};

export type CurrentPresentation = {
  id: string;
  title: string;
};

export type CurrentScripture = {
  reference: string;
  translation: string;
};

export type CurrentSong = {
  id: string;
  title: string;
};
