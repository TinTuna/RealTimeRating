// Initialize Socket.IO connection
const socket = io();

// Chart.js configuration
let ratingChart;
let currentRating = 50;
let ratingHistory = [];

// DOM elements
const currentRatingEl = document.getElementById('currentRating');
const ratingFillEl = document.getElementById('ratingFill');
const messageCountEl = document.getElementById('messageCount');
const averageRatingEl = document.getElementById('averageRating');
const minRatingEl = document.getElementById('minRating');
const maxRatingEl = document.getElementById('maxRating');
const statusIndicator = document.getElementById('statusIndicator');
const statusDot = statusIndicator.querySelector('.status-dot');
const statusText = statusIndicator.querySelector('.status-text');
const messagesList = document.getElementById('messagesList');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    setupSocketHandlers();
    loadInitialData();
    setupControlListeners();
});

function setupControlListeners() {
    document.getElementById('resetRatingBtn').addEventListener('click', resetRating);
    document.getElementById('setNeutralBtn').addEventListener('click', () => setRating(50));
    document.getElementById('setCustomBtn').addEventListener('click', setCustomRating);
}

function initializeChart() {
    const ctx = document.getElementById('ratingChart').getContext('2d');
    
    ratingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Chat Rating',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#4a5568',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#4a5568',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function setupSocketHandlers() {
    socket.on('connect', () => {
        console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        updateStatus(false, 'Disconnected from server');
    });

    socket.on('ratingUpdate', (data) => {
        updateRating(data.currentRating);
        updateChart(data.history);
        updateStats(data);
        updateRecentMessages(data.recentMessages);
    });

    socket.on('botStatusUpdate', (data) => {
        console.log('Bot status update:', data);
        switch (data.status) {
            case 'connected':
                updateStatus(true, `Monitoring #${data.details.channel}`);
                break;
            case 'connecting':
                updateStatus(false, 'Connecting to Twitch...');
                break;
            case 'disconnected':
                updateStatus(false, 'Disconnected from Twitch');
                break;
            case 'error':
                 updateStatus(false, 'Authentication Failed');
                 break;
            default:
                updateStatus(false, 'Connecting...');
        }
    });
}

function updateStatus(connected, text) {
    statusText.textContent = text;

    if (connected) {
        statusDot.classList.add('connected');
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

function updateRating(rating) {
    currentRating = rating;
    currentRatingEl.textContent = Math.round(rating);
    ratingFillEl.style.width = `${rating}%`;
    
    // Add animation class
    currentRatingEl.classList.add('updated');
    setTimeout(() => {
        currentRatingEl.classList.remove('updated');
    }, 500);
}

function updateChart(history) {
    ratingHistory = history;
    
    const labels = history.map(entry => {
        const date = new Date(entry.timestamp);
        return date.toLocaleTimeString();
    });
    
    const data = history.map(entry => entry.rating);
    
    ratingChart.data.labels = labels;
    ratingChart.data.datasets[0].data = data;
    ratingChart.update('none');
}

function updateStats(data) {
    messageCountEl.textContent = data.messageCount || 0;
    
    // Calculate stats from history
    if (ratingHistory.length > 0) {
        const ratings = ratingHistory.map(entry => entry.rating);
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        const min = Math.min(...ratings);
        const max = Math.max(...ratings);
        
        averageRatingEl.textContent = Math.round(average);
        minRatingEl.textContent = Math.round(min);
        maxRatingEl.textContent = Math.round(max);
    }
}

function updateRecentMessages(messages) {
    if (!messages || messages.length === 0) {
        messagesList.innerHTML = '<div class="no-messages">No messages yet...</div>';
        return;
    }
    
    const messagesHTML = messages.map(message => `
        <div class="message-item">
            <div class="message-header">
                <span class="message-user">${message.tags?.username || 'Unknown'}</span>
                <span class="message-rating">${Math.round(message.rating)}</span>
            </div>
            <div class="message-text">${message.originalMessage}</div>
        </div>
    `).join('');
    
    messagesList.innerHTML = messagesHTML;
}

async function loadInitialData() {
    try {
        const response = await fetch('/api/rating');
        const data = await response.json();
        
        updateRating(data.currentRating);
        updateChart(data.history);
        
        const statsResponse = await fetch('/api/stats');
        const stats = await statsResponse.json();
        updateStats(stats);
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Control functions
async function resetRating() {
    try {
        const response = await fetch('/api/reset', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            console.log('Rating reset successfully');
        }
    } catch (error) {
        console.error('Error resetting rating:', error);
    }
}

async function setRating(rating) {
    try {
        const response = await fetch('/api/set-rating', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating })
        });
        const result = await response.json();
        
        if (result.success) {
            console.log('Rating set successfully');
        }
    } catch (error) {
        console.error('Error setting rating:', error);
    }
}

function setCustomRating() {
    const input = document.getElementById('customRating');
    const rating = parseInt(input.value);
    
    if (rating >= 1 && rating <= 100) {
        setRating(rating);
    } else {
        alert('Please enter a rating between 1 and 100');
    }
} 