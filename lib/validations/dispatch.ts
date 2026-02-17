import { DispatchCallStatus, DispatchUnitStatus, DispatchUnitType } from "@prisma/client";
import { z } from "zod";

function nullableNumberInRange(min: number, max: number) {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : NaN;
  }, z.number().min(min).max(max).nullable());
}

export const createDispatchCallSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .nullable()
      .default("")
      .transform((val) => val ?? ""),
    priority: z.coerce.number().int().min(1).max(5),
    locationName: z.string().trim().max(120).optional().nullable(),
    lat: nullableNumberInRange(-90, 90).optional(),
    lng: nullableNumberInRange(-180, 180).optional(),
    mapX: z.coerce.number().finite().min(0).max(1).optional().nullable(),
    mapY: z.coerce.number().finite().min(0).max(1).optional().nullable(),
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

    const hasCoords = hasLat && hasLng;
    const hasMapCoords = hasMapX && hasMapY;
    const hasLocationName = Boolean(val.locationName && val.locationName.trim().length);
    if (!hasCoords && !hasMapCoords && !hasLocationName) {
      ctx.addIssue({
        code: "custom",
        path: ["locationName"],
        message: "Location is required when map or geo coordinates are not provided.",
      });
    }
  });

export const transitionDispatchCallStatusSchema = z.object({
  callId: z.string().trim().min(8),
  nextStatus: z.nativeEnum(DispatchCallStatus),
});

export const createDispatchUnitSchema = z.object({
  callSign: z.string().trim().min(2).max(32),
  type: z.nativeEnum(DispatchUnitType),
});

export const updateDispatchUnitStatusSchema = z.object({
  unitId: z.string().trim().min(8),
  status: z.nativeEnum(DispatchUnitStatus),
});

export const assignDispatchUnitSchema = z.object({
  callId: z.string().trim().min(8),
  unitId: z.string().trim().min(8),
});
