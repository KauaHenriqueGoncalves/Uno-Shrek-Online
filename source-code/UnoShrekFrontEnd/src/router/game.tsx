import { createFileRoute } from "@tanstack/react-router";
import { GameScreen } from "../modules/game/GameScreen";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "URRO — Partida em andamento" },
      {
        name: "description",
        content: "Mesa da partida do URRO: deck, cartas na mão, emotes e o botão URRO para a última carta.",
      },
      { property: "og:title", content: "URRO — Partida em andamento" },
      {
        property: "og:description",
        content: "Mesa da partida do URRO: deck, cartas na mão, emotes e o botão URRO para a última carta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GameScreen,
});