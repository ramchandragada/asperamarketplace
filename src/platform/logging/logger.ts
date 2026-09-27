import { readPublicConfig, type LogLevel } from "@/platform/config/env";
import { redact, scrubString } from "@/platform/logging/redact";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LogFields = Record<string, unknown>;

export type LogSink = (level: LogLevel, line: string) => void;

export type Logger = {
  debug: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  error: (message: string, fields?: LogFields) => void;
};

export function createLogger(sink: LogSink, minimum: LogLevel): Logger {
  const write = (level: LogLevel, message: string, fields?: LogFields) => {
    if (LEVEL_RANK[level] < LEVEL_RANK[minimum]) {
      return;
    }
    const safeFields = redact(fields ?? {}) as LogFields;
    const line = JSON.stringify({
      ...safeFields,
      timestamp: new Date().toISOString(),
      level,
      message: scrubString(message),
    });
    sink(level, line);
  };

  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
  };
}

function consoleSink(level: LogLevel, line: string) {
  if (level === "error" || level === "warn") {
    console.error(line);
    return;
  }
  console.log(line);
}

export const logger = createLogger(consoleSink, readPublicConfig().LOG_LEVEL);
