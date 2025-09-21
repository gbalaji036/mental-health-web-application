const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index_fixed.html'));
});

// API endpoint for testing
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'success', 
        message: 'MindCare Hub API is working',
        timestamp: new Date().toISOString()
    });
});

// Mood tracking endpoint
app.post('/api/mood', (req, res) => {
    const { mood, factors, timestamp } = req.body;
    console.log('Mood submitted:', { mood, factors, timestamp });

    res.json({
        status: 'success',
        message: 'Mood recorded successfully',
        data: { mood, factors, timestamp }
    });
});

// Search endpoint
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    console.log('Search query:', q);

    const mockResults = [
        { title: 'Understanding Anxiety', type: 'article', category: 'anxiety' },
        { title: 'Stress Management Tips', type: 'guide', category: 'stress' },
        { title: 'Meditation for Students', type: 'video', category: 'wellness' }
    ];

    res.json({
        status: 'success',
        query: q,
        results: mockResults
    });
});

// Resources endpoint
app.get('/api/resources', (req, res) => {
    const mockResources = [
        {
            id: 1,
            title: 'Understanding Anxiety',
            description: 'Learn about anxiety symptoms and coping strategies',
            category: 'anxiety',
            type: 'article'
        },
        {
            id: 2,
            title: 'Stress Management for Students',
            description: 'Practical stress management techniques for academic life',
            category: 'stress',
            type: 'guide'
        },
        {
            id: 3,
            title: 'Sleep and Mental Health',
            description: 'The importance of sleep for mental wellbeing',
            category: 'wellness',
            type: 'article'
        }
    ];

    res.json({
        status: 'success',
        resources: mockResources
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🧠 MindCare Hub server running on http://localhost:${PORT}`);
    console.log(`📱 Access your mental health app at: http://localhost:${PORT}`);
});

module.exports = app;
