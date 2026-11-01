import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
// Optional means absent, never null. Do not enable implicit conversion for text/booleans.
export const OptionalField = () =>
  ValidateIf((_object, value: unknown) => value !== undefined);
export class PageDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;
  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
export class SubjectDto {
  @ApiProperty() @Trim() @IsString() @Length(1, 150) name: string;
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(1, 20)
  code?: string;
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(0, 5000)
  description?: string;
}
export class UpdateSubjectDto {
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(1, 150)
  name?: string;
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(1, 20)
  code?: string;
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(0, 5000)
  description?: string;
}
export class CareerDto {
  @ApiProperty() @Trim() @IsString() @Length(1, 150) name: string;
  @ApiProperty() @Trim() @IsString() @Length(1, 30) code: string;
}
export class StudyPlanDto extends CareerDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() careerId: string;
}
export class LinkStudyPlanDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() studyPlanId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(20) year: number;
  @ApiProperty() @IsInt() @Min(1) @Max(2) semester: number;
  @ApiPropertyOptional()
  @OptionalField()
  @IsInt()
  @Min(1)
  @Max(32767)
  credits?: number;
}
export class CreateCourseDto {
  @ApiProperty() @Trim() @IsString() @Length(1, 200) title: string;
  @ApiProperty() @Trim() @IsString() @Length(1, 5000) description: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @OptionalField()
  @IsUUID()
  subjectId?: string;
}
export class UpdateCourseDto {
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(1, 200)
  title?: string;
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(1, 5000)
  description?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @OptionalField()
  @IsUUID()
  subjectId?: string;
}
export class CoursesQueryDto extends PageDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @OptionalField()
  @IsUUID()
  subjectId?: string;
}
export class SectionDto {
  @ApiProperty() @Trim() @IsString() @Length(1, 200) title: string;
  @ApiProperty() @IsInt() @Min(0) @Max(100000) position: number;
}
export class UpdateSectionDto {
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(1, 200)
  title?: string;
  @ApiPropertyOptional()
  @OptionalField()
  @IsInt()
  @Min(0)
  @Max(100000)
  position?: number;
}
export class LessonDto extends SectionDto {
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(0, 100000)
  body?: string;
}
export class UpdateLessonDto extends UpdateSectionDto {
  @ApiPropertyOptional()
  @OptionalField()
  @Trim()
  @IsString()
  @Length(0, 100000)
  body?: string;
}
export class EnrollmentDto {
  @ApiProperty() @IsBoolean() active: boolean;
}
