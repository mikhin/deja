import { chmodSync, mkdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const HOME = path.resolve(import.meta.dirname, "..", ".demo-home");

const SESSIONS = [
  {
    day: "2026-02-14",
    messages: ["the honey cake layers came out dry, what do I change in the recipe"],
    project: "kitchen",
    title: "Honey cake recipe",
  },
  {
    day: "2026-03-22",
    messages: ["cheesecake cracked again, is a water bath the only recipe that works"],
    project: "kitchen",
    title: "Cheesecake without a water bath",
  },
  {
    day: "2026-05-06",
    messages: ["scale the birthday cake recipe from 8 to 20 people"],
    project: "kitchen",
    title: "Birthday cake for twenty",
  },
  {
    day: "2026-06-30",
    messages: ["the apple pie crust turns soggy, is the recipe wrong about the butter"],
    project: "kitchen",
    title: "Apple pie crust",
  },
  {
    day: "2026-07-18",
    messages: ["conversion tracking fires twice on the thank-you page"],
    project: "shop",
    title: "Google Ads conversion tracking",
  },
  {
    day: "2026-08-04",
    messages: ["move the auth module behind a single service"],
    project: "api",
    title: "Refactor the auth module",
  },
];

const sessionId = (index) => `${String(index + 1).repeat(8)}-0000-4000-8000-000000000000`;

rmSync(HOME, { force: true, recursive: true });

for (const [index, session] of SESSIONS.entries()) {
  const directory = path.join(HOME, ".claude", "projects", `-Users-me-Code-${session.project}`);

  mkdirSync(directory, { recursive: true });

  mkdirSync(path.join(HOME, "Code", session.project), { recursive: true });

  const lines = [
    JSON.stringify({ aiTitle: session.title, type: "ai-title" }),
    ...session.messages.map((content) =>
      JSON.stringify({
        cwd: path.join(HOME, "Code", session.project),
        message: { content },
        type: "user",
      }),
    ),
  ];

  const file = path.join(directory, `${sessionId(index)}.jsonl`);
  const day = new Date(`${session.day}T12:00:00Z`);

  writeFileSync(file, `${lines.join("\n")}\n`);

  utimesSync(file, day, day);
}

const stubs = path.join(HOME, "bin");

mkdirSync(stubs, { recursive: true });

const deja = path.join(stubs, "deja");

writeFileSync(
  deja,
  `#!/bin/sh\nexec node ${path.resolve(import.meta.dirname, "..", "src", "main.ts")} "$@"\n`,
);

chmodSync(deja, 0o755);

const claude = path.join(stubs, "claude");

writeFileSync(
  claude,
  `#!/bin/sh\necho\necho "  Claude Code"\necho "  resumed session \${2}"\necho\n`,
);

chmodSync(claude, 0o755);

process.stdout.write(`${HOME}\n`);
