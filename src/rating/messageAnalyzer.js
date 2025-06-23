class MessageAnalyzer {
    analyze(message, tags = {}) {
        const cleanMessage = message.trim();
        const rating = this.analyzeSimpleRating(cleanMessage);
        
        return {
            message: cleanMessage,
            originalMessage: message,
            rating: rating,
            activityScore: 50,      // Neutral activity score
            tags,
            timestamp: Date.now()
        };
    }

    analyzeSimpleRating(message) {
        // Only react to "+2" and "-2" strings
        if (message.includes('+2')) {
            return 100; // Maximum positive rating
        } else if (message.includes('-2')) {
            return 1;   // Minimum negative rating
        } else {
            return 50;  // Neutral rating for all other messages
        }
    }

    // Keep the cleanMessage method for compatibility but simplify it
    cleanMessage(message) {
        return message.trim();
    }
}

module.exports = MessageAnalyzer; 