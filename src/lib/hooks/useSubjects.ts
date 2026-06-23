import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  _count?: { lessons: number; tasks: number };
}

export function useSubjects() {
  return useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => api.get("/api/subjects"),
    retry: false,
  });
}

export function useSubject(id: string) {
  return useQuery<Subject>({
    queryKey: ["subjects", id],
    queryFn: () => api.get(`/api/subjects/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api.post<Subject>("/api/subjects", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Subject) =>
      api.put<Subject>(`/api/subjects/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}
