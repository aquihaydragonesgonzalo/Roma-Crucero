import React, { useState, useEffect } from 'react';
import { PhoneCall, Thermometer, ArrowRight, Sun, Cloud, CloudRain, CloudLightning, Compass, Ship, TrainFront, Footprints, Info, Languages, Volume2, FileDown, CalendarDays } from 'lucide-react';
import { Coordinate, WeatherData, Activity } from '../types';
import { PRONUNCIATIONS } from '../constants';
import { jsPDF } from 'jspdf';

interface GuideProps {
    userLocation: Coordinate | null;
    itinerary: Activity[];
}

const Guide: React.FC<GuideProps> = ({ userLocation, itinerary }) => {
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

    const generatePDF = () => {
        const doc = new jsPDF();

        // Helper para limpiar texto de emojis y caracteres no soportados por las fuentes base de PDF
        const cleanText = (text: string | undefined) => {
            if (!text) return "";
            return text
                .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '') // Eliminar emojis
                .replace(/€/g, 'EUR') // Reemplazar símbolo Euro si da problemas
                .trim();
        };
        
        // Configuración de la página
        const pageWidth = doc.internal.pageSize.width; // 210mm para A4
        const pageHeight = doc.internal.pageSize.height;
        const marginX = 15;
        const colTimeWidth = 25;
        // Margen Izquierdo (15) + Columna Tiempo (25) + Hueco (5) + Texto (140) + Margen Derecho (25) = 210
        // Reducimos el ancho del contenido para asegurar que no toque el borde derecho
        const colContentWidth = 140; 
        const colContentX = marginX + colTimeWidth + 5;
        
        let y = 30;

        // --- ENCABEZADO ---
        doc.setFillColor(153, 27, 27); // Rojo Fjord
        doc.rect(0, 0, pageWidth, 24, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text("ROMA 2026 - ITINERARIO CRUCERO", marginX, 15);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Guia de Escala", pageWidth - marginX, 15, { align: 'right' });

        const checkPageBreak = (heightNeeded: number) => {
            if (y + heightNeeded > pageHeight - 15) {
                doc.addPage();
                y = 20;
                return true;
            }
            return false;
        };

        itinerary.forEach((act) => {
            // --- PREPARACIÓN DE TEXTOS LIMPIOS ---
            const titleRaw = cleanText(act.title).toUpperCase();
            
            let metaRaw = cleanText(act.locationName);
            if (act.priceEUR > 0) metaRaw += ` - ${act.priceEUR} EUR`;
            if (act.type) metaRaw += ` - ${cleanText(act.type).toUpperCase()}`;
            if (act.audioGuideText) metaRaw += ` - AUDIOGUIA`;

            const descRaw = cleanText(act.description);
            const detailRaw = `Detalles: ${cleanText(act.keyDetails)}`;
            
            let notesRaw = "";
            if (act.notes === 'CRITICAL' || act.contingencyNote) {
                notesRaw = `IMPORTANTE: ${cleanText(act.contingencyNote || "Punto critico. Estar muy atento.")}`;
            }

            // --- CÁLCULO DE ALTURAS ---
            // Es CRÍTICO establecer la fuente antes de calcular el tamaño para que `splitTextToSize` sea preciso.

            // Título
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            const titleLines = doc.splitTextToSize(titleRaw, colContentWidth);
            const titleHeight = titleLines.length * 5;

            // Meta
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            const metaLines = doc.splitTextToSize(metaRaw, colContentWidth);
            const metaHeight = metaLines.length * 4;

            // Descripción
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const descLines = doc.splitTextToSize(descRaw, colContentWidth);
            const descHeight = descLines.length * 5;

            // Detalles
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            const detailLines = doc.splitTextToSize(detailRaw, colContentWidth);
            const detailHeight = detailLines.length * 5;

            // Notas
            let notesLines: string[] = [];
            let notesHeight = 0;
            if (notesRaw) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                notesLines = doc.splitTextToSize(notesRaw, colContentWidth);
                notesHeight = notesLines.length * 5;
            }

            // Altura total
            const totalItemHeight = titleHeight + metaHeight + descHeight + detailHeight + notesHeight + 12; // +12 padding

            checkPageBreak(totalItemHeight);

            // --- RENDERIZADO ---
            
            // Columna Tiempo
            doc.setTextColor(50, 50, 50);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(act.startTime, marginX, y + 4);
            
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(act.endTime, marginX, y + 9);

            // Línea Vertical
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(marginX + colTimeWidth, y, marginX + colTimeWidth, y + totalItemHeight - 6);

            // Columna Contenido
            let currentY = y + 4;

            // Título
            doc.setTextColor(153, 27, 27);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(titleLines, colContentX, currentY);
            currentY += titleHeight + 1;

            // Meta
            doc.setTextColor(80, 80, 80);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(metaLines, colContentX, currentY);
            currentY += metaHeight + 2;

            // Descripción
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(descLines, colContentX, currentY);
            currentY += descHeight + 2;

            // Detalles
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text(detailLines, colContentX, currentY);
            currentY += detailHeight + 2;

            // Notas
            if (notesLines.length > 0) {
                doc.setTextColor(200, 0, 0);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text(notesLines, colContentX, currentY);
            }

            y += totalItemHeight;
        });
        
        // Paginación
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Pagina ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save('Itinerario_Roma_2026.pdf');
    };

    return (
        <div className="pb-32 px-4 pt-6 max-w-lg mx-auto h-full overflow-y-auto no-scrollbar fade-in">
            <h2 className="text-2xl font-bold text-red-800 mb-6 uppercase tracking-tight">Guía Roma</h2>
            
            {/* Generate PDF Button */}
            <div className="mb-8">
                <button 
                    onClick={generatePDF}
                    className="w-full bg-slate-800 text-white p-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform group border border-slate-700"
                >
                    <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                        <FileDown size={24} className="text-emerald-400" />
                    </div>
                    <div className="text-left">
                        <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Documentación</span>
                        <span className="block text-sm font-black uppercase tracking-tight leading-none">Descargar Itinerario PDF</span>
                    </div>
                </button>
            </div>
            
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

                        {/* 5-Day Forecast */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg divide-y divide-slate-100 overflow-hidden">
                            <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center gap-2">
                                <CalendarDays size={14} className="text-fjord-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximos 5 días</span>
                            </div>
                            {weather.daily.time.slice(0, 5).map((date, i) => {
                                // Appending T12:00:00 to avoid timezone issues shifting the day
                                const d = new Date(date + 'T12:00:00');
                                const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' });
                                
                                return (
                                    <div key={date} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="w-24">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{dayName}</p>
                                            <p className="text-sm font-bold text-slate-700 leading-none mt-0.5 capitalize">{d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                                        </div>
                                        <div className="flex items-center justify-center bg-slate-50 rounded-2xl w-10 h-10 border border-slate-100 shadow-sm text-slate-600">
                                            {getWeatherIcon(weather.daily.weathercode[i], 20)}
                                        </div>
                                        <div className="flex items-center justify-end gap-3 min-w-[80px]">
                                            <span className="text-base font-black text-slate-800">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                                            <span className="text-xs font-bold text-slate-400 opacity-60">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
                                        </div>
                                    </div>
                                );
                            })}
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