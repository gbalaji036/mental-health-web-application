// Mental Health Platform JavaScript - Fixed Version
// ================================================

class MentalHealthPlatform {
    constructor() {
        this.currentMood = null;
        this.selectedFactors = [];
        this.chatHistory = [];
        this.resources = [];
        this.counselors = [];
        this.isInitialized = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // Initialize the platform
    init() {
        try {
            console.log('🧠 MindCare Hub initializing...');
            
            this.setupEventListeners();
            this.loadInitialData();
            this.setupNavigation();
            this.setupModals();
            this.setupChat();
            this.setupFAB();
            
            this.showToast('Welcome to MindCare Hub!', 'success');
            this.isInitialized = true;
            
            console.log('✅ MindCare Hub initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing MindCare Hub:', error);
            this.showToast('Error loading application', 'error');
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        try {
            // Navigation
            const mobileToggle = document.getElementById('mobileToggle');
            if (mobileToggle) {
                mobileToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleMobileNav();
                });
            }

            // Emergency button
            const emergencyBtn = document.getElementById('emergencyBtn');
            if (emergencyBtn) {
                emergencyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showEmergencyModal();
                });
            }

            const closeEmergencyModal = document.getElementById('closeEmergencyModal');
            if (closeEmergencyModal) {
                closeEmergencyModal.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.hideEmergencyModal();
                });
            }

            // Hero buttons
            const getStartedBtn = document.getElementById('getStartedBtn');
            if (getStartedBtn) {
                getStartedBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToSection('tools');
                });
            }

            const moodCheckBtn = document.getElementById('moodCheckBtn');
            if (moodCheckBtn) {
                moodCheckBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToSection('tools');
                });
            }

            // Search functionality
            const searchBtn = document.getElementById('searchBtn');
            const searchInput = document.getElementById('searchInput');
            
            if (searchBtn) {
                searchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.performSearch();
                });
            }

            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.performSearch();
                    }
                });

                searchInput.addEventListener('input', (e) => {
                    this.showSearchSuggestions(e.target.value);
                });
            }

            // Mood tracking
            this.setupMoodTracking();

            // Quick access cards
            this.setupQuickAccessCards();

            // Filter buttons
            this.setupFilterButtons();

            // Resource cards
            this.setupResourceCards();

            // Tool cards
            this.setupToolCards();

            // FAB menu
            this.setupFABEvents();

            // Chat functionality
            this.setupChatEvents();

            // Tab functionality
            this.setupTabEvents();

            // Load more button
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.loadMoreResources();
                });
            }

            // Navigation links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = link.getAttribute('href').substring(1);
                    this.scrollToSection(target);
                });
            });

            // Close modal when clicking outside
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    this.hideModal(e.target);
                }
            });

        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    // Setup mood tracking functionality
    setupMoodTracking() {
        try {
            // Mood options
            document.querySelectorAll('.mood-option').forEach(option => {
                option.addEventListener('click', () => {
                    // Remove previous selection
                    document.querySelectorAll('.mood-option').forEach(opt => 
                        opt.classList.remove('selected')
                    );
                    
                    // Add selection to clicked option
                    option.classList.add('selected');
                    this.currentMood = option.dataset.mood;
                    
                    // Show mood details
                    const moodDetails = document.getElementById('moodDetails');
                    if (moodDetails) {
                        moodDetails.style.display = 'block';
                        moodDetails.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });

            // Factor tags
            document.querySelectorAll('.factor-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    tag.classList.toggle('selected');
                    const factor = tag.dataset.factor;
                    
                    if (tag.classList.contains('selected')) {
                        if (!this.selectedFactors.includes(factor)) {
                            this.selectedFactors.push(factor);
                        }
                    } else {
                        this.selectedFactors = this.selectedFactors.filter(f => f !== factor);
                    }
                });
            });

            // Submit mood button
            const submitMoodBtn = document.getElementById('submitMoodBtn');
            if (submitMoodBtn) {
                submitMoodBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.submitMood();
                });
            }

            // Skip mood button
            const skipMoodBtn = document.getElementById('skipMoodBtn');
            if (skipMoodBtn) {
                skipMoodBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.submitMood(true);
                });
            }

        } catch (error) {
            console.error('Error setting up mood tracking:', error);
        }
    }

    // Setup quick access cards
    setupQuickAccessCards() {
        try {
            document.querySelectorAll('.access-card').forEach(card => {
                const cardBtn = card.querySelector('.card-btn');
                if (cardBtn) {
                    cardBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const category = card.dataset.category;
                        this.handleQuickAccess(category);
                    });
                }
            });
        } catch (error) {
            console.error('Error setting up quick access cards:', error);
        }
    }

    // Setup filter buttons
    setupFilterButtons() {
        try {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active state
                    document.querySelectorAll('.filter-btn').forEach(b => 
                        b.classList.remove('active')
                    );
                    btn.classList.add('active');
                    
                    // Apply filter
                    const filter = btn.dataset.filter;
                    this.applyFilter(filter);
                });
            });
        } catch (error) {
            console.error('Error setting up filter buttons:', error);
        }
    }

    // Setup resource cards
    setupResourceCards() {
        try {
            document.querySelectorAll('.resource-card').forEach(card => {
                card.addEventListener('click', () => {
                    const title = card.querySelector('.resource-title')?.textContent;
                    this.openResource(title, card);
                });
            });
        } catch (error) {
            console.error('Error setting up resource cards:', error);
        }
    }

    // Setup tool cards
    setupToolCards() {
        try {
            document.querySelectorAll('.tool-card').forEach(card => {
                card.addEventListener('click', () => {
                    const tool = card.dataset.tool;
                    this.startTool(tool);
                });
            });
        } catch (error) {
            console.error('Error setting up tool cards:', error);
        }
    }

    // Setup FAB events
    setupFABEvents() {
        try {
            const fabMain = document.getElementById('fabMain');
            const fabMenu = document.querySelector('.fab-menu');
            
            if (fabMain && fabMenu) {
                fabMain.addEventListener('click', () => {
                    fabMain.classList.toggle('active');
                    fabMenu.classList.toggle('show');
                });

                // FAB menu items
                document.querySelectorAll('.fab-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const action = item.dataset.action;
                        this.handleFABAction(action);
                        
                        // Close FAB menu
                        fabMain.classList.remove('active');
                        fabMenu.classList.remove('show');
                    });
                });
            }
        } catch (error) {
            console.error('Error setting up FAB events:', error);
        }
    }

    // Setup chat events
    setupChatEvents() {
        try {
            const chatToggle = document.getElementById('chatToggle');
            const chatWindow = document.getElementById('chatWindow');
            const chatClose = document.getElementById('chatClose');
            const chatSend = document.getElementById('chatSend');
            const chatInput = document.getElementById('chatInput');

            if (chatToggle && chatWindow) {
                chatToggle.addEventListener('click', () => {
                    chatWindow.classList.toggle('show');
                });
            }

            if (chatClose && chatWindow) {
                chatClose.addEventListener('click', () => {
                    chatWindow.classList.remove('show');
                });
            }

            if (chatSend) {
                chatSend.addEventListener('click', () => {
                    this.sendChatMessage();
                });
            }

            if (chatInput) {
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.sendChatMessage();
                    }
                });
            }

            // Quick response buttons
            document.querySelectorAll('.quick-response').forEach(btn => {
                btn.addEventListener('click', () => {
                    const response = btn.dataset.response;
                    this.handleQuickResponse(response);
                });
            });

        } catch (error) {
            console.error('Error setting up chat events:', error);
        }
    }

    // Setup tab events
    setupTabEvents() {
        try {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active state
                    document.querySelectorAll('.tab-btn').forEach(b => 
                        b.classList.remove('active')
                    );
                    btn.classList.add('active');
                    
                    // Show tab content
                    const tab = btn.dataset.tab;
                    this.showTabContent(tab);
                });
            });
        } catch (error) {
            console.error('Error setting up tab events:', error);
        }
    }

    // Toggle mobile navigation
    toggleMobileNav() {
        try {
            const navMenu = document.getElementById('navMenu');
            if (navMenu) {
                navMenu.classList.toggle('show');
            }
        } catch (error) {
            console.error('Error toggling mobile nav:', error);
        }
    }

    // Show emergency modal
    showEmergencyModal() {
        try {
            const modal = document.getElementById('emergencyModal');
            if (modal) {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        } catch (error) {
            console.error('Error showing emergency modal:', error);
        }
    }

    // Hide emergency modal
    hideEmergencyModal() {
        try {
            const modal = document.getElementById('emergencyModal');
            if (modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        } catch (error) {
            console.error('Error hiding emergency modal:', error);
        }
    }

    // Hide modal
    hideModal(modal) {
        try {
            if (modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        } catch (error) {
            console.error('Error hiding modal:', error);
        }
    }

    // Scroll to section
    scrollToSection(sectionId) {
        try {
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile nav if open
                const navMenu = document.getElementById('navMenu');
                if (navMenu) {
                    navMenu.classList.remove('show');
                }
            }
        } catch (error) {
            console.error('Error scrolling to section:', error);
        }
    }

    // Perform search
    performSearch() {
        try {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                const query = searchInput.value.trim();
                if (query) {
                    this.showLoading();
                    console.log('Searching for:', query);
                    
                    // Simulate search delay
                    setTimeout(() => {
                        this.hideLoading();
                        this.showSearchResults(query);
                        this.showToast(`Found resources for "${query}"`, 'success');
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error performing search:', error);
            this.hideLoading();
            this.showToast('Search failed', 'error');
        }
    }

    // Show search suggestions
    showSearchSuggestions(query) {
        try {
            const suggestions = document.getElementById('searchSuggestions');
            if (suggestions && query.length > 2) {
                const mockSuggestions = [
                    'Anxiety management',
                    'Stress relief techniques',
                    'Depression support',
                    'Sleep hygiene',
                    'Study stress'
                ].filter(s => s.toLowerCase().includes(query.toLowerCase()));

                if (mockSuggestions.length > 0) {
                    suggestions.innerHTML = mockSuggestions
                        .map(s => `<div class="suggestion-item">${s}</div>`)
                        .join('');
                    suggestions.style.display = 'block';
                } else {
                    suggestions.style.display = 'none';
                }
            } else if (suggestions) {
                suggestions.style.display = 'none';
            }
        } catch (error) {
            console.error('Error showing search suggestions:', error);
        }
    }

    // Submit mood
    submitMood(skip = false) {
        try {
            if (!this.currentMood && !skip) {
                this.showToast('Please select your mood first', 'warning');
                return;
            }

            const moodData = {
                mood: this.currentMood,
                factors: this.selectedFactors,
                timestamp: new Date().toISOString(),
                skipped: skip
            };

            console.log('Submitting mood:', moodData);

            // Hide mood details
            const moodDetails = document.getElementById('moodDetails');
            if (moodDetails) {
                moodDetails.style.display = 'none';
            }

            // Show feedback
            const moodFeedback = document.getElementById('moodFeedback');
            const moodResponse = document.getElementById('moodResponse');
            
            if (moodFeedback && moodResponse) {
                const response = this.generateMoodResponse(this.currentMood, this.selectedFactors);
                moodResponse.textContent = response;
                moodFeedback.style.display = 'block';
                moodFeedback.scrollIntoView({ behavior: 'smooth' });
            }

            // Reset selections
            this.currentMood = null;
            this.selectedFactors = [];
            document.querySelectorAll('.mood-option').forEach(opt => 
                opt.classList.remove('selected')
            );
            document.querySelectorAll('.factor-tag').forEach(tag => 
                tag.classList.remove('selected')
            );

            this.showToast('Mood recorded successfully', 'success');

        } catch (error) {
            console.error('Error submitting mood:', error);
            this.showToast('Error recording mood', 'error');
        }
    }

    // Generate mood response
    generateMoodResponse(mood, factors) {
        const responses = {
            excellent: "That's wonderful! Keep up the positive momentum.",
            good: "Great to hear you're doing well. Here are some resources to maintain your wellbeing.",
            okay: "Thank you for sharing. Here are some helpful resources for you.",
            'not-great': "I understand you're going through a tough time. You're not alone.",
            struggling: "I'm sorry you're struggling. Please know that help is available."
        };

        return responses[mood] || "Thank you for sharing your feelings with us.";
    }

    // Handle quick access
    handleQuickAccess(category) {
        try {
            switch (category) {
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
                    console.log('Unknown category:', category);
            }
        } catch (error) {
            console.error('Error handling quick access:', error);
        }
    }

    // Apply filter
    applyFilter(filter) {
        try {
            console.log('Applying filter:', filter);
            // Here you would filter resources based on the selected filter
            this.showToast(`Showing ${filter} resources`, 'info');
        } catch (error) {
            console.error('Error applying filter:', error);
        }
    }

    // Open resource
    openResource(title, card) {
        try {
            console.log('Opening resource:', title);
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
            this.showToast(`Opening: ${title}`, 'info');
        } catch (error) {
            console.error('Error opening resource:', error);
        }
    }

    // Start tool
    startTool(tool) {
        try {
            console.log('Starting tool:', tool);
            
            const toolMessages = {
                breathing: "Starting 5-minute breathing exercise...",
                meditation: "Starting 10-minute meditation...",
                journal: "Opening journal interface..."
            };

            this.showToast(toolMessages[tool] || `Starting ${tool} tool...`, 'info');
            
            // Here you would implement the actual tool functionality
            
        } catch (error) {
            console.error('Error starting tool:', error);
        }
    }

    // Handle FAB action
    handleFABAction(action) {
        try {
            switch (action) {
                case 'mood':
                    this.scrollToSection('tools');
                    break;
                case 'breathing':
                    this.startTool('breathing');
                    break;
                case 'chat':
                    const chatWindow = document.getElementById('chatWindow');
                    if (chatWindow) {
                        chatWindow.classList.add('show');
                    }
                    break;
                default:
                    console.log('Unknown FAB action:', action);
            }
        } catch (error) {
            console.error('Error handling FAB action:', error);
        }
    }

    // Send chat message
    sendChatMessage() {
        try {
            const chatInput = document.getElementById('chatInput');
            const chatMessages = document.getElementById('chatMessages');
            
            if (chatInput && chatMessages) {
                const message = chatInput.value.trim();
                if (message) {
                    // Add user message
                    this.addChatMessage(message, 'user');
                    chatInput.value = '';
                    
                    // Simulate bot response
                    setTimeout(() => {
                        const botResponse = this.generateBotResponse(message);
                        this.addChatMessage(botResponse, 'bot');
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error sending chat message:', error);
        }
    }

    // Add chat message
    addChatMessage(message, sender) {
        try {
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                const messageDiv = document.createElement('div');
                messageDiv.className = `chat-message ${sender}`;
                messageDiv.textContent = message;
                
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (error) {
            console.error('Error adding chat message:', error);
        }
    }

    // Generate bot response
    generateBotResponse(message) {
        const responses = {
            mood: "I'd be happy to help you check your mood. You can use our mood tracker in the tools section.",
            help: "I'm here to support you. What specific area would you like help with?",
            crisis: "If you're in crisis, please reach out to our emergency resources immediately.",
            counselor: "I can help you find a qualified counselor. Let me show you our professional directory.",
            default: "Thank you for reaching out. How can I support your mental health journey today?"
        };

        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('mood')) return responses.mood;
        if (lowerMessage.includes('help')) return responses.help;
        if (lowerMessage.includes('crisis') || lowerMessage.includes('emergency')) return responses.crisis;
        if (lowerMessage.includes('counselor') || lowerMessage.includes('therapist')) return responses.counselor;
        
        return responses.default;
    }

    // Handle quick response
    handleQuickResponse(response) {
        try {
            const responses = {
                mood: "Let me help you check your mood.",
                resources: "Here are some helpful resources for you.",
                counselor: "I can help you connect with a counselor."
            };

            const message = responses[response] || response;
            this.addChatMessage(message, 'bot');
        } catch (error) {
            console.error('Error handling quick response:', error);
        }
    }

    // Show tab content
    showTabContent(tab) {
        try {
            console.log('Showing tab content:', tab);
            // Here you would filter and show content based on the selected tab
            this.showToast(`Showing ${tab} content`, 'info');
        } catch (error) {
            console.error('Error showing tab content:', error);
        }
    }

    // Load more resources
    loadMoreResources() {
        try {
            this.showLoading();
            console.log('Loading more resources...');
            
            setTimeout(() => {
                this.hideLoading();
                this.showToast('More resources loaded', 'success');
            }, 1000);
        } catch (error) {
            console.error('Error loading more resources:', error);
            this.hideLoading();
        }
    }

    // Show search results
    showSearchResults(query) {
        try {
            console.log('Showing search results for:', query);
            // Here you would display the actual search results
        } catch (error) {
            console.error('Error showing search results:', error);
        }
    }

    // Load initial data
    loadInitialData() {
        try {
            console.log('Loading initial data...');
            // Here you would load resources, counselors, etc.
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    // Setup navigation
    setupNavigation() {
        try {
            // Update active nav link on scroll
            window.addEventListener('scroll', () => {
                this.updateActiveNavLink();
            });
        } catch (error) {
            console.error('Error setting up navigation:', error);
        }
    }

    // Update active nav link
    updateActiveNavLink() {
        try {
            const sections = ['home', 'tools', 'resources', 'counselors'];
            const navLinks = document.querySelectorAll('.nav-link');
            
            let current = 'home';
            
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 100 && rect.bottom >= 100) {
                        current = section;
                        break;
                    }
                }
            }

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        } catch (error) {
            console.error('Error updating active nav link:', error);
        }
    }

    // Setup modals
    setupModals() {
        try {
            // ESC key to close modals
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    document.querySelectorAll('.modal.show').forEach(modal => {
                        this.hideModal(modal);
                    });
                }
            });
        } catch (error) {
            console.error('Error setting up modals:', error);
        }
    }

    // Setup chat
    setupChat() {
        try {
            console.log('Setting up chat system...');
            // Initialize chat system
        } catch (error) {
            console.error('Error setting up chat:', error);
        }
    }

    // Setup FAB
    setupFAB() {
        try {
            console.log('Setting up floating action button...');
            // Initialize FAB
        } catch (error) {
            console.error('Error setting up FAB:', error);
        }
    }

    // Show loading
    showLoading() {
        try {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('show');
            }
        } catch (error) {
            console.error('Error showing loading:', error);
        }
    }

    // Hide loading
    hideLoading() {
        try {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('show');
            }
        } catch (error) {
            console.error('Error hiding loading:', error);
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        try {
            const toastContainer = document.getElementById('toastContainer');
            if (toastContainer) {
                const toast = document.createElement('div');
                toast.className = `toast ${type}`;
                toast.innerHTML = `
                    <div class="toast-content">
                        <strong>${this.getToastIcon(type)}</strong>
                        <span>${message}</span>
                    </div>
                `;

                toastContainer.appendChild(toast);

                // Show toast
                setTimeout(() => {
                    toast.classList.add('show');
                }, 100);

                // Hide and remove toast
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }, 3000);
            }
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    }

    // Get toast icon
    getToastIcon(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
}

// Initialize the platform
const mentalHealthPlatform = new MentalHealthPlatform();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MentalHealthPlatform;
}
