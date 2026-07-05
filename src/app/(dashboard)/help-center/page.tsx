"use client";

import Link from "next/link";
import { LifeBuoy, PlayCircle, Mail, FileText, ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Help topics ported from help_center_desk.dart (each mapped to its tutorial video).
const TOPICS = [
  { title: "Staff Attendance Management", video: "aq0buLcC3tQ" },
  { title: "Staff Manage Users", video: "D9C7v3pJFwk" },
  { title: "Student Manage Users", video: "dcEgsAaEWWU" },
  { title: "Staff Salary Management", video: "G6jp9FXx1oQ" },
  { title: "Time Table Updation", video: "gofiZrwNybw" },
  { title: "Yearly Calendar Updation", video: "ZpHfJMexwnI" },
];

export default function HelpCenterPage() {
  return (
    <div>
      <PageHeader title="Help Center" description="Guides, tutorials and support." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TOPICS.map((t) => (
          <Card key={t.video} className="flex flex-col overflow-hidden">
            <a
              href={`https://www.youtube.com/watch?v=${t.video}`}
              target="_blank"
              rel="noreferrer"
              className="group relative flex aspect-video items-center justify-center bg-muted"
            >
              {/* Thumbnail-less placeholder that respects the CSP / self-contained constraint. */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-indigo-500/10" />
              <PlayCircle className="relative size-12 text-primary transition-transform group-hover:scale-110" />
            </a>
            <CardHeader className="flex-1">
              <CardTitle className="text-base">{t.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                render={
                  <a href={`https://www.youtube.com/watch?v=${t.video}`} target="_blank" rel="noreferrer" />
                }
              >
                Watch tutorial <ExternalLink className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LifeBuoy className="size-5" />
            </div>
            <div>
              <p className="font-medium">Need more help?</p>
              <p className="text-sm text-muted-foreground">
                Reach out to the Ed-Astra support team for academic enquiries.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" render={<a href="mailto:support@edastra.in" />}>
              <Mail className="size-4" /> Contact support
            </Button>
            <Button variant="outline" render={<Link href="/terms" />}>
              <FileText className="size-4" /> Terms & policies
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
