import React, { useState } from 'react';

export default function RegistroDons() {
  const [activeCategory, setActiveCategory] = useState('sonho');
  const [customCategory, setCustomCategory] = useState('');
  const [church, setChurch] = useState('');
  const [includeDate, setIncludeDate] = useState(true);
  const [date, setDate] = useState('');
  const [justifyText, setJustifyText] = useState(false);
  const [verticalImage, setVerticalImage] = useState(false);
  const [fontSize, setFontSize] = useState(24);
  const [content, setContent] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const handleFontMinus = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const handleFontPlus = () => {
    if (fontSize < 48) setFontSize(fontSize + 2);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 pb-12 px-4 font-['Inter',sans-serif] text-[#1e293b]">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 uppercase tracking-tight">Registro de Dons</h1>

      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 md:p-8 space-y-6 border border-slate-100">
        
        {/* Botões de Categoria */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button 
            type="button"
            onClick={() => setActiveCategory('sonho')}
            className={`py-3 px-4 rounded-xl font-bold text-xs border uppercase text-center transition-all ${
              activeCategory === 'sonho' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Sonho
          </button>
          <button 
            type="button"
            onClick={() => setActiveCategory('visao')}
            className={`py-3 px-4 rounded-xl font-bold text-xs border uppercase text-center transition-all ${
              activeCategory === 'visao' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Visão
          </button>
          <button 
            type="button"
            onClick={() => setActiveCategory('revelacao')}
            className={`py-3 px-4 rounded-xl font-bold text-xs border uppercase text-center transition-all ${
              activeCategory === 'revelacao' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Revelação
          </button>
          <button 
            type="button"
            onClick={() => setActiveCategory('outros')}
            className={`py-3 px-4 rounded-xl font-bold text-xs border uppercase text-center transition-all ${
              activeCategory === 'outros' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Outros
          </button>
        </div>

        {/* Input de Categoria Personalizada */}
        <div className={`mt-2 mb-2 ${activeCategory === 'outros' ? '' : 'hidden'}`}>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Digite aqui o Título</label>
          <input 
            type="text" 
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Ex: Palavra, Escala, Anotações..." 
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-400 text-sm uppercase"
          />
        </div>

        <div className="space-y-4 pt-2">
          
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nome da Igreja (opcional):</label>
            <input 
              type="text" 
              value={church}
              onChange={(e) => setChurch(e.target.value)}
              placeholder="Ex: Planalto Linhares" 
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="gift-include-date" 
              checked={includeDate}
              onChange={(e) => setIncludeDate(e.target.checked)}
              className="w-4 h-4 accent-slate-900 rounded cursor-pointer" 
            />
            <label className="text-xs font-semibold text-slate-700 cursor-pointer" htmlFor="gift-include-date">
              Incluir data na imagem
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Escolher data:</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-400 text-sm uppercase"
            />
          </div>

          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="gift-justify-text" 
                checked={justifyText}
                onChange={(e) => setJustifyText(e.target.checked)}
                className="w-4 h-4 border-slate-300 rounded cursor-pointer accent-slate-900" 
              />
              <i className="fas fa-align-justify text-slate-600 text-sm"></i>
              <label className="text-xs font-semibold text-slate-700 cursor-pointer" htmlFor="gift-justify-text">
                Texto justificado
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="gift-vertical-image" 
                checked={verticalImage}
                onChange={(e) => setVerticalImage(e.target.checked)}
                className="w-4 h-4 border-slate-300 rounded cursor-pointer accent-slate-900" 
              />
              <label className="text-xs font-semibold text-slate-700 cursor-pointer" htmlFor="gift-vertical-image">
                Imagem vertical (melhor para celular)
              </label>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-2">
            <label className="text-xs font-semibold text-slate-700">Tamanho da fonte:</label>
            <button 
              type="button"
              onClick={handleFontMinus}
              className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors"
            >
              <i className="fas fa-minus text-[10px]"></i>
            </button>
            <span className="text-xs font-bold text-slate-900">{fontSize}px</span>
            <button 
              type="button"
              onClick={handleFontPlus}
              className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors"
            >
              <i className="fas fa-plus text-[10px]"></i>
            </button>
          </div>

          <div className="relative">
            <textarea 
              rows="6"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui ou use o microfone para ditar..." 
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-3 pr-12 outline-none focus:ring-2 focus:ring-slate-400 text-sm resize-none"
            ></textarea>
            
            <button 
              type="button"
              title="Ditar dom por voz"
              className="absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <i className="fas fa-microphone"></i>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <button 
            type="button"
            onClick={() => setIsPreviewVisible(true)}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <i className="fas fa-image"></i> Gerar Imagem
          </button>
          
          <a 
            href="/culto" 
            className="w-full bg-white text-slate-700 font-semibold py-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-arrow-left"></i> Voltar
          </a>
        </div>
      </div> 

      <div className={`w-full max-w-2xl mt-6 bg-white rounded-2xl shadow-xl p-6 border border-slate-200 ${isPreviewVisible ? '' : 'hidden'}`}>
        <h3 className="text-slate-900 font-bold text-lg mb-4 text-center uppercase tracking-wide">Visualização do Cartaz</h3>
        <div className="bg-slate-50 p-2 rounded-xl flex justify-center mb-6 border border-slate-200">
          <img src={previewImage || undefined} alt="Preview Cartaz" className="max-w-full h-auto shadow-sm rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button type="button" className="flex-1 bg-[#25d366] text-white font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
            <i className="fab fa-whatsapp text-xl"></i> Compartilhar
          </button>
          <button type="button" className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            <i className="fas fa-download text-xl"></i> Baixar
          </button>
        </div>
      </div> 
    </div>
  );
}