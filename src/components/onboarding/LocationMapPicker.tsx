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
const DEBOUNCE_MS = 300;

export interface LocationValue {
  address: string;
  lat?: number;
  lng?: number;
}

interface PredictionItem {
  description: string;
  placeId: string;
  /** Opaque reference kept for the new API's toPlace() path */
  _suggestion?: any;
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

  const [inputText, setInputText] = useState("");
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  const mapRef = useRef(map);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  onChangeRef.current = onChange;
  mapRef.current = map;

  const { isLoaded, loadError: scriptError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries: LIBRARIES,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            onChange({ address: results[0].formatted_address, lat, lng });
          } else {
            onChange({ address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng });
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
        onChangeRef.current({ address: value.address, lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, [isLoaded, value?.address, value?.lat, value?.lng]);

  // ── Autocomplete: try new Places API, fall back to legacy ──

  const fetchPredictions = useCallback(async (text: string) => {
    // 1. Try the new Places API (AutocompleteSuggestion)
    try {
      const Suggestion = (google.maps.places as any).AutocompleteSuggestion;
      if (Suggestion?.fetchAutocompleteSuggestions) {
        const { suggestions } = await Suggestion.fetchAutocompleteSuggestions({
          input: text,
        });
        if (suggestions && suggestions.length > 0) {
          const items: PredictionItem[] = suggestions
            .filter((s: any) => s.placePrediction)
            .map((s: any) => ({
              description: s.placePrediction.text?.text ?? "",
              placeId: s.placePrediction.placeId ?? "",
              _suggestion: s,
            }));
          if (items.length > 0) return items;
        }
      }
    } catch {
      // New API unavailable — fall through to legacy
    }

    // 2. Legacy AutocompleteService (Promise-based)
    try {
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      }
      const result = await autocompleteServiceRef.current.getPlacePredictions({ input: text });
      if (result?.predictions?.length) {
        return result.predictions.map((p) => ({
          description: p.description,
          placeId: p.place_id,
        }));
      }
    } catch {
      // Legacy also failed
    }

    return [];
  }, []);

  const handleSearchInput = useCallback(
    (text: string) => {
      setInputText(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!text.trim()) {
        setPredictions([]);
        setShowDropdown(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const items = await fetchPredictions(text);
        setPredictions(items);
        setShowDropdown(items.length > 0);
      }, DEBOUNCE_MS);
    },
    [fetchPredictions]
  );

  const resolvePlace = useCallback(async (item: PredictionItem) => {
    // Try new API toPlace() path first
    if (item._suggestion?.placePrediction?.toPlace) {
      try {
        const place = await item._suggestion.placePrediction.toPlace();
        await place.fetchFields({ fields: ["formattedAddress", "location"] });
        const address: string = place.formattedAddress ?? item.description;
        const loc = place.location;
        let lat: number | undefined;
        let lng: number | undefined;
        if (loc) {
          lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
          lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
        }
        return { address, lat, lng };
      } catch {
        // Fall through to geocode
      }
    }

    // Geocode by placeId
    return new Promise<LocationValue>((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ placeId: item.placeId }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({
            address: results[0].formatted_address,
            lat: loc.lat(),
            lng: loc.lng(),
          });
        } else {
          resolve({ address: item.description });
        }
      });
    });
  }, []);

  const handleSelectPrediction = useCallback(
    async (item: PredictionItem) => {
      setInputText("");
      setPredictions([]);
      setShowDropdown(false);

      const resolved = await resolvePlace(item);
      onChangeRef.current(resolved);
      if (resolved.lat != null && resolved.lng != null) {
        mapRef.current?.panTo({ lat: resolved.lat, lng: resolved.lng });
        mapRef.current?.setZoom(15);
      }
    },
    [resolvePlace]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }, []);

  // ── Render ──

  if (!apiKey) {
    return (
      <div className="rounded-xl border-2 border-[#E5E7EB] p-4 text-center text-[#6B7280]">
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
        className="rounded-xl border-2 border-[#E5E7EB] flex items-center justify-center text-[#6B7280]"
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
      {/* Search input with custom autocomplete dropdown */}
      <div ref={searchWrapperRef} className="relative w-full">
        <input
          type="text"
          value={inputText}
          onChange={(e) => handleSearchInput(e.target.value)}
          onFocus={() => { if (predictions.length > 0) setShowDropdown(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex items-center w-full p-4 border-2 border-[#E5E7EB] rounded-xl text-lg text-black placeholder:text-[#6B7280] hover:border-black focus:border-black focus:outline-none transition-colors"
        />

        {showDropdown && predictions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 border-2 border-[#E5E7EB] rounded-xl overflow-hidden bg-white z-30 shadow-lg">
            {predictions.map((item) => (
              <div
                key={item.placeId}
                className="p-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseDown={() => handleSelectPrediction(item)}
              >
                <span className="text-lg text-[#6B7280]">{item.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        ref={mapWrapperRef}
        className="relative overflow-visible rounded-xl"
        style={MAP_CONTAINER_STYLE}
      >
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#E5E7EB] bg-white text-black shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
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

      {/* Selected location display */}
      <input
        type="text"
        readOnly
        value={value?.address ?? ""}
        placeholder="No location selected"
        className="w-full p-4 border-2 border-[#E5E7EB] rounded-xl text-lg text-black placeholder:text-[#6B7280] bg-gray-50 cursor-default"
      />

      <p className="text-sm text-[#6B7280]">
        Search above or click on the map to set your business location.
      </p>
    </div>
  );
}
