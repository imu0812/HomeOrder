import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepositories } from "@/repositories/provider";

export default async function DashboardPage() {
  const repos = getRepositories();
  const [orders, productInventory, packagingInventory] = await Promise.all([
    repos.orders.listOrders(),
    repos.inventory.listProductInventory(),
    repos.inventory.listPackagingInventory()
  ]);
  const lowProducts = productInventory.filter((item) => item.availableStock <= 10).length;
  const lowPackagings = packagingInventory.filter((item) => item.availableStock <= 5).length;

  return (
    <div className="grid gap-6">
      <Alert>
        <AlertTitle>第一輪 MVP</AlertTitle>
        <AlertDescription>資料目前來自 mock repository；Google Sheets repository 已預留 stub。</AlertDescription>
      </Alert>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>訂單數</CardDescription>
            <CardTitle>{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>商品低庫存</CardDescription>
            <CardTitle>{lowProducts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>包材低庫存</CardDescription>
            <CardTitle>{lowPackagings}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>常用操作</CardTitle>
          <CardDescription>第一版以訂單預留流程為核心。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/orders/new">建立訂單</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/orders">查看訂單</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/inventory/products">查看可用庫存</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
