# EasyTrip Privacy Policy

**Last updated:** 21 April 2026  
**Effective date:** 21 April 2026

---

## Who We Are

EasyTrip is operated by EasyTrip Ltd ("EasyTrip", "we", "us", "our").  
For privacy enquiries: **privacy@easytrip.app**  
Postal address: *[Registered address to be added before launch]*

We are the **data controller** for personal data collected through the EasyTrip app and website.

---

## Data We Collect

### Account information

When you register, we collect:
- Email address
- Display name (optional)
- Profile photo URL (optional, synced from your Google/Apple account if you use OAuth)
- Authentication provider (Google, Apple, or email)

### Trip and itinerary data

When you create and use trips, we store:
- Destination, dates, duration, and timezone
- Budget amount and currency
- Travel preferences (pace, dietary requirements, interests)
- Your generated itinerary (days, tasks, venues)
- Task completion status and custom tasks you add
- Shared trip content if you enable public sharing

### Expenses

When you use the budget tracker:
- Expense amounts, currencies, categories, and descriptions
- Exchange rates at the time of logging
- Venue associations where you choose to link them

### Translation activity

When you use the translator:
- Text you submit for translation (processed and stored temporarily for rate limiting; not used to train AI models)
- Images submitted for OCR translation (processed server-side; not stored permanently)
- Phrases you save to your library

### Usage and device data

We collect through Sentry (error tracking) and PostHog (analytics):
- App version, device OS, and screen resolution
- Crash reports and error logs (no personally identifiable content included)
- Feature usage events (e.g. "trip created", "budget expense logged") — anonymised
- Session duration and screen navigation patterns

We do **not** track your GPS location in the background. Location access is used only when you actively request directions or nearby search within the app.

### Payment data

We do not store your payment card details. Payments are processed by:
- **Stripe** (web purchases) — see [stripe.com/privacy](https://stripe.com/privacy)
- **Apple** (iOS in-app purchases) — see [apple.com/legal/privacy](https://www.apple.com/legal/privacy/)
- **Google** (Android in-app purchases) — see [policies.google.com/privacy](https://policies.google.com/privacy)

We store only: subscription status, tier, purchase platform, and the provider's subscription/transaction ID.

---

## Social Media Data

The Nomad Pro Social Intelligence feature displays publicly available social media posts. We collect and store:

- Post URL and platform
- Creator username and display name (as publicly shown on the platform)
- Creator follower count (public)
- A short excerpt of the post (maximum 50 words)
- Engagement metrics (likes, views) as publicly visible
- Whether the creator account is verified on the platform

**What we do not collect:**
- Private or non-public posts
- Direct messages
- Private account data
- Email addresses or contact details of creators
- Biometric or sensitive personal data

**Sources:**  
YouTube (via YouTube Data API v3), Reddit (via Reddit API), Twitter/X (via Twitter/X API v2 Basic). All data is obtained from official APIs in compliance with their respective terms of service.

**Attribution:**  
All posts shown in the app include a link back to the original content and credit the creator by name. We show excerpts only, not full post content.

**For creators:**  
If you are a content creator and would like your content excluded from EasyTrip's Social Intelligence feature, please contact **privacy@easytrip.app** with the URL of your content or your platform username. We will remove it within 14 days.

---

## How We Use Your Data

| Purpose | Legal Basis |
|---|---|
| Providing the app and its features | Performance of contract (Art. 6(1)(b) GDPR) |
| Generating AI itineraries using your trip preferences | Performance of contract |
| Sending transactional emails (account, receipt) | Performance of contract |
| Processing payments and managing subscriptions | Performance of contract |
| Security, fraud prevention, and abuse detection | Legitimate interests (Art. 6(1)(f)) |
| Analytics to improve the app | Legitimate interests |
| Legal compliance and dispute resolution | Legal obligation (Art. 6(1)(c)) |

We do **not** use your personal data to train AI models. Your itineraries and preferences are used solely to generate your trip and provide the app's features.

We do **not** sell your personal data to third parties.

---

## Third-Party Processors

We share data with the following processors, each bound by GDPR-compliant data processing agreements:

| Processor | Purpose | Data shared | Region |
|---|---|---|---|
| **Supabase** | Authentication | Email, user ID | EU |
| **AWS** (Amazon Web Services) | Hosting, storage, CDN | All app data | EU (eu-west-1) |
| **Anthropic** | AI itinerary generation | Trip destination, dates, preferences | USA |
| **OpenAI** | AI fallback and social extraction | Same as Anthropic | USA |
| **Google Cloud** | Maps, translation, OCR, TTS | Location queries, text, images | Multiple |
| **Stripe** | Web payments | Email, purchase details | USA/EU |
| **Resend** | Transactional email | Email address, name | USA |
| **Sentry** | Error tracking | Anonymised error data | USA |
| **PostHog** | Analytics | Anonymised usage events | EU |

Where processors are based outside the UK/EU, transfers are covered by Standard Contractual Clauses or adequacy decisions.

---

## Data Retention

| Data type | Retention period |
|---|---|
| Account and profile data | Until you delete your account, then 30 days before permanent deletion |
| Trip and itinerary data | Until you delete the trip or your account |
| Expenses | Until you delete the expense, trip, or account |
| Translation history | Not stored (processed in real-time only) |
| Payment records | 7 years (legal requirement for financial records) |
| Error logs (Sentry) | 90 days |
| Analytics data (PostHog) | 12 months, then anonymised aggregates only |
| Social media posts | 90 days from crawl date, then automatically deleted |

---

## Your Rights (GDPR / UK GDPR)

As a user in the UK or EU, you have the following rights:

- **Access** — Request a copy of all personal data we hold about you
- **Rectification** — Ask us to correct inaccurate data
- **Erasure** — Request deletion of your account and all associated data
- **Portability** — Receive your data in a machine-readable format (JSON)
- **Restriction** — Ask us to restrict processing while a dispute is resolved
- **Objection** — Object to processing based on legitimate interests
- **Withdraw consent** — Where processing is based on consent, withdraw it at any time

**To exercise your rights:**  
- In the app: Settings → Account → Delete Account (for erasure)
- In the app: Settings → Account → Download My Data (for portability)
- By email: privacy@easytrip.app — we respond within 30 days

**Complaints:**  
If you are unhappy with how we handle your data, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk, or your local EU supervisory authority.

---

## Children

EasyTrip is not directed at children under 16. We do not knowingly collect personal data from anyone under 16. If you believe a child has registered, please contact privacy@easytrip.app and we will delete the account promptly.

---

## Security

We protect your data using:
- TLS encryption for all data in transit
- Encryption at rest on AWS RDS and S3
- Authentication tokens stored encrypted on your device (not in insecure storage)
- Least-privilege access controls across all internal systems
- Regular security reviews and dependency updates

No system is perfectly secure. In the event of a data breach that poses a risk to your rights and freedoms, we will notify you and the relevant supervisory authority within 72 hours, as required by GDPR.

---

## Cookies

The EasyTrip mobile app does not use browser cookies. If you access EasyTrip via a web browser (e.g. for web checkout), functional cookies are used only for session management. No third-party tracking cookies are used on our web pages.

---

## Changes to This Policy

We will update this policy when our practices change. Significant changes will be notified in-app and, where required by law, we will seek renewed consent. The "Last updated" date at the top reflects the most recent revision.

---

## Contact

**EasyTrip Ltd**  
privacy@easytrip.app  
easytrip.app/privacy
