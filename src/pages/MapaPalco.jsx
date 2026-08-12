import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function TempleMap() {
    const canvasContainerRef = useRef(null);
    const [layoutName, setLayoutName] = useState('Padrão 1');
    const [viewMode, setViewMode] = useState('3d');
    const [isEditMode, setIsEditMode] = useState(true);
    const [activeSector, setActiveSector] = useState('Grupo de Louvor');
    const [activeSectorColor, setActiveSectorColor] = useState('#3b82f6');
    const [currentState, setCurrentState] = useState({ row: 4, count: 3, seats: 8 });
    const [supportThickness, setSupportThickness] = useState(0.08);
    const [totalBenches, setTotalBenches] = useState(0);
    const [totalSeats, setTotalSeats] = useState(0);
    const [zoomText, setZoomText] = useState('100%');
    
    const [selectedBenchIndex, setSelectedBenchIndex] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomPiece, setSelectedCustomPiece] = useState('all');

    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const objectsRef = useRef([]);

    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;

        const width = container.clientWidth || container.offsetWidth || 800;
        const height = container.clientHeight || container.offsetHeight || 600;

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f5f9);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
        camera.position.set(0, viewMode === '2d' ? 32 : 22, viewMode === '2d' ? 0.1 : 24);
        if (viewMode === '2d') camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 25, 15);
        scene.add(dirLight);

        const grid = new THREE.GridHelper(36, 18, 0xcbd5e1, 0xe2e8f0);
        scene.add(grid);

        // --- PÚLPITO CILÍNDRICO ---
        const pulpitGroup = new THREE.Group();
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x6e472e });
        const darkWoodMat = new THREE.MeshLambertMaterial({ color: 0x4a2e18 });

        const pulpitBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.3, 32), darkWoodMat);
        pulpitBase.position.y = 0.15;
        pulpitGroup.add(pulpitBase);

        const pulpitBody = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 1.6, 32), woodMat);
        pulpitBody.position.y = 1.0;
        pulpitGroup.add(pulpitBody);

        const pulpitTop = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.2, 32), darkWoodMat);
        pulpitTop.position.set(0, 1.9, 0);
        pulpitGroup.add(pulpitTop);

        pulpitGroup.position.set(0, 0, -12);
        scene.add(pulpitGroup);

        // --- BANCO COMPLETO COM RIPAS FINAS DE SUSTENTAÇÃO ---
        const newObjects = [];
        const createBench = (x, z) => {
            const group = new THREE.Group();
            
            const benchWoodMat = new THREE.MeshLambertMaterial({ color: 0x7a4f32 });
            const sidePanelMat = new THREE.MeshLambertMaterial({ color: 0x4a2e18 });
            const detailMat = new THREE.MeshLambertMaterial({ color: 0x3d2412 });
            const supportMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });

            // 1. Assento Principal
            const seat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 1.1), benchWoodMat);
            seat.position.y = 0.6;
            group.add(seat);

            // 2. Madeiras de Sustentação Finas
            const supportLeft = new THREE.Mesh(new THREE.BoxGeometry(supportThickness, 0.12, 1.0), supportMat);
            supportLeft.position.set(-1.2, 0.48, 0);
            group.add(supportLeft);

            const supportRight = new THREE.Mesh(new THREE.BoxGeometry(supportThickness, 0.12, 1.0), supportMat);
            supportRight.position.set(1.2, 0.48, 0);
            group.add(supportRight);

            // 3. Encosto
            const back = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.2), benchWoodMat);
            back.position.set(0, 1.15, 0.45);
            back.rotation.x = 0.15;
            group.add(back);

            const notchLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.25), detailMat);
            notchLeft.position.set(-1.0, 1.1, 0.48);
            notchLeft.rotation.z = Math.PI / 4;
            group.add(notchLeft);

            const notchRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.25), detailMat);
            notchRight.position.set(1.0, 1.1, 0.48);
            notchRight.rotation.z = Math.PI / 4;
            group.add(notchRight);

            // Laterais com furos circulares
            const createDetailedLeg = (posX) => {
                const legGroup = new THREE.Group();
                const mainLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 1.3), sidePanelMat);
                mainLeg.position.set(0, 0.65, 0);
                legGroup.add(mainLeg);

                const holeMat = new THREE.MeshLambertMaterial({ color: 0x2b180a });
                const hole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16), holeMat);
                hole1.rotation.x = Math.PI / 2;
                hole1.position.set(posX > 0 ? -0.11 : 0.11, 0.85, 0.2);
                legGroup.add(hole1);

                const hole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16), holeMat);
                hole2.rotation.x = Math.PI / 2;
                hole2.position.set(posX > 0 ? -0.11 : 0.11, 0.55, 0.2);
                legGroup.add(hole2);

                legGroup.position.set(posX, 0, 0);
                return legGroup;
            };

            group.add(createDetailedLeg(-1.8));
            group.add(createDetailedLeg(1.8));

            group.position.set(x, 0, z);
            scene.add(group);
            newObjects.push(group);
            return group;
        };

        if (layoutName === 'Padrão 1') {
            for (let r = -8; r <= 8; r += 3) {
                createBench(-7, r);
                createBench(-3, r);
                createBench(3, r);
                createBench(7, r);
            }
        } else {
            for (let r = -8; r <= 8; r += 3) {
                createBench(-6, r);
                createBench(6, r);
            }
            createBench(0, -2);
            createBench(0, 1);
        }

        objectsRef.current = newObjects;
        setTotalBenches(newObjects.length);
        setTotalSeats(newObjects.length * currentState.seats);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        if (viewMode === '2d') controls.enableRotate = false;
        controlsRef.current = controls;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onCanvasClick = (event) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(objectsRef.current, true);

            if (intersects.length > 0) {
                let clickedGroup = intersects[0].object;
                while (clickedGroup.parent && clickedGroup.parent !== scene) {
                    clickedGroup = clickedGroup.parent;
                }
                const index = objectsRef.current.indexOf(clickedGroup);
                if (index !== -1) {
                    setSelectedBenchIndex(index);
                }
            }
        };

        container.addEventListener('click', onCanvasClick);

        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const w = container.clientWidth || container.offsetWidth;
            const h = container.clientHeight || container.offsetHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            container.removeEventListener('click', onCanvasClick);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
        };
    }, [layoutName, viewMode, supportThickness]);

    const handleAddBench = () => {
        if (!sceneRef.current) return;
        const group = new THREE.Group();
        const benchWoodMat = new THREE.MeshLambertMaterial({ color: 0x7a4f32 });
        const sidePanelMat = new THREE.MeshLambertMaterial({ color: 0x4a2e18 });
        const detailMat = new THREE.MeshLambertMaterial({ color: 0x3d2412 });
        const supportMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });

        const seat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 1.1), benchWoodMat);
        seat.position.y = 0.6;
        group.add(seat);

        const supportLeft = new THREE.Mesh(new THREE.BoxGeometry(supportThickness, 0.12, 1.0), supportMat);
        supportLeft.position.set(-1.2, 0.48, 0);
        group.add(supportLeft);

        const supportRight = new THREE.Mesh(new THREE.BoxGeometry(supportThickness, 0.12, 1.0), supportMat);
        supportRight.position.set(1.2, 0.48, 0);
        group.add(supportRight);

        const back = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.2), benchWoodMat);
        back.position.set(0, 1.15, 0.45);
        back.rotation.x = 0.15;
        group.add(back);

        const notchLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.25), detailMat);
        notchLeft.position.set(-1.0, 1.1, 0.48);
        notchLeft.rotation.z = Math.PI / 4;
        group.add(notchLeft);

        const notchRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.25), detailMat);
        notchRight.position.set(1.0, 1.1, 0.48);
        notchRight.rotation.z = Math.PI / 4;
        group.add(notchRight);

        const createDetailedLeg = (posX) => {
            const legGroup = new THREE.Group();
            const mainLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 1.3), sidePanelMat);
            mainLeg.position.set(0, 0.65, 0);
            legGroup.add(mainLeg);

            const holeMat = new THREE.MeshLambertMaterial({ color: 0x2b180a });
            const hole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16), holeMat);
            hole1.rotation.x = Math.PI / 2;
            hole1.position.set(posX > 0 ? -0.11 : 0.11, 0.85, 0.2);
            legGroup.add(hole1);

            const hole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16), holeMat);
            hole2.rotation.x = Math.PI / 2;
            hole2.position.set(posX > 0 ? -0.11 : 0.11, 0.55, 0.2);
            legGroup.add(hole2);

            legGroup.position.set(posX, 0, 0);
            return legGroup;
        };

        group.add(createDetailedLeg(-1.8));
        group.add(createDetailedLeg(1.8));

        const count = objectsRef.current.length;
        const col = (count % 2 === 0 ? 1 : -1) * (5 + Math.floor(count / 6) * 4);
        const row = (count % 6) * 3 - 8;

        group.position.set(col, 0, row);

        sceneRef.current.add(group);
        objectsRef.current.push(group);

        setTotalBenches(objectsRef.current.length);
        setTotalSeats(objectsRef.current.length * currentState.seats);
        setSelectedBenchIndex(objectsRef.current.length - 1);
    };

    const handleRemoveSelectedBench = () => {
        const indexToRemove = selectedBenchIndex !== null ? selectedBenchIndex : objectsRef.current.length - 1;
        if (objectsRef.current.length > 0 && sceneRef.current && indexToRemove >= 0 && indexToRemove < objectsRef.current.length) {
            const obj = objectsRef.current[indexToRemove];
            sceneRef.current.remove(obj);
            objectsRef.current.splice(indexToRemove, 1);
            setTotalBenches(objectsRef.current.length);
            setTotalSeats(objectsRef.current.length * currentState.seats);
            setSelectedBenchIndex(null);
        }
    };

    const handleMoveSelectedBench = (dx, dz) => {
        if (selectedBenchIndex !== null && objectsRef.current[selectedBenchIndex]) {
            const bench = objectsRef.current[selectedBenchIndex];
            bench.position.x += dx;
            bench.position.z += dz;
        }
    };

    const handleUpdateProp = (prop, delta) => {
        setCurrentState(prev => {
            const updated = Math.max(1, prev[prop] + delta);
            const newState = { ...prev, [prop]: updated };
            if (prop === 'seats') {
                setTotalSeats(totalBenches * updated);
            }
            return newState;
        });
    };

    const handleAdjustZoom = (amount) => {
        if (cameraRef.current) {
            cameraRef.current.zoom = Math.max(0.5, Math.min(2.0, cameraRef.current.zoom + amount));
            cameraRef.current.updateProjectionMatrix();
            setZoomText(`${Math.round(cameraRef.current.zoom * 100)}%`);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col select-none overflow-hidden bg-[#0f172a] text-[#f1f5f9]">
            <style dangerouslySetInnerHTML={{__html: `
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: #1e293b; }
                ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}} />

            {/* CABEÇALHO */}
            <header className="h-[60px] bg-[#1e293b] border-b border-[#334155] flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md">🎵</div>
                    <span className="font-bold text-lg tracking-wide">ICMlyrics</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 font-medium">Mapa do Templo</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{layoutName}</span>
                        <select 
                            value={layoutName} 
                            onChange={(e) => setLayoutName(e.target.value)} 
                            className="bg-transparent text-xs text-blue-400 font-medium cursor-pointer outline-none"
                        >
                            <option value="Padrão 1" className="bg-[#1e293b]">Padrão 1</option>
                            <option value="Padrão 2" className="bg-[#1e293b]">Padrão 2</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsEditMode(true)} 
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${isEditMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-[#334155] text-slate-300 hover:bg-[#475569]'}`}
                    >
                        ✏️ Editar
                    </button>
                    <button 
                        onClick={() => setIsEditMode(false)} 
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${!isEditMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-[#334155] text-slate-300 hover:bg-[#475569]'}`}
                    >
                        👁️ Visualizar
                    </button>
                </div>
            </header>

            {/* CORPO PRINCIPAL */}
            <div className="grid grid-cols-[260px_1fr_300px] flex-1 overflow-hidden relative">
                
                {/* MENU LATERAL ESQUERDO */}
                <aside className="bg-[#1e293b] border-r border-[#334155] p-4 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">LAYOUTS</h3>
                        <div className="flex flex-col gap-1.5">
                            <button 
                                onClick={() => setLayoutName('Padrão 1')} 
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${layoutName === 'Padrão 1' ? 'bg-blue-600 text-white shadow-md' : 'bg-[#0f172a] text-slate-300 hover:bg-[#334155]'}`}
                            >
                                📐 Padrão 1
                            </button>
                            <button 
                                onClick={() => setLayoutName('Padrão 2')} 
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${layoutName === 'Padrão 2' ? 'bg-blue-600 text-white shadow-md' : 'bg-[#0f172a] text-slate-300 hover:bg-[#334155]'}`}
                            >
                                📐 Padrão 2
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">SETORES</h3>
                        <div className="flex flex-col gap-1.5">
                            {[
                                { name: 'Instrumentistas', color: '#8b5cf6', dot: 'bg-purple-500' },
                                { name: 'Grupo de Louvor', color: '#3b82f6', dot: 'bg-blue-500' },
                                { name: 'Crianças', color: '#22c55e', dot: 'bg-emerald-500' },
                                { name: 'Intermediários', color: '#f59e0b', dot: 'bg-amber-500' },
                                { name: 'Adolescentes', color: '#ef4444', dot: 'bg-rose-500' },
                                { name: 'Obreiros', color: '#64748b', dot: 'bg-slate-500' },
                                { name: 'Púlpito', color: '#78350f', dot: 'bg-amber-900' },
                            ].map((sector) => (
                                <button 
                                    key={sector.name}
                                    onClick={() => {
                                        setActiveSector(sector.name);
                                        setActiveSectorColor(sector.color);
                                    }} 
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium border transition ${activeSector === sector.name ? 'border-blue-500 bg-[#0f172a] text-slate-200' : 'border-[#334155] bg-[#0f172a] text-slate-300 hover:border-slate-500'}`}
                                >
                                    <span className={`w-3 h-3 rounded-full ${sector.dot}`}></span>
                                    <span className="truncate">{sector.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">FERRAMENTAS</h3>
                        <div className="flex flex-col gap-1.5">
                            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition shadow-md">🛠️ Oficina de Peças</button>
                            <button onClick={handleAddBench} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-[#0f172a] text-slate-300 hover:bg-[#334155] transition">➕ Adicionar Banco</button>
                            <button onClick={handleRemoveSelectedBench} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-[#0f172a] text-slate-300 hover:bg-[#334155] transition">🗑️ Remover Banco</button>
                        </div>
                    </div>
                </aside>

                {/* ÁREA CENTRAL DO MAPA */}
                <main className="relative bg-[#2d3748] flex flex-col">
                    <div ref={canvasContainerRef} className="w-full flex-1 cursor-grab active:cursor-grabbing"></div>

                    {/* BARRA INFERIOR FLUTUANTE */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1e293b]/90 backdrop-blur border border-[#334155] px-4 py-2 rounded-xl flex items-center gap-6 shadow-xl z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium mr-2">Visualização</span>
                            <button 
                                onClick={() => setViewMode('2d')} 
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${viewMode === '2d' ? 'bg-blue-600 text-white' : 'bg-[#0f172a] text-slate-400'}`}
                            >
                                2D
                            </button>
                            <button 
                                onClick={() => setViewMode('3d')} 
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${viewMode === '3d' ? 'bg-blue-600 text-white' : 'bg-[#0f172a] text-slate-400'}`}
                            >
                                3D
                            </button>
                        </div>
                        <div className="w-[1px] h-5 bg-[#334155]"></div>
                        <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                            <span>Zoom</span>
                            <button onClick={() => handleAdjustZoom(-0.1)} className="w-6 h-6 bg-[#0f172a] rounded flex items-center justify-center">-</button>
                            <button onClick={() => handleAdjustZoom(0.1)} className="w-6 h-6 bg-[#0f172a] rounded flex items-center justify-center">+</button>
                            <span>{zoomText}</span>
                        </div>
                    </div>
                </main>

                {/* PAINEL LATERAL DIREITO */}
                <aside className="bg-[#1e293b] border-l border-[#334155] p-4 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4">DETALHES DO SELECIONADO</h3>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Banco Selecionado</label>
                                <div className="bg-[#0f172a] border border-[#334155] p-2.5 rounded-lg text-sm font-medium text-slate-200">
                                    {selectedBenchIndex !== null ? `Banco #${selectedBenchIndex + 1}` : 'Nenhum (Clique em um banco)'}
                                </div>
                            </div>

                            {selectedBenchIndex !== null && (
                                <div className="flex flex-col gap-2 bg-[#0f172a]/50 p-3 rounded-lg border border-[#334155]">
                                    <span className="text-xs text-slate-400 font-semibold">Mover Banco no Mapa</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => handleMoveSelectedBench(0, -1)} className="bg-[#1e293b] py-1.5 rounded text-xs hover:bg-[#334155]">⬆️ Frente</button>
                                        <button onClick={() => handleMoveSelectedBench(0, 1)} className="bg-[#1e293b] py-1.5 rounded text-xs hover:bg-[#334155]">⬇️ Trás</button>
                                        <button onClick={() => handleMoveSelectedBench(-1, 0)} className="bg-[#1e293b] py-1.5 rounded text-xs hover:bg-[#334155]">⬅️ Esquerda</button>
                                        <button onClick={() => handleMoveSelectedBench(1, 0)} className="bg-[#1e293b] py-1.5 rounded text-xs hover:bg-[#334155]">➡️ Direita</button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Espessura Sustentação (Ripas Finas)</label>
                                <div className="flex items-center justify-between bg-[#0f172a] border border-[#334155] px-3 py-2 rounded-lg">
                                    <span className="text-sm font-medium">{Math.round(supportThickness * 100)} cm</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSupportThickness(prev => Math.max(0.04, prev - 0.02))} className="w-6 h-6 bg-[#1e293b] rounded flex items-center justify-center text-slate-300">-</button>
                                        <button onClick={() => setSupportThickness(prev => Math.min(0.2, prev + 0.02))} className="w-6 h-6 bg-[#1e293b] rounded flex items-center justify-center text-slate-300">+</button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Lugares por banco</label>
                                <div className="flex items-center justify-between bg-[#0f172a] border border-[#334155] px-3 py-2 rounded-lg">
                                    <span className="text-sm font-medium">{currentState.seats}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateProp('seats', -1)} className="w-6 h-6 bg-[#1e293b] rounded flex items-center justify-center text-slate-300">-</button>
                                        <button onClick={() => handleUpdateProp('seats', 1)} className="w-6 h-6 bg-[#1e293b] rounded flex items-center justify-center text-slate-300">+</button>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleRemoveSelectedBench} className="w-full bg-rose-950/60 border border-rose-800 text-rose-300 font-medium py-2.5 rounded-lg text-sm hover:bg-rose-900/60 transition mt-2">
                                Excluir Banco Selecionado
                            </button>
                        </div>
                    </div>

                    <hr className="border-[#334155]" />

                    <div>
                        <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">INFORMAÇÕES GERAIS</h3>
                        <div className="flex flex-col gap-2.5 text-sm">
                            <div className="flex justify-between text-slate-300">
                                <span className="text-slate-400">Layout atual</span>
                                <span className="font-medium">{layoutName}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span className="text-slate-400">Total de bancos</span>
                                <span className="font-medium">{totalBenches}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span className="text-slate-400">Lugares totais</span>
                                <span className="font-medium">{totalSeats}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MODAL DE OFICINA DE PEÇAS CORRIGIDO (ENTRALHES PARA DENTRO E FUROS PRÓXIMOS) */}
                {isModalOpen && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#1e293b] border border-[#334155] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#334155] flex items-center justify-between bg-[#111827]">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🛠️</span>
                                    <h2 className="font-bold text-base text-slate-100">Oficina de Peças do Banco (Projeto Templo)</h2>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white font-bold px-2 py-1 rounded">✕</button>
                            </div>

                            <div className="p-6 overflow-y-auto flex flex-col gap-6">
                                <p className="text-sm text-slate-300">
                                    Peças corrigidas com entalhes em V cortando para dentro da madeira e furações duplas posicionadas perfeitamente rentes ao entalhe.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Peça 1: Encosto */}
                                    <div onClick={() => setSelectedCustomPiece('back')} className={`p-4 rounded-xl border cursor-pointer transition ${selectedCustomPiece === 'back' ? 'border-blue-500 bg-[#0f172a]' : 'border-[#334155] bg-[#0f172a]/60 hover:border-slate-500'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm text-slate-200">1. Encosto com Recortes V</span>
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Principal</span>
                                        </div>
                                        <div className="h-16 bg-[#111827] rounded flex items-center justify-center border border-[#334155] px-3">
                                            <svg viewBox="0 0 300 50" className="w-full h-8">
                                                <path d="M 5 15 L 90 15 L 105 5 L 120 15 L 180 15 L 195 5 L 210 15 L 295 15 L 295 35 L 5 35 Z" fill="#9a5a36" stroke="#4a2e18" strokeWidth="2"/>
                                            </svg>
                                        </div>
                                        <span className="text-xs text-slate-400 mt-2 block">Tábua superior com entalhes em V voltados para dentro.</span>
                                    </div>

                                    {/* Peça 2: Assento */}
                                    <div onClick={() => setSelectedCustomPiece('seat')} className={`p-4 rounded-xl border cursor-pointer transition ${selectedCustomPiece === 'seat' ? 'border-blue-500 bg-[#0f172a]' : 'border-[#334155] bg-[#0f172a]/60 hover:border-slate-500'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm text-slate-200">2. Assento do Banco</span>
                                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Retangular</span>
                                        </div>
                                        <div className="h-16 bg-[#111827] rounded flex items-center justify-center border border-[#334155] px-3">
                                            <svg viewBox="0 0 300 50" className="w-full h-8">
                                                <rect x="5" y="10" width="290" height="30" rx="3" fill="#8a4f32" stroke="#4a2e18" strokeWidth="2"/>
                                            </svg>
                                        </div>
                                        <span className="text-xs text-slate-400 mt-2 block">Prancha sólida do assento.</span>
                                    </div>

                                    {/* Peça 3.1: Lateral V Duplo + Furos Próximos */}
                                    <div onClick={() => setSelectedCustomPiece('lat_double')} className={`p-4 rounded-xl border cursor-pointer transition ${selectedCustomPiece === 'lat_double' ? 'border-blue-500 bg-[#0f172a]' : 'border-[#334155] bg-[#0f172a]/60 hover:border-slate-500'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm text-slate-200">3.1 Lateral com V Duplo + Furos</span>
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Lateral Púlpito</span>
                                        </div>
                                        <div className="h-24 bg-[#111827] rounded flex items-center justify-center border border-[#334155]">
                                            <svg viewBox="0 0 100 160" className="w-10 h-20">
                                                {/* Entalhe V cortando para dentro em ambos os lados e furos encostados */}
                                                <path d="M 35 5 L 65 5 L 65 72 L 55 80 L 65 88 L 65 155 L 35 155 L 35 88 L 45 80 L 35 72 Z" fill="#7a4f32" stroke="#3d2412" strokeWidth="2"/>
                                                <circle cx="50" cy="58" r="7" fill="#2b180a"/>
                                                <circle cx="50" cy="102" r="7" fill="#2b180a"/>
                                            </svg>
                                        </div>
                                        <span className="text-xs text-slate-400 mt-2 block">V duplo interno com furos centrais colados nas pontas do entalhe.</span>
                                    </div>

                                    {/* Peça 3.2: Lateral V Direito + Furos Próximos */}
                                    <div onClick={() => setSelectedCustomPiece('lat_right')} className={`p-4 rounded-xl border cursor-pointer transition ${selectedCustomPiece === 'lat_right' ? 'border-blue-500 bg-[#0f172a]' : 'border-[#334155] bg-[#0f172a]/60 hover:border-slate-500'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm text-slate-200">3.2 Lateral com V Direito + Furos</span>
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Lateral Púlpito</span>
                                        </div>
                                        <div className="h-24 bg-[#111827] rounded flex items-center justify-center border border-[#334155]">
                                            <svg viewBox="0 0 100 160" className="w-10 h-20">
                                                <path d="M 35 5 L 65 5 L 65 72 L 55 80 L 65 88 L 65 155 L 35 155 Z" fill="#7a4f32" stroke="#3d2412" strokeWidth="2"/>
                                                <circle cx="50" cy="58" r="7" fill="#2b180a"/>
                                                <circle cx="50" cy="102" r="7" fill="#2b180a"/>
                                            </svg>
                                        </div>
                                        <span className="text-xs text-slate-400 mt-2 block">V interno apenas à direita com furos centralizados e próximos.</span>
                                    </div>

                                    {/* Peça 3.3: Lateral V Esquerdo + Furos Próximos */}
                                    <div onClick={() => setSelectedCustomPiece('lat_left')} className={`p-4 rounded-xl border cursor-pointer transition ${selectedCustomPiece === 'lat_left' ? 'border-blue-500 bg-[#0f172a]' : 'border-[#334155] bg-[#0f172a]/60 hover:border-slate-500'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm text-slate-200">3.3 Lateral com V Esquerdo + Furos</span>
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Lateral Púlpito</span>
                                        </div>
                                        <div className="h-24 bg-[#111827] rounded flex items-center justify-center border border-[#334155]">
                                            <svg viewBox="0 0 100 160" className="w-10 h-20">
                                                <path d="M 35 5 L 65 5 L 65 155 L 35 155 L 35 88 L 45 80 L 35 72 Z" fill="#7a4f32" stroke="#3d2412" strokeWidth="2"/>
                                                <circle cx="50" cy="58" r="7" fill="#2b180a"/>
                                                <circle cx="50" cy="102" r="7" fill="#2b180a"/>
                                            </svg>
                                        </div>
                                        <span className="text-xs text-slate-400 mt-2 block">V interno apenas à esquerda com furos centralizados e próximos.</span>
                                    </div>

                                    {/* Peça 4: Painel de Fechamento Base */}
                                    <div onClick={() => setSelectedCustomPiece('panel')} className={`p-4 rounded-xl border cursor-pointer transition ${selectedCustomPiece === 'panel' ? 'border-blue-500 bg-[#0f172a]' : 'border-[#334155] bg-[#0f172a]/60 hover:border-slate-500'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm text-slate-200">4. Painel de Fechamento Base</span>
                                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Estrutural</span>
                                        </div>
                                        <div className="h-24 bg-[#111827] rounded flex items-center justify-center border border-[#334155]">
                                            <div className="w-8 h-16 bg-amber-950 rounded"></div>
                                        </div>
                                        <span className="text-xs text-slate-400 mt-2 block">Painel frontal ou estrutural inferior de suporte.</span>
                                    </div>

                                    {/* Peça 5: Madeiras de Sustentação Finas */}
                                    <div onClick={() => setSelectedCustomPiece('supports')} className={`p-4 rounded-xl border cursor-pointer transition md:col-span-2 ${selectedCustomPiece === 'supports' ? 'border-blue-500 bg-[#0f172a]' : 'border-[#334155] bg-[#0f172a]/60 hover:border-slate-500'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm text-slate-200">5. Madeiras de Sustentação Finas (Ripas de Reforço)</span>
                                            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">Sustentação</span>
                                        </div>
                                        <div className="h-20 bg-[#111827] rounded flex items-center justify-center gap-12 border border-[#334155]">
                                            <div className="w-2.5 h-12 bg-amber-800 rounded"></div>
                                            <div className="w-2.5 h-12 bg-amber-800 rounded"></div>
                                        </div>
                                        <span className="text-xs text-slate-400 mt-2 block">Ripagem inferior de suporte ao assento.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-[#334155] bg-[#111827] flex justify-between items-center">
                                <span className="text-xs text-slate-400">Peças com entalhes internos e furação ajustada.</span>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-[#334155] hover:bg-[#475569] rounded-lg text-sm font-medium transition">Fechar</button>
                                    <button onClick={() => { handleAddBench(); setIsModalOpen(false); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-500/20">Montar e Adicionar Banco ao Templo</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}