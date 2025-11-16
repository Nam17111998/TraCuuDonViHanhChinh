(function () {
  const ADMIN_INFO_URL = "dataThamKhao/json/vietnam-address.json";
  const MAX_RESULTS = 5;

  let districts = [];
  let isLoaded = false;

  function parseNumber(value) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) {
      const n = Number(value.trim());
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  }

  function normalizeText(str) {
    if (!str) return "";
    return str
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/�`/g, "d")
      .replace(/�?/g, "d")
      .toLowerCase()
      .trim();
  }

  async function loadDistricts() {
    if (isLoaded) return;

    try {
      const res = await fetch(ADMIN_INFO_URL);
      if (!res.ok) {
        throw new Error("Khong the tai du lieu dia chi cap 2");
      }

      const raw = await res.json();
      const list = Array.isArray(raw.result)
        ? raw.result
        : Array.isArray(raw)
        ? raw
        : [];

      districts = [];

      list.forEach((item) => {
        const level = Number(item.CAP_DIACHINH || 0);
        if (level !== 2) return;

        const lat = parseNumber(item.LAT_TRUNGDIEM);
        const lng = parseNumber(item.LONG_TRUNGDIEM);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const code = String(item.MA_DIACHINH || item.MA_SO || "").trim();
        const name = item.TEN_DIACHINH || "";
        const parentCode = String(
          item.MA_DIACHINH_CAPTREN || item.MA_SO_CAPTREN || ""
        ).trim();
        const parentName = item.TEN_DIACHINH_CAPTREN || "";

        if (!code || !name) return;

        districts.push({
          code,
          name,
          parentCode,
          parentName,
          lat,
          lng,
          address: item.TRU_SO || "",
          centerRaw: item.TEN_TRUNGTAM_HANHCHINH || "",
          mergeRaw: item.TRUOC_SAPNHAP || "",
          extraRaw: item.TEN_DIACHINH_CU || "",
        });
      });

      isLoaded = true;
    } catch (error) {
      console.error("Loi tai du lieu cap 2:", error);
      throw error;
    }
  }

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (v) => (v * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function renderNearby(list, statusEl, ulEl, origin) {
    if (!statusEl || !ulEl) return;

    ulEl.innerHTML = "";

    if (!list.length) {
      statusEl.textContent =
        "Khong tim thay don vi hanh chinh cap 2 co toa do phu hop.";
      return;
    }

    statusEl.textContent = "";

    list.forEach((item) => {
      const li = document.createElement("li");
      li.className = "nearby-item";

      const title = document.createElement("div");
      title.className = "nearby-item-title";
      title.textContent = item.name;

      const subtitle = document.createElement("div");
      subtitle.className = "nearby-item-subtitle";
      const parts = [];
      if (item.parentName) parts.push(item.parentName);
      if (item.address) parts.push(item.address);
      subtitle.textContent = parts.join(" - ");

      const meta = document.createElement("div");
      meta.className = "nearby-item-meta";
      const distanceKm = item.distanceKm.toFixed(1);
      meta.textContent = distanceKm + " km";

      const actions = document.createElement("div");
      actions.className = "nearby-item-actions";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "Chỉ đường";
      btn.addEventListener("click", () => {
        const url =
          "https://www.google.com/maps/dir/" +
          encodeURIComponent(origin.lat + "," + origin.lng) +
          "/" +
          encodeURIComponent(item.lat + "," + item.lng);
        window.open(url, "_blank");
      });

      actions.appendChild(btn);

      li.appendChild(title);
      li.appendChild(subtitle);
      li.appendChild(meta);
      li.appendChild(actions);

      ulEl.appendChild(li);
    });
  }

  function renderProvinceDistricts(provinceName, wardName, list, statusEl, ulEl) {
    if (!statusEl || !ulEl) return;

    ulEl.innerHTML = "";

    if (!list.length) {
      statusEl.textContent =
        "Khong tim thay UBND cap 2 trong tinh da chon.";
      return;
    }

    const pName = (provinceName || "").trim();
    const wName = (wardName || "").trim();

    if (wName && pName) {
      statusEl.textContent =
        "Danh sach UBND cap 2 gan khu vuc " + wName + ", " + pName + ":";
    } else if (pName) {
      statusEl.textContent =
        "Danh sach UBND cap 2 trong tinh " + pName + ":";
    } else {
      statusEl.textContent =
        "Danh sach UBND cap 2 trong tinh da chon:";
    }

    list.forEach((item) => {
      const li = document.createElement("li");
      li.className = "nearby-item";

      const title = document.createElement("div");
      title.className = "nearby-item-title";
      title.textContent = item.name;

      const subtitle = document.createElement("div");
      subtitle.className = "nearby-item-subtitle";
      const parts = [];
      if (item.parentName) parts.push(item.parentName);
      if (item.address) parts.push(item.address);
      subtitle.textContent = parts.join(" - ");

      const meta = document.createElement("div");
      meta.className = "nearby-item-meta";
      meta.textContent = "Don vi hanh chinh cap 2";

      const actions = document.createElement("div");
      actions.className = "nearby-item-actions";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "Xem tren ban do";
      btn.addEventListener("click", () => {
        const url =
          "https://www.google.com/maps?q=" +
          encodeURIComponent(item.lat + "," + item.lng);
        window.open(url, "_blank");
      });

      actions.appendChild(btn);

      li.appendChild(title);
      li.appendChild(subtitle);
      li.appendChild(meta);
      li.appendChild(actions);

      ulEl.appendChild(li);
    });
  }

  function findNearestDistricts(lat, lng, limit) {
    const origin = { lat, lng };

    const enriched = districts
      .map((d) => ({
        ...d,
        distanceKm: haversine(lat, lng, d.lat, d.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      origin,
      list: enriched.slice(0, limit > 0 ? limit : MAX_RESULTS),
    };
  }

  function setup() {
    const geoBtn = document.getElementById("findNearbyDistrictBtn");
    const provinceBtn = document.getElementById("findProvinceDistrictsBtn");
    const statusEl = document.getElementById("nearbyStatus");
    const listEl = document.getElementById("nearbyDistrictList");
    const provinceSelect = document.getElementById("provinceSelect");
    const wardSelect = document.getElementById("wardSelect");

    // Chi hoat dong khi da co nut va vung hien thi
    if (!geoBtn || !statusEl || !listEl) return;

    // Chi tu dong cap nhat khi nguoi dung da bam nut "UBND trong khu vuc dang chon"
    let autoUpdateSelection = false;

    async function updateForCurrentSelection() {
      if (!provinceSelect) return;

      const provinceCode = (provinceSelect.value || "").trim();

      if (!provinceCode) {
        statusEl.textContent =
          "Chon Tinh/Thanh de xem danh sach UBND cap 2.";
        listEl.innerHTML = "";
        return;
      }

      statusEl.textContent =
        "Dang tai danh sach UBND cap 2 trong tinh da chon...";
      listEl.innerHTML = "";

      try {
        await loadDistricts();
      } catch (error) {
        statusEl.textContent =
          "Khong the tai du lieu don vi hanh chinh cap 2.";
        return;
      }

      const filtered = districts.filter(
        (d) => (d.parentCode || "").trim() === provinceCode
      );

      let list = filtered;
      let wardCode = "";
      let wardName = "";

      if (wardSelect) {
        wardCode = (wardSelect.value || "").trim();
      }

      const wardSpan = document.getElementById("selectedWard");
      if (!wardName && wardSpan && wardSpan.textContent) {
        wardName = wardSpan.textContent.trim();
      }

      const hasWardSelection = Boolean(wardCode || wardName);

      if (hasWardSelection) {
        const key = normalizeText(wardName);
        if (key) {
          const byWard = filtered.filter((d) => {
            const combined = [
              d.name,
              d.parentName,
              d.address,
              d.centerRaw,
              d.mergeRaw,
              d.extraRaw,
            ]
              .filter(Boolean)
              .join(" ");
            return normalizeText(combined).includes(key);
          });

          if (byWard.length) {
            list = byWard;
          }
        }
      }

      const sorted = list
        .slice()
        .sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", "vi", {
            sensitivity: "base",
          })
        );

      const provinceSpan = document.getElementById("selectedProvince");
      const provinceName =
        (provinceSpan && provinceSpan.textContent) || "";

      renderProvinceDistricts(provinceName, wardName, sorted, statusEl, listEl);
    }

    if (provinceBtn) {
      provinceBtn.addEventListener("click", () => {
        autoUpdateSelection = true;
        updateForCurrentSelection();
      });
    }

    // Tim gan toi bang GPS
    geoBtn.addEventListener("click", async () => {
      if (!navigator.geolocation) {
        statusEl.textContent =
          "Trinh duyet khong ho tro dinh vi (Geolocation).";
        return;
      }

      statusEl.textContent = "Dang tai du lieu va lay vi tri...";
      listEl.innerHTML = "";

      try {
        await loadDistricts();
      } catch (error) {
        statusEl.textContent =
          "Khong the tai du lieu don vi hanh chinh cap 2.";
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            statusEl.textContent = "Khong lay duoc toa do hop le.";
            return;
          }

          const { origin, list } = findNearestDistricts(lat, lng, MAX_RESULTS);
          renderNearby(list, statusEl, listEl, origin);
        },
        (err) => {
          console.error("Loi geolocation:", err);
          if (err && err.code === 1) {
            statusEl.textContent =
              "Ban da tu choi quyen truy cap vi tri. Vui long cho phep neu muon tim gan ban.";
          } else {
            statusEl.textContent =
              "Khong the lay duoc vi tri hien tai.";
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });

    // Sau khi nguoi dung da bam nut khu vuc, moi tu dong cap nhat khi doi tinh / xa phuong
    if (provinceSelect) {
      provinceSelect.addEventListener("change", () => {
        if (!autoUpdateSelection) return;
        updateForCurrentSelection();
      });
    }

    if (wardSelect) {
      wardSelect.addEventListener("change", () => {
        if (!autoUpdateSelection) return;
        updateForCurrentSelection();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", setup);
})(); 
