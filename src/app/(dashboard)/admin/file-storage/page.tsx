"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Download,
  FileText,
  Film,
  FolderOpen,
  HardDrive,
  ImageIcon,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AuthService } from "@/lib/api/auth";
import { isErr } from "@/lib/api/client";
import { getToken } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { useUserStore } from "@/stores/user";
import {
  type MediaKind,
  type MediaPurpose,
  fileDisplayName,
  formatBytes,
  mediaPurposeLabel,
} from "@/types/media";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// One stored object as the server reports it, with the record that owns it.
interface StoredFile {
  key: string;
  kind?: MediaKind;
  purpose: MediaPurpose;
  contentType?: string;
  size?: number;
  originalName?: string;
  uploadedByEmail?: string;
  uploadedAt?: string;
  module: "staff" | "asset" | "inventory";
  folder: string;
  ownerId: string;
  ownerName: string;
  ownerGroup: string;
}

const FOLDER_ICON: Record<string, typeof Users> = {
  Staff: Users,
  Assets: Boxes,
  Inventory: Package,
};

/**
 * Admin file storage — every file the ERP holds, in one place.
 *
 * Files are never uploaded here: they arrive attached to the record that needs them
 * (a staff member's Aadhaar, an asset invoice) and this view is the administrative
 * index across all of them. Deleting from here detaches the file from its record and
 * removes the object from S3 once nothing else references it.
 *
 * Admin only — the endpoint enforces it too, so a direct call gains nothing.
 */
export default function FileStoragePage() {
  const user = useUserStore((s) => s.user);
  const canDelete = can(user, "file_storage", "edit");
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<StoredFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await AuthService.getFileStorage(getToken() ?? "");
    if (isErr(res)) {
      setError("Connection Error");
      setLoading(false);
      return;
    }
    const body = res.data as { success?: boolean; msg?: string; data?: StoredFile[] };
    if (!body.success) {
      setError(body.msg ?? "Could not load file storage");
      setLoading(false);
      return;
    }
    setError(null);
    setFiles(body.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!can(user, "file_storage")) {
      setDenied(true);
      setLoading(false);
      return;
    }
    reload();
  }, [reload, user]);

  const folders = useMemo(() => {
    const map = new Map<string, { count: number; size: number }>();
    for (const f of files) {
      const entry = map.get(f.folder) ?? { count: 0, size: 0 };
      entry.count += 1;
      entry.size += f.size ?? 0;
      map.set(f.folder, entry);
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [files]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      if (folder && f.folder !== folder) return false;
      if (!q) return true;
      return (
        fileDisplayName(f).toLowerCase().includes(q) ||
        f.ownerName.toLowerCase().includes(q) ||
        f.ownerGroup.toLowerCase().includes(q) ||
        (mediaPurposeLabel[f.purpose] ?? "").toLowerCase().includes(q)
      );
    });
  }, [files, folder, query]);

  const totalSize = useMemo(() => files.reduce((n, f) => n + (f.size ?? 0), 0), [files]);

  // Files are viewed through a freshly signed, short-lived URL — the bucket has no
  // public access, so there is no link to copy or share.
  async function open(file: StoredFile, download: boolean) {
    const res = await AuthService.getMediaUrls(getToken() ?? "", [file.key], download);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string; urls?: Record<string, string> };
    const url = body.urls?.[file.key];
    if (!body.success || !url) {
      toast.error(body.msg ?? "Could not open file");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function confirmDelete() {
    if (!pending) return;
    setDeleting(true);
    const res = await AuthService.deleteStoredFile(getToken() ?? "", pending.key);
    setDeleting(false);
    if (isErr(res)) {
      toast.error("Connection Error");
      return;
    }
    const body = res.data as { success?: boolean; msg?: string };
    if (!body.success) {
      toast.error(body.msg ?? "Could not delete file");
      return;
    }
    toast.success(body.msg ?? "File deleted");
    setFiles((prev) => prev.filter((f) => f.key !== pending.key));
    setPending(null);
  }

  if (denied) {
    return (
      <div>
        <PageHeader title="File Storage" description="Every file the ERP holds." />
        <EmptyState
          icon={ShieldAlert}
          title="Admins only"
          description="File storage spans staff paperwork and finance records, so access is restricted to administrators."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="File Storage"
        description="Every file attached to staff, assets and inventory records."
        actions={
          <Button variant="outline" onClick={reload} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Refresh
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Folders" value={folders.length} icon={FolderOpen} tone="info" />
        <StatCard label="Files" value={files.length} icon={FileText} tone="success" />
        <StatCard label="Storage Used" value={formatBytes(totalSize)} icon={HardDrive} tone="default" />
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading files…
          </CardContent>
        </Card>
      ) : files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No files yet"
          description="Files appear here as they are attached to staff, asset and inventory records."
        />
      ) : (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {folders.map((f) => {
              const Icon = FOLDER_ICON[f.name] ?? FolderOpen;
              const active = folder === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => setFolder(active ? null : f.name)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border p-6 text-center transition-colors hover:bg-accent ${
                    active ? "border-primary bg-accent" : "bg-card hover:border-primary/40"
                  }`}
                >
                  <Icon className="size-10 text-primary" />
                  <span className="font-medium">{f.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {f.count} files · {formatBytes(f.size)}
                  </span>
                </button>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-56 flex-1">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by file, employee, item or type"
                    className="pl-8"
                  />
                </div>
                {folder && (
                  <Button variant="ghost" size="sm" onClick={() => setFolder(null)}>
                    Clear folder filter
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  {visible.length} of {files.length}
                </span>
              </div>

              {visible.length === 0 ? (
                <EmptyState icon={Search} title="No matching files" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Belongs to</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((f) => (
                        <TableRow key={`${f.ownerId}-${f.key}`}>
                          <TableCell>
                            <button
                              onClick={() => open(f, false)}
                              className="flex items-center gap-2 text-left hover:underline"
                            >
                              <KindIcon kind={f.kind} />
                              <span className="max-w-64 truncate font-medium">
                                {fileDisplayName(f)}
                              </span>
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {mediaPurposeLabel[f.purpose] ?? f.purpose}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{f.ownerName}</div>
                            <div className="text-xs text-muted-foreground">
                              {f.folder} · {f.ownerGroup}
                            </div>
                          </TableCell>
                          <TableCell>{formatBytes(f.size)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>{f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : "—"}</div>
                            {f.uploadedByEmail && (
                              <div className="text-xs">{f.uploadedByEmail}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => open(f, true)}>
                              <Download className="size-4" />
                            </Button>
                            {/* Staff Aadhaar is mandatory, so it can only go when the
                                employee record does. The server refuses it too. */}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canDelete || (f.module === "staff" && f.purpose === "aadhaar")}
                              title={
                                f.module === "staff" && f.purpose === "aadhaar"
                                  ? "Aadhaar is mandatory — replace it from the employee record"
                                  : undefined
                              }
                              onClick={() => setPending(f)}
                              aria-label={`Delete ${fileDisplayName(f)}`}
                            >
                              <Trash2 className="size-4 text-destructive" />
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
        </>
      )}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this file?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <p className="font-medium">{pending ? fileDisplayName(pending) : ""}</p>
            <p className="text-muted-foreground">
              It will be detached from <span className="font-medium">{pending?.ownerName}</span> and
              permanently deleted from storage. This cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KindIcon({ kind }: { kind?: MediaKind }) {
  if (kind === "video") return <Film className="size-4 shrink-0 text-muted-foreground" />;
  if (kind === "image") return <ImageIcon className="size-4 shrink-0 text-muted-foreground" />;
  return <FileText className="size-4 shrink-0 text-muted-foreground" />;
}
