"use client";

import { useState } from "react";
import { Archive, RotateCcw, Search, FileText } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ArchivedRecord {
  id: string;
  title: string;
  type: string;
  archivedOn: string;
  archivedBy: string;
}

// Local archive (archives_desk.dart had no server calls).
const SEED: ArchivedRecord[] = [
  { id: "R1", title: "Ex-employee: Kavya R", type: "Staff Record", archivedOn: "12 May 2026", archivedBy: "Admin" },
  { id: "R2", title: "2025 Attendance Register", type: "Attendance", archivedOn: "01 Jan 2026", archivedBy: "System" },
  { id: "R3", title: "Old Fee Structure 2024", type: "Document", archivedOn: "15 Apr 2026", archivedBy: "Admin" },
  { id: "R4", title: "Graduated batch 2025", type: "Student Record", archivedOn: "30 Jun 2026", archivedBy: "Admin" },
];

export default function ArchivesPage() {
  const [records, setRecords] = useState<ArchivedRecord[]>(SEED);
  const [query, setQuery] = useState("");

  const filtered = records.filter(
    (r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.type.toLowerCase().includes(query.toLowerCase()),
  );

  function restore(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.success("Record restored");
  }

  return (
    <div>
      <PageHeader title="Archives" description="Archived records and history." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Archived Records" value={records.length} icon={Archive} tone="info" />
        <StatCard label="Record Types" value={new Set(records.map((r) => r.type)).size} icon={FileText} tone="default" />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 max-w-xs">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search archives" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Archive} title="No archived records" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Archived on</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell><Badge variant="secondary">{r.type}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{r.archivedOn}</TableCell>
                      <TableCell className="text-muted-foreground">{r.archivedBy}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => restore(r.id)}>
                          <RotateCcw className="size-4" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
