import { RedisClientType, createClient } from "redis";
import crypto from "crypto";

export class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({ url: "redis://localhost:6379" });

    this.client.on("connect", () => {
      console.log("Redis connected");
    });

    this.client.on("error", (err) => {
      console.error("Redis error:", err);
    });

    this.isConnected = false;
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }

  async get(key: string) {
    await this.connect();
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds = 600) {
    await this.connect();
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }

  async del(key: string) {
    await this.connect();
    const result = await this.client.del(key);
    return result;
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  generateCacheKey(baseKey: string, params: any): string {
    const hash = crypto
      .createHash("md5")
      .update(JSON.stringify(params))
      .digest("hex");
    return `${baseKey}_${hash}`;
  }

  async scanKeys(pattern: string): Promise<string[]> {
    await this.connect();

    const foundKeys: string[] = [];
    let cursor = "0";

    do {
      const result = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = result.cursor;
      foundKeys.push(...result.keys);
    } while (cursor !== "0");

    return foundKeys;
  }

  async deleteUserProjectCache(userId: string) {
    const pattern = `project_${userId}_*`;
    const keys = await this.scanKeys(pattern);
    for (const key of keys) {
      await this.client.del(key);
    }
  }
}
