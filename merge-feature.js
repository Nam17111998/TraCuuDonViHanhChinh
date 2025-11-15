(function () {
  const MERGER_DATA_URL = "dataThamKhao/json/data-new.json";

  let mergerByWardCode = new Map();
  let isMergerLoaded = false;

  function loadMergerData() {
    if (isMergerLoaded) return Promise.resolve();

    return fetch(MERGER_DATA_URL)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Khong the tai du lieu sap nhap");
        }
        return res.json();
      })
      .then((raw) => {
        mergerByWardCode = new Map();
        if (Array.isArray(raw)) {
          raw.forEach((item) => {
            const code = String(item.ward_code || "").trim();
            if (!code) return;

            const info = {
              wardCode: code,
              wardName: item.ward_name || "",
              provinceCode: String(item.province_code || "").trim(),
              provinceName: item.province_name || "",
              hasMerger: Boolean(item.has_merger),
              oldUnits: Array.isArray(item.old_units)
                ? item.old_units.filter(Boolean)
                : [],
              oldUnitsCount: Number.isFinite(Number(item.old_units_count))
                ? Number(item.old_units_count)
                : null,
              provinceIsMerged: Boolean(item.province_is_merged),
              provinceMergedWith: Array.isArray(item.province_merged_with)
                ? item.province_merged_with.filter(Boolean)
                : [],
              administrativeCenter: item.administrative_center || "",
            };

            mergerByWardCode.set(code, info);
          });
        }

        isMergerLoaded = true;
      })
      .catch((error) => {
        console.error("Loi tai du lieu sap nhap:", error);
      });
  }

  function updateMergeBox(wardCode) {
    const box = document.getElementById("mergeBox");
    const summaryEl = document.getElementById("mergeSummary");
    const listEl = document.getElementById("mergeOldUnits");
    const extraEl = document.getElementById("mergeExtra");

    if (!box || !summaryEl || !listEl || !extraEl) return;

    box.hidden = true;
    summaryEl.textContent = "";
    listEl.innerHTML = "";
    extraEl.textContent = "";

    const code = (wardCode || "").trim();
    if (!code || !isMergerLoaded || !mergerByWardCode.has(code)) {
      return;
    }

    const info = mergerByWardCode.get(code);
    if (!info || !info.hasMerger || !info.oldUnits.length) {
      return;
    }

    const count = info.oldUnitsCount || info.oldUnits.length;
    summaryEl.textContent =
      "Được hình thành từ " +
      count +
      " đơn vị hành chính trước đây:";

    info.oldUnits.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      listEl.appendChild(li);
    });

    const extraParts = [];
    if (info.provinceIsMerged && info.provinceMergedWith.length) {
      extraParts.push(
        "Tỉnh sáp nhập cùng: " + info.provinceMergedWith.join(", ")
      );
    }
    if (info.administrativeCenter) {
      extraParts.push("Trung tâm hành chính: " + info.administrativeCenter);
    }
    if (extraParts.length) {
      extraEl.textContent = extraParts.join(" · ");
    }

    box.hidden = false;
  }

  function setupObservers() {
    const codeEl = document.getElementById("selectedWardCode");
    if (codeEl && window.MutationObserver) {
      const observer = new MutationObserver(() => {
        const code = (codeEl.textContent || "").trim();
        updateMergeBox(code);
      });
      observer.observe(codeEl, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    const wardSelect = document.getElementById("wardSelect");
    if (wardSelect) {
      wardSelect.addEventListener("change", () => {
        const code = wardSelect.value || "";
        updateMergeBox(code);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadMergerData().then(() => {
      setupObservers();
    });
  });
})();

