# Simple Quick Attendance & Package Tracker

Aplikasi modern, cepat, dan intuitif untuk pencatatan absensi harian karyawan tanpa ketik manual, kalkulasi jam lembur otomatis, serta rekapitulasi paket ekspedisi harian toko.

---

## 🚀 Fitur Utama & Keunggulan

1. **Pencatatan Presensi Cepat (Zero-Typing)**
   - Cukup sentuh / klik tombol status shift tanpa perlu mengetik manual.
   - Tombol **"Set Semua Hadir Normal"** (1 klik untuk menandai semua karyawan aktif hadir normal).
   - Filter pencarian cepat untuk toko dengan banyak staf.

2. **Kategori Shift & Jam Masuk Sesuai Aturan Bisnis**
   - **Normal:** 08.30 – 16.30 (Jam kerja penuh: 8 Jam)
   - **Masuk Jam 10:** 10.00 – 16.30 (6.5 Jam)
   - **Masuk Siang (Bada Dzuhur):** 13.00 – 16.30 (3.5 Jam)
   - **Setengah Hari (½ Hari):** 08.30 – 12.30 (4 Jam)
   - **Tidak Masuk / Absen:** Pilihan sub-alasan cepat (Izin, Sakit, Alpa)

3. **Aturan Hari Kerja & Hari Libur**
   - **6 Hari Kerja (Senin – Sabtu):** Hari kerja normal toko.
   - **Hari Minggu:** Otomatis diset sebagai **Libur / Off**. Jika ada jadwal masuk lembur khusus hari Minggu, tetap bisa diaktifkan dengan mudah.

4. **Kalkulasi Jam Lembur Otomatis**
   - Jam operasional reguler berakhir tepat pukul **16.30**.
   - Cukup centang sakelar **"Lembur"**, lalu pilih jam pulang:
     - Preset instan: `17.30 (+1j)`, `18.00 (+1.5j)`, `18.30 (+2j)`, `19.00 (+2.5j)`, `19.30 (+3j)`, `20.00 (+3.5j)`, `20.30 (+4j)`, `21.00 (+4.5j)`, `21.30 (+5j)`, `22.00 (+5.5j)` atau ketik jam kustom.
   - **Rumus Lembur:**
     $$\text{Jam Selesai Lembur} - 16.30 = \text{Total Durasi Lembur (Jam)}$$

5. **Pelacak Paket Harian (Package Tracker)**
   - Tombol stepper cepat: `+1`, `-1`, `+5`, `+10`, `+50`, dan tombol reset cepat.
   - Memonitor total paket terkirim harian dan performa staf pengirim.

6. **Laporan & Rekapitulasi Lengkap**
   - Filter periode: **Hari Ini**, **Minggu Ini (Senin – Sabtu)**, **Bulan Ini**, atau **Rentang Kustom**.
   - Tabel ringkasan per karyawan (Total Hadir, Masuk Jam 10, Masuk Siang, 1/2 Hari, Jam Lembur, Total Paket, Sakit, Izin, Alpa).
   - Rincian log harian per tanggal dan nama.
   - **Download Excel / CSV** dengan 1 klik.
   - **Cetak Laporan / Simpan PDF** rapi siap print.
   - **Salin Ringkasan Format WhatsApp**: Format pesan tersusun rapi dengan emoji dan bullet points siap kirim ke grup WA toko atau Owner.

7. **Master Data 10 Karyawan Bawaan**
   - Lala
   - Atun
   - Indah
   - Pia
   - Fitri
   - Ikmah
   - Fani
   - Candra
   - Atar
   - Imam
   - Dilengkapi menu tambah, edit nama, dan hapus karyawan jika ada pergantian staf.

8. **Penyimpanan Lokal & Backup**
   - Tersimpan otomatis di peramban (Local Storage).
   - Fitur **Download Backup JSON** dan **Restore Data** untuk memindahkan data ke perangkat lain dengan aman.

---

## 💻 Cara Menjalankan

Aplikasi ini dapat dibuka dengan dua cara:

### Cara 1: Langsung Buka File HTML (Tanpa Server)
Cukup klik dua kali file `index.html` pada File Explorer untuk membukanya di browser Google Chrome / Microsoft Edge / Firefox.

### Cara 2: Menjalankan Local Web Server
Buka terminal / PowerShell di folder ini lalu jalankan:
```bash
node server.cjs
```
Lalu buka browser di alamat:
```
http://127.0.0.1:3000/
```
