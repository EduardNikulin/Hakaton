import { api } from './client';

export interface Survey {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  questions: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: number;
  survey_id: number;
  text: string;
  question_type: string;
  options: { id: number; question_id: number; text: string }[];
}

export function fetchActiveSurveys(): Promise<Survey[]> {
  return api.get<Survey[]>('/api/v1/feedback/surveys');
}

export function submitSurveyAnswers(
  surveyId: number,
  answers: { question_id: number; option_id?: number; text_answer?: string }[],
): Promise<void> {
  return api.post(`/api/v1/feedback/surveys/${surveyId}/answers`, { answers });
}