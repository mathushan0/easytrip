import axios, { type AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import type { RawPost } from '../../types/index.js';

// ── Base Crawler ──────────────────────────────────────────────────────────────

export abstract class BaseCrawler {
  protected readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      timeout: 30_000,
      headers: {
        'User-Agent': 'EasyTripBot/1.0 (+https://easytrip.app/bot)',
        Accept: 'application/json, text/html',
      },
    });
  }

  abstract crawl(target: string): Promise<RawPost[]>;

  // ── Cheerio helpers ─────────────────────────────────────────────────────────

  protected async fetchHtml(url: string): Promise<cheerio.CheerioAPI> {
    const response = await this.http.get(url, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });
    return cheerio.load(response.data as string);
  }

  protected async checkRobotsTxt(baseUrl: string, path: string): Promise<boolean> {
    try {
      const url = new URL(baseUrl);
      const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
      const response = await this.http.get<string>(robotsUrl);
      const lines = response.data.split('\n');

      let applies = false;
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.startsWith('user-agent:')) {
          const agent = trimmed.split(':')[1]?.trim();
          applies = agent === '*' || agent === 'easytripbot';
        }
        if (applies && trimmed.startsWith('disallow:')) {
          const disallowed = trimmed.split(':')[1]?.trim() ?? '';
          if (disallowed && path.startsWith(disallowed)) {
            return false; // Path is disallowed
          }
        }
      }
      return true;
    } catch {
      return true; // Assume allowed if robots.txt not accessible
    }
  }
}
