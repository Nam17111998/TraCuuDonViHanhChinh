(function () {
  async function loadAdminData() {
    try {
      const url =
        typeof MAIN_DATA_URL === "string"
          ? MAIN_DATA_URL
          : "dataThamKhao/json/data.json";

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Khong the tai du lieu 3 cap tu data.json");
      }

      const raw = await res.json();

      const provinceMap = new Map();

      if (Array.isArray(raw)) {
        if (raw.length && raw[0] && Array.isArray(raw[0].wards)) {
          raw.forEach((p) => {
            const baseProvinceCode = String(p.province_code || "").trim();
            const baseProvinceName = p.name || "";
            if (!baseProvinceCode || !baseProvinceName) return;

            let provinceEntry = provinceMap.get(baseProvinceCode);
            if (!provinceEntry) {
              provinceEntry = {
                code: baseProvinceCode,
                name: baseProvinceName,
                shortName: p.short_name || baseProvinceName,
                type: p.place_type || "",
                wards: [],
              };
              provinceMap.set(baseProvinceCode, provinceEntry);
            }

            if (Array.isArray(p.wards)) {
              p.wards.forEach((w) => {
                const wardCode = String(w.ward_code || "").trim();
                const wardName = w.name || "";
                const wardProvinceCode = String(
                  w.province_code || baseProvinceCode
                ).trim();
                if (!wardCode || !wardName || !wardProvinceCode) return;

                let entry = provinceMap.get(wardProvinceCode);
                if (!entry) {
                  entry = {
                    code: wardProvinceCode,
                    name: baseProvinceName,
                    shortName: baseProvinceName,
                    type: p.place_type || "",
                    wards: [],
                  };
                  provinceMap.set(wardProvinceCode, entry);
                }

                entry.wards.push({
                  code: wardCode,
                  name: wardName,
                });
              });
            }
          });
        } else {
          raw.forEach((item) => {
            const provinceCode = String(item.province_code || "").trim();
            const provinceName = item.province_name || "";
            if (!provinceCode || !provinceName) return;

            let provinceEntry = provinceMap.get(provinceCode);
            if (!provinceEntry) {
              provinceEntry = {
                code: provinceCode,
                name: provinceName,
                shortName: item.province_short_name || provinceName,
                type: item.place_type || "",
                wards: [],
              };
              provinceMap.set(provinceCode, provinceEntry);
            }

            const wardCode = String(item.ward_code || "").trim();
            const wardName = item.ward_name || "";
            if (wardCode && wardName) {
              provinceEntry.wards.push({
                code: wardCode,
                name: wardName,
              });
            }
          });
        }
      }

      adminProvinces = [];
      adminDistricts = [];
      adminWards = [];
      adminProvinceByCode = new Map();
      adminDistrictsByProvince = new Map();
      adminWardsByDistrict = new Map();
      adminWardByCode = new Map();

      provinceMap.forEach((entry, provinceCode) => {
        const province = {
          code: provinceCode,
          name: entry.name,
          shortName: entry.shortName || entry.name,
          type: entry.type || "",
        };

        adminProvinces.push(province);
        adminProvinceByCode.set(provinceCode, province);

        if (!entry.wards || !entry.wards.length) {
          return;
        }

        const districtCode = provinceCode + "-ALL";
        const districtName =
          "ToA�n t��%nh " + (province.shortName || province.name);

        const district = {
          code: districtCode,
          name: districtName,
          shortName: districtName,
          type: "Tong hop",
          provinceCode,
        };

        adminDistricts.push(district);
        adminDistrictsByProvince.set(provinceCode, [district]);

        const wardList = [];
        const sortedWards = entry.wards
          .slice()
          .sort((a, b) =>
            (a.name || "").localeCompare(b.name || "", "vi", {
              sensitivity: "base",
            })
          );

        sortedWards.forEach((w) => {
          const ward = {
            code: w.code,
            name: w.name,
            shortName: w.name,
            type: "XA�/Ph����?ng",
            districtCode,
          };

          adminWards.push(ward);
          adminWardByCode.set(ward.code, ward);
          wardList.push(ward);
        });

        adminWardsByDistrict.set(districtCode, wardList);
      });

      isAdminDataLoaded = true;
    } catch (error) {
      console.error("L��-i t���i d��_ li���u 3 c���p t��� data.json:", error);
      throw error;
    }
  }

  window.loadAdminData = loadAdminData;
})();

