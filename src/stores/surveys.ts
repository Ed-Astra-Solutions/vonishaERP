import { create } from "zustand";

export type QuestionType = "short" | "paragraph" | "single" | "multi" | "date";

export interface SurveyQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options?: string[]; // for single/multi
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  responses: number;
  createdAt: string;
}

interface SurveyState {
  surveys: Survey[];
  add: (s: Survey) => void;
  recordResponse: (id: string) => void;
  get: (id: string) => Survey | undefined;
}

// Local survey store — the Flutter surveys module was UI-only (no server calls).
export const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: [
    {
      id: "SVY001",
      title: "Staff Satisfaction Survey",
      description: "Quarterly feedback from teaching and non-teaching staff.",
      questions: [
        { id: "q1", label: "How satisfied are you with your role?", type: "single", required: true, options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"] },
        { id: "q2", label: "What could we improve?", type: "paragraph", required: false },
      ],
      responses: 12,
      createdAt: "2026-06-20T00:00:00.000Z",
    },
  ],
  add: (s) => set((st) => ({ surveys: [s, ...st.surveys] })),
  recordResponse: (id) =>
    set((st) => ({
      surveys: st.surveys.map((s) => (s.id === id ? { ...s, responses: s.responses + 1 } : s)),
    })),
  get: (id) => get().surveys.find((s) => s.id === id),
}));
