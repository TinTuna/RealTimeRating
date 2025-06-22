const path = require('path');

class WebServer {
    constructor(app, io, ratingSystem) {
        this.app = app;
        this.io = io;
        this.ratingSystem = ratingSystem;
        
        this.setupRoutes();
    }

    setupRoutes() {
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
        });

        // Stream overlay
        this.app.get('/overlay', (req, res) => {
            res.sendFile(path.join(__dirname, '../../public/overlay.html'));
        });

        // API routes
        this.app.get('/api/rating', (req, res) => {
            res.json({
                currentRating: this.ratingSystem.getCurrentRating(),
                history: this.ratingSystem.getRatingHistory()
            });
        });

        this.app.get('/api/stats', (req, res) => {
            res.json(this.ratingSystem.getStats());
        });

        // Reset rating endpoint
        this.app.post('/api/reset', (req, res) => {
            this.ratingSystem.reset();
            res.json({ success: true, message: 'Rating reset successfully' });
        });

        // Set rating endpoint
        this.app.post('/api/set-rating', (req, res) => {
            const { rating } = req.body;
            if (typeof rating === 'number' && rating >= 1 && rating <= 100) {
                this.ratingSystem.setRating(rating);
                res.json({ success: true, message: 'Rating set successfully' });
            } else {
                res.status(400).json({ success: false, message: 'Invalid rating value' });
            }
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                rating: this.ratingSystem.getCurrentRating(),
                messageCount: this.ratingSystem.messageCount
            });
        });
    }
}

module.exports = WebServer; 