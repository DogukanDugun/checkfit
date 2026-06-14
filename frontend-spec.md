# Antrenman Takip — Front-End Spesifikasyonu

> **Çalışma adı:** `FitCheck` — **PLACEHOLDER.** Bu ad fitness kategorisinde fazlasıyla dolu (App Store/Play'de en az iki fitness uygulaması + birçok "fit check" moda uygulaması; biri tam da bizim istemediğimiz oyunlaştırmaya dayalı). Yayından önce **değiştirilmeli.** Dokümanda yer tutucu olarak kullanılıyor.
>
> **Bu doküman ne?** Arayüzün görsel ve etkileşim spesifikasyonu — tasarımcı ve arayüzü kuracak geliştirici için. Ürün mantığı/veri modeli için ana doküman: `antrenman-takip-spec.md`. Akış referansı: `antrenman-prototip.html`.
>
> **Uygulama hedefi:** Prodüksiyon uygulaması **Flutter**'dır. Buradaki HTML/CSS yüksek-sadakatli **tasarım referansıdır**, prodüksiyon kodu değil. Token ve bileşenlerin Flutter karşılıkları için §10.

---

## 1. Tasarım ilkeleri

1. **Oyunlaştırma yok.** Seri, puan, rozet, lider tablosu yok. Endüstriyel bir gösterge paneli sadeliği.
2. **Salonda kullanılır.** Terli, tek el, hızlı. Dokunma hedefleri ≥ 44px, yüksek kontrast, jilet gibi hizalama.
3. **Rakamlar kahramandır.** Ağırlık/tekrar monospace ve grid içinde hizalı; göz tek bakışta tarayabilmeli.
4. **Sessiz geri bildirim.** İnce haptik + küçük animasyon; tatmin verir ama dikkat dağıtmaz.
5. **Mobil kilit.** Maksimum genişlik **430px**; üstte içerik, altta sabit birincil aksiyon (başparmak erişimi).

---

## 2. Tasarım token'ları

### Renk
| Rol | Hex | Kullanım |
|---|---|---|
| App background | `#0d0c0a` | En dış boşluk |
| Surface / ekran | `#141310` | Mobil çerçeve zemini |
| Surface card | `#1d1b16` | Kartlar, kapsayıcılar |
| Surface raised | `#27241e` | Hover/active, input zemini, referans satırı |
| Surface high | `#322e26` | Rozet zemini |
| Border | `#3a352c` | 1px ince kenarlık |
| Text primary | `#f1ece1` | Ana metin, girilen rakamlar |
| Text secondary | `#9d988a` | İkincil etiket |
| Text faint | `#6f6a5e` | Placeholder, tarih, ipucu |
| Accent (aksiyon) | `#ff7a45` | Birincil buton, + set, vurgu |
| Accent pressed | `#c9572b` | Basılı hâl |
| Mint (sıradaki / rekor) | `#54d2a6` | Sıradaki varyasyon, geçilen set; zemin %10 opacity |
| Amber (bağlam) | `#ffc24d` | ⚠, hızlı etiket, not; zemin %10 opacity |

### Tipografi
| Stil | Font | Ağırlık | Not |
|---|---|---|---|
| Display / H1 / ana buton | Oswald | 600–700 | BÜYÜK HARF, letter-spacing 0.5px |
| Gövde / etiket | Inter | 400/500/600 | |
| Rakam / input | Roboto Mono | 500/600 | Ağırlık+tekrar hizalı grid |

Ölçek (öneri): H1 24–26, kart başlığı 15–16, gövde 13–14, ipucu/etiket 11–12, büyük rakam 15.

### Diğer
- **Köşe radyusu:** kart 14px; çip/input 8–10px; pill 999px; çerçeve 26px.
- **Boşluk skalası:** 4 / 8 / 12 / 16 / 20 / 24.
- **Kenarlık:** 1px `#3a352c`. Gölge yok (düz, mat yüzeyler); derinlik kenarlık + yüzey tonuyla verilir.
- **Dokunma hedefi:** min 44×44px.

---

## 3. Bileşen envanteri (durumlarıyla)

**Butonlar**
- *Primary* (Oswald, BÜYÜK, turuncu zemin `#ff7a45`, metin `#1a0f08`): "SEANSI BİTİR". Basılı: `#c9572b` + scale .99.
- *Mini / secondary* (Inter, çerçeveli, saydam): "+ set", "− set", "⚠ not", "↔ hareketi değiştir". Hover: border `#544d3f`. Aktif/seçili: amber çerçeve + amber metin + amber %8 zemin.
- *Destructive* (sil): metin/çerçeve kırmızımsı amber; her zaman onay diyaloğu.
- *Geri* (‹): 38×38, çerçeveli kare, surface card zemin.

**Hızlı etiket çipi (Quick Tag)**
- Yatay scroll satır (`overflow-x:auto`, scrollbar gizli). 
- Default: amber çerçeve, saydam iç, `#9d988a` metin.
- Seçili: amber %12 iç dolgu, amber metin/çerçeve.
- Sonda küçük bir **"+ düzenle"** çipi → etiket yönetimi.

**Input (ağırlık / tekrar)**
- Zemin `#27241e`, 1px border, radius 10. Rakam Roboto Mono `#f1ece1`. Sağ içte birim ("kg" / "tkr") `#6f6a5e`.
- *Placeholder* = geçen seansın değeri, `#6f6a5e`.
- *Focus:* border `#ff7a45`.
- *Geçti (PR):* girilen değer geçen seansı geçtiyse border/han hafif **mint** (bkz. §5).
- *Vücut ağırlığı:* ağırlık kutusu boş, placeholder "VA" (bkz. §6).

**Kartlar**
- *Gün tipi kartı:* sol kare rozet (numara, turuncu), orta ad + "En son: 1A · 3 gün önce", sağ mint pill "1B →".
- *Varyasyon çipi:* ~78×84 kare; harf büyük; alt etiket "EN SON"/"SIRADAKİ". Sıradaki = mint çerçeve + mint %10 glow.
- *Hareket kartı:* başlık + (varsa) ⚠; referans satırı; set grid; aksiyonlar; etiketler; not/değiştir. İşaretliyse sol/çerçeve amber tonu.

**Rozet / pill / işaret**
- Mint pill (sıradaki), faint "en son" işareti, amber ⚠ bayrağı.

**Referans satırı**
- `#27241e` zemin, ince. Roboto Mono değerler + Inter faint tarih ("— 3 hafta önce"). Altında varsa amber not/etiket.

**Sabit alt bar**
- `position: sticky/fixed`, app-background zemin, üstte 1px border. İçinde %100 genişlik primary buton. iOS safe-area padding.

**Yardımcılar**
- *Toast:* kısa onay (mint zemin), 2.5 sn. *Onay diyaloğu:* silme/iptal. *Boş durum:* davet edici metin + birincil aksiyon.

---

## 4. Ekranlar

### EKRAN 1 — Ana ekran (Gün tipleri)
- Top bar: "ANTRENMANLARIM" (Oswald) + "Bugün hangi gün? Birine dokun." (Inter, faint).
- Gün tipi kartları (bkz. §3). Sağ mint pill = sıradaki varyasyon.
- En altta/uygun yerde "+ Gün tipi ekle".
- **Boş durum:** hiç gün tipi yoksa → "İlk gün tipini ekle" daveti.

### EKRAN 2 — Varyasyon seçimi
- Top bar: ‹ geri, "Göğüs / Arka Kol", "Varyasyonu seç".
- Varyasyon çipleri rail. "EN SON" (faint) ve "SIRADAKİ" (mint) işaretleri.
- Bilgi: "↻ 1C'den sonra başa (1A) döner. İstediğini seçebilirsin — sıra zorunlu değil."

### EKRAN 3 — Antrenman seansı (kalp)
- Top bar: ‹ geri, "1B GÖĞÜS / ARKA KOL", "Her seti gir · gerekirse not düş".
- **Hareket kartı** (her hareket için):
  1. Başlık (BÜYÜK) + space-between ⚠ (geçmişte not varsa).
  2. **Referans satırı:** `60×8 · 62.5×8 · 65×6` + faint "— 3 hafta önce". Altında varsa amber "⚠ Hastaydım, düşürdüm".
  3. **Set grid (3 kolon):** # · Ağırlık · Tekrar. Başlıklar küçük/faint. Inputlar §3'teki gibi.
  4. **Aksiyonlar:** "+ set" / "− set".
  5. **Hızlı etiketler:** yatay scroll çip satırı (biri seçili örnek: "Cihaz doluydu").
  6. **"⚠ not"** ve **"↔ hareketi değiştir"** (açıldığında ilgili alan görünür).
- **Vücut ağırlığı senaryosu** (örn. karın tekerleği): referans "VA×10 · VA×8"; ağırlık inputu boş, placeholder "VA"; hizalama bozulmaz (bkz. §6).
- **Sabit alt bar:** "SEANSI BİTİR".

### EKRAN 4 — Hareket geçmişi *(prompt'ta yoktu, eklendi)*
- Bir harekete uzun bas / "geçmiş" ikonu ile açılır.
- O hareketin **tüm geçmiş seansları**, tarihe göre azalan liste: her satırda tarih + set değerleri + varsa not/etiket.
- Üstte hareket adı; sade liste, grafik yok.

### EKRAN 5 — Program yönetimi *(eklendi, çekirdek)*
- Gün tipi / varyasyon / hareket için ekle-düzenle-sil; sıralama (drag).
- Yeni varyasyon **sıfırdan** kurulur. Silme = onay + soft-delete kuralı (bkz. ürün spec'i §6).
- Form alanları aynı token sistemi; birincil aksiyon altta sabit ("KAYDET").

### EKRAN 6 — Hızlı etiket yönetimi *(eklendi)*
- Etiket listesini düzenleme: ekle/düzenle/sil, sırala. Aynı çip görünümü.

---

## 5. Etkileşim ve durumlar

- **"Geçen seansı geçtin mi" (PR vurgusu):** Bir sette girilen toplam iş (ağırlık ve/veya tekrar) o setin geçen seans değerini aştığında, o set satırına **ince mint** vurgu (örn. değer mint renk veya sol kenarda mint çizgi). Abartı yok, kısa.
- **Flagged (işaretli) kart:** not, hızlı etiket veya "hareketi değiştir" doluysa kart başlığında ⚠ ve kartın çerçevesi amber tonuna kayar.
- **Hareket değiştirildi:** planlanan hareketin adı korunur; altında amber "↔ X yerine Y" satırı görünür; setler yine bu hareketin geçmişine yazılır.
- **Seansı bitir geri bildirimi:** ince haptik (`HapticFeedback.mediumImpact`) + kısa mint onay animasyonu/toast ("Seans kaydedildi ✓"). Sayfa ana ekrana döner, ilgili gün tipinin "en son"u ve "sıradaki"si güncellenir.
- **Set onayı:** bir set tamamlandığında küçük haptik (opsiyonel, hafif).
- **Boş durumlar:** her liste için davet edici boş ekran.
- **Onay diyalogları:** silme ve seans iptali için.

---

## 6. Set girişinde üç durum *(prompt'taki VA senaryosu genişletildi)*

Tek bir set üç farklı durumda olabilir; görsel olarak ayrışmalı:

| Durum | Anlam | Görsel |
|---|---|---|
| **Boş** | Set hiç yapılmadı | İki kutu da boş; placeholder faint; set "yapılmadı" sayılır, geçmişe/referansa girmez |
| **0 tekrar** | Denendi, kaldıramadı | Ağırlık dolu, tekrar = `0`; geçerli kayıt, gösterilir |
| **Vücut ağırlığı** | Ağırlıksız hareket | Ağırlık kutusu boş + placeholder **"VA"**; tekrar dolu; referansta "VA×10" |

- Hizalama kuralı: VA durumunda input boyutu/gridi **kesinlikle bozulmaz**; "VA" sadece placeholder/etiket.
- Her sette küçük bir "yapıldı" işareti (ör. set numarası dolu/içi boş) ile "boş" vs "girildi" net ayrılır.

---

## 7. Erişilebilirlik

- **Kontrast:** ana metin/zemin AA üstü. Faint metin yalnızca ikincil bilgi için (kritik bilgiyi faint yapma).
- **Dokunma hedefi:** ≥ 44px; bitişik çiplerde yeterli ara.
- **Görünür odak:** klavye/erişilebilirlik odağı belirgin (turuncu çerçeve).
- **Hareket azaltma:** "reduce motion" açıksa animasyonları sustur, haptik kalsın.
- **Dinamik yazı tipi:** metin ölçeklenince layout kırılmasın (rakam gridi esnek).
- **Renkle tek başına anlam verme:** mint/amber durumlarına ikon/etiket eşlik etsin (⚠, "SIRADAKİ").

---

## 8. Responsive ve yerleşim
- Maks genişlik **430px**, ortalanmış; dış zemin `#0d0c0a`, çerçeve `#141310`.
- İçerik dikey scroll; **birincil aksiyon altta sabit**, içerik onun arkasından akmasın (alt padding).
- iOS/Android **safe-area** boşlukları (özellikle alt bar).
- Scrollbar gizli; hızlı etiketler yatay maskelenmiş scroll.

---

## 9. Hareket (motion)
- Süreler kısa: 120–200ms; easing yumuşak (standard/ease-out).
- Animasyon nerede: buton basışı (scale .99), kart açılır alanları (not/değiştir), toast giriş/çıkış, PR mint vurgusu (kısa).
- Sayfa geçişleri sade (yatay kaydırma/fade). Gösterişli geçiş yok.
- "Reduce motion" → tümü anında/sade.

---

## 10. Flutter eşlemesi (prodüksiyon)
- **Token → ThemeData:** renkler `ColorScheme` + özel `extension`; fontlar `google_fonts` (Oswald/Inter/Roboto Mono) veya gömülü; radius/spacing sabitleri bir `tokens.dart`.
- **Bileşenler → Widget:** kart = `Card`/`Container`+`BoxDecoration`(border, radius); input = `TextField`(monospace, suffix birim); çip = `ChoiceChip`/özel; alt bar = `BottomAppBar`/`SafeArea`+`Padding`; toast = `SnackBar`/özel.
- **Haptik:** `HapticFeedback`. **Liste/scroll:** `ListView`; yatay etiketler `SingleChildScrollView(horizontal)`.
- **Tema:** tek koyu tema (açık tema yok).
- HTML referansı pikselleri değil **oranları/hiyerarşiyi** verir; Flutter'da responsive `LayoutBuilder`/`MediaQuery` ile 430px üstü cihazlarda ortalanmış maks-genişlik korunur.

---

## 11. Açık noktalar
- **İsim:** "FitCheck" değişmeli (kategori dolu). Alternatif ad turu yapılacak.
- İleride: ilerleme grafiği, süperset, RPE/RIR, veri yedekleme (hepsi MVP dışı).
