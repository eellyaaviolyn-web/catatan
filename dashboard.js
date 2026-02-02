// Dashboard JavaScript
let currentUser = null;
let currentNotes = [];
let currentCategories = [];
let currentTags = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    currentUser = db.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize dashboard
    initializeDashboard();
    loadDashboardData();
    setupEventListeners();
    updateCurrentDate();
    
    // Update date every minute
    setInterval(updateCurrentDate, 60000);
});

function initializeDashboard() {
    // Set user name
    document.getElementById('userName').textContent = currentUser.name;
    
    // Apply saved theme
    if (currentUser.settings && currentUser.settings.theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Load initial section
    showSection('dashboard');
    
    // Add search event listener directly
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(event) {
            const query = event.target.value.trim();
            console.log('Direct search:', query);
            
            if (query.length === 0) {
                displayNotes(currentNotes);
                return;
            }
            
            if (query.length >= 2) {
                try {
                    const searchResults = db.searchNotes(query, currentUser.id);
                    displayNotes(searchResults);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }
        });
    }
}

async function loadDashboardData() {
    await loadStatistics();
    await loadCategories();
    await loadAllNotes();
    // Note: Other load functions need to be implemented for async
    loadRecentNotes();
    loadPinnedNotes();
    loadPopularTags();
    loadTodayReminders();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Update active nav
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Search - with debounce
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', function(event) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            handleSearch(event);
        }, 300);
    });
    
    // Note form
    document.getElementById('noteForm').addEventListener('submit', handleNoteSave);
    
    // Sort and filter
    document.getElementById('sortBy').addEventListener('change', sortNotes);
    document.getElementById('filterCategory').addEventListener('change', filterNotes);
}

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', options);
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionName + 'Section').classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        notes: 'Semua Catatan',
        favorites: 'Catatan Favorit',
        categories: 'Kategori',
        tags: 'Tag',
        reminders: 'Pengingat'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
    
    // Clear search when switching sections
    if (sectionName !== 'notes') {
        document.getElementById('searchInput').value = '';
    }
    
    // Load section-specific data
    switch(sectionName) {
        case 'notes':
            loadAllNotes();
            break;
        case 'favorites':
            loadFavoriteNotes();
            break;
        case 'categories':
            loadCategoriesSection();
            break;
        case 'tags':
            loadTagsSection();
            break;
        case 'reminders':
            loadRemindersSection();
            break;
    }
}

async function loadStatistics() {
    try {
        const stats = await db.getDashboardStats();
        
        document.getElementById('totalNotes').textContent = stats.totalNotes || 0;
        document.getElementById('favoriteNotes').textContent = stats.favoriteNotes || 0;
        document.getElementById('totalCategories').textContent = stats.totalCategories || 0;
        document.getElementById('activeReminders').textContent = stats.remindersToday || 0;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function loadRecentNotes() {
    const recentNotes = db.getRecentNotes(currentUser.id, 5);
    const container = document.getElementById('recentNotes');
    
    if (recentNotes.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Belum ada catatan</p>';
        return;
    }
    
    container.innerHTML = recentNotes.map(note => `
        <div class="note-item" onclick="openNote(${note.id})">
            <h4>${truncateText(note.title, 30)}</h4>
            <p>${formatDate(note.updatedAt)}</p>
        </div>
    `).join('');
}

function loadPinnedNotes() {
    const pinnedNotes = db.getPinnedNotes(currentUser.id, 5);
    const container = document.getElementById('pinnedNotes');
    
    if (pinnedNotes.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Belum ada catatan dipin</p>';
        return;
    }
    
    container.innerHTML = pinnedNotes.map(note => `
        <div class="note-item" onclick="openNote(${note.id})">
            <h4>${truncateText(note.title, 30)}</h4>
            <p>${formatDate(note.updatedAt)}</p>
        </div>
    `).join('');
}

function loadPopularTags() {
    const popularTags = db.getPopularTags(currentUser.id, 10);
    const container = document.getElementById('popularTags');
    
    if (popularTags.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Belum ada tag</p>';
        return;
    }
    
    container.innerHTML = popularTags.map(tag => `
        <span class="tag" onclick="searchByTag('${tag.name}')">${tag.name} (${tag.count})</span>
    `).join('');
}

function loadTodayReminders() {
    const todayReminders = db.getTodayReminders(currentUser.id);
    const container = document.getElementById('todayReminders');
    
    if (todayReminders.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Tidak ada pengingat hari ini</p>';
        return;
    }
    
    container.innerHTML = todayReminders.map(note => `
        <div class="reminder-item" onclick="openNote(${note.id})">
            <h4>${truncateText(note.title, 30)}</h4>
            <p><i class="fas fa-clock"></i> ${formatTime(note.reminder)}</p>
        </div>
    `).join('');
}

async function loadCategories() {
    try {
        currentCategories = await db.getCategories();
        
        // Update category select in note form
        const categorySelect = document.getElementById('noteCategory');
        categorySelect.innerHTML = '<option value="">Pilih Kategori</option>' +
            currentCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        
        // Update filter select
        const filterSelect = document.getElementById('filterCategory');
        filterSelect.innerHTML = '<option value="">Semua Kategori</option>' +
            currentCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
        currentCategories = [];
    }
}

async function loadAllNotes() {
    try {
        currentNotes = await db.getNotes();
        console.log('Loaded notes:', currentNotes.length); // Debug log
        displayNotes(currentNotes);
    } catch (error) {
        console.error('Error loading notes:', error);
        currentNotes = [];
        displayNotes([]);
    }
}

function loadFavoriteNotes() {
    const favoriteNotes = db.getFavoriteNotes(currentUser.id);
    displayNotes(favoriteNotes, 'favoritesGrid');
}

function displayNotes(notes, containerId = 'notesGrid') {
    const container = document.getElementById(containerId);
    
    if (notes.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">Belum ada catatan</div>';
        return;
    }
    
    container.innerHTML = notes.map(note => {
        const category = currentCategories.find(cat => cat.id === note.category);
        const categoryName = category ? category.name : '';
        
        return `
            <div class="note-card ${note.isPinned ? 'pinned' : ''}" onclick="openNote(${note.id})">
                <h3>${note.title}</h3>
                <p>${truncateText(note.content, 150)}</p>
                <div class="note-meta">
                    <div>
                        ${categoryName ? `<span class="note-tag">${categoryName}</span>` : ''}
                        ${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}
                    </div>
                    <div>
                        ${note.isFavorite ? '<i class="fas fa-star" style="color: var(--warning-color);"></i>' : ''}
                        <small>${formatDate(note.updatedAt)}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function createNote() {
    document.getElementById('modalTitle').textContent = 'Buat Catatan Baru';
    document.getElementById('noteForm').reset();
    document.getElementById('noteId').value = '';
    document.getElementById('noteModal').classList.add('active');
    document.getElementById('noteTitle').focus();
}

function openNote(noteId) {
    const note = db.getNoteById(noteId);
    if (!note) return;
    
    // Increment view count
    db.incrementViewCount(noteId);
    
    // Fill form with note data
    document.getElementById('modalTitle').textContent = 'Edit Catatan';
    document.getElementById('noteId').value = note.id;
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteCategory').value = note.category || '';
    document.getElementById('noteTags').value = note.tags.join(', ');
    document.getElementById('noteReminder').value = note.reminder ? note.reminder.slice(0, 16) : '';
    document.getElementById('notePinned').checked = note.isPinned;
    
    document.getElementById('noteModal').classList.add('active');
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.remove('active');
}

async function handleNoteSave(event) {
    event.preventDefault();
    
    const noteId = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const categoryId = document.getElementById('noteCategory').value || null;
    const tagsInput = document.getElementById('noteTags').value.trim();
    const reminder = document.getElementById('noteReminder').value || null;
    const isPinned = document.getElementById('notePinned').checked;
    
    if (!title || !content) {
        alert('Judul dan isi catatan harus diisi!');
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const noteData = {
        title,
        content,
        categoryId: categoryId ? parseInt(categoryId) : null,
        tags,
        reminder,
        isPinned
    };
    
    try {
        if (noteId) {
            // Update existing note
            await db.updateNote(parseInt(noteId), noteData);
        } else {
            // Create new note
            await db.saveNote(noteData);
        }
        
        // Refresh data
        await loadDashboardData();
        closeNoteModal();
        
        // Show success message
        showToast('Catatan berhasil disimpan!', 'success');
    } catch (error) {
        console.error('Error saving note:', error);
        showToast('Gagal menyimpan catatan!', 'error');
    }
}

function deleteNote(noteId) {
    if (confirm('Yakin ingin menghapus catatan ini?')) {
        db.deleteNote(noteId);
        loadDashboardData();
        closeNoteModal();
        showToast('Catatan berhasil dihapus!', 'success');
    }
}

function toggleFavorite(noteId) {
    const note = db.getNoteById(noteId);
    if (note) {
        db.updateNote(noteId, { isFavorite: !note.isFavorite });
        loadDashboardData();
    }
}

function handleSearch(event) {
    const query = event.target.value.trim();
    console.log('Search query:', query); // Debug log
    
    if (query.length === 0) {
        displayNotes(currentNotes);
        return;
    }
    
    if (query.length < 2) return;
    
    try {
        const searchResults = db.searchNotes(query, currentUser.id);
        console.log('Search results:', searchResults); // Debug log
        displayNotes(searchResults);
    } catch (error) {
        console.error('Search error:', error);
        displayNotes([]);
    }
}

function searchByTag(tagName) {
    // Switch to notes section first
    showSection('notes');
    
    // Set search input value
    document.getElementById('searchInput').value = tagName;
    
    // Perform search
    try {
        const searchResults = db.searchNotes(tagName, currentUser.id);
        displayNotes(searchResults);
    } catch (error) {
        console.error('Tag search error:', error);
        displayNotes([]);
    }
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-section="notes"]').classList.add('active');
}

function sortNotes() {
    const sortBy = document.getElementById('sortBy').value;
    let sortedNotes = [...currentNotes];
    
    switch(sortBy) {
        case 'date':
            sortedNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            break;
        case 'title':
            sortedNotes.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'category':
            sortedNotes.sort((a, b) => {
                const catA = currentCategories.find(cat => cat.id === a.category);
                const catB = currentCategories.find(cat => cat.id === b.category);
                const nameA = catA ? catA.name : '';
                const nameB = catB ? catB.name : '';
                return nameA.localeCompare(nameB);
            });
            break;
    }
    
    displayNotes(sortedNotes);
}

function filterNotes() {
    const categoryId = document.getElementById('filterCategory').value;
    
    if (!categoryId) {
        displayNotes(currentNotes);
        return;
    }
    
    const filteredNotes = currentNotes.filter(note => note.category == categoryId);
    displayNotes(filteredNotes);
}

function createCategory() {
    const name = prompt('Nama kategori:');
    if (name && name.trim()) {
        const colors = ['#4f46e5', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        db.createCategory({ name: name.trim(), color });
        loadCategories();
        showToast('Kategori berhasil dibuat!', 'success');
    }
}

function createTag() {
    const name = prompt('Nama tag:');
    if (name && name.trim()) {
        db.createTag({ name: name.trim() });
        showToast('Tag berhasil dibuat!', 'success');
    }
}

function exportNotes() {
    const data = db.exportUserData(currentUser.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `catatan-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data berhasil diexport!', 'success');
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    
    // Update icon
    const icon = document.getElementById('themeToggle').querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    // Save preference
    db.updateUser(currentUser.id, {
        settings: { ...currentUser.settings, theme: newTheme }
    });
    currentUser.settings.theme = newTheme;
}

function logout() {
    if (confirm('Yakin ingin keluar?')) {
        db.logout();
        window.location.href = 'index.html';
    }
}

// Utility functions
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hari ini';
    if (diffDays === 2) return 'Kemarin';
    if (diffDays <= 7) return `${diffDays} hari lalu`;
    
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'}-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1001;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Handle modal clicks
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeNoteModal();
    }
});

// Handle escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeNoteModal();
    }
});

// Auto-save draft (optional feature)
let draftTimer;
function startDraftSaving() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        
        if (title || content) {
            localStorage.setItem('noteDraft', JSON.stringify({
                title,
                content,
                timestamp: new Date().toISOString()
            }));
        }
    }, 2000);
}

// Load draft on modal open
function loadDraft() {
    const draft = localStorage.getItem('noteDraft');
    if (draft) {
        const draftData = JSON.parse(draft);
        const draftAge = new Date() - new Date(draftData.timestamp);
        
        // Only load draft if it's less than 1 hour old
        if (draftAge < 3600000) {
            if (confirm('Ditemukan draft yang belum disimpan. Muat draft?')) {
                document.getElementById('noteTitle').value = draftData.title;
                document.getElementById('noteContent').value = draftData.content;
            }
        }
        localStorage.removeItem('noteDraft');
    }
}

// Add draft saving listeners
document.getElementById('noteTitle').addEventListener('input', startDraftSaving);
document.getElementById('noteContent').addEventListener('input', startDraftSaving);