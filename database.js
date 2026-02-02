// Database Management untuk Web Catatan
// Hybrid: Localhost API dengan fallback ke localStorage

class Database {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
        this.useLocalStorage = false;
        this.checkServerConnection();
    }

    // Check if server is available
    async checkServerConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`, { 
                method: 'GET',
                timeout: 2000 
            });
            this.useLocalStorage = !response.ok;
        } catch (error) {
            console.log('Server not available, using localStorage');
            this.useLocalStorage = true;
            this.initializeLocalStorage();
        }
    }

    // Initialize localStorage (fallback)
    initializeLocalStorage() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        if (!localStorage.getItem('notes')) {
            localStorage.setItem('notes', JSON.stringify([]));
        }
        if (!localStorage.getItem('categories')) {
            localStorage.setItem('categories', JSON.stringify(this.getDefaultCategories()));
        }
        if (!localStorage.getItem('tags')) {
            localStorage.setItem('tags', JSON.stringify([]));
        }
    }

    // Default categories
    getDefaultCategories() {
        return [
            { id: 1, name: 'Pribadi', color: '#3b82f6', userId: null },
            { id: 2, name: 'Pekerjaan', color: '#10b981', userId: null },
            { id: 3, name: 'Belajar', color: '#f59e0b', userId: null },
            { id: 4, name: 'Ide', color: '#8b5cf6', userId: null }
        ];
    }

    // Generate ID
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Helper untuk API request
    async apiRequest(endpoint, options = {}) {
        if (this.useLocalStorage) {
            // Fallback ke localStorage jika server tidak tersedia
            return this.handleLocalStorageRequest(endpoint, options);
        }

        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Request failed, switching to localStorage:', error);
            this.useLocalStorage = true;
            this.initializeLocalStorage();
            return this.handleLocalStorageRequest(endpoint, options);
        }
    }

    // Handle localStorage operations
    handleLocalStorageRequest(endpoint, options) {
        const method = options.method || 'GET';
        const body = options.body;

        // Route to appropriate localStorage method
        if (endpoint === '/auth/register') {
            return this.localRegister(body);
        } else if (endpoint === '/auth/login') {
            return this.localLogin(body);
        } else if (endpoint === '/notes') {
            if (method === 'GET') return this.localGetNotes();
            if (method === 'POST') return this.localSaveNote(body);
        } else if (endpoint.startsWith('/notes/') && method === 'PUT') {
            const noteId = endpoint.split('/')[2];
            return this.localUpdateNote(noteId, body);
        } else if (endpoint.startsWith('/notes/') && method === 'DELETE') {
            const noteId = endpoint.split('/')[2];
            return this.localDeleteNote(noteId);
        } else if (endpoint === '/categories') {
            if (method === 'GET') return this.localGetCategories();
            if (method === 'POST') return this.localSaveCategory(body);
        } else if (endpoint === '/dashboard/stats') {
            return this.localGetDashboardStats();
        }
        
        return Promise.resolve({ message: 'Operation completed' });
    }

    // LocalStorage methods
    localRegister(userData) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const existing = users.find(u => u.email === userData.email);
        if (existing) {
            throw new Error('Email already registered');
        }
        
        const newUser = {
            id: this.generateId(),
            name: userData.name,
            email: userData.email,
            password: userData.password,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return Promise.resolve({ message: 'User registered successfully', userId: newUser.id });
    }

    localLogin(credentials) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        
        const token = 'local-token-' + user.id;
        return Promise.resolve({
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    }

    localGetNotes() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return Promise.resolve([]);
        
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const userNotes = notes.filter(note => note.userId === currentUser.id);
        return Promise.resolve(userNotes);
    }

    localSaveNote(noteData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) throw new Error('User not logged in');
        
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const newNote = {
            id: this.generateId(),
            title: noteData.title,
            content: noteData.content,
            categoryId: noteData.categoryId,
            tags: noteData.tags || [],
            isPinned: noteData.isPinned || false,
            isFavorite: noteData.isFavorite || false,
            reminder: noteData.reminder || null,
            userId: currentUser.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            viewCount: 0
        };
        notes.push(newNote);
        localStorage.setItem('notes', JSON.stringify(notes));
        return Promise.resolve({ id: newNote.id, message: 'Note created successfully' });
    }

    localUpdateNote(noteId, updateData) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const noteIndex = notes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = { 
                ...notes[noteIndex], 
                ...updateData, 
                updatedAt: new Date().toISOString() 
            };
            localStorage.setItem('notes', JSON.stringify(notes));
        }
        return Promise.resolve({ message: 'Note updated successfully' });
    }

    localDeleteNote(noteId) {
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const filteredNotes = notes.filter(note => note.id !== noteId);
        localStorage.setItem('notes', JSON.stringify(filteredNotes));
        return Promise.resolve({ message: 'Note deleted successfully' });
    }

    localGetCategories() {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        return Promise.resolve(categories);
    }

    localSaveCategory(categoryData) {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const newCategory = {
            id: this.generateId(),
            name: categoryData.name,
            color: categoryData.color,
            userId: this.getCurrentUser()?.id
        };
        categories.push(newCategory);
        localStorage.setItem('categories', JSON.stringify(categories));
        return Promise.resolve({ id: newCategory.id, message: 'Category created successfully' });
    }

    localGetDashboardStats() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return Promise.resolve({});
        
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');
        const userNotes = notes.filter(note => note.userId === currentUser.id);
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        
        return Promise.resolve({
            totalNotes: userNotes.length,
            favoriteNotes: userNotes.filter(note => note.isFavorite).length,
            pinnedNotes: userNotes.filter(note => note.isPinned).length,
            totalCategories: categories.length,
            totalTags: 0,
            remindersToday: 0
        });
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // === USER OPERATIONS ===
    
    // Register user
    async registerUser(userData) {
        return await this.apiRequest('/auth/register', {
            method: 'POST',
            body: userData
        });
    }

    // Login user
    async loginUser(credentials) {
        const response = await this.apiRequest('/auth/login', {
            method: 'POST',
            body: credentials
        });
        if (response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    // Get user profile
    async getUserProfile() {
        return await this.apiRequest('/auth/profile');
    }

    // Update user
    async updateUser(updateData) {
        return await this.apiRequest('/auth/profile', {
            method: 'PUT',
            body: updateData
        });
    }

    // Reset password
    async resetPassword(email) {
        return await this.apiRequest('/auth/reset-password', {
            method: 'POST',
            body: { email }
        });
    }

    // === SESSION MANAGEMENT ===
    
    // Set current user session
    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Get current user
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    // Clear session
    clearSession() {
        localStorage.removeItem('currentUser');
        this.clearToken();
    }

    // Logout
    async logout() {
        try {
            await this.apiRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
        }
    }

    // === NOTES OPERATIONS ===
    
    // Get all notes
    async getNotes(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.apiRequest(`/notes${queryString ? '?' + queryString : ''}`);
    }

    // Get single note
    async getNote(noteId) {
        return await this.apiRequest(`/notes/${noteId}`);
    }

    // Create new note
    async saveNote(noteData) {
        return await this.apiRequest('/notes', {
            method: 'POST',
            body: noteData
        });
    }

    // Update note
    async updateNote(noteId, updateData) {
        return await this.apiRequest(`/notes/${noteId}`, {
            method: 'PUT',
            body: updateData
        });
    }

    // Delete note
    async deleteNote(noteId) {
        return await this.apiRequest(`/notes/${noteId}`, {
            method: 'DELETE'
        });
    }

    // Increment view count
    async incrementViewCount(noteId) {
        return await this.apiRequest(`/notes/${noteId}/view`, {
            method: 'POST'
        });
    }

    // === CATEGORIES OPERATIONS ===
    
    // Get categories
    async getCategories() {
        return await this.apiRequest('/categories');
    }

    // Create category
    async saveCategory(categoryData) {
        return await this.apiRequest('/categories', {
            method: 'POST',
            body: categoryData
        });
    }

    // Update category
    async updateCategory(categoryId, updateData) {
        return await this.apiRequest(`/categories/${categoryId}`, {
            method: 'PUT',
            body: updateData
        });
    }

    // Delete category
    async deleteCategory(categoryId) {
        return await this.apiRequest(`/categories/${categoryId}`, {
            method: 'DELETE'
        });
    }

    // === TAGS OPERATIONS ===
    
    // Get tags
    async getTags() {
        return await this.apiRequest('/tags');
    }

    // Create tag
    async saveTag(tagData) {
        return await this.apiRequest('/tags', {
            method: 'POST',
            body: tagData
        });
    }

    // Update tag usage
    async updateTagUsage(tagName) {
        return await this.apiRequest(`/tags/${encodeURIComponent(tagName)}/usage`, {
            method: 'POST'
        });
    }

    // === SEARCH & FILTER ===
    
    // Search notes
    async searchNotes(query) {
        return await this.apiRequest(`/notes/search?q=${encodeURIComponent(query)}`);
    }

    // Filter notes by category
    async filterNotesByCategory(categoryId) {
        return await this.apiRequest(`/notes?categoryId=${categoryId}`);
    }

    // Filter notes by tag
    async filterNotesByTag(tagName) {
        return await this.apiRequest(`/notes?tag=${encodeURIComponent(tagName)}`);
    }

    // === STATISTICS ===
    
    // Get dashboard statistics
    async getDashboardStats() {
        return await this.apiRequest('/dashboard/stats');
    }

    // === EXPORT/IMPORT ===
    
    // Export user data
    async exportUserData() {
        return await this.apiRequest('/export');
    }

    // === BACKWARD COMPATIBILITY ===
    
    // Methods untuk kompatibilitas dengan kode lama
    async getUserByEmail(email) {
        // Tidak digunakan di client-side, hanya untuk kompatibilitas
        return null;
    }
    
    // Clear all data (untuk testing)
    async clearAllData() {
        try {
            await this.apiRequest('/admin/clear', { method: 'DELETE' });
        } catch (error) {
            console.error('Clear data error:', error);
        }
    }
}

// Initialize database
const db = new Database();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Database;
}