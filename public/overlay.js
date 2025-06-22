// Initialize Socket.IO connection
const socket = io();

// DOM elements
const ratingValueEl = document.getElementById('ratingValue');
const ratingFillEl = document.getElementById('ratingFill');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupSocketHandlers();
    loadInitialData();
});

function setupSocketHandlers() {
    socket.on('connect', () => {
        console.log('Overlay connected to server');
    });

    socket.on('disconnect', () => {
        console.log('Overlay disconnected from server');
    });

    socket.on('ratingUpdate', (data) => {
        updateRating(data.currentRating);
    });
}

function updateRating(rating) {
    const roundedRating = Math.round(rating);
    
    // Update the rating value with animation
    ratingValueEl.textContent = roundedRating;
    ratingValueEl.classList.add('updated');
    
    // Update the progress bar
    ratingFillEl.style.width = `${rating}%`;
    
    // Remove animation class after animation completes
    setTimeout(() => {
        ratingValueEl.classList.remove('updated');
    }, 500);
    
    // Update color based on rating
    updateRatingColor(rating);
}

function updateRatingColor(rating) {
    let color;
    
    if (rating < 30) {
        color = '#e53e3e'; // Red for low ratings
    } else if (rating < 60) {
        color = '#f6ad55'; // Orange for medium ratings
    } else {
        color = '#38a169'; // Green for high ratings
    }
    
    ratingValueEl.style.color = color;
}

async function loadInitialData() {
    try {
        const response = await fetch('/api/rating');
        const data = await response.json();
        
        updateRating(data.currentRating);
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
} 