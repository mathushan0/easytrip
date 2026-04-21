import axios from 'axios';
import { config } from '../../../config/index.js';
import type { RawPost } from '../../../types/index.js';

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_API_BASE = 'https://oauth.reddit.com';

export class RedditExtractor {
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!config.social.redditClientId || !config.social.redditClientSecret) {
      throw new Error('Reddit credentials not configured');
    }

    const response = await axios.post(
      REDDIT_TOKEN_URL,
      'grant_type=client_credentials',
      {
        auth: {
          username: config.social.redditClientId,
          password: config.social.redditClientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'EasyTripBot/1.0 (+https://easytrip.app/bot)',
        },
      },
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    return this.accessToken!;
  }

  async searchPosts(destination: string, maxPosts = 25): Promise<RawPost[]> {
    const token = await this.getAccessToken();

    const TRAVEL_SUBREDDITS = [
      'travel',
      'solotravel',
      'backpacking',
      'Shoestring',
      'TravelHacks',
    ];

    const posts: RawPost[] = [];

    for (const subreddit of TRAVEL_SUBREDDITS.slice(0, 3)) {
      try {
        const response = await axios.get(`${REDDIT_API_BASE}/r/${subreddit}/search`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'EasyTripBot/1.0 (+https://easytrip.app/bot)',
          },
          params: {
            q: destination,
            restrict_sr: 'true',
            sort: 'top',
            t: 'month',
            limit: Math.ceil(maxPosts / TRAVEL_SUBREDDITS.length),
          },
        });

        const children = response.data?.data?.children ?? [];

        for (const child of children) {
          const post = child.data;
          if (post.score < 10) continue; // Skip low-quality posts

          posts.push({
            platform: 'reddit',
            platform_post_id: post.id,
            post_url: `https://reddit.com${post.permalink}`,
            title: post.title,
            content: post.selftext?.slice(0, 1000) ?? '',
            creator_username: post.author,
            creator_display_name: post.author,
            creator_follower_count: 0, // Reddit doesn't expose follower counts easily
            likes_count: post.score,
            comments_count: post.num_comments,
            posted_at: new Date(post.created_utc * 1000).toISOString(),
            thumbnail_url: post.thumbnail?.startsWith('http') ? post.thumbnail : undefined,
          });
        }
      } catch (err) {
        console.warn(`Reddit search failed for r/${subreddit}:`, (err as Error).message);
      }
    }

    return posts.slice(0, maxPosts);
  }
}
