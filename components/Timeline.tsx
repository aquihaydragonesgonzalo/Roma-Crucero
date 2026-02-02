import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Circle, MapPin, AlertTriangle, AlertCircle, Navigation, Headphones, ExternalLink, Maximize2 } from 'lucide-react';
import { Activity, Coordinate } from '../types';
import { formatMinutes, calculateDuration, calculateTimeProgress } from '../utils';

interface TimelineProps {
    itinerary: Activity[];
    onToggleComplete: (id: string) => void;
    onLocate: (coords: Coordinate) => void;
    userLocation: Coordinate | null;
    onOpenAudioGuide: (activity: Activity) => void;
    onPreviewImage: (url: string, title: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ itinerary, onToggleComplete, onLocate, onOpenAudioGuide, onPreviewImage }) => {
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    const calculateGap = (endStrPrev: string, startStrNext: string): number => {
        const [endH, endM] = endStrPrev.split(':').map(Number);
        const [startH, startM] = startStrNext.split(':').map(Number);
        return (startH * 60 + startM) - (endH * 60 + endM);
    };

    return (
        <div className="pb-24 px-4 pt-4 max-w-lg mx-auto fade-in">
            <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-fjord-800 uppercase tracking-tight">Itinerario Roma</h2>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">Sync</span>
            </div>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                {itinerary.map((act, idx) => {
                    const prevAct = idx > 0 ? itinerary[idx - 1] : null;
                    const gap = prevAct ? calculateGap(prevAct.endTime, act.startTime) : 0;
                    const actProgress = calculateTimeProgress(act.startTime, act.endTime);
                    const gapProgress = prevAct ? calculateTimeProgress(prevAct.endTime, act.startTime) : 0;

                    return (
                        <React.Fragment key={act.id}>
                            {gap > 0 && (
                                <div className="relative ml-0 my-8">
                                    <div className="absolute left-[-2px] top-[-20px] bottom-[-20px] border-l-2 border-dashed border-slate-300"></div>
                                    <div className="ml-6 flex items-center">
                                        <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-100 flex flex-col shadow-sm w-full max-w-[240px]">
                                            <div className="flex items-center mb-2">
                                                <div className="bg-slate-100 p-1.5 rounded-full mr-3 border border-slate-200"><Clock size={12} className="text-slate-600" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Intervalo</span>
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">{formatMinutes(gap)} — {gap > 30 ? 'Libre' : 'Traslado'}</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-400" style={{ width: `${gapProgress}%` }}></div></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mb-8 ml-6 relative">
                                <div onClick={() => onToggleComplete(act.id)} className={`absolute -left-[31px] top-0 rounded-full bg-white border-2 cursor-pointer z-10 ${act.completed ? 'border-emerald-500 text-emerald-500 shadow-sm' : 'border-red-600 text-red-600 shadow-sm'}`}>
                                    {act.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </div>
                                <div className={`rounded-2xl border shadow-sm transition-all overflow-hidden bg-white ${act.notes === 'CRITICAL' ? 'border-red-500 bg-red-50' : act.completed ? 'opacity-70 border-emerald-500' : 'border-slate-100'}`}>
                                    <div className="w-full h-1.5 bg-slate-50 overflow-hidden"><div className={`h-full ${actProgress === 100 ? 'bg-slate-300' : 'bg-red-600'}`} style={{ width: `${actProgress}%` }}></div></div>

                                    {/* IMAGEN DE ACTIVIDAD */}
                                    {act.imageUrl && (
                                        <div className="relative w-full h-40 overflow-hidden cursor-pointer group" onClick={() => onPreviewImage(act.imageUrl!, act.title)}>
                                            <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 text-white">
                                                <Maximize2 size={16} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-fjord-800 tracking-tighter uppercase">{act.startTime} - {act.endTime}</span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">{calculateDuration(act.startTime, act.endTime)}</span>
                                                </div>
                                                <h3 className="font-bold text-lg text-gray-800 leading-tight">{act.title}</h3>
                                            </div>
                                            {act.notes === 'CRITICAL' && <AlertTriangle className="text-red-500 animate-pulse" size={20} />}
                                        </div>
                                        <div className="mb-3 text-sm text-gray-600 flex items-center flex-wrap gap-1"><MapPin size={14} className="mr-0.5 text-red-500" /> {act.locationName}</div>
                                        <p className="text-sm text-gray-600 mb-4 whitespace-pre-line leading-relaxed">{act.description}</p>
                                        <div className="bg-slate-50 p-3 rounded-xl text-sm italic border-l-4 border-red-500 mb-4 shadow-inner text-slate-700 font-medium">"{act.keyDetails}"</div>
                                        {act.contingencyNote && <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl p-4 my-4 flex items-start gap-3 shadow-md animate-pulse"><AlertCircle className="text-amber-700 flex-shrink-0 mt-1" size={20} /><div><p className="text-[11px] font-black text-amber-900 uppercase tracking-tighter mb-1">⚠️ PLAN DE CONTINGENCIA</p><p className="text-xs text-amber-950 font-bold leading-snug">{act.contingencyNote}</p></div></div>}
                                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-4 border-t border-slate-50">
                                            <button onClick={() => onLocate(act.coords)} className="flex items-center text-[10px] font-bold text-red-700 bg-red-50 px-3 py-2 rounded-xl border border-red-100 shadow-sm"><Navigation size={12} className="mr-1.5" /> UBICACIÓN</button>
                                            {act.audioGuideText && <button onClick={() => onOpenAudioGuide(act)} className="flex items-center text-[10px] font-bold text-white bg-red-800 px-3 py-2 rounded-xl shadow-md"><Headphones size={12} className="mr-1.5" /> AUDIOGUÍA</button>}
                                            {act.googleMapsUrl && <a href={act.googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-center text-[10px] font-bold text-white bg-emerald-600 px-3 py-2 rounded-xl"><ExternalLink size={12} className="mr-1.5" /> GOOGLE MAPS</a>}
                                            <button onClick={() => onToggleComplete(act.id)} className={`ml-auto px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${act.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{act.completed ? 'Hecho' : 'Check'}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default Timeline;