# Tactical Map (MapLibre)

ESS ships a tenant-scoped tactical map used inside Dispatch (and optionally the Control window).

## Default Style

By default the map uses a local MapLibre style:

- `public/map/style.json` (OSM raster tiles with labels)

This works out-of-the-box without any external setup beyond internet access for the tile PNGs.

## Community Map Settings

Map style is configurable per community:

1. Go to `/app/settings`
2. Open **Map**
3. Set **Map Style URL**

Allowed values:

- Local styles: `/map/style.json` (recommended)
- Remote styles: `https://...` (vector or raster style JSON)
- `http://...` is allowed only in non-production environments for local development

## Layers

The map supports togglable layers:

- Calls
- Units
- POIs
- Zones
- Heatmap (calls)

Layer toggle state and view state (center/zoom) persist per user, per community, per scope via `MapViewState`.

## POIs

POIs are stored in `MapPOI` and are always community-scoped.

Create:

- Right-click on the map to add a POI at that location (requires `map:manage_layers`)
- Or use **Add POI** from the map tools panel

Hide/Delete:

- Select a POI and click **Hide** (soft-delete via `isHidden=true`)

## Zones

Zones are stored in `MapZone` as GeoJSON Polygon/MultiPolygon.

Draw mode:

- Click to add vertices
- Double-click to finish
- Undo / Cancel / Finish controls available

Hide/Delete:

- Select a Zone and click **Hide** (soft-delete via `isHidden=true`)

## Permissions

Viewing maps inside Dispatch requires:

- `dispatch:read`

Creating/editing/hiding POIs and Zones requires:

- `map:manage_layers`

All server routes and writes are tenant enforced by `communityId`.
