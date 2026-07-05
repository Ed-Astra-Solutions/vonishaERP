"use client";

import Link from "next/link";
import { ListChecks, Plus, Users, ArrowRight } from "lucide-react";

import { useSurveyStore } from "@/stores/surveys";
import { formatDDMMYYYY } from "@/lib/format";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function toDDMMYYYY(iso: string) {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}${m}${y}`;
}

export default function SurveysPage() {
  const surveys = useSurveyStore((s) => s.surveys);
  const totalResponses = surveys.reduce((n, s) => n + s.responses, 0);

  return (
    <div>
      <PageHeader
        title="Surveys"
        description="Create and collect staff feedback."
        actions={
          <Button render={<Link href="/surveys/create" />}>
            <Plus className="size-4" /> Create survey
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Surveys" value={surveys.length} icon={ListChecks} tone="info" />
        <StatCard label="Total Responses" value={totalResponses} icon={Users} tone="success" />
        <StatCard label="Active" value={surveys.length} icon={ListChecks} />
      </div>

      {surveys.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No surveys yet"
          description="Create your first survey to start collecting feedback."
          action={
            <Button render={<Link href="/surveys/create" />}>
              <Plus className="size-4" /> Create survey
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {surveys.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <Badge variant="secondary">{s.questions.length} Qs</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> {s.responses} responses
                  </span>
                  <span>{formatDDMMYYYY(toDDMMYYYY(s.createdAt))}</span>
                </div>
                <div className="mt-4 flex-1" />
                <Button variant="outline" className="w-full" render={<Link href={`/surveys/${s.id}/take`} />}>
                  Open survey <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
