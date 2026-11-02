import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createRetrievalPlan } = await import("../dist/policy.js");

const config = {
  optimization: {
    preserve_reasoning: true,
    preserve_errors: true,
    preserve_requirements: true,
    preserve_security_constraints: true
  },
  graphify: {
    enabled: true,
    default_budget: 2000,
    max_budget: 5000,
    skeleton_first: true
  }
};

test("simple tasks skip Graphify", () => {
  const plan = createRetrievalPlan(config, "simple");
  assert.equal(plan.useGraphify, false);
  assert.equal(plan.budget, 2000);
});

test("implementation tasks use bounded Graphify budget", () => {
  const plan = createRetrievalPlan(config, "implementation");
  assert.equal(plan.useGraphify, true);
  assert.equal(plan.budget, 3500);
  assert.equal(plan.skeletonFirst, true);
});

test("preserves errors, requirements, and security constraints", () => {
  const plan = createRetrievalPlan(config, "debugging");
  assert.ok(plan.preserve.some((x) => x.includes("error messages")));
  assert.ok(plan.preserve.some((x) => x.includes("requirements")));
  assert.ok(plan.preserve.some((x) => x.includes("security")));
});
