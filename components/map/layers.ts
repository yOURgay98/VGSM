export type MapPointFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  properties: Record<string, unknown>;
};

export type MapPolygonFeature = {
  type: "Feature";
  geometry: any;
  properties: Record<string, unknown>;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<MapPointFeature | MapPolygonFeature>;
};

export function callsToFeatureCollection(
  calls: Array<{
    id: string;
    title: string;
    priority: number;
    status: string;
    lat: number | null;
    lng: number | null;
  }>,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: calls
      .filter((c) => typeof c.lat === "number" && typeof c.lng === "number")
      .map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.lng as number, c.lat as number] },
        properties: { id: c.id, title: c.title, priority: c.priority, status: c.status },
      })),
  };
}

export function unitsToFeatureCollection(
  units: Array<{
    id: string;
    callSign: string;
    type: string;
    status: string;
    assignedCallId: string | null;
    lastLat: number | null;
    lastLng: number | null;
  }>,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: units
      .filter((u) => typeof u.lastLat === "number" && typeof u.lastLng === "number")
      .map((u) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [u.lastLng as number, u.lastLat as number] },
        properties: {
          id: u.id,
          callSign: u.callSign,
          type: u.type,
          status: u.status,
          assignedCallId: u.assignedCallId,
        },
      })),
  };
}

export function poisToFeatureCollection(
  pois: Array<{
    id: string;
    name: string;
    category: string;
    description: string | null;
    lat: number;
    lng: number;
    icon: string | null;
    color: string | null;
  }>,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: pois.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        icon: p.icon,
        color: p.color,
      },
    })),
  };
}

export function zonesToFeatureCollection(
  zones: Array<{
    id: string;
    name: string;
    zoneType: string;
    geojson: any;
    color: string | null;
  }>,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: zones.map((z) => ({
      type: "Feature",
      geometry: z.geojson,
      properties: { id: z.id, name: z.name, zoneType: z.zoneType, color: z.color },
    })),
  };
}

export function labelsToFeatureCollection(
  labels: Array<{
    id: string;
    name: string;
    type: "street" | "building" | "landmark";
    lat: number;
    lng: number;
    postal?: string;
    enabledDefault?: boolean;
  }>,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: labels.map((l) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [l.lng, l.lat] },
      properties: {
        id: l.id,
        name: l.name,
        type: l.type,
        postal: l.postal ?? null,
        enabledDefault: l.enabledDefault !== false,
      },
    })),
  };
}

export function sessionPingsToFeatureCollection(
  pings: Array<{
    id: string;
    lat: number;
    lng: number;
    label: string;
    kind: "ping" | "call" | "pick";
  }>,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: pings.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        label: p.label,
        kind: p.kind,
      },
    })),
  };
}
