/* =========================================================
   ÖDEME TAKİP - TEK DOSYA ANA JAVASCRIPT (GÜNCELLENMİŞ)
   ========================================================= */

const STORAGE_KEY = "odemeTakipVerileri";
const AY_ISIMLERI = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

let veriler = {
    ayarlar: { basliklar: [] },
    aylar: {},
    sonGuncelleme: null
};

let aktifTarih = new Date();
let aktifBaslikId = null;
let duzenlenenSablonId = null;
let ozetYili = new Date().getFullYear();

/* =========================================================
   BAŞLANGIÇ VE HISTORY ROUTER YÖNETİMİ
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    verileriYukle();
    bugununAyiniKontrolEt();
    
    // Geri tuşu ve geçmiş hareketlerini dinle
    window.addEventListener("popstate", routerKontrolu);
    
    // İlk açılışta geçmişte state yoksa ana sayfa state'i ekle
    if (!history.state) {
        history.replaceState({ sayfa: "anasayfa" }, "", "#anasayfa");
    }
    routerKontrolu();
});

function sayfaDegistir(sayfaAdi, ekVeri = {}) {
    const stateObj = { sayfa: sayfaAdi, ...ekVeri };
    history.pushState(stateObj, "", `#${sayfaAdi}`);
    routerKontrolu();
}

function routerKontrolu(event) {
    tumSayfalariGizle();
    const state = event && event.state ? event.state : (history.state || null);
    const hash = window.location.hash.replace("#", "");
    
    let hedefSayfa = state ? state.sayfa : (hash || "anasayfa");

    // State içinde baslikId varsa hafızaya al
    if (state && state.baslikId) {
        aktifBaslikId = state.baslikId;
        localStorage.setItem("aktifBaslikId", aktifBaslikId);
    } else if (hedefSayfa === "sablonlar" && !aktifBaslikId) {
        aktifBaslikId = localStorage.getItem("aktifBaslikId");
    }

    const hedefElement = document.getElementById(
        hedefSayfa === "ayarlar" ? "ayarlarSayfasi" :
        hedefSayfa === "yillik-ozet" ? "yillikOzetSayfasi" :
        hedefSayfa === "sablonlar" ? "sablonSayfasi" :
        hedefSayfa === "sablon-duzenle" ? "sablonDuzenleSayfasi" : "anasayfa"
    );

    if (hedefElement) {
        hedefElement.classList.remove("gizli");
    } else {
        document.getElementById("anasayfa")?.classList.remove("gizli");
        hedefSayfa = "anasayfa";
    }

    if (hedefSayfa === "ayarlar") {
        ayarlariGuncelle();
    } else if (hedefSayfa === "yillik-ozet") {
        ozetYili = aktifTarih.getFullYear();
        yillikOzetiGuncelle();
    } else if (hedefSayfa === "sablonlar") {
        if (aktifBaslikId) {
            const baslik = baslikBul(aktifBaslikId);
            if (baslik) {
                document.getElementById("sablonSayfasiBaslik").textContent = baslik.adi;
                sablonlariGuncelle();
            } else {
                sayfaDegistir("ayarlar");
            }
        } else {
            sayfaDegistir("ayarlar");
        }
    } else if (hedefSayfa === "sablon-duzenle") {
        // Şablon düzenleme ekranı aktif
    } else {
        ekraniGuncelle();
    }
}

function ayAnahtari(tarih) {
    return `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, "0")}`;
}

function ayBasligi(tarih) {
    return `${AY_ISIMLERI[tarih.getMonth()]} ${tarih.getFullYear()}`;
}

function bugununAyiniKontrolEt() {
    const kaydedilenAy = localStorage.getItem("aktifTarihAnahtar");
    if (kaydedilenAy) {
        const [yil, ay] = kaydedilenAy.split("-");
        aktifTarih = new Date(parseInt(yil), parseInt(ay) - 1, 1);
    } else {
        aktifTarih = new Date();
    }
    ozetYili = aktifTarih.getFullYear();
    aktifAyiOlustur();
}


function aktifAyiOlustur() {
    const anahtar = ayAnahtari(aktifTarih);
    if (!veriler.aylar[anahtar]) {
        veriler.aylar[anahtar] = { odemeler: {}, olusturulmaTarihi: new Date().toISOString() };
        kaydet();
    }
}

/* =========================================================
   LOCALSTORAGE & VERİ YÖNETİMİ
   ========================================================= */

function verileriYukle() {
    try {
        const kayit = localStorage.getItem(STORAGE_KEY);
        if (kayit) {
            const parsed = JSON.parse(kayit);
            if (parsed && typeof parsed === "object") veriler = parsed;
        }
        const kaydedilenBaslikId = localStorage.getItem("aktifBaslikId");
        if (kaydedilenBaslikId) aktifBaslikId = kaydedilenBaslikId;
    } catch (hata) {
        console.error("Veriler yüklenemedi:", hata);
    }
    if (!veriler.aylar) veriler.aylar = {};
    if (!veriler.ayarlar) veriler.ayarlar = { basliklar: [] };
    if (!Array.isArray(veriler.ayarlar.basliklar)) veriler.ayarlar.basliklar = [];
}

function kaydet() {
    try {
        veriler.sonGuncelleme = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(veriler));
        if (aktifBaslikId) {
            localStorage.setItem("aktifBaslikId", aktifBaslikId);
        }
    } catch (hata) {
        console.error("Kayıt yapılamadı:", hata);
        alert("Veriler kaydedilemedi.");
    }
}

/* =========================================================
   SAYFA GEÇİŞLERİ VE KESİN HİYERARŞİK GERİ DÖNÜŞ
   ========================================================= */

function tumSayfalariGizle() {
    ["anasayfa", "ayarlarSayfasi", "sablonSayfasi", "sablonDuzenleSayfasi", "yillikOzetSayfasi"]
        .forEach(id => document.getElementById(id)?.classList.add("gizli"));
}

function anaSayfayaDon() {
    sayfaDegistir("anasayfa");
}

function ayarlarAc() {
    sayfaDegistir("ayarlar");
}

function yillikOzetAc() {
    sayfaDegistir("yillik-ozet");
}

function geriGit() {
    const sablonDuzenle = document.getElementById("sablonDuzenleSayfasi");
    const sablonSayfasi = document.getElementById("sablonSayfasi");
    const ayarlarSayfasi = document.getElementById("ayarlarSayfasi");
    const yillikOzetSayfasi = document.getElementById("yillikOzetSayfasi");

    let hedefSayfa = "anasayfa";
    let ekVeri = {};

    if (sablonDuzenle && !sablonDuzenle.classList.contains("gizli")) {
        hedefSayfa = "sablonlar";
        if (aktifBaslikId) ekVeri.baslikId = aktifBaslikId;
    } else if (sablonSayfasi && !sablonSayfasi.classList.contains("gizli")) {
        hedefSayfa = "ayarlar";
    } else if (ayarlarSayfasi && !ayarlarSayfasi.classList.contains("gizli")) {
        hedefSayfa = "anasayfa";
    } else if (yillikOzetSayfasi && !yillikOzetSayfasi.classList.contains("gizli")) {
        hedefSayfa = "anasayfa";
    }

    const stateObj = { sayfa: hedefSayfa, ...ekVeri };
    history.replaceState(stateObj, "", `#${hedefSayfa}`);
    routerKontrolu({ state: stateObj });
}

function sablonSayfasinaDon() {
    geriGit();
}

function sablonDuzenlemedenDon() {
    geriGit();
}

/* =========================================================
   FORMATLAMA VE YARDIMCILAR
   ========================================================= */

function parseSayi(deger) {
    if (deger === undefined || deger === null || deger === "") return 0;
    let sayi = parseFloat(String(deger).replace(",", "."));
    return isNaN(sayi) ? 0 : sayi;
}

function paraFormatla(deger) {
    return parseSayi(deger).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

function guvenliMetin(metin) {
    if (!metin) return "";
    return String(metin)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function benzersizId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function baslikBul(id) {
    return veriler.ayarlar.basliklar.find(b => b.id === id);
}

function aktifAyVerisi() {
    const anahtar = ayAnahtari(aktifTarih);
    if (!veriler.aylar[anahtar]) {
        veriler.aylar[anahtar] = { odemeler: {}, olusturulmaTarihi: new Date().toISOString() };
    }
    return veriler.aylar[anahtar];
}

function odemeVerisiniGetir(sablonId) {
    const ay = aktifAyVerisi();
    if (!ay.odemeler[sablonId]) ay.odemeler[sablonId] = {};
    return ay.odemeler[sablonId];
}

function odemeTutariGetir(sablonId) {
    const odeme = odemeVerisiniGetir(sablonId);
    return parseSayi(odeme.odeme) || parseSayi(odeme.kalanBorc);
}

function taksitliGosterilmeliMi(sablonId, hedefTarih = aktifTarih) {
    const ayAnahtarStr = ayAnahtari(hedefTarih);
    const ayVerisi = veriler.aylar[ayAnahtarStr];
    
    // 1. O ay için elle girilmiş bir veri varsa mutlaka göster (0 dahil)
    if (ayVerisi && ayVerisi.odemeler && ayVerisi.odemeler[sablonId] && ayVerisi.odemeler[sablonId].kalanTaksit !== undefined && ayVerisi.odemeler[sablonId].kalanTaksit !== "" && ayVerisi.odemeler[sablonId].kalanTaksit !== null) {
        return true;
    }

    // 2. Bu şablonun sistemde HİÇBİR ayda henüz kalan taksit verisi yok mu? 
    // (Yani yepyeni eklenmiş bir şablon mu?) Öyleyse mutlaka göster ki ilk değer yazılabilsin!
    let hicGecmisYok = true;
    for (const anahtar in veriler.aylar) {
        const ayD = veriler.aylar[anahtar];
        if (ayD && ayD.odemeler && ayD.odemeler[sablonId] && ayD.odemeler[sablonId].kalanTaksit !== undefined && ayD.odemeler[sablonId].kalanTaksit !== "" && ayD.odemeler[sablonId].kalanTaksit !== null) {
            hicGecmisYok = false;
            break;
        }
    }
    if (hicGecmisYok) return true;

    // 3. Geçmiş verilere bakarak taksit ömrünün (0 dahil) dolup dolmadığını kontrol et
    let tarihObj = new Date(hedefTarih.getFullYear(), hedefTarih.getMonth(), 1);
    for (let i = 1; i <= 120; i++) {
        tarihObj.setMonth(tarihObj.getMonth() - 1);
        const prevAnahtarStr = ayAnahtari(tarihObj);
        const prevAyVerisi = veriler.aylar[prevAnahtarStr];
        
        if (prevAyVerisi && prevAyVerisi.odemeler && prevAyVerisi.odemeler[sablonId] && prevAyVerisi.odemeler[sablonId].kalanTaksit !== undefined && prevAyVerisi.odemeler[sablonId].kalanTaksit !== "" && prevAyVerisi.odemeler[sablonId].kalanTaksit !== null) {
            const baseVal = parseSayi(prevAyVerisi.odemeler[sablonId].kalanTaksit);
            return i <= baseVal;
        }
    }
    return false;
}


function etkinKalanTaksitGetir(sablonId, tarih = aktifTarih) {
    const ayAnahtarStr = ayAnahtari(tarih);
    const ayVerisi = veriler.aylar[ayAnahtarStr];
    
    if (ayVerisi && ayVerisi.odemeler && ayVerisi.odemeler[sablonId] && ayVerisi.odemeler[sablonId].kalanTaksit !== undefined && ayVerisi.odemeler[sablonId].kalanTaksit !== "" && ayVerisi.odemeler[sablonId].kalanTaksit !== null) {
        return parseSayi(ayVerisi.odemeler[sablonId].kalanTaksit);
    }

    let tarihObj = new Date(tarih.getFullYear(), tarih.getMonth(), 1);
    for (let i = 1; i <= 120; i++) {
        tarihObj.setMonth(tarihObj.getMonth() - 1);
        const prevAnahtarStr = ayAnahtari(tarihObj);
        const prevAyVerisi = veriler.aylar[prevAnahtarStr];
        
        if (prevAyVerisi && prevAyVerisi.odemeler && prevAyVerisi.odemeler[sablonId] && prevAyVerisi.odemeler[sablonId].kalanTaksit !== undefined && prevAyVerisi.odemeler[sablonId].kalanTaksit !== "" && prevAyVerisi.odemeler[sablonId].kalanTaksit !== null) {
            const baseVal = parseSayi(prevAyVerisi.odemeler[sablonId].kalanTaksit);
            const calcVal = baseVal - i;
            return calcVal >= 0 ? calcVal : 0;
        }
    }
    return 0;
}

function etkinKalanTaksitGetir(sablonId, tarih = aktifTarih) {
    const ayAnahtarStr = ayAnahtari(tarih);
    const ayVerisi = veriler.aylar[ayAnahtarStr];
    
    if (ayVerisi && ayVerisi.odemeler && ayVerisi.odemeler[sablonId] && ayVerisi.odemeler[sablonId].kalanTaksit !== undefined && ayVerisi.odemeler[sablonId].kalanTaksit !== "" && ayVerisi.odemeler[sablonId].kalanTaksit !== null) {
        return parseSayi(ayVerisi.odemeler[sablonId].kalanTaksit);
    }

    let tarihObj = new Date(tarih.getFullYear(), tarih.getMonth(), 1);
    for (let i = 1; i <= 120; i++) {
        tarihObj.setMonth(tarihObj.getMonth() - 1);
        const prevAnahtarStr = ayAnahtari(tarihObj);
        const prevAyVerisi = veriler.aylar[prevAnahtarStr];
        
        if (prevAyVerisi && prevAyVerisi.odemeler && prevAyVerisi.odemeler[sablonId] && prevAyVerisi.odemeler[sablonId].kalanTaksit !== undefined && prevAyVerisi.odemeler[sablonId].kalanTaksit !== "" && prevAyVerisi.odemeler[sablonId].kalanTaksit !== null) {
            const baseVal = parseSayi(prevAyVerisi.odemeler[sablonId].kalanTaksit);
            const calcVal = baseVal - i;
            return calcVal > 0 ? calcVal : 0;
        }
    }
    return 0;
}

/* =========================================================
   ANA EKRAN VE GÜNCELLEME
   ========================================================= */

function ekraniGuncelle() {
    aktifAyiOlustur();
    const ayBaslikEl = document.getElementById("ayBasligi");
    if (ayBaslikEl) ayBaslikEl.textContent = ayBasligi(aktifTarih);
    odemeleriOlustur();
    genelToplamiHesapla();
    kalanBorclariGuncelle();
}

function odemeleriOlustur() {
    const alan = document.getElementById("odemeListesi");
    if (!alan) return;
    alan.innerHTML = "";
    const basliklar = veriler.ayarlar.basliklar;

    if (basliklar.length === 0) {
        alan.innerHTML = `<div class="ayar-karti"><div class="bos-mesaj">Henüz ödeme başlığı oluşturulmadı.<br>⚙️ Ayarlar bölümünden ekleyebilirsiniz.</div></div>`;
        return;
    }

    basliklar.forEach(baslik => {
        if (!baslik.sablonlar || baslik.sablonlar.length === 0) return;

        const aktifSablonlar = baslik.sablonlar.filter(s => {
            if (s.tur === "taksitli" && !taksitliGosterilmeliMi(s.id)) return false;
            return true;
        }).sort((a, b) => a.adi.localeCompare(b.adi, 'tr', { sensitivity: 'base' }));

        if (aktifSablonlar.length === 0) return;

        let toplam = aktifSablonlar.reduce((acc, s) => acc + odemeTutariGetir(s.id), 0);
        const kart = document.createElement("section");
        kart.className = "kategori-karti";
        kart.innerHTML = `
            <div class="kategori-baslik">
                <div class="kategori-baslik-isim">${guvenliMetin(baslik.adi)}</div>
                <div class="kategori-toplam" id="kategori-toplam-${baslik.id}">${paraFormatla(toplam)}</div>
            </div>
            <div id="kategori-${baslik.id}"></div>
        `;
        alan.appendChild(kart);

        const satirAlani = kart.querySelector(`#kategori-${baslik.id}`);
        aktifSablonlar.forEach(sablon => {
            satirAlani.appendChild(odemeSatiriOlustur(sablon));
        });
    });
}

function odemeSatiriOlustur(sablon) {
    const satir = document.createElement("div");
    satir.className = "odeme-satiri";
    satir.style.cssText = "background: #fff; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);";
    
    const odeme = odemeVerisiniGetir(sablon.id);
    const val = (d) => (d !== undefined && d !== null ? d : "");

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 13px;">
            <span style="font-weight: 600; color: #333;">${guvenliMetin(sablon.adi)} <span style="font-weight: normal; color: #777; font-size: 11px;">/ ${sablonTuruAdi(sablon.tur)}</span></span>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
    `;

    if (sablon.tur === "normal") {
        html += `
            <div style="flex: 1; display: flex; align-items: center; background: #fafafa; border: 1px solid #ddd; border-radius: 4px; padding: 2px 6px;">
                <input style="border: none; background: transparent; width: 100%; outline: none; font-size: 13px;" type="text" inputmode="decimal" value="${val(odeme.odeme)}" oninput="odemeGuncelle('${sablon.id}', 'odeme', this.value)" placeholder="Bu Ay Ödeme">
                <span style="color: #888; font-size: 12px; margin-left: 4px;">₺</span>
            </div>`;
    } else if (sablon.tur === "taksitli") {
        let gosterilecekTaksit = odeme.kalanTaksit;
        if (gosterilecekTaksit === undefined || gosterilecekTaksit === "" || gosterilecekTaksit === null) {
            let hasHistory = false;
            for (const anahtar in veriler.aylar) {
                const ayVerisi = veriler.aylar[anahtar];
                if (ayVerisi && ayVerisi.odemeler && ayVerisi.odemeler[sablon.id] && ayVerisi.odemeler[sablon.id].kalanTaksit !== undefined && ayVerisi.odemeler[sablon.id].kalanTaksit !== "" && ayVerisi.odemeler[sablon.id].kalanTaksit !== null) {
                    hasHistory = true;
                    break;
                }
            }
            gosterilecekTaksit = hasHistory ? etkinKalanTaksitGetir(sablon.id) : "";
        }
        html += `
            <div style="flex: 1; display: flex; align-items: center; background: #fafafa; border: 1px solid #ddd; border-radius: 4px; padding: 2px 6px;">
                <input style="border: none; background: transparent; width: 100%; outline: none; font-size: 13px;" type="text" inputmode="decimal" value="${val(odeme.odeme)}" oninput="odemeGuncelle('${sablon.id}', 'odeme', this.value)" placeholder="Bu Ay Ödeme">
                <span style="color: #888; font-size: 12px; margin-left: 4px;">₺</span>
            </div>
            <div style="width: 100px; display: flex; align-items: center; background: #fafafa; border: 1px solid #ddd; border-radius: 4px; padding: 2px 6px;">
                <input style="border: none; background: transparent; width: 100%; outline: none; font-size: 13px; text-align: center;" type="text" inputmode="decimal" value="${val(gosterilecekTaksit)}" oninput="odemeGuncelle('${sablon.id}', 'kalanTaksit', this.value)" placeholder="Kalan Taksit">
            </div>`;
    } else if (sablon.tur === "kredikarti") {
        html += `
            <div style="flex: 1; display: flex; align-items: center; background: #fafafa; border: 1px solid #ddd; border-radius: 4px; padding: 2px 6px;">
                <input style="border: none; background: transparent; width: 100%; outline: none; font-size: 13px;" type="text" inputmode="decimal" value="${val(odeme.odeme)}" oninput="odemeGuncelle('${sablon.id}', 'odeme', this.value)" placeholder="Bu Ay Ödeme">
                <span style="color: #888; font-size: 12px; margin-left: 4px;">₺</span>
            </div>
            <div style="flex: 1; display: flex; align-items: center; background: #fafafa; border: 1px solid #ddd; border-radius: 4px; padding: 2px 6px;">
                <input style="border: none; background: transparent; width: 100%; outline: none; font-size: 13px;" type="text" inputmode="decimal" value="${val(odeme.kalanBorc)}" oninput="odemeGuncelle('${sablon.id}', 'kalanBorc', this.value)" placeholder="Kalan Borç">
                <span style="color: #888; font-size: 12px; margin-left: 4px;">₺</span>
            </div>`;
    }

    html += `</div>`;
    satir.innerHTML = html;
    return satir;
}

function odemeGuncelle(sablonId, alan, deger) {
    const ay = aktifAyVerisi();
    if (!ay.odemeler[sablonId]) ay.odemeler[sablonId] = {};
    
    ay.odemeler[sablonId][alan] = deger;
    kaydet();

    genelToplamiHesapla();
    kalanBorclariGuncelle();
    kategoriToplamlariniGuncelle();
}

function kategoriToplamlariniGuncelle() {
    veriler.ayarlar.basliklar.forEach(baslik => {
        if (!baslik.sablonlar) return;
        const aktifSablonlar = baslik.sablonlar.filter(s => {
            if (s.tur === "taksitli" && !taksitliGosterilmeliMi(s.id)) return false;
            return true;
        }).sort((a, b) => a.adi.localeCompare(b.adi, 'tr', { sensitivity: 'base' }));
        let toplam = aktifSablonlar.reduce((acc, s) => acc + odemeTutariGetir(s.id), 0);
        const etiket = document.getElementById(`kategori-toplam-${baslik.id}`);
        if (etiket) etiket.textContent = paraFormatla(toplam);
    });
}

function genelToplamiHesapla() {
    let toplam = 0;
    veriler.ayarlar.basliklar.forEach(b => {
        (b.sablonlar || []).forEach(s => {
            if (s.tur === "taksitli" && !taksitliGosterilmeliMi(s.id)) return;
            toplam += odemeTutariGetir(s.id);
        });
    });
    const genelToplamEl = document.getElementById("genelToplam");
    if (genelToplamEl) genelToplamEl.textContent = paraFormatla(toplam);
}

function kalanBorcHesapla(sablon) {
    const odeme = odemeVerisiniGetir(sablon.id);
    if (sablon.tur === "taksitli") {
        const kalanTaksit = etkinKalanTaksitGetir(sablon.id);
        if (kalanTaksit <= 0) return 0;
        return kalanTaksit * parseSayi(odeme.odeme);
    }
    if (sablon.tur === "kredikarti") {
        return parseSayi(odeme.kalanBorc);
    }
    return 0;
}

function kalanBorclariGuncelle() {
    const alan = document.getElementById("kalanBorclarListesi");
    if (!alan) return;
    alan.innerHTML = "";
    let toplam = 0;
    let borcVar = false;

    veriler.ayarlar.basliklar.forEach(b => {
        const siraliSablonlar = [...(b.sablonlar || [])].sort((a, b) => a.adi.localeCompare(b.adi, 'tr', { sensitivity: 'base' }));
        siraliSablonlar.forEach(s => {
            if (s.tur === "taksitli" && !taksitliGosterilmeliMi(s.id)) return;
            const borc = kalanBorcHesapla(s);
            if (borc > 0) {
                borcVar = true;
                toplam += borc;
                const satir = document.createElement("div");
                satir.className = "borc-satiri";
                satir.innerHTML = `<span class="borc-adi">${guvenliMetin(s.adi)}</span><strong class="borc-miktari">${paraFormatla(borc)}</strong>`;
                alan.appendChild(satir);
            }
        });
    });

    if (!borcVar) {
        alan.innerHTML = `<div class="bos-mesaj">Kayıtlı kalan borç bulunmuyor.</div>`;
    }
    const toplamKalanBorcEl = document.getElementById("toplamKalanBorc");
    if (toplamKalanBorcEl) toplamKalanBorcEl.textContent = paraFormatla(toplam);
}

/* =========================================================
   AY DEĞİŞTİRME
   ========================================================= */

function oncekiAyaGit() {
    aktifTarih.setMonth(aktifTarih.getMonth() - 1);
    localStorage.setItem("aktifTarihAnahtar", ayAnahtari(aktifTarih));
    aktifAyiOlustur();
    ekraniGuncelle();
}

function sonrakiAyaGit() {
    aktifTarih.setMonth(aktifTarih.getMonth() + 1);
    localStorage.setItem("aktifTarihAnahtar", ayAnahtari(aktifTarih));
    aktifAyiOlustur();
    ekraniGuncelle();
}

function buAyaGit() {
    aktifTarih = new Date();
    localStorage.setItem("aktifTarihAnahtar", ayAnahtari(aktifTarih));
    ozetYili = aktifTarih.getFullYear();
    aktifAyiOlustur();
    ekraniGuncelle();
}

/* =========================================================
   AYARLAR VE BAŞLIK YÖNETİMİ
   ========================================================= */

function ayarlariGuncelle() {
    const alan = document.getElementById("basliklarListesi");
    if (!alan) return;
    alan.innerHTML = "";
    const basliklar = veriler.ayarlar.basliklar;

    if (basliklar.length === 0) {
        alan.innerHTML = `<div class="bos-mesaj">Henüz başlık oluşturulmadı.</div>`;
        return;
    }

    basliklar.forEach(b => {
        const satir = document.createElement("div");
        satir.className = "baslik-ayarlari-satiri";
        const sayi = b.sablonlar ? b.sablonlar.length : 0;
        satir.innerHTML = `
            <div class="baslik-bilgi">
                <div class="baslik-adi">${guvenliMetin(b.adi)}</div>
                <div class="baslik-sablon-sayisi">${sayi} ödeme kalemi</div>
            </div>
            <div class="satir-butonlari">
                <button class="kucuk-btn" onclick="sablonSayfasiniAc('${b.id}')">⚙️</button>
                <button class="kucuk-btn" onclick="baslikDuzenle('${b.id}')">✏️</button>
                <button class="kucuk-btn sil" onclick="baslikSil('${b.id}')">🗑️</button>
            </div>
        `;
        alan.appendChild(satir);
    });
}

function baslikEkle() {
    const ad = prompt("Yeni ödeme başlığının adını yazın:");
    if (!ad || !ad.trim()) return;
    veriler.ayarlar.basliklar.push({ id: benzersizId(), adi: ad.trim(), sablonlar: [] });
    kaydet();
    ayarlariGuncelle();
}

function baslikDuzenle(id) {
    const baslik = baslikBul(id);
    if (!baslik) return;
    const yeniAd = prompt("Başlık adını değiştirin:", baslik.adi);
    if (yeniAd === null || !yeniAd.trim()) return;
    baslik.adi = yeniAd.trim();
    kaydet();
    ayarlariGuncelle();
}

function baslikSil(id) {
    const baslik = baslikBul(id);
    if (!baslik) return;
    if (!confirm(`"${baslik.adi}" başlığını ve içindeki tüm kalemleri silmek istediğinize emin misiniz?`)) return;
    veriler.ayarlar.basliklar = veriler.ayarlar.basliklar.filter(b => b.id !== id);
    if (aktifBaslikId === id) aktifBaslikId = null;
    kaydet();
    ayarlariGuncelle();
}

/* =========================================================
   ŞABLON YÖNETİMİ
   ========================================================= */

function sablonSayfasiniAc(baslikId) {
    const baslik = baslikBul(baslikId);
    if (!baslik) return;
    aktifBaslikId = baslikId;
    localStorage.setItem("aktifBaslikId", baslikId);
    sayfaDegistir("sablonlar", { baslikId });
}

function sablonlariGuncelle() {
    const alan = document.getElementById("sablonlarListesi");
    if (!alan) return;
    alan.innerHTML = "";
    const baslik = baslikBul(aktifBaslikId);
    if (!baslik || !baslik.sablonlar || baslik.sablonlar.length === 0) {
        alan.innerHTML = `<div class="bos-mesaj">Henüz ödeme kalemi oluşturulmadı.<br>＋ düğmesine basarak ekleyebilirsiniz.</div>`;
        return;
    }

    const siraliSablonlar = [...baslik.sablonlar].sort((a, b) => a.adi.localeCompare(b.adi, 'tr', { sensitivity: 'base' }));

    siraliSablonlar.forEach(s => {
        const satir = document.createElement("div");
        satir.className = "sablon-satiri";
        satir.innerHTML = `
            <div class="sablon-bilgi">
                <div class="sablon-adi">${guvenliMetin(s.adi)}</div>
                <div class="sablon-turu">${sablonTuruAdi(s.tur)}</div>
            </div>
            <div class="satir-butonlari">
                <button class="kucuk-btn" onclick="sablonDuzenle('${s.id}')">✏️</button>
                <button class="kucuk-btn sil" onclick="sablonSil('${s.id}')">🗑️</button>
            </div>
        `;
        alan.appendChild(satir);
    });
}

function sablonEkle() {
    duzenlenenSablonId = null;
    document.getElementById("sablonAdiInput").value = "";
    document.getElementById("sablonTuruInput").value = "normal";
    sayfaDegistir("sablon-duzenle");
}

function sablonDuzenle(sablonId) {
    const baslik = baslikBul(aktifBaslikId);
    if (!baslik) return;
    const sablon = baslik.sablonlar.find(s => s.id === sablonId);
    if (!sablon) return;

    duzenlenenSablonId = sablonId;
    document.getElementById("sablonAdiInput").value = sablon.adi;
    document.getElementById("sablonTuruInput").value = sablon.tur;
    sayfaDegistir("sablon-duzenle");
}

function sablonKaydet() {
    const baslik = baslikBul(aktifBaslikId);
    if (!baslik) return;
    const ad = document.getElementById("sablonAdiInput").value.trim();
    const tur = document.getElementById("sablonTuruInput").value;

    if (!ad) {
        alert("Lütfen şablon adını yazın.");
        return;
    }

    if (!baslik.sablonlar) baslik.sablonlar = [];

    if (!duzenlenenSablonId) {
        baslik.sablonlar.push({ id: benzersizId(), adi: ad, tur: tur });
    } else {
        const sablon = baslik.sablonlar.find(s => s.id === duzenlenenSablonId);
        if (sablon) {
            sablon.adi = ad;
            sablon.tur = tur;
        }
    }

    kaydet();
    duzenlenenSablonId = null;
    geriGit();
}

function sablonSil(sablonId) {
    const baslik = baslikBul(aktifBaslikId);
    if (!baslik) return;
    const sablon = baslik.sablonlar.find(s => s.id === sablonId);
    if (!sablon || !confirm(`"${sablon.adi}" ödeme kalemini silmek istediğinize emin misiniz?`)) return;

    baslik.sablonlar = baslik.sablonlar.filter(s => s.id !== sablonId);
    kaydet();
    sablonlariGuncelle();
}

function sablonTuruAdi(tur) {
    if (tur === "taksitli") return "Taksitli Borç";
    if (tur === "kredikarti") return "Kredi Kartı";
    return "Normal Ödeme";
}

/* =========================================================
   YEDEKLEME VE VERİ YÖNETİMİ
   ========================================================= */

function jsonDisariAktar() {
    kaydet();
    const blob = new Blob([JSON.stringify(veriler, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OdemeTakip_Yedek_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function jsonIceriAktarAc() {
    document.getElementById("jsonFileInput")?.click();
}

function jsonIceriAktar(event) {
    const dosya = event.target.files[0];
    if (!dosya) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const yeniVeriler = JSON.parse(e.target.result);
            if (!yeniVeriler || !yeniVeriler.ayarlar) throw new Error();

            if (confirm("Mevcut verilerinizin üzerine yedek dosyasındaki veriler yüklenecek. Devam etmek istiyor musunuz?")) {
                veriler = yeniVeriler;
                localStorage.removeItem("aktifBaslikId");
                aktifBaslikId = null;
                kaydet();
                aktifTarih = new Date();
                sayfaDegistir("anasayfa");
                alert("Veriler başarıyla geri yüklendi.");
            }
        } catch {
            alert("JSON dosyası geçersiz veya bozuk.");
        }
        event.target.value = "";
    };
    reader.readAsText(dosya, "UTF-8");
}

function tumVerileriSil() {
    if (!confirm("DİKKAT!\n\nBütün başlıklar, şablonlar ve geçmiş veriler silinecek. Devam etmek istiyor musunuz?")) return;
    if (!confirm("Bu işlem geri alınamaz. Emin misiniz?")) return;

    veriler = { ayarlar: { basliklar: [] }, aylar: {}, sonGuncelleme: null };
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("aktifBaslikId");
    aktifTarih = new Date();
    aktifBaslikId = null;
    duzenlenenSablonId = null;
    kaydet();
    sayfaDegistir("anasayfa");
}

/* =========================================================
   YILLIK ÖZET
   ========================================================= */

function yillikOzetiGuncelle() {
    const ozetYiliEl = document.getElementById("ozetYili");
    if (ozetYiliEl) ozetYiliEl.textContent = ozetYili;
    const aylikAlan = document.getElementById("aylikOzetListesi");
    const kategoriAlan = document.getElementById("kategoriOzetListesi");
    if (!aylikAlan || !kategoriAlan) return;
    aylikAlan.innerHTML = "";
    kategoriAlan.innerHTML = "";

    let yillikToplam = 0;
    const kategoriToplamlari = {};

    for (let ay = 0; ay < 12; ay++) {
        const anahtar = `${ozetYili}-${String(ay + 1).padStart(2, "0")}`;
        const ayVerisi = veriler.aylar[anahtar];
        let aylikToplam = 0;

        if (ayVerisi) {
            Object.keys(ayVerisi.odemeler || {}).forEach(sablonId => {
                // Şablon artık silindiyse yıllık özete dahil etme ve atla!
                const bilgi = sablonBilgisiniBul(sablonId);
                if (!bilgi) return;

                const odemeKayiari = ayVerisi.odemeler[sablonId];
                const tutar = parseSayi(odemeKayiari?.odeme) || parseSayi(odemeKayiari?.kalanBorc);
                aylikToplam += tutar;
                kategoriToplamlari[bilgi.baslik.adi] = (kategoriToplamlari[bilgi.baslik.adi] || 0) + tutar;
            });
        }

        yillikToplam += aylikToplam;
        const satir = document.createElement("div");
        satir.className = "ozet-ay-satiri";
        satir.innerHTML = `<span class="ozet-ay-adi">${AY_ISIMLERI[ay]}</span><strong class="ozet-ay-tutari">${paraFormatla(aylikToplam)}</strong>`;
        aylikAlan.appendChild(satir);
    }

    const yillikToplamEl = document.getElementById("yillikToplam");
    if (yillikToplamEl) yillikToplamEl.textContent = paraFormatla(yillikToplam);

    const kategoriler = Object.keys(kategoriToplamlari);
    if (kategoriler.length === 0) {
        kategoriAlan.innerHTML = `<div class="bos-mesaj">Bu yıl henüz ödeme kaydı bulunmuyor.</div>`;
    } else {
        kategoriler.forEach(kategori => {
            const satir = document.createElement("div");
            satir.className = "kategori-ozet-satiri";
            satir.innerHTML = `<span class="kategori-ozet-adi">${guvenliMetin(kategori)}</span><strong class="kategori-ozet-tutari">${paraFormatla(kategoriToplamlari[kategori])}</strong>`;
            kategoriAlan.appendChild(satir);
        });
    }
}


function sablonBilgisiniBul(sablonId) {
    for (const baslik of veriler.ayarlar.basliklar) {
        if (!baslik.sablonlar) continue;
        const sablon = baslik.sablonlar.find(s => s.id === sablonId);
        if (sablon) return { baslik, sablon };
    }
    return null;
}

function ozetYilAzalt() {
    ozetYili--;
    yillikOzetiGuncelle();
}

function ozetYilArtir() {
    ozetYili++;
    yillikOzetiGuncelle();
}

/* =========================================================
   OTOMATİK AY KONTROLÜ
   ========================================================= */

function otomatikAyKontrolu() {
    const gercekTarih = new Date();
    if (ayAnahtari(aktifTarih) !== ayAnahtari(gercekTarih)) {
        aktifTarih = gercekTarih;
        aktifAyiOlustur();
        ekraniGuncelle();
    }
}

setInterval(otomatikAyKontrolu, 60 * 1000);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") otomatikAyKontrolu();
});
