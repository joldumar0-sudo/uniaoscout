import {
  Crown, Shield, ShieldCheck, FileText, Wallet, Map, Heart, Users,
  PawPrint, BookOpen, UserCog, UserPlus, Church
} from "lucide-react";

export type Cargo =
  | "padre"
  | "coord_provincial" | "adj_coord_provincial" | "secretaria_provincial" | "tesoureiro_provincial"
  | "chefe_campo_provincial" | "balu_provincial" | "akela_provincial"
  | "pai_provincial" | "mae_provincial" | "conselheiro_provincial"
  | "responsavel_agrupamento" | "adj_responsavel_agrupamento" | "secretaria_agrupamento" | "tesoureiro_agrupamento"
  | "chefe_campo_agrupamento" | "balu_agrupamento" | "akela_agrupamento" | "assistente_agrupamento"
  | "pai_agrupamento" | "mae_agrupamento" | "conselheiro_agrupamento";

export type CargoMeta = {
  value: Cargo;
  label: string;
  nivel: "provincial" | "agrupamento";
  grupo: "gestao" | "campo" | "espiritual" | "familia";
  icon: any;
};

export const CARGOS: CargoMeta[] = [
  { value: "padre", label: "Padre", nivel: "provincial", grupo: "espiritual", icon: Church },
  { value: "coord_provincial", label: "Coordenador Provincial", nivel: "provincial", grupo: "gestao", icon: Crown },
  { value: "adj_coord_provincial", label: "Adjunto Coord. Provincial", nivel: "provincial", grupo: "gestao", icon: ShieldCheck },
  { value: "secretaria_provincial", label: "Secretaria Provincial", nivel: "provincial", grupo: "gestao", icon: FileText },
  { value: "tesoureiro_provincial", label: "Tesoureiro Provincial", nivel: "provincial", grupo: "gestao", icon: Wallet },
  { value: "chefe_campo_provincial", label: "Chefe do Campo Provincial", nivel: "provincial", grupo: "campo", icon: Map },
  { value: "balu_provincial", label: "Balu Provincial", nivel: "provincial", grupo: "campo", icon: PawPrint },
  { value: "akela_provincial", label: "Akela Provincial", nivel: "provincial", grupo: "campo", icon: PawPrint },
  { value: "pai_provincial", label: "Pai Provincial", nivel: "provincial", grupo: "familia", icon: Heart },
  { value: "mae_provincial", label: "Mãe Provincial", nivel: "provincial", grupo: "familia", icon: Heart },
  { value: "conselheiro_provincial", label: "Conselheiro Provincial", nivel: "provincial", grupo: "gestao", icon: BookOpen },

  { value: "responsavel_agrupamento", label: "Responsável do Agrupamento", nivel: "agrupamento", grupo: "gestao", icon: Shield },
  { value: "adj_responsavel_agrupamento", label: "Adjunto Responsável", nivel: "agrupamento", grupo: "gestao", icon: ShieldCheck },
  { value: "secretaria_agrupamento", label: "Secretaria do Agrupamento", nivel: "agrupamento", grupo: "gestao", icon: FileText },
  { value: "tesoureiro_agrupamento", label: "Tesoureiro do Agrupamento", nivel: "agrupamento", grupo: "gestao", icon: Wallet },
  { value: "chefe_campo_agrupamento", label: "Chefe do Campo do Agrupamento", nivel: "agrupamento", grupo: "campo", icon: Map },
  { value: "balu_agrupamento", label: "Balu do Agrupamento", nivel: "agrupamento", grupo: "campo", icon: PawPrint },
  { value: "akela_agrupamento", label: "Akela do Agrupamento", nivel: "agrupamento", grupo: "campo", icon: PawPrint },
  { value: "assistente_agrupamento", label: "Assistente do Agrupamento", nivel: "agrupamento", grupo: "gestao", icon: UserCog },
  { value: "pai_agrupamento", label: "Pai do Agrupamento", nivel: "agrupamento", grupo: "familia", icon: Heart },
  { value: "mae_agrupamento", label: "Mãe do Agrupamento", nivel: "agrupamento", grupo: "familia", icon: Heart },
  { value: "conselheiro_agrupamento", label: "Conselheiro do Agrupamento", nivel: "agrupamento", grupo: "gestao", icon: BookOpen },
];

export const CARGO_MAP = Object.fromEntries(CARGOS.map((c) => [c.value, c])) as Record<Cargo, CargoMeta>;

export const cargoLabel = (c: Cargo) => CARGO_MAP[c]?.label ?? c;
export const cargoIcon = (c: Cargo) => CARGO_MAP[c]?.icon ?? Users;
