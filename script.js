// Mental Health Platform JavaScript
// =================================

class MentalHealthPlatform {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.loadInitialData();
        this.currentMood = null;
        this.selectedFactors = [];
        this.chatHistory = [];
        this.resources = [];
        this.counselors = [];
    }

    // Initialize the platform
    init() {
        console.log('🧠 MindCare Hub initialized');
        this.showToast('Welcome to MindCare Hub!', 'success');
        this.setupNavigation();
        this.setupModals();
        this.setupChat();
        this.setupFAB();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation
        document.getElementById('mobileToggle')?.addEventListener('click', this.toggleMobileNav.bind(this));
        
        // Emergency button
        document.getElementById('emergencyBtn')?.addEventListener('click', this.showEmergencyModal.bind(this));
        document.getElementById('closeEmergencyModal')?.addEventListener('click', this.hideEmergencyModal.bind(this));
        
        // Hero buttons
        document.getElementById('getStartedBtn')?.addEventListener('click', () => this.scrollToSection('tools'));
        document.getElementById('moodCheckBtn')?.addEventListener('click', () => this.scrollToSection('tools'));
        
        // Quick access cards
        document.querySelectorAll('.access-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.category;
                this.handleQuickAccess(action);
            });
        });
        
        // Search functionality
        document.getElementById('searchBtn')?.addEventListener('click', this.performSearch.bind(this));
        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        document.getElementById('searchInput')?.addEventListener('input', this.handleSearchInput.bind(this));
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });
        
        // Mood tracker
        document.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectMood(e.currentTarget));
        });
        document.getElementById('submitMoodBtn')?.addEventListener('click', this.submitMood.bind(this));
        document.getElementById('skipMoodBtn')?.addEventListener('click', this.skipMoodDetails.bind(this));
        
        // Factor tags
        document.querySelectorAll('.factor-tag').forEach(tag => {
            tag.addEventListener('click', (e) => this.toggleFactor(e.target));
        });
        
        // Wellness tools
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.startWellnessTool(tool);
            });
        });
        
        // Resource tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchResourceTab(e.target.dataset.tab));
        });
        
        // Load more resources
        document.getElementById('loadMoreBtn')?.addEventListener('click', this.loadMoreResources.bind(this));
        
        // Counselor filters
        document.getElementById('locationFilter')?.addEventListener('change', this.filterCounselors.bind(this));
        document.getElementById('specialtyFilter')?.addEventListener('change', this.filterCounselors.bind(this));
        document.getElementById('availabilityFilter')?.addEventListener('change', this.filterCounselors.bind(this));
        
        // Chat functionality
        document.getElementById('chatToggle')?.addEventListener('click', this.toggleChat.bind(this));
        document.getElementById('chatClose')?.addEventListener('click', this.closeChat.bind(this));
        document.getElementById('chatSend')?.addEventListener('click', this.sendChatMessage.bind(this));
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Quick chat responses
        document.querySelectorAll('.quick-response').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickResponse(e.target.dataset.response));
        });
        
        // FAB functionality
        document.getElementById('fabMain')?.addEventListener('click', this.toggleFAB.bind(this));
        document.querySelectorAll('.fab-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleFABAction(e.target.dataset.action));
        });
        
        // Modal close on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal(modal);
            });
        });
        
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // Window events
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    // Load initial data
    async loadInitialData() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadResources(),
                this.loadCounselors(),
                this.loadEmergencyContacts()
            ]);
            this.hideLoading();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Error loading data. Please refresh the page.', 'error');
            this.hideLoading();
        }
    }

    // Navigation functionality
    setupNavigation() {
        const navbar = document.getElementById('navbar');
        let lastScrollTop = 0;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        });
    }

    toggleMobileNav() {
        const navMenu = document.getElementById('navMenu');
        navMenu.classList.toggle('show');
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Modal functionality
    setupModals() {
        // Setup modal close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) this.hideModal(openModal);
            }
        });
    }

    showEmergencyModal() {
        const modal = document.getElementById('emergencyModal');
        if (modal) {
            modal.classList.add('show');
            this.trackEvent('emergency_modal_opened');
        }
    }

    hideEmergencyModal() {
        const modal = document.getElementById('emergencyModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    hideModal(modal) {
        modal.classList.remove('show');
    }

    // Quick access functionality
    handleQuickAccess(action) {
        switch (action) {
            case 'crisis':
                this.showEmergencyModal();
                break;
            case 'counselors':
                this.scrollToSection('counselors');
                break;
            case 'tools':
                this.scrollToSection('tools');
                break;
            case 'resources':
                this.scrollToSection('resources');
                break;
            default:
                console.log('Unknown action:', action);
        }
        this.trackEvent('quick_access_clicked', { action });
    }

    // Search functionality
    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput?.value.trim();
        
        if (!query) {
            this.showToast('Please enter a search term', 'warning');
            return;
        }

        this.showLoading();
        try {
            const results = await this.searchContent(query);
            this.displaySearchResults(results);
            this.trackEvent('search_performed', { query });
            this.showToast(`Found ${results.length} results for "${query}"`, 'success');
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Search failed. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    handleSearchInput(e) {
        const query = e.target.value.trim();
        if (query.length >= 3) {
            this.showSearchSuggestions(query);
        } else {
            this.hideSearchSuggestions();
        }
    }

    async searchContent(query) {
        // Simulate API call
        await this.delay(500);
        
        const allContent = [...this.resources, ...this.counselors];
        return allContent.filter(item => 
            item.title?.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase()) ||
            item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
    }

    displaySearchResults(results) {
        // Display search results in the resources grid
        const resourcesGrid = document.getElementById('resourcesGrid');
        if (resourcesGrid) {
            resourcesGrid.innerHTML = '';
            results.forEach(result => {
                const card = this.createResourceCard(result);
                resourcesGrid.appendChild(card);
            });
        }
    }

    showSearchSuggestions(query) {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            // Mock suggestions
            const mockSuggestions = [
                'anxiety management',
                'depression support',
                'stress relief',
                'counseling services',
                'crisis help'
            ].filter(s => s.includes(query.toLowerCase()));

            if (mockSuggestions.length > 0) {
                suggestions.innerHTML = mockSuggestions
                    .map(s => `<div class="suggestion-item" onclick="app.selectSuggestion('${s}')">${s}</div>`)
                    .join('');
                suggestions.style.display = 'block';
            }
        }
    }

    hideSearchSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }

    selectSuggestion(suggestion) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = suggestion;
            this.performSearch();
            this.hideSearchSuggestions();
        }
    }

    // Filter functionality
    handleFilter(filter) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

        // Filter content
        this.filterResources(filter);
        this.trackEvent('filter_applied', { filter });
    }

    filterResources(filter) {
        const cards = document.querySelectorAll('.resource-card');
        cards.forEach(card => {
            const categories = card.dataset.category || '';
            if (filter === 'all' || categories.includes(filter)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Mood tracker functionality
    selectMood(moodElement) {
        // Remove previous selection
        document.querySelectorAll('.mood-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Select current mood
        moodElement.classList.add('selected');
        this.currentMood = {
            mood: moodElement.dataset.mood,
            score: parseInt(moodElement.dataset.score)
        };

        // Show mood details
        document.getElementById('moodDetails').style.display = 'block';
        this.trackEvent('mood_selected', { mood: this.currentMood.mood });
    }

    toggleFactor(factorElement) {
        const factor = factorElement.dataset.factor;
        
        if (factorElement.classList.contains('selected')) {
            factorElement.classList.remove('selected');
            this.selectedFactors = this.selectedFactors.filter(f => f !== factor);
        } else {
            factorElement.classList.add('selected');
            this.selectedFactors.push(factor);
        }
    }

    async submitMood() {
        if (!this.currentMood) {
            this.showToast('Please select your mood first', 'warning');
            return;
        }

        this.showLoading();
        
        const moodData = {
            mood: this.currentMood.mood,
            score: this.currentMood.score,
            factors: this.selectedFactors,
            timestamp: new Date().toISOString()
        };

        try {
            // Simulate API call to save mood
            await this.saveMoodData(moodData);
            
            // Show personalized feedback
            this.showMoodFeedback(moodData);
            
            this.trackEvent('mood_submitted', moodData);
            this.showToast('Mood logged successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving mood:', error);
            this.showToast('Failed to save mood. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    skipMoodDetails() {
        this.submitMood();
    }

    async saveMoodData(moodData) {
        // Simulate API call
        await this.delay(1000);
        
        // Store in local storage for demo
        const existingMoods = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        existingMoods.push(moodData);
        localStorage.setItem('moodHistory', JSON.stringify(existingMoods));
    }

    showMoodFeedback(moodData) {
        const feedback = document.getElementById('moodFeedback');
        if (!feedback) return;

        let feedbackHTML = '';
        let recommendations = '';

        // Generate feedback based on mood score
        if (moodData.score >= 4) {
            feedbackHTML = `
                <div class="mood-feedback-positive">
                    <h3>Great to hear you're feeling ${moodData.mood}! 🌟</h3>
                    <p>Keep up the positive momentum! Here are some ways to maintain your wellbeing:</p>
                </div>
            `;
            recommendations = this.getPositiveMoodRecommendations();
        } else if (moodData.score >= 3) {
            feedbackHTML = `
                <div class="mood-feedback-neutral">
                    <h3>It's okay to feel ${moodData.mood} sometimes 💙</h3>
                    <p>Here are some gentle activities that might help boost your mood:</p>
                </div>
            `;
            recommendations = this.getNeutralMoodRecommendations();
        } else {
            feedbackHTML = `
                <div class="mood-feedback-concern">
                    <h3>We're here to support you 🤗</h3>
                    <p>Thank you for sharing how you're feeling. Consider these supportive resources:</p>
                </div>
            `;
            recommendations = this.getSupportiveMoodRecommendations();
        }

        feedback.innerHTML = feedbackHTML + recommendations;
        feedback.style.display = 'block';
        
        // Scroll to feedback
        feedback.scrollIntoView({ behavior: 'smooth' });
    }

    getPositiveMoodRecommendations() {
        return `
            <div class="mood-recommendations">
                <div class="recommendation-card">
                    <i class="fas fa-heart"></i>
                    <h4>Practice Gratitude</h4>
                    <p>Keep a gratitude journal to maintain positivity</p>
                    <button class="btn btn-outline" onclick="app.startWellnessTool('gratitude')">Start Now</button>
                </div>
                <div class="recommendation-card">
                    <i class="fas fa-users"></i>
                    <h4>Share Positivity</h4>
                    <p>Connect with friends or help someone else</p>
                </div>
            </div>
        `;
    }

    getNeutralMoodRecommendations() {
        return `
            <div class="mood-recommendations">
                <div class="recommendation-card">
                    <i class="fas fa-wind"></i>
                    <h4>Breathing Exercise</h4>
                    <p>5-minute breathing exercise to center yourself</p>
                    <button class="btn btn-primary" onclick="app.startWellnessTool('breathing')">Try It</button>
                </div>
                <div class="recommendation-card">
                    <i class="fas fa-leaf"></i>
                    <h4>Nature Break</h4>
                    <p>Take a short walk or spend time outdoors</p>
                </div>
            </div>
        `;
    }

    getSupportiveMoodRecommendations() {
        return `
            <div class="mood-recommendations">
                <div class="recommendation-card urgent">
                    <i class="fas fa-phone"></i>
                    <h4>Talk to Someone</h4>
                    <p>Connect with a counselor or trusted friend</p>
                    <button class="btn btn-primary" onclick="app.scrollToSection('counselors')">Find Support</button>
                </div>
                <div class="recommendation-card">
                    <i class="fas fa-heart-pulse"></i>
                    <h4>Crisis Resources</h4>
                    <p>Immediate help is available 24/7</p>
                    <button class="btn btn-danger" onclick="app.showEmergencyModal()">Get Help</button>
                </div>
            </div>
        `;
    }

    // Wellness tools functionality
    startWellnessTool(tool) {
        switch (tool) {
            case 'breathing':
                this.startBreathingExercise();
                break;
            case 'meditation':
                this.startMeditation();
                break;
            case 'journal':
                this.openJournal();
                break;
            case 'gratitude':
                this.openGratitudeJournal();
                break;
            default:
                this.showToast(`Starting ${tool} tool...`, 'info');
        }
        this.trackEvent('wellness_tool_started', { tool });
    }

    startBreathingExercise() {
        // Create breathing exercise modal
        const modalHTML = `
            <div class="modal show" id="breathingModal">
                <div class="modal-content breathing-modal">
                    <div class="modal-header">
                        <h2><i class="fas fa-wind"></i> Breathing Exercise</h2>
                        <button class="close-btn" onclick="app.closeBreathingExercise()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="breathing-circle">
                            <div class="circle" id="breathingCircle">
                                <div class="circle-text" id="breathingText">Get Ready</div>
                            </div>
                        </div>
                        <div class="breathing-controls">
                            <button class="btn btn-primary" id="startBreathingBtn" onclick="app.startBreathingCycle()">
                                <i class="fas fa-play"></i> Start
                            </button>
                            <button class="btn btn-secondary" id="stopBreathingBtn" onclick="app.stopBreathingCycle()" style="display: none;">
                                <i class="fas fa-stop"></i> Stop
                            </button>
                        </div>
                        <div class="breathing-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="breathingProgress"></div>
                            </div>
                            <div class="cycle-counter">Cycle: <span id="cycleCount">0</span>/5</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    startBreathingCycle() {
        let cycleCount = 0;
        const totalCycles = 5;
        const inhaleTime = 4000;
        const holdTime = 4000;
        const exhaleTime = 4000;
        
        const circle = document.getElementById('breathingCircle');
        const text = document.getElementById('breathingText');
        const progress = document.getElementById('breathingProgress');
        const counter = document.getElementById('cycleCount');
        const startBtn = document.getElementById('startBreathingBtn');
        const stopBtn = document.getElementById('stopBreathingBtn');
        
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        
        this.breathingInterval = setInterval(() => {
            if (cycleCount >= totalCycles) {
                this.completeBreathingExercise();
                return;
            }
            
            // Inhale
            text.textContent = 'Breathe In';
            circle.style.transform = 'scale(1.5)';
            circle.style.background = 'linear-gradient(135deg, var(--primary-400), var(--primary-600))';
            
            setTimeout(() => {
                // Hold
                text.textContent = 'Hold';
                circle.style.background = 'linear-gradient(135deg, var(--secondary-400), var(--secondary-600))';
                
                setTimeout(() => {
                    // Exhale
                    text.textContent = 'Breathe Out';
                    circle.style.transform = 'scale(1)';
                    circle.style.background = 'linear-gradient(135deg, var(--accent-400), var(--accent-600))';
                    
                    cycleCount++;
                    counter.textContent = cycleCount;
                    progress.style.width = `${(cycleCount / totalCycles) * 100}%`;
                }, holdTime);
            }, inhaleTime);
            
        }, inhaleTime + holdTime + exhaleTime);
    }

    stopBreathingCycle() {
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
        }
        this.closeBreathingExercise();
    }

    completeBreathingExercise() {
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
        }
        
        const text = document.getElementById('breathingText');
        if (text) {
            text.textContent = 'Complete! ✨';
        }
        
        this.showToast('Breathing exercise completed! Great job!', 'success');
        
        setTimeout(() => {
            this.closeBreathingExercise();
        }, 2000);
    }

    closeBreathingExercise() {
        const modal = document.getElementById('breathingModal');
        if (modal) {
            modal.remove();
        }
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
        }
    }

    startMeditation() {
        this.showToast('Opening meditation session...', 'info');
        // Implement meditation functionality
    }

    openJournal() {
        const modalHTML = `
            <div class="modal show" id="journalModal">
                <div class="modal-content journal-modal">
                    <div class="modal-header">
                        <h2><i class="fas fa-pen"></i> Mood Journal</h2>
                        <button class="close-btn" onclick="app.closeJournal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="journal-prompts">
                            <h3>Reflection Prompts</h3>
                            <div class="prompt-buttons">
                                <button class="btn btn-outline prompt-btn" onclick="app.setJournalPrompt('How am I feeling right now?')">Current Feelings</button>
                                <button class="btn btn-outline prompt-btn" onclick="app.setJournalPrompt('What am I grateful for today?')">Gratitude</button>
                                <button class="btn btn-outline prompt-btn" onclick="app.setJournalPrompt('What challenges am I facing?')">Challenges</button>
                                <button class="btn btn-outline prompt-btn" onclick="app.setJournalPrompt('What would make tomorrow better?')">Tomorrow</button>
                            </div>
                        </div>
                        <div class="journal-input">
                            <textarea id="journalText" placeholder="Start writing your thoughts..." rows="10"></textarea>
                            <div class="journal-actions">
                                <button class="btn btn-primary" onclick="app.saveJournalEntry()">
                                    <i class="fas fa-save"></i> Save Entry
                                </button>
                                <button class="btn btn-secondary" onclick="app.clearJournal()">
                                    <i class="fas fa-eraser"></i> Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    setJournalPrompt(prompt) {
        const textarea = document.getElementById('journalText');
        if (textarea) {
            textarea.value = `${prompt}\n\n`;
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }

    saveJournalEntry() {
        const textarea = document.getElementById('journalText');
        const text = textarea?.value.trim();
        
        if (!text) {
            this.showToast('Please write something first', 'warning');
            return;
        }
        
        // Save journal entry
        const entry = {
            text: text,
            timestamp: new Date().toISOString()
        };
        
        const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        existingEntries.push(entry);
        localStorage.setItem('journalEntries', JSON.stringify(existingEntries));
        
        this.showToast('Journal entry saved!', 'success');
        this.closeJournal();
        this.trackEvent('journal_entry_saved');
    }

    clearJournal() {
        const textarea = document.getElementById('journalText');
        if (textarea) {
            textarea.value = '';
            textarea.focus();
        }
    }

    closeJournal() {
        const modal = document.getElementById('journalModal');
        if (modal) {
            modal.remove();
        }
    }

    // Resource management
    async loadResources() {
        // Simulate API call
        await this.delay(500);
        
        this.resources = [
            {
                id: 1,
                title: 'Managing Anxiety & Stress',
                description: 'Comprehensive guide on coping strategies, breathing exercises, and mindfulness techniques.',
                type: 'guide',
                tags: ['anxiety', 'stress', 'self-help'],
                category: 'anxiety stress',
                icon: '🧘'
            },
            {
                id: 2,
                title: 'Understanding Depression',
                description: 'Educational material about depression symptoms, treatment options, and recovery strategies.',
                type: 'article',
                tags: ['depression', 'education', 'recovery'],
                category: 'depression mood',
                icon: '🌱'
            },
            {
                id: 3,
                title: 'Sleep & Mental Health',
                description: 'Learn about the connection between sleep and mental wellbeing, plus tips for better rest.',
                type: 'video',
                tags: ['sleep', 'wellness', 'tips'],
                category: 'sleep wellness',
                icon: '🌙'
            },
            {
                id: 4,
                title: 'Healthy Relationships',
                description: 'Building and maintaining healthy relationships during your academic journey.',
                type: 'guide',
                tags: ['relationships', 'social', 'communication'],
                category: 'relationships social',
                icon: '💝'
            },
            {
                id: 5,
                title: 'Academic Stress Management',
                description: 'Strategies for managing exam stress, time management, and academic pressure.',
                type: 'article',
                tags: ['academic', 'stress', 'study-tips'],
                category: 'academic stress',
                icon: '📖'
            },
            {
                id: 6,
                title: 'Mindfulness & Meditation',
                description: 'Guided meditation sessions and mindfulness exercises for daily practice.',
                type: 'interactive',
                tags: ['mindfulness', 'meditation', 'practice'],
                category: 'mindfulness meditation',
                icon: '🕯️'
            }
        ];
        
        this.renderResources();
    }

    renderResources() {
        const resourcesGrid = document.getElementById('resourcesGrid');
        if (!resourcesGrid) return;
        
        resourcesGrid.innerHTML = '';
        
        this.resources.forEach(resource => {
            const card = this.createResourceCard(resource);
            resourcesGrid.appendChild(card);
        });
    }

    createResourceCard(resource) {
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.dataset.category = resource.category;
        
        card.innerHTML = `
            <div class="resource-image">${resource.icon}</div>
            <div class="resource-content">
                <h3 class="resource-title">${resource.title}</h3>
                <p class="resource-description">${resource.description}</p>
                <div class="resource-tags">
                    ${resource.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <button class="btn btn-primary" onclick="app.openResource(${resource.id})" style="margin-top: 1rem; width: 100%;">
                    <i class="fas fa-external-link-alt"></i> View Resource
                </button>
            </div>
        `;
        
        return card;
    }

    openResource(resourceId) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (resource) {
            this.showToast(`Opening: ${resource.title}`, 'info');
            this.trackEvent('resource_opened', { id: resourceId, title: resource.title });
            // In a real app, this would navigate to the resource
        }
    }

    switchResourceTab(tab) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
        
        // Filter resources by type
        if (tab === 'all') {
            this.renderResources();
        } else {
            const filteredResources = this.resources.filter(r => r.type === tab);
            this.renderFilteredResources(filteredResources);
        }
        
        this.trackEvent('resource_tab_switched', { tab });
    }

    renderFilteredResources(resources) {
        const resourcesGrid = document.getElementById('resourcesGrid');
        if (!resourcesGrid) return;
        
        resourcesGrid.innerHTML = '';
        
        resources.forEach(resource => {
            const card = this.createResourceCard(resource);
            resourcesGrid.appendChild(card);
        });
    }

    loadMoreResources() {
        this.showToast('Loading more resources...', 'info');
        // Implement pagination
        this.trackEvent('load_more_resources');
    }

    // Counselor management
    async loadCounselors() {
        await this.delay(500);
        
        this.counselors = [
            {
                id: 1,
                name: 'Dr. Priya Sharma',
                title: 'Clinical Psychologist',
                specialties: ['anxiety', 'depression', 'student-support'],
                location: 'bangalore',
                availability: 'week',
                rating: 4.8,
                experience: '8 years',
                languages: ['English', 'Hindi', 'Kannada'],
                description: 'Specializing in anxiety, depression, and student mental health with a focus on cognitive behavioral therapy.',
                avatar: '👩‍⚕️'
            },
            {
                id: 2,
                name: 'Dr. Rahul Mehta',
                title: 'Psychiatrist',
                specialties: ['stress', 'academic', 'medication'],
                location: 'mumbai',
                availability: 'today',
                rating: 4.9,
                experience: '12 years',
                languages: ['English', 'Hindi', 'Marathi'],
                description: 'Psychiatrist with expertise in stress management and academic performance anxiety.',
                avatar: '👨‍⚕️'
            },
            {
                id: 3,
                name: 'Dr. Anjali Patel',
                title: 'Counseling Psychologist',
                specialties: ['career', 'relationships', 'self-esteem'],
                location: 'delhi',
                availability: 'emergency',
                rating: 4.7,
                experience: '6 years',
                languages: ['English', 'Hindi', 'Gujarati'],
                description: 'Helping students navigate career decisions and build healthy relationships.',
                avatar: '👩‍⚕️'
            }
        ];
        
        this.renderCounselors();
    }

    renderCounselors() {
        const counselorsGrid = document.getElementById('counselorsGrid');
        if (!counselorsGrid) return;
        
        counselorsGrid.innerHTML = '';
        
        this.counselors.forEach(counselor => {
            const card = this.createCounselorCard(counselor);
            counselorsGrid.appendChild(card);
        });
    }

    createCounselorCard(counselor) {
        const card = document.createElement('div');
        card.className = 'resource-card counselor-card';
        
        const availabilityBadge = this.getAvailabilityBadge(counselor.availability);
        
        card.innerHTML = `
            <div class="resource-image counselor-avatar">${counselor.avatar}</div>
            <div class="resource-content">
                <div class="counselor-header">
                    <h3 class="resource-title">${counselor.name}</h3>
                    <div class="counselor-rating">
                        <i class="fas fa-star"></i> ${counselor.rating}
                    </div>
                </div>
                <p class="counselor-title">${counselor.title}</p>
                <p class="counselor-experience">${counselor.experience} experience</p>
                <p class="resource-description">${counselor.description}</p>
                <div class="counselor-details">
                    <div class="detail-row">
                        <span class="detail-label">Languages:</span>
                        <span class="detail-value">${counselor.languages.join(', ')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">${counselor.location}</span>
                    </div>
                </div>
                <div class="resource-tags">
                    ${counselor.specialties.map(specialty => `<span class="tag">${specialty}</span>`).join('')}
                </div>
                <div class="counselor-actions">
                    ${availabilityBadge}
                    <button class="btn btn-primary" onclick="app.bookCounselor(${counselor.id})" style="width: 100%; margin-top: 1rem;">
                        <i class="fas fa-calendar-plus"></i> Book Appointment
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    getAvailabilityBadge(availability) {
        const badges = {
            'today': '<span class="availability-badge available">Available Today</span>',
            'week': '<span class="availability-badge soon">Available This Week</span>',
            'emergency': '<span class="availability-badge emergency">Emergency Available</span>'
        };
        return badges[availability] || '';
    }

    bookCounselor(counselorId) {
        const counselor = this.counselors.find(c => c.id === counselorId);
        if (counselor) {
            this.showToast(`Booking appointment with ${counselor.name}...`, 'info');
            this.trackEvent('counselor_booking_started', { id: counselorId, name: counselor.name });
            // In a real app, this would open a booking modal or redirect
        }
    }

    filterCounselors() {
        const locationFilter = document.getElementById('locationFilter')?.value;
        const specialtyFilter = document.getElementById('specialtyFilter')?.value;
        const availabilityFilter = document.getElementById('availabilityFilter')?.value;
        
        let filteredCounselors = this.counselors;
        
        if (locationFilter) {
            filteredCounselors = filteredCounselors.filter(c => c.location === locationFilter);
        }
        
        if (specialtyFilter) {
            filteredCounselors = filteredCounselors.filter(c => 
                c.specialties.includes(specialtyFilter)
            );
        }
        
        if (availabilityFilter) {
            filteredCounselors = filteredCounselors.filter(c => 
                c.availability === availabilityFilter
            );
        }
        
        this.renderFilteredCounselors(filteredCounselors);
        this.trackEvent('counselors_filtered', { location: locationFilter, specialty: specialtyFilter, availability: availabilityFilter });
    }

    renderFilteredCounselors(counselors) {
        const counselorsGrid = document.getElementById('counselorsGrid');
        if (!counselorsGrid) return;
        
        counselorsGrid.innerHTML = '';
        
        if (counselors.length === 0) {
            counselorsGrid.innerHTML = '<p class="no-results">No counselors found matching your criteria.</p>';
            return;
        }
        
        counselors.forEach(counselor => {
            const card = this.createCounselorCard(counselor);
            counselorsGrid.appendChild(card);
        });
    }

    // Chat functionality
    setupChat() {
        this.chatHistory = [
            {
                type: 'bot',
                message: "Hi! I'm your MindCare assistant. How can I help you today?",
                timestamp: new Date().toISOString()
            }
        ];
    }

    toggleChat() {
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow) {
            const isVisible = chatWindow.style.display === 'flex';
            chatWindow.style.display = isVisible ? 'none' : 'flex';
            
            if (!isVisible) {
                this.trackEvent('chat_opened');
            }
        }
    }

    closeChat() {
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow) {
            chatWindow.style.display = 'none';
        }
    }

    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput?.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addChatMessage('user', message);
        chatInput.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const response = this.generateBotResponse(message);
            this.addChatMessage('bot', response);
        }, 1000);
        
        this.trackEvent('chat_message_sent', { message: message.substring(0, 50) });
    }

    addChatMessage(type, message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}-message`;
        
        const avatar = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store in chat history
        this.chatHistory.push({
            type: type,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    generateBotResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('anxiety') || lowerMessage.includes('anxious')) {
            return "I understand you're dealing with anxiety. Have you tried our breathing exercises? They can be really helpful for managing anxious feelings. Would you like me to guide you through one?";
        } else if (lowerMessage.includes('depression') || lowerMessage.includes('sad')) {
            return "I'm sorry to hear you're feeling down. It's important to remember that these feelings are valid and you're not alone. Consider checking out our depression resources or speaking with one of our counselors.";
        } else if (lowerMessage.includes('stress') || lowerMessage.includes('stressed')) {
            return "Stress can be overwhelming, especially during studies. Have you tried our stress management tools? I can also help you find resources specific to academic stress.";
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
            return "I'm here to help! You can explore our resources, take a mood check, find a counselor, or access crisis support if you need immediate help. What would be most helpful for you right now?";
        } else {
            return "Thank you for sharing that with me. I'm here to support you. You can explore our mental health resources, connect with counselors, or use our wellness tools. Is there something specific I can help you with today?";
        }
    }

    handleQuickResponse(response) {
        const responses = {
            'mood': "I'd like to check my mood",
            'resources': "Can you help me find mental health resources?",
            'counselor': "I want to speak with a counselor"
        };
        
        const chatInput = document.getElementById('chatInput');
        if (chatInput && responses[response]) {
            chatInput.value = responses[response];
            this.sendChatMessage();
        }
    }

    // FAB (Floating Action Button) functionality
    setupFAB() {
        // FAB is already set up in event listeners
    }

    toggleFAB() {
        const fabContainer = document.querySelector('.fab-container');
        if (fabContainer) {
            fabContainer.classList.toggle('active');
        }
    }

    handleFABAction(action) {
        switch (action) {
            case 'mood':
                this.scrollToSection('tools');
                break;
            case 'breathing':
                this.startBreathingExercise();
                break;
            case// Mental Health Platform JavaScript
// =================================

class MentalHealthPlatform {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.loadInitialData();
        this.currentMood = null;
        this.selectedFactors = [];
        this.chatHistory = [];
        this.resources = [];
        this.counselors = [];
    }

    // Initialize the platform
    init() {
        console.log('🧠 MindCare Hub initialized');
        this.showToast('Welcome to MindCare Hub!', 'success');
        this.setupNavigation();
        this.setupModals();
        this.setupChat();
        this.setupFAB();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation
        document.getElementById('mobileToggle')?.addEventListener('click', this.toggleMobileNav.bind(this));
        
        // Emergency button
        document.getElementById('emergencyBtn')?.addEventListener('click', this.showEmergencyModal.bind(this));
        document.getElementById('closeEmergencyModal')?.addEventListener('click', this.hideEmergencyModal.bind(this));
        
        // Hero buttons
        document.getElementById('getStartedBtn')?.addEventListener('click', () => this.scrollToSection('tools'));
        document.getElementById('moodCheckBtn')?.addEventListener('click', () => this.scrollToSection('tools'));
        
        // Quick access cards
        document.querySelectorAll('.access-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.category;
                this.handleQuickAccess(action);
            });
        });
        
        // Search functionality
        document.getElementById('searchBtn')?.addEventListener('click', this.performSearch.bind(this));
        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        document.getElementById('searchInput')?.addEventListener('input', this.handleSearchInput.bind(this));
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });
        
        // Mood tracker
        document.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectMood(e.currentTarget));
        });
        document.getElementById('submitMoodBtn')?.addEventListener('click', this.submitMood.bind(this));
        document.getElementById('skipMoodBtn')?.addEventListener('click', this.skipMoodDetails.bind(this));
        
        // Factor tags
        document.querySelectorAll('.factor-tag').forEach(tag => {
            tag.addEventListener('click', (e) => this.toggleFactor(e.target));
        });
        
        // Wellness tools
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.startWellnessTool(tool);
            });
        });
        
        // Resource tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchResourceTab(e.target.dataset.tab));
        });
        
        // Load more resources
        document.getElementById('loadMoreBtn')?.addEventListener('click', this.loadMoreResources.bind(this));
        
        // Counselor filters
        document.getElementById('locationFilter')?.addEventListener('change', this.filterCounselors.bind(this));
        document.getElementById('specialtyFilter')?.addEventListener('change', this.filterCounselors.bind(this));
        document.getElementById('availabilityFilter')?.addEventListener('change', this.filterCounselors.bind(this));
        
        // Chat functionality
        document.getElementById('chatToggle')?.addEventListener('click', this.toggleChat.bind(this));
        document.getElementById('chatClose')?.addEventListener('click', this.closeChat.bind(this));
        document.getElementById('chatSend')?.addEventListener('click', this.sendChatMessage.bind(this));
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Quick chat responses
        document.querySelectorAll('.quick-response').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickResponse(e.target.dataset.response));
        });
        
        // FAB functionality
        document.getElementById('fabMain')?.addEventListener('click', this.toggleFAB.bind(this));
        document.querySelectorAll('.fab-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleFABAction(e.target.dataset.action));
        });
        
        // Modal close on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal(modal);
            });
        });
        
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // Window events
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    // Load initial data
    async loadInitialData() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadResources(),
                this.loadCounselors(),
                this.loadEmergencyContacts()
            ]);
            this.hideLoading();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showToast('Error loading data. Please refresh the page.', 'error');
            this.hideLoading();
        }
    }

    // Navigation functionality
    setupNavigation() {
        const navbar = document.getElementById('navbar');
        let lastScrollTop = 0;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        });
    }

    toggleMobileNav() {
        const navMenu = document.getElementById('navMenu');
        navMenu.classList.toggle('show');
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Modal functionality
    setupModals() {
        // Setup modal close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) this.hideModal(openModal);
            }
        });
    }

    showEmergencyModal() {
        const modal = document.getElementById('emergencyModal');
        if (modal) {
            modal.classList.add('show');
            this.trackEvent('emergency_modal_opened');
        }
    }

    hideEmergencyModal() {
        const modal = document.getElementById('emergencyModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    hideModal(modal) {
        modal.classList.remove('show');
    }

    // Quick access functionality
    handleQuickAccess(action) {
        switch (action) {
            case 'crisis':
                this.showEmergencyModal();
                break;
            case 'counselors':
                this.scrollToSection('counselors');
                break;
            case 'tools':
                this.scrollToSection('tools');
                break;
            case 'resources':
                this.scrollToSection('resources');
                break;
            default:
                console.log('Unknown action:', action);
        }
        this.trackEvent('quick_access_clicked', { action });
    }

    // Search functionality
    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput?.value.trim();
        
        if (!query) {
            this.showToast('Please enter a search term', 'warning');
            return;
        }

        this.showLoading();
        try {
            const results = await this.searchContent(query);
            this.displaySearchResults(results);
            this.trackEvent('search_performed', { query });
            this.showToast(`Found ${results.length} results for "${query}"`, 'success');
        } catch (error) {
            console.error('Search error:', error);
            this.showToast('Search failed. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    handleSearchInput(e) {
        const query = e.target.value.trim();
        if (query.length >= 3) {
            this.showSearchSuggestions(query);
        } else {
            this.hideSearchSuggestions();
        }
    }

    async searchContent(query) {
        // Simulate API call
        await this.delay(500);
        
        const allContent = [...this.resources, ...this.counselors];
        return allContent.filter(item => 
            item.title?.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase()) ||
            item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
    }

    displaySearchResults(results) {
        // Display search results in the resources grid
        const resourcesGrid = document.getElementById('resourcesGrid');
        if (resourcesGrid) {
            resourcesGrid.innerHTML = '';
            results.forEach(result => {
                const card = this.createResourceCard(result);
                resourcesGrid.appendChild(card);
            });
        }
    }

    showSearchSuggestions(query) {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            // Mock suggestions
            const mockSuggestions = [
                'anxiety management',
                'depression support',
                'stress relief',
                'counseling services',
                'crisis help'
            ].filter(s => s.includes(query.toLowerCase()));

            if (mockSuggestions.length > 0) {
                suggestions.innerHTML = mockSuggestions
                    .map(s => `<div class="suggestion-item" onclick="app.selectSuggestion('${s}')">${s}</div>`)
                    .join('');
                suggestions.style.display = 'block';
            }
        }
    }

    hideSearchSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }

    selectSuggestion(suggestion) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = suggestion;
            this.performSearch();
            this.hideSearchSuggestions();
        }
    }

    // Filter functionality
    handleFilter(filter) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

        // Filter content
        this.filterResources(filter);
        this.trackEvent('filter_applied', { filter });
    }

    filterResources(filter) {
        const cards = document.querySelectorAll('.resource-card');
        cards.forEach(card => {
            const categories = card.dataset.category || '';
            if (filter === 'all' || categories.includes(filter)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Mood tracker functionality
    selectMood(moodElement) {
        // Remove previous selection
        document.querySelectorAll('.mood-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Select current mood
        moodElement.classList.add('selected');
        this.currentMood = {
            mood: moodElement.dataset.mood,
            score: parseInt(moodElement.dataset.score)
        };

        // Show mood details
        document.getElementById('moodDetails').style.display = 'block';
        this.trackEvent('mood_selected', { mood: this.currentMood.mood });
    }

    toggleFactor(factorElement) {
        const factor = factorElement.dataset.factor;
        
        if (factorElement.classList.contains('selected')) {
            factorElement.classList.remove('selected');
            this.selectedFactors = this.selectedFactors.filter(f => f !== factor);
        } else {
            factorElement.classList.add('selected');
            this.selectedFactors.push(factor);
        }
    }

    async submitMood() {
        if (!this.currentMood) {
            this.showToast('Please select your mood first', 'warning');
            return;
        }

        this.showLoading();
        
        const moodData = {
            mood: this.currentMood.mood,
            score: this.currentMood.score,
            factors: this.selectedFactors,
            timestamp: new Date().toISOString()
        };

        try {
            // Simulate API call to save mood
            await this.saveMoodData(moodData);
            
            // Show personalized feedback
            this.showMoodFeedback(moodData);
            
            this.trackEvent('mood_submitted', moodData);
            this.showToast('Mood logged successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving mood:', error);
            this.showToast('Failed to save mood. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    skipMoodDetails() {
        this.submitMood();
    }

    async saveMoodData(moodData) {
        // Simulate API call
        await this.delay(1000);
        
        // Store in local storage for demo
        const existingMoods = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        existingMoods.push(moodData);
        localStorage.setItem('moodHistory', JSON.stringify(existingMoods));
    }

    showMoodFeedback(moodData) {
        const feedback = document.getElementById('moodFeedback');
        if (!feedback) return;

        let feedbackHTML = '';
        let recommendations = '';

        // Generate feedback based on mood score
        if (moodData.score >= 4) {
            feedbackHTML = `
                <div class="mood-feedback-positive">
                    <h3>Great to hear you're feeling ${moodData.mood}! 🌟</h3>
                    <p>Keep up the positive momentum! Here are some ways to maintain your wellbeing:</p>
                </div>
            `;
            recommendations = this.getPositiveMoodRecommendations();
        } else if (moodData.score >= 3) {
            feedbackHTML = `
                <div class="mood-feedback-neutral">
                    <h3>It's okay to feel ${moodData.mood} sometimes 💙</h3>
                    <p>Here are some gentle activities that might help boost your mood:</p>
                </div>
            `;
            recommendations = this.getNeutralMoodRecommendations();
        } else {
            feedbackHTML = `
                <div class="mood-feedback-concern">
                    <h3>We're here to support you 🤗</h3>
                    <p>Thank you for sharing how you're feeling. Consider these supportive resources:</p>
                </div>
            `;
            recommendations = this.getSupportiveMoodRecommendations();
        }

        feedback.innerHTML = feedbackHTML + recommendations;
        feedback.style.display = 'block';
        
        // Scroll to feedback
        feedback.scrollIntoView({ behavior: 'smooth' });
    }

    getPositiveMoodRecommendations() {
        return `
            <div class="mood-recommendations">
                <div class="recommendation-card">
                    <i class="fas fa-heart"></i>
                    <h4>Practice Gratitude</h4>
                    <p>Keep a gratitude journal to maintain positivity</p>
                    <button class="btn btn-outline" onclick="app.startWellnessTool('gratitude')">Start Now</button>
                </div>
                <div class="recommendation-card">
                    <i class="fas fa-users"></i>
                    <h4>Share Positivity</h4>
                    <p>Connect with friends or help someone else</p>
                </div>
            </div>
        `;
    }

    getNeutralMoodRecommendations() {
        return `
            <div class="mood-recommendations">
                <div class="recommendation-card">
                    <i class="fas fa-wind"></i>
                    <h4>Breathing Exercise</h4>
                    <p>5-minute breathing exercise to center yourself</p>
                    <button class="btn btn-primary" onclick="app.startWellnessTool('breathing')">Try It</button>
                </div>
                <div class="recommendation-card">
                    <i class="fas fa-leaf"></i>
                    <h4>Nature Break</h4>
                    <p>Take a short walk or spend time outdoors</p>
                </div>
            </div>
        `;
    }

    getSupportiveMoodRecommendations() {
        return `
            <div class="mood-recommendations">
                <div class="recommendation-card urgent">
                    <i class="fas fa-phone"></i>
                    <h4>Talk to Someone</h4>
                    <p>Connect with a counselor or trusted friend</p>
                    <button class="btn btn-primary" onclick="app.scrollToSection('counselors')">Find Support</button>
                </div>
                <div class="recommendation-card">
                    <i class="fas fa-heart-pulse"></i>
                    <h4>Crisis Resources</h4>
                    <p>Immediate help is available 24/7</p>
                    <button class="btn btn-danger" onclick="app.showEmergencyModal()">Get Help</button>
                </div>
            </div>
        `;
    }

    // Wellness tools functionality
    startWellnessTool(tool) {
        switch (tool) {
            case 'breathing':
                this.startBreathingExercise();
                break;
            case 'meditation':
                this.startMeditation();
                break;
            case 'journal':
                this.openJournal();
                break;
            case 'gratitude':
                this.openGratitudeJournal();
                break;
            default:
                this.showToast(`Starting ${tool} tool...`, 'info');
        }
        this.trackEvent('wellness_tool_started', { tool });
    }

    startBreathingExercise() {
        // Create breathing exercise modal
        const modalHTML = `
            <div class="modal show" id="breathingModal">
                <div class="modal-content breathing-modal">
                    <div class="modal-header">
                        <h2><i class="fas fa-wind"></i> Breathing Exercise</h2>
                        <button class="close-btn" onclick="app.closeBreathingExercise()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="breathing-circle">
                            <div class="circle" id="breathingCircle">
                                <div class="circle-text" id="breathingText">Get Ready</div>
                            </div>
                        </div>
                        <div class="breathing-controls">
                            <button class="btn btn-primary" id="startBreathingBtn" onclick="app.startBreathingCycle()">
                                <i class="fas fa-play"></i> Start
                            </button>
                            <button class="btn btn-secondary" id="stopBreathingBtn" onclick="app.stopBreathingCycle()" style="display: none;">
                                <i class="fas fa-stop"></i> Stop
                            </button>
                        </div>
                        <div class="breathing-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="breathingProgress"></div>
                            </div>
                            <div class="cycle-counter">Cycle: <span id="cycleCount">0</span>/5</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    startBreathingCycle() {
        let cycleCount = 0;
        const totalCycles = 5;
        const inhaleTime = 4000;
        const holdTime = 4000;
        const exhaleTime = 4000;
        
        const circle = document.getElementById('breathingCircle');
        const text = document.getElementById('breathingText');
        const progress = document.getElementById('breathingProgress');
        const counter = document.getElementById('cycleCount');
        const startBtn = document.getElementById('startBreathingBtn');
        const stopBtn = document.getElementById('stopBreathingBtn');
        
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        
        this.breathingInterval = setInterval(() => {
            if (cycleCount >= totalCycles) {
                this.completeBreathingExercise();
                return;
            }
            
            // Inhale
            text.textContent = 'Breathe In';
            circle.style.transform = 'scale(1.5)';
            circle.style.background = 'linear-gradient(135deg, var(--primary-400), var(--primary-600))';
            
            setTimeout(() => {
                // Hold
                text.textContent = 'Hold';
                circle.style.background = 'linear-gradient(135deg, var(--secondary-400), var(--secondary-600))';
                
                setTimeout(() => {
                    // Exhale
                    text.textContent = 'Breathe Out';
                    circle.style.transform = 'scale(1)';
                    circle.style.background = 'linear-gradient(135deg, var(--accent-400), var(--accent-600))';
                    
                    cycleCount++;
                    counter.textContent = cycleCount;
                    progress.style.width = `${(cycleCount / totalCycles) * 100}%`;
                }, holdTime);
            }, inhaleTime);
            
        }, inhaleTime + holdTime + exhaleTime);
    }

    stopBreathingCycle() {
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
        }
        this.closeBreathingExercise();
    }

    completeBreathingExercise() {
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
        }
        
        const text = document.getElementById('breathingText');
        if (text) {
            text.textContent = 'Complete! ✨';
        }
        
        this.showToast('Breathing exercise completed! Great job!', 'success');
        
        setTimeout(() => {
            this.closeBreathingExercise();
        }, 2000);
    }

    closeBreathingExercise() {
        const modal = document.getElementById('breathingModal');
        if (modal) {
            modal.remove();
        }
        if (this.breathingInterval) {
            clearInterval(this.breathingInterval);
        }
    }

    startMeditation() {
        this.showToast('Opening meditation session...', 'info');
        // Implement meditation functionality
    }

    openJournal() {
        const modalHTML = `
            <div class="modal show" id="journalModal">
                <div class="modal-content journal-modal">
                    <div class="modal-header">
                        <h2><i class="fas fa-pen"></i> Mood Journal</h2>
                        <button class="close-btn" onclick="app.closeJournal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="journal-prompts">
                            <h3>Reflection Prompts</h3>
                            <div class="prompt-buttons">
                                <button class="btn btn-outline prompt-btn" onclick="app.setJournalPrompt('How am I feeling right now?')">Current Feelings</button>
                                <button class="btn btn-outline prompt-btn" onclick="app.setJournalPrompt('What am I grateful for today?')">Gratitude</button>
                                <button class="btn btn-outline prompt-btn" onclick="app.setJournalPrompt('What challenges am I facing?')">Challenges</button>
                                <button class="btn btn-outline prompt-btn" onclick="app.setJournalPrompt('What would make tomorrow better?')">Tomorrow</button>
                            </div>
                        </div>
                        <div class="journal-input">
                            <textarea id="journalText" placeholder="Start writing your thoughts..." rows="10"></textarea>
                            <div class="journal-actions">
                                <button class="btn btn-primary" onclick="app.saveJournalEntry()">
                                    <i class="fas fa-save"></i> Save Entry
                                </button>
                                <button class="btn btn-secondary" onclick="app.clearJournal()">
                                    <i class="fas fa-eraser"></i> Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    setJournalPrompt(prompt) {
        const textarea = document.getElementById('journalText');
        if (textarea) {
            textarea.value = `${prompt}\n\n`;
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }

    saveJournalEntry() {
        const textarea = document.getElementById('journalText');
        const text = textarea?.value.trim();
        
        if (!text) {
            this.showToast('Please write something first', 'warning');
            return;
        }
        
        // Save journal entry
        const entry = {
            text: text,
            timestamp: new Date().toISOString()
        };
        
        const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        existingEntries.push(entry);
        localStorage.setItem('journalEntries', JSON.stringify(existingEntries));
        
        this.showToast('Journal entry saved!', 'success');
        this.closeJournal();
        this.trackEvent('journal_entry_saved');
    }

    clearJournal() {
        const textarea = document.getElementById('journalText');
        if (textarea) {
            textarea.value = '';
            textarea.focus();
        }
    }

    closeJournal() {
        const modal = document.getElementById('journalModal');
        if (modal) {
            modal.remove();
        }
    }

    // Resource management
    async loadResources() {
        // Simulate API call
        await this.delay(500);
        
        this.resources = [
            {
                id: 1,
                title: 'Managing Anxiety & Stress',
                description: 'Comprehensive guide on coping strategies, breathing exercises, and mindfulness techniques.',
                type: 'guide',
                tags: ['anxiety', 'stress', 'self-help'],
                category: 'anxiety stress',
                icon: '🧘'
            },
            {
                id: 2,
                title: 'Understanding Depression',
                description: 'Educational material about depression symptoms, treatment options, and recovery strategies.',
                type: 'article',
                tags: ['depression', 'education', 'recovery'],
                category: 'depression mood',
                icon: '🌱'
            },
            {
                id: 3,
                title: 'Sleep & Mental Health',
                description: 'Learn about the connection between sleep and mental wellbeing, plus tips for better rest.',
                type: 'video',
                tags: ['sleep', 'wellness', 'tips'],
                category: 'sleep wellness',
                icon: '🌙'
            },
            {
                id: 4,
                title: 'Healthy Relationships',
                description: 'Building and maintaining healthy relationships during your academic journey.',
                type: 'guide',
                tags: ['relationships', 'social', 'communication'],
                category: 'relationships social',
                icon: '💝'
            },
            {
                id: 5,
                title: 'Academic Stress Management',
                description: 'Strategies for managing exam stress, time management, and academic pressure.',
                type: 'article',
                tags: ['academic', 'stress', 'study-tips'],
                category: 'academic stress',
                icon: '📖'
            },
            {
                id: 6,
                title: 'Mindfulness & Meditation',
                description: 'Guided meditation sessions and mindfulness exercises for daily practice.',
                type: 'interactive',
                tags: ['mindfulness', 'meditation', 'practice'],
                category: 'mindfulness meditation',
                icon: '🕯️'
            }
        ];
        
        this.renderResources();
    }

    renderResources() {
        const resourcesGrid = document.getElementById('resourcesGrid');
        if (!resourcesGrid) return;
        
        resourcesGrid.innerHTML = '';
        
        this.resources.forEach(resource => {
            const card = this.createResourceCard(resource);
            resourcesGrid.appendChild(card);
        });
    }

    createResourceCard(resource) {
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.dataset.category = resource.category;
        
        card.innerHTML = `
            <div class="resource-image">${resource.icon}</div>
            <div class="resource-content">
                <h3 class="resource-title">${resource.title}</h3>
                <p class="resource-description">${resource.description}</p>
                <div class="resource-tags">
                    ${resource.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <button class="btn btn-primary" onclick="app.openResource(${resource.id})" style="margin-top: 1rem; width: 100%;">
                    <i class="fas fa-external-link-alt"></i> View Resource
                </button>
            </div>
        `;
        
        return card;
    }

    openResource(resourceId) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (resource) {
            this.showToast(`Opening: ${resource.title}`, 'info');
            this.trackEvent('resource_opened', { id: resourceId, title: resource.title });
            // In a real app, this would navigate to the resource
        }
    }

    switchResourceTab(tab) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
        
        // Filter resources by type
        if (tab === 'all') {
            this.renderResources();
        } else {
            const filteredResources = this.resources.filter(r => r.type === tab);
            this.renderFilteredResources(filteredResources);
        }
        
        this.trackEvent('resource_tab_switched', { tab });
    }

    renderFilteredResources(resources) {
        const resourcesGrid = document.getElementById('resourcesGrid');
        if (!resourcesGrid) return;
        
        resourcesGrid.innerHTML = '';
        
        resources.forEach(resource => {
            const card = this.createResourceCard(resource);
            resourcesGrid.appendChild(card);
        });
    }

    loadMoreResources() {
        this.showToast('Loading more resources...', 'info');
        // Implement pagination
        this.trackEvent('load_more_resources');
    }

    // Counselor management
    async loadCounselors() {
        await this.delay(500);
        
        this.counselors = [
            {
                id: 1,
                name: 'Dr. Priya Sharma',
                title: 'Clinical Psychologist',
                specialties: ['anxiety', 'depression', 'student-support'],
                location: 'bangalore',
                availability: 'week',
                rating: 4.8,
                experience: '8 years',
                languages: ['English', 'Hindi', 'Kannada'],
                description: 'Specializing in anxiety, depression, and student mental health with a focus on cognitive behavioral therapy.',
                avatar: '👩‍⚕️'
            },
            {
                id: 2,
                name: 'Dr. Rahul Mehta',
                title: 'Psychiatrist',
                specialties: ['stress', 'academic', 'medication'],
                location: 'mumbai',
                availability: 'today',
                rating: 4.9,
                experience: '12 years',
                languages: ['English', 'Hindi', 'Marathi'],
                description: 'Psychiatrist with expertise in stress management and academic performance anxiety.',
                avatar: '👨‍⚕️'
            },
            {
                id: 3,
                name: 'Dr. Anjali Patel',
                title: 'Counseling Psychologist',
                specialties: ['career', 'relationships', 'self-esteem'],
                location: 'delhi',
                availability: 'emergency',
                rating: 4.7,
                experience: '6 years',
                languages: ['English', 'Hindi', 'Gujarati'],
                description: 'Helping students navigate career decisions and build healthy relationships.',
                avatar: '👩‍⚕️'
            }
        ];
        
        this.renderCounselors();
    }

    renderCounselors() {
        const counselorsGrid = document.getElementById('counselorsGrid');
        if (!counselorsGrid) return;
        
        counselorsGrid.innerHTML = '';
        
        this.counselors.forEach(counselor => {
            const card = this.createCounselorCard(counselor);
            counselorsGrid.appendChild(card);
        });
    }

    createCounselorCard(counselor) {
        const card = document.createElement('div');
        card.className = 'resource-card counselor-card';
        
        const availabilityBadge = this.getAvailabilityBadge(counselor.availability);
        
        card.innerHTML = `
            <div class="resource-image counselor-avatar">${counselor.avatar}</div>
            <div class="resource-content">
                <div class="counselor-header">
                    <h3 class="resource-title">${counselor.name}</h3>
                    <div class="counselor-rating">
                        <i class="fas fa-star"></i> ${counselor.rating}
                    </div>
                </div>
                <p class="counselor-title">${counselor.title}</p>
                <p class="counselor-experience">${counselor.experience} experience</p>
                <p class="resource-description">${counselor.description}</p>
                <div class="counselor-details">
                    <div class="detail-row">
                        <span class="detail-label">Languages:</span>
                        <span class="detail-value">${counselor.languages.join(', ')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">${counselor.location}</span>
                    </div>
                </div>
                <div class="resource-tags">
                    ${counselor.specialties.map(specialty => `<span class="tag">${specialty}</span>`).join('')}
                </div>
                <div class="counselor-actions">
                    ${availabilityBadge}
                    <button class="btn btn-primary" onclick="app.bookCounselor(${counselor.id})" style="width: 100%; margin-top: 1rem;">
                        <i class="fas fa-calendar-plus"></i> Book Appointment
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    getAvailabilityBadge(availability) {
        const badges = {
            'today': '<span class="availability-badge available">Available Today</span>',
            'week': '<span class="availability-badge soon">Available This Week</span>',
            'emergency': '<span class="availability-badge emergency">Emergency Available</span>'
        };
        return badges[availability] || '';
    }

    bookCounselor(counselorId) {
        const counselor = this.counselors.find(c => c.id === counselorId);
        if (counselor) {
            this.showToast(`Booking appointment with ${counselor.name}...`, 'info');
            this.trackEvent('counselor_booking_started', { id: counselorId, name: counselor.name });
            // In a real app, this would open a booking modal or redirect
        }
    }

    filterCounselors() {
        const locationFilter = document.getElementById('locationFilter')?.value;
        const specialtyFilter = document.getElementById('specialtyFilter')?.value;
        const availabilityFilter = document.getElementById('availabilityFilter')?.value;
        
        let filteredCounselors = this.counselors;
        
        if (locationFilter) {
            filteredCounselors = filteredCounselors.filter(c => c.location === locationFilter);
        }
        
        if (specialtyFilter) {
            filteredCounselors = filteredCounselors.filter(c => 
                c.specialties.includes(specialtyFilter)
            );
        }
        
        if (availabilityFilter) {
            filteredCounselors = filteredCounselors.filter(c => 
                c.availability === availabilityFilter
            );
        }
        
        this.renderFilteredCounselors(filteredCounselors);
        this.trackEvent('counselors_filtered', { location: locationFilter, specialty: specialtyFilter, availability: availabilityFilter });
    }

    renderFilteredCounselors(counselors) {
        const counselorsGrid = document.getElementById('counselorsGrid');
        if (!counselorsGrid) return;
        
        counselorsGrid.innerHTML = '';
        
        if (counselors.length === 0) {
            counselorsGrid.innerHTML = '<p class="no-results">No counselors found matching your criteria.</p>';
            return;
        }
        
        counselors.forEach(counselor => {
            const card = this.createCounselorCard(counselor);
            counselorsGrid.appendChild(card);
        });
    }

    // Chat functionality
    setupChat() {
        this.chatHistory = [
            {
                type: 'bot',
                message: "Hi! I'm your MindCare assistant. How can I help you today?",
                timestamp: new Date().toISOString()
            }
        ];
    }

    toggleChat() {
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow) {
            const isVisible = chatWindow.style.display === 'flex';
            chatWindow.style.display = isVisible ? 'none' : 'flex';
            
            if (!isVisible) {
                this.trackEvent('chat_opened');
            }
        }
    }

    closeChat() {
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow) {
            chatWindow.style.display = 'none';
        }
    }

    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput?.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addChatMessage('user', message);
        chatInput.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const response = this.generateBotResponse(message);
            this.addChatMessage('bot', response);
        }, 1000);
        
        this.trackEvent('chat_message_sent', { message: message.substring(0, 50) });
    }

    addChatMessage(type, message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}-message`;
        
        const avatar = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store in chat history
        this.chatHistory.push({
            type: type,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    generateBotResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('anxiety') || lowerMessage.includes('anxious')) {
            return "I understand you're dealing with anxiety. Have you tried our breathing exercises? They can be really helpful for managing anxious feelings. Would you like me to guide you through one?";
        } else if (lowerMessage.includes('depression') || lowerMessage.includes('sad')) {
            return "I'm sorry to hear you're feeling down. It's important to remember that these feelings are valid and you're not alone. Consider checking out our depression resources or speaking with one of our counselors.";
        } else if (lowerMessage.includes('stress') || lowerMessage.includes('stressed')) {
            return "Stress can be overwhelming, especially during studies. Have you tried our stress management tools? I can also help you find resources specific to academic stress.";
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
            return "I'm here to help! You can explore our resources, take a mood check, find a counselor, or access crisis support if you need immediate help. What would be most helpful for you right now?";
        } else {
            return "Thank you for sharing that with me. I'm here to support you. You can explore our mental health resources, connect with counselors, or use our wellness tools. Is there something specific I can help you with today?";
        }
    }

    handleQuickResponse(response) {
        const responses = {
            'mood': "I'd like to check my mood",
            'resources': "Can you help me find mental health resources?",
            'counselor': "I want to speak with a counselor"
        };
        
        const chatInput = document.getElementById('chatInput');
        if (chatInput && responses[response]) {
            chatInput.value = responses[response];
            this.sendChatMessage();
        }
    }

    // FAB (Floating Action Button) functionality
    setupFAB() {
        // FAB is already set up in event listeners
    }

    toggleFAB() {
        const fabContainer = document.querySelector('.fab-container');
        if (fabContainer) {
            fabContainer.classList.toggle('active');
        }
    }

    handleFABAction(action) {
        switch (action) {
            case 'mood':
                this.scrollToSection('tools');
                break;
            case 'breathing':
                this.startBreathingExercise();
                break;
            case
