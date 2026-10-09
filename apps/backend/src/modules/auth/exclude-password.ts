import type { UserResponseDto } from './dto/auth-response.dto';

/** The account as the API returns it: never with its password hash. */
export function excludePassword(
  user: Record<string, unknown>,
): UserResponseDto {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe as unknown as UserResponseDto;
}
