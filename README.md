# Tomato Stats

A creator analytics workspace with real sign-in, persistent records and downloadable reports. Each user starts with an empty workspace. The data source is what the user enters from their Instagram, YouTube and X insights.

## Run on your laptop

Use **Node.js 22.13 or later** and npm. In the extracted project folder run:

```sh
npm install
npm run dev
```

Open the localhost URL printed in the terminal. Select **Open workspace → New here? Create an account**. Local records persist in `.tomato/workspace.sqlite` across refreshes, sign-outs and server restarts. The local server binds to loopback by default. The first local account can review inquiries and publish service pricing. Back up the entire `.tomato/` folder with the server stopped to retain your local accounts and data.

For a local production build:

```sh
npm run build
npm run preview
```

Both local commands serve the application API. Serving the HTML alone will not provide sign-in or storage.

## First use

1. Create a creator profile with your name or brand, handle, niche and city.
2. Use **Add post** to enter a publication date, platform, format, views and interactions. Edit a saved post through **Content → Post details → Edit post**.
3. Record a dated **Audience snapshot** for each platform. Follower count is required. Age, gender, cities, interests and hourly activity are optional. Enter measured percentages in the formats shown in the form.
4. Switch creator, platform, reporting window or period-ending date. Add earlier posts and follower snapshots to establish a comparison baseline.
5. Save a trend or recommendation into **Your content plan**, add your own action, or mark it complete.
6. Download the PDF in **Reports**. **Share report** opens system sharing where supported, copies a summary, or displays selectable text.
7. Send a contact enquiry or request a consultation. The **Requests** inbox shows its stored status. Only the operator can confirm a requested session. The operator can also open **Pricing → Edit pricing** on the landing page and publish their own plans. Enquiries are stored in the application inbox.

## Measurements

- Views and reach sum the entered totals of posts published during the chosen window. Updating a post corrects its totals. This is a publication-date cohort report, not a daily impression feed. Summed post reach may include a person more than once.
- Engagement is 100 × (likes + comments + shares) ÷ views. The chart and report derive from the same records.
- Follower count uses the latest platform snapshot on or before the end date. Growth compares the previous equal-length period when a matching baseline exists.
- A dash means unavailable. Missing reach or an unknown denominator stays unreported. Optional audience percentages use follower-weighted snapshots. Unmeasured activity slots are grey.
- Post retention uses measured average watch time divided by duration. The optional retention curve displays user-entered observations only. An HTTPS link opens the original post. Direct MP4/WebM links support browser playback.
- Trend rankings come from hashtags, topics and sounds on recorded posts. Posting slots compare engagement by publication day and hour in IST. Recommendations cite actual observations, without forecasting a guaranteed uplift.
- Monthly prices are entered by the operator. Yearly prices apply the displayed 20% discount. Plan enquiries and session bookings do not collect payment.
- Platform metrics are entered manually. Social network OAuth, automatic data sync, external calendars, and email delivery are not configured.

## Hosted version

The production Worker uses the site's verified ChatGPT identity and a D1 binding named `DB`. Personal workspace reads and writes use that authenticated identity. The site operator is selected by the private runtime variable `TOMATO_OWNER_EMAIL`. Service pricing is readable by site visitors. Inquiries remain visible to their author and the configured operator. The hosted site retains its existing private access policy.

The local server has independent accounts, salted password hashes and HTTP-only session cookies. Local API calls ignore hosted identity headers. Local and hosted data are separate.

## Project layout

```text
src/data/creators.js    Input validation and analytics calculations
src/Studio.jsx          Current session, creator and report filters
src/components/        Charts, record editor, requests, price editor, branding
src/pages/             Landing, login and the six workspace sections
server/api.js          Identity-scoped data API shared by both runtimes
server/worker.js       Hosted entry point and asset serving
server/local.js        Local SQLite, authentication and Vite middleware
db/schema.js           Database table definitions
drizzle/               Versioned database migrations
scripts/               Build packaging and automated checks
```

Run `npm run check:data` for the measurement, validation, isolation, persistence and booking tests. Run `npm run db:generate` after a schema change. The local server applies pending migrations when it starts. The hosted deployment applies migrations during publishing.
