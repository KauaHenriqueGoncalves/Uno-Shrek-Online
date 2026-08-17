import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "../modules/lobby/HomeScreen";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "URRO — Menu principal" },
      {
        name: "description",
        content: "Jogue agora, crie ou entre em uma sala do URRO, o jogo de cartas do pântano.",
      },
      { property: "og:title", content: "URRO — Menu principal" },
      {
        property: "og:description",
        content: "Jogue agora, crie ou entre em uma sala do URRO, o jogo de cartas do pântano.",
      },
    ],
  }),
  component: HomeScreen,
});