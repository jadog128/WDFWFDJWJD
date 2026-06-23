import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DailyPlan {
  id: string;
  userId: string;
  date: string;
  content: Record<string, unknown>;
}

export function useTodayPlan() {
  return useQuery<DailyPlan>({
    queryKey: ["plan", "today"],
    queryFn: () => api.get("/api/plan/today"),
  });
}

export function useGeneratePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<DailyPlan>("/api/plan/generate", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
