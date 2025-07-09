
# Visitor Management System (VMS) Backend

API berbasis Node.js + Express + Prisma + MySQL untuk Sistem Manajemen Pengunjung dengan Pengenalan Wajah.

## Tech Stack
- **Node.js** + **Express** (REST API)
- **Prisma ORM**
- **MySQL**
- **JWT Authentication** (multi-role)
- **AWS EC2** (deploy)

## Fitur
- ✅ CRUD Users: Operasi buat, baca, perbarui, dan hapus untuk pengguna.

- ✅ CRUD Devices: Operasi buat, baca, perbarui, dan hapus untuk perangkat.

- ✅ CRUD Visitors: Operasi buat, baca, perbarui, dan hapus untuk pengunjung.

- ✅ Attendance Data Upload Endpoint: Endpoint untuk mengunggah data kehadiran.

- ✅ Get Person List & Person Info Endpoint: Endpoint mock untuk perangkat Face Recognition.

- ✅ Clean error handler & middleware structure: Penanganan error dan struktur middleware yang bersih.

## Installation

### 1. Clone repository
```bash
git clone https://github.com/Aplikasi-VMS/backend-aplikasi-vms.git
cd backend-aplikasi-vms
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Setup environment variables
Buat file .env di root proyek dan tambahkan variabel berikut:
```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your_secret"
PORT=5000
JWT_EXPIRES_IN='1h'
```
- DATABASE_URL: Ganti dengan kredensial database MySQL Anda.

- JWT_SECRET: Ganti dengan string rahasia yang kuat untuk penandatanganan JWT.

- PORT: Port di mana server akan berjalan (default: 5000).

- JWT_EXPIRES_IN: Lama token JWT kadaluarsa.

### 4.  Prisma migrate
Jika database Anda masih kosong (fresh DB):
```bash
npx prisma migrate deploy
```
Atau jika Anda dalam pengembangan lokal:
```bash
npx prisma migrate dev
```

### 5.   Run server
Jika database Anda masih kosong (fresh DB):
```bash
npm start
```
Server akan berjalan di http://localhost:PORT.

## 🗄️ Database Design

Berikut adalah desain database untuk proyek ini:

![ERD](./docs/vms_erd.png)

- **users**: data user aplikasi beserta role
- **devices**: data perangkat Face Recognition
- **visitors**: data pengunjung
- **attendances**: log kehadiran pengunjung

# API Documentation

## 🔑 Auth

| Method | Endpoint          | Description |
| ------ | ----------------- | ----------- |
| POST   | /api/auth/login   | Login user  |

---

## 👤 Users

| Method | Endpoint        | Description   |
| ------ | --------------- | ------------- |
| GET    | /api/users      | Get all users |
| POST   | /api/users      | Create user   |
| PUT    | /api/users/:id  | Update user   |
| DELETE | /api/users/:id  | Delete user   |

---

## 💻 Devices

| Method | Endpoint          | Description     |
| ------ | ----------------- | --------------- |
| GET    | /api/devices      | Get all devices |
| POST   | /api/devices      | Create device   |
| PUT    | /api/devices/:id  | Update device   |
| DELETE | /api/devices/:id  | Delete device   |

---

## 🧑‍💼 Visitors

| Method | Endpoint           | Description      |
| ------ | ------------------ | ---------------- |
| GET    | /api/visitors      | Get all visitors |
| POST   | /api/visitors      | Create visitor   |
| PUT    | /api/visitors/:id  | Update visitor   |
| DELETE | /api/visitors/:id  | Delete visitor   |

---

## 📸 Face Recognition Endpoints

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| POST   | /api/visitors/getPersonList   | Get person list (for FR device)|
| POST   | /api/visitors/getPersonInfo   | Get person info (for FR device)|
| POST   | /api/attendances/dataUpload   | Upload attendance data from device |

## Authentication

Menggunakan token JWT.
Mendukung multi-peran: **SUPERUSER**, **ADMIN**, **RECEPTIONIST**.
Sertakan token di header permintaan:



---

## Deployment

Telah diuji pada **AWS EC2 (Ubuntu)** dengan **pm2**.

---

## Scripts

| Command                 | Description         |
| ----------------------- | ------------------- |
| `npm start`             | Start server        |
| `npm run dev`           | Start with nodemon  |
| `npx prisma migrate dev` | Run migrations      |

---


## Logging

Proyek ini menggunakan **Winston + Morgan** untuk logging yang komprehensif.

### Fitur Logging
- Menangkap **semua HTTP request** dengan method, url, status code, dan response time.
- Menangkap **error secara detail**, termasuk:
  - Nama error
  - Pesan error
  - Stack trace
  - Context request (method, url, body)
- Menampilkan log ke **console** dengan warna sesuai level (info/error).
- Menyimpan log ke file:
  - `logs/combined.log`: semua log level info ke atas.
  - `logs/error.log`: khusus error.

### Contoh Output Logging
```bash
[info]: POST /api/auth/login 200 150 - 45.678 ms
[error]: Unhandled error occurred {
"error": {
"name": "PrismaClientInitializationError",
"message": "Can't reach database server at localhost:3306."
},
"request": {
"method": "POST",
"url": "/api/auth/login"
},
"severity": "ERROR",
"timestamp": "2025-07-09 06:07:16"
}
```


### Notes
- **Password di request body otomatis direda k** untuk keamanan.
- Logging error juga menangkap **uncaughtException** agar error runtime tidak tersembunyi.

---



## Contributing

Kontribusi sangat kami harapkan!
Untuk perubahan besar, silakan buka issue terlebih dahulu untuk mendiskusikan apa yang ingin Anda ubah.

---

## Contact

Untuk pertanyaan lebih lanjut, silakan hubungi: **ibnutopanit05@gmail.com**
