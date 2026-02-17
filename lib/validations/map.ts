import { z } from "zod";

const hexColor = z
  .string()
  .trim()
  .regex(/^#?[0-9a-fA-F]{6}$/, "Invalid color (expected 6-digit hex).")
  .transform((val) => (val.startsWith("#") ? val : `#${val}`));

export const mapLayerStateSchema = z
  .object({
    calls: z.coerce.boolean().default(true),
    units: z.coerce.boolean().default(true),
    pois: z.coerce.boolean().default(true),
    zones: z.coerce.boolean().default(true),
    heatmap: z.coerce.boolean().default(false),
    labels: z.coerce.boolean().default(true),
    postalGrid: z.coerce.boolean().default(false),
  })
  .strict();

export type MapLayerState = z.infer<typeof mapLayerStateSchema>;

export const mapViewStateUpdateSchema = z
  .object({
    // Stored in existing centerLat/centerLng columns for backward compatibility.
    centerLat: z.coerce.number().finite().min(0).max(1),
    centerLng: z.coerce.number().finite().min(0).max(1),
    zoom: z.coerce.number().finite().min(0.4).max(8),
    enabledLayers: mapLayerStateSchema,
  })
  .strict();

export type MapViewStateUpdate = z.infer<typeof mapViewStateUpdateSchema>;

export const mapPoiCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(400).optional().nullable(),
    category: z.string().trim().min(2).max(32).default("general"),
    lat: z.coerce.number().finite().min(-90).max(90).optional().nullable(),
    lng: z.coerce.number().finite().min(-180).max(180).optional().nullable(),
    mapX: z.coerce.number().finite().min(0).max(1).optional().nullable(),
    mapY: z.coerce.number().finite().min(0).max(1).optional().nullable(),
    icon: z.string().trim().min(1).max(64).optional().nullable(),
    color: hexColor.optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const hasLat = typeof val.lat === "number";
    const hasLng = typeof val.lng === "number";
    const hasMapX = typeof val.mapX === "number";
    const hasMapY = typeof val.mapY === "number";

    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        path: hasLat ? ["lng"] : ["lat"],
        message: "Latitude and longitude must be provided together.",
      });
    }

    if (hasMapX !== hasMapY) {
      ctx.addIssue({
        code: "custom",
        path: hasMapX ? ["mapY"] : ["mapX"],
        message: "Map X and Map Y must be provided together.",
      });
    }

    if (!(hasLat && hasLng) && !(hasMapX && hasMapY)) {
      ctx.addIssue({
        code: "custom",
        path: ["mapX"],
        message: "POI requires either map coordinates or geographic coordinates.",
      });
    }
  })
  .strict();

export const mapPoiUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(400).optional().nullable(),
    category: z.string().trim().min(2).max(32).optional(),
    lat: z.coerce.number().finite().min(-90).max(90).optional().nullable(),
    lng: z.coerce.number().finite().min(-180).max(180).optional().nullable(),
    mapX: z.coerce.number().finite().min(0).max(1).optional().nullable(),
    mapY: z.coerce.number().finite().min(0).max(1).optional().nullable(),
    icon: z.string().trim().min(1).max(64).optional().nullable(),
    color: hexColor.optional().nullable(),
    isHidden: z.coerce.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const hasLat = typeof val.lat === "number";
    const hasLng = typeof val.lng === "number";
    const hasMapX = typeof val.mapX === "number";
    const hasMapY = typeof val.mapY === "number";
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        path: hasLat ? ["lng"] : ["lat"],
        message: "Latitude and longitude must be provided together.",
      });
    }
    if (hasMapX !== hasMapY) {
      ctx.addIssue({
        code: "custom",
        path: hasMapX ? ["mapY"] : ["mapX"],
        message: "Map X and Map Y must be provided together.",
      });
    }
  })
  .strict();

type GeoJSONPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};
type GeoJSONMultiPolygon = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

function isPolygonLike(val: unknown): val is GeoJSONPolygon | GeoJSONMultiPolygon {
  if (!val || typeof val !== "object") return false;
  const obj = val as any;
  if (obj.type !== "Polygon" && obj.type !== "MultiPolygon") return false;
  return Array.isArray(obj.coordinates);
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isValidNormPair(val: unknown): val is [number, number] {
  if (!Array.isArray(val) || val.length !== 2) return false;
  const [x, y] = val as any[];
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return false;
  if (x < 0 || x > 1) return false;
  if (y < 0 || y > 1) return false;
  return true;
}

function ringClosed(ring: [number, number][]) {
  if (ring.length < 4) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last) return false;
  return first[0] === last[0] && first[1] === last[1];
}

function polygonLikeCoordinatesValid(val: unknown) {
  if (!isPolygonLike(val)) return false;
  const obj = val as any;

  if (obj.type === "Polygon") {
    const rings = obj.coordinates as unknown;
    if (!Array.isArray(rings) || rings.length < 1) return false;

    for (const ring of rings) {
      if (!Array.isArray(ring)) return false;
      const coords = ring as unknown[];
      if (coords.length < 4) return false;
      if (!coords.every(isValidNormPair)) return false;
      if (!ringClosed(coords as [number, number][])) return false;
    }
    return true;
  }

  // MultiPolygon
  const polys = obj.coordinates as unknown;
  if (!Array.isArray(polys) || polys.length < 1) return false;
  for (const poly of polys) {
    if (!Array.isArray(poly) || poly.length < 1) return false;
    for (const ring of poly) {
      if (!Array.isArray(ring)) return false;
      const coords = ring as unknown[];
      if (coords.length < 4) return false;
      if (!coords.every(isValidNormPair)) return false;
      if (!ringClosed(coords as [number, number][])) return false;
    }
  }

  return true;
}

function geojsonSizeOk(val: unknown) {
  try {
    const raw = JSON.stringify(val);
    return raw.length <= 80_000; // prevent accidentally storing huge payloads
  } catch {
    return false;
  }
}

export const mapZoneCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    zoneType: z.string().trim().min(2).max(24).default("patrol"),
    geojson: z
      .unknown()
      .refine(isPolygonLike, "GeoJSON must be a Polygon or MultiPolygon.")
      .refine(
        polygonLikeCoordinatesValid,
        "GeoJSON polygon coordinates are invalid (must be closed and in bounds).",
      )
      .refine(geojsonSizeOk, "GeoJSON too large."),
    color: hexColor.optional().nullable(),
  })
  .strict();

export const mapZoneUpdateSchema = mapZoneCreateSchema
  .partial()
  .extend({
    isHidden: z.coerce.boolean().optional(),
  })
  .strict();

function isSafeMapStyleUrl(val: string) {
  const url = val.trim();
  if (!url) return false;
  // Allow local styles (preferred) and https styles. Allow http in dev only.
  if (url.startsWith("/")) return true;
  if (url.startsWith("https://")) return true;
  if (process.env.NODE_ENV !== "production" && url.startsWith("http://")) return true;
  return false;
}

export const mapSettingsSchema = z
  .object({
    styleUrl: z
      .string()
      .trim()
      .min(2)
      .max(500)
      .refine(isSafeMapStyleUrl, "Style URL must be a relative path or https URL."),
  })
  .strict();

export type MapSettings = z.infer<typeof mapSettingsSchema>;
