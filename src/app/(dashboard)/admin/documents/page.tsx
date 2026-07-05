"use client";

import { useMemo, useState } from "react";
import { FileText, Plus, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";

import {
  DocumentCategory,
  DocumentPermission,
  documentCategoryLabel,
  documentPermissionLabel,
  type ERPDocument,
} from "@/types/erp";
import { formatDDMMYYYY } from "@/lib/format";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEED: ERPDocument[] = [
  { id: "D1", title: "Employee Handbook 2026", category: DocumentCategory.policy, googleDriveUrl: "https://docs.google.com/document/d/abc123", uploadedBy: "Admin", uploadedAt: "2026-01-01T00:00:00.000Z", lastModified: "2026-02-10T00:00:00.000Z", sharedWith: ["All Staff"], defaultPermission: DocumentPermission.viewOnly, description: "Complete employee handbook with policies and procedures", fileType: "doc" },
  { id: "D2", title: "Leave Application Template", category: DocumentCategory.template, uploadedBy: "HR", uploadedAt: "2026-02-01T00:00:00.000Z", sharedWith: ["All Staff"], defaultPermission: DocumentPermission.edit, description: "Standard leave application form", fileType: "doc" },
  { id: "D3", title: "Monthly Attendance Report", category: DocumentCategory.report, uploadedBy: "Admin", uploadedAt: "2026-06-30T00:00:00.000Z", sharedWith: ["Management"], defaultPermission: DocumentPermission.viewOnly, description: "June 2026 attendance summary", fileType: "sheet" },
  { id: "D4", title: "Fire Safety Certificate", category: DocumentCategory.certificate, uploadedBy: "Admin", uploadedAt: "2026-03-15T00:00:00.000Z", sharedWith: ["Management"], defaultPermission: DocumentPermission.admin, description: "Annual fire safety compliance certificate", fileType: "pdf" },
];

const PERM_VARIANT: Record<DocumentPermission, "default" | "secondary" | "outline"> = {
  [DocumentPermission.viewOnly]: "outline",
  [DocumentPermission.edit]: "secondary",
  [DocumentPermission.admin]: "default",
};

const CATEGORY_TABS: (DocumentCategory | "all")[] = [
  "all",
  DocumentCategory.policy,
  DocumentCategory.template,
  DocumentCategory.report,
  DocumentCategory.certificate,
];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<ERPDocument[]>(SEED);

  const stats = useMemo(
    () => ({
      total: docs.length,
      shared: docs.filter((d) => d.sharedWith.length > 0).length,
      policies: docs.filter((d) => d.category === DocumentCategory.policy).length,
    }),
    [docs],
  );

  function addDoc(title: string, category: DocumentCategory, permission: DocumentPermission, url: string, description: string) {
    setDocs((prev) => [
      {
        id: `D${Date.now()}`,
        title, category,
        googleDriveUrl: url || undefined,
        uploadedBy: "You",
        uploadedAt: new Date().toISOString(),
        sharedWith: [],
        defaultPermission: permission,
        description,
        fileType: "doc",
      },
      ...prev,
    ]);
    toast.success("Document added");
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Policies, templates, reports and certificates."
        actions={<AddDocDialog onAdd={addDoc} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Documents" value={stats.total} icon={FileText} tone="info" />
        <StatCard label="Shared" value={stats.shared} icon={Share2} tone="success" />
        <StatCard label="Policies" value={stats.policies} icon={FileText} tone="default" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {CATEGORY_TABS.map((c) => (
            <TabsTrigger key={String(c)} value={String(c)}>
              {c === "all" ? "All" : documentCategoryLabel[c]}
            </TabsTrigger>
          ))}
        </TabsList>
        {CATEGORY_TABS.map((c) => {
          const rows = c === "all" ? docs : docs.filter((d) => d.category === c);
          return (
            <TabsContent key={String(c)} value={String(c)}>
              {rows.length === 0 ? (
                <EmptyState icon={FileText} title="No documents" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {rows.map((d) => (
                    <Card key={d.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{d.title}</CardTitle>
                          <Badge variant="secondary">{documentCategoryLabel[d.category]}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col">
                        <p className="line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>By {d.uploadedBy}</span>·
                          <span>{formatDDMMYYYY(d.uploadedAt.slice(0, 10).split("-").reverse().join(""))}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <Badge variant={PERM_VARIANT[d.defaultPermission]}>
                            {documentPermissionLabel[d.defaultPermission]}
                          </Badge>
                          {d.googleDriveUrl && (
                            <a
                              href={d.googleDriveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              Open <ExternalLink className="size-3.5" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function AddDocDialog({
  onAdd,
}: {
  onAdd: (title: string, category: DocumentCategory, permission: DocumentPermission, url: string, description: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(String(DocumentCategory.policy));
  const [permission, setPermission] = useState(String(DocumentPermission.viewOnly));
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  function submit() {
    if (!title.trim()) {
      toast.error("Enter a document title");
      return;
    }
    onAdd(title, Number(category) as DocumentCategory, Number(permission) as DocumentPermission, url, description);
    setOpen(false);
    setTitle(""); setUrl(""); setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Add document
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add document</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentCategory).filter((v) => typeof v === "number").map((v) => (
                    <SelectItem key={v} value={String(v)}>{documentCategoryLabel[v as DocumentCategory]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permission</Label>
              <Select value={permission} onValueChange={(v) => setPermission(v ?? permission)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentPermission).filter((v) => typeof v === "number").map((v) => (
                    <SelectItem key={v} value={String(v)}>{documentPermissionLabel[v as DocumentPermission]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Google Drive URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={submit}>Add document</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
