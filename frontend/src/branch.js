// This file is intentionally hardcoded per git branch (not read from
// .env) so the two branches are visually distinguishable at a glance
// without touching any environment configuration.
//
//   main branch -> BRANCH = "main"        (production look)
//   dev  branch -> BRANCH = "development" (development look)
//
// Do not copy this file between branches — each branch keeps its own
// version intentionally.
export const BRANCH = "main";
export const APP_VERSION = "1.1.0";
