import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { SolarLocationMarker } from "@/services/solar-data/insight-types";
import type { GeoLocation } from "@/services/solar-data/types";
import { OPERATIONAL_STATUS_LABEL } from "@/services/solar-data/classification";

const MARKER_STYLE: Record<
  SolarLocationMarker["siteType"] | "selected",
  { color: string; label: string }
> = {
  connected: { color: "#1f7a4d", label: "Connected site" },
  project: { color: "#3a5ba0", label: "Project location" },
  demo: { color: "#8a8377", label: "Demo/example site" },
  selected: { color: "#d08700", label: "Selected location" },
};

function ClickHandler({ onSelect }: { onSelect: (location: GeoLocation) => void }) {
  useMapEvents({
    click(event) {
      onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

function ViewController({ center, zoom }: { center?: GeoLocation; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.latitude, center.longitude], zoom, { duration: 0.8 });
  }, [center, map, zoom]);
  return null;
}

export interface GlobalSolarMapProps {
  markers: SolarLocationMarker[];
  selected?: GeoLocation | undefined;
  onSelect: (location: GeoLocation) => void;
  onMarkerSelect?: (marker: SolarLocationMarker) => void;
  height?: string;
  zoom?: number;
}

/**
 * Worldwide location map. Presentation only: it resolves no data itself and
 * calls no provider. Selecting a point hands coordinates to the caller, which
 * requests data through the Solar Pro service boundary.
 */
export default function GlobalSolarMap({
  markers,
  selected,
  onSelect,
  onMarkerSelect,
  height = "clamp(320px, 60vh, 620px)",
  zoom = 6,
}: GlobalSolarMapProps) {
  const initialCenter = useMemo<[number, number]>(
    () =>
      selected
        ? [selected.latitude, selected.longitude]
        : markers[0]
          ? [markers[0].latitude, markers[0].longitude]
          : [12, 8],
    // Initial view only; later changes are handled by ViewController.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="border border-border bg-card" style={{ height }}>
      <MapContainer
        center={initialCenter}
        zoom={markers.length > 0 || selected ? 4 : 2}
        minZoom={2}
        worldCopyJump
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
        />
        <ClickHandler onSelect={onSelect} />
        <ViewController {...(selected ? { center: selected } : {})} zoom={zoom} />
        {markers.map((marker) => {
          const style = MARKER_STYLE[marker.siteType];
          return (
            <CircleMarker
              key={marker.id}
              center={[marker.latitude, marker.longitude]}
              radius={7}
              pathOptions={{ color: style.color, fillColor: style.color, fillOpacity: 0.75 }}
              eventHandlers={{
                click: (event) => {
                  event.originalEvent.stopPropagation();
                  onMarkerSelect?.(marker);
                  onSelect({ latitude: marker.latitude, longitude: marker.longitude });
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span className="font-mono text-xs">
                  {marker.name} · {style.label} ·{" "}
                  {marker.installedCapacityMwp
                    ? `${marker.installedCapacityMwp.toFixed(1)} MWp · `
                    : ""}
                  {OPERATIONAL_STATUS_LABEL[marker.status]}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}
        {selected && (
          <CircleMarker
            center={[selected.latitude, selected.longitude]}
            radius={9}
            pathOptions={{
              color: MARKER_STYLE.selected.color,
              fillColor: MARKER_STYLE.selected.color,
              fillOpacity: 0.5,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="font-mono text-xs">
                Selected location {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
              </span>
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}

export function MapLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
      {(["connected", "project", "demo", "selected"] as const).map((key) => (
        <li key={key} className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: MARKER_STYLE[key].color }}
          />
          <span>{MARKER_STYLE[key].label}</span>
        </li>
      ))}
      <li className="text-muted-foreground">
        Alert and fault indicators appear only for sites with connected telemetry.
      </li>
    </ul>
  );
}
