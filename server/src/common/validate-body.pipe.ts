import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform, Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

/**
 * Drop-in replacement for relying on the global ValidationPipe's automatic
 * DTO detection on `@Body()` parameters.
 *
 * Why this exists: this project runs under `tsx`/esbuild, which does not
 * emit TypeScript's `design:paramtypes` metadata for controller method
 * parameters (the same gap that broke constructor-injection-by-type
 * everywhere else in this server — see the `@Inject(ClassName)` convention
 * used on every provider). NestJS's built-in `ValidationPipe` decides which
 * class to instantiate and validate against by reading that reflected
 * parameter type off the handler signature. Under esbuild it comes back as
 * `Object` (or absent), which the pipe's internal `toValidate()` check treats
 * as "nothing to validate" — so it silently returns the raw, untouched
 * request body. In practice that meant every `@Body()` handler in this app
 * accepted missing required fields, wrong types, and arbitrary unwhitelisted
 * extra fields with no error at all, despite `whitelist`/`forbidNonWhitelisted`
 * being configured globally.
 *
 * The fix mirrors the constructor-injection fix: stop depending on reflected
 * type metadata and pass the target class explicitly. `@Body(validateBody(SomeDto))`
 * builds a small pipe bound to `SomeDto` at file-load time, so it validates
 * correctly regardless of what the bundler did or didn't emit.
 */
@Injectable()
export class ValidateBody<T extends object> implements PipeTransform<unknown, T> {
  constructor(private readonly cls: Type<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const instance = plainToInstance(this.cls, value ?? {});
    const errors = validateSync(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    });

    if (errors.length > 0) {
      const message = errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .filter((text) => Boolean(text))
        .join('; ');
      throw new BadRequestException(message || 'Validation failed.');
    }

    return instance;
  }
}

/** `@Body(validateBody(CreateCaseDto)) body: CreateCaseDto` — see `ValidateBody` for why this is needed. */
export function validateBody<T extends object>(cls: Type<T>): ValidateBody<T> {
  return new ValidateBody(cls);
}
