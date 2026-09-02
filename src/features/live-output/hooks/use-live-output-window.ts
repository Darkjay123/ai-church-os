"use client";

import { useCallback, useEffect, useRef } from "react";

import type { LiveContent, LiveOutputMessage } from "@/features/live-output/types";

export function useLiveOutputWindow() {
  const outputWindow = useRef<Window | null>(null);
  const content = useRef<LiveContent | null>(null);

  useEffect(() => {
    const receive = (event: MessageEvent<LiveOutputMessage>) => {
      if (event.data?.type === "ai-church-os:request-live-content") {
        event.source?.postMessage({
          type: "ai-church-os:live-content",
          content: content.current,
        });
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  const openOutput = useCallback(() => {
    const target = window.open(
      "/output",
      "ai-church-os-live-output",
      "popup=yes,width=1280,height=720",
    );
    if (target) {
      outputWindow.current = target;
      target.focus();
      window.setTimeout(
        () =>
          target.postMessage(
            {
              type: "ai-church-os:live-content",
              content: content.current,
            } satisfies LiveOutputMessage,
            window.location.origin,
          ),
        250,
      );
    }
    return Boolean(target);
  }, []);

  const send = useCallback((next: LiveContent) => {
    content.current = next;
    if (outputWindow.current && !outputWindow.current.closed) {
      outputWindow.current.postMessage(
        {
          type: "ai-church-os:live-content",
          content: next,
        } satisfies LiveOutputMessage,
        window.location.origin,
      );
    }
  }, []);

  return { openOutput, send };
}
