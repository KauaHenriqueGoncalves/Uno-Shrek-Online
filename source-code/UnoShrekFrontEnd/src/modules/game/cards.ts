export type CardColor = "green" | "red" | "blue" | "yellow" | "wild";

export type GameCard = { id: string; color: CardColor; label: string };

export const cardColors: Record<CardColor, string> = {
  green: "#73AA2C",
  red: "#B01E35",
  blue: "#075CA9",
  yellow: "#EAD426",
  wild: "#1E1E1E",
};

export const handCards: GameCard[] = [
  { id: "c1", color: "green", label: "1" },
  { id: "c2", color: "wild", label: "+4" },
  { id: "c3", color: "green", label: "7" },
  { id: "c4", color: "green", label: "3" },
  { id: "c5", color: "wild", label: "+4" },
  { id: "c6", color: "red", label: "1" },
];

export const moveLog = [
  { id: "m1", player: "Você", text: "jogou Verde 3" },
  { id: "m2", player: "Bolsonaro", text: "comprou 1 carta" },
  { id: "m3", player: "Lula meu presidente", text: "jogou +4 (azul)" },
  { id: "m4", player: "Fiona", text: "jogou Reverse" },
  { id: "m5", player: "Você", text: "gritou URRO!" },
];