(function () {
  const ADMIN_INFO_URL = "dataThamKhao/json/vietnam-address.json";

  let adminInfoByCode = new Map();
  let adminInfoLoaded = false;

  let lastWeatherKey = "";
  let holidaysLoadedYear = null;
  let holidaysCount = null;
  let holidaysList = [];

  let poiMap = null;
  let poiLayerGroup = null;
  let lastPoiKey = "";

  function normalizeText(str) {
    if (!str) return "";
    return str
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .toLowerCase()
      .trim();
  }

  async function loadAdminInfo() {
    if (adminInfoLoaded) return;

    try {
      const res = await fetch(ADMIN_INFO_URL);
      if (!res.ok) {
        throw new Error("Khong the tai du lieu dia chi hanh chinh");
      }

      const raw = await res.json();
      const list = Array.isArray(raw.result)
        ? raw.result
        : Array.isArray(raw)
        ? raw
        : [];

      adminInfoByCode = new Map();

      list.forEach((item) => {
        const level = Number(item.CAP_DIACHINH || 0);
        if (level !== 1) return;

        const code = String(item.MA_DIACHINH || item.MA_SO || "").trim();
        const name = item.TEN_DIACHINH || "";
        if (!code || !name) return;

        const info = {
          code,
          name,
          officeAddress: item.TRU_SO || "",
          centerName: item.TEN_TRUNGTAM_HANHCHINH || "",
          scale: item.QUY_MO || "",
          totalUnits:
            typeof item.SOLUONG_XA === "number"
              ? item.SOLUONG_XA
              : typeof item.SOLUONG_DVHC_CAPXA === "number"
              ? item.SOLUONG_DVHC_CAPXA
              : null,
          area: typeof item.DIEN_TICH === "number" ? item.DIEN_TICH : null,
          postalCode: item.MA_BUUDIEN || "",
          vehicleCode: item.MA_BIENSOXE || "",
          phoneCode: item.MA_DIENTHOAI || "",
          lat:
            typeof item.LAT_TRUNGDIEM === "string" ||
            typeof item.LAT_TRUNGDIEM === "number"
              ? parseFloat(item.LAT_TRUNGDIEM)
              : NaN,
          lng:
            typeof item.LONG_TRUNGDIEM === "string" ||
            typeof item.LONG_TRUNGDIEM === "number"
              ? parseFloat(item.LONG_TRUNGDIEM)
              : NaN,
        };

        adminInfoByCode.set(code, info);
      });

      adminInfoLoaded = true;
    } catch (error) {
      console.error("Loi tai du lieu trung tam hanh chinh:", error);
    }
  }

  function findAdminInfoForCurrentProvince() {
    const provinceSelect = document.getElementById("provinceSelect");
    const provinceSpan = document.getElementById("selectedProvince");
    if (!provinceSelect || !provinceSpan || !adminInfoLoaded) return null;

    const code = (provinceSelect.value || "").trim();
    const name = (provinceSpan.textContent || "").trim();

    if (code && adminInfoByCode.has(code)) {
      return adminInfoByCode.get(code);
    }

    const target = normalizeText(name);
    if (!target) return null;

    let found = null;
    adminInfoByCode.forEach((info) => {
      if (!found && normalizeText(info.name) === target) {
        found = info;
      }
    });

    return found;
  }

  function updateAdminCenterView() {
    const addrSpan = document.getElementById("adminCenterAddress");
    const scaleSpan = document.getElementById("provinceScale");
    const totalUnitsSpan = document.getElementById("provinceTotalUnits");
    const areaSpan = document.getElementById("provinceArea");
    const postalSpan = document.getElementById("provincePostalCode");
    const vehicleSpan = document.getElementById("provinceVehicleCode");
    const phoneSpan = document.getElementById("provincePhoneCode");
    const btn = document.getElementById("showAdminCenterBtn");

    if (!addrSpan || !btn) return;

    addrSpan.textContent = "";
    if (scaleSpan) scaleSpan.textContent = "";
    if (totalUnitsSpan) totalUnitsSpan.textContent = "";
    if (areaSpan) areaSpan.textContent = "";
    if (postalSpan) postalSpan.textContent = "";
    if (vehicleSpan) vehicleSpan.textContent = "";
    if (phoneSpan) phoneSpan.textContent = "";

    btn.disabled = true;
    btn.dataset.lat = "";
    btn.dataset.lng = "";

    const info = findAdminInfoForCurrentProvince();
    if (!info) {
      updateWeatherForCurrentProvince(null);
      updateHolidaysInfo();
      updatePoiForCurrentProvince(null);
      return;
    }

    const parts = [];
    if (info.centerName) parts.push(info.centerName);
    if (info.officeAddress) parts.push(info.officeAddress);
    addrSpan.textContent = parts.join(" - ");

    if (scaleSpan && info.scale) {
      scaleSpan.textContent = info.scale;
    }

    if (
      totalUnitsSpan &&
      info.totalUnits != null &&
      !Number.isNaN(info.totalUnits)
    ) {
      totalUnitsSpan.textContent = String(info.totalUnits);
    }

    if (areaSpan && info.area != null && !Number.isNaN(info.area)) {
      areaSpan.textContent = String(info.area);
    }

    if (postalSpan && info.postalCode) {
      postalSpan.textContent = info.postalCode;
    }

    if (vehicleSpan && info.vehicleCode) {
      vehicleSpan.textContent = info.vehicleCode;
    }

    if (phoneSpan && info.phoneCode) {
      phoneSpan.textContent = info.phoneCode;
    }

    if (!Number.isNaN(info.lat) && !Number.isNaN(info.lng)) {
      btn.disabled = false;
      btn.dataset.lat = String(info.lat);
      btn.dataset.lng = String(info.lng);
    } else if (addrSpan.textContent.trim()) {
      btn.disabled = false;
    }

    updateWeatherForCurrentProvince(info);
    updateHolidaysInfo();
    updatePoiForCurrentProvince(info);
  }

  async function updateWeatherForCurrentProvince(info) {
    const weatherEl = document.getElementById("provinceWeather");
    if (!weatherEl) return;

    if (!info || Number.isNaN(info.lat) || Number.isNaN(info.lng)) {
      weatherEl.textContent = "";
      lastWeatherKey = "";
      return;
    }

    const key = `${info.code}|${info.lat}|${info.lng}`;
    if (key === lastWeatherKey) {
      return;
    }
    lastWeatherKey = key;

    const provinceName = info.name || "";
    weatherEl.dataset.provinceName = provinceName;
    weatherEl.textContent = `Đang tải thời tiết${
      provinceName ? ` ở ${provinceName}...` : "..."
    }`;

    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      encodeURIComponent(info.lat) +
      "&longitude=" +
      encodeURIComponent(info.lng) +
      "&current_weather=true&timezone=auto";

    try {
      const res = await fetch(url);
      if (!res.ok) {
        weatherEl.textContent = "Không tải được dữ liệu thời tiết";
        return;
      }

      const data = await res.json();
      const current = data && data.current_weather;
      if (!current) {
        weatherEl.textContent = "Không có dữ liệu thời tiết";
        return;
      }

      const temp =
        typeof current.temperature === "number"
          ? current.temperature.toFixed(1)
          : current.temperature;
      const wind = current.windspeed;
      const unit = "°C";

      weatherEl.textContent =
        "Thời tiết hôm nay" +
        (provinceName ? ` ở ${provinceName}` : "") +
        `: ${temp}${unit}, gió ${wind} km/h.`;
    } catch (error) {
      console.error("Loi tai du lieu thoi tiet:", error);
      weatherEl.textContent = "Không tải được dữ liệu thời tiết";
    }
  }

  async function updateHolidaysInfo() {
    const holidaysEl = document.getElementById("provinceHolidays");
    if (!holidaysEl) return;

    const year = new Date().getFullYear();

    if (holidaysLoadedYear === year && holidaysCount != null) {
      holidaysEl.textContent = `Năm ${year} có ${holidaysCount} ngày nghỉ lễ toàn quốc.`;
      return;
    }

    holidaysEl.textContent = `Đang tải ngày nghỉ lễ năm ${year}...`;

    const url =
      "https://date.nager.at/api/v3/PublicHolidays/" + year + "/VN";

    try {
      const res = await fetch(url);
      if (!res.ok) {
        holidaysEl.textContent = "Không tải được dữ liệu ngày nghỉ lễ.";
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      holidaysLoadedYear = year;
      holidaysCount = list.length;
      holidaysList = list;

      if (!list.length) {
        holidaysEl.textContent = `Năm ${year} không có dữ liệu ngày nghỉ lễ.`;
        return;
      }

      holidaysEl.textContent = `Năm ${year} có ${holidaysCount} ngày nghỉ lễ toàn quốc.`;
    } catch (error) {
      console.error("Loi tai du lieu ngay nghi le:", error);
      holidaysEl.textContent = "Không tải được dữ liệu ngày nghỉ lễ.";
    }
  }

  async function updatePoiForCurrentProvince(info) {
    const poiMapEl = document.getElementById("poiMap");
    const poiListEl = document.getElementById("poiList");
    if (!poiMapEl || !poiListEl) return;

    poiListEl.innerHTML = "";

    if (
      !info ||
      Number.isNaN(info.lat) ||
      Number.isNaN(info.lng) ||
      typeof window.L === "undefined"
    ) {
      if (poiMap) {
        poiMap.remove();
        poiMap = null;
        poiLayerGroup = null;
      }
      return;
    }

    const key = `${info.code}|${info.lat}|${info.lng}`;
    if (key === lastPoiKey && poiMap) {
      return;
    }
    lastPoiKey = key;

    const lat = info.lat;
    const lng = info.lng;
    const delta = 0.5;
    const south = lat - delta;
    const north = lat + delta;
    const west = lng - delta;
    const east = lng + delta;

    const query = `
      [out:json][timeout:25];
      (
        node["tourism"="museum"](${south},${west},${north},${east});
        node["historic"](${south},${west},${north},${east});
        node["leisure"="park"](${south},${west},${north},${east});
      );
      out center 40;
    `;

      poiListEl.textContent = "Đang tải địa điểm nổi bật...";

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      if (!res.ok) {
        poiListEl.textContent = "Không tải được danh sách địa điểm.";
        return;
      }

      const data = await res.json();
      const elements = Array.isArray(data.elements) ? data.elements : [];
      if (!elements.length) {
        poiListEl.textContent = "Chưa có dữ liệu địa điểm nổi bật.";
        return;
      }

      poiListEl.textContent = "";

      if (!poiMap) {
        poiMap = L.map("poiMap");
        poiLayerGroup = L.layerGroup().addTo(poiMap);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(poiMap);
      } else if (poiLayerGroup) {
        poiLayerGroup.clearLayers();
      }

      const bounds = [];
      const frag = document.createDocumentFragment();

      elements.slice(0, 40).forEach((el) => {
        const plat = el.lat || (el.center && el.center.lat);
        const plng = el.lon || (el.center && el.center.lon);
        if (typeof plat !== "number" || typeof plng !== "number") return;

        const tags = el.tags || {};
        const name = tags["name:vi"] || tags.name || "";
        const type = tags.tourism || tags.historic || tags.leisure || "";

        const li = document.createElement("li");
        li.textContent = name
          ? `${name}${type ? " (" + type + ")" : ""}`
          : `Địa điểm không tên${type ? " (" + type + ")" : ""}`;

        let marker = null;
        if (poiLayerGroup) {
          marker = L.marker([plat, plng]);
          let popup = "";
          if (name) popup += "<strong>" + name + "</strong>";
          if (type) popup += (popup ? "<br>" : "") + "Loại: " + type;
          marker.bindPopup(popup || "Địa điểm");
          marker.addTo(poiLayerGroup);
        }

        li.addEventListener("click", () => {
          if (poiMap) {
            poiMap.setView([plat, plng], 14);
          }
          if (marker) {
            marker.openPopup();
          }
        });

        frag.appendChild(li);
        bounds.push([plat, plng]);
      });

      poiListEl.appendChild(frag);

      if (poiMap && bounds.length) {
        poiMap.fitBounds(bounds, { padding: [16, 16] });
      }
    } catch (error) {
      console.error("Loi tai du lieu Overpass:", error);
      poiListEl.textContent = "Không tải được danh sách địa điểm.";
    }
  }

  function setupAdminCenter() {
    const btn = document.getElementById("showAdminCenterBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        const mapFrame = document.getElementById("mapFrame");
        if (!mapFrame) return;

        const lat = parseFloat(btn.dataset.lat || "");
        const lng = parseFloat(btn.dataset.lng || "");

        let url = "";
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          const zoom = 13;
          url =
            "https://www.google.com/maps?q=" +
            lat +
            "," +
            lng +
            "&z=" +
            zoom +
            "&output=embed";
        } else {
          const addrSpan = document.getElementById("adminCenterAddress");
          const text = addrSpan ? addrSpan.textContent.trim() : "";
          if (!text) return;
          url =
            "https://www.google.com/maps?q=" +
            encodeURIComponent(text) +
            "&z=13&output=embed";
        }

        mapFrame.src = url;
      });
    }

    const weatherEl = document.getElementById("provinceWeather");
    if (weatherEl) {
      weatherEl.style.cursor = "pointer";
      weatherEl.title = "Nhấp để xem chi tiết thời tiết";
      weatherEl.addEventListener("click", () => {
        const name =
          (weatherEl.dataset.provinceName || "").trim() ||
          (document.getElementById("selectedProvince")?.textContent || "").trim();
        if (!name) return;
        const q = "thời tiết " + name;
        const url =
          "https://www.google.com/search?q=" + encodeURIComponent(q);
        window.open(url, "_blank");
      });
    }

    const holidaysEl = document.getElementById("provinceHolidays");
    const holidaysListEl = document.getElementById("holidayList");
    if (holidaysEl && holidaysListEl) {
      holidaysEl.style.cursor = "pointer";
      holidaysEl.title = "Nhấp để xem chi tiết các ngày nghỉ lễ";
      holidaysEl.addEventListener("click", () => {
        if (!holidaysList || !holidaysList.length) return;

        const isHidden = holidaysListEl.hasAttribute("hidden");
        if (isHidden) {
          holidaysListEl.innerHTML = "";
          holidaysList.forEach((h) => {
            const li = document.createElement("li");
            const date = h.date || "";
            const name = h.localName || h.name || "";
            li.textContent =
              date && name ? `${date} - ${name}` : date || name;
            holidaysListEl.appendChild(li);
          });
          holidaysListEl.removeAttribute("hidden");
        } else {
          holidaysListEl.setAttribute("hidden", "hidden");
        }
      });
    }

    const provinceSpan = document.getElementById("selectedProvince");
    if (provinceSpan && window.MutationObserver) {
      const observer = new MutationObserver(() => {
        updateAdminCenterView();
      });
      observer.observe(provinceSpan, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    updateAdminCenterView();
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadAdminInfo().then(() => {
      setupAdminCenter();
    });
  });
})();
