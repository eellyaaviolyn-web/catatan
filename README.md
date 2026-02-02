# Web Catatan - Aplikasi Manajemen Catatan

Aplikasi web catatan yang lengkap dengan fitur autentikasi, manajemen catatan, kategori, tag, dan pengingat.

## Fitur Utama

### 🔐 Autentikasi
- **Login & Register**: Sistem autentikasi lengkap
- **Lupa Password**: Reset password via email menggunakan Formspree
- **Session Management**: Otomatis redirect berdasarkan status login

### 📝 Manajemen Catatan
- **CRUD Catatan**: Buat, baca, edit, dan hapus catatan
- **Rich Text**: Editor teks yang mudah digunakan
- **Pin Catatan**: Sematkan catatan penting di atas
- **Favorit**: Tandai catatan sebagai favorit
- **Pencarian**: Cari catatan berdasarkan judul, isi, atau tag
- **Kategori**: Organisir catatan dengan kategori
- **Tag**: Sistem tagging untuk pengelompokan fleksibel

### 🎯 Dashboard
- **Statistik**: Ringkasan total catatan, favorit, kategori, dan pengingat
- **Catatan Terbaru**: Daftar catatan yang baru diedit
- **Catatan Dipin**: Catatan yang disematkan
- **Tag Populer**: Tag yang paling sering digunakan
- **Pengingat Hari Ini**: Pengingat yang jatuh tempo hari ini
- **Aksi Cepat**: Tombol untuk membuat catatan, kategori, dan tag baru

### ⏰ Pengingat
- **Deadline**: Set pengingat untuk catatan
- **Notifikasi**: Tampilkan pengingat yang aktif
- **Filter Tanggal**: Lihat pengingat berdasarkan tanggal

### 🎨 Antarmuka
- **Responsive Design**: Tampilan optimal di desktop dan mobile
- **Dark/Light Mode**: Toggle tema gelap dan terang
- **Professional UI**: Desain modern dan user-friendly
- **Smooth Animations**: Transisi yang halus dan menarik

### 📊 Fitur Tambahan
- **Export Data**: Backup catatan dalam format JSON
- **Sort & Filter**: Urutkan dan filter catatan
- **View Counter**: Hitung berapa kali catatan dibuka
- **Auto-save Draft**: Simpan draft otomatis saat mengetik

## Struktur File

```
catatan v2/
├── index.html          # Halaman login/register
├── dashboard.html      # Dashboard utama
├── reset-password.html # Halaman reset password
├── styles.css          # Styling CSS
├── auth.js            # JavaScript autentikasi
├── dashboard.js       # JavaScript dashboard
├── database.js        # Database management (localStorage)
└── README.md          # Dokumentasi
```

## Cara Penggunaan

### 1. Setup
1. Download semua file ke folder yang sama
2. Buka `index.html` di browser
3. Tidak perlu server khusus, bisa langsung dibuka di browser

### 2. Registrasi
1. Klik "Belum punya akun? Daftar"
2. Isi nama, email, dan password
3. Klik "Daftar"
4. Setelah berhasil, akan diarahkan ke form login

### 3. Login
1. Masukkan email dan password
2. Klik "Masuk"
3. Akan diarahkan ke dashboard

### 4. Lupa Password
1. Klik "Lupa Password?" di halaman login
2. Masukkan email yang terdaftar
3. Cek email untuk mendapatkan password sementara atau link reset
4. Gunakan password sementara atau klik link untuk membuat password baru

### 5. Menggunakan Dashboard
- **Buat Catatan**: Klik tombol "Buat Catatan" atau tombol "+" di aksi cepat
- **Edit Catatan**: Klik pada catatan yang ingin diedit
- **Cari Catatan**: Gunakan kotak pencarian di header
- **Filter**: Gunakan dropdown filter kategori
- **Sort**: Urutkan berdasarkan tanggal, judul, atau kategori

### 6. Manajemen Kategori & Tag
- **Buat Kategori**: Klik "Kategori Baru" di aksi cepat
- **Buat Tag**: Klik "Tag Baru" di aksi cepat
- **Gunakan Tag**: Pisahkan dengan koma saat membuat catatan

### 7. Pengingat
- Set tanggal dan waktu pengingat saat membuat/edit catatan
- Lihat pengingat hari ini di dashboard
- Akses semua pengingat melalui menu "Pengingat"

## Konfigurasi Email (Formspree)

Aplikasi menggunakan Formspree untuk fitur lupa password:
- **Endpoint**: `https://formspree.io/f/mpqdjgqa`
- Email akan dikirim otomatis saat user meminta reset password
- Berisi password sementara dan link reset password

## Database

Aplikasi menggunakan localStorage browser sebagai database:
- **users**: Data pengguna
- **notes**: Data catatan
- **categories**: Data kategori
- **tags**: Data tag
- **currentUser**: Session pengguna aktif

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Fitur Keamanan

- Password disimpan dalam localStorage (untuk demo)
- Session management
- Token-based password reset
- Input validation
- XSS protection

## Customization

### Mengubah Tema
Edit variabel CSS di `styles.css`:
```css
:root {
    --primary-color: #4f46e5;  /* Warna utama */
    --success-color: #10b981;  /* Warna sukses */
    /* ... */
}
```

### Menambah Kategori Default
Edit array di `database.js`:
```javascript
{ id: 5, name: 'Kategori Baru', color: '#8b5cf6', userId: null }
```

## Troubleshooting

### Catatan Tidak Tersimpan
- Pastikan localStorage tidak penuh
- Cek console browser untuk error
- Refresh halaman dan coba lagi

### Email Reset Tidak Terkirim
- Cek koneksi internet
- Pastikan endpoint Formspree aktif
- Cek spam folder email

### Tampilan Tidak Responsive
- Clear cache browser
- Pastikan semua file CSS termuat
- Cek console untuk error

## Development

Untuk pengembangan lebih lanjut:
1. Ganti localStorage dengan database real (MySQL, PostgreSQL)
2. Implementasi backend API (Node.js, PHP, Python)
3. Tambah enkripsi password (bcrypt)
4. Implementasi real-time sync
5. Tambah fitur kolaborasi
6. Integrasikan dengan cloud storage

## License

Free to use for personal and commercial projects.

## Support

Untuk bantuan atau pertanyaan, silakan buat issue atau hubungi developer.

---

**Web Catatan** - Kelola catatan Anda dengan mudah dan profesional! 📝✨