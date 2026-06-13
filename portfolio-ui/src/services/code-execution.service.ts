/**
 * Code Execution Service
 * 
 * Handles sandboxed code execution
 */

import { httpClient } from '@/lib/http-client';
import type { CodeExecutionData, CodeExecution, ApiResponse } from '@/types/api';

class CodeExecutionService {
  private readonly basePath = '/code';

  /**
   * Execute code
   */
  async execute(data: CodeExecutionData): Promise<ApiResponse<CodeExecution>> {
    return httpClient.post<ApiResponse<CodeExecution>>(
      `${this.basePath}/execute`,
      data,
      { 
        skipAuth: true,
        timeout: 60000, // 60 seconds for code execution
      }
    );
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<ApiResponse<string[]>> {
    return httpClient.get<ApiResponse<string[]>>(
      `${this.basePath}/languages`,
      { skipAuth: true }
    );
  }
}

export const codeExecutionService = new CodeExecutionService();
export default codeExecutionService;
