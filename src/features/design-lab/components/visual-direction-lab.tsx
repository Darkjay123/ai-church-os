"use client";

import { useState } from "react";
import {
  Activity,
  AudioLines,
  Bot,
  ChevronRight,
  CircleStop,
  Clock3,
  Command,
  Cross,
  Radio,
  Search,
  Signal,
  Sparkles,
  Tv,
  Waves,
} from "lucide-react";

import styles from "./visual-direction-lab.module.css";

type DirectionId = "service-index" | "signal-room" | "living-liturgy" | "cue-sheet";

type Direction = {
  id: DirectionId;
  label: string;
  shortLabel: string;
  title: string;
  subtitle: string;
};

const directions: Direction[] = [
  {
    id: "service-index",
    label: "A · Service Index",
    shortLabel: "Editorial / Swiss",
    title: "Service Index",
    subtitle: "A strict grid for service planning and cue review.",
  },
  {
    id: "signal-room",
    label: "B · Signal Room",
    shortLabel: "Broadcast control room",
    title: "Signal Room",
    subtitle: "A low-light operating environment for live service decisions.",
  },
  {
    id: "living-liturgy",
    label: "C · Living Liturgy",
    shortLabel: "Liquid / material",
    title: "Living Liturgy",
    subtitle: "A tactile, human system for moments that are shared live.",
  },
  {
    id: "cue-sheet",
    label: "D · Cue Sheet",
    shortLabel: "Stage ledger",
    title: "Cue Sheet",
    subtitle: "A stage manager’s book, translated into an operating surface.",
  },
];

const scenario = {
  service: "Sunday Celebration",
  scheduled: "Sun 08 Sep · 09:00",
  scripture: "Psalm 46:1–3",
  nextCue: "Welcome · Pastor Ade",
};

function SampleNav({ compact = false }: { compact?: boolean }) {
  const items = ["Overview", "Run of show", "Output", "Scripture", "Archive"];

  return (
    <nav aria-label="Prototype navigation" className={styles.sampleNav}>
      <span className={styles.sampleMark} aria-hidden="true">
        <Cross />
      </span>
      {!compact && <span className={styles.sampleBrand}>AI Church OS</span>}
      <div className={styles.sampleNavItems}>
        {items.map((item, index) => (
          <span className={index === 1 ? styles.sampleNavActive : undefined} key={item}>
            {item}
          </span>
        ))}
      </div>
    </nav>
  );
}

function ServiceIndexPreview() {
  return (
    <section
      className={`${styles.preview} ${styles.serviceIndex}`}
      aria-label="Service Index prototype"
    >
      <header className={styles.indexMasthead}>
        <div className={styles.indexBrand}>
          <span>AI Church OS</span>
          <small>Service operations / 041</small>
        </div>
        <span className={styles.indexDate}>Sunday, 08 September 2026</span>
        <span className={styles.indexOperator}>Operator / RS</span>
      </header>
      <div className={styles.indexBody}>
        <aside className={styles.indexRail}>
          <b>01</b>
          <span>Service</span>
          <b>02</b>
          <span>Output</span>
          <b>03</b>
          <span>Notes</span>
        </aside>
        <main className={styles.indexMain}>
          <div className={styles.indexHeading}>
            <p>Live service / scheduled</p>
            <h2>{scenario.service}</h2>
            <span>{scenario.scheduled}</span>
          </div>
          <div className={styles.indexRule} />
          <div className={styles.indexGrid}>
            <article>
              <p>Now</p>
              <h3>Pre-service</h3>
              <span>Output is in preview. Service has not started.</span>
            </article>
            <article>
              <p>Next cue</p>
              <h3>{scenario.nextCue}</h3>
              <span>Stage display ready · 04:12</span>
            </article>
          </div>
          <div className={styles.indexTimeline}>
            <div>
              <time>08:45</time>
              <span>Service created</span>
              <em>RS</em>
            </div>
            <div>
              <time>08:52</time>
              <span>{scenario.scripture} staged</span>
              <em>AI / 94%</em>
            </div>
            <div>
              <time>09:00</time>
              <span>Awaiting operator start</span>
              <em>—</em>
            </div>
          </div>
        </main>
        <aside className={styles.indexAction}>
          <p>Primary action</p>
          <button type="button">
            Start service <ChevronRight />
          </button>
          <span>Requires operator confirmation</span>
        </aside>
      </div>
    </section>
  );
}

function SignalRoomPreview() {
  return (
    <section
      className={`${styles.preview} ${styles.signalRoom}`}
      aria-label="Signal Room prototype"
    >
      <SampleNav />
      <header className={styles.signalTopbar}>
        <span className={styles.signalWorkspace}>
          NEW LIFE ASSEMBLY <ChevronRight />
        </span>
        <button type="button">
          <Search /> Search or run command <kbd>⌘ K</kbd>
        </button>
        <span className={styles.signalReady}>
          <i /> AI Brain ready
        </span>
      </header>
      <main className={styles.signalMain}>
        <div className={styles.signalStatebar}>
          <span>
            <Radio /> SERVICE / SCHEDULED
          </span>
          <strong>{scenario.service}</strong>
          <time>{scenario.scheduled}</time>
          <button type="button">
            <CircleStop /> Start service
          </button>
        </div>
        <div className={styles.signalMonitors}>
          <article className={styles.signalOutput}>
            <header>
              <span>PROGRAM OUTPUT</span>
              <b>PREVIEW</b>
            </header>
            <div className={styles.signalOutputWell}>
              <Tv />
              <span>READY FOR PROGRAM</span>
              <strong>{scenario.scripture}</strong>
            </div>
            <footer>
              DISPLAY 1 <i /> 1080P60 <i /> 0.0s
            </footer>
          </article>
          <article className={styles.signalTimeline}>
            <header>
              <span>EVENT LOG</span>
              <b>LIVE / LOCAL</b>
            </header>
            <div>
              <time>08:52:06</time>
              <i />
              <span>
                Scripture staged <strong>{scenario.scripture}</strong>
              </span>
            </div>
            <div>
              <time>08:51:42</time>
              <i />
              <span>Audio monitor armed</span>
            </div>
            <div>
              <time>08:45:11</time>
              <i />
              <span>Service record created</span>
            </div>
            <button type="button">
              View full timeline <ChevronRight />
            </button>
          </article>
        </div>
        <div className={styles.signalBottomRow}>
          <section>
            <span>AUDIO IN</span>
            <div className={styles.signalMeter}>
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <b>−18.4 dB</b>
          </section>
          <section>
            <span>AI SUGGESTION</span>
            <strong>{scenario.nextCue}</strong>
            <button type="button">Review</button>
          </section>
          <section>
            <span>STREAM</span>
            <b className={styles.signalOffline}>OFFLINE</b>
            <small>No broadcast target connected</small>
          </section>
        </div>
      </main>
    </section>
  );
}

function LivingLiturgyPreview() {
  return (
    <section
      className={`${styles.preview} ${styles.livingLiturgy}`}
      aria-label="Living Liturgy prototype"
    >
      <header className={styles.liturgyHeader}>
        <div>
          <span className={styles.liturgyOrb}>
            <Waves />
          </span>
          <b>AI Church OS</b>
        </div>
        <nav>
          <span>Service</span>
          <span>Library</span>
          <span>Team</span>
        </nav>
        <button type="button">
          <Command /> Command
        </button>
      </header>
      <main className={styles.liturgyMain}>
        <section className={styles.liturgyHero}>
          <p>SUNDAY / IN PREPARATION</p>
          <h2>{scenario.service}</h2>
          <span>
            <Clock3 /> {scenario.scheduled} <i /> Production team online
          </span>
          <button type="button">
            <Radio /> Begin service
          </button>
        </section>
        <div className={styles.liturgyCards}>
          <article className={styles.liturgyCurrent}>
            <header>
              <span>Current focus</span>
              <Activity />
            </header>
            <h3>{scenario.scripture}</h3>
            <p>“God is our refuge and strength…”</p>
            <div>
              <span>Prepared</span>
              <span>Display ready</span>
            </div>
          </article>
          <article className={styles.liturgyAi}>
            <header>
              <span>
                <Sparkles /> AI companion
              </span>
              <b>94%</b>
            </header>
            <h3>{scenario.nextCue}</h3>
            <p>The planned welcome cue matches the service flow.</p>
            <button type="button">
              Review suggestion <ChevronRight />
            </button>
          </article>
        </div>
        <section className={styles.liturgyFlow}>
          <header>
            <span>Service flow</span>
            <small>03 live cues</small>
          </header>
          <div>
            <b>01</b>
            <span>Opening prayer</span>
            <time>09:00</time>
            <em>Ready</em>
          </div>
          <div>
            <b>02</b>
            <span>{scenario.scripture}</span>
            <time>09:05</time>
            <em>Staged</em>
          </div>
          <div>
            <b>03</b>
            <span>{scenario.nextCue}</span>
            <time>09:09</time>
            <em>Next</em>
          </div>
        </section>
      </main>
    </section>
  );
}

function CueSheetPreview() {
  return (
    <section
      className={`${styles.preview} ${styles.cueSheet}`}
      aria-label="Cue Sheet prototype"
    >
      <aside className={styles.cueBlackRail}>
        <span className={styles.cueMark}>
          <Cross />
        </span>
        <span className={styles.cueLiveMark}>
          <Radio />
        </span>
        <span>
          <Tv />
        </span>
        <span>
          <Bot />
        </span>
        <span>
          <AudioLines />
        </span>
      </aside>
      <main className={styles.cuePaper}>
        <header className={styles.cueHeader}>
          <div>
            <p>AI Church OS / RUN OF SHOW</p>
            <h2>{scenario.service}</h2>
          </div>
          <div>
            <b>SERVICE 041</b>
            <span>{scenario.scheduled}</span>
          </div>
        </header>
        <div className={styles.cueMeta}>
          <span>Operator / RS</span>
          <span>Room / Main auditorium</span>
          <span>State / Scheduled</span>
        </div>
        <div className={styles.cueTable}>
          <div className={styles.cueTableHead}>
            <span>Time</span>
            <span>Cue</span>
            <span>Output</span>
            <span>Operator note</span>
          </div>
          <div>
            <time>08:45</time>
            <strong>House open</strong>
            <span>Welcome loop</span>
            <small>—</small>
          </div>
          <div>
            <time>09:00</time>
            <strong>Opening prayer</strong>
            <span>Lower third</span>
            <small>Await start</small>
          </div>
          <div className={styles.cueSelected}>
            <time>09:05</time>
            <strong>{scenario.scripture}</strong>
            <span>Scripture display</span>
            <small>Prepared by AI · 94%</small>
          </div>
          <div>
            <time>09:09</time>
            <strong>{scenario.nextCue}</strong>
            <span>Stage display</span>
            <small>Next</small>
          </div>
        </div>
        <footer className={styles.cueFooter}>
          <span>
            <Signal /> All systems staged
          </span>
          <button type="button">START SERVICE</button>
        </footer>
      </main>
      <aside className={styles.cueMargin}>
        <p>Operator margin</p>
        <div>
          <span>AI note</span>
          <b>Scripture confidence is high.</b>
          <button type="button">Review</button>
        </div>
        <div>
          <span>Audio</span>
          <b>Stage mic / −18 dB</b>
        </div>
      </aside>
    </section>
  );
}

function Preview({ direction }: { direction: DirectionId }) {
  if (direction === "service-index") return <ServiceIndexPreview />;
  if (direction === "living-liturgy") return <LivingLiturgyPreview />;
  if (direction === "cue-sheet") return <CueSheetPreview />;
  return <SignalRoomPreview />;
}

export function VisualDirectionLab() {
  const [directionId, setDirectionId] = useState<DirectionId>("signal-room");
  const activeDirection =
    directions.find((direction) => direction.id === directionId) ?? directions[1];

  return (
    <div className={styles.lab}>
      <header className={styles.labHeader}>
        <div>
          <p>AI Church OS / Design laboratory</p>
          <h1>Four ways to run a service.</h1>
          <span>
            Static evaluation fixture — no service data is read or changed here.
          </span>
        </div>
        <div className={styles.labScenario}>
          <span>Shared scenario</span>
          <b>{scenario.service}</b>
          <small>Scheduled · Scripture staged · AI suggestion ready</small>
        </div>
      </header>

      <div
        className={styles.directionTabs}
        role="tablist"
        aria-label="Visual directions"
      >
        {directions.map((direction) => (
          <button
            aria-controls="direction-preview"
            aria-selected={direction.id === directionId}
            key={direction.id}
            onClick={() => setDirectionId(direction.id)}
            role="tab"
            type="button"
          >
            <span>{direction.label}</span>
            <small>{direction.shortLabel}</small>
          </button>
        ))}
      </div>

      <section className={styles.previewFrame} id="direction-preview" role="tabpanel">
        <div className={styles.previewCaption}>
          <div>
            <span>Direction selected</span>
            <b>{activeDirection.title}</b>
          </div>
          <p>{activeDirection.subtitle}</p>
        </div>
        <Preview direction={directionId} />
      </section>

      <section
        className={styles.evaluationGrid}
        aria-label="Direction evaluation guide"
      >
        <article>
          <b>Evaluate hierarchy</b>
          <span>
            Can an operator find what is live, next and actionable within one scan?
          </span>
        </article>
        <article>
          <b>Evaluate authority</b>
          <span>
            Does AI advise quietly while the operator retains the visible decision?
          </span>
        </article>
        <article>
          <b>Evaluate character</b>
          <span>Would this still be recognisable with the logo removed?</span>
        </article>
      </section>
    </div>
  );
}
