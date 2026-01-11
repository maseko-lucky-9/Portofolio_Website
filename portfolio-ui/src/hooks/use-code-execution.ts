/**
 * Code Execution Hook
 * 
 * React Query hooks for code execution
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { codeExecutionService } from '@/services/code-execution.service';
import { queryKeys } from '@/lib/react-query';
import type { CodeExecutionData } from '@/types/api';

/**
 * Get supported languages
 */
export function useSupportedLanguages() {
  return useQuery({
    queryKey: queryKeys.codeExecution.languages(),
    queryFn: () => codeExecutionService.getSupportedLanguages(),
    staleTime: Infinity, // Languages don't change
  });
}

/**
 * Execute code
 */
export function useCodeExecution() {
  return useMutation({
    mutationFn: (data: CodeExecutionData) => codeExecutionService.execute(data),
    onError: () => {
      toast.error('Code execution failed');
    },
  });
}
