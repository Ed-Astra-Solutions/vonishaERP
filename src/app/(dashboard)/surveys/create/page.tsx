"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useSurveyStore, type QuestionType, type SurveyQuestion } from "@/stores/surveys";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_LABELS: Record<QuestionType, string> = {
  short: "Short answer",
  paragraph: "Paragraph",
  single: "Single choice",
  multi: "Multiple choice",
  date: "Date",
};

let qid = 0;

export default function CreateSurveyPage() {
  const router = useRouter();
  const add = useSurveyStore((s) => s.add);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { id: `nq${qid++}`, label: "", type: "short", required: true },
  ]);

  function addQuestion() {
    setQuestions((q) => [...q, { id: `nq${qid++}`, label: "", type: "short", required: false }]);
  }
  function update(id: string, patch: Partial<SurveyQuestion>) {
    setQuestions((q) => q.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function remove(id: string) {
    setQuestions((q) => q.filter((x) => x.id !== id));
  }

  function publish() {
    if (!title.trim()) {
      toast.error("Give your survey a title");
      return;
    }
    const valid = questions.filter((q) => q.label.trim());
    if (valid.length === 0) {
      toast.error("Add at least one question");
      return;
    }
    add({
      id: `SVY${Date.now()}`,
      title,
      description,
      questions: valid,
      responses: 0,
      createdAt: new Date().toISOString(),
    });
    toast.success("Survey created");
    router.push("/surveys");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Create survey"
        description="Build a survey with a mix of question types."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/surveys")}>Cancel</Button>
            <Button onClick={publish}>Publish</Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Survey title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Staff Satisfaction Survey" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <GripVertical className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Question {i + 1}</CardTitle>
              <Button variant="ghost" size="icon-sm" className="ml-auto text-red-600" onClick={() => remove(q.id)} aria-label="Remove">
                <Trash2 className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input value={q.label} onChange={(e) => update(q.id, { label: e.target.value })} placeholder="Question text" />
              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={q.type} onValueChange={(v) => update(q.id, { type: (v ?? "short") as QuestionType })}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                        <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 pt-5 text-sm">
                  <Switch checked={q.required} onCheckedChange={(v) => update(q.id, { required: v })} />
                  Required
                </label>
              </div>
              {(q.type === "single" || q.type === "multi") && (
                <div className="space-y-2">
                  <Label className="text-xs">Options (comma-separated)</Label>
                  <Input
                    value={(q.options ?? []).join(", ")}
                    onChange={(e) => update(q.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="mt-4 w-full" onClick={addQuestion}>
        <Plus className="size-4" /> Add question
      </Button>
    </div>
  );
}
