import type { ILogObj } from "tslog";
import { Logger } from "tslog";

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVEL_MAP: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

interface LoggerOptions {
  name?: string;
  minLevel?: LogLevel | number;
  prettyLog?: boolean;
  prettyErrorTemplate?: string;
  prettyErrorStackTemplate?: string;
  prettyErrorParentNamesSeparator?: string;
  prettyErrorLoggerNameDelimiter?: string;
  prettyLogTimeZone?: "UTC" | "local";
  stylePrettyLogs?: boolean;
  hideLogPositionForProduction?: boolean;
  attachedTransports?: Array<(logObj: ILogObj) => void>;
}

const isDevelopment = process.env.NODE_ENV !== "production";

function getLogLevelNumber(level: LogLevel | number | undefined): number {
  if (level === undefined) {
    return isDevelopment ? LOG_LEVEL_MAP.debug : LOG_LEVEL_MAP.info;
  }
  if (typeof level === "number") {
    return level;
  }
  return LOG_LEVEL_MAP[level];
}

export class AppLogger {
  private logger: Logger<ILogObj>;

  constructor(options: LoggerOptions = {}) {
    const {
      name = "app",
      minLevel,
      prettyLog = isDevelopment,
      hideLogPositionForProduction = true,
      ...restOptions
    } = options;

    this.logger = new Logger({
      name,
      minLevel: getLogLevelNumber(minLevel),
      type: prettyLog ? "pretty" : "json",
      hideLogPositionForProduction,
      ...restOptions,
    });
  }

  trace(...args: unknown[]): void {
    this.logger.trace(...args);
  }

  debug(...args: unknown[]): void {
    this.logger.debug(...args);
  }

  info(...args: unknown[]): void {
    this.logger.info(...args);
  }

  warn(...args: unknown[]): void {
    this.logger.warn(...args);
  }

  error(...args: unknown[]): void {
    this.logger.error(...args);
  }

  fatal(...args: unknown[]): void {
    this.logger.fatal(...args);
  }

  getLogger(): Logger<ILogObj> {
    return this.logger;
  }
}

export const logger = new AppLogger({
  name: "react-inp-auditor",
});
