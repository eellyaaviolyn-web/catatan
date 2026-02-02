# Setup Database Localhost - Web Catatan

## Prerequisites

1. **XAMPP/WAMP/MAMP** - untuk MySQL server
2. **Node.js** - untuk backend server
3. **Browser** - untuk frontend

## Setup Steps

### 1. Setup MySQL Database

1. **Start XAMPP/WAMP**
   - Jalankan Apache dan MySQL

2. **Buat Database**
   - Buka phpMyAdmin (http://localhost/phpmyadmin)
   - Import file `database.sql` atau jalankan script SQL di dalamnya
   - Database `web_catatan` akan terbuat otomatis

### 2. Setup Backend Server

1. **Install Dependencies**
   ```bash
   cd "catatan v2"
   npm install
   ```

2. **Konfigurasi Database** (opsional)
   - Edit `server.js` line 11-16 jika perlu:
   ```javascript
   const dbConfig = {
       host: 'localhost',
       user: 'root',        // sesuaikan username MySQL
       password: '',        // sesuaikan password MySQL
       database: 'web_catatan'
   };
   ```

3. **Jalankan Server**
   ```bash
   npm start
   ```
   atau untuk development:
   ```bash
   npm run dev
   ```

   Server akan berjalan di: http://localhost:3000

### 3. Setup Frontend

1. **Buka Aplikasi**
   - Double-click `index.html`
   - Atau buka di browser: `file:///path/to/catatan v2/index.html`

2. **Test Koneksi**
   - Coba register user baru
   - Login dengan user yang dibuat
   - Buat catatan untuk test database

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `GET /api/notes/search?q=query` - Search notes

### Categories
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category

### Tags
- `GET /api/tags` - Get tags

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

## Troubleshooting

### Database Connection Error
- Pastikan MySQL running di XAMPP/WAMP
- Cek username/password di `server.js`
- Pastikan database `web_catatan` sudah dibuat

### CORS Error
- Pastikan server backend running di port 3000
- Cek browser console untuk error details

### Frontend Not Loading Data
- Buka Developer Tools (F12)
- Cek Network tab untuk failed requests
- Pastikan API endpoints accessible

## File Structure

```
catatan v2/
├── index.html          # Frontend login page
├── dashboard.html      # Frontend dashboard
├── styles.css          # CSS styling
├── auth.js            # Frontend auth logic
├── dashboard.js       # Frontend dashboard logic
├── database.js        # Database API client
├── server.js          # Backend Node.js server
├── package.json       # Node.js dependencies
├── database.sql       # MySQL database schema
└── README-SETUP.md    # Setup instructions
```

## Default Login

Setelah setup, register user baru atau gunakan:
- Tidak ada default user, harus register dulu

## Production Notes

Untuk production:
1. Ganti `JWT_SECRET` di server.js
2. Setup proper MySQL user (bukan root)
3. Enable HTTPS
4. Setup environment variables
5. Use process manager (PM2)

---

**Database berhasil diubah ke localhost!** 🎉