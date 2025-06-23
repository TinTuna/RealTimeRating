# Twitch Chat Rating Plugin

A real-time Twitch chat monitoring system that tracks a rating variable from 1-100 based on specific chat messages and displays it as a beautiful graph for streaming.

## Features

- **Real-time Chat Monitoring**: Connects to Twitch chat and monitors messages in real-time
- **Simple Rating System**: Responds only to "+2" (positive) and "-2" (negative) messages
- **Live Dashboard**: Beautiful web interface with real-time charts and statistics
- **Stream Overlay**: Clean, minimal overlay perfect for broadcasting
- **WebSocket Updates**: Real-time updates via Socket.IO


## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Twitch Bot Account (for OAuth token)

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
   TWITCH_OAUTH_TOKEN=oauth:your_oauth_token
   TWITCH_CHANNEL=your_channel_name
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

### Creating a Twitch Bot Account

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application
3. Set the OAuth Redirect URL to `http://localhost:3000`
4. Copy the Client ID and Client Secret

### Getting OAuth Token

1. Visit: `https://id.twitch.tv/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000&response_type=token&scope=chat:read+chat:edit`
2. Authorize the application
3. Copy the access token from the URL
4. Add `oauth:` prefix to the token

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TWITCH_BOT_USERNAME` | Your Twitch bot username | Required |
| `TWITCH_OAUTH_TOKEN` | OAuth token for bot authentication | Required |
| `TWITCH_CHANNEL` | Channel to monitor | Required |
| `PORT` | Web server port | 3000 |
| `RATING_UPDATE_INTERVAL` | Rating update frequency (ms) | 5000 |
| `RATING_HISTORY_SIZE` | Number of history entries to keep | 100 |

### Rating System

The rating system is simple and predictable:

- **"+2"** → Rating increases to 100 (maximum positive)
- **"-2"** → Rating decreases to 1 (maximum negative)
- **Any other message** → No effect on rating (neutral)

The system starts at a neutral rating of 50 and only responds to these specific strings, making it perfect for controlled audience interaction.

## Usage

### Dashboard

The main dashboard provides:
- Real-time rating display with animated progress bar
- Live chart showing rating history
- Statistics (messages, average, min, max)
- Recent messages with individual ratings
- Control buttons to reset or set custom ratings

### Stream Overlay

The overlay is designed for streaming software:
- Clean, minimal design
- Transparent background
- Positioned in top-right corner
- Real-time updates with smooth animations

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
        return 100; // Change this to adjust positive rating
    } else if (message.includes('-2')) {
        return 1;   // Change this to adjust negative rating
    } else {
        return 50;  // Change this to adjust neutral rating
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
    top: 20px;        /* Adjust position */
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
│   │   └── twitchBot.js      # Twitch chat bot
│   ├── rating/
│   │   ├── ratingSystem.js   # Rating management
│   │   └── messageAnalyzer.js # Simple message analysis
│   └── web/
│       └── webServer.js      # Web server and routes
├── public/
│   ├── dashboard.html        # Main dashboard
│   ├── overlay.html          # Stream overlay
│   ├── styles.css           # Dashboard styles
│   ├── overlay.css          # Overlay styles
│   ├── dashboard.js         # Dashboard JavaScript
│   └── overlay.js           # Overlay JavaScript
├── package.json
├── env.example
└── README.md
```

## Troubleshooting

### Common Issues

1. **Bot not connecting to Twitch**
   - Check OAuth token format (should start with `oauth:`)
   - Verify bot username and channel name
   - Ensure bot has proper permissions

2. **Rating not updating**
   - Check browser console for errors
   - Verify Socket.IO connection
   - Check server logs for errors
   - Ensure messages contain exactly "+2" or "-2"

3. **Overlay not showing**
   - Ensure overlay URL is correct
   - Check if browser supports backdrop-filter
   - Try refreshing the page

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the Twitch API documentation

---

**Happy Streaming! 🎮📺** 
