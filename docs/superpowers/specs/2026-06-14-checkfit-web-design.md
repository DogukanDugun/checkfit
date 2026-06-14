# CheckFit Web App — Tasarım Dokümanı

**Tarih:** 2026-06-14  
**Durum:** Onaylandı

---

## 1. Genel Bakış

CheckFit, kuvvet sporcuları için tasarlanmış kişisel antrenman takip uygulamasının web versiyonudur. Android app ile aynı özelliklere sahiptir: gün tipi/varyasyon rotasyonu, set loglama, progressive overload takibi, quick tag'ler ve egzersiz geçmişi.

**Hedef kullanıcı:** Herkes kayıt olabilir, her kullanıcı kendi programını ve seans geçmişini yönetir.  
**Dil:** Türkçe arayüz.  
**Tema:** Yalnızca koyu tema.

---

## 2. Tech Stack

### Frontend
- **React** (Vite ile kurulum)
- **React Router v6** — sayfa yönlendirme
- **CSS Modules + CSS Variables** — stil yönetimi, tema token'ları
- **Axios** — API istekleri
- **Google Fonts** — Oswald, Inter, Roboto Mono

### Backend
- **Node.js + Express** — REST API sunucusu
- **better-sqlite3** — yerel SQLite veritabanı (senkron API, sade kullanım)
- **bcrypt** — şifre hashleme
- **jsonwebtoken** — JWT üretimi ve doğrulama
- **cookie-parser** — httpOnly cookie yönetimi

### Deployment
- **Linux sunucu** (kullanıcının kendi VPS'i)
- **Nginx** — reverse proxy; frontend static dosyalarını serve eder, `/api` isteklerini Node.js'e yönlendirir
- **PM2** — Node.js process yönetimi

---

## 3. Kimlik Doğrulama

- Kayıt: kullanıcı adı + şifre (bcrypt hash, min 6 karakter)
- Giriş: JWT üretilir, httpOnly cookie olarak set edilir (30 gün geçerlilik)
- Her API isteğinde cookie doğrulanır; geçersizse 401 döner, frontend `/giris`'e yönlendirir
- Çıkış: cookie silinir

---

## 4. Sayfalar ve Rotalar

| Sayfa | Route | Erişim |
|-------|-------|--------|
| Giriş | `/giris` | Herkese açık |
| Kayıt | `/kayit` | Herkese açık |
| Dashboard | `/` | Oturum gerekli |
| Varyasyon Seçimi | `/gun/:dayTypeId` | Oturum gerekli |
| Aktif Seans | `/seans/:variationId` | Oturum gerekli |
| Egzersiz Geçmişi | `/gecmis/:exerciseId` | Oturum gerekli |
| Program Yönetimi | `/program` | Oturum gerekli |
| Etiket Yönetimi | `/etiketler` | Oturum gerekli |

Oturum açılmamış kullanıcılar korumalı sayfalara erişmeye çalışırsa `/giris`'e yönlendirilir.

---

## 5. Veri Modeli (SQLite)

Android app'teki şema korunur, her tabloya `user_id` foreign key eklenir.

```sql
users
  id, username (unique), password_hash, created_at

day_types
  id, user_id (FK), name, short_label, order_index

variations
  id, day_type_id (FK), code, order_index

exercises
  id, variation_id (FK), name, order_index, planned_sets, is_archived

sessions
  id, user_id (FK), variation_id (FK), day_type_id (FK), performed_at, completed

session_exercises
  id, session_id (FK), exercise_id (FK), note, substituted_name, flagged

set_logs
  id, session_exercise_id (FK), set_number, weight_kg (nullable), reps (nullable), completed

tags
  id, user_id (FK), label, order_index, is_archived

session_exercise_tags
  session_exercise_id (FK), tag_id (FK)
```

**Rotasyon sorgusu:** Kullanıcının o gün tipindeki son tamamlanan seansın varyasyonunu bul, bir sonrakini döndür (mod aritmetiği).  
**Önceki referans sorgusu:** Aynı varyasyon + egzersiz için en son tamamlanan seansın set verilerini, notlarını ve tag'lerini döndür.

---

## 6. API Endpoint'leri

### Auth
```
POST /api/auth/kayit      — {username, password} → JWT cookie set
POST /api/auth/giris      — {username, password} → JWT cookie set
POST /api/auth/cikis      — cookie sil
GET  /api/auth/ben        — mevcut kullanıcı bilgisi (oturum kontrolü için)
```

### Gün Tipleri
```
GET    /api/gun-tipleri             — kullanıcının tüm gün tipleri + sıradaki varyasyon bilgisi
POST   /api/gun-tipleri             — yeni gün tipi oluştur
PUT    /api/gun-tipleri/:id         — güncelle
DELETE /api/gun-tipleri/:id         — sil
PATCH  /api/gun-tipleri/siralama    — sıralama güncelle (drag & drop)
```

### Varyasyonlar
```
GET    /api/varyasyonlar/:dayTypeId  — gün tipinin varyasyonları
POST   /api/varyasyonlar             — yeni varyasyon
PUT    /api/varyasyonlar/:id         — güncelle
DELETE /api/varyasyonlar/:id         — sil
```

### Egzersizler
```
GET    /api/egzersizler/:variationId — varyasyonun egzersizleri (arşivlenmiş dahil değil)
POST   /api/egzersizler              — yeni egzersiz
PUT    /api/egzersizler/:id          — güncelle (isim, planned_sets)
PATCH  /api/egzersizler/:id/arsiv    — arşivle / arşivden çıkar
DELETE /api/egzersizler/:id          — sil
PATCH  /api/egzersizler/siralama     — sıralama güncelle
```

### Seanslar
```
GET  /api/seanslar/gecmis/:exerciseId  — egzersizin tüm geçmiş seansları (reverse chrono)
POST /api/seanslar                     — yeni seans başlat
PUT  /api/seanslar/:id                 — seans verilerini güncelle (set logları dahil)
POST /api/seanslar/:id/tamamla         — seansı tamamla (completed = true)
GET  /api/seanslar/onceki/:variationId/:exerciseId — önceki referans verisi
```

### Etiketler
```
GET    /api/etiketler        — kullanıcının tüm etiketleri
POST   /api/etiketler        — yeni etiket
PUT    /api/etiketler/:id    — güncelle
DELETE /api/etiketler/:id    — sil (veya arşivle)
```

---

## 7. Frontend Yapısı

```
src/
├── api/              — Axios instance + endpoint fonksiyonları
├── components/       — Tekrar kullanılan UI bileşenleri
│   ├── SetGrid/      — Ağırlık/tekrar giriş grid'i
│   ├── ExerciseCard/ — Seans içi egzersiz kartı
│   ├── TagPicker/    — Quick tag seçici
│   └── Layout/       — Navbar + sayfa sarmalayıcı
├── pages/            — Sayfa bileşenleri (route ile 1:1)
│   ├── Giris/
│   ├── Kayit/
│   ├── Dashboard/
│   ├── VaryasyonSecimi/
│   ├── AktifSeans/
│   ├── EgzersizGecmisi/
│   ├── ProgramYonetimi/
│   └── EtiketYonetimi/
├── hooks/            — useAuth, useSeans, useProgram
├── styles/           — global CSS değişkenleri, reset
└── main.jsx          — React Router, uygulama girişi
```

---

## 8. Tasarım Sistemi

### Renk Paleti (koyu tema)
```css
--bg-outer:   #0d0c0a;   /* en dış arka plan */
--bg-screen:  #141310;   /* sayfa zemini */
--bg-card:    #1d1b16;   /* kart */
--bg-input:   #27241e;   /* input alanı */

--text-main:  #f1ece1;   /* ana metin */
--text-muted: #9d988a;   /* ikincil metin */
--text-hint:  #6f6a5e;   /* placeholder */

--accent:     #ff7a45;   /* turuncu — birincil aksiyon */
--success:    #54d2a6;   /* mint yeşili — sıradaki, PR */
--warning:    #ffc24d;   /* amber — flag, etiket, not */
```

### Tipografi
- **Oswald 600–700** — başlıklar, butonlar (büyük harf)
- **Inter 400–600** — gövde metin, etiketler
- **Roboto Mono 500–600** — ağırlık ve tekrar sayıları

### Layout
- Mobil önce tasarım, max-width **520px** (telefon), masaüstünde ortalanmış kart
- Navigation: mobilde alt bar, masaüstünde üst bar
- Kart köşe yarıçapı: 14px; input: 8px; pill buton: 999px
- Minimum dokunma hedefi: 44×44px

### Android App'ten Farklılaşan Noktalar
- Bottom bar → responsive nav (mobilde alt bar, masaüstünde üst)
- Drag & drop sıralama için fare desteği
- Daha geniş set input grid'i (masaüstünde yan yana)
- Sayfa başlıkları daha büyük (scroll yok — web'de daha fazla dikey alan)

---

## 9. Seans Ekranı Detayı (Core Ekran)

Uygulmanın merkez ekranı. Kullanıcı akışı:

1. Dashboard'dan gün tipi seçilir → varyasyon seçim ekranı → seans başlar
2. Her egzersiz için kart gösterilir:
   - Egzersiz adı + planned set sayısı
   - Önceki seans referansı (tarih, ağırlık, tekrar) — gri renkte
   - Set grid'i: her satır `[ağırlık kg] × [tekrar]` input'u + tamamlama butonu
   - Set durumları: boş (yapılmadı), 0 tekrar (denendi/başarısız), dolu (tamamlandı)
   - PR durumu: önceki seansı geçtiyse yeşil highlight
   - Quick tag butonları + serbest not alanı
   - Egzersiz değiştirme alanı (substitution)
3. Sayfanın altında sabit "SEANSI BİTİR" butonu (turuncu)
4. Seans tamamlandığında toast mesajı + dashboard'a yönlendirme

**Veri kaydetme stratejisi:** Seans verisi seans boyunca React state'inde (bellekte) tutulur.
"SEANSI BİTİR" butonuna basılınca tek bir API çağrısıyla tüm seans sunucuya yazılır.
Tarayıcı kapanırsa veri kaybolur — bu kabul edilebilir bir trade-off (offline backup sonraki aşama).

---

## 10. Program Yönetimi Detayı

Tek sayfa, accordion yapısında:

```
[Gün Tipi: Göğüs/Sırt]  [+ Ekle] [✎] [↕]
  └── [Varyasyon: 1A]  [+ Ekle] [✎] [×]
       ├── Bench Press  3×  [✎] [↕] [×]
       ├── Pull-up      4×  [✎] [↕] [×]
       └── [+ Egzersiz Ekle]
  └── [Varyasyon: 1B]  ...
[+ Gün Tipi Ekle]
```

Sıralama değişikliklerinde PATCH `/siralama` çağrılır.

---

## 11. Deployment Yapılandırması

```
/var/www/checkfit/
├── frontend/          — React build (dist/)
└── backend/           — Node.js uygulaması

Nginx config:
  - / → frontend/dist/index.html (SPA fallback)
  - /api → http://localhost:3001 (Express)
  - HTTPS: Let's Encrypt sertifikası

PM2:
  - process adı: checkfit-api
  - startup: pm2 startup systemd
```

---

## 12. MVP Kapsamı

**Dahil:**
- Kullanıcı kaydı ve girişi
- Gün tipi, varyasyon, egzersiz CRUD
- Rotasyon sistemi (otomatik + manuel override)
- Aktif seans loglama (set, ağırlık, tekrar, not, tag, substitution)
- Egzersiz geçmişi görüntüleme
- Quick tag yönetimi
- Drag & drop sıralama
- Soft delete (arşivleme)

**Dahil değil (sonraki aşama):**
- İlerleme grafikleri
- Veri export/import
- Şifre sıfırlama
- Pound/kg birim seçimi
- Dinlenme zamanlayıcısı
