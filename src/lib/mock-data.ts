/**
 * Mock data layer for demo purposes.
 * Generates realistic data based on the actual Arta Gold Excel records.
 * Supports search, sort, filter, and pagination — mirroring the real BE API contract.
 *
 * To disable: delete this file and the `setupMockApi()` call in main.tsx.
 */

import type {
  BusinessEntity,
  Field,
  Planting,
  ProductionRecord,
  FinancialTransaction,
  FieldPhoto,
  FieldIssue,
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
const SPACINGS = ["5Χ3", "4,5Χ3", "5Χ4", "4Χ3", undefined];

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

const PHOTO_NOTES = [
  "Γενική άποψη χωραφιού — Μάρτιος",
  "Νέα φύτευση — αρχική ανάπτυξη",
  "Κλαδέματα ολοκληρώθηκαν",
  "Δείγμα εδάφους για ανάλυση",
  "Πρόβλημα αποστράγγισης",
  "Καρποφορία — Αύγουστος",
  "Μετά τη συγκομιδή — Σεπτέμβριος",
  "Σύστημα στάγδην εγκατάσταση",
];

// ─── Generate mock datasets ─────────────────────────────────────────────────

function generateBusinessEntities(): BusinessEntity[] {
  const entities: BusinessEntity[] = [];

  NAMES.forEach((name) => {
    const ts = pastDate(3);
    entities.push({
      id: uid(),
      display_name: name,
      type: "INDIVIDUAL",
      status: pick(["ACTIVE", "ACTIVE", "ACTIVE", "LEAD", "INACTIVE"]),
      afm: String(randInt(10000000, 999999999)),
      phone: pick(PHONES),
      email: name.split(" ")[0]!.toLowerCase() + "@gmail.com",
      representative_name: undefined,
      region: pick(REGIONS),
      notes: Math.random() > 0.7 ? "Σημείωση demo" : undefined,
      created_at: ts,
      updated_at: ts,
    });
  });

  BUSINESS_NAMES.forEach((name) => {
    const ts = pastDate(2);
    entities.push({
      id: uid(),
      display_name: name,
      type: "BUSINESS",
      status: "ACTIVE",
      afm: String(randInt(800000000, 999999999)),
      phone: pick(PHONES),
      email: name.split(" ")[0]!.toLowerCase() + "@company.gr",
      representative_name: pick(NAMES),
      region: pick(REGIONS),
      notes: undefined,
      created_at: ts,
      updated_at: ts,
    });
  });

  return entities;
}

function generateFields(entities: BusinessEntity[]): Field[] {
  const fields: Field[] = [];
  entities.forEach((e) => {
    const numFields = randInt(1, 3);
    for (let i = 0; i < numFields; i++) {
      const ts = pastDate(2);
      fields.push({
        id: uid(),
        business_entity_id: e.id,
        location_name: pick(LOCATIONS),
        stremmata: randDec(1.5, 15, 1),
        gps_coordinates: Math.random() > 0.3 ? pick(GPS_COORDS) : undefined,
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
      variety: pick(["V22", "V22", "V22", "V76"]),
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
        variety: "V22",
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

function generateProduction(plantings: Planting[]): ProductionRecord[] {
  const records: ProductionRecord[] = [];
  const femalePlantings = plantings.filter((p) => p.sex === "FEMALE");
  femalePlantings.forEach((p) => {
    // Production for 2023 and 2024 (actual), 2025 (estimate)
    for (const year of [2023, 2024]) {
      if (p.planting_year > year) continue;
      const ts = isoDate(year, 10, randInt(1, 28));
      records.push({
        id: uid(),
        planting_id: p.id,
        harvest_year: year,
        quantity_kg: randDec(200, 12000, 0),
        is_estimate: false,
        notes: Math.random() > 0.8 ? "Καλή χρονιά" : undefined,
        created_at: ts,
        updated_at: ts,
      });
    }
    if (p.planting_year <= 2025) {
      records.push({
        id: uid(),
        planting_id: p.id,
        harvest_year: 2025,
        quantity_kg: randDec(300, 15000, 0),
        is_estimate: true,
        notes: "Εκτίμηση",
        created_at: isoNow(),
        updated_at: isoNow(),
      });
    }
  });
  return records;
}

function generateFinancials(entities: BusinessEntity[]): FinancialTransaction[] {
  const txns: FinancialTransaction[] = [];
  entities
    .filter((e) => e.status !== "LEAD")
    .forEach((e) => {
      for (const year of [2023, 2024]) {
        const numPayments = randInt(1, 3);
        for (let i = 0; i < numPayments; i++) {
          const ts = isoDate(year, randInt(3, 11), randInt(1, 28));
          txns.push({
            id: uid(),
            business_entity_id: e.id,
            type: "PAYMENT",
            year,
            stremmata_covered: randDec(2, 12, 1),
            amount: randDec(300, 3000, 2),
            invoice_status: pick(["ISSUED", "ISSUED", "ISSUED", "NOT_ISSUED", "PARTIAL"]),
            invoice_notes:
              Math.random() > 0.7 ? "δεν έβαλε ΦΠΑ" : undefined,
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
          business_entity_id: e.id,
          type: "DEBT",
          year: 2024,
          stremmata_covered: undefined,
          amount: randDec(200, 1500, 2),
          invoice_status: "NOT_ISSUED",
          invoice_notes: undefined,
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
    const numPhotos = randInt(0, 3);
    for (let i = 0; i < numPhotos; i++) {
      const ts = pastDate(1);
      photos.push({
        id: uid(),
        field_id: f.id,
        url: `https://picsum.photos/seed/${f.id}-${i}/800/600`,
        taken_at: ts.slice(0, 10),
        notes: pick(PHOTO_NOTES),
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
      issues.push({
        id: uid(),
        field_id: f.id,
        description: pick(ISSUE_DESCRIPTIONS),
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

const entities = generateBusinessEntities();
const fields = generateFields(entities);
const plantings = generatePlantings(fields);
const production = generateProduction(plantings);
const financials = generateFinancials(entities);
const photos = generatePhotos(fields);
const issues = generateIssues(fields);

// Build lookup maps for joined display names
const entityMap = new Map(entities.map((e) => [e.id, e]));
const fieldMap = new Map(fields.map((f) => [f.id, f]));
const plantingMap = new Map(plantings.map((p) => [p.id, p]));

// Augmented types for display (add joined names)
export type FieldWithOwner = Field & { owner_name: string };
export type PlantingWithField = Planting & { field_name: string; owner_name: string };
export type ProductionWithContext = ProductionRecord & {
  field_name: string;
  owner_name: string;
  variety: string;
};
export type FinancialWithOwner = FinancialTransaction & { owner_name: string };
export type PhotoWithField = FieldPhoto & { field_name: string; owner_name: string };
export type IssueWithField = FieldIssue & { field_name: string; owner_name: string };

function enrichFields(): FieldWithOwner[] {
  return fields.map((f) => ({
    ...f,
    owner_name: entityMap.get(f.business_entity_id)?.display_name ?? "—",
  }));
}

function enrichPlantings(): PlantingWithField[] {
  return plantings.map((p) => {
    const field = fieldMap.get(p.field_id);
    return {
      ...p,
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? entityMap.get(field.business_entity_id)?.display_name ?? "—"
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
      variety: planting?.variety ?? "—",
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? entityMap.get(field.business_entity_id)?.display_name ?? "—"
        : "—",
    };
  });
}

function enrichFinancials(): FinancialWithOwner[] {
  return financials.map((t) => ({
    ...t,
    owner_name: entityMap.get(t.business_entity_id)?.display_name ?? "—",
  }));
}

function enrichPhotos(): PhotoWithField[] {
  return photos.map((p) => {
    const field = fieldMap.get(p.field_id);
    return {
      ...p,
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? entityMap.get(field.business_entity_id)?.display_name ?? "—"
        : "—",
    };
  });
}

function enrichIssues(): IssueWithField[] {
  return issues.map((i) => {
    const field = fieldMap.get(i.field_id);
    return {
      ...i,
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? entityMap.get(field.business_entity_id)?.display_name ?? "—"
        : "—",
    };
  });
}

// ─── Generic query engine (search, sort, filter, paginate) ───────────────────

function queryEngine<T extends Record<string, unknown>>(
  dataset: T[],
  params: URLSearchParams,
  searchableKeys: string[]
): PaginatedResponse<T> {
  let result = [...dataset];

  // Search
  const search = params.get("search")?.toLowerCase();
  if (search) {
    result = result.filter((row) =>
      searchableKeys.some((key) => {
        const val = row[key];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(search);
      })
    );
  }

  // Filters (every param that isn't a reserved key)
  const reserved = new Set(["page", "page_size", "search", "sort_by", "sort_dir"]);
  params.forEach((value, key) => {
    if (reserved.has(key) || !value) return;
    result = result.filter((row) => String(row[key]) === value);
  });

  // Sort
  const sortBy = params.get("sort_by");
  const sortDir = params.get("sort_dir") ?? "asc";
  if (sortBy) {
    result.sort((a, b) => {
      const aVal = a[sortBy] ?? "";
      const bVal = b[sortBy] ?? "";
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
  "/api/business-entities": (p) =>
    queryEngine(entities, p, ["display_name", "afm", "phone", "email", "region"]),
  "/api/fields": (p) =>
    queryEngine(enrichFields(), p, ["location_name", "owner_name", "analysis_number"]),
  "/api/plantings": (p) =>
    queryEngine(enrichPlantings(), p, ["field_name", "owner_name", "variety", "rootstock"]),
  "/api/production": (p) =>
    queryEngine(enrichProduction(), p, ["field_name", "owner_name", "variety"]),
  "/api/financials": (p) =>
    queryEngine(enrichFinancials(), p, ["owner_name", "invoice_notes", "notes"]),
  "/api/field-photos": (p) =>
    queryEngine(enrichPhotos(), p, ["field_name", "owner_name", "notes"]),
  "/api/field-issues": (p) =>
    queryEngine(enrichIssues(), p, ["field_name", "owner_name", "description"]),
};

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export function getDashboardStats() {
  const activeEntities = entities.filter((e) => e.status === "ACTIVE").length;
  const totalFields = fields.length;
  const totalProduction = production
    .filter((r) => r.harvest_year === 2024 && !r.is_estimate)
    .reduce((sum, r) => sum + r.quantity_kg, 0);
  const totalPayments = financials
    .filter((t) => t.type === "PAYMENT" && t.year === 2024)
    .reduce((sum, t) => sum + t.amount, 0);
  const openIssues = issues.filter((i) => i.status === "OPEN").length;

  return { activeEntities, totalFields, totalProduction, totalPayments, openIssues };
}

// ─── Intercept fetch ─────────────────────────────────────────────────────────

export function setupMockApi() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    // Only intercept /api/* GET requests
    if (!url.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    const [path, queryString] = url.split("?");
    const params = new URLSearchParams(queryString ?? "");

    const handler = handlers[path!];
    if (!handler) {
      return new Response(JSON.stringify({ message: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Simulate network latency (200–500ms)
    await new Promise((r) => setTimeout(r, randInt(200, 500)));

    const body = handler(params);

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  console.log(
    "%c🫒 SEAPP Mock API active — %d producers, %d fields, %d plantings, %d production records, %d transactions",
    "color: #13a319; font-weight: bold",
    entities.length,
    fields.length,
    plantings.length,
    production.length,
    financials.length
  );
}
