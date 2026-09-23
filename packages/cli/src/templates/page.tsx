import { Desktop } from "@/components/desktop/desktop"
import { IPod } from "@/components/desktop/ipod/ipod"
import { SITE } from "@/content/site"

export default function Page() {
  return <Desktop site={SITE} volume="Your Name HD" ipod={IPod} />
}
