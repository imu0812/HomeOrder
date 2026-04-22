import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRepositories } from "@/repositories/provider";

export default async function ProductBomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repos = getRepositories();
  const product = await repos.products.findById(id);
  const bomItems = await repos.bom.listProductBom(id);
  const products = await repos.products.list();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product?.productName ?? "商品"} BOM</CardTitle>
        <CardDescription>固定組合商品 confirmed 時會依此展開。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>排序</TableHead>
              <TableHead>子商品</TableHead>
              <TableHead>數量</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bomItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.sortOrder}</TableCell>
                <TableCell>{products.find((child) => child.productId === item.childProductId)?.productName}</TableCell>
                <TableCell>{item.qty}</TableCell>
              </TableRow>
            ))}
            {bomItems.length === 0 && <TableRow><TableCell colSpan={3}>此商品沒有 BOM。</TableCell></TableRow>}
          </TableBody>
        </Table>
        <Button variant="outline" asChild className="w-fit"><Link href="/products">返回商品</Link></Button>
      </CardContent>
    </Card>
  );
}
