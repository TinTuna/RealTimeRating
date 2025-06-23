# Twitch Chat Rating Plugin

A real-time Twitch chat monitoring system that tracks a rating variable from 1-100 based on specific chat messages and displays it as a live graph for streaming.

## Features

- Real-time chat monitoring: Connects to Twitch chat and monitors messages in real time.
- Simple rating system: Responds only to "+2" (positive) and "-2" (negative) messages.
- Live dashboard: Web interface with real-time charts and statistics.
- Stream overlay: Minimal overlay suitable for broadcasting.
- WebSocket updates: Real-time updates via Socket.IO.
- Automatic OAuth: No manual token setup required; provide your Client ID and Secret.

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Twitch Developer Application (for OAuth)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RealTimeRating
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Twitch credentials:
   ```env
   TWITCH_BOT_USERNAME=your_bot_username
   TWITCH_CHANNEL=your_channel_name
   TWITCH_CLIENT_ID=your_client_id
   TWITCH_CLIENT_SECRET=your_client_secret
   PORT=3000
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the dashboard**
   - Main Dashboard: http://localhost:3000
   - Stream Overlay: http://localhost:3000/overlay

## Twitch Bot Setup

### Creating a Twitch Developer Application

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application
3. Set the OAuth Redirect URL to `http://localhost:3001/auth/callback`
4. Copy the Client ID and Client Secret

### Automatic OAuth Authentication

The application supports automatic OAuth token generation. Provide your `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in the `.env` file. The application will:

1. On first run, open your browser for OAuth authorization.
2. After authorizing, redirect you to the dashboard at http://localhost:3000.
3. On subsequent runs, use the stored token automatically.
4. Validate and refresh tokens as needed.

Manual token copying or URL manipulation is not required.

#### Authentication Flow
- When prompted, log in as your bot account and authorize the application.
- After successful authentication, you will be redirected to the dashboard (http://localhost:3000).
- The dashboard and overlay will be available for use.

### Manual OAuth (Alternative)

If you prefer manual OAuth setup, set `TWITCH_OAUTH_TOKEN=oauth:your_oauth_token` in your `.env` file. The application will use your provided token instead of automatic generation.

## Configuration

### Environment Variables

| Variable                | Description                                 | Default   |
|-------------------------|---------------------------------------------|-----------|
| `TWITCH_BOT_USERNAME`   | Twitch bot username                         | Required  |
| `TWITCH_CHANNEL`        | Channel to monitor                          | Required  |
| `TWITCH_CLIENT_ID`      | Twitch app Client ID (for auto OAuth)       | Required* |
| `TWITCH_CLIENT_SECRET`  | Twitch app Client Secret (for auto OAuth)   | Required* |
| `TWITCH_OAUTH_TOKEN`    | Manual OAuth token (alternative)            | Optional  |
| `PORT`                  | Web server port                             | 3000      |
| `RATING_UPDATE_INTERVAL`| Rating update frequency (ms)                | 5000      |
| `RATING_HISTORY_SIZE`   | Number of history entries to keep           | 100       |

*Required for automatic OAuth. If not provided, you must use `TWITCH_OAUTH_TOKEN`.

### Rating System

- **"+2"**: Rating increases to 100 (maximum positive)
- **"-2"**: Rating decreases to 1 (maximum negative)
- **Any other message**: No effect on rating (neutral)

The system starts at a neutral rating of 50 and only responds to these specific strings.

## Usage

### Dashboard

The dashboard provides:
- Real-time rating display with animated progress bar
- Live chart showing rating history
- Statistics (messages, average, min, max)
- Recent messages with individual ratings
- Control buttons to reset or set custom ratings

### Stream Overlay

The minimal overlay is designed for streaming software like OBS.

### API Endpoints

- `GET /api/rating` - Get current rating and history
- `GET /api/stats` - Get detailed statistics
- `POST /api/reset` - Reset rating to neutral
- `POST /api/set-rating` - Set custom rating
- `GET /health` - Health check endpoint

## Customization

### Modifying Rating Values

Edit the rating values in `src/rating/messageAnalyzer.js`:

```javascript
analyzeSimpleRating(message) {
    if (message.includes('+2')) {
        return 100; // Adjust positive rating
    } else if (message.includes('-2')) {
        return 1;   // Adjust negative rating
    } else {
        return 50;  // Adjust neutral rating
    }
}
```

### Changing Trigger Strings

To use different trigger strings, modify the `analyzeSimpleRating` method:

```javascript
analyzeSimpleRating(message) {
    if (message.includes('your_positive_trigger')) {
        return 100;
    } else if (message.includes('your_negative_trigger')) {
        return 1;
    } else {
        return 50;
    }
}
```

### Styling the Overlay

Customize the overlay appearance in `public/overlay.css`:

```css
.overlay-container {
    position: fixed;
    top: 20px;
    right: 20px;
    /* Customize colors, size, etc. */
}
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Project Structure

```
RealTimeRating/
├── src/
│   ├── index.js              # Main application entry point
│   ├── twitch/
│   │   ├── twitchBot.js      # Twitch chat bot
│   │   └── auth.js           # Automatic OAuth authentication
│   ├── rating/
│   │   ├── ratingSystem.js   # Rating management
│   │   └── messageAnalyzer.js # Simple message analysis
│   └── web/
│       └── webServer.js      # Web server and routes
├── public/
│   ├── dashboard.html        # Main dashboard
│   ├── overlay.html          # Stream overlay
│   ├── styles.css            # Dashboard styles
│   ├── overlay.css           # Overlay styles
│   ├── dashboard.js          # Dashboard JavaScript
│   └── overlay.js            # Overlay JavaScript
├── package.json
├── env.example
└── README.md
```

## Troubleshooting

### Common Issues

1. **Bot not connecting to Twitch**
   - Ensure you have either `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` or `TWITCH_OAUTH_TOKEN` set.
   - Verify bot username and channel name. Channel name is the name of the channel you want to monitor and must match exactly.
   - Ensure your [Twitch Developer Console](https://dev.twitch.tv/console) app has the correct redirect URI: `http://localhost:3001/auth/callback`.

2. **OAuth authentication fails**
   - Ensure your browser can access `http://localhost:3001`.
   - Check that your Twitch app redirect URI matches exactly.
   - After successful authentication, you should be redirected to `http://localhost:3000`.
   - Refresh the page if the authentication window does not work as expected.

3. **Rating not updating**
   - Check browser console for errors.
   - Verify Socket.IO connection.
   - Check server logs for errors.
   - Ensure messages contain exactly "+2" or "-2".

4. **Overlay not showing**
   - Ensure overlay URL is correct.
   - Check if browser supports backdrop-filter.
   - Refresh the page if necessary.

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add tests if applicable.
5. Submit a pull request.

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub.
- Review the troubleshooting section.
- Consult the Twitch API documentation.
