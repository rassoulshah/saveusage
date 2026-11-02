import type { ContextPilotConfig } from "./config.js";

export type TaskKind =
  | "simple"
  | "codebase-question"
  | "implementation"
  | "debugging"
  | "review";

export interface RetrievalPlan {
  useGraphify: boolean;
  budget: number;
  skeletonFirst: boolean;
  expandOnlyRelevantSymbols: boolean;
  preserve: string[];
  avoid: string[];
}

export function createRetrievalPlan(
  config: ContextPilotConfig,
  task: TaskKind
): RetrievalPlan {
  const complex = ["implementation", "debugging", "review"].includes(task);
  const useGraphify = config.graphify.enabled && task !== "simple";

  return {
    useGraphify,
    budget: complex
      ? Math.min(
          config.graphify.max_budget,
          Math.max(config.graphify.default_budget, 3500)
        )
      : config.graphify.default_budget,
    skeletonFirst: config.graphify.skeleton_first,
    expandOnlyRelevantSymbols: true,
    preserve: [
      ...(config.optimization.preserve_reasoning
        ? ["reasoning needed to justify decisions"]
        : []),
      ...(config.optimization.preserve_errors
        ? ["exact error messages, stack traces, and failure evidence"]
        : []),
      ...(config.optimization.preserve_requirements
        ? ["user requirements and acceptance criteria"]
        : []),
      ...(config.optimization.preserve_security_constraints
        ? ["security constraints, secrets-handling rules, and authorization boundaries"]
        : [])
    ],
    avoid: [
      "loading entire repositories when targeted retrieval is sufficient",
      "repeating already-known context",
      "compressing away uncertainty, caveats, or test evidence",
      "changing provider, model, gateway, credentials, or unrelated application settings"
    ]
  };
}

export function formatPlan(plan: RetrievalPlan): string {
  return [
    `Graphify: ${plan.useGraphify ? "use" : "skip"}`,
    `Initial retrieval budget: ${plan.budget} tokens`,
    `Skeleton first: ${plan.skeletonFirst}`,
    `Expand only relevant symbols: ${plan.expandOnlyRelevantSymbols}`,
    "Preserve:",
    ...plan.preserve.map((item) => `- ${item}`),
    "Avoid:",
    ...plan.avoid.map((item) => `- ${item}`)
  ].join("\n");
}
