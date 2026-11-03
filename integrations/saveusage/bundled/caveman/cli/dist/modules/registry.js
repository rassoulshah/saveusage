// Caveman modules: the things a developer switches on and off with
// `caveman on|off <module>`. One entry per module; onboarding, status,
// doctor and the signed modules.json all read this table.
//
// Every module is on by default in onboarding. A module that cannot run yet
// (routing before Cloud answers) still shows, with its reason.
// Auto: the model the routing module adds to an agent's model picker.
// caveman-proxy asks Caveman Cloud only about requests naming it
// (proxy/internal/gateway/route.go AutoModel); every other model goes as sent.
export const AUTO_MODEL = "caveman-auto";
export const AUTO_NAME = "Auto";
export const AUTO_DESCRIPTION = "Caveman pick model + effort each turn. Hard ask, big brain. Easy ask, save rocks.";
export const MODULES = [
    {
        id: "output",
        title: "output",
        summary: "the agent says less",
        defaultOn: true,
        needsSignIn: false,
        wiresAgents: true,
        capabilities: [{ key: "think.core", on: true, off: false }],
        binaries: ["caveman-proxy", "caveman-mcp"],
    },
    {
        id: "input",
        title: "input",
        summary: "logs, JSON, code and diffs shrink before the model reads them",
        defaultOn: true,
        needsSignIn: false,
        wiresAgents: true,
        capabilities: [
            { key: "think.mode", on: "compress", off: "record" },
            { key: "think.toon", on: true, off: false },
            { key: "think.shrink", on: true, off: false },
        ],
        binaries: ["caveman-proxy", "caveman-engine", "caveman-mcp", "cavemem", "caveman-shrink"],
    },
    {
        id: "waste-fixes",
        title: "waste fixes",
        summary: "finds your agent's worst waste and fixes it",
        defaultOn: true,
        needsSignIn: false,
        wiresAgents: true,
        // The learn autopilot the native SessionEnd hook starts. caveman-proxy's
        // prompt-cache warming reads `modules["waste-fixes"]` itself (off only
        // when false), so no capability key carries it.
        capabilities: [{ key: "learnAutopilot", on: true, off: false }],
        binaries: ["caveman-proxy", "caveman-mcp"],
    },
    {
        id: "routing",
        title: "routing",
        // The onboarding picker cuts hints at the terminal width (62 characters at
        // 80 columns): what leaves the machine comes first.
        summary: "asks to Auto go to Cloud to pick model + effort",
        defaultOn: true,
        // Adds Auto (AUTO_MODEL) to each wired agent's model picker; only
        // requests naming it are routed. Decisions come from Cloud (POST
        // /v1/route), so it acts only once signed in; caveman-proxy's route stage
        // reads `modules.routing` itself, so no capability key carries it.
        needsSignIn: true,
        wiresAgents: true,
        capabilities: [],
        binaries: ["caveman-proxy", "caveman-mcp"],
    },
    {
        id: "scripts",
        title: "scripts",
        summary: "reusable scripts your agent keeps",
        defaultOn: true,
        needsSignIn: false,
        wiresAgents: false,
        capabilities: [],
        binaries: [],
        external: {
            binary: "caveman-blocks",
            install: ["hooks", "install"],
            uninstall: ["hooks", "uninstall"],
            status: ["hooks", "status", "--json"],
        },
    },
    {
        id: "browse",
        title: "browse",
        summary: "compressed pages for browser tools",
        defaultOn: true,
        needsSignIn: false,
        wiresAgents: false,
        capabilities: [{ key: "execute.browse_tool", on: true, off: false }],
        binaries: ["caveman-browse"],
    },
];
export function findModule(id) {
    return MODULES.find((m) => m.id === id);
}
