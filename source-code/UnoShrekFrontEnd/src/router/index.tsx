import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "../modules/auth/AuthScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "URRO — Entrar ou criar conta" },
      {
        name: "description",
        content:
          "Faça login ou crie sua conta no URRO, o jogo de cartas multiplayer do pântano.",
      },
      { property: "og:title", content: "URRO — Entrar ou criar conta" },
      {
        property: "og:description",
        content:
          "Faça login ou crie sua conta no URRO, o jogo de cartas multiplayer do pântano.",
      },
    ],
  }),
  component: AuthScreen,
});
