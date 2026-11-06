import { Miss } from "@/components/Miss";

/** Any address with no page, and every notFound() (a company Scout no longer has, a brief week that never ran). */
export default function NotFound() {
  return <Miss title="Page Not Found">Nothing is at this address. The link may be old, or the startup may no longer be in Scout.</Miss>;
}
