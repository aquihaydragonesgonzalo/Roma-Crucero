import { useState, useEffect, FormEvent } from 'react';
import { CalendarClock, Map as MapIcon, Wallet, BookOpen, Anchor, X, Play, Square, Headphones, MapPin, Save } from 'lucide-react';
import Timeline from './components/Timeline';
import MapComponent from './components/MapComponent';
import Budget from './components/Budget';
import Guide from './components/Guide';
import { INITIAL_ITINERARY, SHIP_ONBOARD_TIME } from './constants';
import { Activity, Coordinate, Waypoint } from './types';

// Add the window type extension for the global function
declare global {
  interface Window {
    openAudioGuideFromMap: (id: string) => void;
    deleteUserWaypoint: (id: string) => void;
  }
}

const App = () => {
    const [itinerary, setItinerary] = useState<Activity[]>(INITIAL_ITINERARY);
    const [activeTab, setActiveTab] = useState<'timeline' | 'map' | 'budget' | 'guide'>('timeline');
    const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
    const [mapFocus, setMapFocus] = useState<Coordinate | null>(null);
    const [countdown, setCountdown] = useState('--h --m --s');
    const [audioActivity, setAudioActivity] = useState<Activity | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [previewImage, setPreviewImage] = useState<{url: string; title: string} | null>(null);
    
    // State for user defined waypoints
    const [userWaypoints, setUserWaypoints] = useState<Waypoint[]>([]);
    
    // UI State for Modal
    const [isWaypointModalOpen, setIsWaypointModalOpen] = useState(false);
    const [tempMarkerCoords, setTempMarkerCoords] = useState<Coordinate | null>(null);

    useEffect(() => {
        // Load User Waypoints from LS
        const savedWaypoints = localStorage.getItem('roma_user_waypoints');
        if (savedWaypoints) {
            try {
                setUserWaypoints(JSON.parse(savedWaypoints));
            } catch (e) {
                console.error("Error loading waypoints", e);
            }
        }

        // Expose function for Map Popups
        window.openAudioGuideFromMap = (id: string) => {
            const act = itinerary.find(a => a.id === id);
            if (act && act.audioGuideText) {
                setAudioActivity(act);
            }
        };

        window.deleteUserWaypoint = (id: string) => {
            if(window.confirm("¿Eliminar este marcador personal?")) {
                setUserWaypoints(prev => {
                    const updated = prev.filter(wp => wp.id !== id);
                    localStorage.setItem('roma_user_waypoints', JSON.stringify(updated));
                    return updated;
                });
            }
        };

        const timer = setInterval(() => {
            const now = new Date();
            const [h, m] = SHIP_ONBOARD_TIME.split(':').map(Number);
            const target = new Date();
            target.setHours(h, m, 0, 0);
            
            const diff = target.getTime() - now.getTime();
            if (diff <= 0) setCountdown("¡A BORDO!");
            else {
                const hr = Math.floor(diff / 3600000);
                const mn = Math.floor((diff % 3600000) / 60000);
                const sc = Math.floor((diff % 60000) / 1000);
                setCountdown(`${hr.toString().padStart(2,'0')}h ${mn.toString().padStart(2,'0')}m ${sc.toString().padStart(2,'0')}s`);
            }
        }, 1000);

        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                err => console.error(err),
                { enableHighAccuracy: true }
            );
        }

        // Hide loader
        const l = document.getElementById('initial-loader');
        if(l) {
            setTimeout(() => {
                 l.style.opacity = '0';
                 setTimeout(() => l.remove(), 400); 
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [itinerary]);

    const handleToggleComplete = (id: string) => {
        setItinerary(itinerary.map(a => a.id === id ? {...a, completed: !a.completed} : a));
    };

    // Triggered when user clicks the map component
    const handleMapClick = (lat: number, lng: number) => {
        setTempMarkerCoords({ lat, lng });
        setIsWaypointModalOpen(true);
    };

    // Form Submit Handler
    const handleSaveWaypoint = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (name && tempMarkerCoords) {
            const newPoint: Waypoint = {
                id: Date.now().toString(),
                name,
                description,
                lat: tempMarkerCoords.lat,
                lng: tempMarkerCoords.lng,
                isUserCreated: true
            };
            const updated = [...userWaypoints, newPoint];
            setUserWaypoints(updated);
            localStorage.setItem('roma_user_waypoints', JSON.stringify(updated));
            setIsWaypointModalOpen(false);
            setTempMarkerCoords(null);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
            <header className="bg-red-950 text-white p-4 shadow-xl z-20 flex justify-between items-center shrink-0">
                <div className="flex items-center">
                    <Anchor className="mr-3 text-red-500" size={24} />
                    <div>
                        <h1 className="font-black text-[10px] uppercase tracking-[0.2em] text-red-400">Escala Roma</h1>
                        <p className="text-[12px] font-bold text-white/90 leading-tight">16 Abril 2026</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-[8px] font-black uppercase text-red-500 tracking-widest block mb-0.5">Cuenta atrás</span>
                    <div className="text-lg font-black font-mono text-red-400 leading-none">{countdown}</div>
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden">
                {activeTab === 'timeline' && (
                    <div className="h-full overflow-y-auto no-scrollbar">
                        <Timeline 
                            itinerary={itinerary} 
                            onToggleComplete={handleToggleComplete} 
                            onLocate={c => {setMapFocus(c); setActiveTab('map');}} 
                            userLocation={userLocation} 
                            onOpenAudioGuide={setAudioActivity}
                            onPreviewImage={(url, title) => setPreviewImage({url, title})}
                        />
                    </div>
                )}
                {activeTab === 'map' && (
                    <MapComponent 
                        activities={itinerary} 
                        userLocation={userLocation} 
                        focusedLocation={mapFocus} 
                        userWaypoints={userWaypoints}
                        onMapClick={handleMapClick}
                    />
                )}
                {activeTab === 'budget' && <Budget itinerary={itinerary} />}
                {activeTab === 'guide' && <Guide userLocation={userLocation} itinerary={itinerary} />}
            </main>

            {/* Modal Add Waypoint */}
            {isWaypointModalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden scale-[0.95] animate-[fadeIn_0.3s_ease-out_forwards]">
                        <div className="bg-gradient-to-r from-red-950 to-red-900 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-white">
                                <div className="p-2 bg-white/10 rounded-full">
                                    <MapPin size={20} className="text-red-400" />
                                </div>
                                <h3 className="font-bold text-lg leading-none">Nuevo Marcador</h3>
                            </div>
                            <button 
                                onClick={() => setIsWaypointModalOpen(false)}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveWaypoint} className="p-6">
                            <div className="mb-4">
                                <label htmlFor="wp-name" className="block text-xs font-black uppercase text-slate-400 mb-1.5 ml-1 tracking-wider">Nombre del Punto</label>
                                <input 
                                    id="wp-name"
                                    name="name" 
                                    type="text" 
                                    autoFocus
                                    required
                                    placeholder="Ej: Cafetería bonita" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:font-normal"
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="wp-desc" className="block text-xs font-black uppercase text-slate-400 mb-1.5 ml-1 tracking-wider">Descripción (Opcional)</label>
                                <textarea 
                                    id="wp-desc"
                                    name="description" 
                                    rows={3}
                                    placeholder="Notas sobre este lugar..." 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsWaypointModalOpen(false)}
                                    className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase text-xs tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3.5 bg-red-900 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2 uppercase text-xs tracking-wider"
                                >
                                    <Save size={16} />
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Imagen FullScreen */}
            {previewImage && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
                    <button 
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
                    >
                        <X size={28} />
                    </button>
                    <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
                    <p className="mt-6 text-white font-bold text-lg uppercase tracking-widest text-center px-4">{previewImage.title}</p>
                </div>
            )}

            {/* Modal Audio Guide */}
            {audioActivity && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border-4 border-white/20">
                        <div className="p-6 bg-red-950 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <Headphones size={24} className="text-red-400"/>
                                <h2 className="font-bold text-lg leading-tight">{audioActivity.title}</h2>
                            </div>
                            <button onClick={() => { window.speechSynthesis.cancel(); setAudioActivity(null); setIsPlaying(false); }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                <X size={20}/>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto text-sm italic text-slate-700 leading-relaxed font-medium">"{audioActivity.audioGuideText}"</div>
                        <div className="p-8 bg-slate-50 flex items-center gap-6 shrink-0">
                            <button onClick={() => { 
                                if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); }
                                else { 
                                    const ut = new SpeechSynthesisUtterance(audioActivity.audioGuideText || '');
                                    ut.lang = 'es-ES'; 
                                    ut.onend = () => setIsPlaying(false);
                                    window.speechSynthesis.speak(ut); 
                                    setIsPlaying(true);
                                }
                            }} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 ${isPlaying ? 'bg-red-100 text-red-600' : 'bg-red-800 text-white'}`}>
                                {isPlaying ? <Square size={24} fill="currentColor"/> : <Play size={24} fill="currentColor" className="ml-1" />}
                            </button>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{isPlaying ? 'Reproduciendo audio...' : 'Pulsa para reproducir'}</p>
                        </div>
                    </div>
                </div>
            )}

            <nav className="bg-white border-t h-20 flex justify-around items-center px-2 pb-safe shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-30">
                <button onClick={() => setActiveTab('timeline')} className={`flex flex-col items-center w-full transition-colors ${activeTab === 'timeline' ? 'text-red-800' : 'text-slate-300'}`}>
                    <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'timeline' ? 'bg-red-50 shadow-sm' : ''}`}><CalendarClock size={22} /></div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${activeTab === 'timeline' ? 'opacity-100' : 'opacity-60'}`}>Itinerario</span>
                </button>
                <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center w-full transition-colors ${activeTab === 'map' ? 'text-red-800' : 'text-slate-300'}`}>
                    <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'map' ? 'bg-red-50 shadow-sm' : ''}`}><MapIcon size={22} /></div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${activeTab === 'map' ? 'opacity-100' : 'opacity-60'}`}>Mapa</span>
                </button>
                <button onClick={() => setActiveTab('budget')} className={`flex flex-col items-center w-full transition-colors ${activeTab === 'budget' ? 'text-red-800' : 'text-slate-300'}`}>
                    <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'budget' ? 'bg-red-50 shadow-sm' : ''}`}><Wallet size={22} /></div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${activeTab === 'budget' ? 'opacity-100' : 'opacity-60'}`}>Gastos</span>
                </button>
                <button onClick={() => setActiveTab('guide')} className={`flex flex-col items-center w-full transition-colors ${activeTab === 'guide' ? 'text-red-800' : 'text-slate-300'}`}>
                    <div className={`p-2 rounded-2xl mb-1 ${activeTab === 'guide' ? 'bg-red-50 shadow-sm' : ''}`}><BookOpen size={22} /></div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${activeTab === 'guide' ? 'opacity-100' : 'opacity-60'}`}>Guía</span>
                </button>
            </nav>
        </div>
    );
};

export default App;