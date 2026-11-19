import * as React from "react";

import { cn } from "@dashboard/lib/utils";

// One table style for the whole app: 44px rows, hairline row dividers drawn as inset shadows,
// no column rules, 12px semibold headers, and a light hover fill on clickable rows. The table sits
// 12px wider than its column on each side, so the hover fill has room around the text while the
// text still lines up with the page title; the fill's ends are softly rounded.
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative -mx-3 overflow-x-auto">
    <table ref={ref} className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn(className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn(className)} {...props} />,
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn("shadow-[inset_0_-1px_0_hsl(var(--divider))] data-[state=selected]:bg-primary/5", className)}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn("h-9 whitespace-nowrap px-3 text-left align-middle text-xs font-medium text-subdued", className)}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("h-11 px-3 py-2 align-middle text-foreground transition-colors first:rounded-l-md last:rounded-r-md [tbody_tr:hover>&]:bg-secondary", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
