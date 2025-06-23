require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const TwitchBot = require('./twitch/twitchBot');
const RatingSystem = require('./rating/ratingSystem');
const WebServer = require('./web/webServer');

class TwitchChatRating {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.botStatus = 'disconnected';
        this.botStatusDetails = null;
        this.setupMiddleware();

        this.ratingSystem = new RatingSystem();
        this.twitchBot = new TwitchBot(this.ratingSystem);
        this.webServer = new WebServer(this.app, this.io, this.ratingSystem);

        this.setupSocketHandlers();
        this.setupBotHandlers();
    }

    setupMiddleware() {
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    "default-src": ["'self'"],
                    "base-uri": ["'self'"],
                    "block-all-mixed-content": [],
                    "font-src": ["'self'", "https:", "data:"],
                    "frame-ancestors": ["'self'"],
                    "img-src": ["'self'", "data:"],
                    "object-src": ["'none'"],
                    "script-src": ["'self'", "https://cdn.jsdelivr.net"],
                    "script-src-attr": ["'none'"],
                    "style-src": ["'self'", "https:", "'unsafe-inline'"],
                    "upgrade-insecure-requests": [],
                }
            }
        }));
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    setupBotHandlers() {
        this.twitchBot.on('status', (status, details) => {
            this.botStatus = status;
            this.botStatusDetails = details;
            this.io.emit('botStatusUpdate', { status, details });
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Send initial data
            socket.emit('ratingUpdate', {
                currentRating: this.ratingSystem.getCurrentRating(),
                history: this.ratingSystem.getRatingHistory()
            });

            socket.emit('botStatusUpdate', { status: this.botStatus, details: this.botStatusDetails });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        // Listen for rating updates and broadcast to all clients
        this.ratingSystem.on('ratingUpdate', (data) => {
            this.io.emit('ratingUpdate', data);
        });

        this.twitchBot.connect();
    }

    start() {
        const port = process.env.PORT || 3000;
        
        this.server.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Rating dashboard: http://localhost:${port}`);
            console.log(`Stream overlay: http://localhost:${port}/overlay`);
        });
    }
}

// Start the application
const app = new TwitchChatRating();
app.start(); 