import { createFileRoute } from "@tanstack/react-router";
import { OpportunityPostForm } from "@/components/opportunity-post-form";

export const Route = createFileRoute("/opportunities/new")({
  head: () => ({ meta: [{ title: "Post an opportunity — TEP-TEPE Alumni Network" }] }),
  component: OpportunityPostForm,
});
