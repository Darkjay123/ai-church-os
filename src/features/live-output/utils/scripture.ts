import type { ScriptureSuggestion } from "@/features/live-output/types";

const books = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "Jude",
  "Revelation",
];

const aliases: Record<string, string> = {
  psalm: "Psalms",
  psalms: "Psalms",
  john: "John",
  romans: "Romans",
  roman: "Romans",
  revelation: "Revelation",
  revelations: "Revelation",
};

const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
};

const singleNumberWord = Object.keys(numberWords).join("|");
const spokenNumberPattern = `(?:\\d+|(?:twenty|thirty|forty|fifty)(?:[-\\s](?:one|two|three|four|five|six|seven|eight|nine))?|${singleNumberWord})`;

function spokenNumber(value: string) {
  const compact = value.toLowerCase().replace(/[\s-]/g, "");
  if (numberWords[compact]) return numberWords[compact];
  const parts = value.toLowerCase().split(/[\s-]+/);
  if (parts.length === 2 && numberWords[parts[0]] && numberWords[parts[1]]) {
    return numberWords[parts[0]] + numberWords[parts[1]];
  }
  return Number(value);
}

function normaliseBook(value: string) {
  const cleaned = value.toLowerCase().replace(/\s+/g, " ").trim();
  return (
    books.find((book) => book.toLowerCase() === cleaned) ?? aliases[cleaned] ?? null
  );
}

export function normaliseReference(value: string) {
  const match = value
    .trim()
    .replace(/\bchapter\b/gi, "")
    .replace(/\bverse\b/gi, ":")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s+/g, " ")
    .match(/^((?:[1-3]\s*)?[a-z ]+?)\s+(\d+)(?::(\d+(?:-\d+)?))?$/i);
  if (!match) return null;
  const book = normaliseBook(match[1]);
  return book ? `${book} ${match[2]}${match[3] ? `:${match[3]}` : ""}` : null;
}

export function detectReferenceFromTranscript(
  transcript: string,
): ScriptureSuggestion | null {
  const bookPattern = books
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((book) => book.replace(/ /g, "\\s+"))
    .join("|");
  const pattern = new RegExp(
    `\\b((?:first|second|third|1st|2nd|3rd|[1-3])?\\s*(?:${bookPattern}))\\s+(?:chapter\\s+)?(${spokenNumberPattern})(?:\\s+(?:verse|verses)\\s+(${spokenNumberPattern}))?`,
    "i",
  );
  const match = transcript.match(pattern);
  if (match) {
    const book = normaliseBook(
      match[1]
        .replace(/\bfirst\b/i, "1")
        .replace(/\bsecond\b/i, "2")
        .replace(/\bthird\b/i, "3")
        .replace(/\b([123])(?:st|nd|rd)\b/i, "$1"),
    );
    const chapter = spokenNumber(match[2]);
    const verse = match[3] ? spokenNumber(match[3]) : null;
    if (
      book &&
      Number.isFinite(chapter) &&
      (verse === null || Number.isFinite(verse))
    ) {
      return {
        reference: `${book} ${chapter}${verse ? `:${verse}` : ""}`,
        confidence: verse ? 0.98 : 0.9,
      };
    }
  }

  const text = transcript.toLowerCase();
  if (/for god so loved the world|gave his only.*son/.test(text)) {
    return { reference: "John 3:16", confidence: 0.9 };
  }
  if (/lord is my shepherd/.test(text))
    return { reference: "Psalms 23:1", confidence: 0.9 };
  if (/all things work together.*good/.test(text))
    return { reference: "Romans 8:28", confidence: 0.9 };
  return null;
}
