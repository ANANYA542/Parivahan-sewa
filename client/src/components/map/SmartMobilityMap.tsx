import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer } from 'react-leaflet';
import type { MobilityMapFeature, MobilityMapLayer } from '@parivahan/shared';
import { DURATION, EASE_OUT, scaleTap } from '../../lib/motion';
import 'leaflet/dist/leaflet.css';

interface SmartMobilityMapProps {
  layers: MobilityMapLayer[];
}

function isPoint(feature: MobilityMapFeature): feature is MobilityMapFeature & { geometry: { type: 'Point'; coordinates: number[] } } {
  return feature.geometry.type === 'Point';
}

function isLine(feature: MobilityMapFeature): feature is MobilityMapFeature & { geometry: { type: 'LineString'; coordinates: number[][] } } {
  return feature.geometry.type === 'LineString';
}

export function SmartMobilityMap({ layers }: SmartMobilityMapProps) {
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(() => new Set(layers.map((layer) => layer.layerId)));

  useEffect(() => {
    setVisibleLayers(new Set(layers.map((layer) => layer.layerId)));
  }, [layers]);

  function toggleLayer(layerId: string) {
    setVisibleLayers((previous) => {
      const next = new Set(previous);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-50">Smart Mobility Map</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">Case-history and reference overlays are independently toggleable. This is decision support, not a live traffic or sensor feed.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {layers.map((layer) => (
          <motion.button {...scaleTap} key={layer.layerId} type="button" aria-pressed={visibleLayers.has(layer.layerId)} onClick={() => toggleLayer(layer.layerId)} className={`rounded-full border px-3 py-1 text-xs transition-colors duration-200 ${visibleLayers.has(layer.layerId) ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-slate-800 text-slate-500 opacity-60 hover:opacity-100'}`}>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: layer.color }} />
            {layer.label}
          </motion.button>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.slow, ease: EASE_OUT }}
        className="mt-5 h-80 overflow-hidden rounded-2xl border border-slate-800 bg-slate-800"
      >
        <MapContainer center={[18.5204, 73.8567]} zoom={12} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles-dark"
          />
          {layers.filter((layer) => visibleLayers.has(layer.layerId)).flatMap((layer) => layer.features.map((feature) => {
            if (isPoint(feature)) {
              const [longitude, latitude] = feature.geometry.coordinates;
              if (longitude === undefined || latitude === undefined) return null;
              return (
                <CircleMarker key={feature.featureId} center={[latitude, longitude]} radius={9} pathOptions={{ color: layer.color, fillColor: layer.color, fillOpacity: 0.6 }}>
                  <Popup>
                    <strong>{feature.properties.title}</strong><br />
                    {feature.properties.detail}<br />
                    <small>Source: {feature.properties.source.replace('-', ' ')}</small>
                  </Popup>
                </CircleMarker>
              );
            }
            if (isLine(feature)) {
              const positions = feature.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number]);
              return <Polyline key={feature.featureId} positions={positions} pathOptions={{ color: layer.color, weight: 5, opacity: 0.8 }}><Popup><strong>{feature.properties.title}</strong><br />{feature.properties.detail}</Popup></Polyline>;
            }
            return null;
          }))}
        </MapContainer>
      </motion.div>
    </section>
  );
}
