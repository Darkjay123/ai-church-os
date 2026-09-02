# Church-test vertical slice

This is a deliberately thin, operator-led path across the existing Live Service, presentation, scripture, Live Output, and central AI Brain boundaries. It is not a replacement for the Sprint 3–7 roadmap.

## What is real

1. An authorised user starts an existing Live Service from `/live-service`.
2. `/presentations` stages an image or a video uploaded to the private `church-media` Supabase Storage bucket. Files are scoped to the current organisation by storage policies.
3. The operator can stage, inspect and then **Send live**. Staging never alters live output.
4. `/output` is a dedicated, authenticated output surface suitable for a second browser window or OBS Browser Source after sign-in. It reads only the organisation's approved live-output state. Video autoplay is muted only when the browser requires it; after the user activates the output page, normal video audio is available through the system-selected device.
5. `/scriptures` performs a server-side Bible lookup, renders an operator preview, and sends the exact retrieved passage live. The operator can select background, text size, alignment, position, typeface, and reference visibility.
6. **Start listening** uses the browser's Web Speech API to receive microphone speech, then calls the central `/api/ai/detect-scripture` boundary for a reference suggestion. The AI never supplies canonical verse text: `/api/bible` retrieves it after operator approval.

## Scripture translations in this build

- **WEB — World English Bible:** Public Domain; attribution stays with every passage.
- **KJV — King James Version:** Public Domain; attribution stays with every passage.

Both are retrieved through `bible-api.com`; this build stores neither a scraped Bible corpus nor copyrighted translations. Licensed providers can be added later behind `src/features/live-output/services/bible.ts` without changing the operator workflow. [^1]

## Optional AI configuration

The central detector works for explicit spoken references and a small supported quotation set without an API key. For semantic reference detection, add `OPENAI_API_KEY` to `.env.local` only; it remains server-side. `AI_CHURCH_OS_SCRIPTURE_DETECTION_MODEL` defaults to `gpt-4o-mini`. Do not commit either secret.

The browser provides the actual speech recognition service and therefore needs Chrome or Edge, a user-granted microphone, and usually network access. Browser support and whether recognition is handled locally vary by browser; this is not a substitute for the dedicated streaming transcription provider planned in Sprint 6. [^2]

## Church test checklist

1. Sign in and open `/live-service`; create and start a service.
2. Open `/presentations` and `/output` in separate signed-in windows. The output should say **Standing by**.
3. Upload a flyer, confirm it appears only in operator preview, then click **Send live**. Refresh or watch `/output` show the flyer.
4. Upload a short MP4/WebM video, preview it, click **Send live**, and verify `/output` plays it. Use the computer's normal system audio output.
5. Open `/scriptures`, search `John 3:16`, choose WEB or KJV and presentation settings, stage it, then **Send live**. Verify the exact fetched passage appears on `/output`.
6. Click **Start listening**, allow microphone access, say `Romans chapter eight verse twenty eight`, choose **Preview** from the suggestion, then **Send live**.

## Known limits

- No PowerPoint importing, media library, multi-output device picker, audio mixer, OBS adapter, full Bible catalogue, or automatic send is included.
- Live Output is authenticated and organisation-scoped. For an OBS Browser Source, sign in to the same organisation in the browser context used by OBS.
- A new migration, `202609020008_live_output_vertical_slice.sql`, must be applied to the configured Supabase project after migration 007 before media uploads or Send live work.
- The output uses lightweight polling after Send live. Supabase Realtime was deliberately not enabled for this security-sensitive state.

[^1]: https://bible-api.com

[^2]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
