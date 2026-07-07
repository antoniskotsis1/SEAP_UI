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
  FieldAnalysisFile,
  Planting,
  Variety,
  VarietyCount,
  ProductionRecord,
  Settlement,
  SettlementFile,
  SettlementFileType,
  FinancialTransaction,
  FieldPhoto,
  FieldIssue,
  PhotoCategory,
  IssueSeverity,
  IssueStatus,
  PaginatedResponse,
  DashboardStats,
  ProductionYearPoint,
  VarietyCompositionPoint,
  SeverityCountPoint,
  EstimateVsActualPoint,
  YieldPerStremmaPoint,
  StatusCountPoint,
  RegionStremmataPoint,
  CategoryCountPoint,
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
const PLANTING_COMMENTS = [
  "Νέα φύτευση, καλή ανάπτυξη.",
  "Χρειάζεται αντικατάσταση μερικών δέντρων.",
  "Εμβολιασμός την επόμενη σεζόν.",
  "Καλή παραγωγικότητα φέτος.",
  undefined,
  undefined,
];

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

function generateAnalyses(ts: string): FieldAnalysisFile[] {
  const count = randInt(0, 3);
  return Array.from({ length: count }, () => {
    const num = randInt(1, 80);
    return {
      id: uid(),
      file_name: `analysis-N${num}.xlsx`,
      file_url: `/mock/analyses/analysis-N${num}.xlsx`,
      size_bytes: randInt(12_000, 250_000),
      uploaded_at: ts,
    };
  });
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
        producer_name: e.display_name,
        location_name: pick(LOCATIONS),
        region: pick(REGIONS),
        stremmata: randDec(1.5, 15, 1),
        gps_coordinates: Math.random() > 0.3 ? pick(GPS_COORDS) : undefined,
        planting_date: isoDate(plantYear, randInt(2, 4), randInt(1, 28)),
        planting_method: pick(["PLANTING", "GRAFTING"]),
        training_shape: pick(["FISHBONE", "UMBRELLA", "OTHER", "MIX"]),
        rootstock: pick(ROOTSTOCKS) ?? undefined,
        spacing: pick(SPACINGS) ?? undefined,
        analyses: generateAnalyses(ts),
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
    // Each field has exactly one planting per year. Every planting bears at
    // least one fruit variety and ~70% also include the male pollinator, each
    // variety carrying its own tree count.
    const ts = pastDate(2);
    const varieties: VarietyCount[] = [
      { variety: pick<Variety>(["AC22", "AC22", "AC22", "AC76"]), tree_count: randInt(80, 500) },
    ];
    if (Math.random() > 0.5 && !varieties.some((v) => v.variety === "AC76")) {
      varieties.push({ variety: "AC76", tree_count: randInt(50, 300) });
    }
    if (Math.random() > 0.3) {
      varieties.push({ variety: "MALE", tree_count: randInt(5, 40) });
    }
    plantings.push({
      id: uid(),
      field_id: f.id,
      varieties,
      tree_count: varieties.reduce((s, v) => s + v.tree_count, 0),
      planting_year: pick([2020, 2021, 2022, 2023, 2024, 2025]),
      planting_method: pick(["PLANTING", "GRAFTING"]),
      training_shape: pick(["FISHBONE", "UMBRELLA", "OTHER"]),
      rootstock: pick(ROOTSTOCKS),
      spacing: pick(SPACINGS),
      comments: pick(PLANTING_COMMENTS),
      created_at: ts,
      updated_at: ts,
    });
  });
  return plantings;
}

/**
 * One production record per field per harvest year. Yield is split across the
 * two fruit varieties (AC22 / AC76) the field actually grows — males never
 * produce, so a field with only males yields no record at all.
 */
function generateProduction(
  fields: Field[],
  plantings: Planting[],
): ProductionRecord[] {
  // Which varieties each field grows, and the earliest planting year.
  const varietiesByField = new Map<string, Set<Variety>>();
  const startYearByField = new Map<string, number>();
  plantings.forEach((p) => {
    const set = varietiesByField.get(p.field_id) ?? new Set<Variety>();
    p.varieties.forEach((v) => set.add(v.variety));
    varietiesByField.set(p.field_id, set);
    const y = p.planting_year ?? 0;
    const prev = startYearByField.get(p.field_id);
    if (prev === undefined || y < prev) startYearByField.set(p.field_id, y);
  });

  const records: ProductionRecord[] = [];
  fields.forEach((f) => {
    const grown = varietiesByField.get(f.id);
    if (!grown) return;
    const hasAC22 = grown.has("AC22");
    const hasAC76 = grown.has("AC76");
    if (!hasAC22 && !hasAC76) return; // males only → no production
    const start = startYearByField.get(f.id) ?? 0;

    const mkYield = () => {
      const ac22 = hasAC22 ? randDec(500, 6000, 0) : 0;
      const ac76 = hasAC76 ? randDec(400, 4500, 0) : 0;
      return { ac22_kg: ac22, ac76_kg: ac76, quantity_kg: ac22 + ac76 };
    };

    for (const year of [2023, 2024]) {
      if (start > year) continue;
      const ts = isoDate(year, 10, randInt(1, 28));
      records.push({
        id: uid(),
        field_id: f.id,
        harvest_year: year,
        ...mkYield(),
        is_estimate: false,
        notes: Math.random() > 0.8 ? "Καλή χρονιά" : undefined,
        created_at: ts,
        updated_at: ts,
      });
    }
    // Current-year figure is still an estimate.
    records.push({
      id: uid(),
      field_id: f.id,
      harvest_year: 2025,
      ...mkYield(),
      is_estimate: true,
      notes: "Εκτίμηση",
      created_at: isoNow(),
      updated_at: isoNow(),
    });
  });
  return records;
}

// ─── Settlement (Εκκαθάριση) generation ──────────────────────────────────────

const SETTLEMENT_TYPES: SettlementFileType[] = ["EXCEL", "PDF"];

function mkSettlementFile(year: number, i: number): SettlementFile {
  const type = pick(SETTLEMENT_TYPES);
  const ext = type === "PDF" ? "pdf" : "xlsx";
  const name = `ekkatharisi-${year}-${i + 1}.${ext}`;
  return {
    id: uid(),
    file_name: name,
    file_url: `/mock/settlements/${name}`,
    file_type: type,
    size_bytes: randInt(20_000, 400_000),
    uploaded_at: isoDate(year, 11, randInt(1, 28)),
  };
}

/** One settlement per year — each holds the partner's files covering all fields. */
function generateSettlements(): Settlement[] {
  return [2023, 2024].map((year) => {
    const numFiles = randInt(1, 3);
    const ts = isoDate(year, 12, randInt(1, 28));
    return {
      id: uid(),
      year,
      files: Array.from({ length: numFiles }, (_, i) =>
        mkSettlementFile(year, i),
      ),
      comments: undefined,
      created_at: ts,
      updated_at: ts,
    };
  });
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

// Issues are always tied to a photo: a subset of photos document a problem.
function generateIssues(photos: FieldPhoto[]): FieldIssue[] {
  const issues: FieldIssue[] = [];
  photos.forEach((photo) => {
    if (Math.random() > 0.25) return; // ~25% of photos document a problem
    const resolved = Math.random() > 0.5;
    const idx = randInt(0, ISSUE_TITLES.length - 1);
    issues.push({
      id: uid(),
      field_id: photo.field_id,
      photo_id: photo.id,
      title: ISSUE_TITLES[idx]!,
      description: ISSUE_DESCRIPTIONS[idx]!,
      severity: pick(["LOW", "MEDIUM", "HIGH"]),
      status: resolved ? "RESOLVED" : "OPEN",
      reported_at: photo.taken_at ?? pastDate(1).slice(0, 10),
      resolved_at: resolved
        ? isoDate(2025, randInt(1, 3), randInt(1, 28))
        : undefined,
      created_at: photo.created_at,
      updated_at: isoNow(),
    });
  });
  return issues;
}

// ─── In-memory database ──────────────────────────────────────────────────────

const producers = generateProducers();
const fields = generateFields(producers);
const plantings = generatePlantings(fields);
const production = generateProduction(fields, plantings);
const settlements = generateSettlements();
const financials = generateFinancials(producers);
const photos = generatePhotos(fields);
const issues = generateIssues(photos);

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
export type PlantingWithField = Planting & {
  field_name: string;
  owner_name: string;
  producer_id: string;
  /** Flat variety keys, for filtering/searching (the query engine can't see into objects). */
  variety_keys: Variety[];
};
export type ProductionWithContext = ProductionRecord & {
  producer_id: string;
  field_name: string;
  owner_name: string;
};
export type SettlementWithContext = Settlement & {
  file_count: number;
};
export type FinancialWithOwner = FinancialTransaction & { owner_name: string };
export type PhotoWithField = FieldPhoto & { field_name: string; owner_name: string; producer_id: string };
export type IssueWithField = FieldIssue & { field_name: string; owner_name: string; producer_id: string; photo_url?: string };

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

function enrichFields(): Field[] {
  const photoCountByField = new Map<string, number>();
  photos.forEach((p) =>
    photoCountByField.set(p.field_id, (photoCountByField.get(p.field_id) ?? 0) + 1)
  );
  return fields.map((f) => {
    const fp = plantingsByFieldId.get(f.id) ?? [];
    // Aggregate tree counts per variety across all of the field's plantings.
    const byVariety = new Map<Variety, number>();
    fp.forEach((p) => {
      p.varieties.forEach((v) => {
        byVariety.set(v.variety, (byVariety.get(v.variety) ?? 0) + v.tree_count);
      });
    });
    const order: Variety[] = ["AC22", "AC76", "MALE"];
    const planting_varieties: VarietyCount[] = order
      .filter((v) => byVariety.has(v))
      .map((v) => ({ variety: v, tree_count: byVariety.get(v)! }));
    const parts = planting_varieties.map(
      (v) => `${v.tree_count} ${v.variety === "MALE" ? "♂" : v.variety}`,
    );
    return {
      ...f,
      planting_summary: parts.length > 0 ? parts.join(" + ") : undefined,
      planting_varieties:
        planting_varieties.length > 0 ? planting_varieties : undefined,
      photo_count: photoCountByField.get(f.id) ?? 0,
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
      variety_keys: p.varieties.map((v) => v.variety),
    };
  });
}

function enrichProduction(): ProductionWithContext[] {
  return production.map((r) => {
    const field = fieldMap.get(r.field_id);
    return {
      ...r,
      producer_id: field?.producer_id ?? "",
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? producerMap.get(field.producer_id)?.display_name ?? "—"
        : "—",
    };
  });
}

function enrichSettlements(): SettlementWithContext[] {
  return settlements.map((s) => ({
    ...s,
    file_count: s.files.length,
  }));
}

function enrichFinancials(): FinancialWithOwner[] {
  return financials.map((t) => ({
    ...t,
    owner_name: producerMap.get(t.producer_id)?.display_name ?? "—",
  }));
}

function enrichPhotos(): PhotoWithField[] {
  const issueByPhoto = new Map(
    issues.filter((i) => i.photo_id).map((i) => [i.photo_id!, i])
  );
  return photos.map((p) => {
    const field = fieldMap.get(p.field_id);
    return {
      ...p,
      issue: issueByPhoto.get(p.id),
      producer_id: field?.producer_id ?? "",
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? producerMap.get(field.producer_id)?.display_name ?? "—"
        : "—",
    };
  });
}

function enrichIssues(): IssueWithField[] {
  const photoById = new Map(photos.map((p) => [p.id, p]));
  return issues.map((i) => {
    const field = fieldMap.get(i.field_id);
    return {
      ...i,
      producer_id: field?.producer_id ?? "",
      field_name: field?.location_name ?? "—",
      owner_name: field
        ? producerMap.get(field.producer_id)?.display_name ?? "—"
        : "—",
      photo_url: i.photo_id ? photoById.get(i.photo_id)?.url : undefined,
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
    result = result.filter((row) => {
      const cell = asMap(row)[key];
      // Array-valued columns (e.g. varieties) match on membership.
      return Array.isArray(cell)
        ? cell.map(String).includes(value)
        : String(cell) === value;
    });
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
    queryEngine(enrichFields(), p, ["location_name", "producer_name"]),
  "/api/plantings": (p) =>
    queryEngine(enrichPlantings(), p, ["field_name", "owner_name", "variety_keys", "rootstock", "comments"]),
  "/api/production": (p) =>
    queryEngine(enrichProduction(), p, ["field_name", "owner_name"]),
  "/api/settlements": (p) =>
    queryEngine(enrichSettlements(), p, ["comments"]),
  "/api/financials": (p) =>
    queryEngine(enrichFinancials(), p, ["owner_name", "vat_note", "notes"]),
  "/api/field-photos": (p) =>
    queryEngine(enrichPhotos(), p, ["field_name", "owner_name", "notes"]),
  "/api/field-issues": (p) =>
    queryEngine(enrichIssues(), p, ["field_name", "owner_name", "description"]),
};

// ─── Dashboard stats ─────────────────────────────────────────────────────────

function getDashboardStats(): DashboardStats {
  const activeProducers = producers.filter((e) => e.status === "ACTIVE").length;
  const totalFields = fields.length;
  const totalStremmata = +fields
    .reduce((sum, f) => sum + (f.stremmata ?? 0), 0)
    .toFixed(1);
  const totalProduction = production
    .filter((r) => r.harvest_year === 2024 && !r.is_estimate)
    .reduce((sum, r) => sum + r.quantity_kg, 0);
  const openIssues = issues.filter((i) => i.status === "OPEN").length;

  // Actual production per harvest year, split by fruit variety (oldest → newest).
  const byYear = new Map<number, ProductionYearPoint>();
  production
    .filter((r) => !r.is_estimate)
    .forEach((r) => {
      const point = byYear.get(r.harvest_year) ?? {
        year: r.harvest_year,
        ac22_kg: 0,
        ac76_kg: 0,
      };
      point.ac22_kg += r.ac22_kg;
      point.ac76_kg += r.ac76_kg;
      byYear.set(r.harvest_year, point);
    });
  const productionByYear = [...byYear.values()].sort((a, b) => a.year - b.year);

  // Tree population across every planting, split by variety.
  const treesByVariety = new Map<Variety, number>();
  plantings.forEach((p) =>
    p.varieties.forEach((v) =>
      treesByVariety.set(
        v.variety,
        (treesByVariety.get(v.variety) ?? 0) + v.tree_count,
      ),
    ),
  );
  const varietyComposition: VarietyCompositionPoint[] = (
    ["AC22", "AC76", "MALE"] as Variety[]
  )
    .map((variety) => ({ variety, tree_count: treesByVariety.get(variety) ?? 0 }))
    .filter((v) => v.tree_count > 0);

  // Open issues grouped by severity (every level present so bars stay stable).
  const openBySeverity = new Map<IssueSeverity, number>();
  issues
    .filter((i) => i.status === "OPEN")
    .forEach((i) =>
      openBySeverity.set(i.severity, (openBySeverity.get(i.severity) ?? 0) + 1),
    );
  const openIssuesBySeverity: SeverityCountPoint[] = (
    ["LOW", "MEDIUM", "HIGH"] as IssueSeverity[]
  ).map((severity) => ({ severity, count: openBySeverity.get(severity) ?? 0 }));

  // Estimate vs. actual for the most recent year that has any record.
  const latestYear = production.reduce(
    (max, r) => Math.max(max, r.harvest_year),
    0,
  );
  const estimateVsActual: EstimateVsActualPoint | null = latestYear
    ? {
        year: latestYear,
        estimate_kg: production
          .filter((r) => r.harvest_year === latestYear && r.is_estimate)
          .reduce((sum, r) => sum + r.quantity_kg, 0),
        actual_kg: production
          .filter((r) => r.harvest_year === latestYear && !r.is_estimate)
          .reduce((sum, r) => sum + r.quantity_kg, 0),
      }
    : null;

  // Actual kg per stremma per year (uses current total area as the denominator).
  const yieldPerStremmaByYear: YieldPerStremmaPoint[] = productionByYear.map(
    (p) => ({
      year: p.year,
      kg_per_stremma: totalStremmata
        ? +((p.ac22_kg + p.ac76_kg) / totalStremmata).toFixed(1)
        : 0,
    }),
  );

  // Producers grouped by status.
  const statusCount = new Map<ProducerStatus, number>();
  producers.forEach((pr) =>
    statusCount.set(pr.status, (statusCount.get(pr.status) ?? 0) + 1),
  );
  const producersByStatus: StatusCountPoint[] = (
    ["LEAD", "ACTIVE", "INACTIVE"] as ProducerStatus[]
  )
    .map((status) => ({ status, count: statusCount.get(status) ?? 0 }))
    .filter((s) => s.count > 0);

  // Total stremmata per region, largest first.
  const regionArea = new Map<string, number>();
  fields.forEach((f) => {
    const region = f.region?.trim() || "Άγνωστη";
    regionArea.set(region, (regionArea.get(region) ?? 0) + (f.stremmata ?? 0));
  });
  const stremmataByRegion: RegionStremmataPoint[] = [...regionArea.entries()]
    .map(([region, stremmata]) => ({ region, stremmata: +stremmata.toFixed(1) }))
    .sort((a, b) => b.stremmata - a.stremmata);

  // Field photos grouped by category.
  const categoryCount = new Map<PhotoCategory, number>();
  photos.forEach((ph) =>
    categoryCount.set(ph.category, (categoryCount.get(ph.category) ?? 0) + 1),
  );
  const photosByCategory: CategoryCountPoint[] = (
    [
      "KLADEMA",
      "ARAIWMA_BLASTOU",
      "ARAIWMA_KARPOU",
      "KALOKAIRI_NERA",
      "PERIODOS_SUGKOMIDIS",
      "OTHER",
    ] as PhotoCategory[]
  )
    .map((category) => ({ category, count: categoryCount.get(category) ?? 0 }))
    .filter((c) => c.count > 0);

  return {
    activeProducers,
    totalFields,
    totalStremmata,
    totalProduction,
    openIssues,
    productionByYear,
    varietyComposition,
    openIssuesBySeverity,
    estimateVsActual,
    yieldPerStremmaByYear,
    producersByStatus,
    stremmataByRegion,
    photosByCategory,
  };
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

/** Fields a client is allowed to set on a field. */
type FieldInput = Partial<
  Pick<
    Field,
    | "producer_id"
    | "producer_name"
    | "location_name"
    | "region"
    | "stremmata"
    | "gps_coordinates"
    | "planting_date"
    | "planting_method"
    | "training_shape"
    | "rootstock"
    | "spacing"
    | "total_plants"
    | "comments"
    | "analyses"
  >
>;

/** Give newly-uploaded analyses the server-side fields the client can't set. */
function normalizeAnalyses(
  list?: Partial<FieldAnalysisFile>[]
): FieldAnalysisFile[] | undefined {
  if (!list || list.length === 0) return undefined;
  return list.map((a) => {
    const name = a.file_name ?? "analysis.xlsx";
    return {
      id: a.id ?? uid(),
      file_name: name,
      file_url: a.file_url ?? `/mock/analyses/${name}`,
      size_bytes: a.size_bytes,
      uploaded_at: a.uploaded_at ?? new Date().toISOString(),
    };
  });
}

function resolveProducerName(producerId?: string, fallback?: string): string {
  return (
    fallback ??
    (producerId ? producerMap.get(producerId)?.display_name : undefined) ??
    "—"
  );
}

function createField(body: FieldInput): Field {
  const now = new Date().toISOString();
  const field: Field = {
    id: uid(),
    producer_id: body.producer_id ?? "",
    producer_name: resolveProducerName(body.producer_id, body.producer_name),
    location_name: body.location_name?.trim() ?? "",
    region: blankToUndef(body.region),
    stremmata: body.stremmata,
    gps_coordinates: blankToUndef(body.gps_coordinates),
    planting_date: blankToUndef(body.planting_date),
    planting_method: body.planting_method,
    training_shape: body.training_shape,
    rootstock: blankToUndef(body.rootstock),
    spacing: blankToUndef(body.spacing),
    total_plants: body.total_plants,
    comments: blankToUndef(body.comments),
    analyses: normalizeAnalyses(body.analyses),
    created_at: now,
    updated_at: now,
  };
  fields.push(field);
  fieldMap.set(field.id, field);
  return field;
}

function updateField(id: string, body: FieldInput): Field | null {
  const existing = fieldMap.get(id);
  if (!existing) return null;
  if (body.producer_id) {
    existing.producer_id = body.producer_id;
    existing.producer_name = resolveProducerName(
      body.producer_id,
      body.producer_name
    );
  }
  if (body.location_name !== undefined) {
    existing.location_name = body.location_name.trim() || existing.location_name;
  }
  existing.region = blankToUndef(body.region);
  existing.stremmata = body.stremmata;
  existing.gps_coordinates = blankToUndef(body.gps_coordinates);
  existing.planting_date = blankToUndef(body.planting_date);
  existing.planting_method = body.planting_method;
  existing.training_shape = body.training_shape;
  existing.rootstock = blankToUndef(body.rootstock);
  existing.spacing = blankToUndef(body.spacing);
  existing.total_plants = body.total_plants;
  existing.comments = blankToUndef(body.comments);
  existing.analyses = normalizeAnalyses(body.analyses);
  existing.updated_at = new Date().toISOString();
  return existing;
}

/** Fields a client is allowed to set on a planting. */
type PlantingInput = Partial<
  Pick<
    Planting,
    | "field_id"
    | "varieties"
    | "planting_year"
    | "planting_method"
    | "training_shape"
    | "rootstock"
    | "spacing"
    | "comments"
  >
>;

/** Keep only real varieties with a positive count, and sum the total. */
function normalizeVarieties(list?: VarietyCount[]): VarietyCount[] {
  return (list ?? [])
    .filter((v) => v.variety && Number(v.tree_count) > 0)
    .map((v) => ({ variety: v.variety, tree_count: Number(v.tree_count) }));
}

function createPlanting(body: PlantingInput): Planting {
  const now = new Date().toISOString();
  const varieties = normalizeVarieties(body.varieties);
  const planting: Planting = {
    id: uid(),
    field_id: body.field_id ?? "",
    varieties,
    tree_count: varieties.reduce((s, v) => s + v.tree_count, 0),
    planting_year: body.planting_year,
    planting_method: body.planting_method,
    training_shape: body.training_shape,
    rootstock: blankToUndef(body.rootstock),
    spacing: blankToUndef(body.spacing),
    comments: blankToUndef(body.comments),
    created_at: now,
    updated_at: now,
  };
  plantings.push(planting);
  plantingMap.set(planting.id, planting);
  plantingsByFieldId.set(planting.field_id, [
    ...(plantingsByFieldId.get(planting.field_id) ?? []),
    planting,
  ]);
  return planting;
}

function updatePlanting(id: string, body: PlantingInput): Planting | null {
  const existing = plantingMap.get(id);
  if (!existing) return null;
  if (body.field_id) existing.field_id = body.field_id;
  if (body.varieties) {
    existing.varieties = normalizeVarieties(body.varieties);
    existing.tree_count = existing.varieties.reduce((s, v) => s + v.tree_count, 0);
  }
  if (body.planting_year !== undefined) existing.planting_year = body.planting_year;
  if (body.planting_method !== undefined) existing.planting_method = body.planting_method;
  if (body.training_shape !== undefined) existing.training_shape = body.training_shape;
  existing.rootstock = blankToUndef(body.rootstock);
  existing.spacing = blankToUndef(body.spacing);
  existing.comments = blankToUndef(body.comments);
  existing.updated_at = new Date().toISOString();
  return existing;
}

/** Fields a client is allowed to set on a production record. */
type ProductionInput = Partial<
  Pick<
    ProductionRecord,
    "field_id" | "harvest_year" | "ac22_kg" | "ac76_kg" | "is_estimate" | "notes"
  >
>;

function createProduction(body: ProductionInput): ProductionRecord {
  const now = new Date().toISOString();
  const ac22 = Number(body.ac22_kg) || 0;
  const ac76 = Number(body.ac76_kg) || 0;
  const record: ProductionRecord = {
    id: uid(),
    field_id: body.field_id ?? "",
    harvest_year: Number(body.harvest_year) || new Date().getFullYear(),
    ac22_kg: ac22,
    ac76_kg: ac76,
    quantity_kg: ac22 + ac76,
    is_estimate: !!body.is_estimate,
    notes: blankToUndef(body.notes),
    created_at: now,
    updated_at: now,
  };
  production.push(record);
  return record;
}

function updateProduction(id: string, body: ProductionInput): ProductionRecord | null {
  const existing = production.find((r) => r.id === id);
  if (!existing) return null;
  if (body.field_id) existing.field_id = body.field_id;
  if (body.harvest_year !== undefined) existing.harvest_year = Number(body.harvest_year);
  if (body.ac22_kg !== undefined) existing.ac22_kg = Number(body.ac22_kg) || 0;
  if (body.ac76_kg !== undefined) existing.ac76_kg = Number(body.ac76_kg) || 0;
  existing.quantity_kg = existing.ac22_kg + existing.ac76_kg;
  if (body.is_estimate !== undefined) existing.is_estimate = !!body.is_estimate;
  existing.notes = blankToUndef(body.notes);
  existing.updated_at = new Date().toISOString();
  return existing;
}

/** Fields a client is allowed to set on a settlement. */
type SettlementInput = Partial<
  Pick<Settlement, "year" | "files" | "comments">
>;

/** Give newly-uploaded settlement files the server-side fields the client can't set. */
function normalizeSettlementFiles(
  list?: Partial<SettlementFile>[],
): SettlementFile[] {
  if (!list) return [];
  return list.map((a) => {
    const name = a.file_name ?? "settlement.xlsx";
    const type: SettlementFileType =
      a.file_type ?? (name.toLowerCase().endsWith(".pdf") ? "PDF" : "EXCEL");
    return {
      id: a.id ?? uid(),
      file_name: name,
      file_url: a.file_url ?? `/mock/settlements/${name}`,
      file_type: type,
      size_bytes: a.size_bytes,
      uploaded_at: a.uploaded_at ?? new Date().toISOString(),
    };
  });
}

function createSettlement(body: SettlementInput): Settlement {
  const now = new Date().toISOString();
  const settlement: Settlement = {
    id: uid(),
    year: Number(body.year) || new Date().getFullYear(),
    files: normalizeSettlementFiles(body.files),
    comments: blankToUndef(body.comments),
    created_at: now,
    updated_at: now,
  };
  settlements.push(settlement);
  return settlement;
}

function updateSettlement(id: string, body: SettlementInput): Settlement | null {
  const existing = settlements.find((s) => s.id === id);
  if (!existing) return null;
  if (body.year !== undefined) existing.year = Number(body.year);
  if (body.files) existing.files = normalizeSettlementFiles(body.files);
  existing.comments = blankToUndef(body.comments);
  existing.updated_at = new Date().toISOString();
  return existing;
}

// ─── Field photo (+ tied issue) mutations ────────────────────────────────────

/** Issue fields a client may set when reporting a problem from a photo. */
type IssueInput = Partial<
  Pick<FieldIssue, "title" | "description" | "severity" | "status" | "reported_at">
>;

/**
 * A photo upload. When `has_issue` is set, the embedded `issue` is created and
 * linked back to the photo, so an issue is always tied to a photo.
 */
type PhotoInput = Partial<
  Pick<FieldPhoto, "field_id" | "url" | "category" | "taken_at" | "notes">
> & {
  has_issue?: boolean;
  issue?: IssueInput;
};

const today = () => new Date().toISOString().slice(0, 10);

function upsertPhotoIssue(photo: FieldPhoto, src: IssueInput): FieldIssue {
  const now = new Date().toISOString();
  const existing = issues.find((i) => i.photo_id === photo.id);
  if (existing) {
    if (src.title !== undefined) existing.title = src.title.trim();
    if (src.description !== undefined) existing.description = src.description.trim();
    if (src.severity) existing.severity = src.severity as IssueSeverity;
    if (src.status) {
      existing.status = src.status as IssueStatus;
      existing.resolved_at =
        src.status === "RESOLVED" ? existing.resolved_at ?? today() : undefined;
    }
    existing.updated_at = now;
    return existing;
  }
  const issue: FieldIssue = {
    id: uid(),
    field_id: photo.field_id,
    photo_id: photo.id,
    title: src.title?.trim() ?? "",
    description: src.description?.trim() ?? "",
    severity: (src.severity as IssueSeverity) ?? "MEDIUM",
    status: (src.status as IssueStatus) ?? "OPEN",
    reported_at: src.reported_at || photo.taken_at || today(),
    resolved_at: src.status === "RESOLVED" ? today() : undefined,
    created_at: now,
    updated_at: now,
  };
  issues.push(issue);
  return issue;
}

function removePhotoIssue(photoId: string) {
  const idx = issues.findIndex((i) => i.photo_id === photoId);
  if (idx >= 0) issues.splice(idx, 1);
}

// ─── Standalone field-issue mutations ────────────────────────────────────────

/**
 * Fields a client may set when reporting an issue directly from the issues page.
 * `field_id` is required; a photo is **optional** — `photo_id` links to one when
 * provided, is omitted to leave it unchanged, or sent as `null` to unlink.
 */
type StandaloneIssueInput = Partial<
  Pick<
    FieldIssue,
    "field_id" | "title" | "description" | "severity" | "status" | "reported_at"
  >
> & { photo_id?: string | null };

function createIssue(body: StandaloneIssueInput): FieldIssue {
  const now = new Date().toISOString();
  const status = (body.status as IssueStatus) ?? "OPEN";
  const issue: FieldIssue = {
    id: uid(),
    field_id: body.field_id ?? "",
    photo_id: body.photo_id ?? undefined,
    title: body.title?.trim() ?? "",
    description: body.description?.trim() ?? "",
    severity: (body.severity as IssueSeverity) ?? "MEDIUM",
    status,
    reported_at: body.reported_at || today(),
    resolved_at: status === "RESOLVED" ? today() : undefined,
    created_at: now,
    updated_at: now,
  };
  issues.push(issue);
  return issue;
}

function updateIssue(id: string, body: StandaloneIssueInput): FieldIssue | null {
  const existing = issues.find((i) => i.id === id);
  if (!existing) return null;
  if (body.field_id) existing.field_id = body.field_id;
  if (body.title !== undefined) existing.title = body.title.trim();
  if (body.description !== undefined) existing.description = body.description.trim();
  if (body.severity) existing.severity = body.severity as IssueSeverity;
  if (body.status) {
    existing.status = body.status as IssueStatus;
    existing.resolved_at =
      body.status === "RESOLVED" ? existing.resolved_at ?? today() : undefined;
  }
  if (body.reported_at) existing.reported_at = body.reported_at;
  // `null` unlinks the photo, a string relinks it, `undefined` leaves it as-is.
  if (body.photo_id !== undefined) existing.photo_id = body.photo_id ?? undefined;
  existing.updated_at = new Date().toISOString();
  return existing;
}

function createPhoto(body: PhotoInput): FieldPhoto {
  const now = new Date().toISOString();
  const photo: FieldPhoto = {
    id: uid(),
    field_id: body.field_id ?? "",
    url: body.url?.trim() ?? "",
    category: (body.category as PhotoCategory) ?? "OTHER",
    taken_at: blankToUndef(body.taken_at),
    notes: blankToUndef(body.notes),
    created_at: now,
  };
  photos.push(photo);
  const issue = body.has_issue ? upsertPhotoIssue(photo, body.issue ?? {}) : undefined;
  return { ...photo, issue };
}

function updatePhoto(id: string, body: PhotoInput): FieldPhoto | null {
  const existing = photos.find((p) => p.id === id);
  if (!existing) return null;
  if (body.notes !== undefined) existing.notes = blankToUndef(body.notes);
  if (body.category) existing.category = body.category as PhotoCategory;
  if (body.taken_at !== undefined) existing.taken_at = blankToUndef(body.taken_at);
  if (body.has_issue === true) {
    upsertPhotoIssue(existing, body.issue ?? {});
  } else if (body.has_issue === false) {
    removePhotoIssue(id);
  }
  const issue = issues.find((i) => i.photo_id === id);
  return { ...existing, issue };
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

    // ── Writes (producers + fields) ───────────────────────────────────────
    if (method !== "GET" && method !== "HEAD") {
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};

      if (path === "/api/producers" && method === "POST") {
        return jsonResponse(createProducer(body as ProducerInput), 201);
      }
      const producerEdit = path?.match(/^\/api\/producers\/([^/]+)$/);
      if (producerEdit && (method === "PATCH" || method === "PUT")) {
        const updated = updateProducer(producerEdit[1]!, body as ProducerInput);
        return updated
          ? jsonResponse(updated)
          : jsonResponse({ message: "Not found" }, 404);
      }

      if (path === "/api/fields" && method === "POST") {
        return jsonResponse(createField(body as FieldInput), 201);
      }
      const fieldEdit = path?.match(/^\/api\/fields\/([^/]+)$/);
      if (fieldEdit && (method === "PATCH" || method === "PUT")) {
        const updated = updateField(fieldEdit[1]!, body as FieldInput);
        return updated
          ? jsonResponse(updated)
          : jsonResponse({ message: "Not found" }, 404);
      }

      if (path === "/api/plantings" && method === "POST") {
        return jsonResponse(createPlanting(body as PlantingInput), 201);
      }
      const plantingEdit = path?.match(/^\/api\/plantings\/([^/]+)$/);
      if (plantingEdit && (method === "PATCH" || method === "PUT")) {
        const updated = updatePlanting(plantingEdit[1]!, body as PlantingInput);
        return updated
          ? jsonResponse(updated)
          : jsonResponse({ message: "Not found" }, 404);
      }

      if (path === "/api/production" && method === "POST") {
        return jsonResponse(createProduction(body as ProductionInput), 201);
      }
      const productionEdit = path?.match(/^\/api\/production\/([^/]+)$/);
      if (productionEdit && (method === "PATCH" || method === "PUT")) {
        const updated = updateProduction(productionEdit[1]!, body as ProductionInput);
        return updated
          ? jsonResponse(updated)
          : jsonResponse({ message: "Not found" }, 404);
      }

      if (path === "/api/settlements" && method === "POST") {
        return jsonResponse(createSettlement(body as SettlementInput), 201);
      }
      const settlementEdit = path?.match(/^\/api\/settlements\/([^/]+)$/);
      if (settlementEdit && (method === "PATCH" || method === "PUT")) {
        const updated = updateSettlement(settlementEdit[1]!, body as SettlementInput);
        return updated
          ? jsonResponse(updated)
          : jsonResponse({ message: "Not found" }, 404);
      }

      if (path === "/api/field-photos" && method === "POST") {
        return jsonResponse(createPhoto(body as PhotoInput), 201);
      }
      const photoEdit = path?.match(/^\/api\/field-photos\/([^/]+)$/);
      if (photoEdit && (method === "PATCH" || method === "PUT")) {
        const updated = updatePhoto(photoEdit[1]!, body as PhotoInput);
        return updated
          ? jsonResponse(updated)
          : jsonResponse({ message: "Not found" }, 404);
      }

      if (path === "/api/field-issues" && method === "POST") {
        return jsonResponse(createIssue(body as StandaloneIssueInput), 201);
      }
      const issueEdit = path?.match(/^\/api\/field-issues\/([^/]+)$/);
      if (issueEdit && (method === "PATCH" || method === "PUT")) {
        const updated = updateIssue(issueEdit[1]!, body as StandaloneIssueInput);
        return updated
          ? jsonResponse(updated)
          : jsonResponse({ message: "Not found" }, 404);
      }

      return jsonResponse({ message: "Method not allowed" }, 405);
    }

    // ── Reads ─────────────────────────────────────────────────────────────
    if (path === "/api/dashboard") {
      return jsonResponse(getDashboardStats());
    }

    const handler = handlers[path!];
    if (!handler) {
      return jsonResponse({ message: "Not found" }, 404);
    }

    return jsonResponse(handler(params));
  };

  console.log(
    "%c🫒 SEAPP Mock API active — %d producers, %d fields, %d plantings, %d production records, %d settlements, %d transactions",
    "color: #13a319; font-weight: bold",
    producers.length,
    fields.length,
    plantings.length,
    production.length,
    settlements.length,
    financials.length
  );
}
