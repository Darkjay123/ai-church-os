import { create } from "zustand";

import type {
  AIStatus,
  CurrentPresentation,
  CurrentScripture,
  CurrentSong,
  LiveServiceContext,
  OrganizationContext,
  StreamingStatus,
} from "@/types/app";

type AppState = {
  organization: OrganizationContext | null;
  activeService: LiveServiceContext | null;
  streamingStatus: StreamingStatus;
  currentPresentation: CurrentPresentation | null;
  currentScripture: CurrentScripture | null;
  currentSong: CurrentSong | null;
  aiStatus: AIStatus;
  setOrganization: (organization: OrganizationContext | null) => void;
  setActiveService: (service: LiveServiceContext | null) => void;
  setStreamingStatus: (status: StreamingStatus) => void;
  setCurrentPresentation: (presentation: CurrentPresentation | null) => void;
  setCurrentScripture: (scripture: CurrentScripture | null) => void;
  setCurrentSong: (song: CurrentSong | null) => void;
  setAiStatus: (status: AIStatus) => void;
};

export const useAppStore = create<AppState>((set) => ({
  organization: null,
  activeService: null,
  streamingStatus: "disconnected",
  currentPresentation: null,
  currentScripture: null,
  currentSong: null,
  aiStatus: "offline",
  setOrganization: (organization) => set({ organization }),
  setActiveService: (activeService) => set({ activeService }),
  setStreamingStatus: (streamingStatus) => set({ streamingStatus }),
  setCurrentPresentation: (currentPresentation) => set({ currentPresentation }),
  setCurrentScripture: (currentScripture) => set({ currentScripture }),
  setCurrentSong: (currentSong) => set({ currentSong }),
  setAiStatus: (aiStatus) => set({ aiStatus }),
}));
