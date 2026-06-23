import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Subject } from "./useSubjects";

export interface Task {
  id: string;
  subjectId: string;
  title: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
  subject?: Subject;
}

export function useTasks(completed?: boolean) {
  const params = completed !== undefined ? `?completed=${completed}` : "";
  return useQuery<Task[]>({
    queryKey: ["tasks", completed],
    queryFn: () => api.get(`/api/tasks${params}`),
  });
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: ["tasks", id],
    queryFn: () => api.get(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      subjectId: string;
      title: string;
      deadline: string;
    }) => api.post<Task>("/api/tasks", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Task & Partial<{
      subjectId: string;
      title: string;
      deadline: string;
      completed: boolean;
    }>) => api.put<Task>(`/api/tasks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
