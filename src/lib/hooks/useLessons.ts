import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Subject } from "./useSubjects";

export interface Lesson {
  id: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  teacher: string | null;
  subject?: Subject;
}

export function useLessons(dayOfWeek?: number) {
  const params = dayOfWeek !== undefined ? `?dayOfWeek=${dayOfWeek}` : "";
  return useQuery<Lesson[]>({
    queryKey: ["lessons", dayOfWeek],
    queryFn: () => api.get(`/api/lessons${params}`),
    retry: false,
  });
}

export function useLesson(id: string) {
  return useQuery<Lesson>({
    queryKey: ["lessons", id],
    queryFn: () => api.get(`/api/lessons/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      subjectId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      location?: string | null;
      teacher?: string | null;
    }) => api.post<Lesson>("/api/lessons", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Lesson & Partial<{
      subjectId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      location: string | null;
      teacher: string | null;
    }>) => api.put<Lesson>(`/api/lessons/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/lessons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}
