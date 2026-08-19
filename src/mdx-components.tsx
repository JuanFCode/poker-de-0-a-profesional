import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Callout } from "@/components/callout";
import { TableDiagram, TableExplorer } from "@/components/table-explorer";

/**
 * Componentes globales de MDX. `Callout`, `Mesa` y `MesaDiagrama` están
 * disponibles en todas las lecciones sin importarlos, y los enlaces internos
 * usan el router de Next.
 */
const components: MDXComponents = {
  Callout,
  /** Mesa interactiva: te sientas donde quieras y te cuenta qué significa esa silla. */
  Mesa: TableExplorer,
  /** Mesa de solo lectura para ilustrar una posición concreta. */
  MesaDiagrama: TableDiagram,
  a: ({ href, children, ...props }) => {
    const target = typeof href === "string" ? href : "";
    if (target.startsWith("/")) {
      return (
        <Link href={target} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={target} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
  table: ({ children, ...props }) => (
    <div className="not-prose my-7 overflow-x-auto rounded-lg border border-brass-500/15">
      <table className="w-full border-collapse text-left font-mono text-[13px]" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border-b border-brass-500/25 bg-felt-850/80 px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-brass-300"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-b border-brass-500/10 px-4 py-2.5 align-top text-cream-dim" {...props}>
      {children}
    </td>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
