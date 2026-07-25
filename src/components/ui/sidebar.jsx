import * as React from "react"
import { 
  Home, 
  History, 
  Music, 
  PlusSquare, 
  Folder, 
  LogOut,
  Bell,
  MessageCircle,
  BookOpen,
  Database
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavegar = (caminho) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    navigate(caminho);
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-3 font-bold text-lg">
          ICM<span className="text-yellow-500">lyrics</span>
          <p className="text-xs font-normal text-muted-foreground mt-0.5">Menu</p>
        </SidebarHeader>
        
        <SidebarContent className="px-2">
          <SidebarMenu>
            {/* INÍCIO APONTANDO PARA O DASHBOARD (EVITA O ERRO 404) */}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/dashboard")}>
                <Home className="size-4" />
                <span>Início</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/historico-listas")}>
                <History className="size-4" />
                <span>Histórico de Listas</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/louvor")}>
                <Music className="size-4" />
                <span>Louvores</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/nova-lista")}>
                <PlusSquare className="size-4" />
                <span>Nova Lista</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/drive")}>
                <Folder className="size-4" />
                <span>Drive</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* NOVAS ROTAS ADICIONADAS BASEADAS NO SEU APP.JSX */}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/avisos")}>
                <Bell className="size-4" />
                <span>Avisos</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/chat")}>
                <MessageCircle className="size-4" />
                <span>Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/biblia")}>
                <BookOpen className="size-4" />
                <span>Bíblia</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/backup")}>
                <Database className="size-4" />
                <span>Backup</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="px-2 pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleNavegar("/")} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="size-4" />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}