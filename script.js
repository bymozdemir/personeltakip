    let personeller = JSON.parse(localStorage.getItem('personeller')) || [];
    let sablon = JSON.parse(localStorage.getItem('sablon')) || {};

    let seciliPersonelIds = new Set();
    let aktifPersonelId = null;
    let aktifAnaKategori = null;
    let aktifAltKategori = null;

    function özelBildirimGoster(mesaj) {
      let modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999;
      `;
      modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; max-width: 80%; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          <p style="margin-top:0; font-size: 15px; color: #333; line-height: 1.4; white-space: pre-wrap;">${mesaj}</p>
          <button onclick="this.parentElement.parentElement.remove()" style="background: #1e88e5; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Tamam</button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.addEventListener("DOMContentLoaded", () => {
      try {
        const savedData = localStorage.getItem('personeller');
        if (savedData) personeller = JSON.parse(savedData);
        
        const savedSablon = localStorage.getItem('sablon');
        if (savedSablon) sablon = JSON.parse(savedSablon);
      } catch (e) {
        console.error("Local storage verisi bozuk, sıfırlanıyor:", e);
        localStorage.clear();
      }

      if (!history.state) {
        history.replaceState({ ekran: 'main' }, "");
      }

      let savedState = sessionStorage.getItem('appState');
      if (savedState) {
        try {
          let stateData = JSON.parse(savedState);
          if (stateData.ekran === 'categories' && stateData.personelId) {
            aktifPersonelId = stateData.personelId;
            gorselKategoriEkraniGoster(false);
            personelDetayAc(aktifPersonelId, true);
          } else if (stateData.ekran === 'form' && stateData.personelId && stateData.k1 && stateData.k2) {
            aktifPersonelId = stateData.personelId;
            gorselKategoriEkraniGoster(false);
            personelDetayAc(aktifPersonelId, true);
            formEkraniAc(stateData.k1, stateData.k2, true);
          } else {
            gorselAnaSayfaGoster(false);
          }
        } catch(err) {
          gorselAnaSayfaGoster(false);
        }
      } else {
        gorselAnaSayfaGoster(false);
      }
    });

    window.addEventListener('popstate', (event) => {
      let modal = document.getElementById('ayarlarModal');
      if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        return;
      }

      let viewForm = document.getElementById('viewForm').style.display === 'block';
      let viewCategories = document.getElementById('viewCategories').style.display === 'block';

      if (viewForm) {
        document.getElementById('viewForm').style.display = 'none';
        document.getElementById('viewCategories').style.display = 'block';
        let p = personeller.find(x => String(x.id) === String(aktifPersonelId));
        document.getElementById('headerTitle').innerText = p ? p.adSoyad : "Personel Detay";
        document.getElementById('btnLeft').innerText = "‹ Geri";
        sessionStorage.setItem('appState', JSON.stringify({ ekran: 'categories', personelId: aktifPersonelId }));
      } else if (viewCategories) {
        gorselAnaSayfaGoster(false);
      } else {
        window.history.back();
      }
    });

    function kaydetLocal() {
      try {
        localStorage.setItem('personeller', JSON.stringify(personeller));
        localStorage.setItem('sablon', JSON.stringify(sablon));
      } catch (e) {
        özelBildirimGoster("Kayıt başarısız! Hafıza dolu olabilir.");
      }
    }

    function jsonVeritabaninaKaydet() {
      kaydetLocal();
      özelBildirimGoster("Tüm veriler cihaz hafızasına kaydedildi.");
    }

    function dosyaSeciciAc() {
      const input = document.getElementById('jsonInput');
      input.value = '';
      setTimeout(() => { input.click(); }, 50);
    }

    function jsonDosyasiniIceriAl(event) {
      let file = event.target.files[0];
      if (!file) return;

      let reader = new FileReader();
      reader.onload = function(e) {
        let dosyaIcerigi = e.target.result;
        try {
          let parsedData = JSON.parse(dosyaIcerigi);
          let yuklenecekPersoneller = null;

          if (Array.isArray(parsedData)) {
            yuklenecekPersoneller = parsedData;
          } else if (parsedData && typeof parsedData === 'object') {
            if (Array.isArray(parsedData.personeller)) {
              yuklenecekPersoneller = parsedData.personeller;
            }
            if (parsedData.sablon && typeof parsedData.sablon === 'object') {
              sablon = parsedData.sablon;
              localStorage.setItem('sablon', JSON.stringify(sablon));
            }
          }

          if (!yuklenecekPersoneller || yuklenecekPersoneller.length === 0) {
            throw new Error("Yedek dosyasında geçerli personel kaydı bulunamadı.");
          }

          let eklenenSayisi = 0;
          let atlananSayisi = 0;

          yuklenecekPersoneller.forEach(yedekKisi => {
            let zatenVarMi = personeller.some(p => String(p.id) === String(yedekKisi.id) || (p.adSoyad && yedekKisi.adSoyad && p.adSoyad.toLowerCase() === yedekKisi.adSoyad.toLowerCase()));

            if (!zatenVarMi) {
              personeller.push(yedekKisi);
              eklenenSayisi++;
            } else {
              atlananSayisi++;
            }
          });
          
          kaydetLocal();
          personelListesiniCiz();
          ozelGunleriKontrolEtVeGoster();
          event.target.value = '';
          
          özelBildirimGoster(`Yedek başarıyla birleştirildi!\n• Eklenen Yeni Kişi: ${eklenenSayisi}\n• Zaten Listede Olan (Atlanan): ${atlananSayisi}`);
        } catch (err) {
          özelBildirimGoster("JSON dosyası okunurken hata oluştu: " + err.message);
        }
      };
      reader.readAsText(file);
    }

    function solButonTiklandi() {
      let modal = document.getElementById('ayarlarModal');
      if (modal.style.display === 'flex') {
        ayarlarMenuKapat();
        return;
      }

      let viewCategories = document.getElementById('viewCategories').style.display === 'block';
      let viewForm = document.getElementById('viewForm').style.display === 'block';

      if (viewForm) {
        document.getElementById('viewForm').style.display = 'none';
        document.getElementById('viewCategories').style.display = 'block';
        let p = personeller.find(x => String(x.id) === String(aktifPersonelId));
        document.getElementById('headerTitle').innerText = p ? p.adSoyad : "Personel Detay";
        document.getElementById('btnLeft').innerText = "‹ Geri";
        sessionStorage.setItem('appState', JSON.stringify({ ekran: 'categories', personelId: aktifPersonelId }));
      } else if (viewCategories) {
        gorselAnaSayfaGoster(true);
      } else {
        ayarlarMenuAc();
      }
    }

    function gorselAnaSayfaGoster(pushHistory = true) {
      sessionStorage.setItem('appState', JSON.stringify({ ekran: 'main' }));
      document.getElementById('viewMain').style.display = 'block';
      document.getElementById('viewCategories').style.display = 'none';
      document.getElementById('viewForm').style.display = 'none';

      document.getElementById('headerTitle').innerText = "Personel Listesi";
      let btnLeft = document.getElementById('btnLeft');
      btnLeft.innerText = "Ayarlar";
      btnLeft.style.backgroundColor = "#ff9800";
      
      aktifPersonelId = null;
      personelListesiniCiz();
      ozelGunleriKontrolEtVeGoster();

      if (pushHistory) {
        history.pushState({ ekran: 'main' }, "");
      }
    }

    function gorselKategoriEkraniGoster(pushHistory = true) {
      sessionStorage.setItem('appState', JSON.stringify({ ekran: 'categories', personelId: aktifPersonelId }));
      document.getElementById('viewMain').style.display = 'none';
      document.getElementById('viewCategories').style.display = 'block';
      document.getElementById('viewForm').style.display = 'none';

      let p = personeller.find(x => String(x.id) === String(aktifPersonelId));
      document.getElementById('headerTitle').innerText = p ? p.adSoyad : "Personel Detay";
      let btnLeft = document.getElementById('btnLeft');
      btnLeft.innerText = "‹ Geri";
      btnLeft.style.backgroundColor = "rgba(255,255,255,0.2)";

      if (pushHistory) {
        history.pushState({ ekran: 'categories', personelId: aktifPersonelId }, "");
      }
    }

    function ozelGunleriKontrolEtVeGoster() {
      const panel = document.getElementById('birthdayPanelContainer');
      const listContent = document.getElementById('birthdayListContent');
      listContent.innerHTML = "";

      let yakinGunler = [];
      let bugun = new Date();
      let yarin = new Date();
      yarin.setDate(bugun.getDate() + 1);
      
      let yarinGun = yarin.getDate();
      let yarinAy = yarin.getMonth() + 1;

      personeller.forEach(p => {
        if (!p.veriler) return;

        let personelTel = "";
        Object.keys(p.veriler).forEach(kKey => {
          if (p.veriler[kKey] && p.veriler[kKey][0]) {
            Object.keys(p.veriler[kKey][0]).forEach(field => {
              if (field.toLowerCase().includes('telefon')) {
                personelTel = p.veriler[kKey][0][field];
              }
            });
          }
        });

        Object.keys(p.veriler).forEach(mainKey => {
          let kayitlar = p.veriler[mainKey];
          if (!Array.isArray(kayitlar)) return;

          kayitlar.forEach(kayit => {
            Object.keys(kayit).forEach(alanAdi => {
              let deger = kayit[alanAdi];
              if (!deger) return;

              let parsedDate = parseTarih(deger);
              if (parsedDate) {
                if (parsedDate.gun === yarinGun && parsedDate.ay === yarinAy) {
                  yakinGunler.push({
                    isim: p.adSoyad,
                    etkinlik: alanAdi,
                    telefon: personelTel,
                    metin: `${yarinGun}.${yarinAy} (Yarın) ${p.adSoyad} (${alanAdi})`
                  });
                }
              }
            });
          });
        });
      });

      if (yakinGunler.length > 0) {
        panel.style.display = 'block';
        yakinGunler.forEach(item => {
          let li = document.createElement('li');
          li.className = 'birthday-item';
          
          let temizTel = item.telefon ? item.telefon.replace(/\D/g, '') : '';
          let waButtonHtml = "";
          
          if (temizTel) {
            if (temizTel.startsWith('0') && temizTel.length === 11) temizTel = '90' + temizTel.substring(1);
            else if (temizTel.length === 10) temizTel = '90' + temizTel;

            let waMesaj = encodeURIComponent(`Merhaba ${item.isim}, doğum günün kutlu olsun! Nice mutlu yıllara.`);
            waButtonHtml = `<a href="https://wa.me/${temizTel}?text=${waMesaj}" target="_blank" class="btn-wa-mini">💬 Kutla</a>`;
          } else {
            waButtonHtml = `<span style="font-size:11px; color:#999;">Tel yok</span>`;
          }

          li.innerHTML = `
            <span style="font-weight: 500; color: #d84315;">🔔 ${item.metin}</span>
            ${waButtonHtml}
          `;
          listContent.appendChild(li);
        });
      } else {
        panel.style.display = 'none';
      }
    }

    function parseTarih(val) {
      if (!val) return null;
      val = val.toString().trim();
      let parts = val.split(/[.\/\\-]/);
      if (parts.length >= 2) {
        let g = parseInt(parts[0], 10);
        let a = parseInt(parts[1], 10);
        if (!isNaN(g) && !isNaN(a) && g >= 1 && g <= 31 && a >= 1 && a <= 12) {
          return { gun: g, ay: a };
        }
      }
      return null;
    }

    function personelListesiniCiz(filtre = "") {
      const ul = document.getElementById('personelListesi');
      ul.innerHTML = "";

      let filtrelenmis = personeller.filter(p => p.adSoyad.toLowerCase().includes(filtre.toLowerCase()));

      filtrelenmis.forEach(p => {
        let li = document.createElement('li');
        li.className = "personel-item";
        
        let strId = String(p.id);
        let isChecked = seciliPersonelIds.has(strId) ? "checked" : "";

        li.innerHTML = `
          <input type="checkbox" ${isChecked} onclick="event.stopPropagation(); personelSecimToggle('${strId}', this)">
          <span class="personel-name">${p.adSoyad}</span>
          <span class="arrow">&gt;</span>
        `;

        li.onclick = () => personelDetayAc(strId);
        ul.appendChild(li);
      });

      document.getElementById('toplamPersonelSayisi').innerText = `Toplam: ${personeller.length} Kişi`;
      seciliSayisiniGuncelle();
    }

    function personelDetayAc(id, isRestore = false) {
      aktifPersonelId = String(id);
      let p = personeller.find(x => String(x.id) === aktifPersonelId);
      if(!p) return;

      let container = document.getElementById('kategoriListesi');
      container.innerHTML = "";

      let anaKategoriler = Object.keys(sablon);
      if (anaKategoriler.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; color:#666; padding: 30px 10px; background: white; border-radius: 12px; border: 1px dashed #ccc;">
            <p style="margin-bottom: 10px; font-weight: bold;">Henüz tanımlı bir şablon/menü bulunmuyor.</p>
            <small style="color:#888;">Sol üstteki <span style="color:#ff9800; font-weight:bold;">Ayarlar</span> menüsünden kategori ve alanlar ekleyebilirsiniz.</small>
          </div>
        `;
      } else {
        anaKategoriler.forEach(k1 => {
          let box = document.createElement('div');
          box.style.cssText = "background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; margin-bottom: 12px; padding: 12px; width: 100%;";
          
          let altHtml = "";
          Object.keys(sablon[k1]).forEach(k2 => {
            altHtml += `
              <div onclick="formEkraniAc('${k1}', '${k2}')" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; cursor: pointer;">
                <span style="font-size: 14px; color: #495057;">• ${k2}</span>
                <span style="color: #aaa; font-weight: bold;">&gt;</span>
              </div>
            `;
          });

          box.innerHTML = `
            <div style="font-weight: bold; color: #1e88e5; font-size: 15px; margin-bottom: 6px;">📂 ${k1}</div>
            ${altHtml || '<div style="font-size: 12px; color: #999;">Alt başlık yok</div>'}
          `;
          container.appendChild(box);
        });
      }

      if (!isRestore) {
        gorselKategoriEkraniGoster(true);
      }
    }

    function formEkraniAc(k1, k2, isRestore = false) {
      aktifAnaKategori = k1;
      aktifAltKategori = k2;
      sessionStorage.setItem('appState', JSON.stringify({ ekran: 'form', personelId: aktifPersonelId, k1: k1, k2: k2 }));

      document.getElementById('viewCategories').style.display = 'none';
      document.getElementById('viewForm').style.display = 'block';

      document.getElementById('headerTitle').innerText = `${k2}`;
      let btnLeft = document.getElementById('btnLeft');
      btnLeft.innerText = "‹ Geri";

      let alanlar = (sablon[k1] && sablon[k1][k2]) ? sablon[k1][k2] : [];
      let p = personeller.find(x => String(x.id) === String(aktifPersonelId));
      let mainKey = `${k1}_${k2}`;
      let kayitliVeri = (p && p.veriler && p.veriler[mainKey] && p.veriler[mainKey][0]) ? p.veriler[mainKey][0] : {};

      let container = document.getElementById('formContainer');
      container.innerHTML = "";

      if (alanlar.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; color:#666; padding: 20px 10px;">
            <p style="margin-bottom: 10px;">Bu menünün altında henüz veri alanı bulunmuyor.</p>
            <small style="color:#999;">Ayarlar menüsünden bu kategoriye alanlar ekleyebilirsiniz.</small>
          </div>
        `;
      } else {
        alanlar.forEach(alan => {
          let val = kayitliVeri[alan] || "";
          let placeholderText = "";
          let alanKucuk = alan.toLowerCase();
          
          if (alanKucuk.includes('telefon') || alanKucuk.includes('tel')) {
            placeholderText = "örn. 05554443322";
          } else if (alanKucuk.includes('tarih') || alanKucuk.includes('dogum') || alanKucuk.includes('gün')) {
            placeholderText = "örn. 15.08.1990";
          } else if (alanKucuk.includes('tc') || alanKucuk.includes('kimlik')) {
            placeholderText = "örn. 12345678901";
          }

          let group = document.createElement('div');
          group.className = "form-group";
          group.innerHTML = `
            <label>${alan}</label>
            <input type="text" data-field="${alan}" value="${val}" placeholder="${placeholderText}">
          `;
          container.appendChild(group);
        });
      }

      if (!isRestore) {
        history.pushState({ ekran: 'form', personelId: aktifPersonelId, k1: k1, k2: k2 }, "");
      }
    }

    function verileriKaydet() {
      let p = personeller.find(x => String(x.id) === String(aktifPersonelId));
      if (!p) return;

      if (!p.veriler) p.veriler = {};
      let mainKey = `${aktifAnaKategori}_${aktifAltKategori}`;
      let formData = {};
      let inputs = document.querySelectorAll('#formContainer input');
      
      if (inputs.length === 0) {
        return özelBildirimGoster("Kaydedilecek bir veri alanı bulunmuyor.");
      }

      inputs.forEach(inp => {
        formData[inp.getAttribute('data-field')] = inp.value;
      });

      p.veriler[mainKey] = [formData];
      kaydetLocal();
      özelBildirimGoster("Form verileri cihaz hafızasına kaydedildi.");
      
      document.getElementById('viewForm').style.display = 'none';
      document.getElementById('viewCategories').style.display = 'block';
      document.getElementById('headerTitle').innerText = p.adSoyad;
      document.getElementById('btnLeft').innerText = "‹ Geri";
      sessionStorage.setItem('appState', JSON.stringify({ ekran: 'categories', personelId: aktifPersonelId }));
    }

    function personelAra() {
      let q = document.getElementById('searchInput').value;
      personelListesiniCiz(q);
    }

    function personelSecimToggle(id, checkbox) {
      let strId = String(id);
      if (checkbox.checked) {
        seciliPersonelIds.add(strId);
      } else {
        seciliPersonelIds.delete(strId);
      }
      seciliSayisiniGuncelle();
    }

    function hepsiniSecToggle(checkbox) {
      if (checkbox.checked) {
        personeller.forEach(p => seciliPersonelIds.add(String(p.id)));
      } else {
        seciliPersonelIds.clear();
      }
      personelListesiniCiz(document.getElementById('searchInput').value);
    }

    function seciliSayisiniGuncelle() {
      document.getElementById('seciliSayisi').innerText = seciliPersonelIds.size;
      document.getElementById('selectAllCheckbox').checked = (personeller.length > 0 && seciliPersonelIds.size === personeller.length);
    }

    function yeniPersonelEkle() {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999;
      `;
      modal.innerHTML = `
        <div style="background:white; width:85%; max-width:340px; padding:20px; border-radius:14px; box-shadow:0 4px 20px rgba(0,0,0,0.25);">
          <h3 style="margin-top:0; color:#1e88e5;">➕ Yeni Personel</h3>
          <input id="yeniPersonelInput" type="text" placeholder="Adı Soyadı" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px; font-size:14px; margin-top:8px; box-sizing: border-box;">
         <input id="yeniSicilInput" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="6 Haneli Sicil No (ID)" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px; font-size:14px; margin-top:10px; box-sizing: border-box;">
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
            <button id="iptalBtn" style="background:#999; color:white; border:none; padding:10px 16px; border-radius:8px; font-weight:bold; cursor:pointer;">İptal</button>
            <button id="kaydetBtn" style="background:#00897b; color:white; border:none; padding:10px 16px; border-radius:8px; font-weight:bold; cursor:pointer;">Kaydet</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const isimInput = modal.querySelector('#yeniPersonelInput');
      const sicilInput = modal.querySelector('#yeniSicilInput');
      isimInput.focus();

      modal.querySelector('#iptalBtn').onclick = () => modal.remove();
      modal.querySelector('#kaydetBtn').onclick = () => {
        const isim = isimInput.value.trim();
        const sicilNo = sicilInput.value.trim();

        if (!isim) { isimInput.focus(); return; }
        
        if (!sicilNo || sicilNo.length < 3) {
          özelBildirimGoster("Lütfen geçerli bir sicil numarası girin.");
          sicilInput.focus();
          return;
        }

        const cakisanPersonel = personeller.find(p => String(p.id) === sicilNo);
        if (cakisanPersonel) {
          özelBildirimGoster(`Bu sicil numarası zaten "${cakisanPersonel.adSoyad}" adına kayıtlı!`);
          return;
        }

        personeller.push({ id: sicilNo, adSoyad: isim, veriler: {} });
        kaydetLocal();
        personelListesiniCiz();
        modal.remove();
        özelBildirimGoster(`"${isim}" personeli eklendi.`);
      };
    }

    function secilileriSil() {
      if (seciliPersonelIds.size === 0) {
        return özelBildirimGoster("Lütfen silinecek en az bir personel seçin!");
      }
      if (confirm(`${seciliPersonelIds.size} kişiyi silmek istediğinizden emin misiniz?`)) {
        personeller = personeller.filter(p => !seciliPersonelIds.has(String(p.id)));
        seciliPersonelIds.clear();
        kaydetLocal();
        personelListesiniCiz();
      }
    }

    function whatsappKonumIste() {
      if (seciliPersonelIds.size === 0) {
        return özelBildirimGoster("Lütfen konum istemek için en az bir personel seçin!");
      }

      let seciliId = Array.from(seciliPersonelIds)[0];
      let p = personeller.find(x => String(x.id) === String(seciliId));
      let tel = "";

      if (p && p.veriler) {
        Object.keys(p.veriler).forEach(key => {
          if (p.veriler[key] && p.veriler[key][0]) {
            Object.keys(p.veriler[key][0]).forEach(field => {
              if (field.toLowerCase().includes('telefon')) {
                tel = p.veriler[key][0][field];
              }
            });
          }
        });
      }

      if (!tel) {
        return özelBildirimGoster(`${p.adSoyad} isimli personelin telefon numarası kayıtlarda bulunamadı!`);
      }

      let temizTel = tel.replace(/\D/g, '');
      if (temizTel.startsWith('0') && temizTel.length === 11) {
        temizTel = '90' + temizTel.substring(1);
      } else if (temizTel.length === 10) {
        temizTel = '90' + temizTel;
      }

      let mesaj = encodeURIComponent(`Merhaba ${p.adSoyad}, lütfen güncel canlı konumunuzu bu sohbet üzerinden paylaşabilir misiniz?`);
      const whatsappUrl = 'https://wa.me/' + temizTel + '?text=' + mesaj;

      try {
        window.open(whatsappUrl, '_blank');
      } catch (e) {
        özelBildirimGoster("WhatsApp açılamadı. Lütfen tarayıcınızın pop-up engelleyicisini kontrol edin.");
      }
    }

    function ayarlarMenuAc() {
      sablonListesiniCiz();
      document.getElementById('ayarlarModal').style.display = 'flex';
    }

    function ayarlarMenuKapat() {
      document.getElementById('ayarlarModal').style.display = 'none';
    }

    function sablonListesiniCiz() {
      const container = document.getElementById('sablonListesiContainer');
      const select = document.getElementById('anaKategoriSecici');
      container.innerHTML = "";
      select.innerHTML = "";

      let anaKategoriler = Object.keys(sablon);

      if (anaKategoriler.length === 0) {
        select.innerHTML = '<option value="">Önce ana kategori ekleyin</option>';
        container.innerHTML = '<div style="color: #888; font-style: italic; text-align: center; padding: 10px;">Henüz kategori eklenmemiş.</div>';
        return;
      }

      anaKategoriler.forEach(k1 => {
        let opt = document.createElement('option');
        opt.value = k1;
        opt.innerText = k1;
        select.appendChild(opt);

        let catBox = document.createElement('div');
        catBox.style.cssText = "background: #f9f9f9; padding: 8px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #e0e0e0;";
        
        let altKategorilerHtml = "";
        Object.keys(sablon[k1]).forEach(k2 => {
          let alanlar = sablon[k1][k2] || [];
          let alanlarHtml = alanlar.map(alan => `
            <span style="display:inline-flex; align-items:center; background:#e0e0e0; padding:3px 8px; border-radius:6px; margin-right:4px; margin-bottom:4px; border:1px solid #ccc; font-size: 11px;">
              ${alan}
              <button onclick="alanDuzenle('${k1}', '${k2}', '${alan}')" style="background:none; border:none; color:#1e88e5; cursor:pointer; font-size:12px; margin-left:6px; padding:0;" title="Düzenle">✏️</button>
              <button onclick="alanSil('${k1}', '${k2}', '${alan}')" style="background:none; border:none; color:#e53935; cursor:pointer; font-size:12px; margin-left:6px; padding:0;" title="Sil">❌</button>
            </span>
          `).join("");

          let alanlarText = alanlar.length > 0 ? `<div style="margin-top:4px; display:flex; flex-wrap:wrap;">${alanlarHtml}</div>` : "<div style='color:#999; margin-top:2px; font-size: 11px;'>Alan yok</div>";

          altKategorilerHtml += `
            <div style="margin-left: 10px; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #ddd;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; font-size: 13px;">• ${k2}</span>
                <div style="display:flex; gap: 6px;">
                  <button onclick="altKategoriDuzenle('${k1}', '${k2}')" style="background: #1e88e5; border: none; color: white; cursor: pointer; font-size: 10px; padding: 3px 6px; border-radius: 4px;">Düzenle</button>
                  <button onclick="altKategoriSil('${k1}', '${k2}')" style="background: #e53935; border: none; color: white; cursor: pointer; font-size: 10px; padding: 3px 6px; border-radius: 4px;">Sil</button>
                </div>
              </div>
              <div>${alanlarText}</div>
              <button onclick="alanEkle('${k1}', '${k2}')" style="background: #00897b; color: white; border: none; padding: 3px 10px; border-radius: 4px; font-size: 10px; margin-top: 8px; cursor: pointer;">+ Alan Ekle</button>
            </div>
          `;
        });

        catBox.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; color: #1e88e5;">
            <span>📂 ${k1}</span>
            <div style="display:flex; gap: 6px;">
              <button onclick="anaKategoriDuzenle('${k1}')" style="background: #1e88e5; border: none; color: white; cursor: pointer; font-size: 11px; padding: 4px 8px; border-radius: 4px;">Düzenle</button>
              <button onclick="anaKategoriSil('${k1}')" style="background: #e53935; border: none; color: white; cursor: pointer; font-size: 11px; padding: 4px 8px; border-radius: 4px;">Sil</button>
            </div>
          </div>
          ${altKategorilerHtml}
        `;
        container.appendChild(catBox);
      });
    }

    function anaKategoriDuzenle(eskiAd) {
      let yeniAd = prompt("Yeni ana kategori adını girin:", eskiAd);
      if (!yeniAd || yeniAd.trim() === "" || yeniAd === eskiAd) return;
      yeniAd = yeniAd.trim();
      if (sablon[yeniAd]) return özelBildirimGoster("Bu isimde bir ana kategori zaten var.");

      sablon[yeniAd] = sablon[eskiAd];
      delete sablon[eskiAd];

      personeller.forEach(p => {
        if (p.veriler) {
          Object.keys(sablon[yeniAd]).forEach(k2 => {
            let eskiKey = `${eskiAd}_${k2}`;
            let yeniKey = `${yeniAd}_${k2}`;
            if (p.veriler[eskiKey]) {
              p.veriler[yeniKey] = p.veriler[eskiKey];
              delete p.veriler[eskiKey];
            }
          });
        }
      });

      kaydetLocal();
      sablonListesiniCiz();
      özelBildirimGoster("Ana kategori adı başarıyla güncellendi.");
    }

    function altKategoriDuzenle(k1, eskiAd) {
      let yeniAd = prompt("Yeni alt kategori adını girin:", eskiAd);
      if (!yeniAd || yeniAd.trim() === "" || yeniAd === eskiAd) return;
      yeniAd = yeniAd.trim();
      if (sablon[k1][yeniAd]) return özelBildirimGoster("Bu isimde bir alt kategori zaten var.");

      sablon[k1][yeniAd] = sablon[k1][eskiAd];
      delete sablon[k1][eskiAd];

      let eskiKey = `${k1}_${eskiAd}`;
      let yeniKey = `${k1}_${yeniAd}`;
      personeller.forEach(p => {
        if (p.veriler && p.veriler[eskiKey]) {
          p.veriler[yeniKey] = p.veriler[eskiKey];
          delete p.veriler[eskiKey];
        }
      });

      kaydetLocal();
      sablonListesiniCiz();
      özelBildirimGoster("Alt kategori adı başarıyla güncellendi.");
    }

    function alanDuzenle(k1, k2, eskiAd) {
      let yeniAd = prompt("Yeni alan adını girin:", eskiAd);
      if (!yeniAd || yeniAd.trim() === "" || yeniAd === eskiAd) return;
      yeniAd = yeniAd.trim();

      let index = sablon[k1][k2].indexOf(eskiAd);
      if (index === -1) return;
      if (sablon[k1][k2].includes(yeniAd)) return özelBildirimGoster("Bu isimde bir alan zaten var.");

      sablon[k1][k2][index] = yeniAd;

      let mainKey = `${k1}_${k2}`;
      personeller.forEach(p => {
        if (p.veriler && p.veriler[mainKey]) {
          p.veriler[mainKey].forEach(kayit => {
            if (kayit[eskiAd] !== undefined) {
              kayit[yeniAd] = kayit[eskiAd];
              delete kayit[eskiAd];
            }
          });
        }
      });

      kaydetLocal();
      sablonListesiniCiz();
      özelBildirimGoster("Alan adı başarıyla güncellendi.");
    }

    function alanSil(k1, k2, alanAd) {
      if (confirm(`'${alanAd}' alanını silmek istediğinize emin misiniz?`)) {
        sablon[k1][k2] = sablon[k1][k2].filter(a => a !== alanAd);
        let mainKey = `${k1}_${k2}`;
        personeller.forEach(p => {
          if (p.veriler && p.veriler[mainKey]) {
            p.veriler[mainKey].forEach(kayit => {
              if (kayit[alanAd] !== undefined) {
                delete kayit[alanAd];
              }
            });
          }
        });
        kaydetLocal();
        sablonListesiniCiz();
      }
    }

    function anaKategoriEkle() {
      let val = document.getElementById('yeniAnaKategoriInput').value.trim();
      if (!val) return özelBildirimGoster("Lütfen bir kategori adı yazın.");
      if (sablon[val]) return özelBildirimGoster("Bu kategori zaten var.");
      sablon[val] = {};
      document.getElementById('yeniAnaKategoriInput').value = "";
      kaydetLocal();
      sablonListesiniCiz();
    }

    function altKategoriEkle() {
      let k1 = document.getElementById('anaKategoriSecici').value;
      let val = document.getElementById('yeniAltKategoriInput').value.trim();
      if (!k1) return özelBildirimGoster("Önce bir ana kategori seçin veya ekleyin.");
      if (!val) return özelBildirimGoster("Lütfen alt kategori adı yazın.");
      if (sablon[k1][val]) return özelBildirimGoster("Bu alt kategori zaten var.");
      sablon[k1][val] = []; 
      document.getElementById('yeniAltKategoriInput').value = "";
      kaydetLocal();
      sablonListesiniCiz();
    }

    function alanEkle(k1, k2) {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999;
      `;
      modal.innerHTML = `
        <div style="background:white; width:85%; max-width:340px; padding:20px; border-radius:14px; box-shadow:0 4px 20px rgba(0,0,0,0.25);">
          <h3 style="margin-top:0; color:#00897b;">➕ Yeni Alan</h3>
          <div style="font-size:13px; color:#666; margin-bottom:10px;">${k2} altına eklenecek alan adı</div>
          <input id="yeniAlanInput" type="text" placeholder="Örn: Eş Doğum Tarihi" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px; font-size:14px;">
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
            <button id="alanIptalBtn" style="background:#999; color:white; border:none; padding:10px 16px; border-radius:8px; font-weight:bold;">İptal</button>
            <button id="alanKaydetBtn" style="background:#00897b; color:white; border:none; padding:10px 16px; border-radius:8px; font-weight:bold;">Ekle</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const input = modal.querySelector('#yeniAlanInput');
      input.focus();

      modal.querySelector('#alanIptalBtn').onclick = () => modal.remove();
      modal.querySelector('#alanKaydetBtn').onclick = () => {
        const alanAdi = input.value.trim();
        if (!alanAdi) { input.focus(); return; }
        if (!Array.isArray(sablon[k1][k2])) sablon[k1][k2] = [];
        if (sablon[k1][k2].includes(alanAdi)) return özelBildirimGoster("Bu alan zaten eklenmiş.");

        sablon[k1][k2].push(alanAdi);
        kaydetLocal();
        sablonListesiniCiz();
        modal.remove();
        özelBildirimGoster(`"${alanAdi}" alanı eklendi.`);
      };
    }

    function anaKategoriSil(k1) {
      if (confirm(`'${k1}' kategorisini silmek istediğinize emin misiniz?`)) {
        delete sablon[k1];
        kaydetLocal();
        sablonListesiniCiz();
      }
    }

    function altKategoriSil(k1, k2) {
      if (confirm(`'${k2}' alt başlığını silmek istediğinize emin misiniz?`)) {
        delete sablon[k1][k2];
        kaydetLocal();
        sablonListesiniCiz();
      }
    }

    function yedekOlustur() {
      try {
        let yedek = {
          personeller: personeller,
          sablon: sablon,
          tarih: new Date().toLocaleString("tr-TR"),
          uygulama: "Tim Bilgileri Mobil"
        };
        let json = JSON.stringify(yedek, null, 2);
        let blob = new Blob([json], { type: "application/json" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "tim_bilgileri_yedek.txt";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
        özelBildirimGoster("Yedek dosyası indirildi.");
      } catch (e) {
        özelBildirimGoster("Yedek oluşturulurken hata oluştu: " + e.message);
      }
    }

        function exportExcel() {
      if (typeof XLSX === 'undefined') return özelBildirimGoster("Excel kütüphanesi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.");
      if (seciliPersonelIds.size === 0) return özelBildirimGoster("Dışa aktarmak için en az bir personel seçin!");

      let anaKategoriler = Object.keys(sablon);
      if (anaKategoriler.length === 0) {
        return özelBildirimGoster("Dışa aktarılacak kategori bulunmuyor.");
      }

      // Kategori seçim modalı oluştur
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 9999;
      `;

      let kategoriCheckboxHtml = '';
      anaKategoriler.forEach(k1 => {
        kategoriCheckboxHtml += `<div style="font-weight: bold; color: #1e88e5; margin-top: 10px;">📂 ${k1}</div>`;
        Object.keys(sablon[k1]).forEach(k2 => {
          let mainKey = `${k1}_${k2}`;
          kategoriCheckboxHtml += `
            <label style="display: flex; align-items: center; gap: 8px; margin-left: 15px; margin-top: 5px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" class="excel-kategori-cb" value="${mainKey}" checked style="cursor: pointer;">
              ${k2}
            </label>
          `;
        });
      });

      modal.innerHTML = `
        <div style="background:white; width:90%; max-width:380px; max-height:80vh; overflow-y:auto; padding:20px; border-radius:14px; box-shadow:0 4px 20px rgba(0,0,0,0.25);">
          <h3 style="margin-top:0; color:#1e88e5; font-size:16px;">📊 Excel'e Aktarılacak Alanlar</h3>
          <div style="font-size:12px; color:#666; margin-bottom:10px;">Excel'de görünmesini istediğiniz kategorileri seçin:</div>
          <div style="border: 1px solid #eee; padding: 10px; border-radius: 8px; background: #fafafa; margin-bottom: 15px; text-align: left;">
            ${kategoriCheckboxHtml}
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button id="excelIptalBtn" style="background:#999; color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:bold; cursor:pointer;">İptal</button>
            <button id="excelOnayBtn" style="background:#00897b; color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:bold; cursor:pointer;">Excel İndir</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#excelIptalBtn').onclick = () => modal.remove();
      modal.querySelector('#excelOnayBtn').onclick = () => {
        let secilenMainKeyler = new Set();
        modal.querySelectorAll('.excel-kategori-cb:checked').forEach(cb => {
          secilenMainKeyler.add(cb.value);
        });

        if (secilenMainKeyler.size === 0) {
          özelBildirimGoster("Lütfen en az bir kategori seçin!");
          return;
        }

        modal.remove();
        gercekExcelAktariminiYap(secilenMainKeyler);
      };
    }

    function gercekExcelAktariminiYap(secilenMainKeyler) {
      let maxKayitSayilari = {};
      Object.keys(sablon).forEach(k1 => {
        Object.keys(sablon[k1]).forEach(k2 => {
          let mainKey = `${k1}_${k2}`;
          if (!secilenMainKeyler.has(mainKey)) return;

          let maxCount = 1;
          personeller.forEach(p => {
            if (seciliPersonelIds.has(String(p.id)) && p.veriler && p.veriler[mainKey]) {
              if (p.veriler[mainKey].length > maxCount) maxCount = p.veriler[mainKey].length;
            }
          });
          maxKayitSayilari[mainKey] = maxCount;
        });
      });

      let sutunHaritasi = [
        { header: 'Sicil No', isStatic: true, key: 'id' },
        { header: 'Adı Soyadı', isStatic: true, key: 'adSoyad' }
      ];

      Object.keys(sablon).forEach(k1 => {
        Object.keys(sablon[k1]).forEach(k2 => {
          let mainKey = `${k1}_${k2}`;
          if (!secilenMainKeyler.has(mainKey)) return;

          let alanlar = sablon[k1][k2] || [];
          let tekrarSayisi = maxKayitSayilari[mainKey] || 1;

          for (let i = 0; i < tekrarSayisi; i++) {
            alanlar.forEach(alan => {
              let baslikSuffix = tekrarSayisi > 1 ? ` ${i + 1}` : '';
              sutunHaritasi.push({ header: `${alan}${baslikSuffix} (${k1} > ${k2})`, mainKey: mainKey, index: i, alan: alan });
            });
          }
        });
      });

      let excelMatris = [];
      excelMatris.push(sutunHaritasi.map(s => s.header));

      personeller.forEach(p => {
        if (seciliPersonelIds.has(String(p.id))) {
          let satir = [];
          sutunHaritasi.forEach(s => {
            if (s.isStatic) {
              satir.push(p[s.key] !== undefined ? p[s.key] : '');
            } else {
              let kayitListesi = p.veriler ? p.veriler[s.mainKey] : null;
              if (kayitListesi && kayitListesi[s.index] && kayitListesi[s.index][s.alan] !== undefined) {
                satir.push(kayitListesi[s.index][s.alan]);
              } else {
                satir.push('');
              }
            }
          });
          excelMatris.push(satir);
        }
      });

      let ws = XLSX.utils.aoa_to_sheet(excelMatris);
      let wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Personel Listesi");

      try {
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'Personel_Secmeli_Liste.xlsx';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
        özelBildirimGoster('Seçilen kategoriler ile Excel dosyası indirildi.');
      } catch(e) {
        özelBildirimGoster('Dışa aktarma hatası: ' + e.message);
      }
    }


    function importExcel(event) {
      if (typeof XLSX === 'undefined') return özelBildirimGoster("Excel kütüphanesi yüklenemedi.");
      let file = event.target.files[0];
      if (!file) return;

      let reader = new FileReader();
      reader.onload = function(e) {
        try {
          let data = new Uint8Array(e.target.result);
          let workbook = XLSX.read(data, { type: 'array' });
          let firstSheetName = workbook.SheetNames[0];
          let worksheet = workbook.Sheets[firstSheetName];
          let json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (json.length < 2) return özelBildirimGoster("Dosya boş veya geçersiz format.");

          let basliklar = json[0];
          let eklenenSayisi = 0;
          let guncellenenSayisi = 0;

          let adSoyadIndex = basliklar.findIndex(b => b && b.toString().trim().toLowerCase().includes('ad'));
          let idIndex = basliklar.findIndex(b => b && (['id', 'sicil no', 'personel kodu'].includes(b.toString().trim().toLowerCase())));
          if (adSoyadIndex === -1) adSoyadIndex = 1;

          basliklar.forEach((baslik, colIdx) => {
            if (colIdx === idIndex || colIdx === adSoyadIndex || !baslik) return;
            let match = baslik.toString().match(/(.*)\((.*)\)/);
            if (match) {
              let hamAlanAdi = match[1].trim();
              let icerik = match[2].trim();
              let alanAdi = hamAlanAdi.replace(/\s+\d+$/, '').trim();

              let anaKat = null;
              let altKat = null;

              if (icerik.includes('>')) {
                let parcalar = icerik.split('>');
                anaKat = parcalar[0].trim();
                altKat = parcalar[1].trim();
              } else {
                altKat = icerik;
                Object.keys(sablon).forEach(k1 => { if (sablon[k1][altKat]) anaKat = k1; });
                if (!anaKat) {
                  if (!sablon['Genel Bilgiler']) sablon['Genel Bilgiler'] = {};
                  anaKat = 'Genel Bilgiler';
                }
              }

              if (!sablon[anaKat]) sablon[anaKat] = {};
              if (!sablon[anaKat][altKat]) sablon[anaKat][altKat] = [];
              if (!sablon[anaKat][altKat].includes(alanAdi)) sablon[anaKat][altKat].push(alanAdi);
            }
          });

          for (let i = 1; i < json.length; i++) {
            let satir = json[i];
            if (!satir || satir.length === 0) continue;

            let adSoyadVal = satir[adSoyadIndex] ? satir[adSoyadIndex].toString().trim() : '';
            if (!adSoyadVal) continue;

            let excelId = (idIndex !== -1 && satir[idIndex]) ? String(satir[idIndex]) : null;
            let mevcutPersonel = personeller.find(p => p.adSoyad.toLowerCase() === adSoyadVal.toLowerCase());

            if (!mevcutPersonel) {
              let idCakismasiVarMi = excelId && personeller.some(p => String(p.id) === excelId);
              let atanacakId = (excelId && !idCakismasiVarMi) ? excelId : String(Date.now() + i);

              mevcutPersonel = { id: atanacakId, adSoyad: adSoyadVal, veriler: {} };
              personeller.push(mevcutPersonel);
              eklenenSayisi++;
            } else {
              guncellenenSayisi++;
            }

            basliklar.forEach((baslik, colIdx) => {
              if (colIdx === idIndex || colIdx === adSoyadIndex || !baslik) return;
              let val = satir[colIdx] !== undefined ? satir[colIdx].toString().trim() : '';
              if (!val) return;

              let match = baslik.toString().match(/(.*)\((.*)\)/);
              if (match) {
                let hamAlanAdi = match[1].trim();
                let icerik = match[2].trim();
                let alanAdi = hamAlanAdi.replace(/\s+\d+$/, '').trim();

                let anaKat = null;
                let altKat = null;

                if (icerik.includes('>')) {
                  let parcalar = icerik.split('>');
                  anaKat = parcalar[0].trim();
                  altKat = parcalar[1].trim();
                } else {
                  altKat = icerik;
                  Object.keys(sablon).forEach(k1 => { if (sablon[k1][altKat]) anaKat = k1; });
                  if (!anaKat) anaKat = 'Genel Bilgiler';
                }

                if (sablon[anaKat] && sablon[anaKat][altKat]) {
                  let mainKey = `${anaKat}_${altKat}`;
                  if (!mevcutPersonel.veriler) mevcutPersonel.veriler = {};
                  if (!mevcutPersonel.veriler[mainKey]) mevcutPersonel.veriler[mainKey] = [{}];
                  mevcutPersonel.veriler[mainKey][0][alanAdi] = val;
                }
              }
            });
          }

          kaydetLocal();
          personelListesiniCiz();
          ozelGunleriKontrolEtVeGoster();
          event.target.value = '';
          özelBildirimGoster(`${eklenenSayisi} yeni personel eklendi, ${guncellenenSayisi} personel güncellendi.\nKategoriler Excel'den başarıyla geri yüklendi.`);
        } catch (err) {
          özelBildirimGoster("Excel işlenirken hata oluştu: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
