const tmi = require('tmi.js');
const MessageAnalyzer = require('../rating/messageAnalyzer');
const TwitchAuth = require('./auth');
const EventEmitter = require('events');

class TwitchBot extends EventEmitter {
    constructor(ratingSystem) {
        super();
        this.ratingSystem = ratingSystem;
        this.messageAnalyzer = new MessageAnalyzer();
        this.client = null;
        this.isConnected = false;
        this.auth = new TwitchAuth();
        
        // Don't setup client immediately - wait for authentication
    }

    async initialize() {
        try {
            console.log('Initializing Twitch bot authentication...');
            const oauthToken = await this.auth.getAccessToken();
            
            // Validate the token
            const isValid = await this.auth.validateToken(oauthToken);
            if (!isValid) {
                throw new Error('Invalid OAuth token');
            }
            
            this.setupClient(oauthToken);
            console.log('Twitch bot authentication successful');
        } catch (error) {
            console.error('Failed to initialize Twitch bot:', error.message);
            this.emit('status', 'error', error.message);
            throw error;
        }
    }

    setupClient(oauthToken) {
        this.client = new tmi.Client({
            options: { debug: process.env.NODE_ENV === 'development' },
            connection: {
                reconnect: true,
                secure: true
            },
            identity: {
                username: process.env.TWITCH_BOT_USERNAME,
                password: oauthToken
            },
            channels: [process.env.TWITCH_CHANNEL]
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.on('connecting', () => {
            console.log('Connecting to Twitch...');
            this.emit('status', 'connecting');
        });

        this.client.on('connected', (addr, port) => {
            console.log(`Connected to Twitch (${addr}:${port})`);
            this.isConnected = true;
            this.emit('status', 'connected', { channel: process.env.TWITCH_CHANNEL });
        });

        this.client.on('disconnected', (reason) => {
            console.log(`Disconnected from Twitch: ${reason}`);
            this.isConnected = false;
            this.emit('status', 'disconnected', reason);
        });

        this.client.on('message', (channel, tags, message, self) => {
            if (self) return; // Ignore bot's own messages

            this.handleMessage(channel, tags, message);
        });

        this.client.on('error', (error) => {
            console.error('Twitch bot error:', error);
        });
    }

    handleMessage(channel, tags, message) {
        try {
            // Analyze the message for sentiment and content
            const analysis = this.messageAnalyzer.analyze(message, tags);
            
            // Update the rating system
            this.ratingSystem.processMessage(analysis);
            
            // Log message for debugging
            if (process.env.NODE_ENV === 'development') {
                console.log(`${tags.username}: ${message} (Rating: ${analysis.rating})`);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    async connect() {
        if (!process.env.TWITCH_BOT_USERNAME || !process.env.TWITCH_CHANNEL) {
            console.error('Missing Twitch configuration. Please check your .env file.');
            console.error('Required: TWITCH_BOT_USERNAME, TWITCH_CHANNEL');
            console.error('Optional: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET (for automatic auth)');
            return;
        }

        try {
            await this.initialize();
            
            this.client.connect()
                .then(() => {
                    console.log(`Monitoring chat in #${process.env.TWITCH_CHANNEL}`);
                })
                .catch((error) => {
                    console.error('Failed to connect to Twitch:', error);
                    this.emit('status', 'error', error.message);
                });
        } catch (error) {
            console.error('Failed to initialize Twitch bot:', error.message);
            this.emit('status', 'error', error.message);
        }
    }

    disconnect() {
        if (this.client) {
            this.client.disconnect();
        }
        if (this.auth.authServer) {
            this.auth.authServer.close();
        }
    }

    isConnected() {
        return this.isConnected;
    }
}

module.exports = TwitchBot; 