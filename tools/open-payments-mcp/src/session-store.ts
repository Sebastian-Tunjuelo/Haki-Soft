import fs from "node:fs/promises";
import path from "node:path";
import type { GrantSession, SessionStoreData } from "./types.js";

export class SessionStore {
  constructor(private readonly filePath: string) {}

  async get(id: string): Promise<GrantSession | undefined> {
    const data = await this.read();
    return data.sessions[id];
  }

  async list(): Promise<GrantSession[]> {
    const data = await this.read();
    return Object.values(data.sessions).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async save(session: GrantSession): Promise<GrantSession> {
    const data = await this.read();
    const now = new Date().toISOString();
    data.sessions[session.id] = {
      ...session,
      updatedAt: now,
    };
    await this.write(data);
    return data.sessions[session.id];
  }

  async update(
    id: string,
    updater: (session: GrantSession) => GrantSession
  ): Promise<GrantSession> {
    const existing = await this.getRequired(id);
    return this.save(updater(existing));
  }

  async getRequired(id: string): Promise<GrantSession> {
    const session = await this.get(id);
    if (!session) {
      throw new Error(`Grant session not found: ${id}`);
    }
    return session;
  }

  private async read(): Promise<SessionStoreData> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as SessionStoreData;
      return { sessions: parsed.sessions ?? {} };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { sessions: {} };
      }
      throw error;
    }
  }

  private async write(data: SessionStoreData): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await fs.rename(temporaryPath, this.filePath);
  }
}
