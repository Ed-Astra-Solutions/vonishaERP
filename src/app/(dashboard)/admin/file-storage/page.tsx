"use client";

import { useState } from "react";
import { FolderOpen, Folder, FileText, Plus, Upload, HardDrive } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FileNode {
  name: string;
  size: string;
  type: string;
}
interface FolderNode {
  name: string;
  files: FileNode[];
}

// Local file storage browser (file_storage_desk.dart had no server calls).
const SEED: FolderNode[] = [
  { name: "Policies", files: [{ name: "Employee Handbook.pdf", size: "1.2 MB", type: "pdf" }, { name: "Leave Policy.docx", size: "240 KB", type: "doc" }] },
  { name: "Admissions", files: [{ name: "Prospectus 2026.pdf", size: "3.4 MB", type: "pdf" }] },
  { name: "Finance", files: [] },
];

export default function FileStoragePage() {
  const [folders, setFolders] = useState<FolderNode[]>(SEED);
  const [active, setActive] = useState<string | null>(null);

  const current = folders.find((f) => f.name === active);
  const totalFiles = folders.reduce((n, f) => n + f.files.length, 0);

  function addFolder(name: string) {
    if (folders.some((f) => f.name === name)) {
      toast.error("Folder already exists");
      return;
    }
    setFolders((prev) => [...prev, { name, files: [] }]);
    toast.success("Folder created");
  }

  function upload(folder: string, name: string) {
    setFolders((prev) =>
      prev.map((f) => (f.name === folder ? { ...f, files: [...f.files, { name, size: "—", type: name.split(".").pop() ?? "file" }] } : f)),
    );
    toast.success("File uploaded");
  }

  return (
    <div>
      <PageHeader
        title="File Storage"
        description="Upload and organise institutional files."
        actions={<NewFolderDialog onCreate={addFolder} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Folders" value={folders.length} icon={Folder} tone="info" />
        <StatCard label="Files" value={totalFiles} icon={FileText} tone="success" />
        <StatCard label="Storage Used" value="4.8 MB" icon={HardDrive} tone="default" />
      </div>

      {!current ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {folders.map((f) => (
            <button
              key={f.name}
              onClick={() => setActive(f.name)}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-center transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <FolderOpen className="size-10 text-primary" />
              <span className="font-medium">{f.name}</span>
              <span className="text-xs text-muted-foreground">{f.files.length} files</span>
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => setActive(null)} className="text-sm text-muted-foreground hover:text-foreground">
                ← All folders
              </button>
              <div className="flex items-center gap-2">
                <span className="font-medium">{current.name}</span>
                <UploadDialog onUpload={(name) => upload(current.name, name)} />
              </div>
            </div>
            {current.files.length === 0 ? (
              <EmptyState icon={Upload} title="Empty folder" description="Upload files to this folder." />
            ) : (
              <ul className="divide-y">
                {current.files.map((file, i) => (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <FileText className="size-5 text-muted-foreground" />
                    <span className="flex-1 font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NewFolderDialog({ onCreate }: { onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> New folder
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create folder</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Folder name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={() => { if (name.trim()) { onCreate(name.trim()); setName(""); setOpen(false); } }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({ onUpload }: { onUpload: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Upload className="size-4" /> Upload
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload file</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2">
          <Label>File name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="document.pdf" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={() => { if (name.trim()) { onUpload(name.trim()); setName(""); setOpen(false); } }}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
