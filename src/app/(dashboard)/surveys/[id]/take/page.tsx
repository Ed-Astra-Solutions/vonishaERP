"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useSurveyStore } from "@/stores/surveys";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

export default function TakeSurveyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const survey = useSurveyStore((s) => s.get(id));
  const recordResponse = useSurveyStore((s) => s.recordResponse);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [done, setDone] = useState(false);

  if (!survey) {
    return (
      <EmptyState
        title="Survey not found"
        description="This survey may have been removed."
        action={<Button onClick={() => router.push("/surveys")}>Back to surveys</Button>}
      />
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center p-10 text-center">
            <CheckCircle2 className="size-12 text-emerald-500" />
            <h2 className="mt-4 text-xl font-semibold">Thank you!</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Your response has been recorded.</p>
            <Button className="mt-6" onClick={() => router.push("/surveys")}>Back to surveys</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function submit() {
    const missing = survey!.questions.filter(
      (q) => q.required && !answers[q.id]?.length,
    );
    if (missing.length > 0) {
      toast.error("Please answer all required questions");
      return;
    }
    recordResponse(survey!.id);
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={survey.title} description={survey.description} />
      <div className="space-y-4">
        {survey.questions.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="space-y-3 pt-6">
              <Label className="text-sm font-medium">
                {i + 1}. {q.label}
                {q.required && <span className="ml-1 text-destructive">*</span>}
              </Label>

              {q.type === "short" && (
                <Input onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
              )}
              {q.type === "paragraph" && (
                <Textarea rows={3} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
              )}
              {q.type === "date" && (
                <Input type="date" onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
              )}
              {q.type === "single" && (
                <div className="space-y-2">
                  {(q.options ?? []).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={q.id}
                        className="accent-primary"
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "multi" && (
                <div className="space-y-2">
                  {(q.options ?? []).map((opt) => {
                    const current = (answers[q.id] as string[]) ?? [];
                    return (
                      <label key={opt} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={current.includes(opt)}
                          onCheckedChange={(v) =>
                            setAnswers((a) => {
                              const arr = (a[q.id] as string[]) ?? [];
                              return {
                                ...a,
                                [q.id]: v ? [...arr, opt] : arr.filter((o) => o !== opt),
                              };
                            })
                          }
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/surveys")}>Cancel</Button>
        <Button onClick={submit}>Submit response</Button>
      </div>
    </div>
  );
}
