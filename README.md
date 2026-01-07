# SoundCloud Latest Tracks Finder

Generate a JSON file with your latest SoundCloud tracks to embed on your static website or GitHub Pages.

## Features

- **Static Site Ready**: Generate a JSON file with your latest tracks for use on GitHub Pages or any static site
- **SoundCloud Embeds**: Includes pre-formatted embed URLs for easy player integration
- **Auto-Update**: GitHub Actions workflow to automatically update your tracks daily
- **OAuth 2.1 Authentication**: Uses SoundCloud's latest authentication system
- **Public Track Filtering**: Automatically filters for public tracks only
- **Customizable Embeds**: Full control over embed player appearance and behavior
- **No Hosting Required**: Runs entirely on GitHub Actions - no server needed

## Prerequisites

- A SoundCloud account with tracks
- SoundCloud API credentials (Client ID and Client Secret) - requires application approval
- GitHub repository for GitHub Actions (optional for auto-updates)
- Node.js 18+ installed (only for local testing)

## Getting SoundCloud API Credentials

1. Go to [SoundCloud for Developers](https://soundcloud.com/you/apps)
2. Apply for API access - SoundCloud will review your application
3. Once approved, you'll receive your **Client ID** and **Client Secret**

## Quick Start

### Option 1: GitHub Actions Only (Recommended)

Perfect if you want everything automated without running anything locally.

1. **Fork or clone this repository to your GitHub account**

2. **Add GitHub Secrets** to your repository:
   - Go to Settings → Secrets and variables → Actions
   - Add these secrets:
     - `SOUNDCLOUD_CLIENT_ID`
     - `SOUNDCLOUD_CLIENT_SECRET`
     - `SOUNDCLOUD_USERNAME`

3. **Run the workflow**:
   - Go to Actions tab
   - Select "Update SoundCloud Tracks"
   - Click "Run workflow"
   - `tracks.json` will be generated and committed to your repo

4. **Use in your GitHub Pages site**:
   - Reference the JSON in your HTML (see integration example below)

### Option 2: Local Setup (For Testing)

1. **Installation**:
```bash
git clone <your-repo-url>
cd SC-LatestTracksFinder
npm install
```

2. **Configuration**:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
SOUNDCLOUD_CLIENT_ID=your_client_id_here
SOUNDCLOUD_CLIENT_SECRET=your_client_secret_here
SOUNDCLOUD_USERNAME=your_username_here
TRACK_LIMIT=5
```

3. **Generate Tracks JSON**:
```bash
npm run generate
```

This creates `tracks.json` with your latest tracks.

## Integration with Static Sites

### Two Repository Setup (Recommended)

Keep your homepage repo clean by using two separate repositories:

1. **This repository (SC-LatestTracksFinder)** - GitHub Actions runs here, commits `tracks.json` here
2. **Your homepage repository** - Fetches the JSON via URL, no automatic commits

This keeps all the daily auto-update commits in the SC-LatestTracksFinder repo, leaving your homepage repo's commit history clean.

### For GitHub Pages

In your **homepage repository**, fetch the JSON from this repository using the raw GitHub URL:

```html
<div id="soundcloud-tracks"></div>

<script>
async function loadTracks () {
    // Fetch from SC-LatestTracksFinder repository (change YOUR_USERNAME)
    const response = await fetch('https://raw.githubusercontent.com/YOUR_USERNAME/SC-LatestTracksFinder/main/tracks.json')
    const data = await response.json()

    let html = ''
    data.tracks.forEach(track => {
        html += `
            <div class="track">
                <h3>${track.title}</h3>
                <iframe
                    height="166"
                    scrolling="no"
                    frameborder="no"
                    src="${track.embed_url}">
                </iframe>
            </div>
        `
    })

    document.getElementById('soundcloud-tracks').innerHTML = html
}

loadTracks()
</script>
```

**Important**: Replace `YOUR_USERNAME` with your actual GitHub username.

### How It Works

1. GitHub Actions runs daily in SC-LatestTracksFinder repo
2. Updates `tracks.json` and commits it there
3. Your homepage fetches the latest JSON via the raw GitHub URL
4. Your homepage repo stays clean - no automatic commits

### View the Example

Open `example.html` in your browser to see a complete, styled implementation you can customize.

## Embed Player Customization

Customize the appearance and behavior of embedded SoundCloud players using environment variables:

### Available Options

```env
# Color (hex without #, default: ff5500 - SoundCloud orange)
EMBED_COLOR=ff5500

# Auto-play when page loads (default: false)
EMBED_AUTO_PLAY=false

# Hide related tracks (default: false)
EMBED_HIDE_RELATED=false

# Show comments section (default: true)
EMBED_SHOW_COMMENTS=true

# Show user information (default: true)
EMBED_SHOW_USER=true

# Show reposts (default: false)
EMBED_SHOW_REPOSTS=false

# Show teaser (default: true)
EMBED_SHOW_TEASER=true
```

### Example Customizations

**Minimal player (no extras):**
```env
EMBED_COLOR=000000
EMBED_HIDE_RELATED=true
EMBED_SHOW_COMMENTS=false
EMBED_SHOW_REPOSTS=false
EMBED_SHOW_TEASER=false
```

**Match your brand color:**
```env
EMBED_COLOR=3498db  # Blue
```

**Auto-play first track:**
```env
EMBED_AUTO_PLAY=true
```

## Configuration Options

Environment variables in `.env` or GitHub Secrets:

- `SOUNDCLOUD_CLIENT_ID` - Your SoundCloud app client ID (required)
- `SOUNDCLOUD_CLIENT_SECRET` - Your SoundCloud app client secret (required)
- `SOUNDCLOUD_USERNAME` - Can be:
  - Username (e.g., `username`)
  - User ID (e.g., `123456789`)
  - Full profile URL (e.g., `https://soundcloud.com/username`)
- `TRACK_LIMIT` - Number of **public** tracks to fetch (default: 5)
  - Script fetches 3x this number to filter for public tracks
- `OUTPUT_FILE` - Output JSON filename (default: `tracks.json`)
- `EMBED_*` - Embed customization options (see above)

## Auto-Update with GitHub Actions

Set up automatic daily updates of your tracks without running anything manually.

### 1. Add Secrets to GitHub Repository

Go to your repository Settings → Secrets and variables → Actions, and add:

- `SOUNDCLOUD_CLIENT_ID`
- `SOUNDCLOUD_CLIENT_SECRET`
- `SOUNDCLOUD_USERNAME`

### 2. The Workflow

The workflow file `.github/workflows/update-tracks.yml` is already configured. It will:

- Run daily at 6 AM and 6 PM UTC (customizable)
- Run manually from the Actions tab
- Fetch your latest public tracks
- Commit `tracks.json` to your repository
- Your GitHub Pages site automatically updates

### 3. Customize Schedule

Edit `.github/workflows/update-tracks.yml` to change the schedule:

```yaml
schedule:
  - cron: '0 6,18 * * *'  # Twice daily at 6 AM and 6 PM UTC
  # Examples:
  # - cron: '0 */6 * * *'  # Every 6 hours
  # - cron: '0 0 * * 0'    # Weekly on Sunday
```

### 4. Manual Trigger

You can trigger the workflow manually anytime:
1. Go to Actions tab in your GitHub repository
2. Select "Update SoundCloud Tracks"
3. Click "Run workflow"

## JSON Structure

The generated `tracks.json` contains:

```json
{
  "user": {
    "id": 123456,
    "username": "your_username",
    "permalink_url": "https://soundcloud.com/your_username",
    "avatar_url": "...",
    "followers_count": 1234,
    "track_count": 56
  },
  "tracks": [
    {
      "id": 789012,
      "title": "Track Title",
      "permalink_url": "https://soundcloud.com/...",
      "embed_url": "https://w.soundcloud.com/player/?url=...",
      "created_at": "2026-01-07T12:00:00Z",
      "duration": "3:45",
      "playback_count": 1234,
      "likes_count": 56,
      "comment_count": 12,
      "genre": "Electronic",
      "artwork_url": "...",
      "waveform_url": "..."
    }
  ],
  "generated_at": "2026-01-07T12:00:00.000Z",
  "track_count": 5
}
```

## Project Structure

```
SC-LatestTracksFinder/
├── index.js                    # Console display script
├── generate-tracks.js          # JSON generation script
├── soundcloud.js              # SoundCloud API client with OAuth 2.1
├── example.html               # Full HTML/CSS/JS example
├── package.json               # Dependencies and scripts
├── .env.example               # Environment template
├── .github/
│   └── workflows/
│       └── update-tracks.yml  # GitHub Actions workflow
└── README.md                  # This file
```

## API Client Features

The `SoundCloudClient` class in `soundcloud.js` provides:

- `getAccessToken()` - Get OAuth 2.1 access token (Client Credentials flow)
- `getUser(identifier)` - Get user info by username/ID/URL
- `resolve(soundcloudUrl)` - Resolve any SoundCloud URL
- `getUserTracks(userId, limit)` - Get user's latest tracks
- `formatTrack(track)` - Format track data for display

## Troubleshooting

### "Failed to fetch user" error
- Verify your username is correct
- Try using your full profile URL instead
- Check that your profile is public

### "Token request failed" or 401 errors
- Verify your Client ID and Client Secret are correct
- Make sure your SoundCloud app has been approved
- Check [SoundCloud API status](https://status.soundcloud.com/)

### Getting fewer tracks than expected
- The script filters for **public tracks only**
- Private tracks are automatically excluded
- The script fetches 3x the limit to ensure enough public tracks
- If you have many private tracks, some may be filtered out

### GitHub Actions not running
- Ensure secrets are added to repository settings
- Check that Actions are enabled in repository settings
- Review the Actions tab for error logs

### CORS errors on static site
- Ensure `tracks.json` is fetched from the same domain or via raw GitHub URL
- GitHub's raw.githubusercontent.com has proper CORS headers
- For local testing, use a local server (not `file://`)

## Tips

- **No local setup needed**: Use GitHub Actions exclusively - you don't need to run anything locally
- **Testing locally**: Use `python -m http.server` or `npx serve` to test your static site locally
- **Commit tracks.json**: The workflow automatically commits it, making it available on GitHub Pages
- **Cache busting**: Add `?v=${Date.now()}` to fetch URL if browsers cache aggressively
- **Styling**: See `example.html` for a complete styled example you can customize
- **Embed colors**: Use hex colors without the # symbol (e.g., `ff5500` not `#ff5500`)

## License

ISC

## Notes

- Uses SoundCloud OAuth 2.1 API
- Automatically filters for public tracks only
- Generated JSON is static - updates only when script runs
- GitHub Actions free tier includes 2,000 minutes/month (plenty for daily updates)
- SoundCloud embeds are official and load from SoundCloud's CDN
- No server hosting required - runs entirely on GitHub infrastructure
