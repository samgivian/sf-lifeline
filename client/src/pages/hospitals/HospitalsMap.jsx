import { Modal, Loader, Center, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

/**
 * Displays a static map of hospitals within the provided region.
 * The map is generated using OpenStreetMap's public APIs.
 */
export default function HospitalsMap ({ opened, close, region }) {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMap () {
      if (!region) {
        setMapUrl('');
        return;
      }
      setLoading(true);
      try {
        // Get bounding box for the region
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(region)}`
        );
        if (!res.ok) throw new Error('Location lookup failed');
        const [place] = await res.json();
        if (!place) {
          setMapUrl('');
          return;
        }
        const [south, north, west, east] = place.boundingbox;
        // Fetch hospitals in the bounding box
        const query = `[out:json];node["amenity"="hospital"](${south},${west},${north},${east});out;`;
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const overpass = await fetch(overpassUrl);
        if (!overpass.ok) throw new Error('Overpass query failed');
        const overpassData = await overpass.json();
        const markers = overpassData.elements
          .filter((e) => e.lat && e.lon)
          .map((e) => `${e.lat},${e.lon},red-pushpin`)
          .join('|');
        const url = `https://staticmap.openstreetmap.de/staticmap.php?bbox=${west},${south},${east},${north}&size=865x512&markers=${markers}`;
        setMapUrl(url);
      } catch (err) {
        console.error(err);
        setMapUrl('');
      } finally {
        setLoading(false);
      }
    }
    if (opened) loadMap();
  }, [opened, region]);

  return (
    <Modal opened={opened} onClose={close} size='xl' title='Hospitals Map'>
      {loading && (
        <Center h={400}>
          <Loader />
        </Center>
      )}
      {!loading && mapUrl && (
        <img src={mapUrl} alt={`Hospitals in ${region}`} style={{ width: '100%' }} />
      )}
      {!loading && !region && (
        <Text>Enter a region to view the map.</Text>
      )}
      {!loading && region && !mapUrl && (
        <Text>No map data available.</Text>
      )}
    </Modal>
  );
}
