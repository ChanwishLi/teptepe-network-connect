import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/opportunities/new")({
  component: () => <Navigate to="/internships/new" replace />,
});
