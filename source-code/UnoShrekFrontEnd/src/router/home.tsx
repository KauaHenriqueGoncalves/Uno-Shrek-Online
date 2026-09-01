import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "../modules/lobby/HomeScreen";
import { ProtectedRoute } from "../shared/components/ProtectedRoute";

export const Route = createFileRoute("/home")({
  component: () => (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  ),
});