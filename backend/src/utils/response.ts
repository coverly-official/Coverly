import type { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message: string = "Operation completed successfully.",
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  });
}

export function sendError(
  res: Response,
  message: string = "An unexpected error occurred.",
  statusCode: number = 500,
  code?: string,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(code ? { code } : {}),
    ...(details ? { details } : {}),
  });
}
