const Sentiment = require('sentiment');
const natural = require('natural');

class MessageAnalyzer {
    constructor() {
        this.sentiment = new Sentiment();
        this.tokenizer = new natural.WordTokenizer();
        
        // Keywords that affect rating
        this.positiveKeywords = [
            'love', 'great', 'awesome', 'amazing', 'perfect', 'best', 'wow', 'nice',
            'good', 'excellent', 'fantastic', 'brilliant', 'outstanding', 'superb',
            'wonderful', 'beautiful', 'incredible', 'epic', 'legendary', 'fire',
            'pog', 'poggers', 'pogchamp', 'kekw', 'lul', 'monkaS', 'pepehands', '+'
        ];
        
        this.negativeKeywords = [
            'hate', 'terrible', 'awful', 'worst', 'bad', 'trash', 'garbage', 'disgusting',
            'horrible', 'disappointing', 'boring', 'stupid', 'dumb', 'idiot', 'fail',
            'cringe', 'monkaW', 'pepehands', 'omegalul', 'lulw', '-'
        ];
        
        this.spamKeywords = [
            'follow', 'subscribe', 'donate', 'bits', 'prime', 'sub', 'gift',
            'raid', 'host', 'viewer', 'follower', 'subscriber'
        ];
    }

    analyze(message, tags = {}) {
        const cleanMessage = this.cleanMessage(message);
        const sentimentScore = this.analyzeSentiment(cleanMessage);
        const keywordScore = this.analyzeKeywords(cleanMessage);
        const spamScore = this.analyzeSpam(cleanMessage, tags);
        const activityScore = this.analyzeActivity(tags);
        
        // Combine scores to get final rating (1-100)
        const finalRating = this.calculateFinalRating({
            sentimentScore,
            keywordScore,
            spamScore,
            activityScore
        });

        return {
            message: cleanMessage,
            originalMessage: message,
            rating: Math.max(1, Math.min(100, finalRating)),
            sentimentScore,
            keywordScore,
            spamScore,
            activityScore,
            tags,
            timestamp: Date.now()
        };
    }

    cleanMessage(message) {
        return message
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .trim();
    }

    analyzeSentiment(message) {
        const result = this.sentiment.analyze(message);
        
        // Normalize sentiment score to 0-100 range
        // Sentiment scores typically range from -5 to 5
        const normalizedScore = Math.max(0, Math.min(100, (result.score + 5) * 10));
        
        return normalizedScore;
    }

    analyzeKeywords(message) {
        const words = this.tokenizer.tokenize(message);
        let score = 50; // Neutral starting point
        
        if (!words) return score;
        
        words.forEach(word => {
            if (this.positiveKeywords.includes(word)) {
                score += 10;
            } else if (this.negativeKeywords.includes(word)) {
                score -= 10;
            }
        });
        
        return Math.max(0, Math.min(100, score));
    }

    analyzeSpam(message, tags) {
        const words = this.tokenizer.tokenize(message);
        let spamScore = 0;
        
        if (!words) return 0;
        
        // Check for spam keywords
        words.forEach(word => {
            if (this.spamKeywords.includes(word)) {
                spamScore += 20;
            }
        });
        
        // Check for repeated characters (like "loooooool")
        const repeatedChars = message.match(/(.)\1{3,}/g);
        if (repeatedChars) {
            spamScore += repeatedChars.length * 10;
        }
        
        // Check for all caps
        if (message === message.toUpperCase() && message.length > 5) {
            spamScore += 15;
        }
        
        // Check for excessive emojis
        const emojiCount = (message.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
        if (emojiCount > 3) {
            spamScore += emojiCount * 5;
        }
        
        return Math.min(100, spamScore);
    }

    analyzeActivity(tags) {
        let activityScore = 50; // Neutral starting point
        
        // Check if user is a subscriber
        if (tags.subscriber) {
            activityScore += 10;
        }
        
        // Check if user is a moderator
        if (tags.mod) {
            activityScore += 5;
        }
        
        // Check for badges (VIP, etc.)
        if (tags.badges && Object.keys(tags.badges).length > 0) {
            activityScore += 5;
        }
        
        return Math.max(0, Math.min(100, activityScore));
    }

    calculateFinalRating(scores) {
        const weights = {
            sentiment: 0.4,
            keywords: 0.3,
            spam: -0.2, // Negative weight - spam reduces rating
            activity: 0.1
        };
        
        let finalScore = 50; // Start at neutral
        
        finalScore += (scores.sentimentScore - 50) * weights.sentiment;
        finalScore += (scores.keywordScore - 50) * weights.keywords;
        finalScore -= scores.spamScore * Math.abs(weights.spam);
        finalScore += (scores.activityScore - 50) * weights.activity;
        
        // Scale the score to spread it out from the midpoint of 50
        const deviation = finalScore - 50;
        const amplificationFactor = 1.5;
        const amplifiedScore = 50 + (deviation * amplificationFactor);
        
        // Clamp the final score between 1 and 100
        return Math.max(1, Math.min(100, amplifiedScore));
    }
}

module.exports = MessageAnalyzer; 