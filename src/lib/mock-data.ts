/**
 * Mock data layer for demo purposes.
 * Generates realistic data based on the actual Arta Gold Excel records.
 * Supports search, sort, filter, and pagination — mirroring the real BE API contract.
 *
 * To disable: delete this file and the `setupMockApi()` call in main.tsx.
 */

import type {
  Producer,
  ProducerListItem,
  ProducerStatus,
  Field,
  Planting,
  ProductionRecord,
  FinancialTransaction,
  FieldPhoto,
  FieldIssue,
  PhotoCategory,
  PaginatedResponse,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => String(++_id).padStart(4, "0");
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randDec = (min: number, max: number, decimals = 1) =>
  +(Math.random() * (max - min) + min).toFixed(decimals);
const isoDate = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const isoNow = () => new Date().toISOString();
const pastDate = (yearsBack = 2) => {
  const d = new Date();
  d.setDate(d.getDate() - randInt(1, yearsBack * 365));
  return d.toISOString();
};

// ─── Seed data from the real Excel ───────────────────────────────────────────

const NAMES = [
  "Παππάς Ιωάννης", "Αρχιμανδρίτη Χριστίνα", "Γαλιάνδρα Λαμπρινή",
  "Φωτιάδης Ορέστης", "Κουτσάφτη Σταματίνα", "Δήμος Κωνσταντίνος",
  "Μπέκιος Φίλιππος", "Μητσοκάλης Χρισόστομος", "Τσώλας Ιωάννης",
  "Βίτσιος Σωτήριος", "Κώτση Βασιλική", "Μπαλλής Σωτήριος",
  "Μπάρκας Χρήστος", "Καλύβας Λάμπρος", "Μαγκλάρας Γεώργιος",
  "Μπέλλου Λαμπρινή", "Σκούμας Χρήστος", "Ξυλογιάννη Ευανθία",
  "Μίχας Απόστολος", "Μίχας Κωνσταντίνος", "Κολιός Αντρέας",
  "Ξυλογιάννης Αναστάσιος", "Σακαγιάννη Ηρώ", "Τσώλας Διονύσης",
  "Φερεντίνου Μαρία", "Τσάλλος Λάμπρος", "Ξυλογιάννη Μυρσίνη",
  "Μπόκου Μάρθα", "Τζιανούμη Νίκη", "Λάππα Ελένη",
  "Γραμμένος Δημήτρης", "Νταβίλα Αικατερίνη", "Κοντογεώργος Βασίλης",
  "Σούλιος Θεόδωρος", "Παπαδημητρίου Σοφία", "Μανώλης Νικόλαος",
];

const BUSINESS_NAMES = [
  "Αγροτικές Καλλιέργειες", "Arta Agri ΕΠΕ", "Φυστίκι Ηπείρου ΟΕ",
];

const LOCATIONS = [
  "Καλόβατος", "Πλησιοί", "Νεοχώρι", "Παχυκάλαμος", "Αγία Παρασκευή",
  "Κεραμάτες", "Γαβριά", "Ρόκκα", "Άρτα", "Φιλοθέη", "Κιρκιζάτες",
  "Ανέζα", "Άγιος Σπυρίδωνας", "Γκάμιλη", "Χαλκιάδες", "Γραμμενίτσα",
  "Καλαμιά", "Φυτώρια", "Μενίδι", "Σελλάδες", "Κωστακιοί", "Συκιές",
];

const REGIONS = [
  "Άρτα", "Πρέβεζα", "Ιωάννινα", "Ημαθία", "Αγρίνιο",
];

const ROOTSTOCKS = ["HAYWARD", "BOUNTY", "D1", undefined];
const SPACINGS = ["5x3", "4.5x3", "5x4", "4x3", undefined];

const GPS_COORDS = [
  "39°07'25.4\"N 20°55'11.1\"E", "39°03'16.2\"N 20°59'37.4\"E",
  "39°06'03.4\"N 20°59'47.1\"E", "39°04'30.1\"N 21°00'29.5\"E",
  "39°05'54.9\"N 20°59'44.6\"E", "39°06'45.0\"N 20°59'24.1\"E",
  "39°06'00.4\"N 20°59'53.0\"E", "39°06'24.0\"N 20°58'09.1\"E",
  "39°04'32.7\"N 21°00'21.2\"E", "39°07'10.3\"N 20°56'02.8\"E",
];

const PHONES = [
  "6944292350", "6946410711", "6931170146", "6946694378", "6942496592",
  "6980210805", "6971702755", "6987236908", "6947801861", "6974252353",
  "6978042111", "6974939565", "6972854066", "6973792649", "6999924377",
];

const ISSUE_TITLES = [
  "Κιτρίνισμα φύλλων",
  "Βέρτιτσίλιο",
  "Σπάσιμο κλαδιού",
  "Κακή αποστράγγιση",
  "Ξηρασία",
  "Αφίδες",
  "Χαμηλή καρποφορία",
  "Πρόβλημα αρδευτικού",
  "Ζημιά από παγετό",
  "Ανεπαρκής επικονίαση",
];

const ISSUE_DESCRIPTIONS = [
  "Κιτρίνισμα φύλλων — πιθανή έλλειψη σιδήρου",
  "Βέρτιτσίλιο σε 3 δέντρα στην ανατολική πλευρά",
  "Σπάσιμο κλαδιού από αέρα — χρειάζεται κλάδεμα",
  "Κακή αποστράγγιση μετά τις βροχές",
  "Ξηρασία — χρειάζεται αυξημένη άρδευση",
  "Αφίδες σε νεαρά δέντρα — ψεκασμός",
  "Χαμηλή καρποφορία σε σύγκριση με πέρυσι",
  "Πρόβλημα με σύστημα στάγδην",
  "Ζημιά από παγετό στα μπουμπούκια",
  "Ανεπαρκής επικονίαση — λίγα αρσενικά",
];

const PHOTO_CATEGORIES: PhotoCategory[] = [
  "KLADEMA",
  "ARAIWMA_BLASTOU",
  "ARAIWMA_KARPOU",
  "KALOKAIRI_NERA",
  "PERIODOS_SUGKOMIDIS",
  "OTHER",
];

const PHOTO_NOTES_BY_CATEGORY: Record<PhotoCategory, string[]> = {
  KLADEMA: [
    "Κλάδεμα ολοκληρώθηκε",
    "Κλαδέματα χειμώνα",
    "Μορφοποιητικό κλάδεμα",
  ],
  ARAIWMA_BLASTOU: [
    "Αραίωμα βλαστών Απρίλιος",
    "Έλεγχος βλαστήσεων",
    "Αραίωμα ολοκληρώθηκε",
  ],
  ARAIWMA_KARPOU: [
    "Αραίωμα καρπών Ιούνιος",
    "Φόρτωση καρπών",
    "Αραίωμα σε εξέλιξη",
  ],
  KALOKAIRI_NERA: [
    "Σύστημα στάγδην — Ιούλιος",
    "Άρδευση Αυγούστου",
    "Νερά — καλοκαίρι",
  ],
  PERIODOS_SUGKOMIDIS: [
    "Καρποφορία — Σεπτέμβριος",
    "Συγκομιδή σε εξέλιξη",
    "Μετά τη συγκομιδή",
  ],
  OTHER: [
    "Γενική άποψη χωραφιού",
    "Δείγμα εδάφους για ανάλυση",
    "Πρόβλημα αποστράγγισης",
  ],
};

// ─── Generate mock datasets ─────────────────────────────────────────────────

function generateProducers(): Producer[] {
  const producers: Producer[] = [];

  NAMES.forEach((name) => {
    producers.push({
      id: uid(),
      display_name: name,
      status: pick(["ACTIVE", "ACTIVE", "ACTIVE", "LEAD", "INACTIVE"]),
      afm: String(randInt(10000000, 999999999)),
      phone: pick(PHONES),
      email: name.split(" ")[0]!.toLowerCase() + "@gmail.com",
      representative_name: undefined,
      region: pick(REGIONS),
      notes: Math.random() > 0.7 ? "Σημείωση demo" : undefined,
    });
  });

  BUSINESS_NAMES.forEach((name) => {
    producers.push({
      id: uid(),
      display_name: name,
      status: "ACTIVE",
      afm: String(randInt(800000000, 999999999)),
      phone: pick(PHONES),
      email: name.split(" ")[0]!.toLowerCase() + "@company.gr",
      representative_name: pick(NAMES),
      region: pick(REGIONS),
      notes: undefined,
    });
  });

  return producers;
}

function generateFields(producers: Producer[]): Field[] {
  const fields: Field[] = [];
  producers.forEach((e) => {
    const numFields = randInt(1, 3);
    for (let i = 0; i < numFields; i++) {
      const ts = pastDate(2);
      const plantYear = pick([2018, 2019, 2020, 2021, 2022, 2023]);
      fields.push({
        id: uid(),
        producer_id: e.id,
        location_name: pick(LOCATIONS),
        region: pick(REGIONS),
        stremmata: randDec(1.5, 15, 1),
        gps_coordinates: Math.random() > 0.3 ? pick(GPS_COORDS) : undefined,
        planting_date: isoDate(plantYear, randInt(2, 4), randInt(1, 28)),
        planting_method: pick(["PLANTING", "GRAFTING"]),
        training_shape: pick(["FISHBONE", "UMBRELLA", "OTHER", "MIX"]),
        rootstock: pick(ROOTSTOCKS) ?? undefined,
        spacing: pick(SPACINGS) ?? undefined,
        analysis_number: Math.random() > 0.4 ? `Ν${randInt(1, 80)}` : undefined,
        created_at: ts,
        updated_at: ts,
      });
    }
  });
  return fields;
}

function generatePlantings(fields: Field[]): Planting[] {
  const plantings: Planting[] = [];
  fields.forEach((f) => {
    // Each field has 1–2 plantings (female + maybe male)
    const ts = pastDate(2);
    plantings.push({
      id: uid(),
      field_id: f.id,
      variety: pick(["AC22", "AC22", "AC22", "AC76"]),
      sex: "FEMALE",
      tree_count: randInt(50, 500),
      planting_year: pick([2020, 2021, 2022, 2023, 2024, 2025]),
      planting_method: pick(["PLANTING", "GRAFTING"]),
      training_shape: pick(["FISHBONE", "UMBRELLA", "OTHER"]),
      rootstock: pick(ROOTSTOCKS),
      spacing: pick(SPACINGS),
      created_at: ts,
      updated_at: ts,
    });
    // ~70% chance of having male trees too
    if (Math.random() > 0.3) {
      plantings.push({
        id: uid(),
        field_id: f.id,
        variety: "AC22",
        sex: "MALE",
        tree_count: randInt(5, 50),
        planting_year: pick([2020, 2021, 2022, 2023, 2024]),
        planting_method: pick(["PLANTING", "GRAFTING"]),
        training_shape: pick(["FISHBONE", "UMBRELLA", "OTHER"]),
        rootstock: pick(ROOTSTOCKS),
        spacing: pick(SPACINGS),
        created_at: ts,
        updated_at: ts,
      });
    }
  });
  return plantings;
}

function mkProductionBreakdown() {
  const catA1 = randDec(100, 2500, 0);
  const catA2 = randDec(200, 4500, 0);
  const catA3 = randDec(50,  1500, 0);
  const catB1 = randDec(50,  1200, 0);
  const catB2 = randDec(80,  2000, 0);
  const catB3 = randDec(30,  800,  0);
  const sp1   = randDec(10,  300,  0);
  const sp2   = randDec(20,  500,  0);
  const sp3   = randDec(5,   200,  0);
  return {
    cat_a_1kg: catA1, cat_a_2kg: catA2, cat_a_3kg: catA3,
    cat_b_1kg: catB1, cat_b_2kg: catB2, cat_b_3kg: catB3,
    spoiled_1kg: sp1, spoiled_2kg: sp2, spoiled_3kg: sp3,
    quantity_kg: catA1 + catA2 + catA3 + catB1 + catB2 + catB3 + sp1 + sp2 + sp3,
  };
}

function generateProduction(plantings: Planting[]): ProductionRecord[] {
  const records: ProductionRecord[] = [];
  const femalePlantings = plantings.filter((p) => p.sex === "FEMALE");
  femalePlantings.forEach((p) => {
    for (const year of [2023, 2024]) {
      if ((p.planting_year ?? 0) > year) continue;
      const ts = isoDate(year, 10, randInt(1, 28));
      records.push({
        id: uid(),
        planting_id: p.id,
        harvest_year: year,
        ...mkProductionBreakdown(),
        is_estimate: false,
        notes: Math.random() > 0.8 ? "Καλή χρονιά" : undefined,
        created_at: ts,
        updated_at: ts,
      });
    }
    if ((p.planting_year ?? 0) <= 2025) {
      records.push({
        id: uid(),
        planting_id: p.id,
        harvest_year: 2025,
        ...mkProductionBreakdown(),
        is_estimate: true,
        notes: "Εκτίμηση",
        created_at: isoNow(),
        updated_at: isoNow(),
      });
    }
  });
  return records;
}

function generateFinancials(producers: Producer[]): FinancialTransaction[] {
  const txns: FinancialTransaction[] = [];
  producers
    .filter((e) => e.status !== "LEAD")
    .forEach((e) => {
      for (const year of [2023, 2024]) {
        const numPayments = randInt(1, 3);
        for (let i = 0; i < numPayments; i++) {
          const ts = isoDate(year, randInt(3, 11), randInt(1, 28));
          txns.push({
            id: uid(),
            producer_id: e.id,
            type: "PAYMENT",
            year,
            stremmata_covered: randDec(2, 12, 1),
            amount: randDec(300, 3000, 2),
            invoice_status: pick(["ISSUED", "ISSUED", "ISSUED", "NOT_ISSUED", "PARTIAL"]),
            vat_note: Math.random() > 0.7 ? "δεν έβαλε ΦΠΑ" : undefined,
            notes: undefined,
            transaction_date: ts,
            created_at: ts,
            updated_at: ts,
          });
        }
      }
      // Some debts
      if (Math.random() > 0.6) {
        const ts = isoDate(2024, randInt(6, 12), randInt(1, 28));
        txns.push({
          id: uid(),
          producer_id: e.id,
          type: "DEBT",
          year: 2024,
          stremmata_covered: undefined,
          amount: randDec(200, 1500, 2),
          invoice_status: "NOT_ISSUED",
          notes: "Εκκρεμεί",
          transaction_date: ts,
          created_at: ts,
          updated_at: ts,
        });
      }
    });
  return txns;
}

function generatePhotos(fields: Field[]): FieldPhoto[] {
  const photos: FieldPhoto[] = [];
  fields.forEach((f) => {
    const numPhotos = randInt(1, 4);
    for (let i = 0; i < numPhotos; i++) {
      const ts = pastDate(1);
      const category = pick(PHOTO_CATEGORIES);
      photos.push({
        id: uid(),
        field_id: f.id,
        url: `https://picsum.photos/seed/${f.id}-${i}/800/600`,
        category,
        taken_at: ts.slice(0, 10),
        notes: pick(PHOTO_NOTES_BY_CATEGORY[category]),
        created_at: ts,
      });
    }
  });
  return photos;
}

function generateIssues(fields: Field[]): FieldIssue[] {
  const issues: FieldIssue[] = [];
  fields.forEach((f) => {
    if (Math.random() > 0.35) return; // ~35% of fields have issues
    const numIssues = randInt(1, 2);
    for (let i = 0; i < numIssues; i++) {
      const reported = pastDate(1);
      const resolved = Math.random() > 0.5;
      const idx = randInt(0, ISSUE_TITLES.length - 1);
      issues.push({
        id: uid(),
        field_id: f.id,
        title: ISSUE_TITLES[idx]!,
        description: ISSUE_DESCRIPTIONS[idx]!,
        severity: pick(["LOW", "MEDIUM", "HIGH"]),
        status: resolved ? "RESOLVED" : "OPEN",
        reported_at: reported.slice(0, 10),
        resolved_at: resolved
          ? isoDate(2025, randInt(1, 3), randInt(1, 28))
          : undefined,
        created_at: reported,
        updated_at: isoNow(),
      });
    }
  });
  return issues;
}

// ─── In-memory database ──────────────────────────────────────────────────────

const producers = generateProducers();
const fields = generateFields(producers);
const plantings = generatePlantings(fields);
const production = generateProduction(plantings);
const financials = generateFinancials(producers);
const photos = generatePhotos(fields);
const issues = generateIssues(fields);

// Build lookup maps for joined display names
const producerMap = new Map(producers.map((e) => [e.id, e]));
const fieldMap = new Map(fields.map((f) => [f.id, f]));
const plantingMap = new Map(plantings.map((p) => [p.id, p]));

const plantingsByFieldId = new Map<string, Planting[]>();
plantings.forEach((p) => {
  const list = plantingsByFieldId.get(p.field_id) ?? [];
  list.push(p);
  plantingsByFieldId.set(p.field_id, list);
});

// Augmented types for display (add joined names)
export type FieldWithOwner = Field & { owner_name: string; planting_summary?: string };
export type PlantingWithField = Planting & { field_name: string; owner_name: string; producer_id: string };
export type ProductionWithContext = ProductionRecord & {
  field_id: string;
  producer_id: string;
  field_name: string;
  owner_name: string;
  variety: string;
};
export type FinancialWithOwner = FinancialTransaction & { owner_name: string };
export type PhotoWithField = FieldPhoto & { field_name: string; owner_name: string; producer_id: string };
export type IssueWithField = FieldIssue & { field_name: string; owner_name: string; producer_id: string };

const stremmataByProducerId = new Map<string, number>();
fields.forEach((f) => {
  const prev = stremmataByProducerId.get(f.producer_id) ?? 0;
  stremmataByProducerId.set(f.producer_id, prev + (f.stremmata ?? 0));
});

function enrichProducers(): ProducerListItem[] {
  return producers.map((e) => ({
    ...e,
    total_stremmata: +(stremmataByProducerId.get(e.id) ?? 0).toFixed(1),
  }));
}

function enrichFields(): FieldWithOwner[] {
  return fields.map((f) => {
    const fp = plantingsByFieldId.get(f.id) ?? [];
    const parts: string[] = [];
    fp.filter((p) => p.sex === "FEMALE").forEach((p) =>
      parts.push(`${p.tree_count} ${p.variety ?? "?"}`)
    );
    const maleTrees = fp
      .filter((p) => p.sex === "MALE")
      .reduce((s, p) => s + p.tree_count, 0);
    if (maleTrees > 0) parts.push(`${maleTrees} ♂`);
    return {
      ...f,
      owner_name: producerMap.get(f.producer_id)?.display_name ?? "—",
      planting_summary: parts.length > 0 ? parts.join(" + ") : undefined,
    };
  });
}

function enrichPlantings(): PlantingWithField[] {
  return plantings.map((p) => {
    const field = fieldMap.get(p.field_id);
    return {
      ...p,
      producer_id: field?.producer_id ?? "",
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? producerMap.get(field.producer_id)?.display_name ?? "—"
        : "—",
    };
  });
}

function enrichProduction(): ProductionWithContext[] {
  return production.map((r) => {
    const planting = plantingMap.get(r.planting_id);
    const field = planting ? fieldMap.get(planting.field_id) : undefined;
    return {
      ...r,
      field_id: field?.id ?? "",
      producer_id: field?.producer_id ?? "",
      variety: planting?.variety ?? "—",
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? producerMap.get(field.producer_id)?.display_name ?? "—"
        : "—",
    };
  });
}

function enrichFinancials(): FinancialWithOwner[] {
  return financials.map((t) => ({
    ...t,
    owner_name: producerMap.get(t.producer_id)?.display_name ?? "—",
  }));
}

function enrichPhotos(): PhotoWithField[] {
  return photos.map((p) => {
    const field = fieldMap.get(p.field_id);
    return {
      ...p,
      producer_id: field?.producer_id ?? "",
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? producerMap.get(field.producer_id)?.display_name ?? "—"
        : "—",
    };
  });
}

function enrichIssues(): IssueWithField[] {
  return issues.map((i) => {
    const field = fieldMap.get(i.field_id);
    return {
      ...i,
      producer_id: field?.producer_id ?? "",
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? producerMap.get(field.producer_id)?.display_name ?? "—"
        : "—",
    };
  });
}

// ─── Generic query engine (search, sort, filter, paginate) ───────────────────

function queryEngine<T extends object>(
  dataset: T[],
  params: URLSearchParams,
  searchableKeys: string[]
): PaginatedResponse<T> {
  let result = [...dataset];

  const asMap = (row: T) => row as Record<string, unknown>;

  // Search
  const search = params.get("search")?.toLowerCase();
  if (search) {
    result = result.filter((row) =>
      searchableKeys.some((key) => {
        const val = asMap(row)[key];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(search);
      })
    );
  }

  // Filters (every param that isn't a reserved key)
  const reserved = new Set(["page", "page_size", "search", "sort_by", "sort_dir"]);
  params.forEach((value, key) => {
    if (reserved.has(key) || !value) return;
    result = result.filter((row) => String(asMap(row)[key]) === value);
  });

  // Sort
  const sortBy = params.get("sort_by");
  const sortDir = params.get("sort_dir") ?? "asc";
  if (sortBy) {
    result.sort((a, b) => {
      const aVal = asMap(a)[sortBy] ?? "";
      const bVal = asMap(b)[sortBy] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), "el", { numeric: true });
      return sortDir === "desc" ? -cmp : cmp;
    });
  }

  // Paginate
  const total = result.length;
  const page = Math.max(1, parseInt(params.get("page") ?? "1"));
  const pageSize = Math.max(1, parseInt(params.get("page_size") ?? "50"));
  const start = (page - 1) * pageSize;
  const data = result.slice(start, start + pageSize);

  return { data, total, page, page_size: pageSize };
}

// ─── Route handlers ──────────────────────────────────────────────────────────

const handlers: Record<string, (params: URLSearchParams) => PaginatedResponse<unknown>> = {
  "/api/producers": (p) =>
    queryEngine(enrichProducers(), p, ["display_name", "afm", "phone", "email", "region"]),
  "/api/fields": (p) =>
    queryEngine(enrichFields(), p, ["location_name", "owner_name", "analysis_number"]),
  "/api/plantings": (p) =>
    queryEngine(enrichPlantings(), p, ["field_name", "owner_name", "variety", "rootstock"]),
  "/api/production": (p) =>
    queryEngine(enrichProduction(), p, ["field_name", "owner_name", "variety"]),
  "/api/financials": (p) =>
    queryEngine(enrichFinancials(), p, ["owner_name", "vat_note", "notes"]),
  "/api/field-photos": (p) =>
    queryEngine(enrichPhotos(), p, ["field_name", "owner_name", "notes"]),
  "/api/field-issues": (p) =>
    queryEngine(enrichIssues(), p, ["field_name", "owner_name", "description"]),
};

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export function getDashboardStats() {
  const activeProducers = producers.filter((e) => e.status === "ACTIVE").length;
  const totalFields = fields.length;
  const totalProduction = production
    .filter((r) => r.harvest_year === 2024 && !r.is_estimate)
    .reduce((sum, r) => sum + r.quantity_kg, 0);
  const totalPayments = financials
    .filter((t) => t.type === "PAYMENT" && t.year === 2024)
    .reduce((sum, t) => sum + t.amount, 0);
  const openIssues = issues.filter((i) => i.status === "OPEN").length;

  return { activeProducers, totalFields, totalProduction, totalPayments, openIssues };
}

// ─── Mutations (create / update) ─────────────────────────────────────────────
// The mock persists producer writes in-memory so create/edit round-trip through
// the same GET handlers (enrichProducers reads the live `producers` array).

/** Fields a client is allowed to set on a producer. */
type ProducerInput = Partial<
  Pick<
    Producer,
    | "display_name"
    | "status"
    | "afm"
    | "phone"
    | "email"
    | "representative_name"
    | "region"
    | "notes"
  >
>;

/** Empty strings coming from form inputs collapse to `undefined`. */
const blankToUndef = (v?: string) => (v && v.trim() !== "" ? v : undefined);

function createProducer(body: ProducerInput): Producer {
  const producer: Producer = {
    id: uid(),
    display_name: body.display_name?.trim() ?? "",
    status: (body.status as ProducerStatus) ?? "LEAD",
    afm: blankToUndef(body.afm),
    phone: blankToUndef(body.phone),
    email: blankToUndef(body.email),
    representative_name: blankToUndef(body.representative_name),
    region: blankToUndef(body.region),
    notes: blankToUndef(body.notes),
  };
  producers.push(producer);
  producerMap.set(producer.id, producer);
  return producer;
}

function updateProducer(id: string, body: ProducerInput): Producer | null {
  const existing = producerMap.get(id);
  if (!existing) return null;
  existing.display_name = body.display_name?.trim() || existing.display_name;
  if (body.status) existing.status = body.status as ProducerStatus;
  existing.afm = blankToUndef(body.afm);
  existing.phone = blankToUndef(body.phone);
  existing.email = blankToUndef(body.email);
  existing.representative_name = blankToUndef(body.representative_name);
  existing.region = blankToUndef(body.region);
  existing.notes = blankToUndef(body.notes);
  return existing;
}

// ─── Intercept fetch ─────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export function setupMockApi() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    // Only intercept /api/* requests
    if (!url.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    const method = (init?.method ?? "GET").toUpperCase();
    const [path, queryString] = url.split("?");
    const params = new URLSearchParams(queryString ?? "");

    // Simulate network latency (200–500ms)
    await new Promise((r) => setTimeout(r, randInt(200, 500)));

    // ── Writes (producers only, for now) ──────────────────────────────────
    if (method !== "GET" && method !== "HEAD") {
      const body: ProducerInput =
        typeof init?.body === "string" ? JSON.parse(init.body) : {};

      if (path === "/api/producers" && method === "POST") {
        return jsonResponse(createProducer(body), 201);
      }

      const editMatch = path?.match(/^\/api\/producers\/([^/]+)$/);
      if (editMatch && (method === "PATCH" || method === "PUT")) {
        const updated = updateProducer(editMatch[1]!, body);
        return updated
          ? jsonResponse(updated)
          : jsonResponse({ message: "Not found" }, 404);
      }

      return jsonResponse({ message: "Method not allowed" }, 405);
    }

    // ── Reads ─────────────────────────────────────────────────────────────
    const handler = handlers[path!];
    if (!handler) {
      return jsonResponse({ message: "Not found" }, 404);
    }

    return jsonResponse(handler(params));
  };

  console.log(
    "%c🫒 SEAPP Mock API active — %d producers, %d fields, %d plantings, %d production records, %d transactions",
    "color: #13a319; font-weight: bold",
    producers.length,
    fields.length,
    plantings.length,
    production.length,
    financials.length
  );
}
