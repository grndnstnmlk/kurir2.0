# 📦 Kurir 2.0 - Asisten Pintar Rute Kurir J&T Express

Aplikasi web mobile-first yang dirancang khusus untuk mempermudah kurir lapangan (Sprinter J&T) dalam mengantarkan paket secara efisien, mengurutkan rute stop-by-stop secara otomatis, mencatat uang setoran COD, serta menyimpan riwayat harian kerja.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi saat ini sudah aktif di komputer Anda:
* **Buka di Laptop/PC:** [http://localhost:5173/](http://localhost:5173/)
* **Buka di HP Android Anda (Satu Wi-Fi):** `http://192.168.1.13:5173/`

> **Tips di HP:** Buka link di atas lewat Chrome di HP Anda, klik titik tiga di kanan atas $\rightarrow$ pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)**. Aplikasi akan terpasang di layar HP seperti aplikasi Android biasa!

---

## 🌟 Fitur Lengkap Kurir 2.0

1. **📷 Scan Foto Resi Kamera (OCR Otomatis)**
   * Langsung ambil foto resi fisik paket J&T menggunakan kamera HP.
   * Sistem otomatis mendeteksi: Nomor Resi (`JP...` / `JX...`), Nama Penerima, Nomor WhatsApp, Alamat Lengkap, Patokan Rumah (*depan masjid, pagar hitam, dll.*), serta status COD & nominalnya.

2. **🏁 Optimasi Rute Stop-by-Stop (Anti Bolak-Balik)**
   * **Strategi 1 (Rekomendasi Kurir Pro): Titik Terjauh Mundur.** Mengantar ke alamat paling ujung terlebih dahulu saat tenaga masih segar dan beban motor penuh, lalu mengantar berurutan pulang mengarah ke Drop Point.
   * **Strategi 2: Terdekat Duluan.** Mengantar dari titik paling dekat dengan Drop Point.
   * **Strategi 3: Putar per Nama Jalan.** Mengelompokkan paket yang berada dalam satu jalan/gang yang sama agar diselesaikan sekaligus.

3. **🧭 Navigasi 1-Klik ke Google Maps**
   * Tombol **Maps** biru pada setiap paket yang langsung membuka navigasi belokan-demi-belokan Google Maps.
   * Tombol **Google Maps Rute** di atas untuk membuka seluruh urutan stop sekaligus.

4. **💬 Chat WhatsApp Otomatis ke Customer**
   * 1-klik tombol hijau untuk langsung chat customer dengan template konfirmasi keberadaan orang di rumah dan nominal uang pas COD.

5. **💰 Rekap Kasir COD & Kalkulator Pecahan Uang**
   * Menghitung total uang COD fisik yang wajib disetor ke kasir Drop Point sore hari.
   * Dilengkapi **Kalkulator Pecahan Lembaran Uang** (100rb, 50rb, 20rb, dst.) untuk memastikan uang di dompet Anda cocok 100% dengan rekap sistem (mencegah selisih/nombok).

6. **📅 Riwayat Harian Kurir (Fitur Baru!)**
   * **Tab Riwayat:** Menyimpan catatan pengantaran hari-hari sebelumnya.
   * **Arsipkan Hari Ini & Buka Hari Baru:** Sore hari setelah selesai kirim dan setor COD, klik tombol arsip untuk menyimpan catatan hari ini ke buku riwayat dan mengosongkan daftar paket agar siap untuk besok pagi.
   * **Pencarian Riwayat:** Cari resi lama, tanggal, atau nama customer kapan saja jika admin atau customer menanyakan paket kemarin.
   * **Salin Laporan WA:** Membuat teks rekapan tanggal tersebut untuk dikirim ke grup WhatsApp Drop Point.
   * **Buka ke Hari Aktif:** Bisa memulihkan kembali data hari tertentu jika ada paket yang perlu dicek ulang.

7. 💾 **Simpan Otomatis & Offline-Ready**
   * Semua data tersimpan di memori HP (`LocalStorage`). Jika sinyal di pelosok gang hilang, data paket dan riwayat tetap aman dan tidak hilang.

8. 🔐 **Panel Khusus Pemilik / Admin (Tersembunyi & Diproteksi Sandi)**
   * **Tautan Akses Langsung:** Buka URL aplikasi dengan akhiran `#admin`, misalnya:
     `https://grndnstnmlk.github.io/kurir2.0/#admin`
   * **Kata Sandi Standar:** `admin331` (bisa diganti kapan saja dari dalam panel).
   * **Fungsi:** Membuat kode aktivasi lisensi 30 hari (Rp 100.000), memantau daftar pengguna di database Supabase, dan membuat format pesan serah-terima kode untuk dikirim ke pembeli via WhatsApp.
   * **Keamanan:** Tombol panel ini disembunyikan sepenuhnya dari menu pengaturan kurir biasa agar aman dan eksklusif untuk Anda sebagai pemilik aplikasi.
