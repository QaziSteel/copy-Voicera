import { useCallback, useEffect, useRef, useState } from "react";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
} from "@react-google-maps/api";
import { Maximize2, Minimize2 } from "lucide-react";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const autocompleteHostRef = useRef<HTMLDivElement | null>(null);
  const placeAutocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const onChangeRef = useRef(onChange);
  const mapRef = useRef(map);
  onChangeRef.current = onChange;
  mapRef.current = map;

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

  const toggleFullscreen = useCallback(() => {
    const wrapper = mapWrapperRef.current;
    if (!wrapper) return;
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Auto-geocode when value has an address but no coordinates
  const lastGeocodedAddress = useRef<string>("");
  useEffect(() => {
    if (!isLoaded) return;
    if (!value?.address || (value.lat != null && value.lng != null)) return;
    if (value.address === lastGeocodedAddress.current) return;

    lastGeocodedAddress.current = value.address;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: value.address }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        onChangeRef.current({
          address: value.address,
          lat: loc.lat(),
          lng: loc.lng(),
        });
      }
    });
  }, [isLoaded, value?.address, value?.lat, value?.lng]);

  // Mount Places API (New) PlaceAutocompleteElement when script is loaded
  useEffect(() => {
    if (!isLoaded || !autocompleteHostRef.current || !window.google?.maps?.places) return;

    let element: google.maps.places.PlaceAutocompleteElement | null = null;

    const init = async () => {
      try {
        const places = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        if (!places?.PlaceAutocompleteElement) return;

        element = new places.PlaceAutocompleteElement({
          // Optional: restrict to addresses
          // includedPrimaryTypes: ["address"],
        });
        autocompleteHostRef.current?.appendChild(element);
        placeAutocompleteRef.current = element;

        element.addEventListener("gmp-select", async (e: Event) => {
          const detail = (e as CustomEvent<{ placePrediction?: { toPlace: () => Promise<google.maps.places.Place> } }>)?.detail ?? e as { placePrediction?: { toPlace: () => Promise<google.maps.places.Place> } };
          const placePrediction = detail?.placePrediction;
          if (!placePrediction?.toPlace) return;
          try {
            const place = await placePrediction.toPlace();
            await place.fetchFields({
              fields: ["formattedAddress", "location"],
            });
            const address = place.formattedAddress ?? "";
            const loc = place.location;
            let lat: number | undefined;
            let lng: number | undefined;
            if (loc) {
              if (typeof (loc as { lat: () => number }).lat === "function") {
                lat = (loc as google.maps.LatLng).lat();
                lng = (loc as google.maps.LatLng).lng();
              } else {
                lat = (loc as { lat: number }).lat;
                lng = (loc as { lng: number }).lng;
              }
            }
            onChangeRef.current({ address, lat, lng });
            if (lat != null && lng != null) {
              mapRef.current?.panTo({ lat, lng });
              mapRef.current?.setZoom(15);
            }
          } catch (err) {
            console.error("Place fetchFields error:", err);
          }
        });
      } catch (err) {
        console.error("PlaceAutocompleteElement init error:", err);
      }
    };

    init();

    return () => {
      if (element && autocompleteHostRef.current?.contains(element)) {
        autocompleteHostRef.current.removeChild(element);
      }
      placeAutocompleteRef.current = null;
    };
  }, [isLoaded]);

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
      {/* Search row: below page label, above map, normal flow */}
      <div className="w-full">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Search for an address
        </label>
        <div
          ref={autocompleteHostRef}
          className="w-full overflow-visible [&::part(input)]:w-full [&::part(input)]:p-3 [&::part(input)]:text-base [&::part(input)]:font-medium [&::part(input)]:border-2 [&::part(input)]:border-muted [&::part(input)]:rounded-lg [&::part(input)]:bg-background [&::part(input)]:focus:outline-none [&::part(input)]:focus:border-primary"
          style={{ minHeight: "48px" }}
        />
      </div>

      {/* Map row */}
      <div
        ref={mapWrapperRef}
        className="relative overflow-visible rounded-xl"
        style={MAP_CONTAINER_STYLE}
      >
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-muted bg-background text-foreground shadow hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
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
            fullscreenControl: false,
          }}
        >
          {value?.lat != null && value?.lng != null && (
            <Marker position={{ lat: value.lat, lng: value.lng }} />
          )}
        </GoogleMap>
      </div>

      {/* Selected location: read-only display below the map */}
      <div className="w-full">
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Selected location
        </label>
        <input
          type="text"
          readOnly
          value={value?.address ?? ""}
          placeholder="No location selected"
          className="w-full px-3 py-2.5 text-base border-2 border-muted rounded-lg bg-muted/30 text-foreground placeholder:text-muted-foreground cursor-default"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Search above or click on the map to set your business location.
      </p>
    </div>
  );
}
