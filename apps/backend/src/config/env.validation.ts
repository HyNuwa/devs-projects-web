import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsString()
  API_PREFIX: string = 'api/v1';

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsString()
  FRONTEND_URL: string = 'http://localhost:3000';

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsNumber()
  JWT_EXPIRATION: number = 900;

  @IsNumber()
  @Min(1)
  COMMUNITY_WRITE_RATE_LIMIT: number = 6;

  @IsNumber()
  @Min(1000)
  COMMUNITY_WRITE_RATE_TTL_MS: number = 60000;

  @IsNumber()
  @Min(1)
  COMMUNITY_DUPLICATE_WINDOW_DAYS: number = 180;

  @IsString()
  SMTP_HOST: string = 'localhost';

  @IsNumber()
  SMTP_PORT: number = 1025;

  @IsString()
  SMTP_USER: string = '';

  @IsString()
  SMTP_PASS: string = '';

  @IsString()
  FROM_EMAIL: string = 'noreply@devsproject.local';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'unknown error';
        return `  - ${err.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(
      `\n❌ Environment validation failed:\n${errorMessages}\n\n` +
        `Check your .env file against .env.example\n`,
    );
  }

  return validatedConfig;
}
