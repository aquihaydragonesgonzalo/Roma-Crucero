
export interface Coordinate {
    lat: number;
    lng: number;
}

export interface Activity {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    locationName: string;
    endLocationName?: string;
    coords: Coordinate;
    endCoords?: Coordinate;
    description: string;
    keyDetails: string;
    priceEUR: number;
    type: 'logistics' | 'transport' | 'sightseeing';
    completed: boolean;
    notes?: string;
    googleMapsUrl?: string;
    contingencyNote?: string;
    imageUrl?: string;
    audioGuideText?: string;
}

export interface Waypoint {
    id?: string;
    name: string;
    lat: number;
    lng: number;
    isUserCreated?: boolean;
}

export interface Pronunciation {
    word: string;
    phonetic: string;
    simplified: string;
    meaning: string;
}

export interface WeatherData {
    hourly: {
        time: string[];
        temperature_2m: number[];
        weathercode: number[];
    };
    daily: {
        time: string[];
        weathercode: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
    };
}
