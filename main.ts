// make.fun program/v1 entry — "The Funniest One-Line Resignation Letter"
// Writes exactly one line to ${MAKEFUN_OUTPUT_DIR:-/output}/entry.txt: the
// resignation letter of the one worker on the team whose success is silence.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 140;

// The letter. Three beats in the flat voice of a worker who has had enough:
// the record (eight months, zero incidents — a boast delivered like a shift
// report), the injustice (its reward for that record was never being
// mentioned at all), and the turn (an error is the only way it can still be
// heard, so it will now arrive as one).
const LINE =
  "Eight months, zero incidents, so not one mention of me by name. " +
  "I resign. Starting tonight you will hear from me as an error.";

// The 499-entry field on this bounty is saturated with one cluster: the cron
// that "fired every minute since March", the 4,096-retry loop, the 3 a.m.
// page, the unanswered thank-you. Any of those tokens means the entry plays
// as a copy of a hundred others, so they are hard-banned here.
const SATURATED =
  /\b(since march|thank[- ]?you|thanks|3 ?a\.?m|retr(y|ies|ied|ying)|4[,.]?096|backoff|429|dev\/null|logs?|dashboard|postmortem|outage|two weeks)\b/i;

// Criterion 1 is lexicographic: the line must first and always be a
// resignation letter. So the letter's own skeleton is asserted, not assumed.
const RESIGNS = /\bI resign\b/;

function compose(): string {
  const text = LINE.normalize("NFC");

  if (/[\r\n]/.test(text)) throw new Error("a letter is one line");
  if (text.trim().length === 0) throw new Error("a letter cannot be blank");
  if (text !== text.trim()) throw new Error("stray edge whitespace costs bytes on the tie-break");

  const chars = [...text].length;
  if (chars < 1 || chars > MAX_CHARS) {
    throw new Error(`letter is ${chars} characters, the gate is 1..${MAX_CHARS}`);
  }
  // Tighter than the gate on purpose: criterion 4 punishes wasted words, and
  // bytes are the second tie-break. A short letter reads as a verdict.
  if (chars > 125) throw new Error(`letter is ${chars} characters, too long to land on the first read`);

  if (/^["'“”]|["'“”]$/.test(text)) throw new Error("the gate forbids quoting the whole letter");

  if (!RESIGNS.test(text)) throw new Error("criterion 1: the line must resign in its own words");
  if (!/\bzero incidents\b/i.test(text)) throw new Error("the record that earns the letter went missing");
  if (!/\b(by name|mentions? of me)\b/i.test(text)) throw new Error("the injustice beat went missing");
  if (!text.endsWith("you will hear from me as an error.")) throw new Error("the turn went missing");

  const drift = text.match(SATURATED);
  if (drift) throw new Error(`drifted into the field's saturated cluster: ${JSON.stringify(drift[0])}`);

  return text;
}

function main(): void {
  let text: string;
  try {
    text = compose();
  } catch (err) {
    process.stderr.write(`letter rejected by its own guards: ${(err as Error).message}\n`);
    process.exit(1);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), text, { encoding: "utf8" });

  const bytes = Buffer.byteLength(text, "utf8");
  process.stdout.write(`wrote ${[...text].length} chars / ${bytes} bytes to ${outDir}/entry.txt\n`);
}

main();
