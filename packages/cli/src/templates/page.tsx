import type { Metadata } from "next"

import { Desktop } from "@/components/desktop/desktop"
import { IPod } from "@/components/desktop/ipod/ipod"
import { SITE } from "@/content/site"

// The tab, a search result and a shared link say who the site is and what
// they do — "Your Name — What you do" — never the pack's name.
export const metadata: Metadata = {
  title: SITE.person.role ? `${SITE.person.name} — ${SITE.person.role}` : SITE.person.name,
  description: SITE.description,
}

export default function Page() {
  return <Desktop site={SITE} volume="Your Name HD" ipod={IPod} />
}
