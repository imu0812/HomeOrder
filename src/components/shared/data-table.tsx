import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
};

export function DataTable<T>({ columns, rows, emptyText = "沒有資料。" }: { columns: DataTableColumn<T>[]; rows: T[]; emptyText?: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>{columns.map((column) => <TableHead key={column.key}>{column.header}</TableHead>)}</TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>{columns.map((column) => <TableCell key={column.key}>{column.cell(row)}</TableCell>)}</TableRow>
        ))}
        {rows.length === 0 && <TableRow><TableCell colSpan={columns.length}>{emptyText}</TableCell></TableRow>}
      </TableBody>
    </Table>
  );
}
