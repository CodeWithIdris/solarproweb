import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { GeoLocation } from "@/services/solar-data/types";

export type MapMarker = GeoLocation & {
  id: string;
  label: string;
  kind: "demo" | "connected" | "project" | "selected";
  description: string;
  onClick?: () => void;
};

const markerSymbol = { demo: "D", connected: "C", project: "P", selected: "●" };

/** A client-only Leaflet map. Resource retrieval deliberately remains outside this component. */
export function GlobalSolarMap({
  markers,
  selected,
  onSelect,
}: {
  markers: MapMarker[];
  selected?: GeoLocation | null;
  onSelect: (location: GeoLocation) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);

  useEffect(() => {
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !elementRef.current) return;
      const map = L.map(elementRef.current, { worldCopyJump: true, zoomControl: true }).setView(
        [18, 0],
        2,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on("click", (event) =>
        onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
      );
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
    });
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onSelect]);

  useEffect(() => {
    void import("leaflet").then((L) => {
      const layer = layerRef.current;
      if (!layer) return;
      layer.clearLayers();
      markers.forEach((marker) => {
        const icon = L.divIcon({
          className: `solar-map-marker solar-map-marker--${marker.kind}`,
          html: `<span aria-hidden="true">${markerSymbol[marker.kind]}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const leafMarker = L.marker([marker.latitude, marker.longitude], {
          icon,
          title: `${marker.label}: ${marker.description}`,
        });
        leafMarker.bindTooltip(`${marker.label} — ${marker.description}`, { direction: "top" });
        leafMarker.on("click", () => marker.onClick?.());
        leafMarker.addTo(layer);
      });
    });
  }, [markers]);

  useEffect(() => {
    if (selected && mapRef.current)
      mapRef.current.flyTo(
        [selected.latitude, selected.longitude],
        Math.max(mapRef.current.getZoom(), 7),
      );
  }, [selected]);

  return (
    <div
      ref={elementRef}
      className="h-[52vh] min-h-[360px] w-full bg-muted"
      aria-label="Worldwide interactive solar map. Click any location to explore solar resource data."
    />
  );
}
