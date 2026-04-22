import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRepositories } from "@/repositories/provider";

export default async function PackagingInventoryPage() {
  const repos = getRepositories();
  const [inventory, packagings] = await Promise.all([repos.inventory.listPackagingInventory(), repos.packagings.list()]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>包材庫存</CardTitle>
        <CardDescription>組合包裝不直接扣庫存，會展開到底層包材。</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>包材</TableHead>
              <TableHead>目前庫存</TableHead>
              <TableHead>已預留</TableHead>
              <TableHead>可用庫存</TableHead>
              <TableHead>狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => {
              const packaging = packagings.find((entry) => entry.packagingId === item.packagingId);
              const low = item.availableStock <= (packaging?.safeStock ?? 0);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{packaging?.packagingName}</TableCell>
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
