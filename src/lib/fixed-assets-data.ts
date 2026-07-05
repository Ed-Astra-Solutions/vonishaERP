// Faithful port of the hardcoded `projectData` in the Flutter app
// (screens/Admin/Expenses/assets_desktop.dart).
//
// In Flutter, `getFixedAssets` from the server is used ONLY to obtain the list of
// center names; the actual per-center asset breakdown that renders on screen comes
// from this local constant, matched to the server's centers by name. Each center is
// a two-level structure: center -> sections (grades/rooms) -> assets ({ name: qty }).

export interface Asset {
  name: string;
  value: string;
}

export interface AssetSection {
  section: string;
  assets: Asset[];
}

// Raw shape mirrors the Dart source exactly to minimize transcription risk:
// [{ <centerName>: [{ <sectionName>: [{ <assetName>: <value> }] }] }]
type RawSection = Record<string, Record<string, string>[]>;
type RawCenter = Record<string, RawSection[]>;

const RAW_REFERENCE: RawCenter[] = [
  {
    "St.Igntius School - Begur": [
      {
        "Pre kg/LKG": [
          { "White Board": "0" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "14 Table, 30 Chairs" },
          { "Steel Almirah": "1" },
          { Fan: "2" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        UKG: [
          { "White Board": "0" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "11 table, 25 chairs" },
          { "Steel Almirah": "0" },
          { Fan: "0" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Grade - 1": [
          { "White Board": "0" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "9 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "2" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "1" },
        ],
      },
      {
        "Grade - 2": [
          { "White Board": "0" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "9 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "2" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Grade - 3": [
          { "White Board": "0" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "9 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "2" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Grade - 4": [
          { "White Board": "1" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "4 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "1" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Grade - 5": [
          { "White Board": "1" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "8 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "2" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Grade - 6": [
          { "White Board": "0" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "5 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "2" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Grade - 7": [
          { "White Board": "0" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "9 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "2" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Grade - 8": [
          { "White Board": "1" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "5 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "1" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "School Staff Room": [
          { "White Board": "1" },
          { "Teachers Table": "Blue Table - 4" },
          { "Teachers Chair": "Blue Chair - 8" },
          { "Bench & Desk": "0" },
          { "Steel Almirah": "0" },
          { Fan: "0" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "School Office Room": [
          { "White Board": "2" },
          { "Teachers Table": "Dining Table - 1" },
          { "Teachers Chair": "Chair 15 & Well 1" },
          { "Bench & Desk": "0" },
          { "Steel Almirah": "Rack - 3 & Almirah - 3" },
          { Fan: "0" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "10" },
        ],
      },
      {
        "Stock Room": [
          { "White Board": "0" },
          { "Teachers Table": "0" },
          { "Teachers Chair": "0" },
          { "Bench & Desk": "0" },
          { "Steel Almirah": "0" },
          { Fan: "0" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "Curiculm Book - 1" },
        ],
      },
      {
        "Kitchen Room": [
          { "White Board": "Gas Stove - 1" },
          { "Teachers Table": "Library Shelf - 1" },
          { "Teachers Chair": "Table - 1" },
          { "Bench & Desk": "0" },
          { "Steel Almirah": "Water Dispenser - 5" },
          { Fan: "0" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
    ],
  },
  {
    "OBE - Begur": [
      {
        "Level - 1": [
          { "White Board": "1" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "9 Desk" },
          { "Steel Almirah": "Small Rack - 1" },
          { Fan: "0" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Level - 2": [
          { "White Board": "1" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "19 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "1" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Level - 3": [
          { "White Board": "1" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "4 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "1" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
    ],
  },
  {
    AKSHYA: [
      {
        "NIOS Secondary": [
          { "White Board": "1" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "6 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "1" },
          { Dustbin: "1" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "NIOS Sr.secondary": [
          { "White Board": "1" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "5 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "1" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        KSEEB: [
          { "White Board": "1" },
          { "Teachers Table": "1" },
          { "Teachers Chair": "1" },
          { "Bench & Desk": "8 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "1" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
      {
        "Stock Room": [
          { "White Board": "Notice Board - 1" },
          { "Teachers Table": "0" },
          { "Teachers Chair": "0" },
          { "Bench & Desk": "6 Tables & 50 New Chair" },
          { "Steel Almirah": "1" },
          { Fan: "0" },
          { Dustbin: "3" },
          { Camera: "0" },
          { "Computer system": "1" },
        ],
      },
    ],
  },
  {
    "OBE E-city": [
      {
        "OBE Center": [
          { "White Board": "0" },
          { "Teachers Table": "0" },
          { "Teachers Chair": "5 Chairs" },
          { "Bench & Desk": "0" },
          { "Steel Almirah": "0" },
          { Fan: "0" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
    ],
  },
  {
    "RLC BDP": [
      {
        "RLC Center": [
          { "White Board": "0" },
          { "Teachers Table": "0" },
          { "Teachers Chair": "2 Chairs" },
          { "Bench & Desk": "8 Desk" },
          { "Steel Almirah": "0" },
          { Fan: "0" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
    ],
  },
  {
    "RLC VPL": [
      {
        "RLC Center": [
          { "White Board": "0" },
          { "Teachers Table": "0" },
          { "Teachers Chair": "1 Chair" },
          { "Bench & Desk": "2 Jamakhan" },
          { "Steel Almirah": "0" },
          { Fan: "0" },
          { Dustbin: "0" },
          { Camera: "0" },
          { "Computer system": "0" },
        ],
      },
    ],
  },
  { "RLC CKB": [] },
  { "DCH-ASP": [] },
  { "DKH-ASP": [] },
  { "Hulimangla- ASP": [] },
];

/** Normalize the two-level raw shape into typed sections/assets. */
function normalizeSections(raw: RawSection[]): AssetSection[] {
  return raw.map((sec) => {
    const [section, assets] = Object.entries(sec)[0] ?? ["", []];
    return {
      section,
      assets: (assets ?? []).map((a) => {
        const [name, value] = Object.entries(a)[0] ?? ["—", "—"];
        return { name, value: String(value) };
      }),
    };
  });
}

/** Center name -> its section/asset breakdown, keyed for name-based lookup. */
export const FIXED_ASSET_REFERENCE: Record<string, AssetSection[]> = Object.fromEntries(
  RAW_REFERENCE.map((c) => {
    const [center, sections] = Object.entries(c)[0] ?? ["", []];
    return [center, normalizeSections(sections ?? [])];
  }),
);

/**
 * Interpret whatever the server stored in a center's `data` field. Handles both the
 * two-level shape ([{ section: [{ asset: val }] }]) and a flat single-level list
 * ([{ asset: val }]), returning normalized sections. Falls back to the hardcoded
 * reference when the center is known but its stored data is empty/unusable.
 */
export function sectionsForCenter(center: string, data: unknown): AssetSection[] {
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    const firstVal =
      first && typeof first === "object" ? Object.values(first as object)[0] : undefined;
    if (Array.isArray(firstVal)) {
      // two-level: [{ section: [{ asset: val }] }]
      return normalizeSections(data as RawSection[]);
    }
    // flat: [{ asset: val }] -> a single unnamed section
    const assets = (data as Record<string, unknown>[]).map((a) => {
      const [name, value] = Object.entries(a)[0] ?? ["—", "—"];
      return { name, value: String(value) };
    });
    return [{ section: "", assets }];
  }
  return FIXED_ASSET_REFERENCE[center] ?? [];
}
