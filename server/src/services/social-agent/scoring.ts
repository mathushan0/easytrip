import type { ExtractedPost, ScoredPost } from '../../types/index.js';

// ── Trend Score Formula ───────────────────────────────────────────────────────
//
//   trend_score = (
//     log10(follower_count + 1) * 15 +    // reach     (0-30)
//     engagement_rate * 25 +               // engagement (0-25)
//     recency_score * 20 +                 // 0-20 based on hours since post
//     mention_velocity * 20 +              // same venue mentioned N times recently
//     sentiment_score * 15                 // positive=15, neutral=7, negative=0
//   ) clamped 0-100

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function reachScore(followerCount: number): number {
  // log10 scale: 1k followers → ~9, 1M followers → ~18, 10M → ~22
  return clamp(Math.log10(followerCount + 1) * 5, 0, 30);
}

function engagementScore(post: ExtractedPost): number {
  const total =
    (post.likes_count ?? 0) +
    (post.comments_count ?? 0) * 2 + // Comments weigh more
    (post.shares_count ?? 0) * 3; // Shares weigh most

  const views = post.views_count ?? 1;
  const engagementRate = views > 0 ? total / views : 0;

  // 1% engagement = full score (generous for travel content)
  return clamp(engagementRate * 2500, 0, 25);
}

function recencyScore(postedAt?: string): number {
  if (!postedAt) return 5; // Unknown age — partial score

  const hoursAgo = (Date.now() - new Date(postedAt).getTime()) / (1000 * 60 * 60);

  if (hoursAgo < 6) return 20;
  if (hoursAgo < 24) return 18;
  if (hoursAgo < 72) return 14;
  if (hoursAgo < 168) return 10; // 1 week
  if (hoursAgo < 720) return 6;  // 1 month
  return 2;
}

function sentimentScore(sentiment?: string): number {
  switch (sentiment) {
    case 'positive': return 15;
    case 'neutral': return 7;
    case 'negative': return 0;
    default: return 5;
  }
}

export function calculateTrendScore(
  post: ExtractedPost,
  mentionVelocity = 0,
): number {
  const reach = reachScore(post.creator_follower_count ?? 0);
  const engagement = engagementScore(post);
  const recency = recencyScore(post.posted_at);
  const velocity = clamp(mentionVelocity * 4, 0, 20); // 5 mentions → full velocity score
  const sentiment = sentimentScore(post.sentiment);

  const raw = reach + engagement + recency + velocity + sentiment;
  return clamp(Math.round(raw), 0, 100);
}

export function scorePosts(posts: ExtractedPost[]): ScoredPost[] {
  // Build velocity map: how many times is each venue mentioned in this batch?
  const venueCounts = new Map<string, number>();
  for (const post of posts) {
    if (post.venue_name) {
      const key = post.venue_name.toLowerCase();
      venueCounts.set(key, (venueCounts.get(key) ?? 0) + 1);
    }
  }

  return posts.map((post) => {
    const velocity = post.venue_name
      ? (venueCounts.get(post.venue_name.toLowerCase()) ?? 1) - 1
      : 0;

    return {
      ...post,
      trend_score: calculateTrendScore(post, velocity),
    };
  });
}
