"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllProvinces, getAmphoesByProvince, getDistrictsByAmphoe } from "@/lib/thai-address";
import { PROVINCE_TO_REGION } from "@/lib/constants";

interface AddressValue {
  province?: string | null;
  district?: string | null; // amphoe
  subdistrict?: string | null; // tambon
  region?: string | null;
  postal_code?: string | null;
}

export default function AddressPicker({
  value,
  onChange,
}: {
  value: AddressValue;
  onChange: (patch: AddressValue) => void;
}) {
  const provinces = useMemo(() => getAllProvinces(), []);
  const [amphoes, setAmphoes] = useState<string[]>([]);
  const [districts, setDistricts] = useState<{ district: string; zipcode: string }[]>([]);

  useEffect(() => {
    if (value.province) {
      setAmphoes(getAmphoesByProvince(value.province));
    } else {
      setAmphoes([]);
    }
  }, [value.province]);

  useEffect(() => {
    if (value.province && value.district) {
      setDistricts(getDistrictsByAmphoe(value.province, value.district));
    } else {
      setDistricts([]);
    }
  }, [value.province, value.district]);

  const handleProvince = (p: string) => {
    onChange({
      province: p,
      district: "",
      subdistrict: "",
      postal_code: "",
      region: PROVINCE_TO_REGION[p] ?? "",
    });
  };

  const handleAmphoe = (a: string) => {
    onChange({ district: a, subdistrict: "", postal_code: "" });
  };

  const handleDistrict = (d: string) => {
    const row = districts.find((r) => r.district === d);
    onChange({ subdistrict: d, postal_code: row?.zipcode ?? "" });
  };

  const FIELD =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)] disabled:bg-gray-50 disabled:text-gray-400";
  const LABEL = "block text-sm font-medium text-gray-700";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className={LABEL}>จังหวัด *</label>
        <select
          required
          className={FIELD}
          value={value.province ?? ""}
          onChange={(e) => handleProvince(e.target.value)}
        >
          <option value="">-- เลือกจังหวัด --</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL}>อำเภอ / เขต *</label>
        <select
          required
          className={FIELD}
          disabled={!value.province}
          value={value.district ?? ""}
          onChange={(e) => handleAmphoe(e.target.value)}
        >
          <option value="">
            {value.province ? "-- เลือกอำเภอ --" : "-- เลือกจังหวัดก่อน --"}
          </option>
          {amphoes.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL}>ตำบล / แขวง *</label>
        <select
          required
          className={FIELD}
          disabled={!value.district}
          value={value.subdistrict ?? ""}
          onChange={(e) => handleDistrict(e.target.value)}
        >
          <option value="">
            {value.district ? "-- เลือกตำบล --" : "-- เลือกอำเภอก่อน --"}
          </option>
          {districts.map((d) => (
            <option key={d.district} value={d.district}>
              {d.district}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL}>ภูมิภาค</label>
        <input
          readOnly
          className={`${FIELD} bg-gray-50 text-gray-500`}
          placeholder="(อัตโนมัติ)"
          value={value.region ?? ""}
        />
      </div>

      <div>
        <label className={LABEL}>รหัสไปรษณีย์</label>
        <input
          readOnly
          className={`${FIELD} bg-gray-50 text-gray-600 font-mono`}
          placeholder="xxxxx"
          value={value.postal_code ?? ""}
        />
      </div>
    </div>
  );
}
