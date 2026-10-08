import { api } from './client';

export interface SurveyOption {
  id: number;
  question_id: number;
  text: string;
}

export type QuestionType = 'single_choice' | 'multi_choice' | 'text';

export interface SurveyQuestion {
  id: number;
  survey_id: number;
  text: string;
  question_type: QuestionType;
  options: SurveyOption[];
}

export interface Survey {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  questions: SurveyQuestion[];
}

export interface QuestionOptionCreate {
  text: string;
}

export interface QuestionCreate {
  text: string;
  question_type: QuestionType;
  options: QuestionOptionCreate[];
}

export interface SurveyCreateDTO {
  title: string;
  description?: string | null;
  is_active?: boolean;
  questions: QuestionCreate[];
}

export interface SingleAnswerSubmit {
  question_id: number;
  option_id?: number;
  text_answer?: string;
}

export function fetchActiveSurveys(): Promise<Survey[]> {
  return api.get<Survey[]>('/api/v1/feedback/surveys');
}

export function createSurvey(dto: SurveyCreateDTO): Promise<Survey> {
  return api.post<Survey>('/api/v1/feedback/surveys', dto);
}

export function updateSurveyActive(id: number, isActive: boolean): Promise<{ message: string }> {
  return api.patch<{ message: string }>(
    `/api/v1/feedback/surveys/${id}?is_active=${isActive}`,
  );
}

export function deleteSurvey(id: number): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/api/v1/feedback/surveys/${id}`);
}

export function submitSurveyAnswers(
  surveyId: number,
  answers: SingleAnswerSubmit[],
): Promise<void> {
  return api.post(`/api/v1/feedback/surveys/${surveyId}/answers`, { answers });
}