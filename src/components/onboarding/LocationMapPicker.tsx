import { useCallback, useRef, useState } from "react";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

const LIBRARIES: ("places")[] = ["places"];
const DEFAULT_CENTER = { lat: 39.5, lng: -98 };
const DEFAULT_ZOOM = 4;
const MAP_CONTAINER_STYLE = { width: "100%", height: "320px", borderRadius: "12px" };

export interface LocationValue {
  address: string;
  lat?: number;
  lng?: number;
}

interface LocationMapPickerProps {
  value?: LocationValue | null;
  onChange: (value: LocationValue) => void;
  defaultCenter?: { lat: number; lng: number };
  placeholder?: string;
}

export function LocationMapPicker({
  value,
  onChange,
  defaultCenter = DEFAULT_CENTER,
  placeholder = "Search for an address or click on the map",
}: LocationMapPickerProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError: scriptError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries: LIBRARIES,
  });

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            onChange({
              address: results[0].formatted_address,
              lat,
              lng,
            });
          } else {
            onChange({
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              lat,
              lng,
            });
          }
        }
      );
    },
    [onChange]
  );

  const onAutocompleteLoad = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      autocompleteRef.current = autocomplete;
    },
    []
  );

  const onPlaceChanged = useCallback(() => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    const location = place.geometry?.location;
    if (location && place.formatted_address) {
      const lat = location.lat();
      const lng = location.lng();
      onChange({
        address: place.formatted_address,
        lat,
        lng,
      });
      map?.panTo({ lat, lng });
      map?.setZoom(15);
    }
  }, [onChange, map]);

  if (!apiKey) {
    return (
      <div className="rounded-xl border-2 border-muted bg-muted/30 p-4 text-center text-muted-foreground">
        Set VITE_GOOGLE_MAPS_API_KEY in your .env to enable the map.
      </div>
    );
  }

  if (scriptError) {
    return (
      <div className="rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
        Failed to load Google Maps: {scriptError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="rounded-xl border-2 border-muted bg-muted/30 flex items-center justify-center text-muted-foreground"
        style={MAP_CONTAINER_STYLE}
      >
        Loading map…
      </div>
    );
  }

  const center =
    value?.lat != null && value?.lng != null
      ? { lat: value.lat, lng: value.lng }
      : defaultCenter;
  const zoom = value?.lat != null && value?.lng != null ? 15 : DEFAULT_ZOOM;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative" style={MAP_CONTAINER_STYLE}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%", borderRadius: "12px" }}
          mapContainerClassName="absolute inset-0 rounded-xl"
          center={center}
          zoom={zoom}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          <div className="absolute top-3 left-3 right-3 z-10">
            <Autocomplete
              key={value?.address ?? "empty"}
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                fields: ["formatted_address", "geometry"],
                types: ["address"],
              }}
            >
              <input
                type="text"
                placeholder={placeholder}
                defaultValue={value?.address}
                className="w-full p-3 pr-10 text-base font-medium text-foreground bg-background border-2 border-muted rounded-lg shadow-md placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </Autocomplete>
          </div>
          {value?.lat != null && value?.lng != null && (
            <Marker position={{ lat: value.lat, lng: value.lng }} />
          )}
        </GoogleMap>
      </div>
      <p className="text-sm text-muted-foreground">
        Search for an address above or click on the map to set your business
        location.
      </p>
    </div>
  );
}
