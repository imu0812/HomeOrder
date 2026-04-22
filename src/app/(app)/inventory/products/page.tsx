import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRepositories } from "@/repositories/provider";

export default async function ProductInventoryPage() {
  const repos = getRepositories();
  const [inventory, products] = await Promise.all([repos.inventory.listProductInventory(), repos.products.list()]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>商品庫存</CardTitle>
        <CardDescription>availableStock = currentStock - reservedStock</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品</TableHead>
              <TableHead>目前庫存</TableHead>
              <TableHead>已預留</TableHead>
              <TableHead>可用庫存</TableHead>
              <TableHead>狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => {
              const product = products.find((entry) => entry.productId === item.productId);
              const low = item.availableStock <= (product?.safeStock ?? 0);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{product?.productName}</TableCell>
                  <TableCell>{item.currentStock}</TableCell>
                  <TableCell>{item.reservedStock}</TableCell>
                  <TableCell>{item.availableStock}</TableCell>
                  <TableCell><Badge variant={low ? "destructive" : "secondary"}>{low ? "低庫存" : "正常"}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
