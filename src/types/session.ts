export type SessionContent = {
  body: string;
  cwd: string;
  title: string;
};

export type SessionHit = SessionRecord & { score: number };

export type SessionRecord = {
  cwd: string;
  modifiedAt: number;
  sessionId: string;
  title: string;
};
