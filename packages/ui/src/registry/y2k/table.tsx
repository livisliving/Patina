"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Patina lists — DESIGN.md › Components › Lists.
 *
 * Table: the Aqua list view — 12px text on white, a 17px header (the
 *   measured list-header rows; the sorted column in the tone, with a triangle
 *   pointing the way it sorts) with hairline column rules, 2px/8px cells,
 *   every other row the pale tone (#edf3fe in aqua), the selected row in the
 *   tone selection.
 * TreeView: a sunken white panel of 18px rows with black disclosure triangles.
 */

/* ── Table ────────────────────────────────────────────────────────── */

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      data-slot="table"
      className={cn("w-full border-collapse bg-white font-(family-name:--y2k-font-ui) text-[12px] leading-[1.6] text-(--y2k-ink)", className)}
      {...props}
    />
  )
}

/* Names follow shadcn/ui's table, so this is a drop-in replacement for it:
   TableHeader is the <thead>, TableHead a header cell. */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={className} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...props} />
}

/** A header cell. Pass `sorted` for the column the list sorts by: it takes
 *  the tone, and a 7×6 triangle 4px from its right edge points up
 *  (ascending) or down. */
function TableHead({ className, sorted, children, ...props }: React.ComponentProps<"th"> & { sorted?: "ascending" | "descending" }) {
  return (
    <th
      data-slot="table-head"
      aria-sort={sorted}
      className={cn(
        "relative h-[17px] px-2 text-left font-normal whitespace-nowrap",
        "shadow-[inset_-1px_0_0_#b4b4b4,inset_0_-1px_0_#a8a8a8]",
        sorted ? "bg-(image:--y2k-tone-listheader-sorted) pr-4" : "bg-(image:--y2k-listheader)",
        className
      )}
      {...props}
    >
      {children}
      {sorted && (
        <svg
          viewBox="0 0 7 6"
          aria-hidden
          className={cn("absolute top-1/2 right-1 h-[6px] w-[7px] -translate-y-1/2", sorted === "descending" && "rotate-180")}
        >
          <path d="M3.5 0L7 6H0z" fill="rgba(0,0,0,0.5)" />
        </svg>
      )}
    </th>
  )
}

/** A row. `onOpen` makes it openable as a list view's rows are: focusable,
 *  opened by a double-click or Return. */
function TableRow({
  className,
  selected,
  onOpen,
  onDoubleClick,
  onKeyDown,
  ...props
}: React.ComponentProps<"tr"> & { selected?: boolean; onOpen?: () => void }) {
  return (
    <tr
      data-slot="table-row"
      aria-selected={selected || undefined}
      tabIndex={onOpen ? 0 : undefined}
      onDoubleClick={(e) => {
        onDoubleClick?.(e)
        onOpen?.()
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.key === "Enter") onOpen?.()
      }}
      className={cn(
        // Every other row the pale tone; the selected row the tone selection.
        "even:bg-(--y2k-tone-zebra) aria-selected:bg-(--y2k-tone-selection) aria-selected:text-(--y2k-tone-selection-text)",
        // A focusable (tabIndex) row shows the ring inside its edge.
        "outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-(--y2k-tone-focus)",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td data-slot="table-cell" className={cn("px-2 py-0.5 whitespace-nowrap", className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("bg-(image:--y2k-listheader) font-bold", className)} {...props} />
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("caption-bottom pt-2 text-[11px] text-(--y2k-ink-secondary)", className)} {...props} />
}

/* ── Tree view ────────────────────────────────────────────────────── */

type TreeNode = { label: React.ReactNode; children?: TreeNode[]; defaultOpen?: boolean }

function TreeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = React.useState(!!node.defaultOpen)
  const folder = !!node.children?.length
  return (
    // A tree view shows structure; nothing in it is selectable.
    <li role="treeitem" aria-selected={false} aria-expanded={folder ? open : undefined} className="leading-[18px]">
      <div className="flex items-center" style={{ paddingLeft: depth * 15 + (folder ? 0 : 12) }}>
        {folder && (
          <button
            type="button"
            aria-label={open ? "Collapse" : "Expand"}
            onClick={() => setOpen((o) => !o)}
            className="mr-[5px] flex size-[7px] shrink-0 cursor-default items-center justify-center outline-none"
          >
            <svg viewBox="0 0 7 9" className={cn("h-[9px] w-[7px] transition-transform", open && "rotate-90")} aria-hidden>
              <path d="M0 0l7 4.5L0 9z" fill="#1a1a1a" />
            </svg>
          </button>
        )}
        <span className="truncate">{node.label}</span>
      </div>
      {folder && open && (
        <ul role="group">
          {node.children!.map((c, i) => (
            <TreeItem key={i} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

function TreeView({ items, className, ...props }: React.ComponentProps<"ul"> & { items: TreeNode[] }) {
  return (
    <ul
      role="tree"
      data-slot="tree-view"
      className={cn(
        "y2k-field px-[6px] py-1 font-(family-name:--y2k-font-ui) text-[13px] text-(--y2k-ink)",
        className
      )}
      {...props}
    >
      {items.map((n, i) => (
        <TreeItem key={i} node={n} depth={0} />
      ))}
    </ul>
  )
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, TreeView, type TreeNode }
