import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { 
    Edit3, 
    Save, 
    FolderOpen, 
    Image, 
    RotateCcw, 
    Trash2, 
    Mic, 
    Music, 
    Volume2, 
    Layout, 
    Monitor, 
    Sliders,
    HelpCircle,
    ArrowLeft,
    Globe,
    Shield,
    Cloud
} from 'lucide-react';

const GRID_X = 2.5;
const GRID_Y = 10;
const BENCH_WIDTH = 212.5;
const BENCH_HEIGHT = 30;

const EQUIPMENT_KEYS = ['CX_SOM', 'RET_CHAO', 'RET_TETO', 'CUBO_BAIXO', 'CUBO_GUIT', 'MIC_FIO', 'MIC_SFIO', 'TV_ELEM', 'RECEPTOR'];
const VOICES_KEYS = ['REGENTE', 'SOPRANO', 'CONTRALTO', 'TENOR', 'BAIXO'];
const BASE = ['BAT', 'BASS', 'PIA', 'VIOLAO', 'GUITARRA', 'PERCUSSAO'];
const STRINGS_KEYS = ['VIOLINO', 'VIOLA', 'CELLO', 'C.BAIXO'];
const WINDS_KEYS = ['FLAUTA', 'CLARINETE', 'OBOE', 'FAGOTE', 'SAX'];
const BRASS = ['TROMPETE', 'TROMPA', 'TROMBONE', 'EUFONIO', 'TUBA'];

const ALL_ITEMS = {
    'REGENTE': { name: 'Regente', color: '#eab308', svg: `<path d="M12 4a3 3 0 100 6 3 3 0 000-6zM8 12c-1 0-2 1-2 2v3h2v7h3v-6h2v6h3v-7h2v-3c0-1-1-2-2-2H8z" fill="#eab308"/><line x1="16" y1="12" x2="22" y2="7" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>` },
    'SOPRANO': { name: 'Soprano', color: '#2563eb', svg: `<path d="M12 3a3 3 0 100 6 3 3 0 000-6zm-4 8c-1 0-2 1-2 2v8h3v-4h2v4h3v-4h2v4h3v-8c0-1-1-2-2-2H8z" fill="#2563eb"/><circle cx="17" cy="7" r="3" fill="#ffffff" opacity="0.8"/>` },
    'CONTRALTO': { name: 'Contralto', color: '#dc2626', svg: `<path d="M12 3a3 3 0 100 6 3 3 0 000-6zm-4 8c-1 0-2 1-2 2v8h3v-4h2v4h3v-4h2v4h3v-8c0-1-1-2-2-2H8z" fill="#dc2626"/><circle cx="17" cy="7" r="3" fill="#ffffff" opacity="0.8"/>` },
    'TENOR': { name: 'Tenor', color: '#16a34a', svg: `<path d="M12 3a3 3 0 100 6 3 3 0 000-6zm-4 8c-1 0-2 1-2 2v8h3v-4h2v4h3v-4h2v4h3v-8c0-1-1-2-2-2H8z" fill="#16a34a"/><circle cx="17" cy="7" r="3" fill="#ffffff" opacity="0.8"/>` },
    'BAIXO': { name: 'Baixo (Voz)', color: '#9333ea', svg: `<path d="M12 3a3 3 0 100 6 3 3 0 000-6zm-4 8c-1 0-2 1-2 2v8h3v-4h2v4h3v-4h2v4h3v-8c0-1-1-2-2-2H8z" fill="#9333ea"/><circle cx="17" cy="7" r="3" fill="#ffffff" opacity="0.8"/>` },
    
    'CX_SOM': { name: 'Caixa de Som PA', color: '#0284c7', svg: `<rect x="5" y="2" width="14" height="20" rx="2" fill="#1e293b" stroke="#ffffff" stroke-width="1"/><circle cx="12" cy="7" r="2.5" fill="#38bdf8"/><circle cx="12" cy="15" r="4" fill="#38bdf8" stroke="#ffffff" stroke-width="0.8"/>` },
    'RET_CHAO': { name: 'Retorno de Chão', color: '#f97316', svg: `<polygon points="3,18 7,6 21,6 17,18" fill="#f97316" stroke="#ffffff" stroke-width="1"/><circle cx="12" cy="12" r="3.5" fill="#0f172a"/><line x1="5" y1="18" x2="19" y2="18" stroke="#ffffff" stroke-width="1.5"/>` },
    'RET_TETO': { name: 'Retorno de Teto', color: '#94a3b8', svg: `<circle cx="12" cy="12" r="9" fill="#334155" stroke="#ffffff" stroke-width="1.2"/><circle cx="12" cy="12" r="6" fill="#0f172a" stroke="#94a3b8" stroke-dasharray="1.5 1.5"/><circle cx="12" cy="12" r="2" fill="#38bdf8"/>` },
    'CUBO_BAIXO': { name: 'Cubo de Baixo', color: '#a855f7', svg: `<rect x="3" y="3" width="18" height="18" rx="2" fill="#581c87" stroke="#ffffff" stroke-width="1.2"/><rect x="5" y="5" width="14" height="4" fill="#0f172a"/><circle cx="12" cy="14" r="4.5" fill="#a855f7" stroke="#ffffff" stroke-width="0.8"/><text x="12" y="8" fill="#38bdf8" font-size="3.5" font-weight="bold" text-anchor="middle">BASS</text>` },
    'CUBO_GUIT': { name: 'Cubo de Guitarra', color: '#ef4444', svg: `<rect x="3" y="3" width="18" height="18" rx="2" fill="#7f1d1d" stroke="#ffffff" stroke-width="1.2"/><rect x="5" y="5" width="14" height="3" fill="#0f172a"/><circle cx="8" cy="13" r="3" fill="#ef4444"/><circle cx="16" cy="13" r="3" fill="#ef4444"/><text x="12" y="7.5" fill="#fca5a5" font-size="3" font-weight="bold" text-anchor="middle">GUIT</text>` },
    'MIC_FIO': { name: 'Mic com Fio', color: '#14b8a6', svg: `<path d="M12 3a2.5 2.5 0 00-2.5 2.5v4a2.5 2.5 0 005 0v-4A2.5 2.5 0 0012 3z" fill="#14b8a6" stroke="#ffffff" stroke-width="0.8"/><path d="M19 10a7 7 0 01-14 0" fill="none" stroke="#ffffff" stroke-width="1.2"/><line x1="12" y1="17" x2="12" y2="21" stroke="#ffffff" stroke-width="1.2"/><path d="M12 21c-2 0-3 2-5 2" fill="none" stroke="#14b8a6" stroke-width="1.5"/>` },
    'MIC_SFIO': { name: 'Mic sem Fio', color: '#06b6d4', svg: `<path d="M12 2a2.5 2.5 0 00-2.5 2.5v4a2.5 2.5 0 005 0v-4A2.5 2.5 0 0012 2z" fill="#06b6d4" stroke="#ffffff" stroke-width="0.8"/><path d="M18 8.5a6 6 0 01-12 0" fill="none" stroke="#ffffff" stroke-width="1"/><line x1="12" y1="14.5" x2="12" y2="19" stroke="#ffffff" stroke-width="1.2"/><line x1="12" y1="19" x2="12" y2="22" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="1 1"/>` },
    'TV_ELEM': { name: 'TV / Monitor', color: '#3b82f6', svg: `<rect x="2" y="4" width="20" height="13" rx="1.5" fill="#0f172a" stroke="#3b82f6" stroke-width="1.2"/><polygon points="9,20 15,20 14,17 10,17" fill="#64748b"/><text x="12" y="12" fill="#38bdf8" font-size="4.5" font-weight="bold" text-anchor="middle">TV</text>` },
    'RECEPTOR': { name: 'Receptor Satélite', color: '#6366f1', svg: `<rect x="2" y="8" width="20" height="9" rx="1.5" fill="#1e1b4b" stroke="#ffffff" stroke-width="1"/><circle cx="5" cy="12.5" r="1" fill="#22c55e"/><circle cx="8" cy="12.5" r="1" fill="#eab308"/><path d="M16 4a4 4 0 014 4" fill="none" stroke="#6366f1" stroke-width="1.2"/><path d="M14 6a2 2 0 012 2" fill="none" stroke="#6366f1" stroke-width="1.2"/>` },

    'BAT': { name: 'Bateria', color: '#475569', svg: `<circle cx="12" cy="13.5" r="6.8" fill="#475569" stroke="#ffffff" stroke-width="1.2"/><circle cx="5.5" cy="8.5" r="4" fill="#64748b" stroke="#ffffff" stroke-width="0.9"/><circle cx="18.5" cy="8.5" r="4" fill="#64748b" stroke="#ffffff" stroke-width="0.9"/><circle cx="4.5" cy="15.5" r="4.2" fill="#d97706"/><circle cx="19.5" cy="15.5" r="4.2" fill="#d97706"/>` },
    'BASS': { name: 'Contra-Baixo', color: '#7c3aed', svg: `<path d="M12 1a2 2 0 00-2 2v7a4 4 0 00-2 3.5C8 16 9.8 18 12 18s4-2 4-4.5c0-1.5-1-2.8-2-3.5V3a2 2 0 00-2-2z" fill="#7c3aed" stroke="#ffffff" stroke-width="1"/><circle cx="12" cy="13.5" r="1.5" fill="#0f172a"/><line x1="12" y1="1" x2="12" y2="10" stroke="#ffffff" stroke-width="0.8"/>` },
    'PIA': { name: 'Piano', color: '#005580', svg: `<rect x="4" y="4" width="16" height="16" rx="2" fill="#005580" stroke="#ffffff" stroke-width="1"/><rect x="6" y="11" width="12" height="7" fill="#ffffff"/><rect x="7.5" y="11" width="1.5" height="4" fill="#000"/><rect x="10" y="11" width="1.5" height="4" fill="#000"/><rect x="13" y="11" width="1.5" height="4" fill="#000"/><rect x="15.5" y="11" width="1.5" height="4" fill="#000"/>` },
    'VIOLAO': { name: 'Violão', color: '#d97706', svg: `<path d="M12 2a2 2 0 00-2 2v6a4 4 0 00-2 3.5C8 16 9.8 18 12 18s4-2 4-4.5c0-1.5-1-2.8-2-3.5V4a2 2 0 00-2-2z" fill="#d97706" stroke="#ffffff" stroke-width="1"/><circle cx="12" cy="13.5" r="1.5" fill="#0f172a"/>` },
    'GUITARRA': { name: 'Guitarra', color: '#b91c1c', svg: `<path d="M12 2a1.5 1.5 0 00-1.5 1.5v6.5a3.5 3.5 0 00-2 3.1c0 2 1.5 3.9 3.5 3.9s3.5-1.9 3.5-3.9c0-1.4-.8-2.6-2-3.1V3.5A1.5 1.5 0 0012 2z" fill="#b91c1c" stroke="#ffffff" stroke-width="1"/><circle cx="12" cy="13.5" r="1.2" fill="#ffffff"/>` },
    'FLAUTA': { name: 'Flauta', color: '#059669', svg: `<rect x="2" y="10" width="20" height="4" rx="1.5" fill="#059669" stroke="#ffffff" stroke-width="1"/><circle cx="7" cy="12" r="0.8" fill="#ffffff"/><circle cx="10" cy="12" r="0.8" fill="#ffffff"/><circle cx="13" cy="12" r="0.8" fill="#ffffff"/><circle cx="16" cy="12" r="0.8" fill="#ffffff"/>` },
    'CLARINETE': { name: 'Clarinete', color: '#10b981', svg: `<rect x="11" y="2" width="2" height="15" rx="0.5" fill="#10b981" stroke="#ffffff" stroke-width="0.8"/><path d="M9.5 17l-2 4h9l-2-4h-5z" fill="#10b981" stroke="#ffffff" stroke-width="0.8"/><circle cx="12" cy="5" r="0.7" fill="#ffffff"/><circle cx="12" cy="8" r="0.7" fill="#ffffff"/><circle cx="12" cy="11" r="0.7" fill="#ffffff"/><circle cx="12" cy="14" r="0.7" fill="#ffffff"/>` },
    'OBOE': { name: 'Oboé', color: '#047857', svg: `<rect x="11.2" y="4" width="1.6" height="14" fill="#047857" stroke="#ffffff" stroke-width="0.7"/><path d="M10 18l-1.5 3h7l-1.5-3h-4z" fill="#047857" stroke="#ffffff" stroke-width="0.7"/><line x1="12" y1="1" x2="12" y2="4" stroke="#ffffff" stroke-width="1"/>` },
    'FAGOTE': { name: 'Fagote', color: '#065f46', svg: `<rect x="10" y="3" width="2.2" height="18" fill="#065f46" stroke="#ffffff" stroke-width="0.8"/><rect x="12.5" y="6" width="1.8" height="15" fill="#065f46" stroke="#ffffff" stroke-width="0.8"/><path d="M10 5l-4-2" fill="none" stroke="#ffffff" stroke-width="1"/>` },
    'SAX': { name: 'Sax', color: '#0d9488', svg: `<path d="M8 4h3v9a3 3 0 006 0v-2h-2" fill="none" stroke="#0d9488" stroke-width="3" stroke-linecap="round"/><path d="M8 4h3v9a3 3 0 006 0v-2h-2" fill="none" stroke="#ffffff" stroke-width="1"/><circle cx="16" cy="10" r="2.5" fill="#0d9488" stroke="#ffffff" stroke-width="0.8"/>` },
    'VIOLINO': { name: 'Violino', color: '#f43f5e', svg: `<path d="M12 3c-1 0-1.5.8-1.5 1.5v4.2C9.2 9.2 8.5 10.5 8.5 12c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-1.5-.7-2.8-2-3.3V4.5C13.5 3.8 13 3 12 3z" fill="#f43f5e" stroke="#ffffff" stroke-width="1"/><line x1="6" y1="17" x2="18" y2="7" stroke="#ffffff" stroke-width="1"/>` },
    'VIOLA': { name: 'Viola', color: '#e11d48', svg: `<path d="M12 2.5c-1.1 0-1.8.8-1.8 1.7v3.8C9 8.8 8.1 10.2 8.1 12c0 2.2 1.9 3.8 3.9 3.8s3.9-1.6 3.9-3.8c0-1.8-.9-3.2-2.1-4V4.2c0-.9-.7-1.7-1.8-1.7z" fill="#e11d48" stroke="#ffffff" stroke-width="1"/><line x1="5" y1="18.5" x2="19" y2="5.5" stroke="#ffffff" stroke-width="1"/>` },
    'CELLO': { name: 'Cello', color: '#be123c', svg: `<path d="M12 2c-1.2 0-2 1-2 2v4c-1.5.8-2.5 2.2-2.5 4 0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5c0-1.8-1-3.2-2.5-4V4c0-1-1-2-2-2z" fill="#be123c" stroke="#ffffff" stroke-width="1"/><line x1="12" y1="16.5" x2="12" y2="21" stroke="#ffffff" stroke-width="1.2"/>` },
    'C.BAIXO': { name: 'C.Baixo', color: '#881337', svg: `<path d="M12 1.5c-1.3 0-2.2 1-2.2 2.2v4.3c-1.6 1-2.8 2.5-2.8 4.5 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2-1.2-3.5-2.8-4.5V3.7c0-1.2-.9-2.2-2.2-2.2z" fill="#881337" stroke="#ffffff" stroke-width="1"/><line x1="12" y1="17.5" x2="12" y2="22.5" stroke="#ffffff" stroke-width="1.5"/>` },
    
    'TROMPETE': { name: 'Trompete', color: '#f59e0b', svg: `<rect x="3" y="10" width="12" height="3" fill="#f59e0b" stroke="#ffffff" stroke-width="0.8"/><path d="M15 9l6-3v12l-6-3V9z" fill="#f59e0b" stroke="#ffffff" stroke-width="0.8"/><rect x="7" y="7" width="1.5" height="3" fill="#ffffff"/><rect x="10" y="7" width="1.5" height="3" fill="#ffffff"/>` },
    'TROMPA': { name: 'Trompa', color: '#d97706', svg: `<circle cx="11" cy="13" r="4.5" fill="none" stroke="#d97706" stroke-width="1.5"/><path d="M14 10.5l6-3.5v7l-6-3.5z" fill="#d97706"/><path d="M6.5 13V8h4" fill="none" stroke="#d97706" stroke-width="1.5"/>` },
    'TROMBONE': { name: 'Trombone', color: '#ea580c', svg: `<path d="M4 9h10v2H4z" fill="#ea580c"/><rect x="14" y="6.5" width="2" height="7" rx="0.5" fill="#ffffff"/><path d="M14 7.5l6-3.5v11l-6-3.5v-4z" fill="#ea580c" stroke="#ffffff" stroke-width="0.8"/><path d="M3 13.5h10v2H3z" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>` },
    'EUFONIO': { name: 'Eufônio', color: '#c2410c', svg: `<path d="M7 20V9a5 5 0 0 1 10 0v2" fill="none" stroke="#c2410c" stroke-width="1.5"/><path d="M14 11h5l1-3h-7z" fill="#c2410c"/><line x1="10" y1="12" x2="10" y2="17" stroke="#ffffff" stroke-width="1.2"/><line x1="13" y1="12" x2="13" y2="17" stroke="#ffffff" stroke-width="1.2"/><line x1="7" y1="20" x2="17" y2="20" stroke="#c2410c" stroke-width="1.5"/>` },
    'TUBA': { name: 'Tuba', color: '#9a3412', svg: `<path d="M7 4h10v5a5 5 0 01-10 0V4z" fill="#9a3412" stroke="#ffffff" stroke-width="0.8"/><path d="M9 9h6v7a3 3 0 01-6 0V9z" fill="#9a3412" stroke="#ffffff" stroke-width="0.8"/><path d="M12 2l4-1v3l-4-2z" fill="#ffffff"/>` },
    
    'PERCUSSAO': { name: 'Percussão', color: '#64748b', svg: `<circle cx="12" cy="12" r="7" fill="#64748b" stroke="#ffffff" stroke-width="1.2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2 2"/>` }        
};

const initialBenchesConfig = [
    { type: 'criancas',       x: 112.5, y: 220 },
    { type: 'intermediarios', x: 112.5, y: 270 },
    { type: 'adolescentes',   x: 112.5, y: 320 },
    { type: 'geral',          x: 112.5, y: 370 },
    { type: 'geral',          x: 112.5, y: 420 },
    { type: 'geral',          x: 112.5, y: 470 },
    { type: 'geral',          x: 112.5, y: 520 },
    { type: 'geral',          x: 112.5, y: 570 },
    { type: 'geral',          x: 112.5, y: 620 },
    { type: 'geral',          x: 112.5, y: 670 },
    { type: 'louvor',         x: 435,   y: 220 },
    { type: 'louvor',         x: 435,   y: 270 },
    { type: 'louvor',         x: 435,   y: 320 },
    { type: 'louvor',         x: 435,   y: 370 },
    { type: 'geral',          x: 435,   y: 420 },
    { type: 'geral',          x: 435,   y: 470 },
    { type: 'geral',          x: 435,   y: 520 },
    { type: 'geral',          x: 435,   y: 570 },
    { type: 'geral',          x: 435,   y: 620 },
    { type: 'geral',          x: 435,   y: 670 }
];

export default function MapaPalco() {
    const navigate = useNavigate();

    const [nomeIgreja, setNomeIgreja] = useState("Carregando...");
    const [carregandoValidacao, setCarregandoValidacao] = useState(true);
    const [userRole, setUserRole] = useState("user");
    const userNuvem = localStorage.getItem("icmlyrics_user_nuvem") || "";

    const [activeTab, setActiveTab] = useState('bancos');
    const [selectedToolKey, setSelectedToolKey] = useState(null);
    const [benches, setBenches] = useState([]);
    const [freeElements, setFreeElements] = useState([]);
    const [zoom, setZoom] = useState(1);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const svgRef = useRef(null);
    const fileInputRef = useRef(null);

    const [dragState, setDragState] = useState({ element: null, offsetX: 0, offsetY: 0, category: null });

    const isSuper = userRole === "super_admin";

    useEffect(() => {
        const validarAcesso = async () => {
            try {
                setCarregandoValidacao(true);
                const roleSalva = localStorage.getItem("icmlyrics_role") || "user";
                if (roleSalva === "super_admin" || userNuvem === "admin_geral") {
                    setUserRole("super_admin");
                    setNomeIgreja(userNuvem || "Administração Geral");
                    setCarregandoValidacao(false);
                    return;
                }
                if (!userNuvem.trim()) {
                    setUserRole("user");
                    setNomeIgreja("Modo Offline");
                    setCarregandoValidacao(false);
                    return;
                }
                const { data, error } = await supabase
                    .from("igrejas_autorizadas")
                    .select("role, nome_igreja")
                    .eq("usuario", userNuvem.trim())
                    .maybeSingle();
                if (!error && data) {
                    const roleDoBanco = data.role?.toLowerCase() || "";
                    if (roleDoBanco === "super_admin" || roleDoBanco === "super_adm") {
                        setUserRole("super_admin");
                    } else if (
                        roleDoBanco === "church_admin" || 
                        roleDoBanco === "adm_local" || 
                        roleSalva === "church_admin"
                    ) {
                        setUserRole("church_admin");
                    } else {
                        setUserRole("user");
                    }
                    setNomeIgreja(data.nome_igreja || userNuvem);
                } else {
                    setUserRole(roleSalva);
                    setNomeIgreja(userNuvem);
                }
            } catch (err) {
                console.error("Erro ao validar permissões:", err);
                setUserRole(localStorage.getItem("icmlyrics_role") || "user");
            } finally {
                setCarregandoValidacao(false);
            }
        };
        validarAcesso();
    }, [userNuvem]);

    useEffect(() => {
        resetLayout();
    }, []);

    useEffect(() => {
        const handleGlobalPointerMove = (e) => {
            if (!isEditMode || !dragState.element) return;
            const pt = getSVGCoordinates(e);
            let rawX = pt.x - dragState.offsetX;
            let rawY = pt.y - dragState.offsetY;

            let snappedX = Math.round(rawX / GRID_X) * GRID_X;
            let snappedY = Math.round(rawY / GRID_Y) * GRID_Y;

            if (dragState.category === 'bench') {
                setBenches(prev => prev.map(b => b.id === dragState.element.id ? { ...b, x: snappedX, y: snappedY } : b));
            } else {
                setFreeElements(prev => prev.map(f => f.id === dragState.element.id ? { ...f, x: snappedX, y: snappedY } : f));
            }
        };

        const handleGlobalPointerUp = () => {
            setDragState({ element: null, offsetX: 0, offsetY: 0, category: null });
        };

        if (dragState.element) {
            window.addEventListener('pointermove', handleGlobalPointerMove);
            window.addEventListener('pointerup', handleGlobalPointerUp);
        }

        return () => {
            window.removeEventListener('pointermove', handleGlobalPointerMove);
            window.removeEventListener('pointerup', handleGlobalPointerUp);
        };
    }, [dragState, isEditMode]);

    const resetLayout = () => {
        setFreeElements([]);
        setBenches(initialBenchesConfig.map((b, i) => ({
            id: `bench-${i}`,
            type: b.type,
            x: b.x,
            y: b.y,
            angle: 0,
            musicians: {}
        })));
    };

    const clearMap = () => {
        setBenches([]);
        setFreeElements([]);
    };

    const getSVGCoordinates = (e) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const p = svg.createSVGPoint();
        p.x = clientX;
        p.y = clientY;
        return p.matrixTransform(svg.getScreenCTM().inverse());
    };

    const handleSvgClick = (e) => {
        if (!isEditMode || !selectedToolKey || e.target.classList.contains('slot')) return;

        const pt = getSVGCoordinates(e);
        if (selectedToolKey.startsWith('BENCH_')) {
            const benchType = selectedToolKey.replace('BENCH_', '');
            setBenches(prev => [...prev, {
                id: `bench-${Date.now()}`,
                type: benchType,
                x: pt.x - (BENCH_WIDTH / 2),
                y: pt.y - (BENCH_HEIGHT / 2),
                angle: 0,
                musicians: {}
            }]);
        } else {
            let ox = 11, oy = 11;
            if (selectedToolKey === 'BAT') { ox = 48; oy = 48; }
            else if (selectedToolKey === 'PIA') { ox = 36; oy = 12; }
            else if (selectedToolKey === 'MESA_PROJECAO') { ox = 76; oy = 32; }
            else if (selectedToolKey === 'MESA') { ox = 20; oy = 12; }
            else if (selectedToolKey === 'PC') { ox = 18; oy = 14; }

            setFreeElements(prev => [...prev, {
                id: `free-${Date.now()}`,
                type: selectedToolKey,
                x: pt.x - ox,
                y: pt.y - oy,
                angle: selectedToolKey === 'BAT' ? 90 : 0
            }]);
        }
        setSelectedToolKey(null);
    };

    const startDrag = (e, item, category) => {
        if (!isEditMode || (e.button !== 0 && e.type !== 'touchstart')) return;
        e.stopPropagation();
        const pt = getSVGCoordinates(e);
        setDragState({ element: item, offsetX: pt.x - item.x, offsetY: pt.y - item.y, category });
    };

    const rotateItem = (e, id, category) => {
        if (!isEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        const updateAngle = prev => prev.map(item => item.id === id ? { ...item, angle: (item.angle + 90) % 360 } : item);
        category === 'bench' ? setBenches(updateAngle) : setFreeElements(updateAngle);
    };

    const doubleClickItem = (e, id, category) => {
        if (!isEditMode) return;
        e.stopPropagation();
        if (category === 'bench') setBenches(prev => prev.filter(b => b.id !== id));
        else setFreeElements(prev => prev.filter(f => f.id !== id));
    };

    const handleSlotClick = (e, benchId, slotIndex) => {
        if (!isEditMode) return;
        e.stopPropagation();
        if (selectedToolKey && ALL_ITEMS[selectedToolKey]) {
            setBenches(prev => prev.map(b => {
                if (b.id !== benchId) return b;
                return { ...b, musicians: { ...b.musicians, [slotIndex]: selectedToolKey } };
            }));
            setSelectedToolKey(null);
        }
    };

    const removeMusician = (e, benchId, slotIndex) => {
        if (!isEditMode) return;
        e.stopPropagation();
        setBenches(prev => prev.map(b => {
            if (b.id !== benchId) return b;
            const newMusicians = { ...b.musicians };
            delete newMusicians[slotIndex];
            return { ...b, musicians: newMusicians };
        }));
    };

    const exportJSON = () => {
        const data = { benches, freeElements };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'layout-icm.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const importJSON = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                setBenches(data.benches || []);
                setFreeElements(data.freeElements || []);
            } catch (err) { alert('Erro ao carregar o arquivo JSON.'); }
        };
        reader.readAsText(file);
    };

    const exportSVG = () => {
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'layout-igreja.svg'; a.click();
        URL.revokeObjectURL(url);
    };

    const CardItem = ({ itemKey }) => {
        const item = ALL_ITEMS[itemKey];
        return (
            <div 
                className={`musico-card ${selectedToolKey === itemKey ? 'selected' : ''}`}
                title={item.name}
                onClick={() => setSelectedToolKey(prev => prev === itemKey ? null : itemKey)}
            >
                <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: item.svg }}></svg>
            </div>
        );
    };

    const renderFreeElementInner = (type) => {
        if (type === 'BAT') {
            return (
                <g transform="scale(1.0)">
                    <ellipse cx="40" cy="20" rx="16" ry="10" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                    <rect x="30" y="10" width="20" height="3" fill="#64748b" rx="1" />
                    <circle cx="18" cy="36" r="7" fill="#64748b" stroke="#334155" />
                    <circle cx="24" cy="22" r="6" fill="#475569" />
                    <circle cx="56" cy="22" r="6" fill="#475569" />
                    <circle cx="62" cy="38" r="8" fill="#334155" />
                    <circle cx="10" cy="12" r="9" fill="#d97706" opacity="0.85" />
                    <circle cx="70" cy="12" r="10" fill="#d97706" opacity="0.85" />
                    <text x="40" y="22" fill="#ffffff" fontSize="4.8" fontWeight="bold" textAnchor="middle">BATERIA</text>
                </g>
            );
        }
        if (type === 'PIA') {
            return (
                <g transform="scale(0.75)">
                    <rect x="0" y="0" width="85" height="30" fill="#0284c7" stroke="#0369a1" rx="4" strokeWidth="2" />
                    <rect x="4" y="20" width="77" height="6" fill="#f8fafc" />
                    <rect x="10" y="20" width="3" height="4" fill="#000" />
                    <rect x="16" y="20" width="3" height="4" fill="#000" />
                    <rect x="28" y="20" width="3" height="4" fill="#000" />
                    <rect x="34" y="20" width="3" height="4" fill="#000" />
                    <rect x="40" y="20" width="3" height="4" fill="#000" />
                    <rect x="52" y="20" width="3" height="4" fill="#000" />
                    <rect x="58" y="20" width="3" height="4" fill="#000" />
                    <text x="42" y="13" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">PIANO</text>
                </g>
            );
        }
        if (type === 'MESA_PROJECAO') {
            return (
                <>
                    <rect x="0" y="0" width="152" height="64" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3"/>
                    <line x1="76" y1="4" x2="76" y2="60" stroke="#334155" strokeWidth="2" strokeDasharray="4,4"/>
                    <rect x="8" y="8" width="60" height="36" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5"/>
                    <line x1="18" y1="14" x2="18" y2="34" stroke="#38bdf8" strokeWidth="2.5"/>
                    <line x1="30" y1="14" x2="30" y2="34" stroke="#38bdf8" strokeWidth="2.5"/>
                    <line x1="42" y1="14" x2="42" y2="34" stroke="#eab308" strokeWidth="2.5"/>
                    <line x1="54" y1="14" x2="54" y2="34" stroke="#ef4444" strokeWidth="2.5"/>
                    <text x="38" y="55" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">MESA DE SOM</text>
                    <rect x="84" y="8" width="60" height="36" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5"/>
                    <rect x="92" y="14" width="44" height="22" rx="2" fill="#0f172a"/>
                    <line x1="98" y1="20" x2="126" y2="20" stroke="#38bdf8" strokeWidth="1.5"/>
                    <line x1="98" y1="26" x2="118" y2="26" stroke="#22c55e" strokeWidth="1.5"/>
                    <text x="114" y="55" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">PROJEÇÃO / PC</text>
                </>
            );
        }
        if (type === 'MESA') return (
            <>
                <rect x="0" y="0" width="40" height="24" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5"/>
                <rect x="4" y="4" width="32" height="12" rx="1" fill="#0f172a" stroke="#475569" strokeWidth="0.8"/>
                <line x1="8" y1="7" x2="8" y2="13" stroke="#38bdf8" strokeWidth="1.5"/>
                <line x1="14" y1="7" x2="14" y2="13" stroke="#38bdf8" strokeWidth="1.5"/>
                <line x1="20" y1="7" x2="20" y2="13" stroke="#eab308" strokeWidth="1.5"/>
                <line x1="26" y1="7" x2="26" y2="13" stroke="#ef4444" strokeWidth="1.5"/>
                <circle cx="32" cy="10" r="1.5" fill="#22c55e"/>
                <text x="20" y="21" fill="#cbd5e1" fontSize="5.5" fontWeight="bold" textAnchor="middle">MESA SOM</text>
            </>
        );
        if (type === 'PC') return (
            <>
                <rect x="2" y="2" width="32" height="18" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5"/>
                <rect x="5" y="5" width="26" height="12" rx="1" fill="#1e293b"/>
                <line x1="8" y1="8" x2="20" y2="8" stroke="#38bdf8" strokeWidth="1"/>
                <line x1="8" y1="11" x2="25" y2="11" stroke="#94a3b8" strokeWidth="1"/>
                <line x1="8" y1="14" x2="16" y2="14" stroke="#22c55e" strokeWidth="1"/>
                <polygon points="18,20 22,20 24,23 16,23" fill="#64748b"/>
                <text x="18" y="27.5" fill="#cbd5e1" fontSize="5.5" fontWeight="bold" textAnchor="middle">PC PROJEÇÃO</text>
            </>
        );

        const item = ALL_ITEMS[type];
        return (
            <>
                <g transform="scale(0.9)" dangerouslySetInnerHTML={{ __html: item.svg }} />
                <text x="11" y="28" fill={item.color} fontSize="6.5" fontWeight="bold" textAnchor="middle">{type}</text>
            </>
        );
    };

    return (
        <div className="mapa-palco-wrapper">
            <style>{`
                .mapa-palco-wrapper {
                    background-color: #0b1329;
                    min-height: 100vh;
                    color: #f8fafc;
                    font-family: system-ui, -apple-system, sans-serif;
                    padding-bottom: 40px;
                }
                .btn-action {
                    background: #1e293b;
                    color: #f8fafc;
                    border: 1px solid #334155;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: background 0.2s;
                }
                .btn-action:hover {
                    background: #334155;
                }
                .btn-mode {
                    background: ${isEditMode ? '#1e3a8a' : '#1e293b'};
                    border-color: ${isEditMode ? '#3b82f6' : '#334155'};
                    font-weight: bold;
                }
                .btn-danger {
                    background: #7f1d1d;
                    border-color: #991b1b;
                }
                .btn-danger:hover {
                    background: #991b1b;
                }
                .toolbar-tabs-container {
                    background: #0f172a;
                    border-bottom: 1px solid #1e293b;
                    padding: 10px 20px;
                }
                .tab-headers {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }
                .tab-btn {
                    background: #1e293b;
                    color: #94a3b8;
                    border: none;
                    padding: 6px 14px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: background 0.2s, color 0.2s;
                }
                .tab-btn.active {
                    background: #3b82f6;
                    color: #fff;
                }
                .tab-content {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .sub-group-title {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    font-weight: bold;
                    margin-right: 4px;
                }
                .btn-banco {
                    background: #1e293b;
                    border: 1px solid #334155;
                    color: #f8fafc;
                    padding: 5px 10px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .btn-banco.selected {
                    border-color: #38bdf8;
                    background: #1e3a8a;
                }
                .color-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    display: inline-block;
                }
                .v-divider {
                    width: 1px;
                    height: 24px;
                    background: #334155;
                    margin: 0 8px;
                }
                .musico-card {
                    width: 34px;
                    height: 34px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    padding: 4px;
                    transition: transform 0.1s, border-color 0.2s;
                }
                .musico-card:hover {
                    background: #334155;
                    border-color: #38bdf8;
                }
                .musico-card.selected {
                    border-color: #38bdf8;
                    background: #1e3a8a;
                    transform: scale(1.05);
                }
                .musico-card svg {
                    width: 100%;
                    height: 100%;
                }
                .instructions-hint {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #e2e8f0;
                    padding: 10px 16px;
                    background: #1e293b;
                    border-bottom: 1px solid #334155;
                    margin: 0;
                }
                .canvas-wrapper-outer {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                    overflow: auto;
                }
                svg#churchMap {
                    background: #e7e5e4;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    transition: transform 0.2s ease;
                }
                .wall {
                    fill: #f5f5f4;
                    stroke: #78716c;
                    stroke-width: 8;
                }
                .brick-wall {
                    fill: url(#brickPattern);
                    stroke: #44403c;
                    stroke-width: 1.5;
                }
                .pillar {
                    fill: #d6d3d1;
                    stroke: #a8a29e;
                    stroke-width: 1.5;
                    rx: 3;
                }
                .pulpit-platform {
                    fill: #d4a373;
                    stroke: #bc6c25;
                    stroke-width: 2;
                }
                .bench-group {
                    cursor: ${isEditMode ? 'grab' : 'default'};
                }
                .bench-group:active {
                    cursor: ${isEditMode ? 'grabbing' : 'default'};
                }
                .bench-rect {
                    rx: 6;
                    stroke-width: 2;
                }
                .bench-geral { fill: #3b2214; stroke: #7f8c8d; }
                .bench-louvor { fill: #3b2214; stroke: #e67e22; }
                .bench-criancas { fill: #3b2214; stroke: #00a2ed; }
                .bench-intermediarios { fill: #3b2214; stroke: #00b050; }
                .bench-adolescentes { fill: #3b2214; stroke: #8e44ad; }
                
                .slot {
                    fill: #1c1917;
                    stroke: #b0a8a0;
                    stroke-width: 1.5;
                    stroke-dasharray: 2 2;
                    cursor: ${isEditMode ? 'pointer' : 'default'};
                    transition: fill 0.2s, stroke 0.2s;
                }
                .slot:hover {
                    fill: ${isEditMode ? '#38bdf8' : '#1c1917'};
                    stroke: ${isEditMode ? '#ffffff' : '#b0a8a0'};
                }
                .placed-musician {
                    cursor: ${isEditMode ? 'pointer' : 'default'};
                }
                .free-element {
                    cursor: ${isEditMode ? 'grab' : 'default'};
                }
                .free-element:active {
                    cursor: ${isEditMode ? 'grabbing' : 'default'};
                }
            `}</style>

            <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(- 1)} 
                        className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold">Mapa Palco</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end text-right">
                        {!carregandoValidacao && (
                            <>
                                <span className="text-[11px] font-bold text-slate-300 uppercase truncate max-w-[200px]">
                                    {nomeIgreja}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {userNuvem.trim() && (
                                        <div className="px-1.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors" title="Clique para atualizar/sincronizar">
                                            <Cloud className="w-3 h-3 text-emerald-400" />
                                        </div>
                                    )}
                                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 flex items-center gap-1 text-slate-300">
                                        {isSuper ? (
                                            <Globe className="w-2.5 h-2.5 text-amber-400" />
                                        ) : (
                                            <Shield className="w-2.5 h-2.5 text-indigo-400" />
                                        )}
                                        {isSuper ? "Super Adm" : userRole === "church_admin" ? "Adm Local" : "Membro"}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="canvas-wrapper-outer">
                <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
                    <button className="btn-action btn-mode" onClick={() => setIsEditMode(!isEditMode)}>
                        <Edit3 size={16}/>
                        {isEditMode ? 'Edição' : ''} 
                    </button>

                    {isEditMode && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button className="btn-action" onClick={exportJSON} title="Salvar Projeto">
                                <Save size={16}/>
                            </button>
                            <button className="btn-action" onClick={() => fileInputRef.current.click()} title="Carregar Projeto">
                                <FolderOpen size={16}/>
                            </button>
                            <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} onChange={importJSON} />
                            <button className="btn-action" onClick={exportSVG} title="Exportar como Imagem SVG">
                                <Image size={16}/> 
                            </button>
                            <button className="btn-action btn-danger" onClick={resetLayout} title="Restaurar Padrão">
                                <RotateCcw size={16}/> 
                            </button>
                            <button className="btn-action btn-danger" onClick={clearMap} title="Limpar Mapa">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    )}
                </div>

                <svg id="churchMap" ref={svgRef} xmlns="http://www.w3.org/2000/svg" width="760" height="840" viewBox="0 0 760 840" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} onClick={handleSvgClick}>
                    <defs>
                        <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2" />
                        </filter>
                        <pattern id="brickPattern" width="20" height="10" patternUnits="userSpaceOnUse">
                            <rect width="20" height="10" fill="#8c3d2b"/>
                            <path d="M 0 5 L 20 5 M 10 0 L 10 5 M 0 5 L 0 10 M 20 5 L 20 10" stroke="#5c2619" strokeWidth="1"/>
                        </pattern>
                    </defs>

                    <rect x="40" y="30" width="680" height="780" className="wall" rx="8" />
                    <rect x="44" y="34" width="16" height="772" className="brick-wall" />

                    {[170, 320, 470, 620].map(y => (
                        <React.Fragment key={y}>
                            <rect x="36" y={y} width="12" height="18" className="pillar" />
                            <rect x="712" y={y} width="12" height="18" className="pillar" />
                        </React.Fragment>
                    ))}

                    <rect x="340" y="130" width="80" height="675" fill="#f5f5f0" opacity="0.6" />
                    <line x1="380" y1="130" x2="380" y2="800" stroke="#d4cecb" strokeWidth="2" strokeDasharray="8,8" />
                    <path d="M 230,30 L 230,85 L 530,85 L 530,30 Z" className="pulpit-platform" />

                    <g transform="translate(330, 55)">
                        <path d="M 0,0 C 20,18 80,18 100,0 L 90,-20 C 60,-10 40,-10 10,-20 Z" fill="#5c3a21" stroke="#2a160a" strokeWidth="1.5" />
                        {[ {cx:20, cy:-3}, {cx:35, cy:2}, {cx:50, cy:4}, {cx:65, cy:2}, {cx:80, cy:-3} ].map((p, i) => (
                            <circle key={i} cx={p.cx} cy={p.cy} r="2.5" fill="#e7e5e0" />
                        ))}
                        <text x="50" y="-7" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">PÚLPITO</text>
                    </g>

                    <rect x="335" y="804" width="90" height="12" fill="#e7e5e0" stroke="#3f2314" strokeWidth="2" />

                    <g id="benches-layer">
                        {benches.map(bench => (
                            <g key={bench.id} 
                               className="bench-group"
                               transform={`translate(${bench.x}, ${bench.y}) rotate(${bench.angle}, ${BENCH_WIDTH/2}, ${BENCH_HEIGHT/2})`}
                               onPointerDown={(e) => startDrag(e, bench, 'bench')}
                               onContextMenu={(e) => rotateItem(e, bench.id, 'bench')}
                               onDoubleClick={(e) => doubleClickItem(e, bench.id, 'bench')}>
                                
                                <rect width={BENCH_WIDTH} height={BENCH_HEIGHT} className={`bench-rect bench-${bench.type}`} />
                                
                                {[1, 2, 3, 4].map(slotIndex => {
                                    const cx = (BENCH_WIDTH / 5) * slotIndex;
                                    const cy = BENCH_HEIGHT / 2;
                                    const mus = bench.musicians[slotIndex];
                                    return (
                                        <g key={slotIndex}>
                                            <circle cx={cx} cy={cy} r="8.5" className="slot" onClick={(e) => handleSlotClick(e, bench.id, slotIndex)} />
                                            {mus && ALL_ITEMS[mus] && (
                                                <g className="placed-musician" onClick={(e) => removeMusician(e, bench.id, slotIndex)}>
                                                    <circle cx={cx} cy={cy} r="11.5" fill="#0f172a" stroke={ALL_ITEMS[mus].color} strokeWidth="2"/>
                                                    <g transform={`translate(${cx - 11.5}, ${cy - 11.5}) scale(0.95)`} dangerouslySetInnerHTML={{ __html: ALL_ITEMS[mus].svg }}></g>
                                                </g>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        ))}
                    </g>

                    <g id="free-layer">
                        {freeElements.map(el => (
                            <g key={el.id}
                               className="free-element"
                               transform={`translate(${el.x}, ${el.y}) rotate(${el.angle}, ${el.type === 'BAT' ? 48 : el.type === 'MESA_PROJECAO' ? 76 : el.type === 'PIA' ? 36 : el.type === 'MESA' ? 20 : el.type === 'PC' ? 18 : 11}, ${el.type === 'BAT' ? 48 : el.type === 'MESA_PROJECAO' ? 32 : el.type === 'PIA' ? 12.75 : el.type === 'MESA' ? 12 : el.type === 'PC' ? 14 : 11})`}
                               onPointerDown={(e) => startDrag(e, el, 'free')}
                               onContextMenu={(e) => rotateItem(e, el.id, 'free')}
                               onDoubleClick={(e) => doubleClickItem(e, el.id, 'free')}>
                                {renderFreeElementInner(el.type)}
                            </g>
                        ))}
                    </g>
                </svg>
            </div>

            {isEditMode && (
                <div className="toolbar-tabs-container">
                    <div className="tab-headers">
                        <button className={`tab-btn ${activeTab === 'bancos' ? 'active' : ''}`} onClick={() => setActiveTab('bancos')}>
                            <Layout size={16}/> 
                        </button>
                        <button className={`tab-btn ${activeTab === 'vozes' ? 'active' : ''}`} onClick={() => setActiveTab('vozes')}>
                            <Mic size={16}/>
                        </button>
                        <button className={`tab-btn ${activeTab === 'instrumentos' ? 'active' : ''}`} onClick={() => setActiveTab('instrumentos')}>
                            <Music size={16}/> 
                        </button>
                        <button className={`tab-btn ${activeTab === 'equipamentos' ? 'active' : ''}`} onClick={() => setActiveTab('equipamentos')}>
                            <Volume2 size={16}/> 
                        </button>
                    </div>

                    {activeTab === 'bancos' && (
                        <div className="tab-content">
                            <span className="sub-group-title">Bancos:</span>
                            {['geral', 'louvor', 'criancas', 'intermediarios', 'adolescentes'].map(tipo => (
                                <button key={tipo} 
                                    className={`btn-banco ${selectedToolKey === `BENCH_${tipo}` ? 'selected' : ''}`} 
                                    onClick={() => setSelectedToolKey(prev => prev === `BENCH_${tipo}` ? null : `BENCH_${tipo}`)}>
                                    <span className="color-dot" style={{ 
                                        background: tipo === 'geral' ? '#7f8c8d' : tipo === 'louvor' ? '#e67e22' : tipo === 'criancas' ? '#00a2ed' : tipo === 'intermediarios' ? '#00b050' : '#8e44ad' 
                                    }}></span> {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                </button>
                            ))}
                            <div className="v-divider"></div>
                            <span className="sub-group-title">Cabines:</span>
                            <button className={`btn-banco ${selectedToolKey === 'MESA_PROJECAO' ? 'selected' : ''}`} onClick={() => setSelectedToolKey(prev => prev === 'MESA_PROJECAO' ? null : 'MESA_PROJECAO')}>
                                <Sliders size={15}/> Som & Projeção
                            </button>
                            <button className={`btn-banco ${selectedToolKey === 'MESA' ? 'selected' : ''}`} onClick={() => setSelectedToolKey(prev => prev === 'MESA' ? null : 'MESA')}>
                                <Sliders size={15}/> Som
                            </button>
                            <button className={`btn-banco ${selectedToolKey === 'PC' ? 'selected' : ''}`} onClick={() => setSelectedToolKey(prev => prev === 'PC' ? null : 'PC')}>
                                <Monitor size={15}/> Projeção
                            </button>
                        </div>
                    )}

                    {activeTab === 'vozes' && (
                        <div className="tab-content">
                            <span className="sub-group-title">Vozes & Regência:</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {VOICES_KEYS.map(key => <CardItem itemKey={key} key={key}/>)}
                            </div>
                        </div>
                    )}

                    {activeTab === 'instrumentos' && (
                        <div className="tab-content">
                            <div style={{ display: 'flex', gap: '6px' }}>{BASE.map(key => <CardItem itemKey={key} key={key}/>)}</div>
                            <div className="v-divider"></div>
                            <div style={{ display: 'flex', gap: '6px' }}>{STRINGS_KEYS.map(key => <CardItem itemKey={key} key={key}/>)}</div>
                            <div className="v-divider"></div>
                            <div style={{ display: 'flex', gap: '6px' }}>{WINDS_KEYS.map(key => <CardItem itemKey={key} key={key}/>)}</div>
                            <div className="v-divider"></div>
                            <div style={{ display: 'flex', gap: '6px' }}>{BRASS.map(key => <CardItem itemKey={key} key={key}/>)}</div>
                        </div>
                    )}

                    {activeTab === 'equipamentos' && (
                        <div className="tab-content">
                            <span className="sub-group-title">Periféricos:</span>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {EQUIPMENT_KEYS.map(key => <CardItem itemKey={key} key={key}/>)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isEditMode && (
                <div className="instructions-hint">
                    <HelpCircle size={16}/>
                    <span>Clique no item desejado e <strong>clique no mapa</strong> para inserir. Clique com o <strong>botão direito</strong> para girar (90°) e duplo-clique para remover.</span>
                </div>
            )}
        </div>
    );
}