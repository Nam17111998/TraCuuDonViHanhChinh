(function () {
  const ADMIN_INFO_URL = "dataThamKhao/json/vietnam-address.json";

  let adminInfoByCode = new Map();
  let adminInfoLoaded = false;

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
        if (level !== 1) return; // chi lay cap tinh/thanh

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
    if (!info) return;

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
