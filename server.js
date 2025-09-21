app.get('/api/mood', [
    authenticateToken,
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { limit = 50, offset = 0, from, to } = req.query;

        let moodEntries = database.moodEntries.filter(entry => entry.userId === req.user.id);

        // Date filtering
        if (from || to) {
            moodEntries = moodEntries.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                if (from && entryDate < new Date(from)) return false;
                if (to && entryDate > new Date(to)) return false;
                return true;
            });
        }

        // Sort by timestamp (newest first)
        moodEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Pagination
        const totalCount = moodEntries.length;
        const paginatedEntries = moodEntries.slice(offset, offset + parseInt(limit));

        res.json({
            entries: paginatedEntries,
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + parseInt(limit) < totalCount
            }
        });

    } catch (error) {
        console.error('Mood retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
});

// Data export routes
app.get('/api/export/user-data', [authenticateToken], async (req, res) => {
    try {
        const userMoods = database.moodEntries.filter(entry => entry.userId === req.user.id);
        const userJournals = database.journalEntries.filter(entry => entry.userId === req.user.id);
        const userAppointments = database.appointments.filter(apt => apt.userId === req.user.id);
        const userChats = database.chatSessions.filter(session => session.userId === req.user.id);

        const exportData = {
            exportDate: new Date().toISOString(),
            userId: req.user.id,
            moodEntries: userMoods,
            journalEntries: userJournals,
            appointments: userAppointments,
            chatSessions: userChats.map(session => ({
                ...session,
                messages: session.messages.map(msg => ({
                    type: msg.type,
                    message: msg.message,
                    timestamp: msg.timestamp
                }))
            }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=mental-health-data.json');
        res.json(exportData);

    } catch (error) {
        console.error('Data export error:', error);
        res.status(500).json({ error: 'Failed to export user data' });
    }
});

// Search functionality
app.get('/api/search', [
    query('q').isLength({ min: 1, max: 100 }).escape(),
    query('type').optional().isIn(['all', 'resources', 'counselors']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    handleValidationErrors
], async (req, res) => {
    try {
        const { q: searchQuery, type = 'all', limit = 20 } = req.query;
        const results = [];

        if (type === 'all' || type === 'resources') {
            const resourceResults = database.resources
                .filter(r => r.isPublished)
                .filter(r =>
                    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map(r => ({
                    id: r.id,
                    type: 'resource',
                    title: r.title,
                    description: r.description,
                    category: r.category,
                    tags: r.tags,
                    rating: r.rating
                }));
            results.push(...resourceResults);
        }

        if (type === 'all' || type === 'counselors') {
            const counselorResults = database.counselors
                .filter(c => c.isActive)
                .filter(c =>
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.specialties.some(specialty => specialty.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map(c => ({
                    id: c.id,
                    type: 'counselor',
                    title: c.name,
                    description: `${c.title} - ${c.bio.substring(0, 100)}...`,
                    specialties: c.specialties,
                    rating: c.rating,
                    location: c.location
                }));
            results.push(...counselorResults);
        }

        // Sort by relevance (simple scoring based on title match)
        results.sort((a, b) => {
            const aScore = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;
            const bScore = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0;
            return bScore - aScore;
        });

        res.json({
            query: searchQuery,
            results: results.slice(0, parseInt(limit)),
            totalResults: results.length
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Feedback and rating routes
app.post('/api/feedback', [
    authenticateToken,
    body('type').isIn(['resource', 'counselor', 'platform']),
    body('targetId').optional().isNumeric(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: 1000 }).escape(),
    body('category').optional().isIn(['bug', 'feature', 'content', 'usability']),
    handleValidationErrors
], async (req, res) => {
    try {
        const { type, targetId, rating, comment, category } = req.body;

        const feedback = {
            id: generateId(),
            userId: req.user.id,
            type,
            targetId: targetId ? parseInt(targetId) : null,
            rating,
            comment: comment || '',
            category: category || null,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Initialize feedback array if it doesn't exist
        if (!database.feedback) {
            database.feedback = [];
        }

        database.feedback.push(feedback);

        // Update target rating if applicable
        if (type === 'resource' && targetId) {
            const resource = database.resources.find(r => r.id === parseInt(targetId));
            if (resource) {
                const resourceFeedback = database.feedback.filter(f => 
                    f.type === 'resource' && f.targetId === parseInt(targetId)
                );
                const avgRating = resourceFeedback.reduce((sum, f) => sum + f.rating, 0) / resourceFeedback.length;
                resource.rating = Math.round(avgRating * 10) / 10;
            }
        } else if (type === 'counselor' && targetId) {
            const counselor = database.counselors.find(c => c.id === parseInt(targetId));
            if (counselor) {
                const counselorFeedback = database.feedback.filter(f => 
                    f.type === 'counselor' && f.targetId === parseInt(targetId)
                );
                const avgRating = counselorFeedback.reduce((sum, f) => sum + f.rating, 0) / counselorFeedback.length;
                counselor.rating = Math.round(avgRating * 10) / 10;
                counselor.reviews = counselorFeedback.length;
            }
        }

        await saveDatabase();

        res.status(201).json({
            message: 'Feedback submitted successfully',
            feedbackId: feedback.id
        });

    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// Newsletter subscription
app.post('/api/newsletter/subscribe', [
    body('email').isEmail().normalizeEmail(),
    body('name').optional().isLength({ min: 2, max: 100 }).escape(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { email, name } = req.body;

        // Initialize newsletter subscriptions if it doesn't exist
        if (!database.newsletterSubscriptions) {
            database.newsletterSubscriptions = [];
        }

        // Check if already subscribed
        const existingSubscription = database.newsletterSubscriptions.find(sub => sub.email === email);
        if (existingSubscription) {
            return res.status(409).json({ error: 'Email already subscribed' });
        }

        const subscription = {
            id: generateId(),
            email,
            name: name || '',
            subscribedAt: new Date().toISOString(),
            isActive: true,
            preferences: {
                weeklyTips: true,
                resourceUpdates: true,
                eventNotifications: true
            }
        };

        database.newsletterSubscriptions.push(subscription);
        await saveDatabase();

        res.status(201).json({
            message: 'Successfully subscribed to newsletter',
            subscriptionId: subscription.id
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
        }
    }

    if (err.message === 'Invalid file type') {
        return res.status(400).json({ error: 'Invalid file type' });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.path} does not exist`
    });
});

// Serve static files (for uploaded content)
app.use('/uploads', express.static('uploads'));

// Serve frontend files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'));
    
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
    });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await saveDatabase();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await saveDatabase();
    process.exit(0);
});

// Database backup job (runs every hour)
const backupDatabase = async () => {
    try {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const backupPath = `backups/database-backup-${timestamp}.json`;
        
        // Create backups directory if it doesn't exist
        await fs.mkdir('backups', { recursive: true });
        
        // Create backup
        await fs.writeFile(backupPath, JSON.stringify(database, null, 2));
        
        console.log(`📋 Database backup created: ${backupPath}`);
        
        // Clean up old backups (keep only last 24)
        const backupFiles = await fs.readdir('backups');
        const sortedBackups = backupFiles
            .filter(file => file.startsWith('database-backup-'))
            .sort()
            .reverse();
            
        if (sortedBackups.length > 24) {
            for (let i = 24; i < sortedBackups.length; i++) {
                await fs.unlink(path.join('backups', sortedBackups[i]));
            }
        }
        
    } catch (error) {
        console.error('Backup error:', error);
    }
};

// Schedule backup every hour
setInterval(backupDatabase, 60 * 60 * 1000);

// Initialize server
const startServer = async () => {
    try {
        // Ensure required directories exist
        await fs.mkdir('uploads', { recursive: true });
        await fs.mkdir('backups', { recursive: true });
        
        // Load database
        await loadDatabase();
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Mental Health Platform Backend running on port ${PORT}`);
            console.log(`📊 Database loaded with:`);
            console.log(`   - ${database.users.length} users`);
            console.log(`   - ${database.resources.length} resources`);
            console.log(`   - ${database.counselors.length} counselors`);
            console.log(`   - ${database.moodEntries.length} mood entries`);
            console.log(`   - ${database.journalEntries.length} journal entries`);
            console.log(`   - ${database.appointments.length} appointments`);
            console.log(`🔒 Security: Rate limiting, CORS, and Helmet enabled`);
            console.log(`📧 Email: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        
        // Create initial backup
        setTimeout(backupDatabase, 5000);
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer(); retrieve mood entries' });
    }
});

app.get('/api/mood/analytics', [authenticateToken], async (req, res) => {
    try {
        const userMoods = database.moodEntries.filter(entry => entry.userId === req.user.id);

        if (userMoods.length === 0) {
            return res.json({
                message: 'No mood data available',
                analytics: null
            });
        }

        // Calculate analytics
        const totalEntries = userMoods.length;
        const averageScore = userMoods.reduce((sum, entry) => sum + entry.score, 0) / totalEntries;
        
        // Mood distribution
        const moodDistribution = userMoods.reduce((dist, entry) => {
            dist[entry.mood] = (dist[entry.mood] || 0) + 1;
            return dist;
        }, {});

        // Factor analysis
        const factorAnalysis = userMoods.reduce((analysis, entry) => {
            entry.factors.forEach(factor => {
                if (!analysis[factor]) {
                    analysis[factor] = { count: 0, totalScore: 0 };
                }
                analysis[factor].count++;
                analysis[factor].totalScore += entry.score;
            });
            return analysis;
        }, {});

        // Calculate average scores for each factor
        Object.keys(factorAnalysis).forEach(factor => {
            factorAnalysis[factor].averageScore = 
                factorAnalysis[factor].totalScore / factorAnalysis[factor].count;
        });

        // Trend analysis (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentMoods = userMoods.filter(entry => 
            new Date(entry.timestamp) >= thirtyDaysAgo
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({
            analytics: {
                totalEntries,
                averageScore: Math.round(averageScore * 100) / 100,
                moodDistribution,
                factorAnalysis,
                trend: recentMoods.map(entry => ({
                    date: entry.timestamp.split('T')[0],
                    score: entry.score,
                    mood: entry.mood
                }))
            }
        });

    } catch (error) {
        console.error('Mood analytics error:', error);
        res.status(500).json({ error: 'Failed to generate mood analytics' });
    }
});

// Journal routes
app.post('/api/journal', [
    authenticateToken,
    body('title').optional().isLength({ max: 200 }).escape(),
    body('content').isLength({ min: 1, max: 10000 }).escape(),
    body('mood').optional().isIn(['excellent', 'good', 'okay', 'not-great', 'struggling']),
    body('tags').optional().isArray(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { title, content, mood, tags } = req.body;

        const journalEntry = {
            id: generateId(),
            userId: req.user.id,
            title: title || `Journal Entry - ${new Date().toLocaleDateString()}`,
            content,
            mood: mood || null,
            tags: tags || [],
            isPrivate: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        database.journalEntries.push(journalEntry);
        await saveDatabase();

        res.status(201).json({
            message: 'Journal entry saved successfully',
            entry: journalEntry
        });

    } catch (error) {
        console.error('Journal entry error:', error);
        res.status(500).json({ error: 'Failed to save journal entry' });
    }
});

app.get('/api/journal', [
    authenticateToken,
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('search').optional().isLength({ min: 1, max: 100 }),
    handleValidationErrors
], async (req, res) => {
    try {
        const { limit = 20, offset = 0, search } = req.query;

        let journalEntries = database.journalEntries.filter(entry => entry.userId === req.user.id);

        // Search functionality
        if (search) {
            const searchTerm = search.toLowerCase();
            journalEntries = journalEntries.filter(entry =>
                entry.title.toLowerCase().includes(searchTerm) ||
                entry.content.toLowerCase().includes(searchTerm) ||
                entry.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Sort by creation date (newest first)
        journalEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const totalCount = journalEntries.length;
        const paginatedEntries = journalEntries.slice(offset, offset + parseInt(limit));

        res.json({
            entries: paginatedEntries,
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + parseInt(limit) < totalCount
            }
        });

    } catch (error) {
        console.error('Journal retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve journal entries' });
    }
});

// Resources routes
app.get('/api/resources', [
    query('category').optional().isIn(['anxiety', 'depression', 'stress', 'wellness', 'academic']),
    query('type').optional().isIn(['article', 'video', 'guide', 'interactive']),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    query('search').optional().isLength({ min: 1, max: 100 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
    handleValidationErrors
], async (req, res) => {
    try {
        const { category, type, difficulty, search, limit = 20, offset = 0 } = req.query;

        let resources = database.resources.filter(resource => resource.isPublished);

        // Apply filters
        if (category) {
            resources = resources.filter(r => r.category === category);
        }
        if (type) {
            resources = resources.filter(r => r.type === type);
        }
        if (difficulty) {
            resources = resources.filter(r => r.difficulty === difficulty);
        }
        if (search) {
            const searchTerm = search.toLowerCase();
            resources = resources.filter(r =>
                r.title.toLowerCase().includes(searchTerm) ||
                r.description.toLowerCase().includes(searchTerm) ||
                r.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Sort by rating and date
        resources.sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return new Date(b.publishDate) - new Date(a.publishDate);
        });

        // Pagination
        const totalCount = resources.length;
        const paginatedResources = resources.slice(offset, offset + parseInt(limit));

        res.json({
            resources: paginatedResources.map(resource => ({
                id: resource.id,
                title: resource.title,
                description: resource.description,
                type: resource.type,
                category: resource.category,
                tags: resource.tags,
                author: resource.author,
                publishDate: resource.publishDate,
                rating: resource.rating,
                difficulty: resource.difficulty,
                estimatedReadTime: resource.estimatedReadTime,
                views: resource.views
            })),
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + parseInt(limit) < totalCount
            }
        });

    } catch (error) {
        console.error('Resources retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve resources' });
    }
});

app.get('/api/resources/:id', [
    param('id').isNumeric(),
    handleValidationErrors
], async (req, res) => {
    try {
        const resourceId = parseInt(req.params.id);
        const resource = database.resources.find(r => r.id === resourceId && r.isPublished);

        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        // Increment view count
        resource.views++;
        await saveDatabase();

        res.json({ resource });

    } catch (error) {
        console.error('Resource retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve resource' });
    }
});

// Counselors routes
app.get('/api/counselors', [
    query('specialty').optional().isIn(['anxiety', 'depression', 'stress', 'academic', 'career']),
    query('location').optional().isLength({ min: 2, max: 50 }),
    query('availability').optional().isIn(['today', 'week', 'month']),
    query('sessionType').optional().isIn(['individual', 'group', 'online']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
    handleValidationErrors
], async (req, res) => {
    try {
        const { specialty, location, availability, sessionType, limit = 20, offset = 0 } = req.query;

        let counselors = database.counselors.filter(c => c.isActive);

        // Apply filters
        if (specialty) {
            counselors = counselors.filter(c => c.specialties.includes(specialty));
        }
        if (location) {
            counselors = counselors.filter(c => 
                c.location.city.toLowerCase().includes(location.toLowerCase()) ||
                c.location.state.toLowerCase().includes(location.toLowerCase())
            );
        }
        if (sessionType) {
            counselors = counselors.filter(c => c.sessionTypes.includes(sessionType));
        }

        // Availability filtering
        if (availability) {
            const now = new Date();
            counselors = counselors.filter(c => {
                const nextAvailable = new Date(c.availability.nextAvailable);
                switch (availability) {
                    case 'today':
                        return nextAvailable.toDateString() === now.toDateString();
                    case 'week':
                        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return nextAvailable <= weekFromNow;
                    case 'month':
                        const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                        return nextAvailable <= monthFromNow;
                    default:
                        return true;
                }
            });
        }

        // Sort by rating and experience
        counselors.sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.experience - a.experience;
        });

        // Pagination
        const totalCount = counselors.length;
        const paginatedCounselors = counselors.slice(offset, offset + parseInt(limit));

        res.json({
            counselors: paginatedCounselors.map(counselor => ({
                id: counselor.id,
                name: counselor.name,
                title: counselor.title,
                specialties: counselor.specialties,
                qualifications: counselor.qualifications,
                experience: counselor.experience,
                location: counselor.location,
                availability: counselor.availability,
                rating: counselor.rating,
                reviews: counselor.reviews,
                languages: counselor.languages,
                sessionTypes: counselor.sessionTypes,
                fees: counselor.fees,
                bio: counselor.bio
            })),
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + parseInt(limit) < totalCount
            }
        });

    } catch (error) {
        console.error('Counselors retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve counselors' });
    }
});

app.get('/api/counselors/:id', [
    param('id').isNumeric(),
    handleValidationErrors
], async (req, res) => {
    try {
        const counselorId = parseInt(req.params.id);
        const counselor = database.counselors.find(c => c.id === counselorId && c.isActive);

        if (!counselor) {
            return res.status(404).json({ error: 'Counselor not found' });
        }

        res.json({ counselor });

    } catch (error) {
        console.error('Counselor retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve counselor' });
    }
});

// Appointment booking routes
app.post('/api/appointments', [
    authenticateToken,
    body('counselorId').isNumeric(),
    body('sessionType').isIn(['individual', 'group', 'online']),
    body('preferredDate').isISO8601(),
    body('preferredTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('reason').isLength({ min: 10, max: 500 }).escape(),
    body('urgency').optional().isIn(['low', 'medium', 'high', 'emergency']),
    handleValidationErrors
], async (req, res) => {
    try {
        const { counselorId, sessionType, preferredDate, preferredTime, reason, urgency } = req.body;

        // Verify counselor exists
        const counselor = database.counselors.find(c => c.id === parseInt(counselorId) && c.isActive);
        if (!counselor) {
            return res.status(404).json({ error: 'Counselor not found' });
        }

        // Check if counselor supports the session type
        if (!counselor.sessionTypes.includes(sessionType)) {
            return res.status(400).json({ error: 'Counselor does not offer this session type' });
        }

        const appointment = {
            id: generateId(),
            userId: req.user.id,
            counselorId: parseInt(counselorId),
            sessionType,
            preferredDate,
            preferredTime,
            reason,
            urgency: urgency || 'medium',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: null,
            confirmedDate: null,
            confirmedTime: null
        };

        database.appointments.push(appointment);
        await saveDatabase();

        // Send notification email to counselor (in production)
        if (process.env.NODE_ENV === 'production') {
            try {
                await emailTransporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: counselor.email,
                    subject: `New Appointment Request - ${urgency.toUpperCase()} Priority`,
                    html: `
                        <h3>New Appointment Request</h3>
                        <p><strong>Patient:</strong> ${req.user.name}</p>
                        <p><strong>Session Type:</strong> ${sessionType}</p>
                        <p><strong>Preferred Date/Time:</strong> ${preferredDate} at ${preferredTime}</p>
                        <p><strong>Urgency:</strong> ${urgency}</p>
                        <p><strong>Reason:</strong> ${reason}</p>
                        <p>Please log in to the counselor portal to respond to this request.</p>
                    `
                });
            } catch (emailError) {
                console.error('Email notification error:', emailError);
            }
        }

        res.status(201).json({
            message: 'Appointment request submitted successfully',
            appointment: {
                id: appointment.id,
                counselorName: counselor.name,
                sessionType: appointment.sessionType,
                preferredDate: appointment.preferredDate,
                preferredTime: appointment.preferredTime,
                status: appointment.status,
                createdAt: appointment.createdAt
            }
        });

    } catch (error) {
        console.error('Appointment booking error:', error);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});

app.get('/api/appointments', [
    authenticateToken,
    query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    handleValidationErrors
], async (req, res) => {
    try {
        const { status, limit = 20, offset = 0 } = req.query;

        let appointments = database.appointments.filter(apt => apt.userId === req.user.id);

        if (status) {
            appointments = appointments.filter(apt => apt.status === status);
        }

        // Sort by creation date (newest first)
        appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Add counselor information
        const appointmentsWithCounselors = appointments.map(apt => {
            const counselor = database.counselors.find(c => c.id === apt.counselorId);
            return {
                ...apt,
                counselorName: counselor?.name || 'Unknown',
                counselorTitle: counselor?.title || 'Unknown'
            };
        });

        // Pagination
        const totalCount = appointmentsWithCounselors.length;
        const paginatedAppointments = appointmentsWithCounselors.slice(offset, offset + parseInt(limit));

        res.json({
            appointments: paginatedAppointments,
            pagination: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: offset + parseInt(limit) < totalCount
            }
        });

    } catch (error) {
        console.error('Appointments retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve appointments' });
    }
});

// Emergency contacts routes
app.get('/api/emergency-contacts', async (req, res) => {
    try {
        const activeContacts = database.emergencyContacts.filter(contact => contact.isActive);
        
        res.json({
            contacts: activeContacts.map(contact => ({
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                type: contact.type,
                available: contact.available,
                description: contact.description,
                website: contact.website
            }))
        });

    } catch (error) {
        console.error('Emergency contacts error:', error);
        res.status(500).json({ error: 'Failed to retrieve emergency contacts' });
    }
});

// Chat/Support routes
app.post('/api/chat/sessions', [authenticateToken], async (req, res) => {
    try {
        const chatSession = {
            id: generateId(),
            userId: req.user.id,
            startedAt: new Date().toISOString(),
            status: 'active',
            messages: []
        };

        database.chatSessions.push(chatSession);
        await saveDatabase();

        res.status(201).json({
            message: 'Chat session started',
            sessionId: chatSession.id
        });

    } catch (error) {
        console.error('Chat session error:', error);
        res.status(500).json({ error: 'Failed to start chat session' });
    }
});

app.post('/api/chat/sessions/:sessionId/messages', [
    authenticateToken,
    param('sessionId').notEmpty(),
    body('message').isLength({ min: 1, max: 1000 }).escape(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;

        const session = database.chatSessions.find(s => 
            s.id === sessionId && s.userId === req.user.id && s.status === 'active'
        );

        if (!session) {
            return res.status(404).json({ error: 'Chat session not found' });
        }

        // Add user message
        const userMessage = {
            id: generateId(),
            type: 'user',
            message,
            timestamp: new Date().toISOString()
        };

        session.messages.push(userMessage);

        // Generate bot response (simple keyword-based for demo)
        const botResponse = generateChatBotResponse(message);
        const botMessage = {
            id: generateId(),
            type: 'bot',
            message: botResponse,
            timestamp: new Date().toISOString()
        };

        session.messages.push(botMessage);
        await saveDatabase();

        res.json({
            userMessage,
            botMessage
        });

    } catch (error) {
        console.error('Chat message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Simple chatbot response generation
function generateChatBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Crisis keywords - prioritize these
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'self harm'];
    if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return "I'm very concerned about what you're sharing. Please reach out to a crisis helpline immediately: KIRAN Mental Health Helpline at 1800-599-0019 (24/7). You don't have to go through this alone - professional help is available right now.";
    }
    
    // Anxiety-related responses
    if (lowerMessage.includes('anxiety') || lowerMessage.includes('anxious') || lowerMessage.includes('panic')) {
        return "I understand you're dealing with anxiety. That can be really challenging. Have you tried our breathing exercises? They can be very helpful for managing anxious feelings. Would you like me to guide you to some anxiety resources?";
    }
    
    // Depression-related responses
    if (lowerMessage.includes('depression') || lowerMessage.includes('sad') || lowerMessage.includes('hopeless')) {
        return "I'm sorry to hear you're feeling down. Those feelings are valid and you're not alone in experiencing them. Consider checking out our depression resources or speaking with one of our qualified counselors who can provide professional support.";
    }
    
    // Stress-related responses
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('pressure')) {
        return "Stress can feel overwhelming, especially during your studies. Have you tried our stress management tools? I can also help you find resources specifically for academic stress. What's been the most stressful part of your day?";
    }
    
    // Academic-related responses
    if (lowerMessage.includes('exam') || lowerMessage.includes('study') || lowerMessage.includes('grades')) {
        return "Academic pressure can be intense. Many students struggle with this. We have specific resources for academic stress and study techniques. Would you like me to share some strategies for managing study-related anxiety?";
    }
    
    // Sleep-related responses
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
        return "Sleep issues can significantly impact your mental health and academic performance. We have resources about sleep hygiene and the connection between sleep and mental wellbeing. Good sleep habits can make a big difference.";
    }
    
    // Help/support requests
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('counselor')) {
        return "I'm here to help support you. You can explore our mental health resources, take a mood check-in, find a qualified counselor, or access our crisis support if you need immediate help. What would be most helpful for you right now?";
    }
    
    // Default empathetic response
    return "Thank you for sharing that with me. I'm here to support you in whatever way I can. You can explore our mental health resources, connect with professional counselors, or use our wellness tools. Is there something specific I can help you find or learn more about today?";
}

// File upload routes
app.post('/api/upload/avatar', [
    authenticateToken,
    upload.single('avatar')
], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const user = database.users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user profile with new avatar
        user.profile.avatar = `/uploads/${req.file.filename}`;
        user.updatedAt = new Date().toISOString();
        
        await saveDatabase();

        res.json({
            message: 'Avatar uploaded successfully',
            avatarUrl: user.profile.avatar
        });

    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// User profile routes
app.get('/api/profile', [authenticateToken], async (req, res) => {
    try {
        const user = database.users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, ...userProfile } = user;
        res.json({ profile: userProfile });

    } catch (error) {
        console.error('Profile retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve profile' });
    }
});

app.put('/api/profile', [
    authenticateToken,
    body('name').optional().isLength({ min: 2, max: 100 }).escape(),
    body('phone').optional().isMobilePhone(),
    body('institution').optional().isLength({ max: 200 }).escape(),
    body('bio').optional().isLength({ max: 500 }).escape(),
    body('preferences.notifications').optional().isBoolean(),
    body('preferences.newsletter').optional().isBoolean(),
    body('preferences.dataCollection').optional().isBoolean(),
    handleValidationErrors
], async (req, res) => {
    try {
        const user = database.users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const allowedUpdates = ['name', 'phone', 'institution', 'bio', 'preferences'];
        const updates = {};

        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // Update user profile
        Object.keys(updates).forEach(key => {
            if (key === 'preferences') {
                user.profile.preferences = { ...user.profile.preferences, ...updates[key] };
            } else if (key === 'bio') {
                user.profile.bio = updates[key];
            } else {
                user[key] = updates[key];
            }
        });

        user.updatedAt = new Date().toISOString();
        await saveDatabase();

        const { password, ...userProfile } = user;
        res.json({
            message: 'Profile updated successfully',
            profile: userProfile
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Analytics and reporting routes (for admins/counselors)
app.get('/api/analytics/dashboard', [authenticateToken], async (req, res) => {
    try {
        // Check if user has admin/counselor privileges
        const user = database.users.find(u => u.id === req.user.id);
        if (!user || !['admin', 'counselor'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const analytics = {
            totalUsers: database.users.length,
            activeUsers: database.users.filter(u => {
                const lastLogin = new Date(u.lastLoginAt);
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                return lastLogin > thirtyDaysAgo;
            }).length,
            totalMoodEntries: database.moodEntries.length,
            totalJournalEntries: database.journalEntries.length,
            totalAppointments: database.appointments.length,
            pendingAppointments: database.appointments.filter(a => a.status === 'pending').length,
            averageMoodScore: database.moodEntries.length > 0 ? 
                database.moodEntries.reduce((sum, entry) => sum + entry.score, 0) / database.moodEntries.length : 0,
            resourceViews: database.resources.reduce((sum, resource) => sum + resource.views, 0)
        };

        res.json({ analytics });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to// Mental Health Platform Backend Server
// =====================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param, query } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Database (In production, use MongoDB, PostgreSQL, etc.)
// For demo purposes, using in-memory storage with file backup
let database = {
    users: [],
    moodEntries: [],
    journalEntries: [],
    resources: [],
    counselors: [],
    appointments: [],
    emergencyContacts: [],
    chatSessions: []
};

// Load data from file on startup
const loadDatabase = async () => {
    try {
        const data = await fs.readFile('database.json', 'utf8');
        database = JSON.parse(data);
        console.log('📊 Database loaded successfully');
    } catch (error) {
        console.log('📊 Creating new database...');
        await initializeDatabase();
    }
};

// Save data to file
const saveDatabase = async () => {
    try {
        await fs.writeFile('database.json', JSON.stringify(database, null, 2));
    } catch (error) {
        console.error('❌ Error saving database:', error);
    }
};

// Initialize database with sample data
const initializeDatabase = async () => {
    database.resources = [
        {
            id: 1,
            title: 'Managing Anxiety & Stress',
            description: 'Comprehensive guide on coping strategies, breathing exercises, and mindfulness techniques.',
            content: 'Detailed content about anxiety management...',
            type: 'guide',
            tags: ['anxiety', 'stress', 'self-help'],
            category: 'anxiety',
            author: 'Dr. Mental Health Expert',
            publishDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            views: 0,
            rating: 4.5,
            difficulty: 'beginner',
            estimatedReadTime: '10 minutes',
            isPublished: true
        },
        {
            id: 2,
            title: 'Understanding Depression',
            description: 'Educational material about depression symptoms, treatment options, and recovery strategies.',
            content: 'Detailed content about depression...',
            type: 'article',
            tags: ['depression', 'education', 'recovery'],
            category: 'depression',
            author: 'Dr. Clinical Psychologist',
            publishDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            views: 0,
            rating: 4.7,
            difficulty: 'intermediate',
            estimatedReadTime: '15 minutes',
            isPublished: true
        }
    ];

    database.counselors = [
        {
            id: 1,
            name: 'Dr. Priya Sharma',
            title: 'Clinical Psychologist',
            email: 'priya.sharma@mindcare.com',
            phone: '+91-9999999999',
            specialties: ['anxiety', 'depression', 'student-support'],
            qualifications: ['Ph.D. in Clinical Psychology', 'Licensed Clinical Psychologist'],
            experience: 8,
            location: {
                city: 'Bangalore',
                state: 'Karnataka',
                country: 'India',
                address: '123 Mental Health Center, Koramangala'
            },
            availability: {
                schedule: 'Mon-Fri: 9AM-6PM, Sat: 9AM-2PM',
                nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                emergencyAvailable: true
            },
            rating: 4.8,
            reviews: 156,
            languages: ['English', 'Hindi', 'Kannada'],
            sessionTypes: ['individual', 'group', 'online'],
            fees: {
                consultation: 2000,
                followUp: 1500,
                emergency: 3000
            },
            bio: 'Dr. Priya Sharma is a licensed clinical psychologist specializing in anxiety, depression, and student mental health. She has over 8 years of experience helping students navigate academic stress and mental health challenges.',
            education: [
                {
                    degree: 'Ph.D. in Clinical Psychology',
                    institution: 'National Institute of Mental Health and Neurosciences (NIMHANS)',
                    year: 2015
                },
                {
                    degree: 'M.Phil. in Clinical Psychology',
                    institution: 'NIMHANS',
                    year: 2012
                }
            ],
            isActive: true,
            joinedDate: '2020-01-15T00:00:00.000Z'
        },
        {
            id: 2,
            name: 'Dr. Rahul Mehta',
            title: 'Psychiatrist',
            email: 'rahul.mehta@mindcare.com',
            phone: '+91-8888888888',
            specialties: ['stress', 'academic-pressure', 'medication-management'],
            qualifications: ['M.D. Psychiatry', 'Fellowship in Child and Adolescent Psychiatry'],
            experience: 12,
            location: {
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                address: '456 Wellness Clinic, Bandra'
            },
            availability: {
                schedule: 'Mon-Sat: 10AM-8PM',
                nextAvailable: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                emergencyAvailable: false
            },
            rating: 4.9,
            reviews: 203,
            languages: ['English', 'Hindi', 'Marathi'],
            sessionTypes: ['individual', 'online'],
            fees: {
                consultation: 2500,
                followUp: 2000,
                emergency: 4000
            },
            bio: 'Dr. Rahul Mehta is a board-certified psychiatrist with expertise in stress management, academic pressure, and medication management for mental health conditions.',
            education: [
                {
                    degree: 'M.D. in Psychiatry',
                    institution: 'King Edward Memorial Hospital',
                    year: 2011
                }
            ],
            isActive: true,
            joinedDate: '2019-06-20T00:00:00.000Z'
        }
    ];

    database.emergencyContacts = [
        {
            id: 1,
            name: 'KIRAN Mental Health Helpline',
            phone: '1800-599-0019',
            type: 'national',
            available: '24/7',
            description: 'National toll-free mental health helpline',
            website: 'https://www.tiss.edu/view/11/about-us/centres/centre-for-mental-health/',
            isActive: true
        },
        {
            id: 2,
            name: 'Vandrevala Foundation',
            phone: '9999-666-555',
            type: 'crisis',
            available: '24/7',
            description: 'Crisis support and counseling helpline',
            website: 'https://www.vandrevalafoundation.com/',
            isActive: true
        },
        {
            id: 3,
            name: 'Snehi Helpline',
            phone: '91-20-6570-9090',
            type: 'emotional',
            available: '10 AM to 10 PM',
            description: 'Emotional support and crisis intervention',
            website: 'http://snehifoundation.com/',
            isActive: true
        }
    ];

    await saveDatabase();
};

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Stricter limit for sensitive endpoints
    message: 'Too many attempts, please try again later.'
});

app.use(limiter);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'mental-health-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Email configuration
const emailTransporter = nodemailer.createTransporter({
    service: 'gmail', // Use your preferred email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Utility functions
const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 12);
};

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

const generateJWT = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET || 'mental-health-secret-key',
        { expiresIn: '24h' }
    );
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Authentication Routes
app.post('/api/auth/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('name').isLength({ min: 2 }).escape(),
    body('dateOfBirth').optional().isISO8601(),
    body('phone').optional().isMobilePhone(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { email, password, name, dateOfBirth, phone, institution } = req.body;

        // Check if user already exists
        const existingUser = database.users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = {
            id: generateId(),
            email,
            password: hashedPassword,
            name,
            dateOfBirth,
            phone,
            institution,
            role: 'student',
            isActive: true,
            isEmailVerified: false,
            createdAt: new Date().toISOString(),
            lastLoginAt: null,
            profile: {
                avatar: null,
                bio: null,
                preferences: {
                    notifications: true,
                    newsletter: true,
                    dataCollection: true
                }
            }
        };

        database.users.push(user);
        await saveDatabase();

        // Generate JWT
        const token = generateJWT(user);

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    handleValidationErrors
], strictLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = database.users.find(u => u.email === email && u.isActive);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last login
        user.lastLoginAt = new Date().toISOString();
        await saveDatabase();

        // Generate JWT
        const token = generateJWT(user);

        // Remove password from response
        const { password: _, ...userResponse } = user;

        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Mood tracking routes
app.post('/api/mood', [
    authenticateToken,
    body('mood').isIn(['excellent', 'good', 'okay', 'not-great', 'struggling']),
    body('score').isInt({ min: 1, max: 5 }),
    body('factors').optional().isArray(),
    body('notes').optional().isLength({ max: 1000 }).escape(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { mood, score, factors, notes } = req.body;

        const moodEntry = {
            id: generateId(),
            userId: req.user.id,
            mood,
            score,
            factors: factors || [],
            notes: notes || '',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        database.moodEntries.push(moodEntry);
        await saveDatabase();

        res.status(201).json({
            message: 'Mood entry saved successfully',
            entry: moodEntry
        });

    } catch (error) {
        console.error('Mood entry error:', error);
        res.status(500).json({ error: 'Failed to save mood entry' });
    }
});

app.get('/api/mood', [
