import axios from 'axios';
import { config } from '../../../config/index.js';
import type { RawPost } from '../../../types/index.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export class YouTubeExtractor {
  private readonly apiKey = config.social.youtubeApiKey;

  async searchVideos(query: string, maxResults = 20): Promise<RawPost[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key not configured');
      return [];
    }

    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        key: this.apiKey,
        q: `${query} travel guide 2025 OR 2026`,
        part: 'snippet',
        type: 'video',
        maxResults,
        order: 'relevance',
        videoCategoryId: '19', // Travel & Events
        publishedAfter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    const items = response.data.items ?? [];
    const videoIds = items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',');

    if (!videoIds) return [];

    // Fetch statistics
    const statsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        key: this.apiKey,
        id: videoIds,
        part: 'statistics,snippet',
      },
    });

    // Fetch channel subscriber counts
    const channelIds = [
      ...new Set(
        statsResponse.data.items.map(
          (item: { snippet: { channelId: string } }) => item.snippet.channelId,
        ),
      ),
    ].join(',');

    let channelStats: Record<string, number> = {};
    if (channelIds) {
      const channelResponse = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
          key: this.apiKey,
          id: channelIds,
          part: 'statistics',
        },
      });
      channelStats = Object.fromEntries(
        channelResponse.data.items.map(
          (ch: { id: string; statistics: { subscriberCount: string } }) => [
            ch.id,
            parseInt(ch.statistics.subscriberCount ?? '0', 10),
          ],
        ),
      );
    }

    return statsResponse.data.items.map(
      (item: {
        id: string;
        snippet: {
          title: string;
          description: string;
          channelTitle: string;
          channelId: string;
          publishedAt: string;
          thumbnails: { high?: { url: string }; default?: { url: string } };
        };
        statistics: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
      }): RawPost => ({
        platform: 'youtube',
        platform_post_id: item.id,
        post_url: `https://youtube.com/watch?v=${item.id}`,
        title: item.snippet.title,
        content: item.snippet.description.slice(0, 500),
        creator_username: item.snippet.channelTitle,
        creator_display_name: item.snippet.channelTitle,
        creator_follower_count: channelStats[item.snippet.channelId] ?? 0,
        likes_count: parseInt(item.statistics.likeCount ?? '0', 10),
        views_count: parseInt(item.statistics.viewCount ?? '0', 10),
        comments_count: parseInt(item.statistics.commentCount ?? '0', 10),
        posted_at: item.snippet.publishedAt,
        thumbnail_url:
          item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.default?.url,
      }),
    );
  }
}
