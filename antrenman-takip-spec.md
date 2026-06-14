# Antrenman Takip Uygulaması — Ürün ve Teknik Spesifikasyon (v2)

> Bu doküman, uygulamanın **ne yapacağını** ve **nasıl kurulacağını** tek bir yerde toplar.
> İki okuyucu için yazıldı: (1) uygulamayı yazacak bir geliştirici/asistan (ör. Claude Code), (2) arayüzü tasarlayacak kişi.
> Çalışan dokunulabilir prototip: `antrenman-prototip.html` (akışın referansı budur).

### v2'de değişenler
- **Hızlı Etiketler (Quick Tags)** MVP'ye eklendi (not kutusunun üstünde tek dokunuşluk sebepler).
- **Geçen sefer referansına tarih** eklendi ("3 hafta önce").
- **Set kaydında üç durum ayrımı**: boş (yapılmadı) / 0 tekrar (denendi, olmadı) / vücut ağırlığı.
- **Override davranışı netleşti**: bitirilen her seans yeni "en son" olur, döngü oradan devam eder.
- **State management** baştan **Riverpod**.
- **Soft-delete** kuralı netleşti.
- **İnce haptik/animasyon** dokunuşları; oyunlaştırma (gamification) bilinçli olarak **kapsam dışı**.

---

## 1. Amaç

Uzun süredir ağırlık çalışan, **programını sürekli değiştiren** bir kullanıcı için kişisel antrenman defteri.
Piyasadaki uygulamalar "geçen sefer kaç kaldırdım"ı iyi yapar ama bu kullanıcının asıl ihtiyacı olan **rotasyon hafızasını** (hangi varyasyondaydım, sıradaki hangisi) çözmez. Bu uygulama tam olarak onu hedefler.

Çözülecek üç temel problem:

1. **Rotasyon hafızası** — Bir kas grubu gününün birden çok versiyonu var; en son hangisini yaptığını unutuyor. Uygulama bunu hatırlayıp sıradakini söylemeli.
2. **Progresif yükleme** — Her harekette, set set, geçmişte kaç kg × kaç tekrar yaptığını görmeli ki üstüne koyabilsin.
3. **Bağlam notu** — Bir hareket beklenenden farklı gittiğinde (hasta, sakatlık, alet dolu/bozuk, başka harekete geçti) buna işaret + açıklama ekleyip **bir sonraki sefer** o açıklamayı görebilmeli; düşük rakam "gerileme" sanılmasın.

---

## 2. Temel kavramlar (sözlük)

Bu terimler dokümanın geri kalanında ve kodda aynen kullanılmalı.

| Terim | Açıklama | Örnek |
|---|---|---|
| **Gün tipi** (DayType) | Kas grubuna göre antrenman günü. Numarayla anılır. | `1` = Göğüs / Arka kol |
| **Varyasyon** (Variation) | Aynı gün tipinin farklı bir programı. Harfle anılır, gün tipiyle birleşik gösterilir. | `1A`, `1B`, `1C` |
| **Hareket** (Exercise) | Bir varyasyonun içindeki egzersiz (şablon). | Bench press |
| **Set** (SetLog) | Bir harekette tek bir set: ağırlık + tekrar. | 60 kg × 8 |
| **Seans** (Session) | Bir varyasyonun bir kez baştan sona yapılmış hali (tarih damgalı). | 12 Haz'da yapılan 1B |
| **Hızlı etiket** (Tag) | Not yerine/yanında tek dokunuşla seçilen hazır sebep. | "Cihaz doluydu" |
| **Not / işaret** | Bir seanstaki bir harekete iliştirilen açıklama + uyarı bayrağı. | ⚠ "Hastaydım, düşürdüm" |
| **Sıradaki** | Bir gün tipi için, en son yapılan varyasyondan sonra döngüde gelen varyasyon. | En son 1A → sıradaki 1B |

---

## 3. Çekirdek mantık

### 3.1 Rotasyon

- Her **gün tipi kendi içinde bağımsız** bir döngüye sahiptir. Bir gün tipinde A–E varken, başka birinde sadece A–B olabilir.
- Varyasyonlar bir **sıra** (orderIndex) ile döner: son varyasyondan sonra başa sarar (`... → 1C → 1A → ...`).
- "Sıradaki varyasyon", o gün tipinin **en son tamamlanmış seansının** varyasyonundan bir sonrakidir.
- **Uygulama gün tipi sırasını DAYATMAZ.** Kullanıcı bugün hangi gün tipini çalışacağını kendi seçer. Uygulamanın tek işi: o gün tipi için sıradakini **önermek**.
- Kullanıcı öneriyi **ezebilir** (sıradaki yerine başka bir varyasyon seçebilir). **Bitirilen her seans yeni "en son" olur ve döngü oradan devam eder.** Yani override için ayrı bir seçenek/işaretçi yoktur; ne yapıldıysa sıra ondan ilerler. (Karar: kullanıcı bu davranışı seçti.)

### 3.2 Progresif yükleme

- Antrenman ekranında her hareketin altında, o varyasyonun **en son seansındaki** değerler set set referans olarak gösterilir; **yanında o seansın tarihi** belirtilir (ör. `60×8 · 62.5×8 · 65×6 — 3 hafta önce`). Uzun ara verildiyse kullanıcı bunu görüp temkinli başlayabilir.
- Kullanıcı yeni değerleri girer; geçen seansı geçip geçmediği küçük bir vurguyla belli edilir (örn. yeşil).
- Ayrıca her hareket için **tüm geçmiş seansların listesi** görülebilir (bkz. 4.4).

### 3.3 Not, hızlı etiket ve hareket değiştirme

Bir harekete üç şekilde bağlam eklenebilir; herhangi biri o harekete bir **uyarı bayrağı** ⚠ takar:

- **Hızlı etiketler (Quick Tags)**: Not kutusunun üstünde, tek dokunuşla seçilebilen hazır sebepler — ör. "Zaman kalmadı", "Sakatlık/Ağrı", "Cihaz doluydu", "Enerjim düşüktü". Salonda terliyken klavye açmadan işaret bırakmayı sağlar. **Liste kullanıcı tarafından özelleştirilebilir** (ekle/düzenle/sil). Bir harekete birden çok etiket seçilebilir.
- **Serbest not**: Etiketlerin yetmediği durumda yazılı açıklama.
- **Hareketi değiştir**: Planlanan hareketi yapamadığında ne yaptığını yazar (ör. "Cable fly yerine dumbbell fly"). Planlanan hareketin **yeri (slot) korunur**; girilen setler yine o hareketin geçmişine yazılır, üstünde değişiklik notu durur.

Bu bağlam, **bir sonraki sefer** aynı harekete gelindiğinde geçmiş değerlerin yanında görünür.

---

## 4. Ekranlar ve özellikler

### 4.1 Ana ekran — Gün tipleri
- Tüm gün tiplerini listeler. Her kart: numara rozeti, ad, "En son: 1A · 3 gün önce", ve **sıradaki varyasyon** etiketi (ör. `1B →`).
- Karta dokununca → Varyasyon seçimi.
- Buradan yeni gün tipi eklenebilir (bkz. 4.5).

### 4.2 Varyasyon seçimi
- Seçilen gün tipinin varyasyonları kılavuz şeklinde (A, B, C…).
- **Sıradaki** vurguludur; **en son yapılan** işaretlidir.
- Döngü ipucu gösterilir ("son varyasyondan sonra başa döner").
- Açık mesaj: "İstediğini seçebilirsin — sıra zorunlu değil."
- Bir varyasyona dokununca → Antrenman ekranı (yeni seans başlar).

### 4.3 Antrenman (seans) ekranı
- Başlık: varyasyon kodu + gün tipi adı.
- Her hareket için bir kart:
  - Hareket adı; not/etiket/değişiklik varsa ⚠.
  - **Geçen sefer referansı**: set set `ağırlık×tekrar` + **tarih** (ör. "3 hafta önce"); varsa geçen seferki not/etiket (⚠) altında.
  - **Set girişi**: her set için ağırlık (kg) + tekrar alanı. Geçen seferin değerleri placeholder olarak görünür. Ağırlık boş bırakılırsa **vücut ağırlığı**; tekrar `0` girilebilir (denendi, olmadı). Hiç dokunulmamış set "yapılmadı" sayılır (bkz. 6).
  - **+ set / − set**.
  - **Hızlı etiketler**: tek dokunuşla sebep seçimi (çoklu).
  - **⚠ not**: serbest açıklama alanı.
  - **↔ hareketi değiştir**: yerine ne yaptığını yazma alanı.
- En altta **"Seansı bitir"** butonu. Basıldığında ince bir haptik + onay animasyonu (bkz. 9).

### 4.4 Hareket geçmişi
- Bir hareketin (varyasyon içinde) **tüm geçmiş seanslarını** tarihiyle listeler: her seansın set/tekrar değerleri ve varsa not/etiketleri.
- Antrenman ekranında bir harekete uzun basma / "geçmiş" ikonu ile açılır.
- Amaç: zaman içindeki ilerlemeyi düz liste olarak görmek (grafik MVP'de yok).

### 4.5 Program yönetimi (ekle / düzenle / sil)
Kullanıcı programını sürekli değiştirdiği için bu **çekirdek özelliktir.**
- **Gün tipi**: ekle, adını/numarasını düzenle, sil.
- **Varyasyon**: bir gün tipine yeni varyasyon ekle (**sıfırdan kurulur** — kopyalama yok), düzenle, sil, sırasını değiştir.
- **Hareket**: bir varyasyona hareket ekle, adını/planlı set sayısını düzenle, sıralı taşı, sil (soft-delete, bkz. 6).
- **Hızlı etiketler**: etiket listesini düzenleme ekranı (ekle/düzenle/sil).

---

## 5. Veri modeli

Hepsi cihazda yerel veritabanında (öneri: SQLite — **drift**). Sunucu yok.

**DayType** — id (PK), name, shortLabel, orderIndex

**Variation** — id (PK), dayTypeId (FK), code ("1B"), orderIndex (döngü sırası)

**Exercise** (varyasyonun şablon hareketi) — id (PK), variationId (FK), name, orderIndex, plannedSets, isArchived (soft-delete)

**Session** (bir varyasyonun tamamlanmış bir kez yapılışı) — id (PK), variationId (FK), dayTypeId (FK), performedAt (datetime), completed (bool)

**SessionExercise** (bir seanstaki bir hareketin durumu) — id (PK), sessionId (FK), exerciseId (FK), note (text?), substitutedName (text?), flagged (bool — note/substitute/etiket varsa true)

**SetLog**
| alan | tip | not |
|---|---|---|
| id | int (PK) | |
| sessionExerciseId | int (FK) | |
| setNumber | int | |
| weightKg | real? | **null = vücut ağırlığı** |
| reps | int? | **0 = denendi/olmadı**; null = girilmemiş |
| completed | bool | **false = set yapılmadı** (geçmişte sayılmaz) |

> Üç durum ayrımı: `completed=false` → boş/yapılmadı. `completed=true, reps=0` → denendi, olmadı. `completed=true, weightKg=null` → vücut ağırlığı.

**Tag** (özelleştirilebilir hızlı etiket) — id (PK), label, orderIndex, isArchived

**SessionExerciseTag** (çoka-çok) — sessionExerciseId (FK), tagId (FK)

### Temel sorgular
- **Sıradaki varyasyon** (gün tipi için): en güncel `completed` Session → varyasyonun orderIndex'i → bir sonraki (mod varyasyon sayısı). Tek doğruluk kaynağı seans tablosudur; her biten seans bunu günceller.
- **Geçen sefer referansı** (hareket için): o varyasyonun en güncel `completed` Session'ı → ilgili SessionExercise → SetLog'lar (completed=true) + note/etiketler + Session.performedAt (tarih için).
- **Tüm geçmiş** (hareket için): o varyasyonun tüm `completed` Session'ları, tarihe göre azalan.

---

## 6. İş kuralları ve kenar durumlar

- **"Seansı bitir" daima rotasyonu ilerletir** ve biten varyasyonu "en son yapılan" yapar — sıra dışı (override) seçilmiş olsa bile. Ayrı bir "sırayı bozma" yolu yoktur.
- **Set durumları.** `completed=false` setler geçmişte/referansta gösterilmez ama silinmez. `reps=0` ve vücut ağırlığı (weightKg=null) geçerli kayıtlardır ve gösterilir. Bir harekette hiç completed set yoksa ama not/etiket varsa, hareket yine işaretli kaydedilir.
- **Hareket silme (soft-delete).** Geçmişte kullanılmış hareket `isArchived=true` yapılır: güncel şablondan kalkar, **kendi geçmişi kendi içinde korunur.** Yerine yeni bir hareket eklenirse o **sıfır geçmişle** başlar ("ilk kez"); arşivlenen hareketin verisi yeni harekete taşınmaz/eşlenmez (yanlış eşleşme riski).
- **Hareketi yeniden adlandırma ≠ değiştirme.** Adı düzenlemek aynı `Exercise` kaydıdır, geçmiş korunur. "Başka bir hareketle değiştirmek" yeni bir `Exercise`'tir, geçmiş tazedir. Arayüz bu ikisini ayırmalı.
- **Varyasyon/gün tipi silme.** Onaylı silme; ilişkili geçmişin ne olacağı kullanıcıya sorulmalı (sil / arşivle).
- **Boş durumlar.** Hiç gün tipi yokken ana ekran kullanıcıyı ilk gün tipini eklemeye yönlendirir. Geçmişi olmayan harekette "İlk kez — referans yok".

---

## 7. MVP kapsamı ve sonraya bırakılanlar

**MVP'de var:**
- Gün tipi / varyasyon / hareket ekle-düzenle-sil (sıfırdan kurma) + hızlı etiket yönetimi.
- Rotasyon önerisi + override (her seans sırayı ilerletir).
- Set/tekrar girişi (kg), boş/0/vücut ağırlığı ayrımı, geçen sefer referansı + tarihi, "geçen seansı geçtin mi" vurgusu.
- Hızlı etiketler + serbest not + hareketi değiştir (⚠ ile sonraki seansta görünür).
- Tüm geçmiş listesi (hareket bazında).
- "Seansı bitir" + ince haptik/animasyon dokunuşları.
- Tamamen yerel, çevrimdışı.

**MVP'de YOK (sonraya):**
- Dinlenme/set arası sayaç — **istenmedi.**
- Oyunlaştırma (gamification) — **bilinçli olarak kapsam dışı** (tek kullanıcı kendisi; etkileşim/sadakat mekaniği gereksiz). Sadece ince, tatmin edici geri bildirim var.
- İlerleme grafiği (şimdilik düz liste).
- Bulut yedeği / senkron (ileride export/import veya Firebase).
- lb birimi; ısınma seti ayrımı.

**Açık sorular (ileride):** süperset, RPE/RIR, veri dışa/içe aktarma.

---

## 8. Teknik notlar

- **Çatı:** Flutter (Dart). Tek kod tabanı, Android + iOS.
- **Veri:** **drift** (SQLite üstü, tip güvenli; reaktif stream sorguları geçmiş/referans için ideal). Backend yok, internet yok.
- **Durum yönetimi:** **Baştan Riverpod.** Antrenman ekranı çok sayıda anlık state (set ekle/sil, not/etiket aç-kapa) + DB kalıcılığı içerdiğinden, devam eden seansın state'ini kalıcılıktan ayırmak ve drift stream'leriyle temiz çalışmak için en başından sağlam mimari kurulur. (Klasik `setState` widget içi yeterli olsa da, seans/DB sınırında Riverpod teknik borcu düşürür.)
- **Geri bildirim:** `HapticFeedback` ile set onayı ve seans bitişinde ince titreşim; küçük yeşil onay animasyonları. Abartısız.
- **Derleme/test:** Önce **Android**. **iOS derlemesi için Mac gerekir** — baştan plana koy.
- **Dil:** Arayüz **Türkçe**; kod (sınıf/alan adları) İngilizce.
- **Mimari:** UI / iş mantığı / veri katmanları ayrı (MVVM benzeri). Geçmiş/referans sorguları veri katmanında merkezi.

---

## 9. Tasarım brief'i (tasarımcı için)

**Referans:** `antrenman-prototip.html` — akış ve hiyerarşi buradan birebir alınabilir. Tasarım bunu cilalayabilir; akış mantığı sabit kalsın.

**Ürünün karakteri:** Kişisel bir **antrenman defteri**. Sayılar, ilerleme, demir hissi. Şık ama gösterişsiz; spor salonunda terliyken tek elle hızlı kullanılabilen bir arayüz.

**Tasarlanacak ana akışlar:**
1. Ana ekran (gün tipi listesi, sıradaki vurgusu)
2. Varyasyon seçimi (döngü hissi, sıradaki/en son işaretleri)
3. Antrenman ekranı — **en kritik ekran.** Set/tekrar girişi hızlı; hızlı etiket çipleri parmakla kolay; geçen sefer referansı + tarihi net.
4. Hareket geçmişi
5. Program yönetimi + hızlı etiket yönetimi
6. Boş durumlar ve onay diyalogları

**Başlangıç token'ları** (prototipten — özgürce değiştirilebilir):
- Arka plan koyu (~`#141310`), yüzeyler bir ton açık.
- Metin sıcak kırık-beyaz (~`#f1ece1`), ikincil gri.
- Vurgu/aksiyon: turuncu (`#ff7a45`); tamamlandı/sıradaki: nane yeşili (`#54d2a6`); uyarı/etiket: amber (`#ffc24d`).
- Tipografi: başlık için kondens display (Oswald), gövde Inter, **sayılar monospace** (Roboto Mono — rakamlar hizalı dursun).

**Kurallar:**
- Dokunma hedefleri büyük. Set giriş alanları ve hızlı etiket çipleri kolay seçilebilir.
- **İnce haptik + küçük animasyon**la tatmin hissi; ama rozet/seri/puan gibi **oyunlaştırma yok.**
- Türkçe metin: sade, emir kipinde ("Seansı bitir", "Hareketi değiştir"). Bir buton baştan sona aynı adı taşısın.
- Boş ekran bir davettir ("İlk gün tipini ekle").
- Erişilebilirlik: yeterli kontrast, görünür odak, hareket azaltma tercihine saygı.

---

## 10. Sonraki adımlar
1. Bu spec onaylanır (kullanıcı + tasarım).
2. Tasarım, prototip akışını yüksek çözünürlüklü ekranlara çevirir.
3. Geliştirme: Flutter iskeleti → drift veri modeli → Riverpod → ekranlar → seans/rotasyon mantığı → geçmiş → program & etiket yönetimi.
4. Android'de test → sonra iOS (Mac ile).
