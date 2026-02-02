import React, { useState, useEffect } from 'react';
import { PhoneCall, Thermometer, ArrowRight, Sun, Cloud, CloudRain, CloudLightning, Compass, Ship, TrainFront, Footprints, Info, Languages, Volume2 } from 'lucide-react';
import { Coordinate, WeatherData } from '../types';
import { PRONUNCIATIONS } from '../constants';

interface GuideProps {
    userLocation: Coordinate | null;
}

const Guide: React.FC<GuideProps> = ({ userLocation }) => {
    const [playing, setPlaying] = useState<string | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loadingWeather, setLoadingWeather] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await fetch(
                    'https://api.open-meteo.com/v1/forecast?latitude=41.89&longitude=12.49&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FRome'
                );
                const data = await response.json();
                setWeather(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingWeather(false);
            }
        };
        fetchWeather();
    }, []);

    const getWeatherIcon = (code: number, size = 20) => {
        if (code <= 1) return <Sun size={size} className="text-amber-500" />;
        if (code <= 3) return <Cloud size={size} className="text-slate-400" />;
        if (code <= 67) return <CloudRain size={size} className="text-blue-500" />;
        if (code <= 99) return <CloudLightning size={size} className="text-purple-500" />;
        return <Sun size={size} className="text-amber-500" />;
    };

    const play = (word: string) => {
        const ut = new SpeechSynthesisUtterance(word);
        ut.lang = 'it-IT';
        ut.onend = () => setPlaying(null);
        setPlaying(word);
        window.speechSynthesis.speak(ut);
    };

    const handleSOS = () => {
        const msg = `¡SOS! Necesito ayuda en Roma. Ubicación: ${userLocation ? `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}` : 'GPS no disponible'}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="pb-32 px-4 pt-6 max-w-lg mx-auto h-full overflow-y-auto no-scrollbar fade-in">
            <h2 className="text-2xl font-bold text-red-800 mb-6 uppercase tracking-tight">Guía Roma</h2>
            
            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center uppercase tracking-widest px-1">
                  <Compass size={20} className="mr-2.5 text-fjord-600"/> Resumen de la Visita
                </h3>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 overflow-hidden relative">
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Ship size={14} className="text-fjord-700" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Tiempo Puerto</span>
                      </div>
                      <p className="text-lg font-black text-slate-800 leading-none">11h 30m</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">07:00 a 18:30</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <TrainFront size={14} className="text-fjord-700" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Transportes</span>
                      </div>
                      <p className="text-lg font-black text-slate-800 leading-none">~5h 15m</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Total Traslados</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Sun size={14} className="text-fjord-700" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Turismo Real</span>
                      </div>
                      <p className="text-lg font-black text-slate-800 leading-none">4h 00m</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Exploración</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Footprints size={14} className="text-fjord-700" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Distancia</span>
                      </div>
                      <p className="text-lg font-black text-slate-800 leading-none">~6.8 km</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Caminata Total</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                     <div className="flex items-start gap-3 bg-red-50/50 p-3 rounded-2xl border border-red-100/50">
                       <Info size={16} className="text-fjord-700 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-fjord-900 font-bold leading-normal">
                         <span className="uppercase font-black block mb-0.5">Dato de Interés:</span>
                         El ticket <span className="underline">BIRG</span> (12€) cubre todos tus trayectos del día: Tren Regional, Metro (Línea B) y Buses Urbanos en Civitavecchia y Roma.
                       </p>
                     </div>
                  </div>
                </div>
            </div>

            <div className="mb-8 bg-red-600 rounded-[2rem] p-6 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center mb-3">
                        <PhoneCall size={24} className="mr-3 animate-pulse" />
                        <h3 className="font-black text-lg uppercase tracking-widest">SOS WHATSAPP</h3>
                    </div>
                    <p className="text-xs text-red-100 mb-6 leading-relaxed">Envía tu ubicación exacta si necesitas asistencia inmediata o te has desorientado.</p>
                    <button onClick={handleSOS} className="w-full py-4 bg-white text-red-700 font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Enviar SOS</button>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center uppercase tracking-widest">
                        <Thermometer size={20} className="mr-2.5 text-fjord-600"/> Tiempo en Roma
                    </h3>
                    {!loadingWeather && <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-full">
                        <ArrowRight size={10} className="animate-bounce-x" /> DESLIZA
                    </div>}
                </div>
                
                {loadingWeather ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-slate-100">
                        <div className="w-6 h-6 border-2 border-fjord-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Obteniendo datos...</p>
                    </div>
                ) : weather ? (
                    <div className="space-y-4">
                        <div className="bg-white p-2 pb-4 rounded-[2.5rem] border border-slate-100 shadow-lg relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
                            <div className="flex overflow-x-auto custom-h-scrollbar gap-3 px-6 py-4 items-stretch">
                                {weather.hourly.time.map((time, i) => {
                                    const h = new Date(time).getHours();
                                    if (h >= 7 && h <= 19) return (
                                        <div key={time} className="flex flex-col items-center justify-between min-w-[70px] p-3 bg-slate-50/80 rounded-3xl border border-slate-100 shadow-sm transition-all hover:bg-white active:scale-95">
                                            <span className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">{h}:00</span>
                                            <div className="p-2 bg-white rounded-2xl mb-2 flex items-center justify-center shadow-sm">
                                                {getWeatherIcon(weather.hourly.weathercode[i], 28)}
                                            </div>
                                            <span className="text-base font-black text-slate-800 tracking-tighter">{Math.round(weather.hourly.temperature_2m[i])}°</span>
                                        </div>
                                    );
                                    return null;
                                })}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center uppercase tracking-widest px-1">
                <Languages size={20} className="mr-2.5 text-fjord-600"/> Italiano Básico
            </h3>
            <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden mb-12">
                {PRONUNCIATIONS.map((item, idx) => (
                    <div key={idx} className="p-5 flex justify-between items-center border-b last:border-0 hover:bg-slate-50/50 transition-colors group">
                        <div>
                            <div className="flex items-center gap-3">
                                <p className="font-black text-red-900 text-lg tracking-tight">{item.word}</p>
                                <button 
                                    onClick={() => play(item.word)} 
                                    className={`p-2 rounded-full transition-all active:scale-90 ${playing === item.word ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-red-300'}`}
                                >
                                    <Volume2 size={16} className={playing === item.word ? 'animate-pulse' : ''} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-1 font-medium tracking-tight">"{item.simplified}"</p>
                        </div>
                        <div className="text-right ml-4">
                            <p className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase border border-slate-200 tracking-tighter">{item.meaning}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Guide;