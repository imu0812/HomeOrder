import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>登入</CardTitle>
          <CardDescription>第一版先保留登入入口，正式驗證會接在 auth service。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">帳號</Label>
              <Input id="username" defaultValue="admin" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密碼</Label>
              <Input id="password" type="password" defaultValue="password" />
            </div>
            <Button asChild>
              <Link href="/dashboard">進入系統</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
