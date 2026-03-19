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

  // Custom autocomplete state
  const [inputText, setInputText] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
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

  // Initialize AutocompleteService once the script is loaded
  useEffect(() => {
    if (isLoaded && !autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Close dropdown on click outside
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

  // Debounced autocomplete predictions
  const handleSearchInput = useCallback((text: string) => {
    setInputText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        { input: text },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setShowDropdown(true);
          } else {
            setPredictions([]);
            setShowDropdown(false);
          }
        }
      );
    }, DEBOUNCE_MS);
  }, []);

  // Select a prediction → geocode its place_id for lat/lng
  const handleSelectPrediction = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    setInputText("");
    setPredictions([]);
    setShowDropdown(false);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        onChangeRef.current({ address: results[0].formatted_address, lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(15);
      }
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }, []);

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
          <div className="absolute left-0 right-0 top-full mt-1 border-2 border-[#E5E7EB] rounded-xl overflow-hidden bg-white z-30">
            {predictions.map((prediction) => (
              <div
                key={prediction.place_id}
                className="p-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onMouseDown={() => handleSelectPrediction(prediction)}
              >
                <span className="text-lg text-[#6B7280]">{prediction.description}</span>
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
