import type { Metadata } from "next"

import { Assistant } from "./assistant"

// The page `npx @pat1na/cli init` opens (CONTRACT: the CLI serves it from
// 127.0.0.1 under the setup prefix, with ?t=<token>). Static: the session is
// fetched in the browser, so it exports with the rest of the site.
export const metadata: Metadata = {
  title: "Patina Setup Assistant",
  description: "Six questions about your site, then Patina installs the pack.",
}

export default function SetupPage() {
  return <Assistant />
}
