import { createFileRoute } from "@tanstack/react-router";
import { GameScreen } from "../modules/game/GameScreen";
import { ProtectedRoute } from "../shared/components/ProtectedRoute";

export const Route = createFileRoute("/game")({
  component: () => (
    <ProtectedRoute>
      <GameScreen />
    </ProtectedRoute>
  ),
});