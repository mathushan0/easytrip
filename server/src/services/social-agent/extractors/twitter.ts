import axios from 'axios';
import { config } from '../../../config/index.js';
import type { RawPost } from '../../../types/index.js';

const TWITTER_API_BASE = 'https://api.twitter.com/2';

export class TwitterExtractor {
  private readonly bearerToken = config.social.twitterBearerToken;

  async searchTweets(query: string, maxResults = 20): Promise<RawPost[]> {
    if (!this.bearerToken) {
      console.warn('Twitter Bearer Token not configured');
      return [];
    }

    const travelQuery = `${query} (travel OR trip OR visit OR recommend) -is:retweet lang:en`;

    try {
      const response = await axios.get(`${TWITTER_API_BASE}/tweets/search/recent`, {
        headers: { Authorization: `Bearer ${this.bearerToken}` },
        params: {
          query: travelQuery,
          max_results: Math.min(maxResults, 100),
          'tweet.fields': 'created_at,author_id,public_metrics,lang',
          'user.fields': 'public_metrics,name,username,verified',
          expansions: 'author_id',
          'media.fields': 'preview_image_url',
        },
      });

      const tweets = response.data.data ?? [];
      const users: Map<string, {
        username: string;
        name: string;
        verified: boolean;
        followers_count: number;
      }> = new Map(
        (response.data.includes?.users ?? []).map(
          (u: {
            id: string;
            username: string;
            name: string;
            verified?: boolean;
            public_metrics?: { followers_count: number };
          }) => [
            u.id,
            {
              username: u.username,
              name: u.name,
              verified: u.verified ?? false,
              followers_count: u.public_metrics?.followers_count ?? 0,
            },
          ],
        ),
      );

      return tweets.map(
        (tweet: {
          id: string;
          text: string;
          author_id: string;
          created_at: string;
          public_metrics: {
            like_count: number;
            reply_count: number;
            retweet_count: number;
            impression_count: number;
          };
        }): RawPost => {
          const user = users.get(tweet.author_id);
          return {
            platform: 'twitter',
            platform_post_id: tweet.id,
            post_url: `https://twitter.com/i/web/status/${tweet.id}`,
            title: tweet.text.slice(0, 100),
            content: tweet.text,
            creator_username: user?.username ?? tweet.author_id,
            creator_display_name: user?.name,
            creator_follower_count: user?.followers_count ?? 0,
            likes_count: tweet.public_metrics.like_count,
            comments_count: tweet.public_metrics.reply_count,
            shares_count: tweet.public_metrics.retweet_count,
            views_count: tweet.public_metrics.impression_count,
            posted_at: tweet.created_at,
          };
        },
      );
    } catch (err) {
      console.warn('Twitter search failed:', (err as Error).message);
      return [];
    }
  }
}
