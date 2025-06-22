const EventEmitter = require('events');

class RatingSystem extends EventEmitter {
    constructor() {
        super();
        
        this.currentRating = 50; // Start at neutral
        this.ratingHistory = [];
        this.messageCount = 0;
        this.totalRating = 0;
        
        // Configuration
        this.maxHistorySize = parseInt(process.env.RATING_HISTORY_SIZE) || 100;
        
        // New simplified logic constants
        this.POSITIVE_THRESHOLD = 60;
        this.NEGATIVE_THRESHOLD = 40;
        this.RATING_STEP = 5; // Controls how much positive/negative messages push the score
        this.PULL_TO_CENTER_FACTOR = 0.1; // Controls how much neutral messages pull to center

        // Recent messages for display purposes
        this.recentMessages = [];
        this.maxRecentMessages = 10;
    }

    processMessage(analysis) {
        this.messageCount++;
        this.recentMessages.push(analysis);
        
        // Keep only recent messages for display
        if (this.recentMessages.length > this.maxRecentMessages) {
            this.recentMessages.shift();
        }
        
        // --- NEW SIMPLIFIED LOGIC ---
        if (analysis.rating > this.POSITIVE_THRESHOLD) {
            // Positive messages push the score up towards 100
            const pushStrength = (analysis.rating - this.POSITIVE_THRESHOLD) / (100 - this.POSITIVE_THRESHOLD);
            this.currentRating += this.RATING_STEP * pushStrength;
        } else if (analysis.rating < this.NEGATIVE_THRESHOLD) {
            // Negative messages push the score down towards 0
            const pullStrength = (this.NEGATIVE_THRESHOLD - analysis.rating) / this.NEGATIVE_THRESHOLD;
            this.currentRating -= this.RATING_STEP * pullStrength;
        } else {
            // Neutral messages pull the score back towards the center (50)
            this.currentRating = this.currentRating * (1 - this.PULL_TO_CENTER_FACTOR) + 50 * this.PULL_TO_CENTER_FACTOR;
        }

        // Ensure rating stays within bounds
        this.currentRating = Math.max(1, Math.min(100, this.currentRating));
        
        // Add to history
        this.addToHistory();
        
        // Emit update event
        this.emit('ratingUpdate', {
            currentRating: this.currentRating,
            history: this.ratingHistory,
            messageCount: this.messageCount,
            recentMessages: this.recentMessages.slice(-5) // Last 5 messages
        });
    }

    addToHistory() {
        const historyEntry = {
            rating: Math.round(this.currentRating * 100) / 100,
            timestamp: Date.now(),
            messageCount: this.messageCount
        };
        
        this.ratingHistory.push(historyEntry);
        
        // Keep history size manageable
        if (this.ratingHistory.length > this.maxHistorySize) {
            this.ratingHistory.shift();
        }
    }

    getCurrentRating() {
        return Math.round(this.currentRating * 100) / 100;
    }

    getRatingHistory() {
        return this.ratingHistory;
    }

    getStats() {
        const recentHistory = this.ratingHistory.slice(-20); // Last 20 entries
        const averageRating = recentHistory.length > 0 
            ? recentHistory.reduce((sum, entry) => sum + entry.rating, 0) / recentHistory.length 
            : this.currentRating;
        
        const minRating = recentHistory.length > 0 
            ? Math.min(...recentHistory.map(entry => entry.rating))
            : this.currentRating;
        
        const maxRating = recentHistory.length > 0 
            ? Math.max(...recentHistory.map(entry => entry.rating))
            : this.currentRating;
        
        return {
            currentRating: this.getCurrentRating(),
            averageRating: Math.round(averageRating * 100) / 100,
            minRating: Math.round(minRating * 100) / 100,
            maxRating: Math.round(maxRating * 100) / 100,
            messageCount: this.messageCount,
            historySize: this.ratingHistory.length,
            recentMessageCount: this.recentMessages.length
        };
    }

    reset() {
        this.currentRating = 50;
        this.ratingHistory = [];
        this.messageCount = 0;
        this.recentMessages = [];
        this.totalRating = 0;
        
        this.emit('ratingUpdate', {
            currentRating: this.currentRating,
            history: this.ratingHistory,
            messageCount: this.messageCount,
            recentMessages: []
        });
    }

    setRating(rating) {
        this.currentRating = Math.max(1, Math.min(100, rating));
        this.addToHistory();
        
        this.emit('ratingUpdate', {
            currentRating: this.currentRating,
            history: this.ratingHistory,
            messageCount: this.messageCount,
            recentMessages: this.recentMessages.slice(-5)
        });
    }
}

module.exports = RatingSystem; 