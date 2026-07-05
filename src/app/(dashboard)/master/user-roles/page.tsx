"use client";

import { useState } from "react";
import { UserCog, Shield, Check } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RoleType = "Admin" | "Master Admin" | "Faculty";
interface RoleUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  active: boolean;
}

const PERMISSIONS = ["Manage Users", "View Analytics", "Approve Requests", "Manage Payroll", "Edit Documents"];

// Default permission matrix per role type.
const ROLE_PERMS: Record<RoleType, boolean[]> = {
  Admin: [true, false, false, true, true],
  "Master Admin": [true, true, true, true, true],
  Faculty: [false, false, false, false, true],
};

// Local role directory (user_roles_desk.dart had no server calls).
const SEED: RoleUser[] = [
  { id: "U1", name: "Srinidhi N", email: "srinidhi@vonisha.org", role: "Master Admin", active: true },
  { id: "U2", name: "Ramesh S", email: "ramesh@vonisha.org", role: "Admin", active: true },
  { id: "U3", name: "Anitha K", email: "anitha@vonisha.org", role: "Faculty", active: true },
  { id: "U4", name: "Deepa N", email: "deepa@vonisha.org", role: "Faculty", active: false },
];

const FILTERS: RoleType[] = ["Admin", "Master Admin", "Faculty"];

export default function UserRolesPage() {
  const [users, setUsers] = useState<RoleUser[]>(SEED);
  const [perms, setPerms] = useState<Record<RoleType, boolean[]>>(ROLE_PERMS);

  function toggleActive(id: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
  }
  function togglePerm(role: RoleType, i: number) {
    setPerms((prev) => ({ ...prev, [role]: prev[role].map((p, j) => (j === i ? !p : p)) }));
    toast.success("Permissions updated");
  }

  return (
    <div>
      <PageHeader title="User Roles" description="Roles, permissions and access control." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={users.length} icon={UserCog} tone="info" />
        <StatCard label="Active" value={users.filter((u) => u.active).length} icon={Check} tone="success" />
        <StatCard label="Roles" value={FILTERS.length} icon={Shield} tone="default" />
      </div>

      <Tabs defaultValue="Admin">
        <TabsList>
          {FILTERS.map((r) => <TabsTrigger key={r} value={r}>{r}</TabsTrigger>)}
        </TabsList>
        {FILTERS.map((role) => (
          <TabsContent key={role} value={role}>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.filter((u) => u.role === role).map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell className="text-muted-foreground">{u.email}</TableCell>
                            <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Switch checked={u.active} onCheckedChange={() => toggleActive(u.id)} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold">
                    <Shield className="size-4 text-primary" /> {role} permissions
                  </h3>
                  <ul className="space-y-3">
                    {PERMISSIONS.map((p, i) => (
                      <li key={p} className="flex items-center justify-between text-sm">
                        <span>{p}</span>
                        <Switch checked={perms[role][i]} onCheckedChange={() => togglePerm(role, i)} />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
