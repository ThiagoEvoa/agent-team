# Firebase tool and target verification

Load before any Firebase MCP, emulator, or cloud resource operation. This reference establishes where an operation will run.

Use this profile for service configuration, rules, indexes, Functions, emulator work, or service operations. Client UI/SDK work starts with its application profile and adds Firebase when backend resources/contracts change.

Discover actual Firebase MCP tools and inspect schemas; availability depends on server version and enabled groups. Prefer supported Firebase MCP operations, use local repository/emulator tooling for gaps, and report missing capabilities. Server installation, authentication changes, and MCP configuration are separate operations requiring task authorization. Never read or print credential files.

Inspect `firebase.json`, `.firebaserc`, SDK configuration, rules/index paths, Functions manifests, runtime versions, and emulator settings. Before resource operations establish account, explicit project ID, directory, environment, and relevant app/database/bucket/region. Resolve mismatches before acting. Do not infer production from an alias or switch account/project to make a command pass. Verify each tool's emulator/cloud routing; unknown routing is cloud access even if emulators are running.

Official references: [MCP](https://firebase.google.com/docs/ai-assistance/mcp-server), [CLI](https://firebase.google.com/docs/cli), [Emulators](https://firebase.google.com/docs/emulator-suite). Verify versions and routing rather than assuming defaults.
