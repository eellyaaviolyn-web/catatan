const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_catatan'
};

let db;

// Initialize database connection
async function initDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
        
        // Create tables if not exist
        await createTables();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

// Create database tables
async function createTables() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            reset_token VARCHAR(255),
            reset_token_expiry DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            color VARCHAR(7) NOT NULL,
            user_id INT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        
        `CREATE TABLE IF NOT EXISTS notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            category_id INT,
            is_pinned BOOLEAN DEFAULT FALSE,
            is_favorite BOOLEAN DEFAULT FALSE,
            reminder DATETIME,
            view_count INT DEFAULT 0,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )`,
        
        `CREATE TABLE IF NOT EXISTS tags (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            usage_count INT DEFAULT 1,
            user_id INT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_tag_user (name, user_id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS note_tags (
            note_id INT,
            tag_id INT,
            PRIMARY KEY (note_id, tag_id),
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )`
    ];

    for (const table of tables) {
        await db.execute(table);
    }

    // Insert default categories
    await insertDefaultCategories();
}

// Insert default categories
async function insertDefaultCategories() {
    const defaultCategories = [
        { name: 'Pribadi', color: '#3b82f6' },
        { name: 'Pekerjaan', color: '#10b981' },
        { name: 'Belajar', color: '#f59e0b' },
        { name: 'Ide', color: '#8b5cf6' }
    ];

    for (const category of defaultCategories) {
        await db.execute(
            'INSERT IGNORE INTO categories (name, color, user_id) VALUES (?, ?, NULL)',
            [category.name, category.color]
        );
    }
}

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// === HEALTH CHECK ===
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// === AUTH ROUTES ===

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ 
            message: 'User registered successfully',
            userId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
        
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, email FROM users WHERE id = ?', [req.user.userId]);
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === NOTES ROUTES ===

// Get notes
app.get('/api/notes', authenticateToken, async (req, res) => {
    try {
        const { categoryId, tag } = req.query;
        let query = `
            SELECT n.*, c.name as category_name, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags
            FROM notes n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN note_tags nt ON n.id = nt.note_id
            LEFT JOIN tags t ON nt.tag_id = t.id
            WHERE n.user_id = ?
        `;
        const params = [req.user.userId];

        if (categoryId) {
            query += ' AND n.category_id = ?';
            params.push(categoryId);
        }

        if (tag) {
            query += ' AND t.name = ?';
            params.push(tag);
        }

        query += ' GROUP BY n.id ORDER BY n.is_pinned DESC, n.updated_at DESC';

        const [notes] = await db.execute(query, params);
        
        // Parse tags
        const formattedNotes = notes.map(note => ({
            ...note,
            tags: note.tags ? note.tags.split(',') : []
        }));

        res.json(formattedNotes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create note
app.post('/api/notes', authenticateToken, async (req, res) => {
    try {
        const { title, content, categoryId, tags, isPinned, isFavorite, reminder } = req.body;
        
        // Create note
        const [result] = await db.execute(
            'INSERT INTO notes (title, content, category_id, is_pinned, is_favorite, reminder, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, content, categoryId, isPinned || false, isFavorite || false, reminder, req.user.userId]
        );

        const noteId = result.insertId;

        // Handle tags
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                // Create or get tag
                await db.execute(
                    'INSERT INTO tags (name, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE usage_count = usage_count + 1',
                    [tagName.trim(), req.user.userId]
                );
                
                const [tagResult] = await db.execute(
                    'SELECT id FROM tags WHERE name = ? AND user_id = ?',
                    [tagName.trim(), req.user.userId]
                );
                
                // Link note to tag
                await db.execute(
                    'INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)',
                    [noteId, tagResult[0].id]
                );
            }
        }

        res.status(201).json({ id: noteId, message: 'Note created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update note
app.put('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        const noteId = req.params.id;
        const { title, content, categoryId, tags, isPinned, isFavorite, reminder } = req.body;
        
        // Update note
        await db.execute(
            'UPDATE notes SET title = ?, content = ?, category_id = ?, is_pinned = ?, is_favorite = ?, reminder = ? WHERE id = ? AND user_id = ?',
            [title, content, categoryId, isPinned, isFavorite, reminder, noteId, req.user.userId]
        );

        // Update tags
        await db.execute('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
        
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                await db.execute(
                    'INSERT INTO tags (name, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE usage_count = usage_count + 1',
                    [tagName.trim(), req.user.userId]
                );
                
                const [tagResult] = await db.execute(
                    'SELECT id FROM tags WHERE name = ? AND user_id = ?',
                    [tagName.trim(), req.user.userId]
                );
                
                await db.execute(
                    'INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)',
                    [noteId, tagResult[0].id]
                );
            }
        }

        res.json({ message: 'Note updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete note
app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
    try {
        await db.execute('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search notes
app.get('/api/notes/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        const [notes] = await db.execute(
            `SELECT n.*, c.name as category_name, c.color as category_color,
                    GROUP_CONCAT(t.name) as tags
             FROM notes n
             LEFT JOIN categories c ON n.category_id = c.id
             LEFT JOIN note_tags nt ON n.id = nt.note_id
             LEFT JOIN tags t ON nt.tag_id = t.id
             WHERE n.user_id = ? AND (n.title LIKE ? OR n.content LIKE ? OR t.name LIKE ?)
             GROUP BY n.id`,
            [req.user.userId, `%${q}%`, `%${q}%`, `%${q}%`]
        );
        
        const formattedNotes = notes.map(note => ({
            ...note,
            tags: note.tags ? note.tags.split(',') : []
        }));

        res.json(formattedNotes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === CATEGORIES ROUTES ===

// Get categories
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const [categories] = await db.execute(
            'SELECT * FROM categories WHERE user_id = ? OR user_id IS NULL ORDER BY name',
            [req.user.userId]
        );
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create category
app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const { name, color } = req.body;
        const [result] = await db.execute(
            'INSERT INTO categories (name, color, user_id) VALUES (?, ?, ?)',
            [name, color, req.user.userId]
        );
        res.status(201).json({ id: result.insertId, message: 'Category created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === TAGS ROUTES ===

// Get tags
app.get('/api/tags', authenticateToken, async (req, res) => {
    try {
        const [tags] = await db.execute(
            'SELECT * FROM tags WHERE user_id = ? ORDER BY usage_count DESC',
            [req.user.userId]
        );
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === DASHBOARD ROUTES ===

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_notes,
                SUM(is_favorite) as favorite_notes,
                SUM(is_pinned) as pinned_notes
            FROM notes WHERE user_id = ?
        `, [req.user.userId]);

        const [categories] = await db.execute(
            'SELECT COUNT(*) as total_categories FROM categories WHERE user_id = ?',
            [req.user.userId]
        );

        const [tags] = await db.execute(
            'SELECT COUNT(*) as total_tags FROM tags WHERE user_id = ?',
            [req.user.userId]
        );

        const today = new Date().toISOString().split('T')[0];
        const [reminders] = await db.execute(
            'SELECT COUNT(*) as reminders_today FROM notes WHERE user_id = ? AND DATE(reminder) = ?',
            [req.user.userId, today]
        );

        res.json({
            totalNotes: stats[0].total_notes,
            favoriteNotes: stats[0].favorite_notes,
            pinnedNotes: stats[0].pinned_notes,
            totalCategories: categories[0].total_categories,
            totalTags: tags[0].total_tags,
            remindersToday: reminders[0].reminders_today
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});