import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRepositories } from "@/repositories/provider";

export default async function PackagingsPage() {
  const packagings = await getRepositories().packagings.list();
  return (
    <Card>
      <CardHeader><CardTitle>包裝管理</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>代碼</TableHead>
              <TableHead>名稱</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>組合</TableHead>
              <TableHead>安全庫存</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packagings.map((packaging) => (
              <TableRow key={packaging.packagingId}>
                <TableCell>{packaging.packagingCode}</TableCell>
                <TableCell className="font-medium">{packaging.packagingName}</TableCell>
                <TableCell><Badge variant="outline">{packaging.packagingType}</Badge></TableCell>
                <TableCell>{packaging.isComposite ? "是" : "否"}</TableCell>
                <TableCell>{packaging.safeStock}</TableCell>
                <TableCell><Button variant="outline" size="sm" asChild><Link href={`/packagings/${packaging.packagingId}/bom`}>BOM</Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
