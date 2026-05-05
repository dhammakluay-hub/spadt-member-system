"use client";

/* eslint-disable @typescript-eslint/no-require-imports */
// thai-address-database is CommonJS; use require inside helpers to avoid SSR import issues.

type AddressRow = {
  province: string;
  amphoe: string;
  district: string;
  zipcode: string;
};

let _rows: AddressRow[] | null = null;
function loadRows(): AddressRow[] {
  if (_rows) return _rows;
  // Pull all provinces from the package and flatten
  // The package exposes searchAddressByProvince/Amphoe/District functions
  const db = require("thai-address-database") as {
    searchAddressByProvince: (q: string, limit?: number) => AddressRow[];
  };
  // Collect by iterating the preloaded DB JSON
  const dbJson = require("thai-address-database/database/db.json") as unknown;
  // The package doesn't export the full list directly; reconstruct via searching each province.
  // Instead we rely on searchAddressByProvince with no limit by searching empty/wildcard.
  // Workaround: ask package for each known province by calling once with "". If unsupported,
  // we traverse the decompressed structure ourselves.
  try {
    // Try empty search (package may return full list)
    const all = db.searchAddressByProvince("", 99999);
    if (Array.isArray(all) && all.length > 0) {
      _rows = all;
      return _rows;
    }
  } catch {
    // ignore
  }
  // Fallback: walk dbJson if structure is accessible (compressed form requires decode)
  // We'll rely on per-province searching when rendering dropdowns.
  _rows = [];
  void dbJson;
  return _rows;
}

let _provinces: string[] | null = null;
export function getAllProvinces(): string[] {
  if (_provinces) return _provinces;
  // 77 provinces of Thailand
  _provinces = [
    "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น",
    "จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่",
    "ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช",
    "นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี",
    "ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","พะเยา","พังงา",
    "พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต","มหาสารคาม",
    "มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี",
    "ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ",
    "สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี",
    "สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง","อำนาจเจริญ",
    "อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี",
  ];
  return _provinces;
}

const _amphoeCache = new Map<string, string[]>();
export function getAmphoesByProvince(province: string): string[] {
  if (!province) return [];
  if (_amphoeCache.has(province)) return _amphoeCache.get(province)!;
  const db = require("thai-address-database") as {
    searchAddressByProvince: (q: string, limit?: number) => AddressRow[];
  };
  const rows = db.searchAddressByProvince(province, 9999) ?? [];
  const amphoes = Array.from(
    new Set(rows.filter((r) => r.province === province).map((r) => r.amphoe))
  ).sort();
  _amphoeCache.set(province, amphoes);
  return amphoes;
}

const _districtCache = new Map<string, AddressRow[]>();
export function getDistrictsByAmphoe(
  province: string,
  amphoe: string
): { district: string; zipcode: string }[] {
  if (!province || !amphoe) return [];
  const key = `${province}|${amphoe}`;
  if (_districtCache.has(key)) {
    return _districtCache.get(key)!.map((r) => ({ district: r.district, zipcode: r.zipcode }));
  }
  const db = require("thai-address-database") as {
    searchAddressByAmphoe: (q: string, limit?: number) => AddressRow[];
  };
  const rows = (db.searchAddressByAmphoe(amphoe, 9999) ?? []).filter(
    (r) => r.province === province && r.amphoe === amphoe
  );
  _districtCache.set(key, rows);
  return rows.map((r) => ({ district: r.district, zipcode: r.zipcode }));
}

// Also used internally above; export for convenience
void loadRows;
