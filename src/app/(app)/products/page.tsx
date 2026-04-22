import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRepositories } from "@/repositories/provider";

export default async function ProductsPage() {
  const products = await getRepositories().products.list();
  return (
    <Card>
      <CardHeader>
        <CardTitle>商品管理</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>代碼</TableHead>
              <TableHead>名稱</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>售價</TableHead>
              <TableHead>安全庫存</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.productId}>
                <TableCell>{product.productCode}</TableCell>
                <TableCell className="font-medium">{product.productName}</TableCell>
                <TableCell><Badge variant="outline">{product.productType}</Badge></TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.safeStock}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/products/${product.productId}/bom`}>BOM</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
