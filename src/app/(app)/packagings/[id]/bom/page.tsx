import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRepositories } from "@/repositories/provider";

export default async function PackagingBomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repos = getRepositories();
  const packaging = await repos.packagings.findById(id);
  const bomItems = await repos.bom.listPackagingBom(id);
  const packagings = await repos.packagings.list();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{packaging?.packagingName ?? "包裝"} BOM</CardTitle>
        <CardDescription>組合包裝 confirmed 時會依此展開。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>排序</TableHead>
              <TableHead>子包材</TableHead>
              <TableHead>數量</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bomItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.sortOrder}</TableCell>
                <TableCell>{packagings.find((child) => child.packagingId === item.childPackagingId)?.packagingName}</TableCell>
                <TableCell>{item.qty}</TableCell>
              </TableRow>
            ))}
            {bomItems.length === 0 && <TableRow><TableCell colSpan={3}>此包裝沒有 BOM。</TableCell></TableRow>}
          </TableBody>
        </Table>
        <Button variant="outline" asChild className="w-fit"><Link href="/packagings">返回包裝</Link></Button>
      </CardContent>
    </Card>
  );
}
