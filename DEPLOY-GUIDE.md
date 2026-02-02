# Cara Deploy Web Catatan ke Internet

## 1. GitHub Pages (GRATIS)

### Langkah-langkah:
1. **Buat akun GitHub** di https://github.com
2. **Buat repository baru** dengan nama `web-catatan`
3. **Upload semua file** ke repository:
   - index.html
   - dashboard.html
   - styles.css
   - auth.js
   - dashboard.js
   - database.js
   - (file lainnya kecuali server.js, package.json, database.sql)

4. **Aktifkan GitHub Pages**:
   - Masuk ke Settings repository
   - Scroll ke bagian "Pages"
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
   - Save

5. **Akses website** di: `https://username.github.io/web-catatan`

### Catatan:
- Hanya menggunakan localStorage (tidak perlu server)
- Gratis selamanya
- SSL otomatis (HTTPS)

## 2. Netlify (GRATIS)

### Langkah-langkah:
1. **Buat akun** di https://netlify.com
2. **Drag & drop folder** "catatan v2" ke Netlify dashboard
3. **Website langsung online** dengan URL random
4. **Custom domain** bisa ditambahkan (opsional)

### Keuntungan:
- Deploy dalam 30 detik
- Auto-deploy dari GitHub
- Form handling gratis

## 3. Vercel (GRATIS)

### Langkah-langkah:
1. **Buat akun** di https://vercel.com
2. **Connect GitHub** repository
3. **Deploy otomatis** setiap kali push code
4. **Custom domain** gratis

## 4. Firebase Hosting (GRATIS)

### Langkah-langkah:
1. **Install Firebase CLI**: `npm install -g firebase-tools`
2. **Login**: `firebase login`
3. **Init project**: `firebase init hosting`
4. **Deploy**: `firebase deploy`

## 5. Hosting Berbayar

### Shared Hosting (Rp 10-50rb/bulan):
- Hostinger
- Niagahoster  
- DomainRacer
- Upload file via cPanel File Manager

### VPS (Rp 50-200rb/bulan):
- DigitalOcean
- Vultr
- Linode
- Install Nginx/Apache + Node.js untuk full-stack

## File yang Perlu Diupload (Frontend Only)

```
web-catatan/
├── index.html
├── dashboard.html
├── reset-password.html
├── otp-verification.html
├── styles.css
├── auth.js
├── dashboard.js
├── database.js
└── README.md
```

**JANGAN upload:**
- server.js
- package.json
- database.sql
- node_modules/

## Custom Domain (Opsional)

1. **Beli domain** di Namecheap, GoDaddy, dll
2. **Setting DNS** ke hosting provider
3. **Update CNAME/A record**

## Rekomendasi untuk Pemula

**GitHub Pages** - Paling mudah dan gratis selamanya!

1. Upload file ke GitHub
2. Aktifkan Pages
3. Website langsung online
4. URL: `https://username.github.io/web-catatan`

## Catatan Penting

- Website ini menggunakan **localStorage** jadi data tersimpan di browser user
- Tidak perlu database server untuk versi basic
- Untuk versi full dengan MySQL, perlu VPS/hosting yang support Node.js