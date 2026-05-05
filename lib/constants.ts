/**
 * SPADT Thailand — Shared Constants
 * Sports list (27) and Classification codes (167) per IPC / IF.
 */

export const SPADT_BRAND = {
  name: "SPADT Thailand",
  fullName: "สมาคมกีฬาคนพิการแห่งประเทศไทย",
  tagline: "Member Management System",
} as const;

export type MemberStatus = "pending" | "approved" | "rejected" | "expired";

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  expired: "หมดอายุ",
};

/** 27 sports recognised by SPADT (matched to original system) */
export const SPORTS: { code: string; name_th: string; name_en: string; federation?: string }[] = [
  { code: "CYC", name_th: "กีฬาจักรยาน", name_en: "Para Cycling", federation: "UCI" },
  { code: "FNC", name_th: "กีฬาวีลแชร์ฟันดาบ", name_en: "Wheelchair Fencing", federation: "IWAS" },
  { code: "WCB", name_th: "กีฬาวีลแชร์บาสเกตบอล", name_en: "Wheelchair Basketball", federation: "IWBF" },
  { code: "WCT", name_th: "กีฬาวีลแชร์เทนนิส", name_en: "Wheelchair Tennis", federation: "ITF" },
  { code: "WCR", name_th: "กีฬาวีลแชร์รักบี้", name_en: "Wheelchair Rugby", federation: "WWR" },
  { code: "PWL", name_th: "กีฬายกน้ำหนัก", name_en: "Para Powerlifting", federation: "World Para Powerlifting" },
  { code: "BAD", name_th: "กีฬาแบดมินตัน", name_en: "Para Badminton", federation: "BWF" },
  { code: "TTE", name_th: "กีฬาเทเบิลเทนนิส", name_en: "Para Table Tennis", federation: "ITTF" },
  { code: "ARC", name_th: "กีฬายิงธนู", name_en: "Para Archery", federation: "World Archery" },
  { code: "SVB", name_th: "กีฬาวอลเลย์บอลนั่ง", name_en: "Sitting Volleyball", federation: "World ParaVolley" },
  { code: "ATH", name_th: "กีฬากรีฑา", name_en: "Para Athletics", federation: "World Para Athletics" },
  { code: "SWI", name_th: "กีฬาว่ายน้ำ", name_en: "Para Swimming", federation: "World Para Swimming" },
  { code: "SHO", name_th: "กีฬายิงปืน", name_en: "Para Shooting", federation: "World Shooting Para Sport" },
  { code: "ROW", name_th: "กีฬาเรือพายกรรเชียง", name_en: "Para Rowing", federation: "World Rowing" },
  { code: "CAN", name_th: "กีฬาเรือแคนู", name_en: "Para Canoe", federation: "ICF" },
  { code: "PET", name_th: "กีฬาเปตอง", name_en: "Para Pétanque", federation: "FIPJP" },
  { code: "SPK", name_th: "กีฬาตะกร้อ", name_en: "Para Sepak Takraw", federation: "ISTAF" },
  { code: "LWB", name_th: "กีฬาลอนโบว์", name_en: "Para Lawn Bowls", federation: "World Bowls" },
  { code: "BWL", name_th: "กีฬาโบว์ลิ่ง", name_en: "Para Bowling", federation: "IBF" },
  { code: "BIL", name_th: "กีฬาบิลเลียดและสนุกเกอร์", name_en: "Para Billiards & Snooker", federation: "WPBSF" },
  { code: "TKD", name_th: "กีฬาเทควันโด", name_en: "Para Taekwondo", federation: "World Taekwondo" },
  { code: "ICE", name_th: "กีฬาฮอกกี้น้ำแข็ง", name_en: "Para Ice Hockey", federation: "World Para Ice Hockey" },
  { code: "CUR", name_th: "กีฬาวีลแชร์เคอร์ลิง", name_en: "Wheelchair Curling", federation: "World Curling" },
  { code: "ESP", name_th: "กีฬาอีสปอร์ต", name_en: "Para eSports", federation: "IESF" },
  { code: "CHE", name_th: "กีฬาหมากรุกสากล", name_en: "Chess (Para)", federation: "FIDE / IBCA" },
  { code: "GOX", name_th: "กีฬาหมากล้อม", name_en: "Go / Weiqi", federation: "IGF" },
  { code: "TRI", name_th: "กีฬาไตรกีฬา", name_en: "Para Triathlon", federation: "World Triathlon" },
];

/** Sample Classification codes — legacy export kept for backward compat. */
export const CLASSIFICATION_SAMPLE: { code: string; sport: string; description: string }[] = [
  { code: "T11", sport: "Athletics", description: "Track — Vision impairment (fully blind)" },
  { code: "T12", sport: "Athletics", description: "Track — Vision impairment (moderate)" },
  { code: "T13", sport: "Athletics", description: "Track — Vision impairment (mild)" },
  { code: "S1", sport: "Swimming", description: "Freestyle/Back — severe physical impairment" },
  { code: "BC1", sport: "Boccia", description: "With ramp assistant" },
];

/**
 * Classification codes organised by sport code.
 * Sources: IPC, World Para Athletics/Swimming, BWF, ITTF, UCI, IWBF, IWAS, ITF,
 * World Para Powerlifting, World Archery Para, World Shooting Para Sport,
 * World Rowing, ICF, World ParaVolley, World Taekwondo, World Triathlon,
 * IBSA (chess), FIPJP/national bodies (petanque, takraw, bowls, etc.)
 */
export const CLASSIFICATIONS_BY_SPORT: Record<string, { code: string; description: string }[]> = {
  SWI: [
    { code: "S1/SB1/SM1", description: "วีลแชร์ — แขนและขาไม่มีแรง (ไขสันหลังระดับสูง)" },
    { code: "S2/SB2/SM2", description: "วีลแชร์ — แขนไม่มีแรง" },
    { code: "S3/SB3/SM3", description: "วีลแชร์ — แขนบางส่วน" },
    { code: "S4/SB4/SM4", description: "วีลแชร์ — แขนมีแรง ขาไม่มีแรง" },
    { code: "S5/SB5/SM5", description: "วีลแชร์ — แขนมีแรง ลำตัวบางส่วน" },
    { code: "S6/SB6/SM6", description: "ส่วนสูงน้อย หรือพิการแขนสองข้าง" },
    { code: "S7/SB7/SM7", description: "พิการขาข้างเดียว หรือพิการแขนหนึ่งข้าง" },
    { code: "S8/SB8/SM8", description: "พิการขาเล็กน้อย หรือพิการแขนข้างเดียว" },
    { code: "S9/SB9/SM9", description: "พิการขาเล็กน้อยมาก" },
    { code: "S10/SB10/SM10", description: "พิการส่วนล่างเล็กน้อย" },
    { code: "S11/SB11/SM11", description: "บกพร่องทางสายตา (ตาบอดสนิท)" },
    { code: "S12/SB12/SM12", description: "บกพร่องทางสายตา (มองเห็นบางส่วน)" },
    { code: "S13/SB13/SM13", description: "บกพร่องทางสายตา (มองเห็นได้บ้าง)" },
    { code: "S14/SB14/SM14", description: "บกพร่องทางสติปัญญา" },
  ],
  ATH: [
    { code: "T11", description: "Track — บกพร่องทางสายตา (ตาบอดสนิท)" },
    { code: "T12", description: "Track — บกพร่องทางสายตา (ปานกลาง)" },
    { code: "T13", description: "Track — บกพร่องทางสายตา (เล็กน้อย)" },
    { code: "T20", description: "Track — บกพร่องทางสติปัญญา" },
    { code: "T31/T32/T33/T34", description: "Wheelchair racing — Cerebral Palsy (T31 รุนแรงสุด → T34 เบาสุด)" },
    { code: "T35/T36/T37/T38", description: "Running — Cerebral Palsy (T35 รุนแรงสุด → T38 เบาสุด)" },
    { code: "T40/T41", description: "ส่วนสูงน้อย (Short stature)" },
    { code: "T42/T43/T44", description: "Running — พิการขาส่วนล่าง (ตัดขาสูงกว่าเข่า/ต่ำกว่าเข่า)" },
    { code: "T45/T46/T47", description: "Running — พิการแขน" },
    { code: "T51/T52/T53/T54", description: "Wheelchair racing — Spinal Injury" },
    { code: "T61/T62/T63/T64", description: "Running with prosthesis — ผู้ใช้ขาเทียม" },
    { code: "F11/F12/F13", description: "Field — บกพร่องทางสายตา" },
    { code: "F20", description: "Field — บกพร่องทางสติปัญญา" },
    { code: "F31-F34", description: "Seated throwing — Cerebral Palsy" },
    { code: "F35-F38", description: "Standing throwing — Cerebral Palsy" },
    { code: "F40/F41", description: "Field — Short stature" },
    { code: "F42-F44", description: "Field — พิการขาส่วนล่าง" },
    { code: "F45-F47", description: "Field — พิการแขน" },
    { code: "F51-F57", description: "Seated throwing — Spinal Injury" },
    { code: "F61-F64", description: "Standing throwing — ผู้ใช้ขาเทียม" },
  ],
  PWL: [
    { code: "Eligible", description: "World Para Powerlifting — เกณฑ์ความพิการที่กำหนด (มีผลต่อขาส่วนล่าง/สะโพก/หลัง — แข่งจัดตามรุ่นน้ำหนัก)" },
    { code: "M -49 / -54 / -59 / -65 / -72 / -80 / -88 / -97 / -107 / +107 kg", description: "รุ่นน้ำหนักชาย" },
    { code: "F -41 / -45 / -50 / -55 / -61 / -67 / -73 / -79 / -86 / +86 kg", description: "รุ่นน้ำหนักหญิง" },
  ],
  ARC: [
    { code: "W1", description: "Wheelchair — พิการแขนขา" },
    { code: "W2", description: "Wheelchair — ขาพิการ" },
    { code: "ST (Standing)", description: "ยืนยิง — พิการแขนหรือขา" },
    { code: "VI", description: "Vision Impaired — บกพร่องทางสายตา" },
  ],
  SHO: [
    { code: "SH1", description: "นักกีฬาที่ไม่ต้องใช้ขาตั้งปืน" },
    { code: "SH2", description: "นักกีฬาต้องใช้ขาตั้งปืน" },
    { code: "VI1/VI2", description: "Vision Impaired — บกพร่องทางสายตา" },
  ],
  TTE: [
    { code: "TT1", description: "นั่งวีลแชร์ — พิการรุนแรงที่สุด แขนที่ใช้ตี/ลำตัวมีข้อจำกัดมาก" },
    { code: "TT2", description: "นั่งวีลแชร์ — พิการรุนแรง" },
    { code: "TT3", description: "นั่งวีลแชร์ — พิการปานกลาง" },
    { code: "TT4", description: "นั่งวีลแชร์ — พิการระดับเบา" },
    { code: "TT5", description: "นั่งวีลแชร์ — พิการเบาที่สุด (lowest impaired wheelchair class)" },
    { code: "TT6", description: "ยืนเล่น — พิการรุนแรงทั้งแขนและขา" },
    { code: "TT7", description: "ยืนเล่น — แขนที่ใช้ตีพิการรุนแรงมาก" },
    { code: "TT8", description: "ยืนเล่น — พิการระดับปานกลาง" },
    { code: "TT9", description: "ยืนเล่น — พิการระดับเบา" },
    { code: "TT10", description: "ยืนเล่น — พิการน้อยที่สุด (lowest impaired standing class)" },
    { code: "TT11", description: "บกพร่องทางสติปัญญา (Intellectual Impairment)" },
  ],
  BAD: [
    { code: "WH1", description: "Wheelchair — พิการขา 2 ข้างและลำตัว / SCI ระดับสูง — มือใช้งานบางส่วน" },
    { code: "WH2", description: "Wheelchair — พิการขาเล็กน้อย ลำตัวยังควบคุมได้" },
    { code: "SL3", description: "Standing Lower limb — พิการขาส่วนล่างรุนแรง มีปัญหาทรงตัว" },
    { code: "SL4", description: "Standing Lower limb — พิการขาส่วนล่างน้อยกว่า SL3" },
    { code: "SU5", description: "Standing Upper limb — พิการแขนข้าง playing/non-playing" },
    { code: "SH6", description: "Short stature — ส่วนสูงน้อย (achondroplasia ฯลฯ)" },
  ],
  TKD: [
    { code: "K41", description: "Bilateral above-elbow amputation (ตัดแขน 2 ข้างเหนือศอก)" },
    { code: "K42", description: "Bilateral below-elbow amputation (ตัดแขน 2 ข้างใต้ศอก)" },
    { code: "K43", description: "พิการแขนทั้ง 2 ข้าง (ระดับน้อยกว่า K41/K42)" },
    { code: "K44", description: "พิการแขนข้างเดียว หรือพิการเท้า / ลำตัว" },
  ],
  FNC: [
    { code: "Category A", description: "ลำตัวและแขนใช้งานได้ — ทรงตัวบนวีลแชร์ได้ดี" },
    { code: "Category B", description: "ลำตัวมีปัญหา แขนใช้งานได้ — ทรงตัวต้องพึ่งวีลแชร์" },
    { code: "Category C", description: "แขนและลำตัวมีปัญหา — ใช้สายรัดอุปกรณ์ช่วย" },
  ],
  CYC: [
    { code: "B (Tandem)", description: "บกพร่องทางสายตา — นักปั่นคู่" },
    { code: "C1-C5", description: "พิการทางกาย ใช้จักรยาน 2 ล้อปกติ" },
    { code: "H1-H5", description: "Handcycle — พิการขา" },
    { code: "T1-T2", description: "Tricycle — พิการที่ส่งผลต่อการทรงตัว" },
  ],
  ROW: [
    { code: "PR1", description: "ใช้เฉพาะแขน ลำตัวไม่สามารถช่วยได้" },
    { code: "PR2", description: "ใช้แขนและลำตัว" },
    { code: "PR3", description: "ใช้แขน ลำตัว และขาได้" },
  ],
  CAN: [
    { code: "KL1-KL3", description: "Kayak (KL1 รุนแรงสุด → KL3 เบาสุด)" },
    { code: "VL1-VL3", description: "Va'a (VL1 รุนแรงสุด → VL3 เบาสุด)" },
  ],
  TRI: [
    { code: "PTWC", description: "Wheelchair" },
    { code: "PTS2-PTS5", description: "Standing — Physical impairment" },
    { code: "PTVI", description: "Vision Impaired" },
  ],
  WCB: [
    { code: "1.0", description: "พิการรุนแรงมาก — ทรงตัวบนวีลแชร์จำกัด" },
    { code: "1.5", description: "พิการรุนแรง" },
    { code: "2.0", description: "พิการปานกลาง-รุนแรง" },
    { code: "2.5", description: "พิการปานกลาง" },
    { code: "3.0", description: "พิการระดับกลาง" },
    { code: "3.5", description: "พิการเบา-กลาง" },
    { code: "4.0", description: "พิการเบา" },
    { code: "4.5", description: "พิการเบามาก" },
    { code: "Team total ≤ 14.0", description: "รวมแต้มผู้เล่นในสนามทั้งทีมไม่เกิน 14 แต้ม" },
  ],
  WCR: [
    { code: "0.5", description: "พิการรุนแรง" },
    { code: "1.0 / 1.5 / 2.0 / 2.5 / 3.0 / 3.5", description: "ระดับความสามารถจากรุนแรง→เบา (เพิ่มทีละ 0.5)" },
    { code: "Team total ≤ 8.0", description: "รวมแต้มผู้เล่นในสนามทั้งทีมไม่เกิน 8 แต้ม" },
  ],
  WCT: [
    { code: "Open", description: "พิการขาหรือลำตัวส่วนล่าง — ใช้แขนทั้ง 2 ข้างปกติ" },
    { code: "Quad", description: "พิการ 3-4 แขนขา (quadriplegia) — แขนทั้ง 2 ข้างมีข้อจำกัด" },
    { code: "Junior", description: "นักกีฬารุ่นเยาวชน อายุ ≤ 18 ปี" },
  ],
  SVB: [
    { code: "VS1", description: "Minimum Disability — พิการที่ส่งผลต่อการเล่น (criteria แบบเข้มงวด)" },
    { code: "VS2", description: "Minimum Disability — พิการเล็กน้อย (มีโควตาในทีมจำกัด)" },
  ],
  ICE: [
    { code: "Eligible", description: "Para Ice Hockey — Minimum eligible impairment ที่ส่งผลต่อการสเก็ต (เปิดให้เพศชาย+หญิง)" },
  ],
  CUR: [
    { code: "Mixed", description: "Wheelchair Curling — ทีมต้องมีทั้งชายและหญิง พิการที่ส่งผลต่อการเดิน" },
  ],
  // ===== ใหม่: 8 กีฬาเพิ่มเติมตามรายการ SPADT =====
  PET: [
    { code: "Open Standing", description: "ยืนเล่น — พิการขา/ลำตัวที่ยืนได้ (ใช้กฎ FIPJP เพื่อช่วยอำนวย)" },
    { code: "Wheelchair", description: "เล่นจากวีลแชร์ — กฎกำหนดให้ล้อข้างที่โยนต้องอยู่ในวงกลม" },
    { code: "VI", description: "Vision Impaired — ใช้กระดิ่งหรือผู้ช่วยส่งสัญญาณ" },
    { code: "Mixed / Open", description: "ระดับชาติยังไม่มีการแบ่ง class ทางการ — ปรับตามกฎเฉพาะรายการ" },
  ],
  SPK: [
    { code: "Hearing Impaired (HI)", description: "ผู้พิการทางการได้ยิน" },
    { code: "Sitting Sepak Takraw", description: "นั่งเล่น — พิการขาหรือไม่สามารถยืน" },
    { code: "Wheelchair Sepak Takraw", description: "เล่นจากวีลแชร์ — ปรับกฎสนาม/ความสูงตาข่าย" },
    { code: "Open / National", description: "ระดับชาติของไทย — แบ่งตามประเภทความพิการ (ยังไม่มีกรอบ IPC)" },
  ],
  LWB: [
    { code: "B1/B2/B3", description: "Vision Impaired — ตามมาตรฐาน IBSA" },
    { code: "B6/B7/B8", description: "พิการทางกาย — Open Lawn Bowls" },
    { code: "Wheelchair", description: "เล่นจากวีลแชร์" },
    { code: "Directors", description: "ผู้นำทาง (สำหรับ B1/B2)" },
  ],
  BWL: [
    { code: "TPB1", description: "ตาบอดสนิท (B1) — Tenpin Bowling" },
    { code: "TPB2/TPB3", description: "Vision Impaired" },
    { code: "PD1-PD8", description: "Physical Disability — แยกตามระดับการใช้งานแขน/ลำตัว" },
    { code: "Wheelchair", description: "เล่นจากวีลแชร์" },
  ],
  BIL: [
    { code: "Wheelchair Snooker / Billiards", description: "นักกีฬานั่งวีลแชร์ (ตามกฎ WPBSF — World Para Billiards & Snooker)" },
    { code: "Standing", description: "ยืนเล่น — พิการแขน/ขาเล็กน้อย" },
    { code: "VI", description: "Vision Impaired (มีกฎเฉพาะรายการ)" },
  ],
  ESP: [
    { code: "PI (Physical Impairment)", description: "พิการทางกาย — แข่งโดยใช้ adaptive controllers" },
    { code: "VI (Vision Impaired)", description: "บกพร่องทางสายตา — เกมที่มี audio cue" },
    { code: "HI (Hearing Impaired)", description: "พิการการได้ยิน — เกมที่ไม่ต้อง voice chat" },
    { code: "II (Intellectual)", description: "บกพร่องทางสติปัญญา" },
    { code: "Open", description: "Open division — ยังไม่มี IPC framework สำหรับ eSports" },
  ],
  CHE: [
    { code: "B1 (IBCA)", description: "Vision Impaired — ตาบอดสนิท (ตามมาตรฐาน IBSA / IBCA)" },
    { code: "B2 (IBCA)", description: "Vision Impaired — มองเห็นบางส่วน" },
    { code: "B3 (IBCA)", description: "Vision Impaired — มองเห็นได้บ้าง" },
    { code: "PD (Physical)", description: "พิการทางกาย — เคลื่อนไหวจำกัด มีผู้ช่วยขยับหมาก" },
    { code: "HI (Hearing Impaired)", description: "พิการการได้ยิน — แข่งกับนักกีฬาทั่วไปได้" },
    { code: "Open", description: "FIDE — ในการแข่งจริงทุก class แข่งร่วมกันได้" },
  ],
  GOX: [
    { code: "B1/B2/B3", description: "Vision Impaired — ใช้กระดานสัมผัส (Tactile Go board)" },
    { code: "PD (Physical)", description: "พิการทางกาย" },
    { code: "HI (Hearing Impaired)", description: "พิการการได้ยิน" },
    { code: "Open", description: "ส่วนใหญ่แข่งใน Open division — IGF ยังไม่กำหนด class ทางการ" },
  ],
};

export const PERSONNEL_TYPES = [
  { code: "athlete", label: "นักกีฬา" },
  { code: "coach", label: "โค้ช / ผู้ฝึกสอน" },
  { code: "staff", label: "เจ้าหน้าที่ทีม" },
  { code: "classifier", label: "Classifier / ผู้ตรวจระดับความพิการ" },
  { code: "official", label: "Official / ผู้ตัดสิน" },
  { code: "guide", label: "Guide / นักกีฬานำทาง" },
  { code: "manager", label: "ผู้จัดการทีม" },
];

export const COMPETITION_LEVELS = [
  { code: "paralympic", label: "พาราลิมปิกเกมส์" },
  { code: "world_championship", label: "ชิงแชมป์โลก (World Championships)" },
  { code: "asian_para", label: "เอเชียนพาราเกมส์ (Asian Para Games)" },
  { code: "asean_para", label: "อาเซียนพาราเกมส์ (ASEAN Para Games)" },
  { code: "national", label: "ระดับชาติ / แห่งชาติ" },
  { code: "regional", label: "ระดับภูมิภาค" },
  { code: "provincial", label: "ระดับจังหวัด" },
  { code: "development", label: "นักกีฬาพัฒนาฝีมือ" },
];

export const CLASSIFICATION_STATUS = [
  { code: "confirmed", label: "✅ Confirmed (ยืนยันแล้ว)" },
  { code: "review", label: "🔁 Review (อยู่ระหว่างทบทวน)" },
  { code: "new", label: "🆕 New (ยังไม่ได้ Classification)" },
];

export interface DocumentType {
  code: string;
  label: string;
  description?: string;
  required: boolean;
  accept: string;
  icon?: string;
}

/** เอกสารแนบที่ต้องใช้ในการสมัครสมาชิก */
export const DOCUMENT_TYPES: DocumentType[] = [
  {
    code: "id_card",
    label: "สำเนาบัตรประชาชน",
    description: "สำเนาบัตรประชาชน พร้อมเซ็นสำเนาถูกต้อง",
    required: true,
    accept: "image/*,.pdf",
    icon: "🪪",
  },
  {
    code: "house_registration",
    label: "สำเนาทะเบียนบ้าน",
    description: "สำเนาทะเบียนบ้านหน้าที่มีชื่อผู้สมัคร",
    required: true,
    accept: "image/*,.pdf",
    icon: "🏠",
  },
  {
    code: "disability_id",
    label: "สำเนาบัตรประจำตัวผู้พิการ",
    description: "ทั้งด้านหน้า-หลัง (ถ้ามี)",
    required: false,
    accept: "image/*,.pdf",
    icon: "♿",
  },
  {
    code: "medical_cert",
    label: "ใบรับรองแพทย์",
    description: "ออกโดยโรงพยาบาล/แพทย์รับรอง ระบุประเภทความพิการ (ไม่เกิน 6 เดือน)",
    required: true,
    accept: "image/*,.pdf",
    icon: "🩺",
  },
  {
    code: "consent_letter",
    label: "หนังสือยินยอม / หนังสือรับรอง",
    description: "ยินยอมเปิดเผยข้อมูลส่วนบุคคล + ยินยอมเข้าร่วมกิจกรรม SPADT",
    required: true,
    accept: "image/*,.pdf",
    icon: "📝",
  },
  {
    code: "classification_cert",
    label: "ใบรับรอง Classification",
    description: "จากผู้ตรวจ IPC / สหพันธ์ (ถ้ามี)",
    required: false,
    accept: "image/*,.pdf",
    icon: "📋",
  },
  {
    code: "affiliate_letter",
    label: "หนังสือส่งตัวจากต้นสังกัด",
    description: "จากสมาคม/สโมสร/ต้นสังกัดจังหวัด (ถ้ามี)",
    required: false,
    accept: "image/*,.pdf",
    icon: "✉️",
  },
  {
    code: "parent_consent",
    label: "หนังสือยินยอมผู้ปกครอง",
    description: "สำหรับผู้สมัครอายุต่ำกว่า 20 ปี",
    required: false,
    accept: "image/*,.pdf",
    icon: "👨‍👩‍👧",
  },
  {
    code: "bank_book",
    label: "สำเนาหน้าบัญชีธนาคาร",
    description: "สำหรับรับเงินเบี้ยเลี้ยง/ค่าตอบแทน (ถ้ามี)",
    required: false,
    accept: "image/*,.pdf",
    icon: "🏦",
  },
  {
    code: "other",
    label: "เอกสารอื่นๆ",
    description: "เอกสารอื่นที่เกี่ยวข้อง (เช่น ใบรับรองผลการศึกษา, ประกาศเกียรติคุณ)",
    required: false,
    accept: "image/*,.pdf",
    icon: "📎",
  },
];

/** ประเภทบุคลากรที่ถือว่าเป็นผู้ฝึกสอน — ใช้ตัดสินว่าจะแสดงหมวดใบประกาศ License */
export const COACH_PERSONNEL_TYPES = ["coach", "staff", "manager", "guide"];

/** ระดับ License ผู้ฝึกสอน — ครอบคลุมหลายมาตรฐานสากล */
export const COACH_LICENSE_LEVELS = [
  // IPC / Para sport generic
  "IPC Coach Level 1",
  "IPC Coach Level 2",
  "IPC Coach Level 3",
  // BWF (Para Badminton)
  "BWF Coach Level 1",
  "BWF Coach Level 2",
  // ITTF (Para Table Tennis)
  "ITTF Para Level 1",
  "ITTF Para Level 2",
  // World Para Athletics
  "WPA Level 1",
  "WPA Level 2",
  // World Para Swimming
  "WPS Coach",
  // AFC (Football)
  "AFC C-License",
  "AFC B-License",
  "AFC A-License",
  "AFC Pro-License",
  // National Thailand
  "ผู้ฝึกสอน ระดับ 1 (สมาคมไทย)",
  "ผู้ฝึกสอน ระดับ 2",
  "ผู้ฝึกสอน ระดับ 3",
  "ผู้ฝึกสอน ระดับสูง",
  // SAT certified
  "กกท. ระดับเริ่มต้น",
  "กกท. ระดับกลาง",
  "กกท. ระดับสูง",
  // Other
  "อื่นๆ (ระบุใน notes)",
];

/** หน่วยงานผู้ออกใบประกาศนียบัตร */
export const COACH_LICENSE_ISSUERS = [
  "การกีฬาแห่งประเทศไทย (กกท.)",
  "กองทุนพัฒนาการกีฬาแห่งชาติ (NSDF)",
  "สมาคมกีฬาคนพิการแห่งประเทศไทย (SPADT)",
  "International Paralympic Committee (IPC)",
  "World Para Athletics (WPA)",
  "World Para Swimming (WPS)",
  "BWF (Badminton)",
  "ITTF (Table Tennis)",
  "AFC (Football)",
  "World Taekwondo",
  "World Archery Para",
  "UCI Para Cycling",
  "ISTAF (Sepak Takraw)",
  "FIPJP (Pétanque)",
  "FIDE / IBCA (Chess)",
  "อื่นๆ (ระบุใน notes)",
];

/** แหล่งที่มาของค่าตอบแทน */
export const COMPENSATION_SOURCES = [
  { code: "nsdf", label: "🏛 กองทุนพัฒนาการกีฬาแห่งชาติ (NSDF)" },
  { code: "sat", label: "🏢 การกีฬาแห่งประเทศไทย (กกท.)" },
  { code: "association", label: "⚽ สมาคมกีฬา (ต้นสังกัด)" },
  { code: "school", label: "🏫 โรงเรียน / สถาบันการศึกษา" },
  { code: "private", label: "💼 บริษัท / สปอนเซอร์" },
  { code: "government", label: "🏛 หน่วยงานราชการอื่น" },
  { code: "self", label: "👤 ส่วนตัว / รายได้เอง" },
  { code: "none", label: "❌ ไม่ได้รับค่าตอบแทน" },
  { code: "mixed", label: "🔀 หลายแหล่ง (ระบุใน notes)" },
];

export const ASSISTIVE_DEVICES = [
  { code: "wheelchair_manual", label: "🛞 รถวีลแชร์ (ธรรมดา)" },
  { code: "wheelchair_electric", label: "⚡ รถวีลแชร์ (ไฟฟ้า)" },
  { code: "prosthetic_arm", label: "💪 แขนเทียม" },
  { code: "prosthetic_leg", label: "🦵 ขาเทียม" },
  { code: "crutch", label: "🩼 ไม้ค้ำยัน" },
  { code: "cane", label: "🦯 ไม้เท้า" },
  { code: "brace", label: "🦴 เฝือก / เบรส (Brace)" },
  { code: "orthosis", label: "🔧 อุปกรณ์พยุงข้อ (Orthosis)" },
  { code: "hearing_aid", label: "👂 เครื่องช่วยฟัง" },
  { code: "walker", label: "🚶 Walker / โครงช่วยเดิน" },
  { code: "none", label: "✋ ไม่ใช้อุปกรณ์ช่วยเหลือ" },
  { code: "other", label: "➕ อื่นๆ (ระบุเอง)" },
];

/** Thailand — 77 provinces (sample first 10; full list lives in DB) */
export const PROVINCES_SAMPLE = [
  "กรุงเทพมหานคร",
  "เชียงใหม่",
  "เชียงราย",
  "ขอนแก่น",
  "นครราชสีมา",
  "อุบลราชธานี",
  "สงขลา",
  "ภูเก็ต",
  "ชลบุรี",
  "นนทบุรี",
];

export const DISABILITY_TYPES = [
  { code: "PI", label: "ความพิการทางกาย (Physical Impairment)" },
  { code: "VI", label: "ความพิการทางสายตา (Vision Impairment)" },
  { code: "II", label: "ความพิการทางสติปัญญา (Intellectual Impairment)" },
  { code: "HI", label: "ความพิการทางการได้ยิน (Hearing Impairment)" },
  { code: "MI", label: "ความพิการหลายประเภท (Multiple)" },
];

export const GENDERS = [
  { code: "M", label: "ชาย" },
  { code: "F", label: "หญิง" },
  { code: "O", label: "อื่นๆ" },
];

export const TITLES = [
  "นาย",
  "นาง",
  "นางสาว",
  "เด็กชาย",
  "เด็กหญิง",
  "ดร.",
  "ผศ.",
  "รศ.",
  "ศ.",
];

export const REGIONS = [
  "ภาคกลาง",
  "ภาคเหนือ",
  "ภาคตะวันออกเฉียงเหนือ",
  "ภาคใต้",
  "ภาคตะวันออก",
  "ภาคตะวันตก",
];

/** Map จังหวัด → ภูมิภาค ครบ 77 จังหวัด (ตามภูมิศาสตร์ราชบัณฑิตยสภา 6 ภาค) */
export const PROVINCE_TO_REGION: Record<string, string> = {
  // ============ ภาคเหนือ (9) ============
  เชียงใหม่: "ภาคเหนือ", เชียงราย: "ภาคเหนือ", ลำปาง: "ภาคเหนือ",
  ลำพูน: "ภาคเหนือ", แม่ฮ่องสอน: "ภาคเหนือ", น่าน: "ภาคเหนือ",
  พะเยา: "ภาคเหนือ", แพร่: "ภาคเหนือ", อุตรดิตถ์: "ภาคเหนือ",

  // ============ ภาคตะวันออกเฉียงเหนือ (20) ============
  กาฬสินธุ์: "ภาคตะวันออกเฉียงเหนือ", ขอนแก่น: "ภาคตะวันออกเฉียงเหนือ",
  ชัยภูมิ: "ภาคตะวันออกเฉียงเหนือ", นครพนม: "ภาคตะวันออกเฉียงเหนือ",
  นครราชสีมา: "ภาคตะวันออกเฉียงเหนือ", บึงกาฬ: "ภาคตะวันออกเฉียงเหนือ",
  บุรีรัมย์: "ภาคตะวันออกเฉียงเหนือ", มหาสารคาม: "ภาคตะวันออกเฉียงเหนือ",
  มุกดาหาร: "ภาคตะวันออกเฉียงเหนือ", ยโสธร: "ภาคตะวันออกเฉียงเหนือ",
  ร้อยเอ็ด: "ภาคตะวันออกเฉียงเหนือ", เลย: "ภาคตะวันออกเฉียงเหนือ",
  ศรีสะเกษ: "ภาคตะวันออกเฉียงเหนือ", สกลนคร: "ภาคตะวันออกเฉียงเหนือ",
  สุรินทร์: "ภาคตะวันออกเฉียงเหนือ", หนองคาย: "ภาคตะวันออกเฉียงเหนือ",
  หนองบัวลำภู: "ภาคตะวันออกเฉียงเหนือ", อำนาจเจริญ: "ภาคตะวันออกเฉียงเหนือ",
  อุดรธานี: "ภาคตะวันออกเฉียงเหนือ", อุบลราชธานี: "ภาคตะวันออกเฉียงเหนือ",

  // ============ ภาคกลาง (22) ============
  กรุงเทพมหานคร: "ภาคกลาง", กำแพงเพชร: "ภาคกลาง", ชัยนาท: "ภาคกลาง",
  นครนายก: "ภาคกลาง", นครปฐม: "ภาคกลาง", นครสวรรค์: "ภาคกลาง",
  นนทบุรี: "ภาคกลาง", ปทุมธานี: "ภาคกลาง", พระนครศรีอยุธยา: "ภาคกลาง",
  พิจิตร: "ภาคกลาง", พิษณุโลก: "ภาคกลาง", เพชรบูรณ์: "ภาคกลาง",
  ลพบุรี: "ภาคกลาง", สมุทรปราการ: "ภาคกลาง", สมุทรสงคราม: "ภาคกลาง",
  สมุทรสาคร: "ภาคกลาง", สระบุรี: "ภาคกลาง", สิงห์บุรี: "ภาคกลาง",
  สุโขทัย: "ภาคกลาง", สุพรรณบุรี: "ภาคกลาง", อ่างทอง: "ภาคกลาง",
  อุทัยธานี: "ภาคกลาง",

  // ============ ภาคตะวันออก (7) ============
  จันทบุรี: "ภาคตะวันออก", ฉะเชิงเทรา: "ภาคตะวันออก", ชลบุรี: "ภาคตะวันออก",
  ตราด: "ภาคตะวันออก", ปราจีนบุรี: "ภาคตะวันออก", ระยอง: "ภาคตะวันออก",
  สระแก้ว: "ภาคตะวันออก",

  // ============ ภาคตะวันตก (5) ============
  กาญจนบุรี: "ภาคตะวันตก", ตาก: "ภาคตะวันตก", ประจวบคีรีขันธ์: "ภาคตะวันตก",
  เพชรบุรี: "ภาคตะวันตก", ราชบุรี: "ภาคตะวันตก",

  // ============ ภาคใต้ (14) ============
  กระบี่: "ภาคใต้", ชุมพร: "ภาคใต้", ตรัง: "ภาคใต้",
  นครศรีธรรมราช: "ภาคใต้", นราธิวาส: "ภาคใต้", ปัตตานี: "ภาคใต้",
  พังงา: "ภาคใต้", พัทลุง: "ภาคใต้", ภูเก็ต: "ภาคใต้",
  ยะลา: "ภาคใต้", ระนอง: "ภาคใต้", สงขลา: "ภาคใต้",
  สตูล: "ภาคใต้", สุราษฎร์ธานี: "ภาคใต้",
};

export const EDUCATION_LEVELS = [
  "ประถมศึกษา",
  "มัธยมศึกษาตอนต้น",
  "มัธยมศึกษาตอนปลาย / ปวช.",
  "ปวส. / อนุปริญญา",
  "ปริญญาตรี",
  "ปริญญาโท",
  "ปริญญาเอก",
];

export const WORK_STATUS = [
  { code: "student", label: "นักเรียน / นักศึกษา" },
  { code: "employed", label: "มีงานทำ (ภาครัฐ / เอกชน)" },
  { code: "self-employed", label: "ประกอบอาชีพอิสระ" },
  { code: "unemployed", label: "ว่างงาน" },
  { code: "retired", label: "เกษียณ" },
];

export const ORGANIZATION_TYPES = [
  { code: "government", label: "ภาครัฐ / รัฐวิสาหกิจ" },
  { code: "private", label: "ภาคเอกชน" },
  { code: "ngo", label: "องค์กรพัฒนาเอกชน (NGO)" },
  { code: "freelance", label: "อาชีพอิสระ / Freelance" },
];

/** พ.ร.บ.ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ พ.ศ. 2550 — มาตราการจ้างงาน */
export const DISABILITY_EMPLOYMENT_ARTICLES = [
  {
    code: "art33",
    label: "มาตรา 33 — การจ้างงานคนพิการโดยตรง",
    description:
      "นายจ้างที่มีลูกจ้าง 100 คนขึ้นไป ต้องจ้างคนพิการในอัตราส่วน 100:1 คนพิการมีสัญญาจ้างและได้รับค่าจ้างโดยตรงจากนายจ้าง",
  },
  {
    code: "art34",
    label: "มาตรา 34 — ส่งเงินสมทบกองทุนฯ",
    description:
      "นายจ้างที่ไม่ประสงค์รับคนพิการเข้าทำงาน ส่งเงินสมทบเข้ากองทุนส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการแทน",
  },
  {
    code: "art35",
    label: "มาตรา 35 — การส่งเสริมอาชีพคนพิการ",
    description:
      "นายจ้างให้สัมปทาน จัดสถานที่ จ้างเหมาบริการ ฝึกอาชีพ แก่คนพิการหรือผู้ดูแลคนพิการ แทนการจ้างงานโดยตรงตามมาตรา 33",
  },
  {
    code: "general",
    label: "การจ้างงานทั่วไป (ไม่ได้อยู่ภายใต้มาตรา 33/35)",
    description: "จ้างงานตามปกติ ไม่ได้เป็นโควตาคนพิการ หรือประกอบอาชีพอิสระ",
  },
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: "LayoutDashboard" },
  { href: "/members", label: "สมาชิก", icon: "Users" },
  { href: "/register", label: "ลงทะเบียน", icon: "UserPlus" },
  { href: "/pending", label: "รออนุมัติ", icon: "Clock" },
  { href: "/cards", label: "บัตรสมาชิก", icon: "CreditCard" },
  { href: "/import", label: "นำเข้า Excel", icon: "Upload" },
  { href: "/reports", label: "รายงาน", icon: "FileText" },
  { href: "/reports/advanced", label: "รายงานขั้นสูง", icon: "PieChart" },
  { href: "/classification", label: "Classification", icon: "BookOpen" },
  { href: "/support", label: "ศูนย์ช่วยเหลือ", icon: "LifeBuoy" },
  { href: "/settings", label: "ตั้งค่า", icon: "Settings" },
] as const;
