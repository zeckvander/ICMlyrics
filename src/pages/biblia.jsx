import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Menu, Loader2, BookOpen, Search, Star, Trash2, 
  ExternalLink, Type, MessageSquare, Share2, Save, HelpCircle, Check 
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import DrawerMenu from "@/components/louvores/DrawerMenu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LIVROS_MAPA = {
  'AT': [
    { abbrev: 'gn', nome: 'Gênesis', caps: 50, versiculosPorCap: { 1:31, 2:25, 3:24, 4:26, 5:32, 6:22, 7:24, 8:22, 9:29, 10:32, 11:32, 12:20, 13:18, 14:24, 15:21, 16:16, 17:27, 18:33, 19:38, 20:18, 21:34, 22:24, 23:20, 24:67, 25:34, 26:35, 27:46, 28:22, 29:35, 30:43, 31:55, 32:32, 33:20, 34:31, 35:29, 36:43, 37:36, 38:30, 39:23, 40:23, 41:57, 42:38, 43:34, 44:34, 45:28, 46:34, 47:31, 48:22, 49:33, 50:26 } },
    { abbrev: 'ex', nome: 'Êxodo', caps: 40, versiculosPorCap: { 1:22, 2:25, 3:22, 4:31, 5:23, 6:30, 7:25, 8:32, 9:35, 10:29, 11:10, 12:51, 13:22, 14:31, 15:27, 16:36, 17:16, 18:27, 19:25, 20:26, 21:36, 22:31, 23:33, 24:18, 25:40, 26:37, 27:21, 28:43, 29:46, 30:38, 31:18, 32:35, 33:23, 34:35, 35:35, 36:38, 37:29, 38:31, 39:43, 40:38 } },
    { abbrev: 'lv', nome: 'Levítico', caps: 27, versiculosPorCap: { 1:17, 2:16, 3:17, 4:35, 5:19, 6:30, 7:38, 8:36, 9:24, 10:20, 11:47, 12:8, 13:59, 14:57, 15:33, 16:34, 17:16, 18:30, 19:37, 20:27, 21:24, 22:33, 23:44, 24:23, 25:55, 26:46, 27:34 } },
    { abbrev: 'nm', nome: 'Números', caps: 36, versiculosPorCap: { 1:54, 2:34, 3:51, 4:49, 5:31, 6:27, 7:89, 8:26, 9:23, 10:36, 11:35, 12:16, 13:33, 14:45, 15:41, 16:50, 17:13, 18:32, 19:22, 20:29, 21:35, 22:41, 23:30, 24:25, 25:18, 26:65, 27:23, 28:31, 29:40, 30:16, 31:54, 32:42, 33:56, 34:29, 35:34, 36:13 } },
    { abbrev: 'dt', nome: 'Deuteronômio', caps: 34, versiculosPorCap: { 1:46, 2:37, 3:29, 4:49, 5:33, 6:25, 7:26, 8:20, 9:29, 10:22, 11:32, 12:32, 13:18, 14:29, 15:23, 16:22, 17:20, 18:22, 19:21, 20:20, 21:23, 22:30, 23:25, 24:22, 25:19, 26:19, 27:26, 28:68, 29:29, 30:20, 31:30, 32:52, 33:29, 34:12 } },
    { abbrev: 'js', nome: 'Josué', caps: 24, versiculosPorCap: { 1:18, 2:24, 3:17, 4:24, 5:15, 6:27, 7:26, 8:35, 9:27, 10:43, 11:23, 12:24, 13:33, 14:15, 15:63, 16:10, 17:18, 18:28, 19:51, 20:9, 21:45, 22:34, 23:16, 24:33 } },
    { abbrev: 'jz', nome: 'Juízes', caps: 21, versiculosPorCap: { 1:36, 2:23, 3:31, 4:24, 5:31, 6:40, 7:25, 8:35, 9:57, 10:18, 11:40, 12:15, 13:25, 14:20, 15:20, 16:31, 17:13, 18:31, 19:30, 20:48, 21:25 } },
    { abbrev: 'rt', nome: 'Rute', caps: 4, versiculosPorCap: { 1:22, 2:23, 3:18, 4:22 } },
    { abbrev: '1sm', nome: '1 Sam.', caps: 31, versiculosPorCap: { 1:28, 2:36, 3:21, 4:22, 5:12, 6:21, 7:17, 8:22, 9:27, 10:27, 11:15, 12:25, 13:23, 14:52, 15:35, 16:23, 17:58, 18:30, 19:24, 20:42, 21:15, 22:23, 23:29, 24:22, 25:44, 26:25, 27:12, 28:25, 29:11, 30:31, 31:13 } },
    { abbrev: '2sm', nome: '2 Sam.', caps: 24, versiculosPorCap: { 1:27, 2:32, 3:39, 4:12, 5:25, 6:23, 7:29, 8:18, 9:13, 10:19, 11:27, 12:31, 13:39, 14:33, 15:37, 16:23, 17:29, 18:33, 19:43, 20:26, 21:22, 22:51, 23:39, 24:25 } },
    { abbrev: '1rs', nome: '1 Reis', caps: 22, versiculosPorCap: { 1:53, 2:46, 3:28, 4:34, 5:18, 6:38, 7:51, 8:66, 9:28, 10:29, 11:43, 12:33, 13:34, 14:31, 15:34, 16:34, 17:24, 18:46, 19:21, 20:43, 21:29, 22:53 } },
    { abbrev: '2rs', nome: '2 Reis', caps: 25, versiculosPorCap: { 1:18, 2:25, 3:27, 4:44, 5:27, 6:33, 7:20, 8:29, 9:37, 10:36, 11:21, 12:21, 13:25, 14:29, 15:38, 16:20, 17:41, 18:37, 19:37, 20:21, 21:26, 22:20, 23:37, 24:20, 25:30 } },
    { abbrev: '1cr', nome: '1 Crôn.', caps: 29, versiculosPorCap: { 1:54, 2:55, 3:24, 4:43, 5:26, 6:81, 7:40, 8:40, 9:44, 10:14, 11:47, 12:40, 13:14, 14:17, 15:29, 16:43, 17:27, 18:17, 19:19, 20:8, 21:30, 22:19, 23:32, 24:31, 25:31, 26:32, 27:34, 28:21, 29:30 } },
    { abbrev: '2cr', nome: '2 Crôn.', caps: 36, versiculosPorCap: { 1:17, 2:18, 3:17, 4:22, 5:14, 6:42, 7:22, 8:18, 9:31, 10:19, 11:23, 12:16, 13:22, 14:15, 15:19, 16:14, 17:19, 18:34, 19:11, 20:37, 21:20, 22:12, 23:21, 24:27, 25:28, 26:23, 27:9, 28:27, 29:36, 30:27, 31:21, 32:33, 33:25, 34:33, 35:27, 36:23 } },
    { abbrev: 'ed', nome: 'Esdras', caps: 10, versiculosPorCap: { 1:11, 2:70, 3:13, 4:24, 5:17, 6:22, 7:28, 8:36, 9:15, 10:44 } },
    { abbrev: 'ne', nome: 'Neemias', caps: 13, versiculosPorCap: { 1:11, 2:20, 3:32, 4:23, 5:19, 6:19, 7:73, 8:18, 9:38, 10:39, 11:36, 12:47, 13:31 } },
    { abbrev: 'et', nome: 'Ester', caps: 10, versiculosPorCap: { 1:22, 2:23, 3:15, 4:17, 5:14, 6:14, 7:10, 8:17, 9:32, 10:3 } },
    { abbrev: 'job', nome: 'Jó', caps: 42, versiculosPorCap: { 1:22, 2:13, 3:26, 4:21, 5:27, 6:30, 7:21, 8:22, 9:35, 10:22, 11:20, 12:25, 13:28, 14:22, 15:35, 16:22, 17:16, 18:21, 19:29, 20:29, 21:34, 22:30, 23:17, 24:25, 25:6, 26:14, 27:23, 28:28, 29:25, 30:31, 31:40, 32:22, 33:33, 34:37, 35:16, 36:33, 37:24, 38:41, 39:30, 40:24, 41:34, 42:17 } },
    { abbrev: 'sl', nome: 'Salmos', caps: 150, versiculosPorCap: Object.fromEntries(Array.from({ length: 150 }, (_, i) => [i + 1, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150].includes(i + 1) ? 20 : 10])) }, // simplificado para fins de espaço de código, adaptável
    { abbrev: 'pv', nome: 'Prover.', caps: 31, versiculosPorCap: { 1:33, 2:22, 3:35, 4:27, 5:23, 6:35, 7:27, 8:36, 9:18, 10:32, 11:31, 12:28, 13:25, 14:35, 15:33, 16:33, 17:28, 18:24, 19:29, 20:30, 21:31, 22:29, 23:35, 24:34, 25:28, 26:28, 27:27, 28:28, 29:27, 30:33, 31:31 } },
    { abbrev: 'ec', nome: 'Ecl.', caps: 12, versiculosPorCap: { 1:18, 2:26, 3:22, 4:16, 5:20, 6:12, 7:29, 8:17, 9:18, 10:20, 11:10, 12:14 } },
    { abbrev: 'ct', nome: 'Cantares', caps: 8, versiculosPorCap: { 1:17, 2:17, 3:11, 4:16, 5:16, 6:13, 7:13, 8:14 } },
    { abbrev: 'is', nome: 'Isaías', caps: 66, versiculosPorCap: Object.fromEntries(Array.from({ length: 66 }, (_, i) => [i + 1, 30])) },
    { abbrev: 'jr', nome: 'Jerem.', caps: 52, versiculosPorCap: Object.fromEntries(Array.from({ length: 52 }, (_, i) => [i + 1, 35])) },
    { abbrev: 'lm', nome: 'Lament.', caps: 5, versiculosPorCap: { 1:22, 2:22, 3:66, 4:22, 5:22 } },
    { abbrev: 'ez', nome: 'Ezeq.', caps: 48, versiculosPorCap: Object.fromEntries(Array.from({ length: 48 }, (_, i) => [i + 1, 30])) },
    { abbrev: 'dn', nome: 'Daniel', caps: 12, versiculosPorCap: { 1:21, 2:49, 3:30, 4:37, 5:31, 6:28, 7:28, 8:27, 9:27, 10:21, 11:45, 12:13 } },
    { abbrev: 'os', nome: 'Oseias', caps: 14, versiculosPorCap: { 1:11, 2:23, 3:5, 4:19, 5:15, 6:11, 7:16, 8:14, 9:17, 10:15, 11:12, 12:14, 13:16, 14:9 } },
    { abbrev: 'jl', nome: 'Joel', caps: 3, versiculosPorCap: { 1:20, 2:32, 3:21 } },
    { abbrev: 'am', nome: 'Amós', caps: 9, versiculosPorCap: { 1:15, 2:16, 3:15, 4:13, 5:27, 6:14, 7:17, 8:14, 9:15 } },
    { abbrev: 'ob', nome: 'Obadias', caps: 1, versiculosPorCap: { 1:21 } },
    { abbrev: 'jn', nome: 'Jonas', caps: 4, versiculosPorCap: { 1:17, 2:10, 3:10, 4:11 } },
    { abbrev: 'mq', nome: 'Miqueias', caps: 7, versiculosPorCap: { 1:16, 2:13, 3:12, 4:13, 5:15, 6:16, 7:20 } },
    { abbrev: 'na', nome: 'Naum', caps: 3, versiculosPorCap: { 1:15, 2:13, 3:19 } },
    { abbrev: 'hc', nome: 'Habac.', caps: 3, versiculosPorCap: { 1:17, 2:20, 3:19 } },
    { abbrev: 'sf', nome: 'Sofon.', caps: 3, versiculosPorCap: { 1:18, 2:15, 3:20 } },
    { abbrev: 'ag', nome: 'Ageu', caps: 2, versiculosPorCap: { 1:15, 2:23 } },
    { abbrev: 'zc', nome: 'Zacar.', caps: 14, versiculosPorCap: { 1:21, 2:13, 3:10, 4:14, 5:11, 6:15, 7:14, 8:23, 9:17, 10:12, 11:17, 12:14, 13:9, 14:21 } },
    { abbrev: 'ml', nome: 'Malaq.', caps: 4, versiculosPorCap: { 1:14, 2:17, 3:18, 4:6 } }
  ],
  'NT': [
    { abbrev: 'mt', nome: 'Mateus', caps: 28, versiculosPorCap: { 1:25, 2:23, 3:17, 4:25, 5:48, 6:34, 7:29, 8:34, 9:38, 10:42, 11:30, 12:50, 13:58, 14:36, 15:39, 16:28, 17:27, 18:35, 19:30, 20:34, 21:46, 22:46, 23:39, 24:51, 25:46, 26:75, 27:66, 28:20 } },
    { abbrev: 'mc', nome: 'Marcos', caps: 16, versiculosPorCap: { 1:45, 2:28, 3:35, 4:41, 5:43, 6:56, 7:37, 8:38, 9:50, 10:52, 11:33, 12:44, 13:37, 14:72, 15:47, 16:20 } },
    { abbrev: 'lc', nome: 'Lucas', caps: 24, versiculosPorCap: { 1:80, 2:52, 3:38, 4:44, 5:39, 6:49, 7:50, 8:56, 9:62, 10:42, 11:54, 12:59, 13:35, 14:35, 15:32, 16:31, 17:37, 18:43, 19:48, 20:48, 21:38, 22:71, 23:56, 24:53 } },
    { abbrev: 'jo', nome: 'João', caps: 21, versiculosPorCap: { 1:51, 2:25, 3:36, 4:54, 5:47, 6:71, 7:53, 8:59, 9:41, 10:42, 11:57, 12:50, 13:38, 14:31, 15:27, 16:33, 17:26, 18:40, 19:42, 20:31, 21:25 } },
    { abbrev: 'at', nome: 'Atos', caps: 28, versiculosPorCap: { 1:26, 2:47, 3:26, 4:37, 5:42, 6:15, 7:60, 8:40, 9:43, 10:48, 11:30, 12:25, 13:52, 14:28, 15:41, 16:40, 17:34, 18:28, 19:41, 20:38, 21:40, 22:30, 23:35, 24:27, 25:27, 26:32, 27:44, 28:31 } },
    { abbrev: 'rm', nome: 'Romanos', caps: 16, versiculosPorCap: { 1:32, 2:29, 3:31, 4:25, 5:21, 6:23, 7:25, 8:39, 9:33, 10:21, 11:36, 12:21, 13:14, 14:23, 15:33, 16:27 } },
    { abbrev: '1co', nome: '1 Cor.', caps: 16, versiculosPorCap: { 1:31, 2:16, 3:23, 4:21, 5:13, 6:20, 7:40, 8:13, 9:27, 10:33, 11:34, 12:31, 13:13, 14:40, 15:58, 16:24 } },
    { abbrev: '2co', nome: '2 Cor.', caps: 13, versiculosPorCap: { 1:24, 2:17, 3:18, 4:18, 5:21, 6:18, 7:16, 8:24, 9:15, 10:18, 11:33, 12:21, 13:14 } },
    { abbrev: 'gl', nome: 'Gálatas', caps: 6, versiculosPorCap: { 1:24, 2:21, 3:29, 4:31, 5:26, 6:18 } },
    { abbrev: 'ef', nome: 'Efésios', caps: 6, versiculosPorCap: { 1:23, 2:22, 3:21, 4:32, 5:33, 6:24 } },
    { abbrev: 'fp', nome: 'Filip.', caps: 4, versiculosPorCap: { 1:30, 2:30, 3:21, 4:23 } },
    { abbrev: 'cl', nome: 'Colos.', caps: 4, versiculosPorCap: { 1:29, 2:23, 3:25, 4:18 } },
    { abbrev: '1ts', nome: '1 Tess.', caps: 5, versiculosPorCap: { 1:10, 2:20, 3:13, 4:18, 5:28 } },
    { abbrev: '2ts', nome: '2 Tess.', caps: 3, versiculosPorCap: { 1:12, 2:17, 3:18 } },
    { abbrev: '1tm', nome: '1 Tim.', caps: 6, versiculosPorCap: { 1:20, 2:15, 3:16, 4:16, 5:25, 6:21 } },
    { abbrev: '2tm', nome: '2 Tim.', caps: 4, versiculosPorCap: { 1:18, 2:26, 3:17, 4:22 } },
    { abbrev: 'tt', nome: 'Tito', caps: 3, versiculosPorCap: { 1:16, 2:15, 3:15 } },
    { abbrev: 'fm', nome: 'Filemom', caps: 1, versiculosPorCap: { 1:25 } },
    { abbrev: 'hb', nome: 'Hebreus', caps: 13, versiculosPorCap: { 1:14, 2:18, 3:19, 4:16, 5:14, 6:20, 7:28, 8:13, 9:28, 10:39, 11:40, 12:29, 13:25 } },
    { abbrev: 'tg', nome: 'Tiago', caps: 5, versiculosPorCap: { 1:27, 2:26, 3:18, 4:17, 5:20 } },
    { abbrev: '1pe', nome: '1 Pedro', caps: 5, versiculosPorCap: { 1:25, 2:25, 3:22, 4:19, 5:14 } },
    { abbrev: '2pe', nome: '2 Pedro', caps: 3, versiculosPorCap: { 1:21, 2:22, 3:18 } },
    { abbrev: '1jo', nome: '1 João', caps: 5, versiculosPorCap: { 1:10, 2:29, 3:24, 4:21, 5:21 } },
    { abbrev: '2jo', nome: '2 João', caps: 1, versiculosPorCap: { 1:13 } },
    { abbrev: '3jo', nome: '3 João', caps: 1, versiculosPorCap: { 1:14 } },
    { abbrev: 'jd', nome: 'Judas', caps: 1, versiculosPorCap: { 1:25 } },
    { abbrev: 'ap', nome: 'Apocal.', caps: 22, versiculosPorCap: { 1:20, 2:29, 3:22, 4:11, 5:14, 6:17, 7:17, 8:13, 9:21, 10:11, 11:19, 12:17, 13:18, 14:20, 15:8, 16:21, 17:18, 18:24, 19:21, 20:15, 21:27, 22:21 } }
  ]
};

const TODOS_LIVROS = [...LIVROS_MAPA.AT, ...LIVROS_MAPA.NT];

const VERSOES_DISPONIVEIS = [
  { id: 'acf', nome: 'ACF', extenso: 'Almeida Corrigida Fiel' },
  { id: 'ara', nome: 'ARA', extenso: 'Almeida Revista e Atualizada' },
  { id: 'aa', nome: 'AA', extenso: 'Almeida Antiga' },
  { id: 'ntlh', nome: 'NTLH', extenso: 'Nova Tradução na Ling. de Hoje' },
  { id: 'nvi', nome: 'NVI', extenso: 'Nova Versão Internacional' }
];

const NOME_EXTENSO_VERSOES = {
  acf: 'Almeida Corrigida Fiel',
  ara: 'Almeida Revista e Atualizada',
  aa: 'Almeida Antiga',
  ntlh: 'Nova Tradução na Ling. de Hoje',
  nvi: 'Nova Versão Internacional'
};

const FONT_SIZES = {
  pequena: { 
    label: "Pequena", 
    buttonLabel: "PEQ", 
    textClass: "text-base", 
    gridColsClass: "grid-cols-4", 
    titleClass: "text-[12px]", 
    subClass: "text-[9px]"
  },
  media: { 
    label: "Média", 
    buttonLabel: "MED", 
    textClass: "text-lg", 
    gridColsClass: "grid-cols-4", 
    titleClass: "text-[14px]", 
    subClass: "text-[10px]"
  },
  grande: { 
    label: "Grande", 
    buttonLabel: "GRA", 
    textClass: "text-xl", 
    gridColsClass: "grid-cols-3", 
    titleClass: "text-[16px]", 
    subClass: "text-[12px]"
  }
};

export default function Biblia() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isFavoritosModalOpen, setIsFavoritosModalOpen] = useState(false);
  const [isAjudaModalOpen, setIsAjudaModalOpen] = useState(false);
  const [isPrimeiroAcessoModalOpen, setIsPrimeiroAcessoModalOpen] = useState(false);
  
  const [notificacao, setNotificacao] = useState(null);

  const [fontSizeLevel, setFontSizeLevel] = useState(() => {
    return localStorage.getItem("icmlyrics_biblia_fontsize") || "pequena";
  });

  const [testamentoAtivo, setTestamentoAtivo] = useState('AT');
  const [livroAbbrev, setLivroAbbrev] = useState(null);
  const [nomeLivroExibicao, setNomeLivroExibicao] = useState("");
  
  const [versaoSelecionada, setVersaoSelecionada] = useState(() => {
    return localStorage.getItem("icmlyrics_biblia_versao_favorita") || "acf";
  });

  const [versaoFavoritaSalva, setVersaoFavoritaSalva] = useState(() => {
    return localStorage.getItem("icmlyrics_biblia_versao_favorita") || null;
  });

  const [capitulosDisponiveis, setCapitulosDisponiveis] = useState([]);
  const [capituloSelecionado, setCapituloSelecionado] = useState(1);
  const [versiculos, setVersiculos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados da Busca Rápida
  const [buscaLivro, setBuscaLivro] = useState("");
  const [buscaCapitulo, setBuscaCapitulo] = useState("");
  const [buscaVersiculo, setBuscaVersiculo] = useState("");

  // Listas de opções geradas dinamicamente
  const [capsDoLivroBuscado, setCapsDoLivroBuscado] = useState([]);
  const [versDoCapBuscado, setVersDoCapBuscado] = useState([]);

  const [versiculoParaComparar, setVersiculoParaComparar] = useState(null);
  const [comparacoes, setComparacoes] = useState([]);
  const [loadingComparacao, setLoadingComparacao] = useState(false);

  const [comentariosEditando, setComentariosEditando] = useState({});

  const [favoritos, setFavoritos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("icmlyrics_biblia_favoritos")) || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  useEffect(() => {
    const favorita = localStorage.getItem("icmlyrics_biblia_versao_favorita");
    if (!favorita) {
      setIsPrimeiroAcessoModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (livroAbbrev) {
      setCapituloSelecionado(1);
      obterCapitulosDoLivro();
    }
  }, [livroAbbrev, versaoSelecionada]);

  useEffect(() => {
    if (livroAbbrev && capituloSelecionado) {
      carregarVersiculos();
    }
  }, [livroAbbrev, capituloSelecionado, versaoSelecionada]);

  // Atualiza dinamicamente as opções de Capítulos após mudar o Livro na busca
  useEffect(() => {
    setBuscaCapitulo("");
    setBuscaVersiculo("");
    setVersDoCapBuscado([]);
    
    if (buscaLivro) {
      const livroRef = TODOS_LIVROS.find(l => l.abbrev === buscaLivro);
      if (livroRef) {
        const totalCaps = livroRef.caps;
        const arrayCaps = Array.from({ length: totalCaps }, (_, i) => String(i + 1));
        setCapsDoLivroBuscado(arrayCaps);
      }
    } else {
      setCapsDoLivroBuscado([]);
    }
  }, [buscaLivro]);

  // Atualiza dinamicamente as opções de Versículos após mudar o Capítulo na busca
  useEffect(() => {
    setBuscaVersiculo("");
    
    if (buscaLivro && buscaCapitulo) {
      const livroRef = TODOS_LIVROS.find(l => l.abbrev === buscaLivro);
      if (livroRef) {
        const capInt = parseInt(buscaCapitulo, 10);
        const totalVersiculos = livroRef.versiculosPorCap?.[capInt] || 30; // Fallback seguro
        const arrayVers = Array.from({ length: totalVersiculos }, (_, i) => String(i + 1));
        setVersDoCapBuscado(arrayVers);
      }
    } else {
      setVersDoCapBuscado([]);
    }
  }, [buscaCapitulo, buscaLivro]);

  useEffect(() => {
    if (notificacao) {
      const timer = setTimeout(() => {
        setNotificacao(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notificacao]);

  const obterCapitulosDoLivro = async () => {
    setLoading(true);
    try {

      const livroEncontrado =
        LIVROS_MAPA.AT.find(l => l.abbrev.toLowerCase() === livroAbbrev.toLowerCase()) || 
        LIVROS_MAPA.NT.find(l => l.abbrev.toLowerCase() === livroAbbrev.toLowerCase());

    if (livroEncontrado) {
        // 2. Cria a lista de capítulos reais com base na propriedade 'caps' (ex: 50 para Gênesis)
        const capsUnicos = Array.from({ length: livroEncontrado.caps }, (_, i) => i + 1);
        
        setCapitulosDisponiveis(capsUnicos);

        // 3. Mantém a sua validação para não deixar um capítulo inválido selecionado
        if (!capsUnicos.includes(capituloSelecionado)) {
            setCapituloSelecionado(capsUnicos[0]);
        }
        } else {
        setCapitulosDisponiveis([]);
        }
    } catch (error) {
        console.error("Erro ao carregar capítulos do mapa local:", error);
    } finally {
        setLoading(false);
    }
};

  const carregarVersiculos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("versiculos")
        .select("versiculo, texto")
        .eq("book_abbrev", livroAbbrev)
        .eq("capitulo", capituloSelecionado)
        .eq("versao", versaoSelecionada)
        .order("versiculo", { ascending: true });

      if (error) throw error;
      setVersiculos(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selecionarLivro = (abbrev, nome) => {
    setNomeLivroExibicao(nome);
    setLivroAbbrev(abbrev);
  };

  const handleBuscaSeparada = async (e) => {
    e.preventDefault();
    if (!buscaLivro || !buscaCapitulo) return;

    const livroEncontrado = TODOS_LIVROS.find(l => l.abbrev === buscaLivro);
    if (!livroEncontrado) return;

    const capNum = parseInt(buscaCapitulo, 10);
    const verNum = buscaVersiculo ? parseInt(buscaVersiculo, 10) : null;

    selecionarLivro(livroEncontrado.abbrev, livroEncontrado.nome);
    setCapituloSelecionado(capNum);

    if (verNum) {
      abrirComparacaoVersoes(livroEncontrado.abbrev, capNum, verNum);
    }

    setBuscaLivro("");
    setBuscaCapitulo("");
    setBuscaVersiculo("");
  };

  const abrirComparacaoVersoes = async (abbrev, cap, numVersiculo) => {
    setVersiculoParaComparar({ abbrev, cap, numVersiculo });
    setLoadingComparacao(true);
    try {
      const { data, error } = await supabase
        .from("versiculos")
        .select("versao, texto")
        .eq("book_abbrev", abbrev)
        .eq("capitulo", cap)
        .eq("versiculo", numVersiculo);

      if (error) throw error;

      let listaComparacoes = data || [];

      listaComparacoes.sort((a, b) => {
        const aVersao = a.versao.toLowerCase();
        const bVersao = b.versao.toLowerCase();
        const fav = versaoSelecionada.toLowerCase();

        if (aVersao === fav) return -1;
        if (bVersao === fav) return 1;
        return 0;
      });

      setComparacoes(listaComparacoes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComparacao(false);
    }
  };

  const handleToggleFavorito = (abbrev, cap, numVersiculo, texto, nomePersonalizado) => {
    const key = `${abbrev}-${cap}-${numVersiculo}`;
    let novosFavoritos;
    
    if (favoritos.some(f => f.key === key)) {
      novosFavoritos = favoritos.filter(f => f.key !== key);
    } else {
      const nomeLivroResolvido = nomePersonalizado || nomeLivroExibicao || "Livro";
      novosFavoritos = [...favoritos, { 
        key, 
        abbrev, 
        livro: nomeLivroResolvido, 
        cap, 
        numVersiculo, 
        texto,
        comentario: ""
      }];
    }

    setFavoritos(novosFavoritos);
    localStorage.setItem("icmlyrics_biblia_favoritos", JSON.stringify(novosFavoritos));
  };

  const removerFavoritoDireto = (key) => {
    const novosFavoritos = favoritos.filter(f => f.key !== key);
    setFavoritos(novosFavoritos);
    localStorage.setItem("icmlyrics_biblia_favoritos", JSON.stringify(novosFavoritos));
  };

  const salvarComentario = (key, textoComentario) => {
    const novosFavoritos = favoritos.map(f => {
      if (f.key === key) {
        return { ...f, comentario: textoComentario };
      }
      return f;
    });
    setFavoritos(novosFavoritos);
    localStorage.setItem("icmlyrics_biblia_favoritos", JSON.stringify(novosFavoritos));
    
    setComentariosEditando(prev => {
      const copia = { ...prev };
      delete copia[key];
      return copia;
    });
  };

  const compartilharFavorito = async (fav) => {
    const textCompartilhado = `📖 *${fav.livro} ${fav.cap}:${fav.numVersiculo}*\n"${fav.texto}"\n\n${
      fav.comentario ? `✍️ *Minha anotação:*\n${fav.comentario}` : ""
    }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Estudo Bíblico - ${fav.livro}`,
          text: textCompartilhado,
        });
      } catch (err) {
        console.log("Compartilhamento cancelado", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(textCompartilhado);
        alert("Texto e comentário copiados para a área de transferência!");
      } catch (err) {
        console.error("Falha ao copiar", err);
      }
    }
  };

  const irParaFavorito = (fav) => {
    selecionarLivro(fav.abbrev, fav.livro);
    setCapituloSelecionado(fav.cap);
    setIsFavoritosModalOpen(false);
  };

  const isFavorito = (abbrev, cap, numVersiculo) => {
    return favoritos.some(f => f.key === `${abbrev}-${cap}-${numVersiculo}`);
  };

  const alternarTamanhoFonte = () => {
    let proximoNivel = "media";
    if (fontSizeLevel === "pequena") proximoNivel = "media";
    else if (fontSizeLevel === "media") proximoNivel = "grande";
    else if (fontSizeLevel === "grande") proximoNivel = "pequena";

    setFontSizeLevel(proximoNivel);
    localStorage.setItem("icmlyrics_biblia_fontsize", proximoNivel);
  };

  const selecionarVersaoFavoritaPeloModal = (versaoId) => {
    localStorage.setItem("icmlyrics_biblia_versao_favorita", versaoId);
    setVersaoFavoritaSalva(versaoId);
    setVersaoSelecionada(versaoId);
    setIsAjudaModalOpen(false);

    const versaoObj = VERSOES_DISPONIVEIS.find(v => v.id === versaoId);
    const nomeCompleto = versaoObj ? versaoObj.extenso : versaoId.toUpperCase();
    setNotificacao(`A versão ${nomeCompleto} foi definida como sua favorita padrão!`);
  };

  const configFonte = FONT_SIZES[fontSizeLevel] || FONT_SIZES.pequena;
  const favoritosDoLivroAtual = favoritos.filter(f => f.abbrev === livroAbbrev);

  return (
    <div className="min-h-screen bg-slate-50 pb-8 relative">
      
      {/* POPUP DE NOTIFICAÇÃO */}
      {notificacao && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-500/30 transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 shrink-0 text-emerald-100 bg-emerald-700/50 p-0.5 rounded-full" />
          <span>{notificacao}</span>
        </div>
      )}

      {!livroAbbrev && (
        <div className="bg-slate-900 text-white px-4 pt-12 pb-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="text-slate-300 hover:text-white transition-colors p-1 mr-1"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-1.5">
                <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" /> Bíblia
              </h1>
              <p className="text-slate-400 text-xs">Leitura e Favoritos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={alternarTamanhoFonte}
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 text-xs font-bold text-slate-200"
              title={`Tamanho da fonte: ${configFonte.label}`}
            >
              <Type className="w-4 h-4 text-emerald-400" />
              <span className="uppercase text-[10px] tracking-wider">{configFonte.buttonLabel}</span>
            </button>

            <button 
              onClick={() => setIsFavoritosModalOpen(true)}
              className="relative p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
            >
              <Star className={`w-5 h-5 ${favoritos.length > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              {favoritos.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-slate-900">
                  {favoritos.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <DrawerMenu open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className={`px-4 space-y-4 ${livroAbbrev ? "pt-12" : "-mt-3"}`}>
        {!livroAbbrev && (
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 space-y-3 mt-6">
            
            {/* SELETOR DE VERSÕES */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAjudaModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                title="Significado das Traduções"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {VERSOES_DISPONIVEIS.map((v) => {
                const isFavorita = versaoFavoritaSalva === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVersaoSelecionada(v.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 ${
                      versaoSelecionada === v.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{v.nome}</span>
                    {isFavorita && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* FORMULÁRIO DE BUSCA RÁPIDA TOTALMENTE VIA SELETORES DINÂMICOS */}
            <form onSubmit={handleBuscaSeparada} className="flex gap-1.5 items-center">
              {/* Seletor de Livros */}
              <div className="flex-[2] min-w-[110px]">
                <Select value={buscaLivro} onValueChange={setBuscaLivro}>
                  <SelectTrigger className="bg-slate-50 border-slate-100 shadow-inner rounded-xl h-9 text-xs font-semibold text-slate-700">
                    <SelectValue placeholder="Livro" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {TODOS_LIVROS.map((l) => (
                      <SelectItem key={l.abbrev} value={l.abbrev}>
                        {l.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seletor de Capítulos Limitado Dinamicamente */}
              <div className="flex-[1] min-w-[65px]">
                <Select 
                  value={buscaCapitulo} 
                  onValueChange={setBuscaCapitulo} 
                  disabled={!buscaLivro}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-100 shadow-inner rounded-xl h-9 text-xs font-semibold text-slate-700 disabled:opacity-50">
                    <SelectValue placeholder="Cap." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {capsDoLivroBuscado.map((cap) => (
                      <SelectItem key={cap} value={cap}>
                        {cap}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seletor de Versículos Limitado Dinamicamente */}
              <div className="flex-[1] min-w-[65px]">
                <Select 
                  value={buscaVersiculo} 
                  onValueChange={setBuscaVersiculo} 
                  disabled={!buscaCapitulo}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-100 shadow-inner rounded-xl h-9 text-xs font-semibold text-slate-700 disabled:opacity-50">
                    <SelectValue placeholder="Ver." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {versDoCapBuscado.map((ver) => (
                      <SelectItem key={ver} value={ver}>
                        {ver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                size="sm" 
                disabled={!buscaLivro || !buscaCapitulo}
                className="rounded-xl h-9 px-3 bg-slate-900 hover:bg-slate-800 shrink-0 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>
        )}

        {!livroAbbrev ? (
          <div className="space-y-3">
            <div className="flex bg-slate-200 p-1 rounded-xl">
              <button 
                onClick={() => setTestamentoAtivo('AT')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${testamentoAtivo === 'AT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Antigo Testamento (39)
              </button>
              <button 
                onClick={() => setTestamentoAtivo('NT')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${testamentoAtivo === 'NT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Novo Testamento (27)
              </button>
            </div>

            <div className={`grid ${configFonte.gridColsClass} gap-1.5`}>
              {LIVROS_MAPA[testamentoAtivo].map((l) => (
                <button
                  key={l.abbrev}
                  onClick={() => selecionarLivro(l.abbrev, l.nome)}
                  className="bg-white rounded-xl p-2.5 text-center shadow-sm border border-slate-100 hover:border-emerald-500/30 active:scale-95 transition-all truncate flex flex-col justify-center items-center min-h-[56px]"
                >
                  <p className={`font-bold text-slate-800 leading-tight truncate ${configFonte.titleClass}`}>
                    {l.nome}
                  </p>
                  <p className={`text-slate-400 font-mono font-bold uppercase leading-none mt-0.5 ${configFonte.subClass}`}>
                    ({l.abbrev})
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* MODO LEITURA */
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
              
              <div className="flex items-center gap-2 max-w-[55%] overflow-hidden">
                <button
                  onClick={() => {
                    setLivroAbbrev(null);
                    setVersiculos([]);
                  }}
                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition shrink-0"
                >
                  <BookOpen className="w-5 h-5" />
                </button>
                
                <h2 className="font-extrabold text-base text-slate-900 truncate">
                  {nomeLivroExibicao}
                </h2>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cap:</span>
                <Select
                  value={String(capituloSelecionado)}
                  onValueChange={(val) => setCapituloSelecionado(Number(val))}
                >
                  <SelectTrigger className="w-14 bg-slate-50 border-0 shadow-inner rounded-xl h-8 text-xs font-extrabold text-slate-800 p-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {capitulosDisponiveis.map((cap) => (
                      <SelectItem key={cap} value={String(cap)}>
                        {cap}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={alternarTamanhoFonte}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-slate-600"
                  title={`Fonte atual: ${configFonte.label}`}
                >
                  <Type className="w-4 h-4" />
                </button>

                {favoritosDoLivroAtual.length > 0 && (
                  <button 
                    onClick={() => setIsFavoritosModalOpen(true)}
                    className="p-2 bg-amber-50 hover:bg-amber-100 rounded-xl transition border border-amber-200 text-amber-500"
                    title={`Ver favoritos de ${nomeLivroExibicao}`}
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : (
              <div className={`space-y-4 leading-relaxed text-slate-700 select-text bg-slate-50/50 p-4 rounded-xl border border-slate-50 ${configFonte.textClass}`}>
                <p className="text-[10px] text-slate-400 mb-2 italic">Toque em um versículo para comparar versões ou favoritar.</p>
                {versiculos.length > 0 ? (
                  versiculos.map((v) => {
                    const favoritadoNoLivro = isFavorito(livroAbbrev, capituloSelecionado, v.versiculo);
                    return (
                      <div 
                        key={v.versiculo} 
                        onClick={() => abrirComparacaoVersoes(livroAbbrev, capituloSelecionado, v.versiculo)}
                        className={`cursor-pointer hover:bg-emerald-50/50 hover:text-slate-900 rounded-lg p-2 transition-colors flex items-start gap-3 ${
                          favoritadoNoLivro ? "bg-amber-50/30 border-l-2 border-amber-400 pl-1.5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-1 shrink-0 select-none">
                          <sup className="text-xs text-emerald-600 font-bold mt-1.5">
                            {v.versiculo}
                          </sup>
                          {favoritadoNoLivro && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 mt-1" />
                          )}
                        </div>
                        <span className="flex-1">{v.texto}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 italic text-center py-6">
                    Nenhum versículo encontrado para os parâmetros selecionados.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE AJUDA COM SIGNIFICADO */}
      <Dialog open={isAjudaModalOpen} onOpenChange={setIsAjudaModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-500" /> Escolha sua Versão Favorita
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            <p className="text-xs text-slate-500 mb-3 font-medium text-center">
              Clique em qualquer uma das traduções abaixo para defini-la imediatamente como sua favorita padrão e atualizar as preferências.
            </p>
            {VERSOES_DISPONIVEIS.map((v) => {
              const isActive = versaoFavoritaSalva === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => selecionarVersaoFavoritaPeloModal(v.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                    isActive 
                      ? "bg-emerald-50/60 border-emerald-300" 
                      : "bg-slate-50 hover:bg-slate-100 border-slate-100"
                  }`}
                >
                  <div className="w-14 shrink-0 flex justify-start">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase text-center w-full ${
                      isActive 
                        ? "text-emerald-700 bg-emerald-100 border-emerald-200" 
                        : "text-slate-600 bg-white border-slate-200"
                    }`}>
                      {v.nome}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="font-bold text-slate-800 text-sm">{v.extenso}</p>
                      {isActive && <Check className="w-4 h-4 text-emerald-600 stroke-[3px] shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">
                      {v.id === 'acf' && 'Tradução literal, tradicional e com português clássico baseada no Texto Recebido.'}
                      {v.id === 'ara' && 'Texto clássico alinhado com a erudição bíblica moderna, equilíbrio entre fidelidade e clareza.'}
                      {v.id === 'aa' && 'Almeida versão Revista e Corrigida histórica, respeitada pelo estilo formal e poético.'}
                      {v.id === 'ntlh' && 'Foco na compreensão total rápida, ideal para evangelismo, jovens ou leitura dinâmica.'}
                      {v.id === 'nvi' && 'Uma das traduções mais populares. Une precisão acadêmica com fluidez contemporânea.'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* POPUP DE BOAS-VINDAS */}
      <Dialog open={isPrimeiroAcessoModalOpen} onOpenChange={setIsPrimeiroAcessoModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl">
          <DialogHeader className="text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-slate-900 text-center">
              Escolha sua Versão Padrão
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 max-w-xs mt-2 text-center whitespace-pre-line leading-relaxed mx-auto">
              {"Selecione qual tradução você deseja usar como padrão.\n\nPoderá redefinir esta escolha a qualquer momento no botão de ajuda \"❔\"."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-5 space-y-2">
            {VERSOES_DISPONIVEIS.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  selecionarVersaoFavoritaPeloModal(v.id);
                  setIsPrimeiroAcessoModalOpen(false);
                }}
                className="w-full flex items-center p-3.5 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition text-left group gap-3"
              >
                <div className="w-14 shrink-0 flex justify-start">
                  <span className="font-black text-[10px] text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-md uppercase text-center w-full">
                    {v.nome}
                  </span>
                </div>
                <span className="font-semibold text-sm text-slate-800 group-hover:text-emerald-900 transition flex-1">
                  {v.extenso}
                </span>
                <Check className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 stroke-[3px] transition shrink-0" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Versículos Favoritos */}
      <Dialog open={isFavoritosModalOpen} onOpenChange={setIsFavoritosModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 max-h-[80vh] flex flex-col">
          <DialogHeader className="border-b pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> 
              {livroAbbrev ? `Favoritos de ${nomeLivroExibicao}` : "Versículos Favoritos"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
            {(livroAbbrev ? favoritosDoLivroAtual : favoritos).length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10 italic">Nenhum favorito encontrado.</p>
            ) : (
              (livroAbbrev ? favoritosDoLivroAtual : favoritos).map((fav) => {
                const emEdicao = comentariosEditando[fav.key] !== undefined;
                const valorComentario = emEdicao ? comentariosEditando[fav.key] : (fav.comentario || "");

                return (
                  <div key={fav.key} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase bg-white px-2 py-1 rounded-lg border border-slate-200">
                        {fav.livro} {fav.cap}:{fav.numVersiculo}
                      </span>
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-sky-600 hover:bg-sky-50" 
                          onClick={() => compartilharFavorito(fav)}
                          title="Compartilhar versículo e anotação"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" 
                          onClick={() => irParaFavorito(fav)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" 
                          onClick={() => removerFavoritoDireto(fav.key)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 italic leading-relaxed">"{fav.texto}"</p>

                    <div className="pt-2 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> ANOTAÇÃO PESSOAL
                        </span>
                        
                        {!emEdicao ? (
                          <button
                            onClick={() => setComentariosEditando(prev => ({ ...prev, [fav.key]: fav.comentario || "" }))}
                            className="text-[10px] font-semibold text-emerald-600 hover:underline"
                          >
                            {fav.comentario ? "Editar" : "Escrever"}
                          </button>
                        ) : (
                          <button
                            onClick={() => salvarComentario(fav.key, valorComentario)}
                            className="text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-2 py-0.5 rounded flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Salvar
                          </button>
                        )}
                      </div>

                      {emEdicao ? (
                        <textarea
                          value={valorComentario}
                          onChange={(e) => setComentariosEditando(prev => ({ ...prev, [fav.key]: e.target.value }))}
                          placeholder="Anote suas reflexões..."
                          className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[60px]"
                        />
                      ) : (
                        fav.comentario ? (
                          <p className="text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed">
                            {fav.comentario}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Nenhuma anotação criada para este versículo.</p>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE COMPARAÇÃO */}
      <Dialog open={!!versiculoParaComparar} onOpenChange={() => setVersiculoParaComparar(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
            <DialogTitle className="text-base font-bold text-slate-900">
              {nomeLivroExibicao} {versiculoParaComparar?.cap}:{versiculoParaComparar?.numVersiculo}
            </DialogTitle>
            
            {versiculoParaComparar && (
              <button
                onClick={() => {
                  const textoOriginal = comparacoes.find(c => c.versao.toLowerCase() === versaoSelecionada.toLowerCase())?.texto 
                    || comparacoes[0]?.texto 
                    || "";
                  handleToggleFavorito(
                    versiculoParaComparar.abbrev,
                    versiculoParaComparar.cap,
                    versiculoParaComparar.numVersiculo,
                    textoOriginal,
                    nomeLivroExibicao
                  );
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition text-amber-500 mr-4"
              >
                <Star 
                  className={`w-5 h-5 ${
                    isFavorito(versiculoParaComparar.abbrev, versiculoParaComparar.cap, versiculoParaComparar.numVersiculo) 
                      ? 'fill-amber-500' 
                      : ''
                  }`} 
                />
              </button>
            )}
          </DialogHeader>

          {loadingComparacao ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="space-y-3 mt-2 max-h-[50vh] overflow-y-auto pr-1">
              {comparacoes.map((item) => {
                const nomePorExtenso = NOME_EXTENSO_VERSOES[item.versao.toLowerCase()] || "";
                const isFavoritado = isFavorito(versiculoParaComparar?.abbrev, versiculoParaComparar?.cap, versiculoParaComparar?.numVersiculo);
                const isSuaFavoritaPadrao = item.versao.toLowerCase() === versaoSelecionada.toLowerCase();

                return (
                  <div 
                    key={item.versao} 
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSuaFavoritaPadrao 
                        ? "bg-emerald-50/40 border-emerald-200 ring-1 ring-emerald-500/20" 
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                          isSuaFavoritaPadrao 
                            ? "text-emerald-800 bg-emerald-200" 
                            : "text-slate-600 bg-slate-200/60"
                        }`}>
                          {item.versao}
                        </span>
                        {nomePorExtenso && (
                          <span className="text-[10px] font-bold text-slate-400">
                            - {nomePorExtenso}
                          </span>
                        )}
                      </div>

                      {isFavoritado && isSuaFavoritaPadrao && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 select-none">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 animate-pulse" />
                          <span>Favoritado</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.texto}</p>
                  </div>
                );
              })}
              {comparacoes.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center">Nenhuma tradução alternativa encontrada.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}