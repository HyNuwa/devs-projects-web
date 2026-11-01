
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 *
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model RoleChangeAudit
 *
 */
export type RoleChangeAudit = $Result.DefaultSelection<Prisma.$RoleChangeAuditPayload>
/**
 * Model Career
 *
 */
export type Career = $Result.DefaultSelection<Prisma.$CareerPayload>
/**
 * Model StudyPlan
 *
 */
export type StudyPlan = $Result.DefaultSelection<Prisma.$StudyPlanPayload>
/**
 * Model Subject
 *
 */
export type Subject = $Result.DefaultSelection<Prisma.$SubjectPayload>
/**
 * Model StudyPlanSubject
 *
 */
export type StudyPlanSubject = $Result.DefaultSelection<Prisma.$StudyPlanSubjectPayload>
/**
 * Model Course
 *
 */
export type Course = $Result.DefaultSelection<Prisma.$CoursePayload>
/**
 * Model CourseSection
 *
 */
export type CourseSection = $Result.DefaultSelection<Prisma.$CourseSectionPayload>
/**
 * Model CourseLesson
 *
 */
export type CourseLesson = $Result.DefaultSelection<Prisma.$CourseLessonPayload>
/**
 * Model CourseEnrollment
 *
 */
export type CourseEnrollment = $Result.DefaultSelection<Prisma.$CourseEnrollmentPayload>
/**
 * Model CourseFile
 *
 */
export type CourseFile = $Result.DefaultSelection<Prisma.$CourseFilePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  VISITOR: 'VISITOR',
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN'
};

export type Role = (typeof Role)[keyof typeof Role]


export const CourseStatus: {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
};

export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus]


export const CourseFileState: {
  PENDING: 'PENDING',
  READY: 'READY',
  FAILED: 'FAILED',
  DETACHING: 'DETACHING'
};

export type CourseFileState = (typeof CourseFileState)[keyof typeof CourseFileState]


export const CourseFileOrigin: {
  UPLOAD: 'UPLOAD',
  IMPORT: 'IMPORT'
};

export type CourseFileOrigin = (typeof CourseFileOrigin)[keyof typeof CourseFileOrigin]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type CourseStatus = $Enums.CourseStatus

export const CourseStatus: typeof $Enums.CourseStatus

export type CourseFileState = $Enums.CourseFileState

export const CourseFileState: typeof $Enums.CourseFileState

export type CourseFileOrigin = $Enums.CourseFileOrigin

export const CourseFileOrigin: typeof $Enums.CourseFileOrigin

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.roleChangeAudit`: Exposes CRUD operations for the **RoleChangeAudit** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RoleChangeAudits
    * const roleChangeAudits = await prisma.roleChangeAudit.findMany()
    * ```
    */
  get roleChangeAudit(): Prisma.RoleChangeAuditDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.career`: Exposes CRUD operations for the **Career** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Careers
    * const careers = await prisma.career.findMany()
    * ```
    */
  get career(): Prisma.CareerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.studyPlan`: Exposes CRUD operations for the **StudyPlan** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StudyPlans
    * const studyPlans = await prisma.studyPlan.findMany()
    * ```
    */
  get studyPlan(): Prisma.StudyPlanDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.subject`: Exposes CRUD operations for the **Subject** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Subjects
    * const subjects = await prisma.subject.findMany()
    * ```
    */
  get subject(): Prisma.SubjectDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.studyPlanSubject`: Exposes CRUD operations for the **StudyPlanSubject** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StudyPlanSubjects
    * const studyPlanSubjects = await prisma.studyPlanSubject.findMany()
    * ```
    */
  get studyPlanSubject(): Prisma.StudyPlanSubjectDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.course`: Exposes CRUD operations for the **Course** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Courses
    * const courses = await prisma.course.findMany()
    * ```
    */
  get course(): Prisma.CourseDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.courseSection`: Exposes CRUD operations for the **CourseSection** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CourseSections
    * const courseSections = await prisma.courseSection.findMany()
    * ```
    */
  get courseSection(): Prisma.CourseSectionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.courseLesson`: Exposes CRUD operations for the **CourseLesson** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CourseLessons
    * const courseLessons = await prisma.courseLesson.findMany()
    * ```
    */
  get courseLesson(): Prisma.CourseLessonDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.courseEnrollment`: Exposes CRUD operations for the **CourseEnrollment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CourseEnrollments
    * const courseEnrollments = await prisma.courseEnrollment.findMany()
    * ```
    */
  get courseEnrollment(): Prisma.CourseEnrollmentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.courseFile`: Exposes CRUD operations for the **CourseFile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CourseFiles
    * const courseFiles = await prisma.courseFile.findMany()
    * ```
    */
  get courseFile(): Prisma.CourseFileDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    RoleChangeAudit: 'RoleChangeAudit',
    Career: 'Career',
    StudyPlan: 'StudyPlan',
    Subject: 'Subject',
    StudyPlanSubject: 'StudyPlanSubject',
    Course: 'Course',
    CourseSection: 'CourseSection',
    CourseLesson: 'CourseLesson',
    CourseEnrollment: 'CourseEnrollment',
    CourseFile: 'CourseFile'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "roleChangeAudit" | "career" | "studyPlan" | "subject" | "studyPlanSubject" | "course" | "courseSection" | "courseLesson" | "courseEnrollment" | "courseFile"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      RoleChangeAudit: {
        payload: Prisma.$RoleChangeAuditPayload<ExtArgs>
        fields: Prisma.RoleChangeAuditFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RoleChangeAuditFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RoleChangeAuditFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload>
          }
          findFirst: {
            args: Prisma.RoleChangeAuditFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RoleChangeAuditFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload>
          }
          findMany: {
            args: Prisma.RoleChangeAuditFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload>[]
          }
          create: {
            args: Prisma.RoleChangeAuditCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload>
          }
          createMany: {
            args: Prisma.RoleChangeAuditCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RoleChangeAuditCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload>[]
          }
          delete: {
            args: Prisma.RoleChangeAuditDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload>
          }
          update: {
            args: Prisma.RoleChangeAuditUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload>
          }
          deleteMany: {
            args: Prisma.RoleChangeAuditDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RoleChangeAuditUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RoleChangeAuditUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload>[]
          }
          upsert: {
            args: Prisma.RoleChangeAuditUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoleChangeAuditPayload>
          }
          aggregate: {
            args: Prisma.RoleChangeAuditAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRoleChangeAudit>
          }
          groupBy: {
            args: Prisma.RoleChangeAuditGroupByArgs<ExtArgs>
            result: $Utils.Optional<RoleChangeAuditGroupByOutputType>[]
          }
          count: {
            args: Prisma.RoleChangeAuditCountArgs<ExtArgs>
            result: $Utils.Optional<RoleChangeAuditCountAggregateOutputType> | number
          }
        }
      }
      Career: {
        payload: Prisma.$CareerPayload<ExtArgs>
        fields: Prisma.CareerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CareerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CareerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload>
          }
          findFirst: {
            args: Prisma.CareerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CareerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload>
          }
          findMany: {
            args: Prisma.CareerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload>[]
          }
          create: {
            args: Prisma.CareerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload>
          }
          createMany: {
            args: Prisma.CareerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CareerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload>[]
          }
          delete: {
            args: Prisma.CareerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload>
          }
          update: {
            args: Prisma.CareerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload>
          }
          deleteMany: {
            args: Prisma.CareerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CareerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CareerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload>[]
          }
          upsert: {
            args: Prisma.CareerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CareerPayload>
          }
          aggregate: {
            args: Prisma.CareerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCareer>
          }
          groupBy: {
            args: Prisma.CareerGroupByArgs<ExtArgs>
            result: $Utils.Optional<CareerGroupByOutputType>[]
          }
          count: {
            args: Prisma.CareerCountArgs<ExtArgs>
            result: $Utils.Optional<CareerCountAggregateOutputType> | number
          }
        }
      }
      StudyPlan: {
        payload: Prisma.$StudyPlanPayload<ExtArgs>
        fields: Prisma.StudyPlanFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StudyPlanFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StudyPlanFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload>
          }
          findFirst: {
            args: Prisma.StudyPlanFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StudyPlanFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload>
          }
          findMany: {
            args: Prisma.StudyPlanFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload>[]
          }
          create: {
            args: Prisma.StudyPlanCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload>
          }
          createMany: {
            args: Prisma.StudyPlanCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StudyPlanCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload>[]
          }
          delete: {
            args: Prisma.StudyPlanDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload>
          }
          update: {
            args: Prisma.StudyPlanUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload>
          }
          deleteMany: {
            args: Prisma.StudyPlanDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StudyPlanUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.StudyPlanUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload>[]
          }
          upsert: {
            args: Prisma.StudyPlanUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanPayload>
          }
          aggregate: {
            args: Prisma.StudyPlanAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStudyPlan>
          }
          groupBy: {
            args: Prisma.StudyPlanGroupByArgs<ExtArgs>
            result: $Utils.Optional<StudyPlanGroupByOutputType>[]
          }
          count: {
            args: Prisma.StudyPlanCountArgs<ExtArgs>
            result: $Utils.Optional<StudyPlanCountAggregateOutputType> | number
          }
        }
      }
      Subject: {
        payload: Prisma.$SubjectPayload<ExtArgs>
        fields: Prisma.SubjectFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SubjectFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SubjectFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          findFirst: {
            args: Prisma.SubjectFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SubjectFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          findMany: {
            args: Prisma.SubjectFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>[]
          }
          create: {
            args: Prisma.SubjectCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          createMany: {
            args: Prisma.SubjectCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SubjectCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>[]
          }
          delete: {
            args: Prisma.SubjectDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          update: {
            args: Prisma.SubjectUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          deleteMany: {
            args: Prisma.SubjectDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SubjectUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SubjectUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>[]
          }
          upsert: {
            args: Prisma.SubjectUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubjectPayload>
          }
          aggregate: {
            args: Prisma.SubjectAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSubject>
          }
          groupBy: {
            args: Prisma.SubjectGroupByArgs<ExtArgs>
            result: $Utils.Optional<SubjectGroupByOutputType>[]
          }
          count: {
            args: Prisma.SubjectCountArgs<ExtArgs>
            result: $Utils.Optional<SubjectCountAggregateOutputType> | number
          }
        }
      }
      StudyPlanSubject: {
        payload: Prisma.$StudyPlanSubjectPayload<ExtArgs>
        fields: Prisma.StudyPlanSubjectFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StudyPlanSubjectFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StudyPlanSubjectFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload>
          }
          findFirst: {
            args: Prisma.StudyPlanSubjectFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StudyPlanSubjectFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload>
          }
          findMany: {
            args: Prisma.StudyPlanSubjectFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload>[]
          }
          create: {
            args: Prisma.StudyPlanSubjectCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload>
          }
          createMany: {
            args: Prisma.StudyPlanSubjectCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StudyPlanSubjectCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload>[]
          }
          delete: {
            args: Prisma.StudyPlanSubjectDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload>
          }
          update: {
            args: Prisma.StudyPlanSubjectUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload>
          }
          deleteMany: {
            args: Prisma.StudyPlanSubjectDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StudyPlanSubjectUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.StudyPlanSubjectUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload>[]
          }
          upsert: {
            args: Prisma.StudyPlanSubjectUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StudyPlanSubjectPayload>
          }
          aggregate: {
            args: Prisma.StudyPlanSubjectAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStudyPlanSubject>
          }
          groupBy: {
            args: Prisma.StudyPlanSubjectGroupByArgs<ExtArgs>
            result: $Utils.Optional<StudyPlanSubjectGroupByOutputType>[]
          }
          count: {
            args: Prisma.StudyPlanSubjectCountArgs<ExtArgs>
            result: $Utils.Optional<StudyPlanSubjectCountAggregateOutputType> | number
          }
        }
      }
      Course: {
        payload: Prisma.$CoursePayload<ExtArgs>
        fields: Prisma.CourseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CourseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CourseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          findFirst: {
            args: Prisma.CourseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CourseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          findMany: {
            args: Prisma.CourseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>[]
          }
          create: {
            args: Prisma.CourseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          createMany: {
            args: Prisma.CourseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CourseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>[]
          }
          delete: {
            args: Prisma.CourseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          update: {
            args: Prisma.CourseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          deleteMany: {
            args: Prisma.CourseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CourseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CourseUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>[]
          }
          upsert: {
            args: Prisma.CourseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoursePayload>
          }
          aggregate: {
            args: Prisma.CourseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCourse>
          }
          groupBy: {
            args: Prisma.CourseGroupByArgs<ExtArgs>
            result: $Utils.Optional<CourseGroupByOutputType>[]
          }
          count: {
            args: Prisma.CourseCountArgs<ExtArgs>
            result: $Utils.Optional<CourseCountAggregateOutputType> | number
          }
        }
      }
      CourseSection: {
        payload: Prisma.$CourseSectionPayload<ExtArgs>
        fields: Prisma.CourseSectionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CourseSectionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CourseSectionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload>
          }
          findFirst: {
            args: Prisma.CourseSectionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CourseSectionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload>
          }
          findMany: {
            args: Prisma.CourseSectionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload>[]
          }
          create: {
            args: Prisma.CourseSectionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload>
          }
          createMany: {
            args: Prisma.CourseSectionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CourseSectionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload>[]
          }
          delete: {
            args: Prisma.CourseSectionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload>
          }
          update: {
            args: Prisma.CourseSectionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload>
          }
          deleteMany: {
            args: Prisma.CourseSectionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CourseSectionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CourseSectionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload>[]
          }
          upsert: {
            args: Prisma.CourseSectionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseSectionPayload>
          }
          aggregate: {
            args: Prisma.CourseSectionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCourseSection>
          }
          groupBy: {
            args: Prisma.CourseSectionGroupByArgs<ExtArgs>
            result: $Utils.Optional<CourseSectionGroupByOutputType>[]
          }
          count: {
            args: Prisma.CourseSectionCountArgs<ExtArgs>
            result: $Utils.Optional<CourseSectionCountAggregateOutputType> | number
          }
        }
      }
      CourseLesson: {
        payload: Prisma.$CourseLessonPayload<ExtArgs>
        fields: Prisma.CourseLessonFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CourseLessonFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CourseLessonFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload>
          }
          findFirst: {
            args: Prisma.CourseLessonFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CourseLessonFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload>
          }
          findMany: {
            args: Prisma.CourseLessonFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload>[]
          }
          create: {
            args: Prisma.CourseLessonCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload>
          }
          createMany: {
            args: Prisma.CourseLessonCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CourseLessonCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload>[]
          }
          delete: {
            args: Prisma.CourseLessonDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload>
          }
          update: {
            args: Prisma.CourseLessonUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload>
          }
          deleteMany: {
            args: Prisma.CourseLessonDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CourseLessonUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CourseLessonUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload>[]
          }
          upsert: {
            args: Prisma.CourseLessonUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseLessonPayload>
          }
          aggregate: {
            args: Prisma.CourseLessonAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCourseLesson>
          }
          groupBy: {
            args: Prisma.CourseLessonGroupByArgs<ExtArgs>
            result: $Utils.Optional<CourseLessonGroupByOutputType>[]
          }
          count: {
            args: Prisma.CourseLessonCountArgs<ExtArgs>
            result: $Utils.Optional<CourseLessonCountAggregateOutputType> | number
          }
        }
      }
      CourseEnrollment: {
        payload: Prisma.$CourseEnrollmentPayload<ExtArgs>
        fields: Prisma.CourseEnrollmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CourseEnrollmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CourseEnrollmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload>
          }
          findFirst: {
            args: Prisma.CourseEnrollmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CourseEnrollmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload>
          }
          findMany: {
            args: Prisma.CourseEnrollmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload>[]
          }
          create: {
            args: Prisma.CourseEnrollmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload>
          }
          createMany: {
            args: Prisma.CourseEnrollmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CourseEnrollmentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload>[]
          }
          delete: {
            args: Prisma.CourseEnrollmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload>
          }
          update: {
            args: Prisma.CourseEnrollmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload>
          }
          deleteMany: {
            args: Prisma.CourseEnrollmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CourseEnrollmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CourseEnrollmentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload>[]
          }
          upsert: {
            args: Prisma.CourseEnrollmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseEnrollmentPayload>
          }
          aggregate: {
            args: Prisma.CourseEnrollmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCourseEnrollment>
          }
          groupBy: {
            args: Prisma.CourseEnrollmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<CourseEnrollmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.CourseEnrollmentCountArgs<ExtArgs>
            result: $Utils.Optional<CourseEnrollmentCountAggregateOutputType> | number
          }
        }
      }
      CourseFile: {
        payload: Prisma.$CourseFilePayload<ExtArgs>
        fields: Prisma.CourseFileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CourseFileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CourseFileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload>
          }
          findFirst: {
            args: Prisma.CourseFileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CourseFileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload>
          }
          findMany: {
            args: Prisma.CourseFileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload>[]
          }
          create: {
            args: Prisma.CourseFileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload>
          }
          createMany: {
            args: Prisma.CourseFileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CourseFileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload>[]
          }
          delete: {
            args: Prisma.CourseFileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload>
          }
          update: {
            args: Prisma.CourseFileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload>
          }
          deleteMany: {
            args: Prisma.CourseFileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CourseFileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CourseFileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload>[]
          }
          upsert: {
            args: Prisma.CourseFileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CourseFilePayload>
          }
          aggregate: {
            args: Prisma.CourseFileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCourseFile>
          }
          groupBy: {
            args: Prisma.CourseFileGroupByArgs<ExtArgs>
            result: $Utils.Optional<CourseFileGroupByOutputType>[]
          }
          count: {
            args: Prisma.CourseFileCountArgs<ExtArgs>
            result: $Utils.Optional<CourseFileCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     *
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     *
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    roleChangeAudit?: RoleChangeAuditOmit
    career?: CareerOmit
    studyPlan?: StudyPlanOmit
    subject?: SubjectOmit
    studyPlanSubject?: StudyPlanSubjectOmit
    course?: CourseOmit
    courseSection?: CourseSectionOmit
    courseLesson?: CourseLessonOmit
    courseEnrollment?: CourseEnrollmentOmit
    courseFile?: CourseFileOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    courses: number
    enrollments: number
    courseFiles: number
    roleChangesMade: number
    roleChangesReceived: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    courses?: boolean | UserCountOutputTypeCountCoursesArgs
    enrollments?: boolean | UserCountOutputTypeCountEnrollmentsArgs
    courseFiles?: boolean | UserCountOutputTypeCountCourseFilesArgs
    roleChangesMade?: boolean | UserCountOutputTypeCountRoleChangesMadeArgs
    roleChangesReceived?: boolean | UserCountOutputTypeCountRoleChangesReceivedArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCoursesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountEnrollmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseEnrollmentWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCourseFilesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseFileWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRoleChangesMadeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoleChangeAuditWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRoleChangesReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoleChangeAuditWhereInput
  }


  /**
   * Count Type CareerCountOutputType
   */

  export type CareerCountOutputType = {
    studyPlans: number
  }

  export type CareerCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    studyPlans?: boolean | CareerCountOutputTypeCountStudyPlansArgs
  }

  // Custom InputTypes
  /**
   * CareerCountOutputType without action
   */
  export type CareerCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CareerCountOutputType
     */
    select?: CareerCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CareerCountOutputType without action
   */
  export type CareerCountOutputTypeCountStudyPlansArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StudyPlanWhereInput
  }


  /**
   * Count Type StudyPlanCountOutputType
   */

  export type StudyPlanCountOutputType = {
    subjects: number
  }

  export type StudyPlanCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    subjects?: boolean | StudyPlanCountOutputTypeCountSubjectsArgs
  }

  // Custom InputTypes
  /**
   * StudyPlanCountOutputType without action
   */
  export type StudyPlanCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanCountOutputType
     */
    select?: StudyPlanCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * StudyPlanCountOutputType without action
   */
  export type StudyPlanCountOutputTypeCountSubjectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StudyPlanSubjectWhereInput
  }


  /**
   * Count Type SubjectCountOutputType
   */

  export type SubjectCountOutputType = {
    studyPlans: number
    courses: number
  }

  export type SubjectCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    studyPlans?: boolean | SubjectCountOutputTypeCountStudyPlansArgs
    courses?: boolean | SubjectCountOutputTypeCountCoursesArgs
  }

  // Custom InputTypes
  /**
   * SubjectCountOutputType without action
   */
  export type SubjectCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubjectCountOutputType
     */
    select?: SubjectCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SubjectCountOutputType without action
   */
  export type SubjectCountOutputTypeCountStudyPlansArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StudyPlanSubjectWhereInput
  }

  /**
   * SubjectCountOutputType without action
   */
  export type SubjectCountOutputTypeCountCoursesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseWhereInput
  }


  /**
   * Count Type CourseCountOutputType
   */

  export type CourseCountOutputType = {
    sections: number
    enrollments: number
  }

  export type CourseCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sections?: boolean | CourseCountOutputTypeCountSectionsArgs
    enrollments?: boolean | CourseCountOutputTypeCountEnrollmentsArgs
  }

  // Custom InputTypes
  /**
   * CourseCountOutputType without action
   */
  export type CourseCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseCountOutputType
     */
    select?: CourseCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CourseCountOutputType without action
   */
  export type CourseCountOutputTypeCountSectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseSectionWhereInput
  }

  /**
   * CourseCountOutputType without action
   */
  export type CourseCountOutputTypeCountEnrollmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseEnrollmentWhereInput
  }


  /**
   * Count Type CourseSectionCountOutputType
   */

  export type CourseSectionCountOutputType = {
    lessons: number
  }

  export type CourseSectionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lessons?: boolean | CourseSectionCountOutputTypeCountLessonsArgs
  }

  // Custom InputTypes
  /**
   * CourseSectionCountOutputType without action
   */
  export type CourseSectionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSectionCountOutputType
     */
    select?: CourseSectionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CourseSectionCountOutputType without action
   */
  export type CourseSectionCountOutputTypeCountLessonsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseLessonWhereInput
  }


  /**
   * Count Type CourseLessonCountOutputType
   */

  export type CourseLessonCountOutputType = {
    files: number
  }

  export type CourseLessonCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    files?: boolean | CourseLessonCountOutputTypeCountFilesArgs
  }

  // Custom InputTypes
  /**
   * CourseLessonCountOutputType without action
   */
  export type CourseLessonCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLessonCountOutputType
     */
    select?: CourseLessonCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CourseLessonCountOutputType without action
   */
  export type CourseLessonCountOutputTypeCountFilesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseFileWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    username: string | null
    email: string | null
    passwordHash: string | null
    role: $Enums.Role | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
    isBanned: boolean | null
    bannedUntil: Date | null
    mutedUntil: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    username: string | null
    email: string | null
    passwordHash: string | null
    role: $Enums.Role | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
    isBanned: boolean | null
    bannedUntil: Date | null
    mutedUntil: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    username: number
    email: number
    passwordHash: number
    role: number
    name: number
    createdAt: number
    updatedAt: number
    isBanned: number
    bannedUntil: number
    mutedUntil: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    username?: true
    email?: true
    passwordHash?: true
    role?: true
    name?: true
    createdAt?: true
    updatedAt?: true
    isBanned?: true
    bannedUntil?: true
    mutedUntil?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    username?: true
    email?: true
    passwordHash?: true
    role?: true
    name?: true
    createdAt?: true
    updatedAt?: true
    isBanned?: true
    bannedUntil?: true
    mutedUntil?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    username?: true
    email?: true
    passwordHash?: true
    role?: true
    name?: true
    createdAt?: true
    updatedAt?: true
    isBanned?: true
    bannedUntil?: true
    mutedUntil?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    username: string
    email: string
    passwordHash: string
    role: $Enums.Role
    name: string | null
    createdAt: Date
    updatedAt: Date
    isBanned: boolean
    bannedUntil: Date | null
    mutedUntil: Date | null
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    email?: boolean
    passwordHash?: boolean
    role?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    isBanned?: boolean
    bannedUntil?: boolean
    mutedUntil?: boolean
    courses?: boolean | User$coursesArgs<ExtArgs>
    enrollments?: boolean | User$enrollmentsArgs<ExtArgs>
    courseFiles?: boolean | User$courseFilesArgs<ExtArgs>
    roleChangesMade?: boolean | User$roleChangesMadeArgs<ExtArgs>
    roleChangesReceived?: boolean | User$roleChangesReceivedArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    email?: boolean
    passwordHash?: boolean
    role?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    isBanned?: boolean
    bannedUntil?: boolean
    mutedUntil?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    email?: boolean
    passwordHash?: boolean
    role?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    isBanned?: boolean
    bannedUntil?: boolean
    mutedUntil?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    username?: boolean
    email?: boolean
    passwordHash?: boolean
    role?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    isBanned?: boolean
    bannedUntil?: boolean
    mutedUntil?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "username" | "email" | "passwordHash" | "role" | "name" | "createdAt" | "updatedAt" | "isBanned" | "bannedUntil" | "mutedUntil", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    courses?: boolean | User$coursesArgs<ExtArgs>
    enrollments?: boolean | User$enrollmentsArgs<ExtArgs>
    courseFiles?: boolean | User$courseFilesArgs<ExtArgs>
    roleChangesMade?: boolean | User$roleChangesMadeArgs<ExtArgs>
    roleChangesReceived?: boolean | User$roleChangesReceivedArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      courses: Prisma.$CoursePayload<ExtArgs>[]
      enrollments: Prisma.$CourseEnrollmentPayload<ExtArgs>[]
      courseFiles: Prisma.$CourseFilePayload<ExtArgs>[]
      roleChangesMade: Prisma.$RoleChangeAuditPayload<ExtArgs>[]
      roleChangesReceived: Prisma.$RoleChangeAuditPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      username: string
      email: string
      passwordHash: string
      role: $Enums.Role
      name: string | null
      createdAt: Date
      updatedAt: Date
      isBanned: boolean
      bannedUntil: Date | null
      mutedUntil: Date | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     *
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     *
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     *
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    courses<T extends User$coursesArgs<ExtArgs> = {}>(args?: Subset<T, User$coursesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    enrollments<T extends User$enrollmentsArgs<ExtArgs> = {}>(args?: Subset<T, User$enrollmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    courseFiles<T extends User$courseFilesArgs<ExtArgs> = {}>(args?: Subset<T, User$courseFilesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    roleChangesMade<T extends User$roleChangesMadeArgs<ExtArgs> = {}>(args?: Subset<T, User$roleChangesMadeArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    roleChangesReceived<T extends User$roleChangesReceivedArgs<ExtArgs> = {}>(args?: Subset<T, User$roleChangesReceivedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly username: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
    readonly name: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly isBanned: FieldRef<"User", 'Boolean'>
    readonly bannedUntil: FieldRef<"User", 'DateTime'>
    readonly mutedUntil: FieldRef<"User", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.courses
   */
  export type User$coursesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    where?: CourseWhereInput
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    cursor?: CourseWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CourseScalarFieldEnum | CourseScalarFieldEnum[]
  }

  /**
   * User.enrollments
   */
  export type User$enrollmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    where?: CourseEnrollmentWhereInput
    orderBy?: CourseEnrollmentOrderByWithRelationInput | CourseEnrollmentOrderByWithRelationInput[]
    cursor?: CourseEnrollmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CourseEnrollmentScalarFieldEnum | CourseEnrollmentScalarFieldEnum[]
  }

  /**
   * User.courseFiles
   */
  export type User$courseFilesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    where?: CourseFileWhereInput
    orderBy?: CourseFileOrderByWithRelationInput | CourseFileOrderByWithRelationInput[]
    cursor?: CourseFileWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CourseFileScalarFieldEnum | CourseFileScalarFieldEnum[]
  }

  /**
   * User.roleChangesMade
   */
  export type User$roleChangesMadeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    where?: RoleChangeAuditWhereInput
    orderBy?: RoleChangeAuditOrderByWithRelationInput | RoleChangeAuditOrderByWithRelationInput[]
    cursor?: RoleChangeAuditWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RoleChangeAuditScalarFieldEnum | RoleChangeAuditScalarFieldEnum[]
  }

  /**
   * User.roleChangesReceived
   */
  export type User$roleChangesReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    where?: RoleChangeAuditWhereInput
    orderBy?: RoleChangeAuditOrderByWithRelationInput | RoleChangeAuditOrderByWithRelationInput[]
    cursor?: RoleChangeAuditWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RoleChangeAuditScalarFieldEnum | RoleChangeAuditScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model RoleChangeAudit
   */

  export type AggregateRoleChangeAudit = {
    _count: RoleChangeAuditCountAggregateOutputType | null
    _avg: RoleChangeAuditAvgAggregateOutputType | null
    _sum: RoleChangeAuditSumAggregateOutputType | null
    _min: RoleChangeAuditMinAggregateOutputType | null
    _max: RoleChangeAuditMaxAggregateOutputType | null
  }

  export type RoleChangeAuditAvgAggregateOutputType = {
    actorId: number | null
    targetId: number | null
  }

  export type RoleChangeAuditSumAggregateOutputType = {
    actorId: number | null
    targetId: number | null
  }

  export type RoleChangeAuditMinAggregateOutputType = {
    id: string | null
    actorId: number | null
    targetId: number | null
    oldRole: $Enums.Role | null
    newRole: $Enums.Role | null
    reason: string | null
    createdAt: Date | null
  }

  export type RoleChangeAuditMaxAggregateOutputType = {
    id: string | null
    actorId: number | null
    targetId: number | null
    oldRole: $Enums.Role | null
    newRole: $Enums.Role | null
    reason: string | null
    createdAt: Date | null
  }

  export type RoleChangeAuditCountAggregateOutputType = {
    id: number
    actorId: number
    targetId: number
    oldRole: number
    newRole: number
    reason: number
    createdAt: number
    _all: number
  }


  export type RoleChangeAuditAvgAggregateInputType = {
    actorId?: true
    targetId?: true
  }

  export type RoleChangeAuditSumAggregateInputType = {
    actorId?: true
    targetId?: true
  }

  export type RoleChangeAuditMinAggregateInputType = {
    id?: true
    actorId?: true
    targetId?: true
    oldRole?: true
    newRole?: true
    reason?: true
    createdAt?: true
  }

  export type RoleChangeAuditMaxAggregateInputType = {
    id?: true
    actorId?: true
    targetId?: true
    oldRole?: true
    newRole?: true
    reason?: true
    createdAt?: true
  }

  export type RoleChangeAuditCountAggregateInputType = {
    id?: true
    actorId?: true
    targetId?: true
    oldRole?: true
    newRole?: true
    reason?: true
    createdAt?: true
    _all?: true
  }

  export type RoleChangeAuditAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RoleChangeAudit to aggregate.
     */
    where?: RoleChangeAuditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of RoleChangeAudits to fetch.
     */
    orderBy?: RoleChangeAuditOrderByWithRelationInput | RoleChangeAuditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: RoleChangeAuditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` RoleChangeAudits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` RoleChangeAudits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned RoleChangeAudits
    **/
    _count?: true | RoleChangeAuditCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: RoleChangeAuditAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: RoleChangeAuditSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: RoleChangeAuditMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: RoleChangeAuditMaxAggregateInputType
  }

  export type GetRoleChangeAuditAggregateType<T extends RoleChangeAuditAggregateArgs> = {
        [P in keyof T & keyof AggregateRoleChangeAudit]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRoleChangeAudit[P]>
      : GetScalarType<T[P], AggregateRoleChangeAudit[P]>
  }




  export type RoleChangeAuditGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoleChangeAuditWhereInput
    orderBy?: RoleChangeAuditOrderByWithAggregationInput | RoleChangeAuditOrderByWithAggregationInput[]
    by: RoleChangeAuditScalarFieldEnum[] | RoleChangeAuditScalarFieldEnum
    having?: RoleChangeAuditScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RoleChangeAuditCountAggregateInputType | true
    _avg?: RoleChangeAuditAvgAggregateInputType
    _sum?: RoleChangeAuditSumAggregateInputType
    _min?: RoleChangeAuditMinAggregateInputType
    _max?: RoleChangeAuditMaxAggregateInputType
  }

  export type RoleChangeAuditGroupByOutputType = {
    id: string
    actorId: number
    targetId: number
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt: Date
    _count: RoleChangeAuditCountAggregateOutputType | null
    _avg: RoleChangeAuditAvgAggregateOutputType | null
    _sum: RoleChangeAuditSumAggregateOutputType | null
    _min: RoleChangeAuditMinAggregateOutputType | null
    _max: RoleChangeAuditMaxAggregateOutputType | null
  }

  type GetRoleChangeAuditGroupByPayload<T extends RoleChangeAuditGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RoleChangeAuditGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RoleChangeAuditGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RoleChangeAuditGroupByOutputType[P]>
            : GetScalarType<T[P], RoleChangeAuditGroupByOutputType[P]>
        }
      >
    >


  export type RoleChangeAuditSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    actorId?: boolean
    targetId?: boolean
    oldRole?: boolean
    newRole?: boolean
    reason?: boolean
    createdAt?: boolean
    actor?: boolean | UserDefaultArgs<ExtArgs>
    target?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["roleChangeAudit"]>

  export type RoleChangeAuditSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    actorId?: boolean
    targetId?: boolean
    oldRole?: boolean
    newRole?: boolean
    reason?: boolean
    createdAt?: boolean
    actor?: boolean | UserDefaultArgs<ExtArgs>
    target?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["roleChangeAudit"]>

  export type RoleChangeAuditSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    actorId?: boolean
    targetId?: boolean
    oldRole?: boolean
    newRole?: boolean
    reason?: boolean
    createdAt?: boolean
    actor?: boolean | UserDefaultArgs<ExtArgs>
    target?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["roleChangeAudit"]>

  export type RoleChangeAuditSelectScalar = {
    id?: boolean
    actorId?: boolean
    targetId?: boolean
    oldRole?: boolean
    newRole?: boolean
    reason?: boolean
    createdAt?: boolean
  }

  export type RoleChangeAuditOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "actorId" | "targetId" | "oldRole" | "newRole" | "reason" | "createdAt", ExtArgs["result"]["roleChangeAudit"]>
  export type RoleChangeAuditInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    actor?: boolean | UserDefaultArgs<ExtArgs>
    target?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RoleChangeAuditIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    actor?: boolean | UserDefaultArgs<ExtArgs>
    target?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RoleChangeAuditIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    actor?: boolean | UserDefaultArgs<ExtArgs>
    target?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RoleChangeAuditPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RoleChangeAudit"
    objects: {
      actor: Prisma.$UserPayload<ExtArgs>
      target: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      actorId: number
      targetId: number
      oldRole: $Enums.Role
      newRole: $Enums.Role
      reason: string
      createdAt: Date
    }, ExtArgs["result"]["roleChangeAudit"]>
    composites: {}
  }

  type RoleChangeAuditGetPayload<S extends boolean | null | undefined | RoleChangeAuditDefaultArgs> = $Result.GetResult<Prisma.$RoleChangeAuditPayload, S>

  type RoleChangeAuditCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RoleChangeAuditFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RoleChangeAuditCountAggregateInputType | true
    }

  export interface RoleChangeAuditDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RoleChangeAudit'], meta: { name: 'RoleChangeAudit' } }
    /**
     * Find zero or one RoleChangeAudit that matches the filter.
     * @param {RoleChangeAuditFindUniqueArgs} args - Arguments to find a RoleChangeAudit
     * @example
     * // Get one RoleChangeAudit
     * const roleChangeAudit = await prisma.roleChangeAudit.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RoleChangeAuditFindUniqueArgs>(args: SelectSubset<T, RoleChangeAuditFindUniqueArgs<ExtArgs>>): Prisma__RoleChangeAuditClient<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one RoleChangeAudit that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RoleChangeAuditFindUniqueOrThrowArgs} args - Arguments to find a RoleChangeAudit
     * @example
     * // Get one RoleChangeAudit
     * const roleChangeAudit = await prisma.roleChangeAudit.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RoleChangeAuditFindUniqueOrThrowArgs>(args: SelectSubset<T, RoleChangeAuditFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RoleChangeAuditClient<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RoleChangeAudit that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleChangeAuditFindFirstArgs} args - Arguments to find a RoleChangeAudit
     * @example
     * // Get one RoleChangeAudit
     * const roleChangeAudit = await prisma.roleChangeAudit.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RoleChangeAuditFindFirstArgs>(args?: SelectSubset<T, RoleChangeAuditFindFirstArgs<ExtArgs>>): Prisma__RoleChangeAuditClient<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RoleChangeAudit that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleChangeAuditFindFirstOrThrowArgs} args - Arguments to find a RoleChangeAudit
     * @example
     * // Get one RoleChangeAudit
     * const roleChangeAudit = await prisma.roleChangeAudit.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RoleChangeAuditFindFirstOrThrowArgs>(args?: SelectSubset<T, RoleChangeAuditFindFirstOrThrowArgs<ExtArgs>>): Prisma__RoleChangeAuditClient<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more RoleChangeAudits that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleChangeAuditFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RoleChangeAudits
     * const roleChangeAudits = await prisma.roleChangeAudit.findMany()
     *
     * // Get first 10 RoleChangeAudits
     * const roleChangeAudits = await prisma.roleChangeAudit.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const roleChangeAuditWithIdOnly = await prisma.roleChangeAudit.findMany({ select: { id: true } })
     *
     */
    findMany<T extends RoleChangeAuditFindManyArgs>(args?: SelectSubset<T, RoleChangeAuditFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a RoleChangeAudit.
     * @param {RoleChangeAuditCreateArgs} args - Arguments to create a RoleChangeAudit.
     * @example
     * // Create one RoleChangeAudit
     * const RoleChangeAudit = await prisma.roleChangeAudit.create({
     *   data: {
     *     // ... data to create a RoleChangeAudit
     *   }
     * })
     *
     */
    create<T extends RoleChangeAuditCreateArgs>(args: SelectSubset<T, RoleChangeAuditCreateArgs<ExtArgs>>): Prisma__RoleChangeAuditClient<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many RoleChangeAudits.
     * @param {RoleChangeAuditCreateManyArgs} args - Arguments to create many RoleChangeAudits.
     * @example
     * // Create many RoleChangeAudits
     * const roleChangeAudit = await prisma.roleChangeAudit.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends RoleChangeAuditCreateManyArgs>(args?: SelectSubset<T, RoleChangeAuditCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RoleChangeAudits and returns the data saved in the database.
     * @param {RoleChangeAuditCreateManyAndReturnArgs} args - Arguments to create many RoleChangeAudits.
     * @example
     * // Create many RoleChangeAudits
     * const roleChangeAudit = await prisma.roleChangeAudit.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many RoleChangeAudits and only return the `id`
     * const roleChangeAuditWithIdOnly = await prisma.roleChangeAudit.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends RoleChangeAuditCreateManyAndReturnArgs>(args?: SelectSubset<T, RoleChangeAuditCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a RoleChangeAudit.
     * @param {RoleChangeAuditDeleteArgs} args - Arguments to delete one RoleChangeAudit.
     * @example
     * // Delete one RoleChangeAudit
     * const RoleChangeAudit = await prisma.roleChangeAudit.delete({
     *   where: {
     *     // ... filter to delete one RoleChangeAudit
     *   }
     * })
     *
     */
    delete<T extends RoleChangeAuditDeleteArgs>(args: SelectSubset<T, RoleChangeAuditDeleteArgs<ExtArgs>>): Prisma__RoleChangeAuditClient<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one RoleChangeAudit.
     * @param {RoleChangeAuditUpdateArgs} args - Arguments to update one RoleChangeAudit.
     * @example
     * // Update one RoleChangeAudit
     * const roleChangeAudit = await prisma.roleChangeAudit.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends RoleChangeAuditUpdateArgs>(args: SelectSubset<T, RoleChangeAuditUpdateArgs<ExtArgs>>): Prisma__RoleChangeAuditClient<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more RoleChangeAudits.
     * @param {RoleChangeAuditDeleteManyArgs} args - Arguments to filter RoleChangeAudits to delete.
     * @example
     * // Delete a few RoleChangeAudits
     * const { count } = await prisma.roleChangeAudit.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends RoleChangeAuditDeleteManyArgs>(args?: SelectSubset<T, RoleChangeAuditDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RoleChangeAudits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleChangeAuditUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RoleChangeAudits
     * const roleChangeAudit = await prisma.roleChangeAudit.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends RoleChangeAuditUpdateManyArgs>(args: SelectSubset<T, RoleChangeAuditUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RoleChangeAudits and returns the data updated in the database.
     * @param {RoleChangeAuditUpdateManyAndReturnArgs} args - Arguments to update many RoleChangeAudits.
     * @example
     * // Update many RoleChangeAudits
     * const roleChangeAudit = await prisma.roleChangeAudit.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more RoleChangeAudits and only return the `id`
     * const roleChangeAuditWithIdOnly = await prisma.roleChangeAudit.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends RoleChangeAuditUpdateManyAndReturnArgs>(args: SelectSubset<T, RoleChangeAuditUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one RoleChangeAudit.
     * @param {RoleChangeAuditUpsertArgs} args - Arguments to update or create a RoleChangeAudit.
     * @example
     * // Update or create a RoleChangeAudit
     * const roleChangeAudit = await prisma.roleChangeAudit.upsert({
     *   create: {
     *     // ... data to create a RoleChangeAudit
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RoleChangeAudit we want to update
     *   }
     * })
     */
    upsert<T extends RoleChangeAuditUpsertArgs>(args: SelectSubset<T, RoleChangeAuditUpsertArgs<ExtArgs>>): Prisma__RoleChangeAuditClient<$Result.GetResult<Prisma.$RoleChangeAuditPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of RoleChangeAudits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleChangeAuditCountArgs} args - Arguments to filter RoleChangeAudits to count.
     * @example
     * // Count the number of RoleChangeAudits
     * const count = await prisma.roleChangeAudit.count({
     *   where: {
     *     // ... the filter for the RoleChangeAudits we want to count
     *   }
     * })
    **/
    count<T extends RoleChangeAuditCountArgs>(
      args?: Subset<T, RoleChangeAuditCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RoleChangeAuditCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RoleChangeAudit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleChangeAuditAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RoleChangeAuditAggregateArgs>(args: Subset<T, RoleChangeAuditAggregateArgs>): Prisma.PrismaPromise<GetRoleChangeAuditAggregateType<T>>

    /**
     * Group by RoleChangeAudit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoleChangeAuditGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends RoleChangeAuditGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RoleChangeAuditGroupByArgs['orderBy'] }
        : { orderBy?: RoleChangeAuditGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RoleChangeAuditGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoleChangeAuditGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RoleChangeAudit model
   */
  readonly fields: RoleChangeAuditFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RoleChangeAudit.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RoleChangeAuditClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    actor<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    target<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RoleChangeAudit model
   */
  interface RoleChangeAuditFieldRefs {
    readonly id: FieldRef<"RoleChangeAudit", 'String'>
    readonly actorId: FieldRef<"RoleChangeAudit", 'Int'>
    readonly targetId: FieldRef<"RoleChangeAudit", 'Int'>
    readonly oldRole: FieldRef<"RoleChangeAudit", 'Role'>
    readonly newRole: FieldRef<"RoleChangeAudit", 'Role'>
    readonly reason: FieldRef<"RoleChangeAudit", 'String'>
    readonly createdAt: FieldRef<"RoleChangeAudit", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * RoleChangeAudit findUnique
   */
  export type RoleChangeAuditFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    /**
     * Filter, which RoleChangeAudit to fetch.
     */
    where: RoleChangeAuditWhereUniqueInput
  }

  /**
   * RoleChangeAudit findUniqueOrThrow
   */
  export type RoleChangeAuditFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    /**
     * Filter, which RoleChangeAudit to fetch.
     */
    where: RoleChangeAuditWhereUniqueInput
  }

  /**
   * RoleChangeAudit findFirst
   */
  export type RoleChangeAuditFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    /**
     * Filter, which RoleChangeAudit to fetch.
     */
    where?: RoleChangeAuditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of RoleChangeAudits to fetch.
     */
    orderBy?: RoleChangeAuditOrderByWithRelationInput | RoleChangeAuditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for RoleChangeAudits.
     */
    cursor?: RoleChangeAuditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` RoleChangeAudits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` RoleChangeAudits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of RoleChangeAudits.
     */
    distinct?: RoleChangeAuditScalarFieldEnum | RoleChangeAuditScalarFieldEnum[]
  }

  /**
   * RoleChangeAudit findFirstOrThrow
   */
  export type RoleChangeAuditFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    /**
     * Filter, which RoleChangeAudit to fetch.
     */
    where?: RoleChangeAuditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of RoleChangeAudits to fetch.
     */
    orderBy?: RoleChangeAuditOrderByWithRelationInput | RoleChangeAuditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for RoleChangeAudits.
     */
    cursor?: RoleChangeAuditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` RoleChangeAudits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` RoleChangeAudits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of RoleChangeAudits.
     */
    distinct?: RoleChangeAuditScalarFieldEnum | RoleChangeAuditScalarFieldEnum[]
  }

  /**
   * RoleChangeAudit findMany
   */
  export type RoleChangeAuditFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    /**
     * Filter, which RoleChangeAudits to fetch.
     */
    where?: RoleChangeAuditWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of RoleChangeAudits to fetch.
     */
    orderBy?: RoleChangeAuditOrderByWithRelationInput | RoleChangeAuditOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing RoleChangeAudits.
     */
    cursor?: RoleChangeAuditWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` RoleChangeAudits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` RoleChangeAudits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of RoleChangeAudits.
     */
    distinct?: RoleChangeAuditScalarFieldEnum | RoleChangeAuditScalarFieldEnum[]
  }

  /**
   * RoleChangeAudit create
   */
  export type RoleChangeAuditCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    /**
     * The data needed to create a RoleChangeAudit.
     */
    data: XOR<RoleChangeAuditCreateInput, RoleChangeAuditUncheckedCreateInput>
  }

  /**
   * RoleChangeAudit createMany
   */
  export type RoleChangeAuditCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RoleChangeAudits.
     */
    data: RoleChangeAuditCreateManyInput | RoleChangeAuditCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RoleChangeAudit createManyAndReturn
   */
  export type RoleChangeAuditCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * The data used to create many RoleChangeAudits.
     */
    data: RoleChangeAuditCreateManyInput | RoleChangeAuditCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * RoleChangeAudit update
   */
  export type RoleChangeAuditUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    /**
     * The data needed to update a RoleChangeAudit.
     */
    data: XOR<RoleChangeAuditUpdateInput, RoleChangeAuditUncheckedUpdateInput>
    /**
     * Choose, which RoleChangeAudit to update.
     */
    where: RoleChangeAuditWhereUniqueInput
  }

  /**
   * RoleChangeAudit updateMany
   */
  export type RoleChangeAuditUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RoleChangeAudits.
     */
    data: XOR<RoleChangeAuditUpdateManyMutationInput, RoleChangeAuditUncheckedUpdateManyInput>
    /**
     * Filter which RoleChangeAudits to update
     */
    where?: RoleChangeAuditWhereInput
    /**
     * Limit how many RoleChangeAudits to update.
     */
    limit?: number
  }

  /**
   * RoleChangeAudit updateManyAndReturn
   */
  export type RoleChangeAuditUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * The data used to update RoleChangeAudits.
     */
    data: XOR<RoleChangeAuditUpdateManyMutationInput, RoleChangeAuditUncheckedUpdateManyInput>
    /**
     * Filter which RoleChangeAudits to update
     */
    where?: RoleChangeAuditWhereInput
    /**
     * Limit how many RoleChangeAudits to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * RoleChangeAudit upsert
   */
  export type RoleChangeAuditUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    /**
     * The filter to search for the RoleChangeAudit to update in case it exists.
     */
    where: RoleChangeAuditWhereUniqueInput
    /**
     * In case the RoleChangeAudit found by the `where` argument doesn't exist, create a new RoleChangeAudit with this data.
     */
    create: XOR<RoleChangeAuditCreateInput, RoleChangeAuditUncheckedCreateInput>
    /**
     * In case the RoleChangeAudit was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RoleChangeAuditUpdateInput, RoleChangeAuditUncheckedUpdateInput>
  }

  /**
   * RoleChangeAudit delete
   */
  export type RoleChangeAuditDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
    /**
     * Filter which RoleChangeAudit to delete.
     */
    where: RoleChangeAuditWhereUniqueInput
  }

  /**
   * RoleChangeAudit deleteMany
   */
  export type RoleChangeAuditDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RoleChangeAudits to delete
     */
    where?: RoleChangeAuditWhereInput
    /**
     * Limit how many RoleChangeAudits to delete.
     */
    limit?: number
  }

  /**
   * RoleChangeAudit without action
   */
  export type RoleChangeAuditDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoleChangeAudit
     */
    select?: RoleChangeAuditSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RoleChangeAudit
     */
    omit?: RoleChangeAuditOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoleChangeAuditInclude<ExtArgs> | null
  }


  /**
   * Model Career
   */

  export type AggregateCareer = {
    _count: CareerCountAggregateOutputType | null
    _min: CareerMinAggregateOutputType | null
    _max: CareerMaxAggregateOutputType | null
  }

  export type CareerMinAggregateOutputType = {
    id: string | null
    name: string | null
    code: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CareerMaxAggregateOutputType = {
    id: string | null
    name: string | null
    code: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CareerCountAggregateOutputType = {
    id: number
    name: number
    code: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CareerMinAggregateInputType = {
    id?: true
    name?: true
    code?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CareerMaxAggregateInputType = {
    id?: true
    name?: true
    code?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CareerCountAggregateInputType = {
    id?: true
    name?: true
    code?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CareerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Career to aggregate.
     */
    where?: CareerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Careers to fetch.
     */
    orderBy?: CareerOrderByWithRelationInput | CareerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CareerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Careers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Careers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Careers
    **/
    _count?: true | CareerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: CareerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: CareerMaxAggregateInputType
  }

  export type GetCareerAggregateType<T extends CareerAggregateArgs> = {
        [P in keyof T & keyof AggregateCareer]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCareer[P]>
      : GetScalarType<T[P], AggregateCareer[P]>
  }




  export type CareerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CareerWhereInput
    orderBy?: CareerOrderByWithAggregationInput | CareerOrderByWithAggregationInput[]
    by: CareerScalarFieldEnum[] | CareerScalarFieldEnum
    having?: CareerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CareerCountAggregateInputType | true
    _min?: CareerMinAggregateInputType
    _max?: CareerMaxAggregateInputType
  }

  export type CareerGroupByOutputType = {
    id: string
    name: string
    code: string
    createdAt: Date
    updatedAt: Date
    _count: CareerCountAggregateOutputType | null
    _min: CareerMinAggregateOutputType | null
    _max: CareerMaxAggregateOutputType | null
  }

  type GetCareerGroupByPayload<T extends CareerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CareerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CareerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CareerGroupByOutputType[P]>
            : GetScalarType<T[P], CareerGroupByOutputType[P]>
        }
      >
    >


  export type CareerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    code?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    studyPlans?: boolean | Career$studyPlansArgs<ExtArgs>
    _count?: boolean | CareerCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["career"]>

  export type CareerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    code?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["career"]>

  export type CareerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    code?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["career"]>

  export type CareerSelectScalar = {
    id?: boolean
    name?: boolean
    code?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CareerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "code" | "createdAt" | "updatedAt", ExtArgs["result"]["career"]>
  export type CareerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    studyPlans?: boolean | Career$studyPlansArgs<ExtArgs>
    _count?: boolean | CareerCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CareerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CareerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CareerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Career"
    objects: {
      studyPlans: Prisma.$StudyPlanPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      code: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["career"]>
    composites: {}
  }

  type CareerGetPayload<S extends boolean | null | undefined | CareerDefaultArgs> = $Result.GetResult<Prisma.$CareerPayload, S>

  type CareerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CareerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CareerCountAggregateInputType | true
    }

  export interface CareerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Career'], meta: { name: 'Career' } }
    /**
     * Find zero or one Career that matches the filter.
     * @param {CareerFindUniqueArgs} args - Arguments to find a Career
     * @example
     * // Get one Career
     * const career = await prisma.career.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CareerFindUniqueArgs>(args: SelectSubset<T, CareerFindUniqueArgs<ExtArgs>>): Prisma__CareerClient<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Career that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CareerFindUniqueOrThrowArgs} args - Arguments to find a Career
     * @example
     * // Get one Career
     * const career = await prisma.career.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CareerFindUniqueOrThrowArgs>(args: SelectSubset<T, CareerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CareerClient<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Career that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareerFindFirstArgs} args - Arguments to find a Career
     * @example
     * // Get one Career
     * const career = await prisma.career.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CareerFindFirstArgs>(args?: SelectSubset<T, CareerFindFirstArgs<ExtArgs>>): Prisma__CareerClient<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Career that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareerFindFirstOrThrowArgs} args - Arguments to find a Career
     * @example
     * // Get one Career
     * const career = await prisma.career.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CareerFindFirstOrThrowArgs>(args?: SelectSubset<T, CareerFindFirstOrThrowArgs<ExtArgs>>): Prisma__CareerClient<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Careers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Careers
     * const careers = await prisma.career.findMany()
     *
     * // Get first 10 Careers
     * const careers = await prisma.career.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const careerWithIdOnly = await prisma.career.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CareerFindManyArgs>(args?: SelectSubset<T, CareerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Career.
     * @param {CareerCreateArgs} args - Arguments to create a Career.
     * @example
     * // Create one Career
     * const Career = await prisma.career.create({
     *   data: {
     *     // ... data to create a Career
     *   }
     * })
     *
     */
    create<T extends CareerCreateArgs>(args: SelectSubset<T, CareerCreateArgs<ExtArgs>>): Prisma__CareerClient<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Careers.
     * @param {CareerCreateManyArgs} args - Arguments to create many Careers.
     * @example
     * // Create many Careers
     * const career = await prisma.career.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CareerCreateManyArgs>(args?: SelectSubset<T, CareerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Careers and returns the data saved in the database.
     * @param {CareerCreateManyAndReturnArgs} args - Arguments to create many Careers.
     * @example
     * // Create many Careers
     * const career = await prisma.career.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Careers and only return the `id`
     * const careerWithIdOnly = await prisma.career.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CareerCreateManyAndReturnArgs>(args?: SelectSubset<T, CareerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Career.
     * @param {CareerDeleteArgs} args - Arguments to delete one Career.
     * @example
     * // Delete one Career
     * const Career = await prisma.career.delete({
     *   where: {
     *     // ... filter to delete one Career
     *   }
     * })
     *
     */
    delete<T extends CareerDeleteArgs>(args: SelectSubset<T, CareerDeleteArgs<ExtArgs>>): Prisma__CareerClient<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Career.
     * @param {CareerUpdateArgs} args - Arguments to update one Career.
     * @example
     * // Update one Career
     * const career = await prisma.career.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CareerUpdateArgs>(args: SelectSubset<T, CareerUpdateArgs<ExtArgs>>): Prisma__CareerClient<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Careers.
     * @param {CareerDeleteManyArgs} args - Arguments to filter Careers to delete.
     * @example
     * // Delete a few Careers
     * const { count } = await prisma.career.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CareerDeleteManyArgs>(args?: SelectSubset<T, CareerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Careers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Careers
     * const career = await prisma.career.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CareerUpdateManyArgs>(args: SelectSubset<T, CareerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Careers and returns the data updated in the database.
     * @param {CareerUpdateManyAndReturnArgs} args - Arguments to update many Careers.
     * @example
     * // Update many Careers
     * const career = await prisma.career.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Careers and only return the `id`
     * const careerWithIdOnly = await prisma.career.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CareerUpdateManyAndReturnArgs>(args: SelectSubset<T, CareerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Career.
     * @param {CareerUpsertArgs} args - Arguments to update or create a Career.
     * @example
     * // Update or create a Career
     * const career = await prisma.career.upsert({
     *   create: {
     *     // ... data to create a Career
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Career we want to update
     *   }
     * })
     */
    upsert<T extends CareerUpsertArgs>(args: SelectSubset<T, CareerUpsertArgs<ExtArgs>>): Prisma__CareerClient<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Careers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareerCountArgs} args - Arguments to filter Careers to count.
     * @example
     * // Count the number of Careers
     * const count = await prisma.career.count({
     *   where: {
     *     // ... the filter for the Careers we want to count
     *   }
     * })
    **/
    count<T extends CareerCountArgs>(
      args?: Subset<T, CareerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CareerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Career.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CareerAggregateArgs>(args: Subset<T, CareerAggregateArgs>): Prisma.PrismaPromise<GetCareerAggregateType<T>>

    /**
     * Group by Career.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CareerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends CareerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CareerGroupByArgs['orderBy'] }
        : { orderBy?: CareerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CareerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCareerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Career model
   */
  readonly fields: CareerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Career.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CareerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    studyPlans<T extends Career$studyPlansArgs<ExtArgs> = {}>(args?: Subset<T, Career$studyPlansArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Career model
   */
  interface CareerFieldRefs {
    readonly id: FieldRef<"Career", 'String'>
    readonly name: FieldRef<"Career", 'String'>
    readonly code: FieldRef<"Career", 'String'>
    readonly createdAt: FieldRef<"Career", 'DateTime'>
    readonly updatedAt: FieldRef<"Career", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * Career findUnique
   */
  export type CareerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
    /**
     * Filter, which Career to fetch.
     */
    where: CareerWhereUniqueInput
  }

  /**
   * Career findUniqueOrThrow
   */
  export type CareerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
    /**
     * Filter, which Career to fetch.
     */
    where: CareerWhereUniqueInput
  }

  /**
   * Career findFirst
   */
  export type CareerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
    /**
     * Filter, which Career to fetch.
     */
    where?: CareerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Careers to fetch.
     */
    orderBy?: CareerOrderByWithRelationInput | CareerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Careers.
     */
    cursor?: CareerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Careers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Careers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Careers.
     */
    distinct?: CareerScalarFieldEnum | CareerScalarFieldEnum[]
  }

  /**
   * Career findFirstOrThrow
   */
  export type CareerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
    /**
     * Filter, which Career to fetch.
     */
    where?: CareerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Careers to fetch.
     */
    orderBy?: CareerOrderByWithRelationInput | CareerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Careers.
     */
    cursor?: CareerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Careers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Careers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Careers.
     */
    distinct?: CareerScalarFieldEnum | CareerScalarFieldEnum[]
  }

  /**
   * Career findMany
   */
  export type CareerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
    /**
     * Filter, which Careers to fetch.
     */
    where?: CareerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Careers to fetch.
     */
    orderBy?: CareerOrderByWithRelationInput | CareerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Careers.
     */
    cursor?: CareerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Careers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Careers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Careers.
     */
    distinct?: CareerScalarFieldEnum | CareerScalarFieldEnum[]
  }

  /**
   * Career create
   */
  export type CareerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
    /**
     * The data needed to create a Career.
     */
    data: XOR<CareerCreateInput, CareerUncheckedCreateInput>
  }

  /**
   * Career createMany
   */
  export type CareerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Careers.
     */
    data: CareerCreateManyInput | CareerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Career createManyAndReturn
   */
  export type CareerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * The data used to create many Careers.
     */
    data: CareerCreateManyInput | CareerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Career update
   */
  export type CareerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
    /**
     * The data needed to update a Career.
     */
    data: XOR<CareerUpdateInput, CareerUncheckedUpdateInput>
    /**
     * Choose, which Career to update.
     */
    where: CareerWhereUniqueInput
  }

  /**
   * Career updateMany
   */
  export type CareerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Careers.
     */
    data: XOR<CareerUpdateManyMutationInput, CareerUncheckedUpdateManyInput>
    /**
     * Filter which Careers to update
     */
    where?: CareerWhereInput
    /**
     * Limit how many Careers to update.
     */
    limit?: number
  }

  /**
   * Career updateManyAndReturn
   */
  export type CareerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * The data used to update Careers.
     */
    data: XOR<CareerUpdateManyMutationInput, CareerUncheckedUpdateManyInput>
    /**
     * Filter which Careers to update
     */
    where?: CareerWhereInput
    /**
     * Limit how many Careers to update.
     */
    limit?: number
  }

  /**
   * Career upsert
   */
  export type CareerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
    /**
     * The filter to search for the Career to update in case it exists.
     */
    where: CareerWhereUniqueInput
    /**
     * In case the Career found by the `where` argument doesn't exist, create a new Career with this data.
     */
    create: XOR<CareerCreateInput, CareerUncheckedCreateInput>
    /**
     * In case the Career was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CareerUpdateInput, CareerUncheckedUpdateInput>
  }

  /**
   * Career delete
   */
  export type CareerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
    /**
     * Filter which Career to delete.
     */
    where: CareerWhereUniqueInput
  }

  /**
   * Career deleteMany
   */
  export type CareerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Careers to delete
     */
    where?: CareerWhereInput
    /**
     * Limit how many Careers to delete.
     */
    limit?: number
  }

  /**
   * Career.studyPlans
   */
  export type Career$studyPlansArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    where?: StudyPlanWhereInput
    orderBy?: StudyPlanOrderByWithRelationInput | StudyPlanOrderByWithRelationInput[]
    cursor?: StudyPlanWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StudyPlanScalarFieldEnum | StudyPlanScalarFieldEnum[]
  }

  /**
   * Career without action
   */
  export type CareerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Career
     */
    select?: CareerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Career
     */
    omit?: CareerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CareerInclude<ExtArgs> | null
  }


  /**
   * Model StudyPlan
   */

  export type AggregateStudyPlan = {
    _count: StudyPlanCountAggregateOutputType | null
    _min: StudyPlanMinAggregateOutputType | null
    _max: StudyPlanMaxAggregateOutputType | null
  }

  export type StudyPlanMinAggregateOutputType = {
    id: string | null
    careerId: string | null
    name: string | null
    code: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StudyPlanMaxAggregateOutputType = {
    id: string | null
    careerId: string | null
    name: string | null
    code: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type StudyPlanCountAggregateOutputType = {
    id: number
    careerId: number
    name: number
    code: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type StudyPlanMinAggregateInputType = {
    id?: true
    careerId?: true
    name?: true
    code?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StudyPlanMaxAggregateInputType = {
    id?: true
    careerId?: true
    name?: true
    code?: true
    createdAt?: true
    updatedAt?: true
  }

  export type StudyPlanCountAggregateInputType = {
    id?: true
    careerId?: true
    name?: true
    code?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type StudyPlanAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StudyPlan to aggregate.
     */
    where?: StudyPlanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of StudyPlans to fetch.
     */
    orderBy?: StudyPlanOrderByWithRelationInput | StudyPlanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: StudyPlanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` StudyPlans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` StudyPlans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned StudyPlans
    **/
    _count?: true | StudyPlanCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: StudyPlanMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: StudyPlanMaxAggregateInputType
  }

  export type GetStudyPlanAggregateType<T extends StudyPlanAggregateArgs> = {
        [P in keyof T & keyof AggregateStudyPlan]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStudyPlan[P]>
      : GetScalarType<T[P], AggregateStudyPlan[P]>
  }




  export type StudyPlanGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StudyPlanWhereInput
    orderBy?: StudyPlanOrderByWithAggregationInput | StudyPlanOrderByWithAggregationInput[]
    by: StudyPlanScalarFieldEnum[] | StudyPlanScalarFieldEnum
    having?: StudyPlanScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StudyPlanCountAggregateInputType | true
    _min?: StudyPlanMinAggregateInputType
    _max?: StudyPlanMaxAggregateInputType
  }

  export type StudyPlanGroupByOutputType = {
    id: string
    careerId: string
    name: string
    code: string
    createdAt: Date
    updatedAt: Date
    _count: StudyPlanCountAggregateOutputType | null
    _min: StudyPlanMinAggregateOutputType | null
    _max: StudyPlanMaxAggregateOutputType | null
  }

  type GetStudyPlanGroupByPayload<T extends StudyPlanGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StudyPlanGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StudyPlanGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StudyPlanGroupByOutputType[P]>
            : GetScalarType<T[P], StudyPlanGroupByOutputType[P]>
        }
      >
    >


  export type StudyPlanSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    careerId?: boolean
    name?: boolean
    code?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    career?: boolean | CareerDefaultArgs<ExtArgs>
    subjects?: boolean | StudyPlan$subjectsArgs<ExtArgs>
    _count?: boolean | StudyPlanCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studyPlan"]>

  export type StudyPlanSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    careerId?: boolean
    name?: boolean
    code?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    career?: boolean | CareerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studyPlan"]>

  export type StudyPlanSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    careerId?: boolean
    name?: boolean
    code?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    career?: boolean | CareerDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studyPlan"]>

  export type StudyPlanSelectScalar = {
    id?: boolean
    careerId?: boolean
    name?: boolean
    code?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type StudyPlanOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "careerId" | "name" | "code" | "createdAt" | "updatedAt", ExtArgs["result"]["studyPlan"]>
  export type StudyPlanInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    career?: boolean | CareerDefaultArgs<ExtArgs>
    subjects?: boolean | StudyPlan$subjectsArgs<ExtArgs>
    _count?: boolean | StudyPlanCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type StudyPlanIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    career?: boolean | CareerDefaultArgs<ExtArgs>
  }
  export type StudyPlanIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    career?: boolean | CareerDefaultArgs<ExtArgs>
  }

  export type $StudyPlanPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StudyPlan"
    objects: {
      career: Prisma.$CareerPayload<ExtArgs>
      subjects: Prisma.$StudyPlanSubjectPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      careerId: string
      name: string
      code: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["studyPlan"]>
    composites: {}
  }

  type StudyPlanGetPayload<S extends boolean | null | undefined | StudyPlanDefaultArgs> = $Result.GetResult<Prisma.$StudyPlanPayload, S>

  type StudyPlanCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StudyPlanFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StudyPlanCountAggregateInputType | true
    }

  export interface StudyPlanDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StudyPlan'], meta: { name: 'StudyPlan' } }
    /**
     * Find zero or one StudyPlan that matches the filter.
     * @param {StudyPlanFindUniqueArgs} args - Arguments to find a StudyPlan
     * @example
     * // Get one StudyPlan
     * const studyPlan = await prisma.studyPlan.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StudyPlanFindUniqueArgs>(args: SelectSubset<T, StudyPlanFindUniqueArgs<ExtArgs>>): Prisma__StudyPlanClient<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one StudyPlan that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StudyPlanFindUniqueOrThrowArgs} args - Arguments to find a StudyPlan
     * @example
     * // Get one StudyPlan
     * const studyPlan = await prisma.studyPlan.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StudyPlanFindUniqueOrThrowArgs>(args: SelectSubset<T, StudyPlanFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StudyPlanClient<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StudyPlan that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanFindFirstArgs} args - Arguments to find a StudyPlan
     * @example
     * // Get one StudyPlan
     * const studyPlan = await prisma.studyPlan.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StudyPlanFindFirstArgs>(args?: SelectSubset<T, StudyPlanFindFirstArgs<ExtArgs>>): Prisma__StudyPlanClient<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StudyPlan that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanFindFirstOrThrowArgs} args - Arguments to find a StudyPlan
     * @example
     * // Get one StudyPlan
     * const studyPlan = await prisma.studyPlan.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StudyPlanFindFirstOrThrowArgs>(args?: SelectSubset<T, StudyPlanFindFirstOrThrowArgs<ExtArgs>>): Prisma__StudyPlanClient<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more StudyPlans that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StudyPlans
     * const studyPlans = await prisma.studyPlan.findMany()
     *
     * // Get first 10 StudyPlans
     * const studyPlans = await prisma.studyPlan.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const studyPlanWithIdOnly = await prisma.studyPlan.findMany({ select: { id: true } })
     *
     */
    findMany<T extends StudyPlanFindManyArgs>(args?: SelectSubset<T, StudyPlanFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a StudyPlan.
     * @param {StudyPlanCreateArgs} args - Arguments to create a StudyPlan.
     * @example
     * // Create one StudyPlan
     * const StudyPlan = await prisma.studyPlan.create({
     *   data: {
     *     // ... data to create a StudyPlan
     *   }
     * })
     *
     */
    create<T extends StudyPlanCreateArgs>(args: SelectSubset<T, StudyPlanCreateArgs<ExtArgs>>): Prisma__StudyPlanClient<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many StudyPlans.
     * @param {StudyPlanCreateManyArgs} args - Arguments to create many StudyPlans.
     * @example
     * // Create many StudyPlans
     * const studyPlan = await prisma.studyPlan.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends StudyPlanCreateManyArgs>(args?: SelectSubset<T, StudyPlanCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StudyPlans and returns the data saved in the database.
     * @param {StudyPlanCreateManyAndReturnArgs} args - Arguments to create many StudyPlans.
     * @example
     * // Create many StudyPlans
     * const studyPlan = await prisma.studyPlan.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many StudyPlans and only return the `id`
     * const studyPlanWithIdOnly = await prisma.studyPlan.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends StudyPlanCreateManyAndReturnArgs>(args?: SelectSubset<T, StudyPlanCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a StudyPlan.
     * @param {StudyPlanDeleteArgs} args - Arguments to delete one StudyPlan.
     * @example
     * // Delete one StudyPlan
     * const StudyPlan = await prisma.studyPlan.delete({
     *   where: {
     *     // ... filter to delete one StudyPlan
     *   }
     * })
     *
     */
    delete<T extends StudyPlanDeleteArgs>(args: SelectSubset<T, StudyPlanDeleteArgs<ExtArgs>>): Prisma__StudyPlanClient<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one StudyPlan.
     * @param {StudyPlanUpdateArgs} args - Arguments to update one StudyPlan.
     * @example
     * // Update one StudyPlan
     * const studyPlan = await prisma.studyPlan.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends StudyPlanUpdateArgs>(args: SelectSubset<T, StudyPlanUpdateArgs<ExtArgs>>): Prisma__StudyPlanClient<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more StudyPlans.
     * @param {StudyPlanDeleteManyArgs} args - Arguments to filter StudyPlans to delete.
     * @example
     * // Delete a few StudyPlans
     * const { count } = await prisma.studyPlan.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends StudyPlanDeleteManyArgs>(args?: SelectSubset<T, StudyPlanDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StudyPlans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StudyPlans
     * const studyPlan = await prisma.studyPlan.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends StudyPlanUpdateManyArgs>(args: SelectSubset<T, StudyPlanUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StudyPlans and returns the data updated in the database.
     * @param {StudyPlanUpdateManyAndReturnArgs} args - Arguments to update many StudyPlans.
     * @example
     * // Update many StudyPlans
     * const studyPlan = await prisma.studyPlan.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more StudyPlans and only return the `id`
     * const studyPlanWithIdOnly = await prisma.studyPlan.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends StudyPlanUpdateManyAndReturnArgs>(args: SelectSubset<T, StudyPlanUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one StudyPlan.
     * @param {StudyPlanUpsertArgs} args - Arguments to update or create a StudyPlan.
     * @example
     * // Update or create a StudyPlan
     * const studyPlan = await prisma.studyPlan.upsert({
     *   create: {
     *     // ... data to create a StudyPlan
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StudyPlan we want to update
     *   }
     * })
     */
    upsert<T extends StudyPlanUpsertArgs>(args: SelectSubset<T, StudyPlanUpsertArgs<ExtArgs>>): Prisma__StudyPlanClient<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of StudyPlans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanCountArgs} args - Arguments to filter StudyPlans to count.
     * @example
     * // Count the number of StudyPlans
     * const count = await prisma.studyPlan.count({
     *   where: {
     *     // ... the filter for the StudyPlans we want to count
     *   }
     * })
    **/
    count<T extends StudyPlanCountArgs>(
      args?: Subset<T, StudyPlanCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StudyPlanCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StudyPlan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StudyPlanAggregateArgs>(args: Subset<T, StudyPlanAggregateArgs>): Prisma.PrismaPromise<GetStudyPlanAggregateType<T>>

    /**
     * Group by StudyPlan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends StudyPlanGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StudyPlanGroupByArgs['orderBy'] }
        : { orderBy?: StudyPlanGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StudyPlanGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStudyPlanGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StudyPlan model
   */
  readonly fields: StudyPlanFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StudyPlan.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StudyPlanClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    career<T extends CareerDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CareerDefaultArgs<ExtArgs>>): Prisma__CareerClient<$Result.GetResult<Prisma.$CareerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    subjects<T extends StudyPlan$subjectsArgs<ExtArgs> = {}>(args?: Subset<T, StudyPlan$subjectsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StudyPlan model
   */
  interface StudyPlanFieldRefs {
    readonly id: FieldRef<"StudyPlan", 'String'>
    readonly careerId: FieldRef<"StudyPlan", 'String'>
    readonly name: FieldRef<"StudyPlan", 'String'>
    readonly code: FieldRef<"StudyPlan", 'String'>
    readonly createdAt: FieldRef<"StudyPlan", 'DateTime'>
    readonly updatedAt: FieldRef<"StudyPlan", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * StudyPlan findUnique
   */
  export type StudyPlanFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlan to fetch.
     */
    where: StudyPlanWhereUniqueInput
  }

  /**
   * StudyPlan findUniqueOrThrow
   */
  export type StudyPlanFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlan to fetch.
     */
    where: StudyPlanWhereUniqueInput
  }

  /**
   * StudyPlan findFirst
   */
  export type StudyPlanFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlan to fetch.
     */
    where?: StudyPlanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of StudyPlans to fetch.
     */
    orderBy?: StudyPlanOrderByWithRelationInput | StudyPlanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for StudyPlans.
     */
    cursor?: StudyPlanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` StudyPlans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` StudyPlans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of StudyPlans.
     */
    distinct?: StudyPlanScalarFieldEnum | StudyPlanScalarFieldEnum[]
  }

  /**
   * StudyPlan findFirstOrThrow
   */
  export type StudyPlanFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlan to fetch.
     */
    where?: StudyPlanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of StudyPlans to fetch.
     */
    orderBy?: StudyPlanOrderByWithRelationInput | StudyPlanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for StudyPlans.
     */
    cursor?: StudyPlanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` StudyPlans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` StudyPlans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of StudyPlans.
     */
    distinct?: StudyPlanScalarFieldEnum | StudyPlanScalarFieldEnum[]
  }

  /**
   * StudyPlan findMany
   */
  export type StudyPlanFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlans to fetch.
     */
    where?: StudyPlanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of StudyPlans to fetch.
     */
    orderBy?: StudyPlanOrderByWithRelationInput | StudyPlanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing StudyPlans.
     */
    cursor?: StudyPlanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` StudyPlans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` StudyPlans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of StudyPlans.
     */
    distinct?: StudyPlanScalarFieldEnum | StudyPlanScalarFieldEnum[]
  }

  /**
   * StudyPlan create
   */
  export type StudyPlanCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    /**
     * The data needed to create a StudyPlan.
     */
    data: XOR<StudyPlanCreateInput, StudyPlanUncheckedCreateInput>
  }

  /**
   * StudyPlan createMany
   */
  export type StudyPlanCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StudyPlans.
     */
    data: StudyPlanCreateManyInput | StudyPlanCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StudyPlan createManyAndReturn
   */
  export type StudyPlanCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * The data used to create many StudyPlans.
     */
    data: StudyPlanCreateManyInput | StudyPlanCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StudyPlan update
   */
  export type StudyPlanUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    /**
     * The data needed to update a StudyPlan.
     */
    data: XOR<StudyPlanUpdateInput, StudyPlanUncheckedUpdateInput>
    /**
     * Choose, which StudyPlan to update.
     */
    where: StudyPlanWhereUniqueInput
  }

  /**
   * StudyPlan updateMany
   */
  export type StudyPlanUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StudyPlans.
     */
    data: XOR<StudyPlanUpdateManyMutationInput, StudyPlanUncheckedUpdateManyInput>
    /**
     * Filter which StudyPlans to update
     */
    where?: StudyPlanWhereInput
    /**
     * Limit how many StudyPlans to update.
     */
    limit?: number
  }

  /**
   * StudyPlan updateManyAndReturn
   */
  export type StudyPlanUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * The data used to update StudyPlans.
     */
    data: XOR<StudyPlanUpdateManyMutationInput, StudyPlanUncheckedUpdateManyInput>
    /**
     * Filter which StudyPlans to update
     */
    where?: StudyPlanWhereInput
    /**
     * Limit how many StudyPlans to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * StudyPlan upsert
   */
  export type StudyPlanUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    /**
     * The filter to search for the StudyPlan to update in case it exists.
     */
    where: StudyPlanWhereUniqueInput
    /**
     * In case the StudyPlan found by the `where` argument doesn't exist, create a new StudyPlan with this data.
     */
    create: XOR<StudyPlanCreateInput, StudyPlanUncheckedCreateInput>
    /**
     * In case the StudyPlan was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StudyPlanUpdateInput, StudyPlanUncheckedUpdateInput>
  }

  /**
   * StudyPlan delete
   */
  export type StudyPlanDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
    /**
     * Filter which StudyPlan to delete.
     */
    where: StudyPlanWhereUniqueInput
  }

  /**
   * StudyPlan deleteMany
   */
  export type StudyPlanDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StudyPlans to delete
     */
    where?: StudyPlanWhereInput
    /**
     * Limit how many StudyPlans to delete.
     */
    limit?: number
  }

  /**
   * StudyPlan.subjects
   */
  export type StudyPlan$subjectsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    where?: StudyPlanSubjectWhereInput
    orderBy?: StudyPlanSubjectOrderByWithRelationInput | StudyPlanSubjectOrderByWithRelationInput[]
    cursor?: StudyPlanSubjectWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StudyPlanSubjectScalarFieldEnum | StudyPlanSubjectScalarFieldEnum[]
  }

  /**
   * StudyPlan without action
   */
  export type StudyPlanDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlan
     */
    select?: StudyPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlan
     */
    omit?: StudyPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanInclude<ExtArgs> | null
  }


  /**
   * Model Subject
   */

  export type AggregateSubject = {
    _count: SubjectCountAggregateOutputType | null
    _min: SubjectMinAggregateOutputType | null
    _max: SubjectMaxAggregateOutputType | null
  }

  export type SubjectMinAggregateOutputType = {
    id: string | null
    name: string | null
    code: string | null
    description: string | null
    searchKey: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubjectMaxAggregateOutputType = {
    id: string | null
    name: string | null
    code: string | null
    description: string | null
    searchKey: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubjectCountAggregateOutputType = {
    id: number
    name: number
    code: number
    description: number
    searchKey: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SubjectMinAggregateInputType = {
    id?: true
    name?: true
    code?: true
    description?: true
    searchKey?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubjectMaxAggregateInputType = {
    id?: true
    name?: true
    code?: true
    description?: true
    searchKey?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubjectCountAggregateInputType = {
    id?: true
    name?: true
    code?: true
    description?: true
    searchKey?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SubjectAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subject to aggregate.
     */
    where?: SubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Subjects to fetch.
     */
    orderBy?: SubjectOrderByWithRelationInput | SubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: SubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Subjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Subjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Subjects
    **/
    _count?: true | SubjectCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: SubjectMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: SubjectMaxAggregateInputType
  }

  export type GetSubjectAggregateType<T extends SubjectAggregateArgs> = {
        [P in keyof T & keyof AggregateSubject]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubject[P]>
      : GetScalarType<T[P], AggregateSubject[P]>
  }




  export type SubjectGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubjectWhereInput
    orderBy?: SubjectOrderByWithAggregationInput | SubjectOrderByWithAggregationInput[]
    by: SubjectScalarFieldEnum[] | SubjectScalarFieldEnum
    having?: SubjectScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SubjectCountAggregateInputType | true
    _min?: SubjectMinAggregateInputType
    _max?: SubjectMaxAggregateInputType
  }

  export type SubjectGroupByOutputType = {
    id: string
    name: string
    code: string | null
    description: string | null
    searchKey: string
    createdAt: Date
    updatedAt: Date
    _count: SubjectCountAggregateOutputType | null
    _min: SubjectMinAggregateOutputType | null
    _max: SubjectMaxAggregateOutputType | null
  }

  type GetSubjectGroupByPayload<T extends SubjectGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubjectGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SubjectGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SubjectGroupByOutputType[P]>
            : GetScalarType<T[P], SubjectGroupByOutputType[P]>
        }
      >
    >


  export type SubjectSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    code?: boolean
    description?: boolean
    searchKey?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    studyPlans?: boolean | Subject$studyPlansArgs<ExtArgs>
    courses?: boolean | Subject$coursesArgs<ExtArgs>
    _count?: boolean | SubjectCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subject"]>

  export type SubjectSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    code?: boolean
    description?: boolean
    searchKey?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["subject"]>

  export type SubjectSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    code?: boolean
    description?: boolean
    searchKey?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["subject"]>

  export type SubjectSelectScalar = {
    id?: boolean
    name?: boolean
    code?: boolean
    description?: boolean
    searchKey?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SubjectOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "code" | "description" | "searchKey" | "createdAt" | "updatedAt", ExtArgs["result"]["subject"]>
  export type SubjectInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    studyPlans?: boolean | Subject$studyPlansArgs<ExtArgs>
    courses?: boolean | Subject$coursesArgs<ExtArgs>
    _count?: boolean | SubjectCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SubjectIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SubjectIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SubjectPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Subject"
    objects: {
      studyPlans: Prisma.$StudyPlanSubjectPayload<ExtArgs>[]
      courses: Prisma.$CoursePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      code: string | null
      description: string | null
      searchKey: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["subject"]>
    composites: {}
  }

  type SubjectGetPayload<S extends boolean | null | undefined | SubjectDefaultArgs> = $Result.GetResult<Prisma.$SubjectPayload, S>

  type SubjectCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SubjectFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SubjectCountAggregateInputType | true
    }

  export interface SubjectDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Subject'], meta: { name: 'Subject' } }
    /**
     * Find zero or one Subject that matches the filter.
     * @param {SubjectFindUniqueArgs} args - Arguments to find a Subject
     * @example
     * // Get one Subject
     * const subject = await prisma.subject.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubjectFindUniqueArgs>(args: SelectSubset<T, SubjectFindUniqueArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Subject that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SubjectFindUniqueOrThrowArgs} args - Arguments to find a Subject
     * @example
     * // Get one Subject
     * const subject = await prisma.subject.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubjectFindUniqueOrThrowArgs>(args: SelectSubset<T, SubjectFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subject that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectFindFirstArgs} args - Arguments to find a Subject
     * @example
     * // Get one Subject
     * const subject = await prisma.subject.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubjectFindFirstArgs>(args?: SelectSubset<T, SubjectFindFirstArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subject that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectFindFirstOrThrowArgs} args - Arguments to find a Subject
     * @example
     * // Get one Subject
     * const subject = await prisma.subject.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubjectFindFirstOrThrowArgs>(args?: SelectSubset<T, SubjectFindFirstOrThrowArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Subjects that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Subjects
     * const subjects = await prisma.subject.findMany()
     *
     * // Get first 10 Subjects
     * const subjects = await prisma.subject.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const subjectWithIdOnly = await prisma.subject.findMany({ select: { id: true } })
     *
     */
    findMany<T extends SubjectFindManyArgs>(args?: SelectSubset<T, SubjectFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Subject.
     * @param {SubjectCreateArgs} args - Arguments to create a Subject.
     * @example
     * // Create one Subject
     * const Subject = await prisma.subject.create({
     *   data: {
     *     // ... data to create a Subject
     *   }
     * })
     *
     */
    create<T extends SubjectCreateArgs>(args: SelectSubset<T, SubjectCreateArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Subjects.
     * @param {SubjectCreateManyArgs} args - Arguments to create many Subjects.
     * @example
     * // Create many Subjects
     * const subject = await prisma.subject.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends SubjectCreateManyArgs>(args?: SelectSubset<T, SubjectCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Subjects and returns the data saved in the database.
     * @param {SubjectCreateManyAndReturnArgs} args - Arguments to create many Subjects.
     * @example
     * // Create many Subjects
     * const subject = await prisma.subject.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Subjects and only return the `id`
     * const subjectWithIdOnly = await prisma.subject.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends SubjectCreateManyAndReturnArgs>(args?: SelectSubset<T, SubjectCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Subject.
     * @param {SubjectDeleteArgs} args - Arguments to delete one Subject.
     * @example
     * // Delete one Subject
     * const Subject = await prisma.subject.delete({
     *   where: {
     *     // ... filter to delete one Subject
     *   }
     * })
     *
     */
    delete<T extends SubjectDeleteArgs>(args: SelectSubset<T, SubjectDeleteArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Subject.
     * @param {SubjectUpdateArgs} args - Arguments to update one Subject.
     * @example
     * // Update one Subject
     * const subject = await prisma.subject.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends SubjectUpdateArgs>(args: SelectSubset<T, SubjectUpdateArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Subjects.
     * @param {SubjectDeleteManyArgs} args - Arguments to filter Subjects to delete.
     * @example
     * // Delete a few Subjects
     * const { count } = await prisma.subject.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends SubjectDeleteManyArgs>(args?: SelectSubset<T, SubjectDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subjects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Subjects
     * const subject = await prisma.subject.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends SubjectUpdateManyArgs>(args: SelectSubset<T, SubjectUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subjects and returns the data updated in the database.
     * @param {SubjectUpdateManyAndReturnArgs} args - Arguments to update many Subjects.
     * @example
     * // Update many Subjects
     * const subject = await prisma.subject.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Subjects and only return the `id`
     * const subjectWithIdOnly = await prisma.subject.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends SubjectUpdateManyAndReturnArgs>(args: SelectSubset<T, SubjectUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Subject.
     * @param {SubjectUpsertArgs} args - Arguments to update or create a Subject.
     * @example
     * // Update or create a Subject
     * const subject = await prisma.subject.upsert({
     *   create: {
     *     // ... data to create a Subject
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Subject we want to update
     *   }
     * })
     */
    upsert<T extends SubjectUpsertArgs>(args: SelectSubset<T, SubjectUpsertArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Subjects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectCountArgs} args - Arguments to filter Subjects to count.
     * @example
     * // Count the number of Subjects
     * const count = await prisma.subject.count({
     *   where: {
     *     // ... the filter for the Subjects we want to count
     *   }
     * })
    **/
    count<T extends SubjectCountArgs>(
      args?: Subset<T, SubjectCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SubjectCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Subject.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SubjectAggregateArgs>(args: Subset<T, SubjectAggregateArgs>): Prisma.PrismaPromise<GetSubjectAggregateType<T>>

    /**
     * Group by Subject.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubjectGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends SubjectGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubjectGroupByArgs['orderBy'] }
        : { orderBy?: SubjectGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SubjectGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubjectGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Subject model
   */
  readonly fields: SubjectFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Subject.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubjectClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    studyPlans<T extends Subject$studyPlansArgs<ExtArgs> = {}>(args?: Subset<T, Subject$studyPlansArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    courses<T extends Subject$coursesArgs<ExtArgs> = {}>(args?: Subset<T, Subject$coursesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Subject model
   */
  interface SubjectFieldRefs {
    readonly id: FieldRef<"Subject", 'String'>
    readonly name: FieldRef<"Subject", 'String'>
    readonly code: FieldRef<"Subject", 'String'>
    readonly description: FieldRef<"Subject", 'String'>
    readonly searchKey: FieldRef<"Subject", 'String'>
    readonly createdAt: FieldRef<"Subject", 'DateTime'>
    readonly updatedAt: FieldRef<"Subject", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * Subject findUnique
   */
  export type SubjectFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subject to fetch.
     */
    where: SubjectWhereUniqueInput
  }

  /**
   * Subject findUniqueOrThrow
   */
  export type SubjectFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subject to fetch.
     */
    where: SubjectWhereUniqueInput
  }

  /**
   * Subject findFirst
   */
  export type SubjectFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subject to fetch.
     */
    where?: SubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Subjects to fetch.
     */
    orderBy?: SubjectOrderByWithRelationInput | SubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Subjects.
     */
    cursor?: SubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Subjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Subjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Subjects.
     */
    distinct?: SubjectScalarFieldEnum | SubjectScalarFieldEnum[]
  }

  /**
   * Subject findFirstOrThrow
   */
  export type SubjectFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subject to fetch.
     */
    where?: SubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Subjects to fetch.
     */
    orderBy?: SubjectOrderByWithRelationInput | SubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Subjects.
     */
    cursor?: SubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Subjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Subjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Subjects.
     */
    distinct?: SubjectScalarFieldEnum | SubjectScalarFieldEnum[]
  }

  /**
   * Subject findMany
   */
  export type SubjectFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter, which Subjects to fetch.
     */
    where?: SubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Subjects to fetch.
     */
    orderBy?: SubjectOrderByWithRelationInput | SubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Subjects.
     */
    cursor?: SubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Subjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Subjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Subjects.
     */
    distinct?: SubjectScalarFieldEnum | SubjectScalarFieldEnum[]
  }

  /**
   * Subject create
   */
  export type SubjectCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * The data needed to create a Subject.
     */
    data: XOR<SubjectCreateInput, SubjectUncheckedCreateInput>
  }

  /**
   * Subject createMany
   */
  export type SubjectCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Subjects.
     */
    data: SubjectCreateManyInput | SubjectCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subject createManyAndReturn
   */
  export type SubjectCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * The data used to create many Subjects.
     */
    data: SubjectCreateManyInput | SubjectCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subject update
   */
  export type SubjectUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * The data needed to update a Subject.
     */
    data: XOR<SubjectUpdateInput, SubjectUncheckedUpdateInput>
    /**
     * Choose, which Subject to update.
     */
    where: SubjectWhereUniqueInput
  }

  /**
   * Subject updateMany
   */
  export type SubjectUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Subjects.
     */
    data: XOR<SubjectUpdateManyMutationInput, SubjectUncheckedUpdateManyInput>
    /**
     * Filter which Subjects to update
     */
    where?: SubjectWhereInput
    /**
     * Limit how many Subjects to update.
     */
    limit?: number
  }

  /**
   * Subject updateManyAndReturn
   */
  export type SubjectUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * The data used to update Subjects.
     */
    data: XOR<SubjectUpdateManyMutationInput, SubjectUncheckedUpdateManyInput>
    /**
     * Filter which Subjects to update
     */
    where?: SubjectWhereInput
    /**
     * Limit how many Subjects to update.
     */
    limit?: number
  }

  /**
   * Subject upsert
   */
  export type SubjectUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * The filter to search for the Subject to update in case it exists.
     */
    where: SubjectWhereUniqueInput
    /**
     * In case the Subject found by the `where` argument doesn't exist, create a new Subject with this data.
     */
    create: XOR<SubjectCreateInput, SubjectUncheckedCreateInput>
    /**
     * In case the Subject was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubjectUpdateInput, SubjectUncheckedUpdateInput>
  }

  /**
   * Subject delete
   */
  export type SubjectDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    /**
     * Filter which Subject to delete.
     */
    where: SubjectWhereUniqueInput
  }

  /**
   * Subject deleteMany
   */
  export type SubjectDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subjects to delete
     */
    where?: SubjectWhereInput
    /**
     * Limit how many Subjects to delete.
     */
    limit?: number
  }

  /**
   * Subject.studyPlans
   */
  export type Subject$studyPlansArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    where?: StudyPlanSubjectWhereInput
    orderBy?: StudyPlanSubjectOrderByWithRelationInput | StudyPlanSubjectOrderByWithRelationInput[]
    cursor?: StudyPlanSubjectWhereUniqueInput
    take?: number
    skip?: number
    distinct?: StudyPlanSubjectScalarFieldEnum | StudyPlanSubjectScalarFieldEnum[]
  }

  /**
   * Subject.courses
   */
  export type Subject$coursesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    where?: CourseWhereInput
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    cursor?: CourseWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CourseScalarFieldEnum | CourseScalarFieldEnum[]
  }

  /**
   * Subject without action
   */
  export type SubjectDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
  }


  /**
   * Model StudyPlanSubject
   */

  export type AggregateStudyPlanSubject = {
    _count: StudyPlanSubjectCountAggregateOutputType | null
    _avg: StudyPlanSubjectAvgAggregateOutputType | null
    _sum: StudyPlanSubjectSumAggregateOutputType | null
    _min: StudyPlanSubjectMinAggregateOutputType | null
    _max: StudyPlanSubjectMaxAggregateOutputType | null
  }

  export type StudyPlanSubjectAvgAggregateOutputType = {
    year: number | null
    semester: number | null
    credits: number | null
  }

  export type StudyPlanSubjectSumAggregateOutputType = {
    year: number | null
    semester: number | null
    credits: number | null
  }

  export type StudyPlanSubjectMinAggregateOutputType = {
    id: string | null
    studyPlanId: string | null
    subjectId: string | null
    year: number | null
    semester: number | null
    credits: number | null
  }

  export type StudyPlanSubjectMaxAggregateOutputType = {
    id: string | null
    studyPlanId: string | null
    subjectId: string | null
    year: number | null
    semester: number | null
    credits: number | null
  }

  export type StudyPlanSubjectCountAggregateOutputType = {
    id: number
    studyPlanId: number
    subjectId: number
    year: number
    semester: number
    credits: number
    _all: number
  }


  export type StudyPlanSubjectAvgAggregateInputType = {
    year?: true
    semester?: true
    credits?: true
  }

  export type StudyPlanSubjectSumAggregateInputType = {
    year?: true
    semester?: true
    credits?: true
  }

  export type StudyPlanSubjectMinAggregateInputType = {
    id?: true
    studyPlanId?: true
    subjectId?: true
    year?: true
    semester?: true
    credits?: true
  }

  export type StudyPlanSubjectMaxAggregateInputType = {
    id?: true
    studyPlanId?: true
    subjectId?: true
    year?: true
    semester?: true
    credits?: true
  }

  export type StudyPlanSubjectCountAggregateInputType = {
    id?: true
    studyPlanId?: true
    subjectId?: true
    year?: true
    semester?: true
    credits?: true
    _all?: true
  }

  export type StudyPlanSubjectAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StudyPlanSubject to aggregate.
     */
    where?: StudyPlanSubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of StudyPlanSubjects to fetch.
     */
    orderBy?: StudyPlanSubjectOrderByWithRelationInput | StudyPlanSubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: StudyPlanSubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` StudyPlanSubjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` StudyPlanSubjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned StudyPlanSubjects
    **/
    _count?: true | StudyPlanSubjectCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: StudyPlanSubjectAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: StudyPlanSubjectSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: StudyPlanSubjectMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: StudyPlanSubjectMaxAggregateInputType
  }

  export type GetStudyPlanSubjectAggregateType<T extends StudyPlanSubjectAggregateArgs> = {
        [P in keyof T & keyof AggregateStudyPlanSubject]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStudyPlanSubject[P]>
      : GetScalarType<T[P], AggregateStudyPlanSubject[P]>
  }




  export type StudyPlanSubjectGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StudyPlanSubjectWhereInput
    orderBy?: StudyPlanSubjectOrderByWithAggregationInput | StudyPlanSubjectOrderByWithAggregationInput[]
    by: StudyPlanSubjectScalarFieldEnum[] | StudyPlanSubjectScalarFieldEnum
    having?: StudyPlanSubjectScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StudyPlanSubjectCountAggregateInputType | true
    _avg?: StudyPlanSubjectAvgAggregateInputType
    _sum?: StudyPlanSubjectSumAggregateInputType
    _min?: StudyPlanSubjectMinAggregateInputType
    _max?: StudyPlanSubjectMaxAggregateInputType
  }

  export type StudyPlanSubjectGroupByOutputType = {
    id: string
    studyPlanId: string
    subjectId: string
    year: number
    semester: number
    credits: number | null
    _count: StudyPlanSubjectCountAggregateOutputType | null
    _avg: StudyPlanSubjectAvgAggregateOutputType | null
    _sum: StudyPlanSubjectSumAggregateOutputType | null
    _min: StudyPlanSubjectMinAggregateOutputType | null
    _max: StudyPlanSubjectMaxAggregateOutputType | null
  }

  type GetStudyPlanSubjectGroupByPayload<T extends StudyPlanSubjectGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StudyPlanSubjectGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StudyPlanSubjectGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StudyPlanSubjectGroupByOutputType[P]>
            : GetScalarType<T[P], StudyPlanSubjectGroupByOutputType[P]>
        }
      >
    >


  export type StudyPlanSubjectSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    studyPlanId?: boolean
    subjectId?: boolean
    year?: boolean
    semester?: boolean
    credits?: boolean
    studyPlan?: boolean | StudyPlanDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studyPlanSubject"]>

  export type StudyPlanSubjectSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    studyPlanId?: boolean
    subjectId?: boolean
    year?: boolean
    semester?: boolean
    credits?: boolean
    studyPlan?: boolean | StudyPlanDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studyPlanSubject"]>

  export type StudyPlanSubjectSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    studyPlanId?: boolean
    subjectId?: boolean
    year?: boolean
    semester?: boolean
    credits?: boolean
    studyPlan?: boolean | StudyPlanDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["studyPlanSubject"]>

  export type StudyPlanSubjectSelectScalar = {
    id?: boolean
    studyPlanId?: boolean
    subjectId?: boolean
    year?: boolean
    semester?: boolean
    credits?: boolean
  }

  export type StudyPlanSubjectOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "studyPlanId" | "subjectId" | "year" | "semester" | "credits", ExtArgs["result"]["studyPlanSubject"]>
  export type StudyPlanSubjectInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    studyPlan?: boolean | StudyPlanDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
  }
  export type StudyPlanSubjectIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    studyPlan?: boolean | StudyPlanDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
  }
  export type StudyPlanSubjectIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    studyPlan?: boolean | StudyPlanDefaultArgs<ExtArgs>
    subject?: boolean | SubjectDefaultArgs<ExtArgs>
  }

  export type $StudyPlanSubjectPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StudyPlanSubject"
    objects: {
      studyPlan: Prisma.$StudyPlanPayload<ExtArgs>
      subject: Prisma.$SubjectPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      studyPlanId: string
      subjectId: string
      year: number
      semester: number
      credits: number | null
    }, ExtArgs["result"]["studyPlanSubject"]>
    composites: {}
  }

  type StudyPlanSubjectGetPayload<S extends boolean | null | undefined | StudyPlanSubjectDefaultArgs> = $Result.GetResult<Prisma.$StudyPlanSubjectPayload, S>

  type StudyPlanSubjectCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StudyPlanSubjectFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StudyPlanSubjectCountAggregateInputType | true
    }

  export interface StudyPlanSubjectDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StudyPlanSubject'], meta: { name: 'StudyPlanSubject' } }
    /**
     * Find zero or one StudyPlanSubject that matches the filter.
     * @param {StudyPlanSubjectFindUniqueArgs} args - Arguments to find a StudyPlanSubject
     * @example
     * // Get one StudyPlanSubject
     * const studyPlanSubject = await prisma.studyPlanSubject.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StudyPlanSubjectFindUniqueArgs>(args: SelectSubset<T, StudyPlanSubjectFindUniqueArgs<ExtArgs>>): Prisma__StudyPlanSubjectClient<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one StudyPlanSubject that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StudyPlanSubjectFindUniqueOrThrowArgs} args - Arguments to find a StudyPlanSubject
     * @example
     * // Get one StudyPlanSubject
     * const studyPlanSubject = await prisma.studyPlanSubject.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StudyPlanSubjectFindUniqueOrThrowArgs>(args: SelectSubset<T, StudyPlanSubjectFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StudyPlanSubjectClient<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StudyPlanSubject that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanSubjectFindFirstArgs} args - Arguments to find a StudyPlanSubject
     * @example
     * // Get one StudyPlanSubject
     * const studyPlanSubject = await prisma.studyPlanSubject.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StudyPlanSubjectFindFirstArgs>(args?: SelectSubset<T, StudyPlanSubjectFindFirstArgs<ExtArgs>>): Prisma__StudyPlanSubjectClient<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first StudyPlanSubject that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanSubjectFindFirstOrThrowArgs} args - Arguments to find a StudyPlanSubject
     * @example
     * // Get one StudyPlanSubject
     * const studyPlanSubject = await prisma.studyPlanSubject.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StudyPlanSubjectFindFirstOrThrowArgs>(args?: SelectSubset<T, StudyPlanSubjectFindFirstOrThrowArgs<ExtArgs>>): Prisma__StudyPlanSubjectClient<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more StudyPlanSubjects that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanSubjectFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StudyPlanSubjects
     * const studyPlanSubjects = await prisma.studyPlanSubject.findMany()
     *
     * // Get first 10 StudyPlanSubjects
     * const studyPlanSubjects = await prisma.studyPlanSubject.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const studyPlanSubjectWithIdOnly = await prisma.studyPlanSubject.findMany({ select: { id: true } })
     *
     */
    findMany<T extends StudyPlanSubjectFindManyArgs>(args?: SelectSubset<T, StudyPlanSubjectFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a StudyPlanSubject.
     * @param {StudyPlanSubjectCreateArgs} args - Arguments to create a StudyPlanSubject.
     * @example
     * // Create one StudyPlanSubject
     * const StudyPlanSubject = await prisma.studyPlanSubject.create({
     *   data: {
     *     // ... data to create a StudyPlanSubject
     *   }
     * })
     *
     */
    create<T extends StudyPlanSubjectCreateArgs>(args: SelectSubset<T, StudyPlanSubjectCreateArgs<ExtArgs>>): Prisma__StudyPlanSubjectClient<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many StudyPlanSubjects.
     * @param {StudyPlanSubjectCreateManyArgs} args - Arguments to create many StudyPlanSubjects.
     * @example
     * // Create many StudyPlanSubjects
     * const studyPlanSubject = await prisma.studyPlanSubject.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends StudyPlanSubjectCreateManyArgs>(args?: SelectSubset<T, StudyPlanSubjectCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StudyPlanSubjects and returns the data saved in the database.
     * @param {StudyPlanSubjectCreateManyAndReturnArgs} args - Arguments to create many StudyPlanSubjects.
     * @example
     * // Create many StudyPlanSubjects
     * const studyPlanSubject = await prisma.studyPlanSubject.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many StudyPlanSubjects and only return the `id`
     * const studyPlanSubjectWithIdOnly = await prisma.studyPlanSubject.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends StudyPlanSubjectCreateManyAndReturnArgs>(args?: SelectSubset<T, StudyPlanSubjectCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a StudyPlanSubject.
     * @param {StudyPlanSubjectDeleteArgs} args - Arguments to delete one StudyPlanSubject.
     * @example
     * // Delete one StudyPlanSubject
     * const StudyPlanSubject = await prisma.studyPlanSubject.delete({
     *   where: {
     *     // ... filter to delete one StudyPlanSubject
     *   }
     * })
     *
     */
    delete<T extends StudyPlanSubjectDeleteArgs>(args: SelectSubset<T, StudyPlanSubjectDeleteArgs<ExtArgs>>): Prisma__StudyPlanSubjectClient<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one StudyPlanSubject.
     * @param {StudyPlanSubjectUpdateArgs} args - Arguments to update one StudyPlanSubject.
     * @example
     * // Update one StudyPlanSubject
     * const studyPlanSubject = await prisma.studyPlanSubject.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends StudyPlanSubjectUpdateArgs>(args: SelectSubset<T, StudyPlanSubjectUpdateArgs<ExtArgs>>): Prisma__StudyPlanSubjectClient<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more StudyPlanSubjects.
     * @param {StudyPlanSubjectDeleteManyArgs} args - Arguments to filter StudyPlanSubjects to delete.
     * @example
     * // Delete a few StudyPlanSubjects
     * const { count } = await prisma.studyPlanSubject.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends StudyPlanSubjectDeleteManyArgs>(args?: SelectSubset<T, StudyPlanSubjectDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StudyPlanSubjects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanSubjectUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StudyPlanSubjects
     * const studyPlanSubject = await prisma.studyPlanSubject.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends StudyPlanSubjectUpdateManyArgs>(args: SelectSubset<T, StudyPlanSubjectUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StudyPlanSubjects and returns the data updated in the database.
     * @param {StudyPlanSubjectUpdateManyAndReturnArgs} args - Arguments to update many StudyPlanSubjects.
     * @example
     * // Update many StudyPlanSubjects
     * const studyPlanSubject = await prisma.studyPlanSubject.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more StudyPlanSubjects and only return the `id`
     * const studyPlanSubjectWithIdOnly = await prisma.studyPlanSubject.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends StudyPlanSubjectUpdateManyAndReturnArgs>(args: SelectSubset<T, StudyPlanSubjectUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one StudyPlanSubject.
     * @param {StudyPlanSubjectUpsertArgs} args - Arguments to update or create a StudyPlanSubject.
     * @example
     * // Update or create a StudyPlanSubject
     * const studyPlanSubject = await prisma.studyPlanSubject.upsert({
     *   create: {
     *     // ... data to create a StudyPlanSubject
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StudyPlanSubject we want to update
     *   }
     * })
     */
    upsert<T extends StudyPlanSubjectUpsertArgs>(args: SelectSubset<T, StudyPlanSubjectUpsertArgs<ExtArgs>>): Prisma__StudyPlanSubjectClient<$Result.GetResult<Prisma.$StudyPlanSubjectPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of StudyPlanSubjects.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanSubjectCountArgs} args - Arguments to filter StudyPlanSubjects to count.
     * @example
     * // Count the number of StudyPlanSubjects
     * const count = await prisma.studyPlanSubject.count({
     *   where: {
     *     // ... the filter for the StudyPlanSubjects we want to count
     *   }
     * })
    **/
    count<T extends StudyPlanSubjectCountArgs>(
      args?: Subset<T, StudyPlanSubjectCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StudyPlanSubjectCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StudyPlanSubject.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanSubjectAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends StudyPlanSubjectAggregateArgs>(args: Subset<T, StudyPlanSubjectAggregateArgs>): Prisma.PrismaPromise<GetStudyPlanSubjectAggregateType<T>>

    /**
     * Group by StudyPlanSubject.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StudyPlanSubjectGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends StudyPlanSubjectGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StudyPlanSubjectGroupByArgs['orderBy'] }
        : { orderBy?: StudyPlanSubjectGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, StudyPlanSubjectGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStudyPlanSubjectGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StudyPlanSubject model
   */
  readonly fields: StudyPlanSubjectFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StudyPlanSubject.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StudyPlanSubjectClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    studyPlan<T extends StudyPlanDefaultArgs<ExtArgs> = {}>(args?: Subset<T, StudyPlanDefaultArgs<ExtArgs>>): Prisma__StudyPlanClient<$Result.GetResult<Prisma.$StudyPlanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    subject<T extends SubjectDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SubjectDefaultArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the StudyPlanSubject model
   */
  interface StudyPlanSubjectFieldRefs {
    readonly id: FieldRef<"StudyPlanSubject", 'String'>
    readonly studyPlanId: FieldRef<"StudyPlanSubject", 'String'>
    readonly subjectId: FieldRef<"StudyPlanSubject", 'String'>
    readonly year: FieldRef<"StudyPlanSubject", 'Int'>
    readonly semester: FieldRef<"StudyPlanSubject", 'Int'>
    readonly credits: FieldRef<"StudyPlanSubject", 'Int'>
  }


  // Custom InputTypes
  /**
   * StudyPlanSubject findUnique
   */
  export type StudyPlanSubjectFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlanSubject to fetch.
     */
    where: StudyPlanSubjectWhereUniqueInput
  }

  /**
   * StudyPlanSubject findUniqueOrThrow
   */
  export type StudyPlanSubjectFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlanSubject to fetch.
     */
    where: StudyPlanSubjectWhereUniqueInput
  }

  /**
   * StudyPlanSubject findFirst
   */
  export type StudyPlanSubjectFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlanSubject to fetch.
     */
    where?: StudyPlanSubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of StudyPlanSubjects to fetch.
     */
    orderBy?: StudyPlanSubjectOrderByWithRelationInput | StudyPlanSubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for StudyPlanSubjects.
     */
    cursor?: StudyPlanSubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` StudyPlanSubjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` StudyPlanSubjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of StudyPlanSubjects.
     */
    distinct?: StudyPlanSubjectScalarFieldEnum | StudyPlanSubjectScalarFieldEnum[]
  }

  /**
   * StudyPlanSubject findFirstOrThrow
   */
  export type StudyPlanSubjectFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlanSubject to fetch.
     */
    where?: StudyPlanSubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of StudyPlanSubjects to fetch.
     */
    orderBy?: StudyPlanSubjectOrderByWithRelationInput | StudyPlanSubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for StudyPlanSubjects.
     */
    cursor?: StudyPlanSubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` StudyPlanSubjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` StudyPlanSubjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of StudyPlanSubjects.
     */
    distinct?: StudyPlanSubjectScalarFieldEnum | StudyPlanSubjectScalarFieldEnum[]
  }

  /**
   * StudyPlanSubject findMany
   */
  export type StudyPlanSubjectFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    /**
     * Filter, which StudyPlanSubjects to fetch.
     */
    where?: StudyPlanSubjectWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of StudyPlanSubjects to fetch.
     */
    orderBy?: StudyPlanSubjectOrderByWithRelationInput | StudyPlanSubjectOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing StudyPlanSubjects.
     */
    cursor?: StudyPlanSubjectWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` StudyPlanSubjects from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` StudyPlanSubjects.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of StudyPlanSubjects.
     */
    distinct?: StudyPlanSubjectScalarFieldEnum | StudyPlanSubjectScalarFieldEnum[]
  }

  /**
   * StudyPlanSubject create
   */
  export type StudyPlanSubjectCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    /**
     * The data needed to create a StudyPlanSubject.
     */
    data: XOR<StudyPlanSubjectCreateInput, StudyPlanSubjectUncheckedCreateInput>
  }

  /**
   * StudyPlanSubject createMany
   */
  export type StudyPlanSubjectCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StudyPlanSubjects.
     */
    data: StudyPlanSubjectCreateManyInput | StudyPlanSubjectCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StudyPlanSubject createManyAndReturn
   */
  export type StudyPlanSubjectCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * The data used to create many StudyPlanSubjects.
     */
    data: StudyPlanSubjectCreateManyInput | StudyPlanSubjectCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * StudyPlanSubject update
   */
  export type StudyPlanSubjectUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    /**
     * The data needed to update a StudyPlanSubject.
     */
    data: XOR<StudyPlanSubjectUpdateInput, StudyPlanSubjectUncheckedUpdateInput>
    /**
     * Choose, which StudyPlanSubject to update.
     */
    where: StudyPlanSubjectWhereUniqueInput
  }

  /**
   * StudyPlanSubject updateMany
   */
  export type StudyPlanSubjectUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StudyPlanSubjects.
     */
    data: XOR<StudyPlanSubjectUpdateManyMutationInput, StudyPlanSubjectUncheckedUpdateManyInput>
    /**
     * Filter which StudyPlanSubjects to update
     */
    where?: StudyPlanSubjectWhereInput
    /**
     * Limit how many StudyPlanSubjects to update.
     */
    limit?: number
  }

  /**
   * StudyPlanSubject updateManyAndReturn
   */
  export type StudyPlanSubjectUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * The data used to update StudyPlanSubjects.
     */
    data: XOR<StudyPlanSubjectUpdateManyMutationInput, StudyPlanSubjectUncheckedUpdateManyInput>
    /**
     * Filter which StudyPlanSubjects to update
     */
    where?: StudyPlanSubjectWhereInput
    /**
     * Limit how many StudyPlanSubjects to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * StudyPlanSubject upsert
   */
  export type StudyPlanSubjectUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    /**
     * The filter to search for the StudyPlanSubject to update in case it exists.
     */
    where: StudyPlanSubjectWhereUniqueInput
    /**
     * In case the StudyPlanSubject found by the `where` argument doesn't exist, create a new StudyPlanSubject with this data.
     */
    create: XOR<StudyPlanSubjectCreateInput, StudyPlanSubjectUncheckedCreateInput>
    /**
     * In case the StudyPlanSubject was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StudyPlanSubjectUpdateInput, StudyPlanSubjectUncheckedUpdateInput>
  }

  /**
   * StudyPlanSubject delete
   */
  export type StudyPlanSubjectDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
    /**
     * Filter which StudyPlanSubject to delete.
     */
    where: StudyPlanSubjectWhereUniqueInput
  }

  /**
   * StudyPlanSubject deleteMany
   */
  export type StudyPlanSubjectDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StudyPlanSubjects to delete
     */
    where?: StudyPlanSubjectWhereInput
    /**
     * Limit how many StudyPlanSubjects to delete.
     */
    limit?: number
  }

  /**
   * StudyPlanSubject without action
   */
  export type StudyPlanSubjectDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StudyPlanSubject
     */
    select?: StudyPlanSubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the StudyPlanSubject
     */
    omit?: StudyPlanSubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: StudyPlanSubjectInclude<ExtArgs> | null
  }


  /**
   * Model Course
   */

  export type AggregateCourse = {
    _count: CourseCountAggregateOutputType | null
    _avg: CourseAvgAggregateOutputType | null
    _sum: CourseSumAggregateOutputType | null
    _min: CourseMinAggregateOutputType | null
    _max: CourseMaxAggregateOutputType | null
  }

  export type CourseAvgAggregateOutputType = {
    creatorId: number | null
  }

  export type CourseSumAggregateOutputType = {
    creatorId: number | null
  }

  export type CourseMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    status: $Enums.CourseStatus | null
    creatorId: number | null
    subjectId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    status: $Enums.CourseStatus | null
    creatorId: number | null
    subjectId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseCountAggregateOutputType = {
    id: number
    title: number
    description: number
    status: number
    creatorId: number
    subjectId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CourseAvgAggregateInputType = {
    creatorId?: true
  }

  export type CourseSumAggregateInputType = {
    creatorId?: true
  }

  export type CourseMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    creatorId?: true
    subjectId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    creatorId?: true
    subjectId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    status?: true
    creatorId?: true
    subjectId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CourseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Course to aggregate.
     */
    where?: CourseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Courses to fetch.
     */
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CourseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Courses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Courses
    **/
    _count?: true | CourseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: CourseAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: CourseSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: CourseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: CourseMaxAggregateInputType
  }

  export type GetCourseAggregateType<T extends CourseAggregateArgs> = {
        [P in keyof T & keyof AggregateCourse]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCourse[P]>
      : GetScalarType<T[P], AggregateCourse[P]>
  }




  export type CourseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseWhereInput
    orderBy?: CourseOrderByWithAggregationInput | CourseOrderByWithAggregationInput[]
    by: CourseScalarFieldEnum[] | CourseScalarFieldEnum
    having?: CourseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CourseCountAggregateInputType | true
    _avg?: CourseAvgAggregateInputType
    _sum?: CourseSumAggregateInputType
    _min?: CourseMinAggregateInputType
    _max?: CourseMaxAggregateInputType
  }

  export type CourseGroupByOutputType = {
    id: string
    title: string
    description: string
    status: $Enums.CourseStatus
    creatorId: number
    subjectId: string | null
    createdAt: Date
    updatedAt: Date
    _count: CourseCountAggregateOutputType | null
    _avg: CourseAvgAggregateOutputType | null
    _sum: CourseSumAggregateOutputType | null
    _min: CourseMinAggregateOutputType | null
    _max: CourseMaxAggregateOutputType | null
  }

  type GetCourseGroupByPayload<T extends CourseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CourseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CourseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CourseGroupByOutputType[P]>
            : GetScalarType<T[P], CourseGroupByOutputType[P]>
        }
      >
    >


  export type CourseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    creatorId?: boolean
    subjectId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
    subject?: boolean | Course$subjectArgs<ExtArgs>
    sections?: boolean | Course$sectionsArgs<ExtArgs>
    enrollments?: boolean | Course$enrollmentsArgs<ExtArgs>
    _count?: boolean | CourseCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["course"]>

  export type CourseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    creatorId?: boolean
    subjectId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
    subject?: boolean | Course$subjectArgs<ExtArgs>
  }, ExtArgs["result"]["course"]>

  export type CourseSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    creatorId?: boolean
    subjectId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
    subject?: boolean | Course$subjectArgs<ExtArgs>
  }, ExtArgs["result"]["course"]>

  export type CourseSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    status?: boolean
    creatorId?: boolean
    subjectId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CourseOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "description" | "status" | "creatorId" | "subjectId" | "createdAt" | "updatedAt", ExtArgs["result"]["course"]>
  export type CourseInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
    subject?: boolean | Course$subjectArgs<ExtArgs>
    sections?: boolean | Course$sectionsArgs<ExtArgs>
    enrollments?: boolean | Course$enrollmentsArgs<ExtArgs>
    _count?: boolean | CourseCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CourseIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
    subject?: boolean | Course$subjectArgs<ExtArgs>
  }
  export type CourseIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
    subject?: boolean | Course$subjectArgs<ExtArgs>
  }

  export type $CoursePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Course"
    objects: {
      creator: Prisma.$UserPayload<ExtArgs>
      subject: Prisma.$SubjectPayload<ExtArgs> | null
      sections: Prisma.$CourseSectionPayload<ExtArgs>[]
      enrollments: Prisma.$CourseEnrollmentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string
      status: $Enums.CourseStatus
      creatorId: number
      subjectId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["course"]>
    composites: {}
  }

  type CourseGetPayload<S extends boolean | null | undefined | CourseDefaultArgs> = $Result.GetResult<Prisma.$CoursePayload, S>

  type CourseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CourseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CourseCountAggregateInputType | true
    }

  export interface CourseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Course'], meta: { name: 'Course' } }
    /**
     * Find zero or one Course that matches the filter.
     * @param {CourseFindUniqueArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CourseFindUniqueArgs>(args: SelectSubset<T, CourseFindUniqueArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Course that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CourseFindUniqueOrThrowArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CourseFindUniqueOrThrowArgs>(args: SelectSubset<T, CourseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Course that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFindFirstArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CourseFindFirstArgs>(args?: SelectSubset<T, CourseFindFirstArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Course that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFindFirstOrThrowArgs} args - Arguments to find a Course
     * @example
     * // Get one Course
     * const course = await prisma.course.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CourseFindFirstOrThrowArgs>(args?: SelectSubset<T, CourseFindFirstOrThrowArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Courses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Courses
     * const courses = await prisma.course.findMany()
     *
     * // Get first 10 Courses
     * const courses = await prisma.course.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const courseWithIdOnly = await prisma.course.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CourseFindManyArgs>(args?: SelectSubset<T, CourseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Course.
     * @param {CourseCreateArgs} args - Arguments to create a Course.
     * @example
     * // Create one Course
     * const Course = await prisma.course.create({
     *   data: {
     *     // ... data to create a Course
     *   }
     * })
     *
     */
    create<T extends CourseCreateArgs>(args: SelectSubset<T, CourseCreateArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Courses.
     * @param {CourseCreateManyArgs} args - Arguments to create many Courses.
     * @example
     * // Create many Courses
     * const course = await prisma.course.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CourseCreateManyArgs>(args?: SelectSubset<T, CourseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Courses and returns the data saved in the database.
     * @param {CourseCreateManyAndReturnArgs} args - Arguments to create many Courses.
     * @example
     * // Create many Courses
     * const course = await prisma.course.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Courses and only return the `id`
     * const courseWithIdOnly = await prisma.course.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CourseCreateManyAndReturnArgs>(args?: SelectSubset<T, CourseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Course.
     * @param {CourseDeleteArgs} args - Arguments to delete one Course.
     * @example
     * // Delete one Course
     * const Course = await prisma.course.delete({
     *   where: {
     *     // ... filter to delete one Course
     *   }
     * })
     *
     */
    delete<T extends CourseDeleteArgs>(args: SelectSubset<T, CourseDeleteArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Course.
     * @param {CourseUpdateArgs} args - Arguments to update one Course.
     * @example
     * // Update one Course
     * const course = await prisma.course.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CourseUpdateArgs>(args: SelectSubset<T, CourseUpdateArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Courses.
     * @param {CourseDeleteManyArgs} args - Arguments to filter Courses to delete.
     * @example
     * // Delete a few Courses
     * const { count } = await prisma.course.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CourseDeleteManyArgs>(args?: SelectSubset<T, CourseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Courses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Courses
     * const course = await prisma.course.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CourseUpdateManyArgs>(args: SelectSubset<T, CourseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Courses and returns the data updated in the database.
     * @param {CourseUpdateManyAndReturnArgs} args - Arguments to update many Courses.
     * @example
     * // Update many Courses
     * const course = await prisma.course.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Courses and only return the `id`
     * const courseWithIdOnly = await prisma.course.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CourseUpdateManyAndReturnArgs>(args: SelectSubset<T, CourseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Course.
     * @param {CourseUpsertArgs} args - Arguments to update or create a Course.
     * @example
     * // Update or create a Course
     * const course = await prisma.course.upsert({
     *   create: {
     *     // ... data to create a Course
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Course we want to update
     *   }
     * })
     */
    upsert<T extends CourseUpsertArgs>(args: SelectSubset<T, CourseUpsertArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Courses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseCountArgs} args - Arguments to filter Courses to count.
     * @example
     * // Count the number of Courses
     * const count = await prisma.course.count({
     *   where: {
     *     // ... the filter for the Courses we want to count
     *   }
     * })
    **/
    count<T extends CourseCountArgs>(
      args?: Subset<T, CourseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CourseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Course.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CourseAggregateArgs>(args: Subset<T, CourseAggregateArgs>): Prisma.PrismaPromise<GetCourseAggregateType<T>>

    /**
     * Group by Course.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends CourseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CourseGroupByArgs['orderBy'] }
        : { orderBy?: CourseGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CourseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCourseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Course model
   */
  readonly fields: CourseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Course.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CourseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creator<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    subject<T extends Course$subjectArgs<ExtArgs> = {}>(args?: Subset<T, Course$subjectArgs<ExtArgs>>): Prisma__SubjectClient<$Result.GetResult<Prisma.$SubjectPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    sections<T extends Course$sectionsArgs<ExtArgs> = {}>(args?: Subset<T, Course$sectionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    enrollments<T extends Course$enrollmentsArgs<ExtArgs> = {}>(args?: Subset<T, Course$enrollmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Course model
   */
  interface CourseFieldRefs {
    readonly id: FieldRef<"Course", 'String'>
    readonly title: FieldRef<"Course", 'String'>
    readonly description: FieldRef<"Course", 'String'>
    readonly status: FieldRef<"Course", 'CourseStatus'>
    readonly creatorId: FieldRef<"Course", 'Int'>
    readonly subjectId: FieldRef<"Course", 'String'>
    readonly createdAt: FieldRef<"Course", 'DateTime'>
    readonly updatedAt: FieldRef<"Course", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * Course findUnique
   */
  export type CourseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Course to fetch.
     */
    where: CourseWhereUniqueInput
  }

  /**
   * Course findUniqueOrThrow
   */
  export type CourseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Course to fetch.
     */
    where: CourseWhereUniqueInput
  }

  /**
   * Course findFirst
   */
  export type CourseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Course to fetch.
     */
    where?: CourseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Courses to fetch.
     */
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Courses.
     */
    cursor?: CourseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Courses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Courses.
     */
    distinct?: CourseScalarFieldEnum | CourseScalarFieldEnum[]
  }

  /**
   * Course findFirstOrThrow
   */
  export type CourseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Course to fetch.
     */
    where?: CourseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Courses to fetch.
     */
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Courses.
     */
    cursor?: CourseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Courses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Courses.
     */
    distinct?: CourseScalarFieldEnum | CourseScalarFieldEnum[]
  }

  /**
   * Course findMany
   */
  export type CourseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter, which Courses to fetch.
     */
    where?: CourseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Courses to fetch.
     */
    orderBy?: CourseOrderByWithRelationInput | CourseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Courses.
     */
    cursor?: CourseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Courses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Courses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Courses.
     */
    distinct?: CourseScalarFieldEnum | CourseScalarFieldEnum[]
  }

  /**
   * Course create
   */
  export type CourseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * The data needed to create a Course.
     */
    data: XOR<CourseCreateInput, CourseUncheckedCreateInput>
  }

  /**
   * Course createMany
   */
  export type CourseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Courses.
     */
    data: CourseCreateManyInput | CourseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Course createManyAndReturn
   */
  export type CourseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * The data used to create many Courses.
     */
    data: CourseCreateManyInput | CourseCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Course update
   */
  export type CourseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * The data needed to update a Course.
     */
    data: XOR<CourseUpdateInput, CourseUncheckedUpdateInput>
    /**
     * Choose, which Course to update.
     */
    where: CourseWhereUniqueInput
  }

  /**
   * Course updateMany
   */
  export type CourseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Courses.
     */
    data: XOR<CourseUpdateManyMutationInput, CourseUncheckedUpdateManyInput>
    /**
     * Filter which Courses to update
     */
    where?: CourseWhereInput
    /**
     * Limit how many Courses to update.
     */
    limit?: number
  }

  /**
   * Course updateManyAndReturn
   */
  export type CourseUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * The data used to update Courses.
     */
    data: XOR<CourseUpdateManyMutationInput, CourseUncheckedUpdateManyInput>
    /**
     * Filter which Courses to update
     */
    where?: CourseWhereInput
    /**
     * Limit how many Courses to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Course upsert
   */
  export type CourseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * The filter to search for the Course to update in case it exists.
     */
    where: CourseWhereUniqueInput
    /**
     * In case the Course found by the `where` argument doesn't exist, create a new Course with this data.
     */
    create: XOR<CourseCreateInput, CourseUncheckedCreateInput>
    /**
     * In case the Course was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CourseUpdateInput, CourseUncheckedUpdateInput>
  }

  /**
   * Course delete
   */
  export type CourseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
    /**
     * Filter which Course to delete.
     */
    where: CourseWhereUniqueInput
  }

  /**
   * Course deleteMany
   */
  export type CourseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Courses to delete
     */
    where?: CourseWhereInput
    /**
     * Limit how many Courses to delete.
     */
    limit?: number
  }

  /**
   * Course.subject
   */
  export type Course$subjectArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subject
     */
    select?: SubjectSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subject
     */
    omit?: SubjectOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubjectInclude<ExtArgs> | null
    where?: SubjectWhereInput
  }

  /**
   * Course.sections
   */
  export type Course$sectionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    where?: CourseSectionWhereInput
    orderBy?: CourseSectionOrderByWithRelationInput | CourseSectionOrderByWithRelationInput[]
    cursor?: CourseSectionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CourseSectionScalarFieldEnum | CourseSectionScalarFieldEnum[]
  }

  /**
   * Course.enrollments
   */
  export type Course$enrollmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    where?: CourseEnrollmentWhereInput
    orderBy?: CourseEnrollmentOrderByWithRelationInput | CourseEnrollmentOrderByWithRelationInput[]
    cursor?: CourseEnrollmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CourseEnrollmentScalarFieldEnum | CourseEnrollmentScalarFieldEnum[]
  }

  /**
   * Course without action
   */
  export type CourseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Course
     */
    select?: CourseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Course
     */
    omit?: CourseOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseInclude<ExtArgs> | null
  }


  /**
   * Model CourseSection
   */

  export type AggregateCourseSection = {
    _count: CourseSectionCountAggregateOutputType | null
    _avg: CourseSectionAvgAggregateOutputType | null
    _sum: CourseSectionSumAggregateOutputType | null
    _min: CourseSectionMinAggregateOutputType | null
    _max: CourseSectionMaxAggregateOutputType | null
  }

  export type CourseSectionAvgAggregateOutputType = {
    position: number | null
  }

  export type CourseSectionSumAggregateOutputType = {
    position: number | null
  }

  export type CourseSectionMinAggregateOutputType = {
    id: string | null
    courseId: string | null
    title: string | null
    position: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseSectionMaxAggregateOutputType = {
    id: string | null
    courseId: string | null
    title: string | null
    position: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseSectionCountAggregateOutputType = {
    id: number
    courseId: number
    title: number
    position: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CourseSectionAvgAggregateInputType = {
    position?: true
  }

  export type CourseSectionSumAggregateInputType = {
    position?: true
  }

  export type CourseSectionMinAggregateInputType = {
    id?: true
    courseId?: true
    title?: true
    position?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseSectionMaxAggregateInputType = {
    id?: true
    courseId?: true
    title?: true
    position?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseSectionCountAggregateInputType = {
    id?: true
    courseId?: true
    title?: true
    position?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CourseSectionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CourseSection to aggregate.
     */
    where?: CourseSectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseSections to fetch.
     */
    orderBy?: CourseSectionOrderByWithRelationInput | CourseSectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CourseSectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseSections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseSections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned CourseSections
    **/
    _count?: true | CourseSectionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: CourseSectionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: CourseSectionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: CourseSectionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: CourseSectionMaxAggregateInputType
  }

  export type GetCourseSectionAggregateType<T extends CourseSectionAggregateArgs> = {
        [P in keyof T & keyof AggregateCourseSection]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCourseSection[P]>
      : GetScalarType<T[P], AggregateCourseSection[P]>
  }




  export type CourseSectionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseSectionWhereInput
    orderBy?: CourseSectionOrderByWithAggregationInput | CourseSectionOrderByWithAggregationInput[]
    by: CourseSectionScalarFieldEnum[] | CourseSectionScalarFieldEnum
    having?: CourseSectionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CourseSectionCountAggregateInputType | true
    _avg?: CourseSectionAvgAggregateInputType
    _sum?: CourseSectionSumAggregateInputType
    _min?: CourseSectionMinAggregateInputType
    _max?: CourseSectionMaxAggregateInputType
  }

  export type CourseSectionGroupByOutputType = {
    id: string
    courseId: string
    title: string
    position: number
    createdAt: Date
    updatedAt: Date
    _count: CourseSectionCountAggregateOutputType | null
    _avg: CourseSectionAvgAggregateOutputType | null
    _sum: CourseSectionSumAggregateOutputType | null
    _min: CourseSectionMinAggregateOutputType | null
    _max: CourseSectionMaxAggregateOutputType | null
  }

  type GetCourseSectionGroupByPayload<T extends CourseSectionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CourseSectionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CourseSectionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CourseSectionGroupByOutputType[P]>
            : GetScalarType<T[P], CourseSectionGroupByOutputType[P]>
        }
      >
    >


  export type CourseSectionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    courseId?: boolean
    title?: boolean
    position?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
    lessons?: boolean | CourseSection$lessonsArgs<ExtArgs>
    _count?: boolean | CourseSectionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseSection"]>

  export type CourseSectionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    courseId?: boolean
    title?: boolean
    position?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseSection"]>

  export type CourseSectionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    courseId?: boolean
    title?: boolean
    position?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseSection"]>

  export type CourseSectionSelectScalar = {
    id?: boolean
    courseId?: boolean
    title?: boolean
    position?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CourseSectionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "courseId" | "title" | "position" | "createdAt" | "updatedAt", ExtArgs["result"]["courseSection"]>
  export type CourseSectionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
    lessons?: boolean | CourseSection$lessonsArgs<ExtArgs>
    _count?: boolean | CourseSectionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CourseSectionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }
  export type CourseSectionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
  }

  export type $CourseSectionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CourseSection"
    objects: {
      course: Prisma.$CoursePayload<ExtArgs>
      lessons: Prisma.$CourseLessonPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      courseId: string
      title: string
      position: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["courseSection"]>
    composites: {}
  }

  type CourseSectionGetPayload<S extends boolean | null | undefined | CourseSectionDefaultArgs> = $Result.GetResult<Prisma.$CourseSectionPayload, S>

  type CourseSectionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CourseSectionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CourseSectionCountAggregateInputType | true
    }

  export interface CourseSectionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CourseSection'], meta: { name: 'CourseSection' } }
    /**
     * Find zero or one CourseSection that matches the filter.
     * @param {CourseSectionFindUniqueArgs} args - Arguments to find a CourseSection
     * @example
     * // Get one CourseSection
     * const courseSection = await prisma.courseSection.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CourseSectionFindUniqueArgs>(args: SelectSubset<T, CourseSectionFindUniqueArgs<ExtArgs>>): Prisma__CourseSectionClient<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CourseSection that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CourseSectionFindUniqueOrThrowArgs} args - Arguments to find a CourseSection
     * @example
     * // Get one CourseSection
     * const courseSection = await prisma.courseSection.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CourseSectionFindUniqueOrThrowArgs>(args: SelectSubset<T, CourseSectionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CourseSectionClient<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CourseSection that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseSectionFindFirstArgs} args - Arguments to find a CourseSection
     * @example
     * // Get one CourseSection
     * const courseSection = await prisma.courseSection.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CourseSectionFindFirstArgs>(args?: SelectSubset<T, CourseSectionFindFirstArgs<ExtArgs>>): Prisma__CourseSectionClient<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CourseSection that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseSectionFindFirstOrThrowArgs} args - Arguments to find a CourseSection
     * @example
     * // Get one CourseSection
     * const courseSection = await prisma.courseSection.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CourseSectionFindFirstOrThrowArgs>(args?: SelectSubset<T, CourseSectionFindFirstOrThrowArgs<ExtArgs>>): Prisma__CourseSectionClient<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CourseSections that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseSectionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CourseSections
     * const courseSections = await prisma.courseSection.findMany()
     *
     * // Get first 10 CourseSections
     * const courseSections = await prisma.courseSection.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const courseSectionWithIdOnly = await prisma.courseSection.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CourseSectionFindManyArgs>(args?: SelectSubset<T, CourseSectionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CourseSection.
     * @param {CourseSectionCreateArgs} args - Arguments to create a CourseSection.
     * @example
     * // Create one CourseSection
     * const CourseSection = await prisma.courseSection.create({
     *   data: {
     *     // ... data to create a CourseSection
     *   }
     * })
     *
     */
    create<T extends CourseSectionCreateArgs>(args: SelectSubset<T, CourseSectionCreateArgs<ExtArgs>>): Prisma__CourseSectionClient<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CourseSections.
     * @param {CourseSectionCreateManyArgs} args - Arguments to create many CourseSections.
     * @example
     * // Create many CourseSections
     * const courseSection = await prisma.courseSection.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CourseSectionCreateManyArgs>(args?: SelectSubset<T, CourseSectionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CourseSections and returns the data saved in the database.
     * @param {CourseSectionCreateManyAndReturnArgs} args - Arguments to create many CourseSections.
     * @example
     * // Create many CourseSections
     * const courseSection = await prisma.courseSection.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many CourseSections and only return the `id`
     * const courseSectionWithIdOnly = await prisma.courseSection.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CourseSectionCreateManyAndReturnArgs>(args?: SelectSubset<T, CourseSectionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CourseSection.
     * @param {CourseSectionDeleteArgs} args - Arguments to delete one CourseSection.
     * @example
     * // Delete one CourseSection
     * const CourseSection = await prisma.courseSection.delete({
     *   where: {
     *     // ... filter to delete one CourseSection
     *   }
     * })
     *
     */
    delete<T extends CourseSectionDeleteArgs>(args: SelectSubset<T, CourseSectionDeleteArgs<ExtArgs>>): Prisma__CourseSectionClient<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CourseSection.
     * @param {CourseSectionUpdateArgs} args - Arguments to update one CourseSection.
     * @example
     * // Update one CourseSection
     * const courseSection = await prisma.courseSection.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CourseSectionUpdateArgs>(args: SelectSubset<T, CourseSectionUpdateArgs<ExtArgs>>): Prisma__CourseSectionClient<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CourseSections.
     * @param {CourseSectionDeleteManyArgs} args - Arguments to filter CourseSections to delete.
     * @example
     * // Delete a few CourseSections
     * const { count } = await prisma.courseSection.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CourseSectionDeleteManyArgs>(args?: SelectSubset<T, CourseSectionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CourseSections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseSectionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CourseSections
     * const courseSection = await prisma.courseSection.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CourseSectionUpdateManyArgs>(args: SelectSubset<T, CourseSectionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CourseSections and returns the data updated in the database.
     * @param {CourseSectionUpdateManyAndReturnArgs} args - Arguments to update many CourseSections.
     * @example
     * // Update many CourseSections
     * const courseSection = await prisma.courseSection.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more CourseSections and only return the `id`
     * const courseSectionWithIdOnly = await prisma.courseSection.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CourseSectionUpdateManyAndReturnArgs>(args: SelectSubset<T, CourseSectionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CourseSection.
     * @param {CourseSectionUpsertArgs} args - Arguments to update or create a CourseSection.
     * @example
     * // Update or create a CourseSection
     * const courseSection = await prisma.courseSection.upsert({
     *   create: {
     *     // ... data to create a CourseSection
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CourseSection we want to update
     *   }
     * })
     */
    upsert<T extends CourseSectionUpsertArgs>(args: SelectSubset<T, CourseSectionUpsertArgs<ExtArgs>>): Prisma__CourseSectionClient<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CourseSections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseSectionCountArgs} args - Arguments to filter CourseSections to count.
     * @example
     * // Count the number of CourseSections
     * const count = await prisma.courseSection.count({
     *   where: {
     *     // ... the filter for the CourseSections we want to count
     *   }
     * })
    **/
    count<T extends CourseSectionCountArgs>(
      args?: Subset<T, CourseSectionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CourseSectionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CourseSection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseSectionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CourseSectionAggregateArgs>(args: Subset<T, CourseSectionAggregateArgs>): Prisma.PrismaPromise<GetCourseSectionAggregateType<T>>

    /**
     * Group by CourseSection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseSectionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends CourseSectionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CourseSectionGroupByArgs['orderBy'] }
        : { orderBy?: CourseSectionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CourseSectionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCourseSectionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CourseSection model
   */
  readonly fields: CourseSectionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CourseSection.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CourseSectionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    course<T extends CourseDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CourseDefaultArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    lessons<T extends CourseSection$lessonsArgs<ExtArgs> = {}>(args?: Subset<T, CourseSection$lessonsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CourseSection model
   */
  interface CourseSectionFieldRefs {
    readonly id: FieldRef<"CourseSection", 'String'>
    readonly courseId: FieldRef<"CourseSection", 'String'>
    readonly title: FieldRef<"CourseSection", 'String'>
    readonly position: FieldRef<"CourseSection", 'Int'>
    readonly createdAt: FieldRef<"CourseSection", 'DateTime'>
    readonly updatedAt: FieldRef<"CourseSection", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * CourseSection findUnique
   */
  export type CourseSectionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    /**
     * Filter, which CourseSection to fetch.
     */
    where: CourseSectionWhereUniqueInput
  }

  /**
   * CourseSection findUniqueOrThrow
   */
  export type CourseSectionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    /**
     * Filter, which CourseSection to fetch.
     */
    where: CourseSectionWhereUniqueInput
  }

  /**
   * CourseSection findFirst
   */
  export type CourseSectionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    /**
     * Filter, which CourseSection to fetch.
     */
    where?: CourseSectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseSections to fetch.
     */
    orderBy?: CourseSectionOrderByWithRelationInput | CourseSectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CourseSections.
     */
    cursor?: CourseSectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseSections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseSections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseSections.
     */
    distinct?: CourseSectionScalarFieldEnum | CourseSectionScalarFieldEnum[]
  }

  /**
   * CourseSection findFirstOrThrow
   */
  export type CourseSectionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    /**
     * Filter, which CourseSection to fetch.
     */
    where?: CourseSectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseSections to fetch.
     */
    orderBy?: CourseSectionOrderByWithRelationInput | CourseSectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CourseSections.
     */
    cursor?: CourseSectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseSections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseSections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseSections.
     */
    distinct?: CourseSectionScalarFieldEnum | CourseSectionScalarFieldEnum[]
  }

  /**
   * CourseSection findMany
   */
  export type CourseSectionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    /**
     * Filter, which CourseSections to fetch.
     */
    where?: CourseSectionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseSections to fetch.
     */
    orderBy?: CourseSectionOrderByWithRelationInput | CourseSectionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing CourseSections.
     */
    cursor?: CourseSectionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseSections from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseSections.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseSections.
     */
    distinct?: CourseSectionScalarFieldEnum | CourseSectionScalarFieldEnum[]
  }

  /**
   * CourseSection create
   */
  export type CourseSectionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    /**
     * The data needed to create a CourseSection.
     */
    data: XOR<CourseSectionCreateInput, CourseSectionUncheckedCreateInput>
  }

  /**
   * CourseSection createMany
   */
  export type CourseSectionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CourseSections.
     */
    data: CourseSectionCreateManyInput | CourseSectionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CourseSection createManyAndReturn
   */
  export type CourseSectionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * The data used to create many CourseSections.
     */
    data: CourseSectionCreateManyInput | CourseSectionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CourseSection update
   */
  export type CourseSectionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    /**
     * The data needed to update a CourseSection.
     */
    data: XOR<CourseSectionUpdateInput, CourseSectionUncheckedUpdateInput>
    /**
     * Choose, which CourseSection to update.
     */
    where: CourseSectionWhereUniqueInput
  }

  /**
   * CourseSection updateMany
   */
  export type CourseSectionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CourseSections.
     */
    data: XOR<CourseSectionUpdateManyMutationInput, CourseSectionUncheckedUpdateManyInput>
    /**
     * Filter which CourseSections to update
     */
    where?: CourseSectionWhereInput
    /**
     * Limit how many CourseSections to update.
     */
    limit?: number
  }

  /**
   * CourseSection updateManyAndReturn
   */
  export type CourseSectionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * The data used to update CourseSections.
     */
    data: XOR<CourseSectionUpdateManyMutationInput, CourseSectionUncheckedUpdateManyInput>
    /**
     * Filter which CourseSections to update
     */
    where?: CourseSectionWhereInput
    /**
     * Limit how many CourseSections to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CourseSection upsert
   */
  export type CourseSectionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    /**
     * The filter to search for the CourseSection to update in case it exists.
     */
    where: CourseSectionWhereUniqueInput
    /**
     * In case the CourseSection found by the `where` argument doesn't exist, create a new CourseSection with this data.
     */
    create: XOR<CourseSectionCreateInput, CourseSectionUncheckedCreateInput>
    /**
     * In case the CourseSection was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CourseSectionUpdateInput, CourseSectionUncheckedUpdateInput>
  }

  /**
   * CourseSection delete
   */
  export type CourseSectionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
    /**
     * Filter which CourseSection to delete.
     */
    where: CourseSectionWhereUniqueInput
  }

  /**
   * CourseSection deleteMany
   */
  export type CourseSectionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CourseSections to delete
     */
    where?: CourseSectionWhereInput
    /**
     * Limit how many CourseSections to delete.
     */
    limit?: number
  }

  /**
   * CourseSection.lessons
   */
  export type CourseSection$lessonsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    where?: CourseLessonWhereInput
    orderBy?: CourseLessonOrderByWithRelationInput | CourseLessonOrderByWithRelationInput[]
    cursor?: CourseLessonWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CourseLessonScalarFieldEnum | CourseLessonScalarFieldEnum[]
  }

  /**
   * CourseSection without action
   */
  export type CourseSectionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseSection
     */
    select?: CourseSectionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseSection
     */
    omit?: CourseSectionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseSectionInclude<ExtArgs> | null
  }


  /**
   * Model CourseLesson
   */

  export type AggregateCourseLesson = {
    _count: CourseLessonCountAggregateOutputType | null
    _avg: CourseLessonAvgAggregateOutputType | null
    _sum: CourseLessonSumAggregateOutputType | null
    _min: CourseLessonMinAggregateOutputType | null
    _max: CourseLessonMaxAggregateOutputType | null
  }

  export type CourseLessonAvgAggregateOutputType = {
    position: number | null
  }

  export type CourseLessonSumAggregateOutputType = {
    position: number | null
  }

  export type CourseLessonMinAggregateOutputType = {
    id: string | null
    sectionId: string | null
    title: string | null
    body: string | null
    position: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseLessonMaxAggregateOutputType = {
    id: string | null
    sectionId: string | null
    title: string | null
    body: string | null
    position: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseLessonCountAggregateOutputType = {
    id: number
    sectionId: number
    title: number
    body: number
    position: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CourseLessonAvgAggregateInputType = {
    position?: true
  }

  export type CourseLessonSumAggregateInputType = {
    position?: true
  }

  export type CourseLessonMinAggregateInputType = {
    id?: true
    sectionId?: true
    title?: true
    body?: true
    position?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseLessonMaxAggregateInputType = {
    id?: true
    sectionId?: true
    title?: true
    body?: true
    position?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseLessonCountAggregateInputType = {
    id?: true
    sectionId?: true
    title?: true
    body?: true
    position?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CourseLessonAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CourseLesson to aggregate.
     */
    where?: CourseLessonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseLessons to fetch.
     */
    orderBy?: CourseLessonOrderByWithRelationInput | CourseLessonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CourseLessonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseLessons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseLessons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned CourseLessons
    **/
    _count?: true | CourseLessonCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: CourseLessonAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: CourseLessonSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: CourseLessonMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: CourseLessonMaxAggregateInputType
  }

  export type GetCourseLessonAggregateType<T extends CourseLessonAggregateArgs> = {
        [P in keyof T & keyof AggregateCourseLesson]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCourseLesson[P]>
      : GetScalarType<T[P], AggregateCourseLesson[P]>
  }




  export type CourseLessonGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseLessonWhereInput
    orderBy?: CourseLessonOrderByWithAggregationInput | CourseLessonOrderByWithAggregationInput[]
    by: CourseLessonScalarFieldEnum[] | CourseLessonScalarFieldEnum
    having?: CourseLessonScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CourseLessonCountAggregateInputType | true
    _avg?: CourseLessonAvgAggregateInputType
    _sum?: CourseLessonSumAggregateInputType
    _min?: CourseLessonMinAggregateInputType
    _max?: CourseLessonMaxAggregateInputType
  }

  export type CourseLessonGroupByOutputType = {
    id: string
    sectionId: string
    title: string
    body: string | null
    position: number
    createdAt: Date
    updatedAt: Date
    _count: CourseLessonCountAggregateOutputType | null
    _avg: CourseLessonAvgAggregateOutputType | null
    _sum: CourseLessonSumAggregateOutputType | null
    _min: CourseLessonMinAggregateOutputType | null
    _max: CourseLessonMaxAggregateOutputType | null
  }

  type GetCourseLessonGroupByPayload<T extends CourseLessonGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CourseLessonGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CourseLessonGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CourseLessonGroupByOutputType[P]>
            : GetScalarType<T[P], CourseLessonGroupByOutputType[P]>
        }
      >
    >


  export type CourseLessonSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sectionId?: boolean
    title?: boolean
    body?: boolean
    position?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    section?: boolean | CourseSectionDefaultArgs<ExtArgs>
    files?: boolean | CourseLesson$filesArgs<ExtArgs>
    _count?: boolean | CourseLessonCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseLesson"]>

  export type CourseLessonSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sectionId?: boolean
    title?: boolean
    body?: boolean
    position?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    section?: boolean | CourseSectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseLesson"]>

  export type CourseLessonSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sectionId?: boolean
    title?: boolean
    body?: boolean
    position?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    section?: boolean | CourseSectionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseLesson"]>

  export type CourseLessonSelectScalar = {
    id?: boolean
    sectionId?: boolean
    title?: boolean
    body?: boolean
    position?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CourseLessonOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sectionId" | "title" | "body" | "position" | "createdAt" | "updatedAt", ExtArgs["result"]["courseLesson"]>
  export type CourseLessonInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    section?: boolean | CourseSectionDefaultArgs<ExtArgs>
    files?: boolean | CourseLesson$filesArgs<ExtArgs>
    _count?: boolean | CourseLessonCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CourseLessonIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    section?: boolean | CourseSectionDefaultArgs<ExtArgs>
  }
  export type CourseLessonIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    section?: boolean | CourseSectionDefaultArgs<ExtArgs>
  }

  export type $CourseLessonPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CourseLesson"
    objects: {
      section: Prisma.$CourseSectionPayload<ExtArgs>
      files: Prisma.$CourseFilePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sectionId: string
      title: string
      body: string | null
      position: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["courseLesson"]>
    composites: {}
  }

  type CourseLessonGetPayload<S extends boolean | null | undefined | CourseLessonDefaultArgs> = $Result.GetResult<Prisma.$CourseLessonPayload, S>

  type CourseLessonCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CourseLessonFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CourseLessonCountAggregateInputType | true
    }

  export interface CourseLessonDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CourseLesson'], meta: { name: 'CourseLesson' } }
    /**
     * Find zero or one CourseLesson that matches the filter.
     * @param {CourseLessonFindUniqueArgs} args - Arguments to find a CourseLesson
     * @example
     * // Get one CourseLesson
     * const courseLesson = await prisma.courseLesson.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CourseLessonFindUniqueArgs>(args: SelectSubset<T, CourseLessonFindUniqueArgs<ExtArgs>>): Prisma__CourseLessonClient<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CourseLesson that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CourseLessonFindUniqueOrThrowArgs} args - Arguments to find a CourseLesson
     * @example
     * // Get one CourseLesson
     * const courseLesson = await prisma.courseLesson.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CourseLessonFindUniqueOrThrowArgs>(args: SelectSubset<T, CourseLessonFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CourseLessonClient<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CourseLesson that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseLessonFindFirstArgs} args - Arguments to find a CourseLesson
     * @example
     * // Get one CourseLesson
     * const courseLesson = await prisma.courseLesson.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CourseLessonFindFirstArgs>(args?: SelectSubset<T, CourseLessonFindFirstArgs<ExtArgs>>): Prisma__CourseLessonClient<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CourseLesson that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseLessonFindFirstOrThrowArgs} args - Arguments to find a CourseLesson
     * @example
     * // Get one CourseLesson
     * const courseLesson = await prisma.courseLesson.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CourseLessonFindFirstOrThrowArgs>(args?: SelectSubset<T, CourseLessonFindFirstOrThrowArgs<ExtArgs>>): Prisma__CourseLessonClient<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CourseLessons that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseLessonFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CourseLessons
     * const courseLessons = await prisma.courseLesson.findMany()
     *
     * // Get first 10 CourseLessons
     * const courseLessons = await prisma.courseLesson.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const courseLessonWithIdOnly = await prisma.courseLesson.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CourseLessonFindManyArgs>(args?: SelectSubset<T, CourseLessonFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CourseLesson.
     * @param {CourseLessonCreateArgs} args - Arguments to create a CourseLesson.
     * @example
     * // Create one CourseLesson
     * const CourseLesson = await prisma.courseLesson.create({
     *   data: {
     *     // ... data to create a CourseLesson
     *   }
     * })
     *
     */
    create<T extends CourseLessonCreateArgs>(args: SelectSubset<T, CourseLessonCreateArgs<ExtArgs>>): Prisma__CourseLessonClient<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CourseLessons.
     * @param {CourseLessonCreateManyArgs} args - Arguments to create many CourseLessons.
     * @example
     * // Create many CourseLessons
     * const courseLesson = await prisma.courseLesson.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CourseLessonCreateManyArgs>(args?: SelectSubset<T, CourseLessonCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CourseLessons and returns the data saved in the database.
     * @param {CourseLessonCreateManyAndReturnArgs} args - Arguments to create many CourseLessons.
     * @example
     * // Create many CourseLessons
     * const courseLesson = await prisma.courseLesson.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many CourseLessons and only return the `id`
     * const courseLessonWithIdOnly = await prisma.courseLesson.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CourseLessonCreateManyAndReturnArgs>(args?: SelectSubset<T, CourseLessonCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CourseLesson.
     * @param {CourseLessonDeleteArgs} args - Arguments to delete one CourseLesson.
     * @example
     * // Delete one CourseLesson
     * const CourseLesson = await prisma.courseLesson.delete({
     *   where: {
     *     // ... filter to delete one CourseLesson
     *   }
     * })
     *
     */
    delete<T extends CourseLessonDeleteArgs>(args: SelectSubset<T, CourseLessonDeleteArgs<ExtArgs>>): Prisma__CourseLessonClient<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CourseLesson.
     * @param {CourseLessonUpdateArgs} args - Arguments to update one CourseLesson.
     * @example
     * // Update one CourseLesson
     * const courseLesson = await prisma.courseLesson.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CourseLessonUpdateArgs>(args: SelectSubset<T, CourseLessonUpdateArgs<ExtArgs>>): Prisma__CourseLessonClient<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CourseLessons.
     * @param {CourseLessonDeleteManyArgs} args - Arguments to filter CourseLessons to delete.
     * @example
     * // Delete a few CourseLessons
     * const { count } = await prisma.courseLesson.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CourseLessonDeleteManyArgs>(args?: SelectSubset<T, CourseLessonDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CourseLessons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseLessonUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CourseLessons
     * const courseLesson = await prisma.courseLesson.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CourseLessonUpdateManyArgs>(args: SelectSubset<T, CourseLessonUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CourseLessons and returns the data updated in the database.
     * @param {CourseLessonUpdateManyAndReturnArgs} args - Arguments to update many CourseLessons.
     * @example
     * // Update many CourseLessons
     * const courseLesson = await prisma.courseLesson.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more CourseLessons and only return the `id`
     * const courseLessonWithIdOnly = await prisma.courseLesson.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CourseLessonUpdateManyAndReturnArgs>(args: SelectSubset<T, CourseLessonUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CourseLesson.
     * @param {CourseLessonUpsertArgs} args - Arguments to update or create a CourseLesson.
     * @example
     * // Update or create a CourseLesson
     * const courseLesson = await prisma.courseLesson.upsert({
     *   create: {
     *     // ... data to create a CourseLesson
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CourseLesson we want to update
     *   }
     * })
     */
    upsert<T extends CourseLessonUpsertArgs>(args: SelectSubset<T, CourseLessonUpsertArgs<ExtArgs>>): Prisma__CourseLessonClient<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CourseLessons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseLessonCountArgs} args - Arguments to filter CourseLessons to count.
     * @example
     * // Count the number of CourseLessons
     * const count = await prisma.courseLesson.count({
     *   where: {
     *     // ... the filter for the CourseLessons we want to count
     *   }
     * })
    **/
    count<T extends CourseLessonCountArgs>(
      args?: Subset<T, CourseLessonCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CourseLessonCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CourseLesson.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseLessonAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CourseLessonAggregateArgs>(args: Subset<T, CourseLessonAggregateArgs>): Prisma.PrismaPromise<GetCourseLessonAggregateType<T>>

    /**
     * Group by CourseLesson.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseLessonGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends CourseLessonGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CourseLessonGroupByArgs['orderBy'] }
        : { orderBy?: CourseLessonGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CourseLessonGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCourseLessonGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CourseLesson model
   */
  readonly fields: CourseLessonFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CourseLesson.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CourseLessonClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    section<T extends CourseSectionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CourseSectionDefaultArgs<ExtArgs>>): Prisma__CourseSectionClient<$Result.GetResult<Prisma.$CourseSectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    files<T extends CourseLesson$filesArgs<ExtArgs> = {}>(args?: Subset<T, CourseLesson$filesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CourseLesson model
   */
  interface CourseLessonFieldRefs {
    readonly id: FieldRef<"CourseLesson", 'String'>
    readonly sectionId: FieldRef<"CourseLesson", 'String'>
    readonly title: FieldRef<"CourseLesson", 'String'>
    readonly body: FieldRef<"CourseLesson", 'String'>
    readonly position: FieldRef<"CourseLesson", 'Int'>
    readonly createdAt: FieldRef<"CourseLesson", 'DateTime'>
    readonly updatedAt: FieldRef<"CourseLesson", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * CourseLesson findUnique
   */
  export type CourseLessonFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    /**
     * Filter, which CourseLesson to fetch.
     */
    where: CourseLessonWhereUniqueInput
  }

  /**
   * CourseLesson findUniqueOrThrow
   */
  export type CourseLessonFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    /**
     * Filter, which CourseLesson to fetch.
     */
    where: CourseLessonWhereUniqueInput
  }

  /**
   * CourseLesson findFirst
   */
  export type CourseLessonFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    /**
     * Filter, which CourseLesson to fetch.
     */
    where?: CourseLessonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseLessons to fetch.
     */
    orderBy?: CourseLessonOrderByWithRelationInput | CourseLessonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CourseLessons.
     */
    cursor?: CourseLessonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseLessons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseLessons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseLessons.
     */
    distinct?: CourseLessonScalarFieldEnum | CourseLessonScalarFieldEnum[]
  }

  /**
   * CourseLesson findFirstOrThrow
   */
  export type CourseLessonFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    /**
     * Filter, which CourseLesson to fetch.
     */
    where?: CourseLessonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseLessons to fetch.
     */
    orderBy?: CourseLessonOrderByWithRelationInput | CourseLessonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CourseLessons.
     */
    cursor?: CourseLessonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseLessons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseLessons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseLessons.
     */
    distinct?: CourseLessonScalarFieldEnum | CourseLessonScalarFieldEnum[]
  }

  /**
   * CourseLesson findMany
   */
  export type CourseLessonFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    /**
     * Filter, which CourseLessons to fetch.
     */
    where?: CourseLessonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseLessons to fetch.
     */
    orderBy?: CourseLessonOrderByWithRelationInput | CourseLessonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing CourseLessons.
     */
    cursor?: CourseLessonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseLessons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseLessons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseLessons.
     */
    distinct?: CourseLessonScalarFieldEnum | CourseLessonScalarFieldEnum[]
  }

  /**
   * CourseLesson create
   */
  export type CourseLessonCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    /**
     * The data needed to create a CourseLesson.
     */
    data: XOR<CourseLessonCreateInput, CourseLessonUncheckedCreateInput>
  }

  /**
   * CourseLesson createMany
   */
  export type CourseLessonCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CourseLessons.
     */
    data: CourseLessonCreateManyInput | CourseLessonCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CourseLesson createManyAndReturn
   */
  export type CourseLessonCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * The data used to create many CourseLessons.
     */
    data: CourseLessonCreateManyInput | CourseLessonCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CourseLesson update
   */
  export type CourseLessonUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    /**
     * The data needed to update a CourseLesson.
     */
    data: XOR<CourseLessonUpdateInput, CourseLessonUncheckedUpdateInput>
    /**
     * Choose, which CourseLesson to update.
     */
    where: CourseLessonWhereUniqueInput
  }

  /**
   * CourseLesson updateMany
   */
  export type CourseLessonUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CourseLessons.
     */
    data: XOR<CourseLessonUpdateManyMutationInput, CourseLessonUncheckedUpdateManyInput>
    /**
     * Filter which CourseLessons to update
     */
    where?: CourseLessonWhereInput
    /**
     * Limit how many CourseLessons to update.
     */
    limit?: number
  }

  /**
   * CourseLesson updateManyAndReturn
   */
  export type CourseLessonUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * The data used to update CourseLessons.
     */
    data: XOR<CourseLessonUpdateManyMutationInput, CourseLessonUncheckedUpdateManyInput>
    /**
     * Filter which CourseLessons to update
     */
    where?: CourseLessonWhereInput
    /**
     * Limit how many CourseLessons to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CourseLesson upsert
   */
  export type CourseLessonUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    /**
     * The filter to search for the CourseLesson to update in case it exists.
     */
    where: CourseLessonWhereUniqueInput
    /**
     * In case the CourseLesson found by the `where` argument doesn't exist, create a new CourseLesson with this data.
     */
    create: XOR<CourseLessonCreateInput, CourseLessonUncheckedCreateInput>
    /**
     * In case the CourseLesson was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CourseLessonUpdateInput, CourseLessonUncheckedUpdateInput>
  }

  /**
   * CourseLesson delete
   */
  export type CourseLessonDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
    /**
     * Filter which CourseLesson to delete.
     */
    where: CourseLessonWhereUniqueInput
  }

  /**
   * CourseLesson deleteMany
   */
  export type CourseLessonDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CourseLessons to delete
     */
    where?: CourseLessonWhereInput
    /**
     * Limit how many CourseLessons to delete.
     */
    limit?: number
  }

  /**
   * CourseLesson.files
   */
  export type CourseLesson$filesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    where?: CourseFileWhereInput
    orderBy?: CourseFileOrderByWithRelationInput | CourseFileOrderByWithRelationInput[]
    cursor?: CourseFileWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CourseFileScalarFieldEnum | CourseFileScalarFieldEnum[]
  }

  /**
   * CourseLesson without action
   */
  export type CourseLessonDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseLesson
     */
    select?: CourseLessonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseLesson
     */
    omit?: CourseLessonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseLessonInclude<ExtArgs> | null
  }


  /**
   * Model CourseEnrollment
   */

  export type AggregateCourseEnrollment = {
    _count: CourseEnrollmentCountAggregateOutputType | null
    _avg: CourseEnrollmentAvgAggregateOutputType | null
    _sum: CourseEnrollmentSumAggregateOutputType | null
    _min: CourseEnrollmentMinAggregateOutputType | null
    _max: CourseEnrollmentMaxAggregateOutputType | null
  }

  export type CourseEnrollmentAvgAggregateOutputType = {
    userId: number | null
  }

  export type CourseEnrollmentSumAggregateOutputType = {
    userId: number | null
  }

  export type CourseEnrollmentMinAggregateOutputType = {
    id: string | null
    courseId: string | null
    userId: number | null
    active: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseEnrollmentMaxAggregateOutputType = {
    id: string | null
    courseId: string | null
    userId: number | null
    active: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseEnrollmentCountAggregateOutputType = {
    id: number
    courseId: number
    userId: number
    active: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CourseEnrollmentAvgAggregateInputType = {
    userId?: true
  }

  export type CourseEnrollmentSumAggregateInputType = {
    userId?: true
  }

  export type CourseEnrollmentMinAggregateInputType = {
    id?: true
    courseId?: true
    userId?: true
    active?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseEnrollmentMaxAggregateInputType = {
    id?: true
    courseId?: true
    userId?: true
    active?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseEnrollmentCountAggregateInputType = {
    id?: true
    courseId?: true
    userId?: true
    active?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CourseEnrollmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CourseEnrollment to aggregate.
     */
    where?: CourseEnrollmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseEnrollments to fetch.
     */
    orderBy?: CourseEnrollmentOrderByWithRelationInput | CourseEnrollmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CourseEnrollmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseEnrollments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseEnrollments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned CourseEnrollments
    **/
    _count?: true | CourseEnrollmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: CourseEnrollmentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: CourseEnrollmentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: CourseEnrollmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: CourseEnrollmentMaxAggregateInputType
  }

  export type GetCourseEnrollmentAggregateType<T extends CourseEnrollmentAggregateArgs> = {
        [P in keyof T & keyof AggregateCourseEnrollment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCourseEnrollment[P]>
      : GetScalarType<T[P], AggregateCourseEnrollment[P]>
  }




  export type CourseEnrollmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseEnrollmentWhereInput
    orderBy?: CourseEnrollmentOrderByWithAggregationInput | CourseEnrollmentOrderByWithAggregationInput[]
    by: CourseEnrollmentScalarFieldEnum[] | CourseEnrollmentScalarFieldEnum
    having?: CourseEnrollmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CourseEnrollmentCountAggregateInputType | true
    _avg?: CourseEnrollmentAvgAggregateInputType
    _sum?: CourseEnrollmentSumAggregateInputType
    _min?: CourseEnrollmentMinAggregateInputType
    _max?: CourseEnrollmentMaxAggregateInputType
  }

  export type CourseEnrollmentGroupByOutputType = {
    id: string
    courseId: string
    userId: number
    active: boolean
    createdAt: Date
    updatedAt: Date
    _count: CourseEnrollmentCountAggregateOutputType | null
    _avg: CourseEnrollmentAvgAggregateOutputType | null
    _sum: CourseEnrollmentSumAggregateOutputType | null
    _min: CourseEnrollmentMinAggregateOutputType | null
    _max: CourseEnrollmentMaxAggregateOutputType | null
  }

  type GetCourseEnrollmentGroupByPayload<T extends CourseEnrollmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CourseEnrollmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CourseEnrollmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CourseEnrollmentGroupByOutputType[P]>
            : GetScalarType<T[P], CourseEnrollmentGroupByOutputType[P]>
        }
      >
    >


  export type CourseEnrollmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    courseId?: boolean
    userId?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseEnrollment"]>

  export type CourseEnrollmentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    courseId?: boolean
    userId?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseEnrollment"]>

  export type CourseEnrollmentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    courseId?: boolean
    userId?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    course?: boolean | CourseDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseEnrollment"]>

  export type CourseEnrollmentSelectScalar = {
    id?: boolean
    courseId?: boolean
    userId?: boolean
    active?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CourseEnrollmentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "courseId" | "userId" | "active" | "createdAt" | "updatedAt", ExtArgs["result"]["courseEnrollment"]>
  export type CourseEnrollmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CourseEnrollmentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CourseEnrollmentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    course?: boolean | CourseDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CourseEnrollmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CourseEnrollment"
    objects: {
      course: Prisma.$CoursePayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      courseId: string
      userId: number
      active: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["courseEnrollment"]>
    composites: {}
  }

  type CourseEnrollmentGetPayload<S extends boolean | null | undefined | CourseEnrollmentDefaultArgs> = $Result.GetResult<Prisma.$CourseEnrollmentPayload, S>

  type CourseEnrollmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CourseEnrollmentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CourseEnrollmentCountAggregateInputType | true
    }

  export interface CourseEnrollmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CourseEnrollment'], meta: { name: 'CourseEnrollment' } }
    /**
     * Find zero or one CourseEnrollment that matches the filter.
     * @param {CourseEnrollmentFindUniqueArgs} args - Arguments to find a CourseEnrollment
     * @example
     * // Get one CourseEnrollment
     * const courseEnrollment = await prisma.courseEnrollment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CourseEnrollmentFindUniqueArgs>(args: SelectSubset<T, CourseEnrollmentFindUniqueArgs<ExtArgs>>): Prisma__CourseEnrollmentClient<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CourseEnrollment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CourseEnrollmentFindUniqueOrThrowArgs} args - Arguments to find a CourseEnrollment
     * @example
     * // Get one CourseEnrollment
     * const courseEnrollment = await prisma.courseEnrollment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CourseEnrollmentFindUniqueOrThrowArgs>(args: SelectSubset<T, CourseEnrollmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CourseEnrollmentClient<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CourseEnrollment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseEnrollmentFindFirstArgs} args - Arguments to find a CourseEnrollment
     * @example
     * // Get one CourseEnrollment
     * const courseEnrollment = await prisma.courseEnrollment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CourseEnrollmentFindFirstArgs>(args?: SelectSubset<T, CourseEnrollmentFindFirstArgs<ExtArgs>>): Prisma__CourseEnrollmentClient<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CourseEnrollment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseEnrollmentFindFirstOrThrowArgs} args - Arguments to find a CourseEnrollment
     * @example
     * // Get one CourseEnrollment
     * const courseEnrollment = await prisma.courseEnrollment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CourseEnrollmentFindFirstOrThrowArgs>(args?: SelectSubset<T, CourseEnrollmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__CourseEnrollmentClient<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CourseEnrollments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseEnrollmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CourseEnrollments
     * const courseEnrollments = await prisma.courseEnrollment.findMany()
     *
     * // Get first 10 CourseEnrollments
     * const courseEnrollments = await prisma.courseEnrollment.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const courseEnrollmentWithIdOnly = await prisma.courseEnrollment.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CourseEnrollmentFindManyArgs>(args?: SelectSubset<T, CourseEnrollmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CourseEnrollment.
     * @param {CourseEnrollmentCreateArgs} args - Arguments to create a CourseEnrollment.
     * @example
     * // Create one CourseEnrollment
     * const CourseEnrollment = await prisma.courseEnrollment.create({
     *   data: {
     *     // ... data to create a CourseEnrollment
     *   }
     * })
     *
     */
    create<T extends CourseEnrollmentCreateArgs>(args: SelectSubset<T, CourseEnrollmentCreateArgs<ExtArgs>>): Prisma__CourseEnrollmentClient<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CourseEnrollments.
     * @param {CourseEnrollmentCreateManyArgs} args - Arguments to create many CourseEnrollments.
     * @example
     * // Create many CourseEnrollments
     * const courseEnrollment = await prisma.courseEnrollment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CourseEnrollmentCreateManyArgs>(args?: SelectSubset<T, CourseEnrollmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CourseEnrollments and returns the data saved in the database.
     * @param {CourseEnrollmentCreateManyAndReturnArgs} args - Arguments to create many CourseEnrollments.
     * @example
     * // Create many CourseEnrollments
     * const courseEnrollment = await prisma.courseEnrollment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many CourseEnrollments and only return the `id`
     * const courseEnrollmentWithIdOnly = await prisma.courseEnrollment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CourseEnrollmentCreateManyAndReturnArgs>(args?: SelectSubset<T, CourseEnrollmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CourseEnrollment.
     * @param {CourseEnrollmentDeleteArgs} args - Arguments to delete one CourseEnrollment.
     * @example
     * // Delete one CourseEnrollment
     * const CourseEnrollment = await prisma.courseEnrollment.delete({
     *   where: {
     *     // ... filter to delete one CourseEnrollment
     *   }
     * })
     *
     */
    delete<T extends CourseEnrollmentDeleteArgs>(args: SelectSubset<T, CourseEnrollmentDeleteArgs<ExtArgs>>): Prisma__CourseEnrollmentClient<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CourseEnrollment.
     * @param {CourseEnrollmentUpdateArgs} args - Arguments to update one CourseEnrollment.
     * @example
     * // Update one CourseEnrollment
     * const courseEnrollment = await prisma.courseEnrollment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CourseEnrollmentUpdateArgs>(args: SelectSubset<T, CourseEnrollmentUpdateArgs<ExtArgs>>): Prisma__CourseEnrollmentClient<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CourseEnrollments.
     * @param {CourseEnrollmentDeleteManyArgs} args - Arguments to filter CourseEnrollments to delete.
     * @example
     * // Delete a few CourseEnrollments
     * const { count } = await prisma.courseEnrollment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CourseEnrollmentDeleteManyArgs>(args?: SelectSubset<T, CourseEnrollmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CourseEnrollments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseEnrollmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CourseEnrollments
     * const courseEnrollment = await prisma.courseEnrollment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CourseEnrollmentUpdateManyArgs>(args: SelectSubset<T, CourseEnrollmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CourseEnrollments and returns the data updated in the database.
     * @param {CourseEnrollmentUpdateManyAndReturnArgs} args - Arguments to update many CourseEnrollments.
     * @example
     * // Update many CourseEnrollments
     * const courseEnrollment = await prisma.courseEnrollment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more CourseEnrollments and only return the `id`
     * const courseEnrollmentWithIdOnly = await prisma.courseEnrollment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CourseEnrollmentUpdateManyAndReturnArgs>(args: SelectSubset<T, CourseEnrollmentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CourseEnrollment.
     * @param {CourseEnrollmentUpsertArgs} args - Arguments to update or create a CourseEnrollment.
     * @example
     * // Update or create a CourseEnrollment
     * const courseEnrollment = await prisma.courseEnrollment.upsert({
     *   create: {
     *     // ... data to create a CourseEnrollment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CourseEnrollment we want to update
     *   }
     * })
     */
    upsert<T extends CourseEnrollmentUpsertArgs>(args: SelectSubset<T, CourseEnrollmentUpsertArgs<ExtArgs>>): Prisma__CourseEnrollmentClient<$Result.GetResult<Prisma.$CourseEnrollmentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CourseEnrollments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseEnrollmentCountArgs} args - Arguments to filter CourseEnrollments to count.
     * @example
     * // Count the number of CourseEnrollments
     * const count = await prisma.courseEnrollment.count({
     *   where: {
     *     // ... the filter for the CourseEnrollments we want to count
     *   }
     * })
    **/
    count<T extends CourseEnrollmentCountArgs>(
      args?: Subset<T, CourseEnrollmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CourseEnrollmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CourseEnrollment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseEnrollmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CourseEnrollmentAggregateArgs>(args: Subset<T, CourseEnrollmentAggregateArgs>): Prisma.PrismaPromise<GetCourseEnrollmentAggregateType<T>>

    /**
     * Group by CourseEnrollment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseEnrollmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends CourseEnrollmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CourseEnrollmentGroupByArgs['orderBy'] }
        : { orderBy?: CourseEnrollmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CourseEnrollmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCourseEnrollmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CourseEnrollment model
   */
  readonly fields: CourseEnrollmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CourseEnrollment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CourseEnrollmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    course<T extends CourseDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CourseDefaultArgs<ExtArgs>>): Prisma__CourseClient<$Result.GetResult<Prisma.$CoursePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CourseEnrollment model
   */
  interface CourseEnrollmentFieldRefs {
    readonly id: FieldRef<"CourseEnrollment", 'String'>
    readonly courseId: FieldRef<"CourseEnrollment", 'String'>
    readonly userId: FieldRef<"CourseEnrollment", 'Int'>
    readonly active: FieldRef<"CourseEnrollment", 'Boolean'>
    readonly createdAt: FieldRef<"CourseEnrollment", 'DateTime'>
    readonly updatedAt: FieldRef<"CourseEnrollment", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * CourseEnrollment findUnique
   */
  export type CourseEnrollmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which CourseEnrollment to fetch.
     */
    where: CourseEnrollmentWhereUniqueInput
  }

  /**
   * CourseEnrollment findUniqueOrThrow
   */
  export type CourseEnrollmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which CourseEnrollment to fetch.
     */
    where: CourseEnrollmentWhereUniqueInput
  }

  /**
   * CourseEnrollment findFirst
   */
  export type CourseEnrollmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which CourseEnrollment to fetch.
     */
    where?: CourseEnrollmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseEnrollments to fetch.
     */
    orderBy?: CourseEnrollmentOrderByWithRelationInput | CourseEnrollmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CourseEnrollments.
     */
    cursor?: CourseEnrollmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseEnrollments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseEnrollments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseEnrollments.
     */
    distinct?: CourseEnrollmentScalarFieldEnum | CourseEnrollmentScalarFieldEnum[]
  }

  /**
   * CourseEnrollment findFirstOrThrow
   */
  export type CourseEnrollmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which CourseEnrollment to fetch.
     */
    where?: CourseEnrollmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseEnrollments to fetch.
     */
    orderBy?: CourseEnrollmentOrderByWithRelationInput | CourseEnrollmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CourseEnrollments.
     */
    cursor?: CourseEnrollmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseEnrollments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseEnrollments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseEnrollments.
     */
    distinct?: CourseEnrollmentScalarFieldEnum | CourseEnrollmentScalarFieldEnum[]
  }

  /**
   * CourseEnrollment findMany
   */
  export type CourseEnrollmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    /**
     * Filter, which CourseEnrollments to fetch.
     */
    where?: CourseEnrollmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseEnrollments to fetch.
     */
    orderBy?: CourseEnrollmentOrderByWithRelationInput | CourseEnrollmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing CourseEnrollments.
     */
    cursor?: CourseEnrollmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseEnrollments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseEnrollments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseEnrollments.
     */
    distinct?: CourseEnrollmentScalarFieldEnum | CourseEnrollmentScalarFieldEnum[]
  }

  /**
   * CourseEnrollment create
   */
  export type CourseEnrollmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    /**
     * The data needed to create a CourseEnrollment.
     */
    data: XOR<CourseEnrollmentCreateInput, CourseEnrollmentUncheckedCreateInput>
  }

  /**
   * CourseEnrollment createMany
   */
  export type CourseEnrollmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CourseEnrollments.
     */
    data: CourseEnrollmentCreateManyInput | CourseEnrollmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CourseEnrollment createManyAndReturn
   */
  export type CourseEnrollmentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * The data used to create many CourseEnrollments.
     */
    data: CourseEnrollmentCreateManyInput | CourseEnrollmentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CourseEnrollment update
   */
  export type CourseEnrollmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    /**
     * The data needed to update a CourseEnrollment.
     */
    data: XOR<CourseEnrollmentUpdateInput, CourseEnrollmentUncheckedUpdateInput>
    /**
     * Choose, which CourseEnrollment to update.
     */
    where: CourseEnrollmentWhereUniqueInput
  }

  /**
   * CourseEnrollment updateMany
   */
  export type CourseEnrollmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CourseEnrollments.
     */
    data: XOR<CourseEnrollmentUpdateManyMutationInput, CourseEnrollmentUncheckedUpdateManyInput>
    /**
     * Filter which CourseEnrollments to update
     */
    where?: CourseEnrollmentWhereInput
    /**
     * Limit how many CourseEnrollments to update.
     */
    limit?: number
  }

  /**
   * CourseEnrollment updateManyAndReturn
   */
  export type CourseEnrollmentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * The data used to update CourseEnrollments.
     */
    data: XOR<CourseEnrollmentUpdateManyMutationInput, CourseEnrollmentUncheckedUpdateManyInput>
    /**
     * Filter which CourseEnrollments to update
     */
    where?: CourseEnrollmentWhereInput
    /**
     * Limit how many CourseEnrollments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CourseEnrollment upsert
   */
  export type CourseEnrollmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    /**
     * The filter to search for the CourseEnrollment to update in case it exists.
     */
    where: CourseEnrollmentWhereUniqueInput
    /**
     * In case the CourseEnrollment found by the `where` argument doesn't exist, create a new CourseEnrollment with this data.
     */
    create: XOR<CourseEnrollmentCreateInput, CourseEnrollmentUncheckedCreateInput>
    /**
     * In case the CourseEnrollment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CourseEnrollmentUpdateInput, CourseEnrollmentUncheckedUpdateInput>
  }

  /**
   * CourseEnrollment delete
   */
  export type CourseEnrollmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
    /**
     * Filter which CourseEnrollment to delete.
     */
    where: CourseEnrollmentWhereUniqueInput
  }

  /**
   * CourseEnrollment deleteMany
   */
  export type CourseEnrollmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CourseEnrollments to delete
     */
    where?: CourseEnrollmentWhereInput
    /**
     * Limit how many CourseEnrollments to delete.
     */
    limit?: number
  }

  /**
   * CourseEnrollment without action
   */
  export type CourseEnrollmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseEnrollment
     */
    select?: CourseEnrollmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseEnrollment
     */
    omit?: CourseEnrollmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseEnrollmentInclude<ExtArgs> | null
  }


  /**
   * Model CourseFile
   */

  export type AggregateCourseFile = {
    _count: CourseFileCountAggregateOutputType | null
    _avg: CourseFileAvgAggregateOutputType | null
    _sum: CourseFileSumAggregateOutputType | null
    _min: CourseFileMinAggregateOutputType | null
    _max: CourseFileMaxAggregateOutputType | null
  }

  export type CourseFileAvgAggregateOutputType = {
    uploaderId: number | null
    size: number | null
    attempts: number | null
  }

  export type CourseFileSumAggregateOutputType = {
    uploaderId: number | null
    size: bigint | null
    attempts: number | null
  }

  export type CourseFileMinAggregateOutputType = {
    id: string | null
    lessonId: string | null
    uploaderId: number | null
    driveFileId: string | null
    operationId: string | null
    originalName: string | null
    mimeType: string | null
    size: bigint | null
    allowDownload: boolean | null
    state: $Enums.CourseFileState | null
    origin: $Enums.CourseFileOrigin | null
    lastErrorCode: string | null
    attempts: number | null
    retryAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseFileMaxAggregateOutputType = {
    id: string | null
    lessonId: string | null
    uploaderId: number | null
    driveFileId: string | null
    operationId: string | null
    originalName: string | null
    mimeType: string | null
    size: bigint | null
    allowDownload: boolean | null
    state: $Enums.CourseFileState | null
    origin: $Enums.CourseFileOrigin | null
    lastErrorCode: string | null
    attempts: number | null
    retryAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CourseFileCountAggregateOutputType = {
    id: number
    lessonId: number
    uploaderId: number
    driveFileId: number
    operationId: number
    originalName: number
    mimeType: number
    size: number
    allowDownload: number
    state: number
    origin: number
    lastErrorCode: number
    attempts: number
    retryAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CourseFileAvgAggregateInputType = {
    uploaderId?: true
    size?: true
    attempts?: true
  }

  export type CourseFileSumAggregateInputType = {
    uploaderId?: true
    size?: true
    attempts?: true
  }

  export type CourseFileMinAggregateInputType = {
    id?: true
    lessonId?: true
    uploaderId?: true
    driveFileId?: true
    operationId?: true
    originalName?: true
    mimeType?: true
    size?: true
    allowDownload?: true
    state?: true
    origin?: true
    lastErrorCode?: true
    attempts?: true
    retryAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseFileMaxAggregateInputType = {
    id?: true
    lessonId?: true
    uploaderId?: true
    driveFileId?: true
    operationId?: true
    originalName?: true
    mimeType?: true
    size?: true
    allowDownload?: true
    state?: true
    origin?: true
    lastErrorCode?: true
    attempts?: true
    retryAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CourseFileCountAggregateInputType = {
    id?: true
    lessonId?: true
    uploaderId?: true
    driveFileId?: true
    operationId?: true
    originalName?: true
    mimeType?: true
    size?: true
    allowDownload?: true
    state?: true
    origin?: true
    lastErrorCode?: true
    attempts?: true
    retryAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CourseFileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CourseFile to aggregate.
     */
    where?: CourseFileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseFiles to fetch.
     */
    orderBy?: CourseFileOrderByWithRelationInput | CourseFileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CourseFileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseFiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseFiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned CourseFiles
    **/
    _count?: true | CourseFileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: CourseFileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: CourseFileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: CourseFileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: CourseFileMaxAggregateInputType
  }

  export type GetCourseFileAggregateType<T extends CourseFileAggregateArgs> = {
        [P in keyof T & keyof AggregateCourseFile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCourseFile[P]>
      : GetScalarType<T[P], AggregateCourseFile[P]>
  }




  export type CourseFileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CourseFileWhereInput
    orderBy?: CourseFileOrderByWithAggregationInput | CourseFileOrderByWithAggregationInput[]
    by: CourseFileScalarFieldEnum[] | CourseFileScalarFieldEnum
    having?: CourseFileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CourseFileCountAggregateInputType | true
    _avg?: CourseFileAvgAggregateInputType
    _sum?: CourseFileSumAggregateInputType
    _min?: CourseFileMinAggregateInputType
    _max?: CourseFileMaxAggregateInputType
  }

  export type CourseFileGroupByOutputType = {
    id: string
    lessonId: string
    uploaderId: number
    driveFileId: string | null
    operationId: string
    originalName: string
    mimeType: string
    size: bigint
    allowDownload: boolean
    state: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode: string | null
    attempts: number
    retryAt: Date
    createdAt: Date
    updatedAt: Date
    _count: CourseFileCountAggregateOutputType | null
    _avg: CourseFileAvgAggregateOutputType | null
    _sum: CourseFileSumAggregateOutputType | null
    _min: CourseFileMinAggregateOutputType | null
    _max: CourseFileMaxAggregateOutputType | null
  }

  type GetCourseFileGroupByPayload<T extends CourseFileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CourseFileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CourseFileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CourseFileGroupByOutputType[P]>
            : GetScalarType<T[P], CourseFileGroupByOutputType[P]>
        }
      >
    >


  export type CourseFileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    lessonId?: boolean
    uploaderId?: boolean
    driveFileId?: boolean
    operationId?: boolean
    originalName?: boolean
    mimeType?: boolean
    size?: boolean
    allowDownload?: boolean
    state?: boolean
    origin?: boolean
    lastErrorCode?: boolean
    attempts?: boolean
    retryAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lesson?: boolean | CourseLessonDefaultArgs<ExtArgs>
    uploader?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseFile"]>

  export type CourseFileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    lessonId?: boolean
    uploaderId?: boolean
    driveFileId?: boolean
    operationId?: boolean
    originalName?: boolean
    mimeType?: boolean
    size?: boolean
    allowDownload?: boolean
    state?: boolean
    origin?: boolean
    lastErrorCode?: boolean
    attempts?: boolean
    retryAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lesson?: boolean | CourseLessonDefaultArgs<ExtArgs>
    uploader?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseFile"]>

  export type CourseFileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    lessonId?: boolean
    uploaderId?: boolean
    driveFileId?: boolean
    operationId?: boolean
    originalName?: boolean
    mimeType?: boolean
    size?: boolean
    allowDownload?: boolean
    state?: boolean
    origin?: boolean
    lastErrorCode?: boolean
    attempts?: boolean
    retryAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lesson?: boolean | CourseLessonDefaultArgs<ExtArgs>
    uploader?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["courseFile"]>

  export type CourseFileSelectScalar = {
    id?: boolean
    lessonId?: boolean
    uploaderId?: boolean
    driveFileId?: boolean
    operationId?: boolean
    originalName?: boolean
    mimeType?: boolean
    size?: boolean
    allowDownload?: boolean
    state?: boolean
    origin?: boolean
    lastErrorCode?: boolean
    attempts?: boolean
    retryAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CourseFileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "lessonId" | "uploaderId" | "driveFileId" | "operationId" | "originalName" | "mimeType" | "size" | "allowDownload" | "state" | "origin" | "lastErrorCode" | "attempts" | "retryAt" | "createdAt" | "updatedAt", ExtArgs["result"]["courseFile"]>
  export type CourseFileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lesson?: boolean | CourseLessonDefaultArgs<ExtArgs>
    uploader?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CourseFileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lesson?: boolean | CourseLessonDefaultArgs<ExtArgs>
    uploader?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CourseFileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lesson?: boolean | CourseLessonDefaultArgs<ExtArgs>
    uploader?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CourseFilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CourseFile"
    objects: {
      lesson: Prisma.$CourseLessonPayload<ExtArgs>
      uploader: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      lessonId: string
      uploaderId: number
      driveFileId: string | null
      operationId: string
      originalName: string
      mimeType: string
      size: bigint
      allowDownload: boolean
      state: $Enums.CourseFileState
      origin: $Enums.CourseFileOrigin
      lastErrorCode: string | null
      attempts: number
      retryAt: Date
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["courseFile"]>
    composites: {}
  }

  type CourseFileGetPayload<S extends boolean | null | undefined | CourseFileDefaultArgs> = $Result.GetResult<Prisma.$CourseFilePayload, S>

  type CourseFileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CourseFileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CourseFileCountAggregateInputType | true
    }

  export interface CourseFileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CourseFile'], meta: { name: 'CourseFile' } }
    /**
     * Find zero or one CourseFile that matches the filter.
     * @param {CourseFileFindUniqueArgs} args - Arguments to find a CourseFile
     * @example
     * // Get one CourseFile
     * const courseFile = await prisma.courseFile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CourseFileFindUniqueArgs>(args: SelectSubset<T, CourseFileFindUniqueArgs<ExtArgs>>): Prisma__CourseFileClient<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CourseFile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CourseFileFindUniqueOrThrowArgs} args - Arguments to find a CourseFile
     * @example
     * // Get one CourseFile
     * const courseFile = await prisma.courseFile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CourseFileFindUniqueOrThrowArgs>(args: SelectSubset<T, CourseFileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CourseFileClient<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CourseFile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFileFindFirstArgs} args - Arguments to find a CourseFile
     * @example
     * // Get one CourseFile
     * const courseFile = await prisma.courseFile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CourseFileFindFirstArgs>(args?: SelectSubset<T, CourseFileFindFirstArgs<ExtArgs>>): Prisma__CourseFileClient<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CourseFile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFileFindFirstOrThrowArgs} args - Arguments to find a CourseFile
     * @example
     * // Get one CourseFile
     * const courseFile = await prisma.courseFile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CourseFileFindFirstOrThrowArgs>(args?: SelectSubset<T, CourseFileFindFirstOrThrowArgs<ExtArgs>>): Prisma__CourseFileClient<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CourseFiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CourseFiles
     * const courseFiles = await prisma.courseFile.findMany()
     *
     * // Get first 10 CourseFiles
     * const courseFiles = await prisma.courseFile.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const courseFileWithIdOnly = await prisma.courseFile.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CourseFileFindManyArgs>(args?: SelectSubset<T, CourseFileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CourseFile.
     * @param {CourseFileCreateArgs} args - Arguments to create a CourseFile.
     * @example
     * // Create one CourseFile
     * const CourseFile = await prisma.courseFile.create({
     *   data: {
     *     // ... data to create a CourseFile
     *   }
     * })
     *
     */
    create<T extends CourseFileCreateArgs>(args: SelectSubset<T, CourseFileCreateArgs<ExtArgs>>): Prisma__CourseFileClient<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CourseFiles.
     * @param {CourseFileCreateManyArgs} args - Arguments to create many CourseFiles.
     * @example
     * // Create many CourseFiles
     * const courseFile = await prisma.courseFile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CourseFileCreateManyArgs>(args?: SelectSubset<T, CourseFileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CourseFiles and returns the data saved in the database.
     * @param {CourseFileCreateManyAndReturnArgs} args - Arguments to create many CourseFiles.
     * @example
     * // Create many CourseFiles
     * const courseFile = await prisma.courseFile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many CourseFiles and only return the `id`
     * const courseFileWithIdOnly = await prisma.courseFile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CourseFileCreateManyAndReturnArgs>(args?: SelectSubset<T, CourseFileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CourseFile.
     * @param {CourseFileDeleteArgs} args - Arguments to delete one CourseFile.
     * @example
     * // Delete one CourseFile
     * const CourseFile = await prisma.courseFile.delete({
     *   where: {
     *     // ... filter to delete one CourseFile
     *   }
     * })
     *
     */
    delete<T extends CourseFileDeleteArgs>(args: SelectSubset<T, CourseFileDeleteArgs<ExtArgs>>): Prisma__CourseFileClient<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CourseFile.
     * @param {CourseFileUpdateArgs} args - Arguments to update one CourseFile.
     * @example
     * // Update one CourseFile
     * const courseFile = await prisma.courseFile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CourseFileUpdateArgs>(args: SelectSubset<T, CourseFileUpdateArgs<ExtArgs>>): Prisma__CourseFileClient<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CourseFiles.
     * @param {CourseFileDeleteManyArgs} args - Arguments to filter CourseFiles to delete.
     * @example
     * // Delete a few CourseFiles
     * const { count } = await prisma.courseFile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CourseFileDeleteManyArgs>(args?: SelectSubset<T, CourseFileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CourseFiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CourseFiles
     * const courseFile = await prisma.courseFile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CourseFileUpdateManyArgs>(args: SelectSubset<T, CourseFileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CourseFiles and returns the data updated in the database.
     * @param {CourseFileUpdateManyAndReturnArgs} args - Arguments to update many CourseFiles.
     * @example
     * // Update many CourseFiles
     * const courseFile = await prisma.courseFile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more CourseFiles and only return the `id`
     * const courseFileWithIdOnly = await prisma.courseFile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CourseFileUpdateManyAndReturnArgs>(args: SelectSubset<T, CourseFileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CourseFile.
     * @param {CourseFileUpsertArgs} args - Arguments to update or create a CourseFile.
     * @example
     * // Update or create a CourseFile
     * const courseFile = await prisma.courseFile.upsert({
     *   create: {
     *     // ... data to create a CourseFile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CourseFile we want to update
     *   }
     * })
     */
    upsert<T extends CourseFileUpsertArgs>(args: SelectSubset<T, CourseFileUpsertArgs<ExtArgs>>): Prisma__CourseFileClient<$Result.GetResult<Prisma.$CourseFilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CourseFiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFileCountArgs} args - Arguments to filter CourseFiles to count.
     * @example
     * // Count the number of CourseFiles
     * const count = await prisma.courseFile.count({
     *   where: {
     *     // ... the filter for the CourseFiles we want to count
     *   }
     * })
    **/
    count<T extends CourseFileCountArgs>(
      args?: Subset<T, CourseFileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CourseFileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CourseFile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CourseFileAggregateArgs>(args: Subset<T, CourseFileAggregateArgs>): Prisma.PrismaPromise<GetCourseFileAggregateType<T>>

    /**
     * Group by CourseFile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CourseFileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends CourseFileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CourseFileGroupByArgs['orderBy'] }
        : { orderBy?: CourseFileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CourseFileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCourseFileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CourseFile model
   */
  readonly fields: CourseFileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CourseFile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CourseFileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lesson<T extends CourseLessonDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CourseLessonDefaultArgs<ExtArgs>>): Prisma__CourseLessonClient<$Result.GetResult<Prisma.$CourseLessonPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    uploader<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CourseFile model
   */
  interface CourseFileFieldRefs {
    readonly id: FieldRef<"CourseFile", 'String'>
    readonly lessonId: FieldRef<"CourseFile", 'String'>
    readonly uploaderId: FieldRef<"CourseFile", 'Int'>
    readonly driveFileId: FieldRef<"CourseFile", 'String'>
    readonly operationId: FieldRef<"CourseFile", 'String'>
    readonly originalName: FieldRef<"CourseFile", 'String'>
    readonly mimeType: FieldRef<"CourseFile", 'String'>
    readonly size: FieldRef<"CourseFile", 'BigInt'>
    readonly allowDownload: FieldRef<"CourseFile", 'Boolean'>
    readonly state: FieldRef<"CourseFile", 'CourseFileState'>
    readonly origin: FieldRef<"CourseFile", 'CourseFileOrigin'>
    readonly lastErrorCode: FieldRef<"CourseFile", 'String'>
    readonly attempts: FieldRef<"CourseFile", 'Int'>
    readonly retryAt: FieldRef<"CourseFile", 'DateTime'>
    readonly createdAt: FieldRef<"CourseFile", 'DateTime'>
    readonly updatedAt: FieldRef<"CourseFile", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * CourseFile findUnique
   */
  export type CourseFileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    /**
     * Filter, which CourseFile to fetch.
     */
    where: CourseFileWhereUniqueInput
  }

  /**
   * CourseFile findUniqueOrThrow
   */
  export type CourseFileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    /**
     * Filter, which CourseFile to fetch.
     */
    where: CourseFileWhereUniqueInput
  }

  /**
   * CourseFile findFirst
   */
  export type CourseFileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    /**
     * Filter, which CourseFile to fetch.
     */
    where?: CourseFileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseFiles to fetch.
     */
    orderBy?: CourseFileOrderByWithRelationInput | CourseFileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CourseFiles.
     */
    cursor?: CourseFileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseFiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseFiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseFiles.
     */
    distinct?: CourseFileScalarFieldEnum | CourseFileScalarFieldEnum[]
  }

  /**
   * CourseFile findFirstOrThrow
   */
  export type CourseFileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    /**
     * Filter, which CourseFile to fetch.
     */
    where?: CourseFileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseFiles to fetch.
     */
    orderBy?: CourseFileOrderByWithRelationInput | CourseFileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CourseFiles.
     */
    cursor?: CourseFileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseFiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseFiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseFiles.
     */
    distinct?: CourseFileScalarFieldEnum | CourseFileScalarFieldEnum[]
  }

  /**
   * CourseFile findMany
   */
  export type CourseFileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    /**
     * Filter, which CourseFiles to fetch.
     */
    where?: CourseFileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CourseFiles to fetch.
     */
    orderBy?: CourseFileOrderByWithRelationInput | CourseFileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing CourseFiles.
     */
    cursor?: CourseFileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CourseFiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CourseFiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CourseFiles.
     */
    distinct?: CourseFileScalarFieldEnum | CourseFileScalarFieldEnum[]
  }

  /**
   * CourseFile create
   */
  export type CourseFileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    /**
     * The data needed to create a CourseFile.
     */
    data: XOR<CourseFileCreateInput, CourseFileUncheckedCreateInput>
  }

  /**
   * CourseFile createMany
   */
  export type CourseFileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CourseFiles.
     */
    data: CourseFileCreateManyInput | CourseFileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CourseFile createManyAndReturn
   */
  export type CourseFileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * The data used to create many CourseFiles.
     */
    data: CourseFileCreateManyInput | CourseFileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CourseFile update
   */
  export type CourseFileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    /**
     * The data needed to update a CourseFile.
     */
    data: XOR<CourseFileUpdateInput, CourseFileUncheckedUpdateInput>
    /**
     * Choose, which CourseFile to update.
     */
    where: CourseFileWhereUniqueInput
  }

  /**
   * CourseFile updateMany
   */
  export type CourseFileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CourseFiles.
     */
    data: XOR<CourseFileUpdateManyMutationInput, CourseFileUncheckedUpdateManyInput>
    /**
     * Filter which CourseFiles to update
     */
    where?: CourseFileWhereInput
    /**
     * Limit how many CourseFiles to update.
     */
    limit?: number
  }

  /**
   * CourseFile updateManyAndReturn
   */
  export type CourseFileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * The data used to update CourseFiles.
     */
    data: XOR<CourseFileUpdateManyMutationInput, CourseFileUncheckedUpdateManyInput>
    /**
     * Filter which CourseFiles to update
     */
    where?: CourseFileWhereInput
    /**
     * Limit how many CourseFiles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CourseFile upsert
   */
  export type CourseFileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    /**
     * The filter to search for the CourseFile to update in case it exists.
     */
    where: CourseFileWhereUniqueInput
    /**
     * In case the CourseFile found by the `where` argument doesn't exist, create a new CourseFile with this data.
     */
    create: XOR<CourseFileCreateInput, CourseFileUncheckedCreateInput>
    /**
     * In case the CourseFile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CourseFileUpdateInput, CourseFileUncheckedUpdateInput>
  }

  /**
   * CourseFile delete
   */
  export type CourseFileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
    /**
     * Filter which CourseFile to delete.
     */
    where: CourseFileWhereUniqueInput
  }

  /**
   * CourseFile deleteMany
   */
  export type CourseFileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CourseFiles to delete
     */
    where?: CourseFileWhereInput
    /**
     * Limit how many CourseFiles to delete.
     */
    limit?: number
  }

  /**
   * CourseFile without action
   */
  export type CourseFileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CourseFile
     */
    select?: CourseFileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CourseFile
     */
    omit?: CourseFileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CourseFileInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    username: 'username',
    email: 'email',
    passwordHash: 'passwordHash',
    role: 'role',
    name: 'name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    isBanned: 'isBanned',
    bannedUntil: 'bannedUntil',
    mutedUntil: 'mutedUntil'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const RoleChangeAuditScalarFieldEnum: {
    id: 'id',
    actorId: 'actorId',
    targetId: 'targetId',
    oldRole: 'oldRole',
    newRole: 'newRole',
    reason: 'reason',
    createdAt: 'createdAt'
  };

  export type RoleChangeAuditScalarFieldEnum = (typeof RoleChangeAuditScalarFieldEnum)[keyof typeof RoleChangeAuditScalarFieldEnum]


  export const CareerScalarFieldEnum: {
    id: 'id',
    name: 'name',
    code: 'code',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CareerScalarFieldEnum = (typeof CareerScalarFieldEnum)[keyof typeof CareerScalarFieldEnum]


  export const StudyPlanScalarFieldEnum: {
    id: 'id',
    careerId: 'careerId',
    name: 'name',
    code: 'code',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type StudyPlanScalarFieldEnum = (typeof StudyPlanScalarFieldEnum)[keyof typeof StudyPlanScalarFieldEnum]


  export const SubjectScalarFieldEnum: {
    id: 'id',
    name: 'name',
    code: 'code',
    description: 'description',
    searchKey: 'searchKey',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SubjectScalarFieldEnum = (typeof SubjectScalarFieldEnum)[keyof typeof SubjectScalarFieldEnum]


  export const StudyPlanSubjectScalarFieldEnum: {
    id: 'id',
    studyPlanId: 'studyPlanId',
    subjectId: 'subjectId',
    year: 'year',
    semester: 'semester',
    credits: 'credits'
  };

  export type StudyPlanSubjectScalarFieldEnum = (typeof StudyPlanSubjectScalarFieldEnum)[keyof typeof StudyPlanSubjectScalarFieldEnum]


  export const CourseScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    status: 'status',
    creatorId: 'creatorId',
    subjectId: 'subjectId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CourseScalarFieldEnum = (typeof CourseScalarFieldEnum)[keyof typeof CourseScalarFieldEnum]


  export const CourseSectionScalarFieldEnum: {
    id: 'id',
    courseId: 'courseId',
    title: 'title',
    position: 'position',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CourseSectionScalarFieldEnum = (typeof CourseSectionScalarFieldEnum)[keyof typeof CourseSectionScalarFieldEnum]


  export const CourseLessonScalarFieldEnum: {
    id: 'id',
    sectionId: 'sectionId',
    title: 'title',
    body: 'body',
    position: 'position',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CourseLessonScalarFieldEnum = (typeof CourseLessonScalarFieldEnum)[keyof typeof CourseLessonScalarFieldEnum]


  export const CourseEnrollmentScalarFieldEnum: {
    id: 'id',
    courseId: 'courseId',
    userId: 'userId',
    active: 'active',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CourseEnrollmentScalarFieldEnum = (typeof CourseEnrollmentScalarFieldEnum)[keyof typeof CourseEnrollmentScalarFieldEnum]


  export const CourseFileScalarFieldEnum: {
    id: 'id',
    lessonId: 'lessonId',
    uploaderId: 'uploaderId',
    driveFileId: 'driveFileId',
    operationId: 'operationId',
    originalName: 'originalName',
    mimeType: 'mimeType',
    size: 'size',
    allowDownload: 'allowDownload',
    state: 'state',
    origin: 'origin',
    lastErrorCode: 'lastErrorCode',
    attempts: 'attempts',
    retryAt: 'retryAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CourseFileScalarFieldEnum = (typeof CourseFileScalarFieldEnum)[keyof typeof CourseFileScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>



  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>



  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>



  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>



  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>



  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>



  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>



  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>



  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>



  /**
   * Reference to a field of type 'CourseStatus'
   */
  export type EnumCourseStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CourseStatus'>



  /**
   * Reference to a field of type 'CourseStatus[]'
   */
  export type ListEnumCourseStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CourseStatus[]'>



  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>



  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>



  /**
   * Reference to a field of type 'CourseFileState'
   */
  export type EnumCourseFileStateFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CourseFileState'>



  /**
   * Reference to a field of type 'CourseFileState[]'
   */
  export type ListEnumCourseFileStateFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CourseFileState[]'>



  /**
   * Reference to a field of type 'CourseFileOrigin'
   */
  export type EnumCourseFileOriginFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CourseFileOrigin'>



  /**
   * Reference to a field of type 'CourseFileOrigin[]'
   */
  export type ListEnumCourseFileOriginFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CourseFileOrigin[]'>



  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>



  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>

  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    username?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    passwordHash?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    name?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    isBanned?: BoolFilter<"User"> | boolean
    bannedUntil?: DateTimeNullableFilter<"User"> | Date | string | null
    mutedUntil?: DateTimeNullableFilter<"User"> | Date | string | null
    courses?: CourseListRelationFilter
    enrollments?: CourseEnrollmentListRelationFilter
    courseFiles?: CourseFileListRelationFilter
    roleChangesMade?: RoleChangeAuditListRelationFilter
    roleChangesReceived?: RoleChangeAuditListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    name?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isBanned?: SortOrder
    bannedUntil?: SortOrderInput | SortOrder
    mutedUntil?: SortOrderInput | SortOrder
    courses?: CourseOrderByRelationAggregateInput
    enrollments?: CourseEnrollmentOrderByRelationAggregateInput
    courseFiles?: CourseFileOrderByRelationAggregateInput
    roleChangesMade?: RoleChangeAuditOrderByRelationAggregateInput
    roleChangesReceived?: RoleChangeAuditOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    username?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    passwordHash?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    name?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    isBanned?: BoolFilter<"User"> | boolean
    bannedUntil?: DateTimeNullableFilter<"User"> | Date | string | null
    mutedUntil?: DateTimeNullableFilter<"User"> | Date | string | null
    courses?: CourseListRelationFilter
    enrollments?: CourseEnrollmentListRelationFilter
    courseFiles?: CourseFileListRelationFilter
    roleChangesMade?: RoleChangeAuditListRelationFilter
    roleChangesReceived?: RoleChangeAuditListRelationFilter
  }, "id" | "username" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    name?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isBanned?: SortOrder
    bannedUntil?: SortOrderInput | SortOrder
    mutedUntil?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    username?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    passwordHash?: StringWithAggregatesFilter<"User"> | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    isBanned?: BoolWithAggregatesFilter<"User"> | boolean
    bannedUntil?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    mutedUntil?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
  }

  export type RoleChangeAuditWhereInput = {
    AND?: RoleChangeAuditWhereInput | RoleChangeAuditWhereInput[]
    OR?: RoleChangeAuditWhereInput[]
    NOT?: RoleChangeAuditWhereInput | RoleChangeAuditWhereInput[]
    id?: UuidFilter<"RoleChangeAudit"> | string
    actorId?: IntFilter<"RoleChangeAudit"> | number
    targetId?: IntFilter<"RoleChangeAudit"> | number
    oldRole?: EnumRoleFilter<"RoleChangeAudit"> | $Enums.Role
    newRole?: EnumRoleFilter<"RoleChangeAudit"> | $Enums.Role
    reason?: StringFilter<"RoleChangeAudit"> | string
    createdAt?: DateTimeFilter<"RoleChangeAudit"> | Date | string
    actor?: XOR<UserScalarRelationFilter, UserWhereInput>
    target?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type RoleChangeAuditOrderByWithRelationInput = {
    id?: SortOrder
    actorId?: SortOrder
    targetId?: SortOrder
    oldRole?: SortOrder
    newRole?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
    actor?: UserOrderByWithRelationInput
    target?: UserOrderByWithRelationInput
  }

  export type RoleChangeAuditWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RoleChangeAuditWhereInput | RoleChangeAuditWhereInput[]
    OR?: RoleChangeAuditWhereInput[]
    NOT?: RoleChangeAuditWhereInput | RoleChangeAuditWhereInput[]
    actorId?: IntFilter<"RoleChangeAudit"> | number
    targetId?: IntFilter<"RoleChangeAudit"> | number
    oldRole?: EnumRoleFilter<"RoleChangeAudit"> | $Enums.Role
    newRole?: EnumRoleFilter<"RoleChangeAudit"> | $Enums.Role
    reason?: StringFilter<"RoleChangeAudit"> | string
    createdAt?: DateTimeFilter<"RoleChangeAudit"> | Date | string
    actor?: XOR<UserScalarRelationFilter, UserWhereInput>
    target?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type RoleChangeAuditOrderByWithAggregationInput = {
    id?: SortOrder
    actorId?: SortOrder
    targetId?: SortOrder
    oldRole?: SortOrder
    newRole?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
    _count?: RoleChangeAuditCountOrderByAggregateInput
    _avg?: RoleChangeAuditAvgOrderByAggregateInput
    _max?: RoleChangeAuditMaxOrderByAggregateInput
    _min?: RoleChangeAuditMinOrderByAggregateInput
    _sum?: RoleChangeAuditSumOrderByAggregateInput
  }

  export type RoleChangeAuditScalarWhereWithAggregatesInput = {
    AND?: RoleChangeAuditScalarWhereWithAggregatesInput | RoleChangeAuditScalarWhereWithAggregatesInput[]
    OR?: RoleChangeAuditScalarWhereWithAggregatesInput[]
    NOT?: RoleChangeAuditScalarWhereWithAggregatesInput | RoleChangeAuditScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"RoleChangeAudit"> | string
    actorId?: IntWithAggregatesFilter<"RoleChangeAudit"> | number
    targetId?: IntWithAggregatesFilter<"RoleChangeAudit"> | number
    oldRole?: EnumRoleWithAggregatesFilter<"RoleChangeAudit"> | $Enums.Role
    newRole?: EnumRoleWithAggregatesFilter<"RoleChangeAudit"> | $Enums.Role
    reason?: StringWithAggregatesFilter<"RoleChangeAudit"> | string
    createdAt?: DateTimeWithAggregatesFilter<"RoleChangeAudit"> | Date | string
  }

  export type CareerWhereInput = {
    AND?: CareerWhereInput | CareerWhereInput[]
    OR?: CareerWhereInput[]
    NOT?: CareerWhereInput | CareerWhereInput[]
    id?: UuidFilter<"Career"> | string
    name?: StringFilter<"Career"> | string
    code?: StringFilter<"Career"> | string
    createdAt?: DateTimeFilter<"Career"> | Date | string
    updatedAt?: DateTimeFilter<"Career"> | Date | string
    studyPlans?: StudyPlanListRelationFilter
  }

  export type CareerOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    studyPlans?: StudyPlanOrderByRelationAggregateInput
  }

  export type CareerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    code?: string
    AND?: CareerWhereInput | CareerWhereInput[]
    OR?: CareerWhereInput[]
    NOT?: CareerWhereInput | CareerWhereInput[]
    name?: StringFilter<"Career"> | string
    createdAt?: DateTimeFilter<"Career"> | Date | string
    updatedAt?: DateTimeFilter<"Career"> | Date | string
    studyPlans?: StudyPlanListRelationFilter
  }, "id" | "code">

  export type CareerOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CareerCountOrderByAggregateInput
    _max?: CareerMaxOrderByAggregateInput
    _min?: CareerMinOrderByAggregateInput
  }

  export type CareerScalarWhereWithAggregatesInput = {
    AND?: CareerScalarWhereWithAggregatesInput | CareerScalarWhereWithAggregatesInput[]
    OR?: CareerScalarWhereWithAggregatesInput[]
    NOT?: CareerScalarWhereWithAggregatesInput | CareerScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Career"> | string
    name?: StringWithAggregatesFilter<"Career"> | string
    code?: StringWithAggregatesFilter<"Career"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Career"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Career"> | Date | string
  }

  export type StudyPlanWhereInput = {
    AND?: StudyPlanWhereInput | StudyPlanWhereInput[]
    OR?: StudyPlanWhereInput[]
    NOT?: StudyPlanWhereInput | StudyPlanWhereInput[]
    id?: UuidFilter<"StudyPlan"> | string
    careerId?: UuidFilter<"StudyPlan"> | string
    name?: StringFilter<"StudyPlan"> | string
    code?: StringFilter<"StudyPlan"> | string
    createdAt?: DateTimeFilter<"StudyPlan"> | Date | string
    updatedAt?: DateTimeFilter<"StudyPlan"> | Date | string
    career?: XOR<CareerScalarRelationFilter, CareerWhereInput>
    subjects?: StudyPlanSubjectListRelationFilter
  }

  export type StudyPlanOrderByWithRelationInput = {
    id?: SortOrder
    careerId?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    career?: CareerOrderByWithRelationInput
    subjects?: StudyPlanSubjectOrderByRelationAggregateInput
  }

  export type StudyPlanWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    careerId_code?: StudyPlanCareerIdCodeCompoundUniqueInput
    AND?: StudyPlanWhereInput | StudyPlanWhereInput[]
    OR?: StudyPlanWhereInput[]
    NOT?: StudyPlanWhereInput | StudyPlanWhereInput[]
    careerId?: UuidFilter<"StudyPlan"> | string
    name?: StringFilter<"StudyPlan"> | string
    code?: StringFilter<"StudyPlan"> | string
    createdAt?: DateTimeFilter<"StudyPlan"> | Date | string
    updatedAt?: DateTimeFilter<"StudyPlan"> | Date | string
    career?: XOR<CareerScalarRelationFilter, CareerWhereInput>
    subjects?: StudyPlanSubjectListRelationFilter
  }, "id" | "careerId_code">

  export type StudyPlanOrderByWithAggregationInput = {
    id?: SortOrder
    careerId?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: StudyPlanCountOrderByAggregateInput
    _max?: StudyPlanMaxOrderByAggregateInput
    _min?: StudyPlanMinOrderByAggregateInput
  }

  export type StudyPlanScalarWhereWithAggregatesInput = {
    AND?: StudyPlanScalarWhereWithAggregatesInput | StudyPlanScalarWhereWithAggregatesInput[]
    OR?: StudyPlanScalarWhereWithAggregatesInput[]
    NOT?: StudyPlanScalarWhereWithAggregatesInput | StudyPlanScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"StudyPlan"> | string
    careerId?: UuidWithAggregatesFilter<"StudyPlan"> | string
    name?: StringWithAggregatesFilter<"StudyPlan"> | string
    code?: StringWithAggregatesFilter<"StudyPlan"> | string
    createdAt?: DateTimeWithAggregatesFilter<"StudyPlan"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"StudyPlan"> | Date | string
  }

  export type SubjectWhereInput = {
    AND?: SubjectWhereInput | SubjectWhereInput[]
    OR?: SubjectWhereInput[]
    NOT?: SubjectWhereInput | SubjectWhereInput[]
    id?: UuidFilter<"Subject"> | string
    name?: StringFilter<"Subject"> | string
    code?: StringNullableFilter<"Subject"> | string | null
    description?: StringNullableFilter<"Subject"> | string | null
    searchKey?: StringFilter<"Subject"> | string
    createdAt?: DateTimeFilter<"Subject"> | Date | string
    updatedAt?: DateTimeFilter<"Subject"> | Date | string
    studyPlans?: StudyPlanSubjectListRelationFilter
    courses?: CourseListRelationFilter
  }

  export type SubjectOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    searchKey?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    studyPlans?: StudyPlanSubjectOrderByRelationAggregateInput
    courses?: CourseOrderByRelationAggregateInput
  }

  export type SubjectWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SubjectWhereInput | SubjectWhereInput[]
    OR?: SubjectWhereInput[]
    NOT?: SubjectWhereInput | SubjectWhereInput[]
    name?: StringFilter<"Subject"> | string
    code?: StringNullableFilter<"Subject"> | string | null
    description?: StringNullableFilter<"Subject"> | string | null
    searchKey?: StringFilter<"Subject"> | string
    createdAt?: DateTimeFilter<"Subject"> | Date | string
    updatedAt?: DateTimeFilter<"Subject"> | Date | string
    studyPlans?: StudyPlanSubjectListRelationFilter
    courses?: CourseListRelationFilter
  }, "id">

  export type SubjectOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    searchKey?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SubjectCountOrderByAggregateInput
    _max?: SubjectMaxOrderByAggregateInput
    _min?: SubjectMinOrderByAggregateInput
  }

  export type SubjectScalarWhereWithAggregatesInput = {
    AND?: SubjectScalarWhereWithAggregatesInput | SubjectScalarWhereWithAggregatesInput[]
    OR?: SubjectScalarWhereWithAggregatesInput[]
    NOT?: SubjectScalarWhereWithAggregatesInput | SubjectScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Subject"> | string
    name?: StringWithAggregatesFilter<"Subject"> | string
    code?: StringNullableWithAggregatesFilter<"Subject"> | string | null
    description?: StringNullableWithAggregatesFilter<"Subject"> | string | null
    searchKey?: StringWithAggregatesFilter<"Subject"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Subject"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Subject"> | Date | string
  }

  export type StudyPlanSubjectWhereInput = {
    AND?: StudyPlanSubjectWhereInput | StudyPlanSubjectWhereInput[]
    OR?: StudyPlanSubjectWhereInput[]
    NOT?: StudyPlanSubjectWhereInput | StudyPlanSubjectWhereInput[]
    id?: UuidFilter<"StudyPlanSubject"> | string
    studyPlanId?: UuidFilter<"StudyPlanSubject"> | string
    subjectId?: UuidFilter<"StudyPlanSubject"> | string
    year?: IntFilter<"StudyPlanSubject"> | number
    semester?: IntFilter<"StudyPlanSubject"> | number
    credits?: IntNullableFilter<"StudyPlanSubject"> | number | null
    studyPlan?: XOR<StudyPlanScalarRelationFilter, StudyPlanWhereInput>
    subject?: XOR<SubjectScalarRelationFilter, SubjectWhereInput>
  }

  export type StudyPlanSubjectOrderByWithRelationInput = {
    id?: SortOrder
    studyPlanId?: SortOrder
    subjectId?: SortOrder
    year?: SortOrder
    semester?: SortOrder
    credits?: SortOrderInput | SortOrder
    studyPlan?: StudyPlanOrderByWithRelationInput
    subject?: SubjectOrderByWithRelationInput
  }

  export type StudyPlanSubjectWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    studyPlanId_subjectId?: StudyPlanSubjectStudyPlanIdSubjectIdCompoundUniqueInput
    AND?: StudyPlanSubjectWhereInput | StudyPlanSubjectWhereInput[]
    OR?: StudyPlanSubjectWhereInput[]
    NOT?: StudyPlanSubjectWhereInput | StudyPlanSubjectWhereInput[]
    studyPlanId?: UuidFilter<"StudyPlanSubject"> | string
    subjectId?: UuidFilter<"StudyPlanSubject"> | string
    year?: IntFilter<"StudyPlanSubject"> | number
    semester?: IntFilter<"StudyPlanSubject"> | number
    credits?: IntNullableFilter<"StudyPlanSubject"> | number | null
    studyPlan?: XOR<StudyPlanScalarRelationFilter, StudyPlanWhereInput>
    subject?: XOR<SubjectScalarRelationFilter, SubjectWhereInput>
  }, "id" | "studyPlanId_subjectId">

  export type StudyPlanSubjectOrderByWithAggregationInput = {
    id?: SortOrder
    studyPlanId?: SortOrder
    subjectId?: SortOrder
    year?: SortOrder
    semester?: SortOrder
    credits?: SortOrderInput | SortOrder
    _count?: StudyPlanSubjectCountOrderByAggregateInput
    _avg?: StudyPlanSubjectAvgOrderByAggregateInput
    _max?: StudyPlanSubjectMaxOrderByAggregateInput
    _min?: StudyPlanSubjectMinOrderByAggregateInput
    _sum?: StudyPlanSubjectSumOrderByAggregateInput
  }

  export type StudyPlanSubjectScalarWhereWithAggregatesInput = {
    AND?: StudyPlanSubjectScalarWhereWithAggregatesInput | StudyPlanSubjectScalarWhereWithAggregatesInput[]
    OR?: StudyPlanSubjectScalarWhereWithAggregatesInput[]
    NOT?: StudyPlanSubjectScalarWhereWithAggregatesInput | StudyPlanSubjectScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"StudyPlanSubject"> | string
    studyPlanId?: UuidWithAggregatesFilter<"StudyPlanSubject"> | string
    subjectId?: UuidWithAggregatesFilter<"StudyPlanSubject"> | string
    year?: IntWithAggregatesFilter<"StudyPlanSubject"> | number
    semester?: IntWithAggregatesFilter<"StudyPlanSubject"> | number
    credits?: IntNullableWithAggregatesFilter<"StudyPlanSubject"> | number | null
  }

  export type CourseWhereInput = {
    AND?: CourseWhereInput | CourseWhereInput[]
    OR?: CourseWhereInput[]
    NOT?: CourseWhereInput | CourseWhereInput[]
    id?: UuidFilter<"Course"> | string
    title?: StringFilter<"Course"> | string
    description?: StringFilter<"Course"> | string
    status?: EnumCourseStatusFilter<"Course"> | $Enums.CourseStatus
    creatorId?: IntFilter<"Course"> | number
    subjectId?: UuidNullableFilter<"Course"> | string | null
    createdAt?: DateTimeFilter<"Course"> | Date | string
    updatedAt?: DateTimeFilter<"Course"> | Date | string
    creator?: XOR<UserScalarRelationFilter, UserWhereInput>
    subject?: XOR<SubjectNullableScalarRelationFilter, SubjectWhereInput> | null
    sections?: CourseSectionListRelationFilter
    enrollments?: CourseEnrollmentListRelationFilter
  }

  export type CourseOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    creatorId?: SortOrder
    subjectId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creator?: UserOrderByWithRelationInput
    subject?: SubjectOrderByWithRelationInput
    sections?: CourseSectionOrderByRelationAggregateInput
    enrollments?: CourseEnrollmentOrderByRelationAggregateInput
  }

  export type CourseWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CourseWhereInput | CourseWhereInput[]
    OR?: CourseWhereInput[]
    NOT?: CourseWhereInput | CourseWhereInput[]
    title?: StringFilter<"Course"> | string
    description?: StringFilter<"Course"> | string
    status?: EnumCourseStatusFilter<"Course"> | $Enums.CourseStatus
    creatorId?: IntFilter<"Course"> | number
    subjectId?: UuidNullableFilter<"Course"> | string | null
    createdAt?: DateTimeFilter<"Course"> | Date | string
    updatedAt?: DateTimeFilter<"Course"> | Date | string
    creator?: XOR<UserScalarRelationFilter, UserWhereInput>
    subject?: XOR<SubjectNullableScalarRelationFilter, SubjectWhereInput> | null
    sections?: CourseSectionListRelationFilter
    enrollments?: CourseEnrollmentListRelationFilter
  }, "id">

  export type CourseOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    creatorId?: SortOrder
    subjectId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CourseCountOrderByAggregateInput
    _avg?: CourseAvgOrderByAggregateInput
    _max?: CourseMaxOrderByAggregateInput
    _min?: CourseMinOrderByAggregateInput
    _sum?: CourseSumOrderByAggregateInput
  }

  export type CourseScalarWhereWithAggregatesInput = {
    AND?: CourseScalarWhereWithAggregatesInput | CourseScalarWhereWithAggregatesInput[]
    OR?: CourseScalarWhereWithAggregatesInput[]
    NOT?: CourseScalarWhereWithAggregatesInput | CourseScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Course"> | string
    title?: StringWithAggregatesFilter<"Course"> | string
    description?: StringWithAggregatesFilter<"Course"> | string
    status?: EnumCourseStatusWithAggregatesFilter<"Course"> | $Enums.CourseStatus
    creatorId?: IntWithAggregatesFilter<"Course"> | number
    subjectId?: UuidNullableWithAggregatesFilter<"Course"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Course"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Course"> | Date | string
  }

  export type CourseSectionWhereInput = {
    AND?: CourseSectionWhereInput | CourseSectionWhereInput[]
    OR?: CourseSectionWhereInput[]
    NOT?: CourseSectionWhereInput | CourseSectionWhereInput[]
    id?: UuidFilter<"CourseSection"> | string
    courseId?: UuidFilter<"CourseSection"> | string
    title?: StringFilter<"CourseSection"> | string
    position?: IntFilter<"CourseSection"> | number
    createdAt?: DateTimeFilter<"CourseSection"> | Date | string
    updatedAt?: DateTimeFilter<"CourseSection"> | Date | string
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    lessons?: CourseLessonListRelationFilter
  }

  export type CourseSectionOrderByWithRelationInput = {
    id?: SortOrder
    courseId?: SortOrder
    title?: SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    course?: CourseOrderByWithRelationInput
    lessons?: CourseLessonOrderByRelationAggregateInput
  }

  export type CourseSectionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    courseId_position?: CourseSectionCourseIdPositionCompoundUniqueInput
    AND?: CourseSectionWhereInput | CourseSectionWhereInput[]
    OR?: CourseSectionWhereInput[]
    NOT?: CourseSectionWhereInput | CourseSectionWhereInput[]
    courseId?: UuidFilter<"CourseSection"> | string
    title?: StringFilter<"CourseSection"> | string
    position?: IntFilter<"CourseSection"> | number
    createdAt?: DateTimeFilter<"CourseSection"> | Date | string
    updatedAt?: DateTimeFilter<"CourseSection"> | Date | string
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    lessons?: CourseLessonListRelationFilter
  }, "id" | "courseId_position">

  export type CourseSectionOrderByWithAggregationInput = {
    id?: SortOrder
    courseId?: SortOrder
    title?: SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CourseSectionCountOrderByAggregateInput
    _avg?: CourseSectionAvgOrderByAggregateInput
    _max?: CourseSectionMaxOrderByAggregateInput
    _min?: CourseSectionMinOrderByAggregateInput
    _sum?: CourseSectionSumOrderByAggregateInput
  }

  export type CourseSectionScalarWhereWithAggregatesInput = {
    AND?: CourseSectionScalarWhereWithAggregatesInput | CourseSectionScalarWhereWithAggregatesInput[]
    OR?: CourseSectionScalarWhereWithAggregatesInput[]
    NOT?: CourseSectionScalarWhereWithAggregatesInput | CourseSectionScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"CourseSection"> | string
    courseId?: UuidWithAggregatesFilter<"CourseSection"> | string
    title?: StringWithAggregatesFilter<"CourseSection"> | string
    position?: IntWithAggregatesFilter<"CourseSection"> | number
    createdAt?: DateTimeWithAggregatesFilter<"CourseSection"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CourseSection"> | Date | string
  }

  export type CourseLessonWhereInput = {
    AND?: CourseLessonWhereInput | CourseLessonWhereInput[]
    OR?: CourseLessonWhereInput[]
    NOT?: CourseLessonWhereInput | CourseLessonWhereInput[]
    id?: UuidFilter<"CourseLesson"> | string
    sectionId?: UuidFilter<"CourseLesson"> | string
    title?: StringFilter<"CourseLesson"> | string
    body?: StringNullableFilter<"CourseLesson"> | string | null
    position?: IntFilter<"CourseLesson"> | number
    createdAt?: DateTimeFilter<"CourseLesson"> | Date | string
    updatedAt?: DateTimeFilter<"CourseLesson"> | Date | string
    section?: XOR<CourseSectionScalarRelationFilter, CourseSectionWhereInput>
    files?: CourseFileListRelationFilter
  }

  export type CourseLessonOrderByWithRelationInput = {
    id?: SortOrder
    sectionId?: SortOrder
    title?: SortOrder
    body?: SortOrderInput | SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    section?: CourseSectionOrderByWithRelationInput
    files?: CourseFileOrderByRelationAggregateInput
  }

  export type CourseLessonWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sectionId_position?: CourseLessonSectionIdPositionCompoundUniqueInput
    AND?: CourseLessonWhereInput | CourseLessonWhereInput[]
    OR?: CourseLessonWhereInput[]
    NOT?: CourseLessonWhereInput | CourseLessonWhereInput[]
    sectionId?: UuidFilter<"CourseLesson"> | string
    title?: StringFilter<"CourseLesson"> | string
    body?: StringNullableFilter<"CourseLesson"> | string | null
    position?: IntFilter<"CourseLesson"> | number
    createdAt?: DateTimeFilter<"CourseLesson"> | Date | string
    updatedAt?: DateTimeFilter<"CourseLesson"> | Date | string
    section?: XOR<CourseSectionScalarRelationFilter, CourseSectionWhereInput>
    files?: CourseFileListRelationFilter
  }, "id" | "sectionId_position">

  export type CourseLessonOrderByWithAggregationInput = {
    id?: SortOrder
    sectionId?: SortOrder
    title?: SortOrder
    body?: SortOrderInput | SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CourseLessonCountOrderByAggregateInput
    _avg?: CourseLessonAvgOrderByAggregateInput
    _max?: CourseLessonMaxOrderByAggregateInput
    _min?: CourseLessonMinOrderByAggregateInput
    _sum?: CourseLessonSumOrderByAggregateInput
  }

  export type CourseLessonScalarWhereWithAggregatesInput = {
    AND?: CourseLessonScalarWhereWithAggregatesInput | CourseLessonScalarWhereWithAggregatesInput[]
    OR?: CourseLessonScalarWhereWithAggregatesInput[]
    NOT?: CourseLessonScalarWhereWithAggregatesInput | CourseLessonScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"CourseLesson"> | string
    sectionId?: UuidWithAggregatesFilter<"CourseLesson"> | string
    title?: StringWithAggregatesFilter<"CourseLesson"> | string
    body?: StringNullableWithAggregatesFilter<"CourseLesson"> | string | null
    position?: IntWithAggregatesFilter<"CourseLesson"> | number
    createdAt?: DateTimeWithAggregatesFilter<"CourseLesson"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CourseLesson"> | Date | string
  }

  export type CourseEnrollmentWhereInput = {
    AND?: CourseEnrollmentWhereInput | CourseEnrollmentWhereInput[]
    OR?: CourseEnrollmentWhereInput[]
    NOT?: CourseEnrollmentWhereInput | CourseEnrollmentWhereInput[]
    id?: UuidFilter<"CourseEnrollment"> | string
    courseId?: UuidFilter<"CourseEnrollment"> | string
    userId?: IntFilter<"CourseEnrollment"> | number
    active?: BoolFilter<"CourseEnrollment"> | boolean
    createdAt?: DateTimeFilter<"CourseEnrollment"> | Date | string
    updatedAt?: DateTimeFilter<"CourseEnrollment"> | Date | string
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type CourseEnrollmentOrderByWithRelationInput = {
    id?: SortOrder
    courseId?: SortOrder
    userId?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    course?: CourseOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type CourseEnrollmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    courseId_userId?: CourseEnrollmentCourseIdUserIdCompoundUniqueInput
    AND?: CourseEnrollmentWhereInput | CourseEnrollmentWhereInput[]
    OR?: CourseEnrollmentWhereInput[]
    NOT?: CourseEnrollmentWhereInput | CourseEnrollmentWhereInput[]
    courseId?: UuidFilter<"CourseEnrollment"> | string
    userId?: IntFilter<"CourseEnrollment"> | number
    active?: BoolFilter<"CourseEnrollment"> | boolean
    createdAt?: DateTimeFilter<"CourseEnrollment"> | Date | string
    updatedAt?: DateTimeFilter<"CourseEnrollment"> | Date | string
    course?: XOR<CourseScalarRelationFilter, CourseWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "courseId_userId">

  export type CourseEnrollmentOrderByWithAggregationInput = {
    id?: SortOrder
    courseId?: SortOrder
    userId?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CourseEnrollmentCountOrderByAggregateInput
    _avg?: CourseEnrollmentAvgOrderByAggregateInput
    _max?: CourseEnrollmentMaxOrderByAggregateInput
    _min?: CourseEnrollmentMinOrderByAggregateInput
    _sum?: CourseEnrollmentSumOrderByAggregateInput
  }

  export type CourseEnrollmentScalarWhereWithAggregatesInput = {
    AND?: CourseEnrollmentScalarWhereWithAggregatesInput | CourseEnrollmentScalarWhereWithAggregatesInput[]
    OR?: CourseEnrollmentScalarWhereWithAggregatesInput[]
    NOT?: CourseEnrollmentScalarWhereWithAggregatesInput | CourseEnrollmentScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"CourseEnrollment"> | string
    courseId?: UuidWithAggregatesFilter<"CourseEnrollment"> | string
    userId?: IntWithAggregatesFilter<"CourseEnrollment"> | number
    active?: BoolWithAggregatesFilter<"CourseEnrollment"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"CourseEnrollment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CourseEnrollment"> | Date | string
  }

  export type CourseFileWhereInput = {
    AND?: CourseFileWhereInput | CourseFileWhereInput[]
    OR?: CourseFileWhereInput[]
    NOT?: CourseFileWhereInput | CourseFileWhereInput[]
    id?: UuidFilter<"CourseFile"> | string
    lessonId?: UuidFilter<"CourseFile"> | string
    uploaderId?: IntFilter<"CourseFile"> | number
    driveFileId?: StringNullableFilter<"CourseFile"> | string | null
    operationId?: UuidFilter<"CourseFile"> | string
    originalName?: StringFilter<"CourseFile"> | string
    mimeType?: StringFilter<"CourseFile"> | string
    size?: BigIntFilter<"CourseFile"> | bigint | number
    allowDownload?: BoolFilter<"CourseFile"> | boolean
    state?: EnumCourseFileStateFilter<"CourseFile"> | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFilter<"CourseFile"> | $Enums.CourseFileOrigin
    lastErrorCode?: StringNullableFilter<"CourseFile"> | string | null
    attempts?: IntFilter<"CourseFile"> | number
    retryAt?: DateTimeFilter<"CourseFile"> | Date | string
    createdAt?: DateTimeFilter<"CourseFile"> | Date | string
    updatedAt?: DateTimeFilter<"CourseFile"> | Date | string
    lesson?: XOR<CourseLessonScalarRelationFilter, CourseLessonWhereInput>
    uploader?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type CourseFileOrderByWithRelationInput = {
    id?: SortOrder
    lessonId?: SortOrder
    uploaderId?: SortOrder
    driveFileId?: SortOrderInput | SortOrder
    operationId?: SortOrder
    originalName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    allowDownload?: SortOrder
    state?: SortOrder
    origin?: SortOrder
    lastErrorCode?: SortOrderInput | SortOrder
    attempts?: SortOrder
    retryAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lesson?: CourseLessonOrderByWithRelationInput
    uploader?: UserOrderByWithRelationInput
  }

  export type CourseFileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    driveFileId?: string
    operationId?: string
    AND?: CourseFileWhereInput | CourseFileWhereInput[]
    OR?: CourseFileWhereInput[]
    NOT?: CourseFileWhereInput | CourseFileWhereInput[]
    lessonId?: UuidFilter<"CourseFile"> | string
    uploaderId?: IntFilter<"CourseFile"> | number
    originalName?: StringFilter<"CourseFile"> | string
    mimeType?: StringFilter<"CourseFile"> | string
    size?: BigIntFilter<"CourseFile"> | bigint | number
    allowDownload?: BoolFilter<"CourseFile"> | boolean
    state?: EnumCourseFileStateFilter<"CourseFile"> | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFilter<"CourseFile"> | $Enums.CourseFileOrigin
    lastErrorCode?: StringNullableFilter<"CourseFile"> | string | null
    attempts?: IntFilter<"CourseFile"> | number
    retryAt?: DateTimeFilter<"CourseFile"> | Date | string
    createdAt?: DateTimeFilter<"CourseFile"> | Date | string
    updatedAt?: DateTimeFilter<"CourseFile"> | Date | string
    lesson?: XOR<CourseLessonScalarRelationFilter, CourseLessonWhereInput>
    uploader?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "driveFileId" | "operationId">

  export type CourseFileOrderByWithAggregationInput = {
    id?: SortOrder
    lessonId?: SortOrder
    uploaderId?: SortOrder
    driveFileId?: SortOrderInput | SortOrder
    operationId?: SortOrder
    originalName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    allowDownload?: SortOrder
    state?: SortOrder
    origin?: SortOrder
    lastErrorCode?: SortOrderInput | SortOrder
    attempts?: SortOrder
    retryAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CourseFileCountOrderByAggregateInput
    _avg?: CourseFileAvgOrderByAggregateInput
    _max?: CourseFileMaxOrderByAggregateInput
    _min?: CourseFileMinOrderByAggregateInput
    _sum?: CourseFileSumOrderByAggregateInput
  }

  export type CourseFileScalarWhereWithAggregatesInput = {
    AND?: CourseFileScalarWhereWithAggregatesInput | CourseFileScalarWhereWithAggregatesInput[]
    OR?: CourseFileScalarWhereWithAggregatesInput[]
    NOT?: CourseFileScalarWhereWithAggregatesInput | CourseFileScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"CourseFile"> | string
    lessonId?: UuidWithAggregatesFilter<"CourseFile"> | string
    uploaderId?: IntWithAggregatesFilter<"CourseFile"> | number
    driveFileId?: StringNullableWithAggregatesFilter<"CourseFile"> | string | null
    operationId?: UuidWithAggregatesFilter<"CourseFile"> | string
    originalName?: StringWithAggregatesFilter<"CourseFile"> | string
    mimeType?: StringWithAggregatesFilter<"CourseFile"> | string
    size?: BigIntWithAggregatesFilter<"CourseFile"> | bigint | number
    allowDownload?: BoolWithAggregatesFilter<"CourseFile"> | boolean
    state?: EnumCourseFileStateWithAggregatesFilter<"CourseFile"> | $Enums.CourseFileState
    origin?: EnumCourseFileOriginWithAggregatesFilter<"CourseFile"> | $Enums.CourseFileOrigin
    lastErrorCode?: StringNullableWithAggregatesFilter<"CourseFile"> | string | null
    attempts?: IntWithAggregatesFilter<"CourseFile"> | number
    retryAt?: DateTimeWithAggregatesFilter<"CourseFile"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"CourseFile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CourseFile"> | Date | string
  }

  export type UserCreateInput = {
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseCreateNestedManyWithoutCreatorInput
    enrollments?: CourseEnrollmentCreateNestedManyWithoutUserInput
    courseFiles?: CourseFileCreateNestedManyWithoutUploaderInput
    roleChangesMade?: RoleChangeAuditCreateNestedManyWithoutActorInput
    roleChangesReceived?: RoleChangeAuditCreateNestedManyWithoutTargetInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseUncheckedCreateNestedManyWithoutCreatorInput
    enrollments?: CourseEnrollmentUncheckedCreateNestedManyWithoutUserInput
    courseFiles?: CourseFileUncheckedCreateNestedManyWithoutUploaderInput
    roleChangesMade?: RoleChangeAuditUncheckedCreateNestedManyWithoutActorInput
    roleChangesReceived?: RoleChangeAuditUncheckedCreateNestedManyWithoutTargetInput
  }

  export type UserUpdateInput = {
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUpdateManyWithoutCreatorNestedInput
    enrollments?: CourseEnrollmentUpdateManyWithoutUserNestedInput
    courseFiles?: CourseFileUpdateManyWithoutUploaderNestedInput
    roleChangesMade?: RoleChangeAuditUpdateManyWithoutActorNestedInput
    roleChangesReceived?: RoleChangeAuditUpdateManyWithoutTargetNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUncheckedUpdateManyWithoutCreatorNestedInput
    enrollments?: CourseEnrollmentUncheckedUpdateManyWithoutUserNestedInput
    courseFiles?: CourseFileUncheckedUpdateManyWithoutUploaderNestedInput
    roleChangesMade?: RoleChangeAuditUncheckedUpdateManyWithoutActorNestedInput
    roleChangesReceived?: RoleChangeAuditUncheckedUpdateManyWithoutTargetNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
  }

  export type UserUpdateManyMutationInput = {
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type RoleChangeAuditCreateInput = {
    id?: string
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt?: Date | string
    actor: UserCreateNestedOneWithoutRoleChangesMadeInput
    target: UserCreateNestedOneWithoutRoleChangesReceivedInput
  }

  export type RoleChangeAuditUncheckedCreateInput = {
    id?: string
    actorId: number
    targetId: number
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt?: Date | string
  }

  export type RoleChangeAuditUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    actor?: UserUpdateOneRequiredWithoutRoleChangesMadeNestedInput
    target?: UserUpdateOneRequiredWithoutRoleChangesReceivedNestedInput
  }

  export type RoleChangeAuditUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: IntFieldUpdateOperationsInput | number
    targetId?: IntFieldUpdateOperationsInput | number
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoleChangeAuditCreateManyInput = {
    id?: string
    actorId: number
    targetId: number
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt?: Date | string
  }

  export type RoleChangeAuditUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoleChangeAuditUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: IntFieldUpdateOperationsInput | number
    targetId?: IntFieldUpdateOperationsInput | number
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CareerCreateInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
    studyPlans?: StudyPlanCreateNestedManyWithoutCareerInput
  }

  export type CareerUncheckedCreateInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
    studyPlans?: StudyPlanUncheckedCreateNestedManyWithoutCareerInput
  }

  export type CareerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    studyPlans?: StudyPlanUpdateManyWithoutCareerNestedInput
  }

  export type CareerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    studyPlans?: StudyPlanUncheckedUpdateManyWithoutCareerNestedInput
  }

  export type CareerCreateManyInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CareerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CareerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudyPlanCreateInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
    career: CareerCreateNestedOneWithoutStudyPlansInput
    subjects?: StudyPlanSubjectCreateNestedManyWithoutStudyPlanInput
  }

  export type StudyPlanUncheckedCreateInput = {
    id?: string
    careerId: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
    subjects?: StudyPlanSubjectUncheckedCreateNestedManyWithoutStudyPlanInput
  }

  export type StudyPlanUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    career?: CareerUpdateOneRequiredWithoutStudyPlansNestedInput
    subjects?: StudyPlanSubjectUpdateManyWithoutStudyPlanNestedInput
  }

  export type StudyPlanUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    careerId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subjects?: StudyPlanSubjectUncheckedUpdateManyWithoutStudyPlanNestedInput
  }

  export type StudyPlanCreateManyInput = {
    id?: string
    careerId: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StudyPlanUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudyPlanUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    careerId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubjectCreateInput = {
    id?: string
    name: string
    code?: string | null
    description?: string | null
    searchKey: string
    createdAt?: Date | string
    updatedAt?: Date | string
    studyPlans?: StudyPlanSubjectCreateNestedManyWithoutSubjectInput
    courses?: CourseCreateNestedManyWithoutSubjectInput
  }

  export type SubjectUncheckedCreateInput = {
    id?: string
    name: string
    code?: string | null
    description?: string | null
    searchKey: string
    createdAt?: Date | string
    updatedAt?: Date | string
    studyPlans?: StudyPlanSubjectUncheckedCreateNestedManyWithoutSubjectInput
    courses?: CourseUncheckedCreateNestedManyWithoutSubjectInput
  }

  export type SubjectUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    searchKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    studyPlans?: StudyPlanSubjectUpdateManyWithoutSubjectNestedInput
    courses?: CourseUpdateManyWithoutSubjectNestedInput
  }

  export type SubjectUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    searchKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    studyPlans?: StudyPlanSubjectUncheckedUpdateManyWithoutSubjectNestedInput
    courses?: CourseUncheckedUpdateManyWithoutSubjectNestedInput
  }

  export type SubjectCreateManyInput = {
    id?: string
    name: string
    code?: string | null
    description?: string | null
    searchKey: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubjectUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    searchKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubjectUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    searchKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudyPlanSubjectCreateInput = {
    id?: string
    year: number
    semester: number
    credits?: number | null
    studyPlan: StudyPlanCreateNestedOneWithoutSubjectsInput
    subject: SubjectCreateNestedOneWithoutStudyPlansInput
  }

  export type StudyPlanSubjectUncheckedCreateInput = {
    id?: string
    studyPlanId: string
    subjectId: string
    year: number
    semester: number
    credits?: number | null
  }

  export type StudyPlanSubjectUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
    studyPlan?: StudyPlanUpdateOneRequiredWithoutSubjectsNestedInput
    subject?: SubjectUpdateOneRequiredWithoutStudyPlansNestedInput
  }

  export type StudyPlanSubjectUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    studyPlanId?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type StudyPlanSubjectCreateManyInput = {
    id?: string
    studyPlanId: string
    subjectId: string
    year: number
    semester: number
    credits?: number | null
  }

  export type StudyPlanSubjectUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type StudyPlanSubjectUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    studyPlanId?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type CourseCreateInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: UserCreateNestedOneWithoutCoursesInput
    subject?: SubjectCreateNestedOneWithoutCoursesInput
    sections?: CourseSectionCreateNestedManyWithoutCourseInput
    enrollments?: CourseEnrollmentCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    creatorId: number
    subjectId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sections?: CourseSectionUncheckedCreateNestedManyWithoutCourseInput
    enrollments?: CourseEnrollmentUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneRequiredWithoutCoursesNestedInput
    subject?: SubjectUpdateOneWithoutCoursesNestedInput
    sections?: CourseSectionUpdateManyWithoutCourseNestedInput
    enrollments?: CourseEnrollmentUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    creatorId?: IntFieldUpdateOperationsInput | number
    subjectId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sections?: CourseSectionUncheckedUpdateManyWithoutCourseNestedInput
    enrollments?: CourseEnrollmentUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type CourseCreateManyInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    creatorId: number
    subjectId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    creatorId?: IntFieldUpdateOperationsInput | number
    subjectId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseSectionCreateInput = {
    id?: string
    title: string
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    course: CourseCreateNestedOneWithoutSectionsInput
    lessons?: CourseLessonCreateNestedManyWithoutSectionInput
  }

  export type CourseSectionUncheckedCreateInput = {
    id?: string
    courseId: string
    title: string
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    lessons?: CourseLessonUncheckedCreateNestedManyWithoutSectionInput
  }

  export type CourseSectionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    course?: CourseUpdateOneRequiredWithoutSectionsNestedInput
    lessons?: CourseLessonUpdateManyWithoutSectionNestedInput
  }

  export type CourseSectionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lessons?: CourseLessonUncheckedUpdateManyWithoutSectionNestedInput
  }

  export type CourseSectionCreateManyInput = {
    id?: string
    courseId: string
    title: string
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseSectionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseSectionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseLessonCreateInput = {
    id?: string
    title: string
    body?: string | null
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    section: CourseSectionCreateNestedOneWithoutLessonsInput
    files?: CourseFileCreateNestedManyWithoutLessonInput
  }

  export type CourseLessonUncheckedCreateInput = {
    id?: string
    sectionId: string
    title: string
    body?: string | null
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    files?: CourseFileUncheckedCreateNestedManyWithoutLessonInput
  }

  export type CourseLessonUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    section?: CourseSectionUpdateOneRequiredWithoutLessonsNestedInput
    files?: CourseFileUpdateManyWithoutLessonNestedInput
  }

  export type CourseLessonUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sectionId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    files?: CourseFileUncheckedUpdateManyWithoutLessonNestedInput
  }

  export type CourseLessonCreateManyInput = {
    id?: string
    sectionId: string
    title: string
    body?: string | null
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseLessonUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseLessonUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sectionId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseEnrollmentCreateInput = {
    id?: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    course: CourseCreateNestedOneWithoutEnrollmentsInput
    user: UserCreateNestedOneWithoutEnrollmentsInput
  }

  export type CourseEnrollmentUncheckedCreateInput = {
    id?: string
    courseId: string
    userId: number
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseEnrollmentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    course?: CourseUpdateOneRequiredWithoutEnrollmentsNestedInput
    user?: UserUpdateOneRequiredWithoutEnrollmentsNestedInput
  }

  export type CourseEnrollmentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseEnrollmentCreateManyInput = {
    id?: string
    courseId: string
    userId: number
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseEnrollmentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseEnrollmentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseFileCreateInput = {
    id?: string
    driveFileId?: string | null
    operationId?: string
    originalName: string
    mimeType: string
    size: bigint | number
    allowDownload?: boolean
    state?: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode?: string | null
    attempts?: number
    retryAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lesson: CourseLessonCreateNestedOneWithoutFilesInput
    uploader: UserCreateNestedOneWithoutCourseFilesInput
  }

  export type CourseFileUncheckedCreateInput = {
    id?: string
    lessonId: string
    uploaderId: number
    driveFileId?: string | null
    operationId?: string
    originalName: string
    mimeType: string
    size: bigint | number
    allowDownload?: boolean
    state?: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode?: string | null
    attempts?: number
    retryAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseFileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lesson?: CourseLessonUpdateOneRequiredWithoutFilesNestedInput
    uploader?: UserUpdateOneRequiredWithoutCourseFilesNestedInput
  }

  export type CourseFileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    lessonId?: StringFieldUpdateOperationsInput | string
    uploaderId?: IntFieldUpdateOperationsInput | number
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseFileCreateManyInput = {
    id?: string
    lessonId: string
    uploaderId: number
    driveFileId?: string | null
    operationId?: string
    originalName: string
    mimeType: string
    size: bigint | number
    allowDownload?: boolean
    state?: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode?: string | null
    attempts?: number
    retryAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseFileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseFileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    lessonId?: StringFieldUpdateOperationsInput | string
    uploaderId?: IntFieldUpdateOperationsInput | number
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type CourseListRelationFilter = {
    every?: CourseWhereInput
    some?: CourseWhereInput
    none?: CourseWhereInput
  }

  export type CourseEnrollmentListRelationFilter = {
    every?: CourseEnrollmentWhereInput
    some?: CourseEnrollmentWhereInput
    none?: CourseEnrollmentWhereInput
  }

  export type CourseFileListRelationFilter = {
    every?: CourseFileWhereInput
    some?: CourseFileWhereInput
    none?: CourseFileWhereInput
  }

  export type RoleChangeAuditListRelationFilter = {
    every?: RoleChangeAuditWhereInput
    some?: RoleChangeAuditWhereInput
    none?: RoleChangeAuditWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CourseOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CourseEnrollmentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CourseFileOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RoleChangeAuditOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isBanned?: SortOrder
    bannedUntil?: SortOrder
    mutedUntil?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isBanned?: SortOrder
    bannedUntil?: SortOrder
    mutedUntil?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isBanned?: SortOrder
    bannedUntil?: SortOrder
    mutedUntil?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type RoleChangeAuditCountOrderByAggregateInput = {
    id?: SortOrder
    actorId?: SortOrder
    targetId?: SortOrder
    oldRole?: SortOrder
    newRole?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type RoleChangeAuditAvgOrderByAggregateInput = {
    actorId?: SortOrder
    targetId?: SortOrder
  }

  export type RoleChangeAuditMaxOrderByAggregateInput = {
    id?: SortOrder
    actorId?: SortOrder
    targetId?: SortOrder
    oldRole?: SortOrder
    newRole?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type RoleChangeAuditMinOrderByAggregateInput = {
    id?: SortOrder
    actorId?: SortOrder
    targetId?: SortOrder
    oldRole?: SortOrder
    newRole?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type RoleChangeAuditSumOrderByAggregateInput = {
    actorId?: SortOrder
    targetId?: SortOrder
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StudyPlanListRelationFilter = {
    every?: StudyPlanWhereInput
    some?: StudyPlanWhereInput
    none?: StudyPlanWhereInput
  }

  export type StudyPlanOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CareerCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CareerMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CareerMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CareerScalarRelationFilter = {
    is?: CareerWhereInput
    isNot?: CareerWhereInput
  }

  export type StudyPlanSubjectListRelationFilter = {
    every?: StudyPlanSubjectWhereInput
    some?: StudyPlanSubjectWhereInput
    none?: StudyPlanSubjectWhereInput
  }

  export type StudyPlanSubjectOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type StudyPlanCareerIdCodeCompoundUniqueInput = {
    careerId: string
    code: string
  }

  export type StudyPlanCountOrderByAggregateInput = {
    id?: SortOrder
    careerId?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StudyPlanMaxOrderByAggregateInput = {
    id?: SortOrder
    careerId?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StudyPlanMinOrderByAggregateInput = {
    id?: SortOrder
    careerId?: SortOrder
    name?: SortOrder
    code?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubjectCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    description?: SortOrder
    searchKey?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubjectMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    description?: SortOrder
    searchKey?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubjectMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    description?: SortOrder
    searchKey?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type StudyPlanScalarRelationFilter = {
    is?: StudyPlanWhereInput
    isNot?: StudyPlanWhereInput
  }

  export type SubjectScalarRelationFilter = {
    is?: SubjectWhereInput
    isNot?: SubjectWhereInput
  }

  export type StudyPlanSubjectStudyPlanIdSubjectIdCompoundUniqueInput = {
    studyPlanId: string
    subjectId: string
  }

  export type StudyPlanSubjectCountOrderByAggregateInput = {
    id?: SortOrder
    studyPlanId?: SortOrder
    subjectId?: SortOrder
    year?: SortOrder
    semester?: SortOrder
    credits?: SortOrder
  }

  export type StudyPlanSubjectAvgOrderByAggregateInput = {
    year?: SortOrder
    semester?: SortOrder
    credits?: SortOrder
  }

  export type StudyPlanSubjectMaxOrderByAggregateInput = {
    id?: SortOrder
    studyPlanId?: SortOrder
    subjectId?: SortOrder
    year?: SortOrder
    semester?: SortOrder
    credits?: SortOrder
  }

  export type StudyPlanSubjectMinOrderByAggregateInput = {
    id?: SortOrder
    studyPlanId?: SortOrder
    subjectId?: SortOrder
    year?: SortOrder
    semester?: SortOrder
    credits?: SortOrder
  }

  export type StudyPlanSubjectSumOrderByAggregateInput = {
    year?: SortOrder
    semester?: SortOrder
    credits?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumCourseStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseStatus | EnumCourseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CourseStatus[] | ListEnumCourseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseStatus[] | ListEnumCourseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseStatusFilter<$PrismaModel> | $Enums.CourseStatus
  }

  export type UuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type SubjectNullableScalarRelationFilter = {
    is?: SubjectWhereInput | null
    isNot?: SubjectWhereInput | null
  }

  export type CourseSectionListRelationFilter = {
    every?: CourseSectionWhereInput
    some?: CourseSectionWhereInput
    none?: CourseSectionWhereInput
  }

  export type CourseSectionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CourseCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    creatorId?: SortOrder
    subjectId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseAvgOrderByAggregateInput = {
    creatorId?: SortOrder
  }

  export type CourseMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    creatorId?: SortOrder
    subjectId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    status?: SortOrder
    creatorId?: SortOrder
    subjectId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseSumOrderByAggregateInput = {
    creatorId?: SortOrder
  }

  export type EnumCourseStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseStatus | EnumCourseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CourseStatus[] | ListEnumCourseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseStatus[] | ListEnumCourseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseStatusWithAggregatesFilter<$PrismaModel> | $Enums.CourseStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCourseStatusFilter<$PrismaModel>
    _max?: NestedEnumCourseStatusFilter<$PrismaModel>
  }

  export type UuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type CourseScalarRelationFilter = {
    is?: CourseWhereInput
    isNot?: CourseWhereInput
  }

  export type CourseLessonListRelationFilter = {
    every?: CourseLessonWhereInput
    some?: CourseLessonWhereInput
    none?: CourseLessonWhereInput
  }

  export type CourseLessonOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CourseSectionCourseIdPositionCompoundUniqueInput = {
    courseId: string
    position: number
  }

  export type CourseSectionCountOrderByAggregateInput = {
    id?: SortOrder
    courseId?: SortOrder
    title?: SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseSectionAvgOrderByAggregateInput = {
    position?: SortOrder
  }

  export type CourseSectionMaxOrderByAggregateInput = {
    id?: SortOrder
    courseId?: SortOrder
    title?: SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseSectionMinOrderByAggregateInput = {
    id?: SortOrder
    courseId?: SortOrder
    title?: SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseSectionSumOrderByAggregateInput = {
    position?: SortOrder
  }

  export type CourseSectionScalarRelationFilter = {
    is?: CourseSectionWhereInput
    isNot?: CourseSectionWhereInput
  }

  export type CourseLessonSectionIdPositionCompoundUniqueInput = {
    sectionId: string
    position: number
  }

  export type CourseLessonCountOrderByAggregateInput = {
    id?: SortOrder
    sectionId?: SortOrder
    title?: SortOrder
    body?: SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseLessonAvgOrderByAggregateInput = {
    position?: SortOrder
  }

  export type CourseLessonMaxOrderByAggregateInput = {
    id?: SortOrder
    sectionId?: SortOrder
    title?: SortOrder
    body?: SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseLessonMinOrderByAggregateInput = {
    id?: SortOrder
    sectionId?: SortOrder
    title?: SortOrder
    body?: SortOrder
    position?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseLessonSumOrderByAggregateInput = {
    position?: SortOrder
  }

  export type CourseEnrollmentCourseIdUserIdCompoundUniqueInput = {
    courseId: string
    userId: number
  }

  export type CourseEnrollmentCountOrderByAggregateInput = {
    id?: SortOrder
    courseId?: SortOrder
    userId?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseEnrollmentAvgOrderByAggregateInput = {
    userId?: SortOrder
  }

  export type CourseEnrollmentMaxOrderByAggregateInput = {
    id?: SortOrder
    courseId?: SortOrder
    userId?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseEnrollmentMinOrderByAggregateInput = {
    id?: SortOrder
    courseId?: SortOrder
    userId?: SortOrder
    active?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseEnrollmentSumOrderByAggregateInput = {
    userId?: SortOrder
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type EnumCourseFileStateFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseFileState | EnumCourseFileStateFieldRefInput<$PrismaModel>
    in?: $Enums.CourseFileState[] | ListEnumCourseFileStateFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseFileState[] | ListEnumCourseFileStateFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseFileStateFilter<$PrismaModel> | $Enums.CourseFileState
  }

  export type EnumCourseFileOriginFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseFileOrigin | EnumCourseFileOriginFieldRefInput<$PrismaModel>
    in?: $Enums.CourseFileOrigin[] | ListEnumCourseFileOriginFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseFileOrigin[] | ListEnumCourseFileOriginFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseFileOriginFilter<$PrismaModel> | $Enums.CourseFileOrigin
  }

  export type CourseLessonScalarRelationFilter = {
    is?: CourseLessonWhereInput
    isNot?: CourseLessonWhereInput
  }

  export type CourseFileCountOrderByAggregateInput = {
    id?: SortOrder
    lessonId?: SortOrder
    uploaderId?: SortOrder
    driveFileId?: SortOrder
    operationId?: SortOrder
    originalName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    allowDownload?: SortOrder
    state?: SortOrder
    origin?: SortOrder
    lastErrorCode?: SortOrder
    attempts?: SortOrder
    retryAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseFileAvgOrderByAggregateInput = {
    uploaderId?: SortOrder
    size?: SortOrder
    attempts?: SortOrder
  }

  export type CourseFileMaxOrderByAggregateInput = {
    id?: SortOrder
    lessonId?: SortOrder
    uploaderId?: SortOrder
    driveFileId?: SortOrder
    operationId?: SortOrder
    originalName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    allowDownload?: SortOrder
    state?: SortOrder
    origin?: SortOrder
    lastErrorCode?: SortOrder
    attempts?: SortOrder
    retryAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseFileMinOrderByAggregateInput = {
    id?: SortOrder
    lessonId?: SortOrder
    uploaderId?: SortOrder
    driveFileId?: SortOrder
    operationId?: SortOrder
    originalName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    allowDownload?: SortOrder
    state?: SortOrder
    origin?: SortOrder
    lastErrorCode?: SortOrder
    attempts?: SortOrder
    retryAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CourseFileSumOrderByAggregateInput = {
    uploaderId?: SortOrder
    size?: SortOrder
    attempts?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type EnumCourseFileStateWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseFileState | EnumCourseFileStateFieldRefInput<$PrismaModel>
    in?: $Enums.CourseFileState[] | ListEnumCourseFileStateFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseFileState[] | ListEnumCourseFileStateFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseFileStateWithAggregatesFilter<$PrismaModel> | $Enums.CourseFileState
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCourseFileStateFilter<$PrismaModel>
    _max?: NestedEnumCourseFileStateFilter<$PrismaModel>
  }

  export type EnumCourseFileOriginWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseFileOrigin | EnumCourseFileOriginFieldRefInput<$PrismaModel>
    in?: $Enums.CourseFileOrigin[] | ListEnumCourseFileOriginFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseFileOrigin[] | ListEnumCourseFileOriginFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseFileOriginWithAggregatesFilter<$PrismaModel> | $Enums.CourseFileOrigin
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCourseFileOriginFilter<$PrismaModel>
    _max?: NestedEnumCourseFileOriginFilter<$PrismaModel>
  }

  export type CourseCreateNestedManyWithoutCreatorInput = {
    create?: XOR<CourseCreateWithoutCreatorInput, CourseUncheckedCreateWithoutCreatorInput> | CourseCreateWithoutCreatorInput[] | CourseUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutCreatorInput | CourseCreateOrConnectWithoutCreatorInput[]
    createMany?: CourseCreateManyCreatorInputEnvelope
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
  }

  export type CourseEnrollmentCreateNestedManyWithoutUserInput = {
    create?: XOR<CourseEnrollmentCreateWithoutUserInput, CourseEnrollmentUncheckedCreateWithoutUserInput> | CourseEnrollmentCreateWithoutUserInput[] | CourseEnrollmentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CourseEnrollmentCreateOrConnectWithoutUserInput | CourseEnrollmentCreateOrConnectWithoutUserInput[]
    createMany?: CourseEnrollmentCreateManyUserInputEnvelope
    connect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
  }

  export type CourseFileCreateNestedManyWithoutUploaderInput = {
    create?: XOR<CourseFileCreateWithoutUploaderInput, CourseFileUncheckedCreateWithoutUploaderInput> | CourseFileCreateWithoutUploaderInput[] | CourseFileUncheckedCreateWithoutUploaderInput[]
    connectOrCreate?: CourseFileCreateOrConnectWithoutUploaderInput | CourseFileCreateOrConnectWithoutUploaderInput[]
    createMany?: CourseFileCreateManyUploaderInputEnvelope
    connect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
  }

  export type RoleChangeAuditCreateNestedManyWithoutActorInput = {
    create?: XOR<RoleChangeAuditCreateWithoutActorInput, RoleChangeAuditUncheckedCreateWithoutActorInput> | RoleChangeAuditCreateWithoutActorInput[] | RoleChangeAuditUncheckedCreateWithoutActorInput[]
    connectOrCreate?: RoleChangeAuditCreateOrConnectWithoutActorInput | RoleChangeAuditCreateOrConnectWithoutActorInput[]
    createMany?: RoleChangeAuditCreateManyActorInputEnvelope
    connect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
  }

  export type RoleChangeAuditCreateNestedManyWithoutTargetInput = {
    create?: XOR<RoleChangeAuditCreateWithoutTargetInput, RoleChangeAuditUncheckedCreateWithoutTargetInput> | RoleChangeAuditCreateWithoutTargetInput[] | RoleChangeAuditUncheckedCreateWithoutTargetInput[]
    connectOrCreate?: RoleChangeAuditCreateOrConnectWithoutTargetInput | RoleChangeAuditCreateOrConnectWithoutTargetInput[]
    createMany?: RoleChangeAuditCreateManyTargetInputEnvelope
    connect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
  }

  export type CourseUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<CourseCreateWithoutCreatorInput, CourseUncheckedCreateWithoutCreatorInput> | CourseCreateWithoutCreatorInput[] | CourseUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutCreatorInput | CourseCreateOrConnectWithoutCreatorInput[]
    createMany?: CourseCreateManyCreatorInputEnvelope
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
  }

  export type CourseEnrollmentUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<CourseEnrollmentCreateWithoutUserInput, CourseEnrollmentUncheckedCreateWithoutUserInput> | CourseEnrollmentCreateWithoutUserInput[] | CourseEnrollmentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CourseEnrollmentCreateOrConnectWithoutUserInput | CourseEnrollmentCreateOrConnectWithoutUserInput[]
    createMany?: CourseEnrollmentCreateManyUserInputEnvelope
    connect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
  }

  export type CourseFileUncheckedCreateNestedManyWithoutUploaderInput = {
    create?: XOR<CourseFileCreateWithoutUploaderInput, CourseFileUncheckedCreateWithoutUploaderInput> | CourseFileCreateWithoutUploaderInput[] | CourseFileUncheckedCreateWithoutUploaderInput[]
    connectOrCreate?: CourseFileCreateOrConnectWithoutUploaderInput | CourseFileCreateOrConnectWithoutUploaderInput[]
    createMany?: CourseFileCreateManyUploaderInputEnvelope
    connect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
  }

  export type RoleChangeAuditUncheckedCreateNestedManyWithoutActorInput = {
    create?: XOR<RoleChangeAuditCreateWithoutActorInput, RoleChangeAuditUncheckedCreateWithoutActorInput> | RoleChangeAuditCreateWithoutActorInput[] | RoleChangeAuditUncheckedCreateWithoutActorInput[]
    connectOrCreate?: RoleChangeAuditCreateOrConnectWithoutActorInput | RoleChangeAuditCreateOrConnectWithoutActorInput[]
    createMany?: RoleChangeAuditCreateManyActorInputEnvelope
    connect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
  }

  export type RoleChangeAuditUncheckedCreateNestedManyWithoutTargetInput = {
    create?: XOR<RoleChangeAuditCreateWithoutTargetInput, RoleChangeAuditUncheckedCreateWithoutTargetInput> | RoleChangeAuditCreateWithoutTargetInput[] | RoleChangeAuditUncheckedCreateWithoutTargetInput[]
    connectOrCreate?: RoleChangeAuditCreateOrConnectWithoutTargetInput | RoleChangeAuditCreateOrConnectWithoutTargetInput[]
    createMany?: RoleChangeAuditCreateManyTargetInputEnvelope
    connect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type CourseUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<CourseCreateWithoutCreatorInput, CourseUncheckedCreateWithoutCreatorInput> | CourseCreateWithoutCreatorInput[] | CourseUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutCreatorInput | CourseCreateOrConnectWithoutCreatorInput[]
    upsert?: CourseUpsertWithWhereUniqueWithoutCreatorInput | CourseUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: CourseCreateManyCreatorInputEnvelope
    set?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    disconnect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    delete?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    update?: CourseUpdateWithWhereUniqueWithoutCreatorInput | CourseUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: CourseUpdateManyWithWhereWithoutCreatorInput | CourseUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: CourseScalarWhereInput | CourseScalarWhereInput[]
  }

  export type CourseEnrollmentUpdateManyWithoutUserNestedInput = {
    create?: XOR<CourseEnrollmentCreateWithoutUserInput, CourseEnrollmentUncheckedCreateWithoutUserInput> | CourseEnrollmentCreateWithoutUserInput[] | CourseEnrollmentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CourseEnrollmentCreateOrConnectWithoutUserInput | CourseEnrollmentCreateOrConnectWithoutUserInput[]
    upsert?: CourseEnrollmentUpsertWithWhereUniqueWithoutUserInput | CourseEnrollmentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CourseEnrollmentCreateManyUserInputEnvelope
    set?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    disconnect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    delete?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    connect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    update?: CourseEnrollmentUpdateWithWhereUniqueWithoutUserInput | CourseEnrollmentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CourseEnrollmentUpdateManyWithWhereWithoutUserInput | CourseEnrollmentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CourseEnrollmentScalarWhereInput | CourseEnrollmentScalarWhereInput[]
  }

  export type CourseFileUpdateManyWithoutUploaderNestedInput = {
    create?: XOR<CourseFileCreateWithoutUploaderInput, CourseFileUncheckedCreateWithoutUploaderInput> | CourseFileCreateWithoutUploaderInput[] | CourseFileUncheckedCreateWithoutUploaderInput[]
    connectOrCreate?: CourseFileCreateOrConnectWithoutUploaderInput | CourseFileCreateOrConnectWithoutUploaderInput[]
    upsert?: CourseFileUpsertWithWhereUniqueWithoutUploaderInput | CourseFileUpsertWithWhereUniqueWithoutUploaderInput[]
    createMany?: CourseFileCreateManyUploaderInputEnvelope
    set?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    disconnect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    delete?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    connect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    update?: CourseFileUpdateWithWhereUniqueWithoutUploaderInput | CourseFileUpdateWithWhereUniqueWithoutUploaderInput[]
    updateMany?: CourseFileUpdateManyWithWhereWithoutUploaderInput | CourseFileUpdateManyWithWhereWithoutUploaderInput[]
    deleteMany?: CourseFileScalarWhereInput | CourseFileScalarWhereInput[]
  }

  export type RoleChangeAuditUpdateManyWithoutActorNestedInput = {
    create?: XOR<RoleChangeAuditCreateWithoutActorInput, RoleChangeAuditUncheckedCreateWithoutActorInput> | RoleChangeAuditCreateWithoutActorInput[] | RoleChangeAuditUncheckedCreateWithoutActorInput[]
    connectOrCreate?: RoleChangeAuditCreateOrConnectWithoutActorInput | RoleChangeAuditCreateOrConnectWithoutActorInput[]
    upsert?: RoleChangeAuditUpsertWithWhereUniqueWithoutActorInput | RoleChangeAuditUpsertWithWhereUniqueWithoutActorInput[]
    createMany?: RoleChangeAuditCreateManyActorInputEnvelope
    set?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    disconnect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    delete?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    connect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    update?: RoleChangeAuditUpdateWithWhereUniqueWithoutActorInput | RoleChangeAuditUpdateWithWhereUniqueWithoutActorInput[]
    updateMany?: RoleChangeAuditUpdateManyWithWhereWithoutActorInput | RoleChangeAuditUpdateManyWithWhereWithoutActorInput[]
    deleteMany?: RoleChangeAuditScalarWhereInput | RoleChangeAuditScalarWhereInput[]
  }

  export type RoleChangeAuditUpdateManyWithoutTargetNestedInput = {
    create?: XOR<RoleChangeAuditCreateWithoutTargetInput, RoleChangeAuditUncheckedCreateWithoutTargetInput> | RoleChangeAuditCreateWithoutTargetInput[] | RoleChangeAuditUncheckedCreateWithoutTargetInput[]
    connectOrCreate?: RoleChangeAuditCreateOrConnectWithoutTargetInput | RoleChangeAuditCreateOrConnectWithoutTargetInput[]
    upsert?: RoleChangeAuditUpsertWithWhereUniqueWithoutTargetInput | RoleChangeAuditUpsertWithWhereUniqueWithoutTargetInput[]
    createMany?: RoleChangeAuditCreateManyTargetInputEnvelope
    set?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    disconnect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    delete?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    connect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    update?: RoleChangeAuditUpdateWithWhereUniqueWithoutTargetInput | RoleChangeAuditUpdateWithWhereUniqueWithoutTargetInput[]
    updateMany?: RoleChangeAuditUpdateManyWithWhereWithoutTargetInput | RoleChangeAuditUpdateManyWithWhereWithoutTargetInput[]
    deleteMany?: RoleChangeAuditScalarWhereInput | RoleChangeAuditScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type CourseUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<CourseCreateWithoutCreatorInput, CourseUncheckedCreateWithoutCreatorInput> | CourseCreateWithoutCreatorInput[] | CourseUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutCreatorInput | CourseCreateOrConnectWithoutCreatorInput[]
    upsert?: CourseUpsertWithWhereUniqueWithoutCreatorInput | CourseUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: CourseCreateManyCreatorInputEnvelope
    set?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    disconnect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    delete?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    update?: CourseUpdateWithWhereUniqueWithoutCreatorInput | CourseUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: CourseUpdateManyWithWhereWithoutCreatorInput | CourseUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: CourseScalarWhereInput | CourseScalarWhereInput[]
  }

  export type CourseEnrollmentUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<CourseEnrollmentCreateWithoutUserInput, CourseEnrollmentUncheckedCreateWithoutUserInput> | CourseEnrollmentCreateWithoutUserInput[] | CourseEnrollmentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CourseEnrollmentCreateOrConnectWithoutUserInput | CourseEnrollmentCreateOrConnectWithoutUserInput[]
    upsert?: CourseEnrollmentUpsertWithWhereUniqueWithoutUserInput | CourseEnrollmentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CourseEnrollmentCreateManyUserInputEnvelope
    set?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    disconnect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    delete?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    connect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    update?: CourseEnrollmentUpdateWithWhereUniqueWithoutUserInput | CourseEnrollmentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CourseEnrollmentUpdateManyWithWhereWithoutUserInput | CourseEnrollmentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CourseEnrollmentScalarWhereInput | CourseEnrollmentScalarWhereInput[]
  }

  export type CourseFileUncheckedUpdateManyWithoutUploaderNestedInput = {
    create?: XOR<CourseFileCreateWithoutUploaderInput, CourseFileUncheckedCreateWithoutUploaderInput> | CourseFileCreateWithoutUploaderInput[] | CourseFileUncheckedCreateWithoutUploaderInput[]
    connectOrCreate?: CourseFileCreateOrConnectWithoutUploaderInput | CourseFileCreateOrConnectWithoutUploaderInput[]
    upsert?: CourseFileUpsertWithWhereUniqueWithoutUploaderInput | CourseFileUpsertWithWhereUniqueWithoutUploaderInput[]
    createMany?: CourseFileCreateManyUploaderInputEnvelope
    set?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    disconnect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    delete?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    connect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    update?: CourseFileUpdateWithWhereUniqueWithoutUploaderInput | CourseFileUpdateWithWhereUniqueWithoutUploaderInput[]
    updateMany?: CourseFileUpdateManyWithWhereWithoutUploaderInput | CourseFileUpdateManyWithWhereWithoutUploaderInput[]
    deleteMany?: CourseFileScalarWhereInput | CourseFileScalarWhereInput[]
  }

  export type RoleChangeAuditUncheckedUpdateManyWithoutActorNestedInput = {
    create?: XOR<RoleChangeAuditCreateWithoutActorInput, RoleChangeAuditUncheckedCreateWithoutActorInput> | RoleChangeAuditCreateWithoutActorInput[] | RoleChangeAuditUncheckedCreateWithoutActorInput[]
    connectOrCreate?: RoleChangeAuditCreateOrConnectWithoutActorInput | RoleChangeAuditCreateOrConnectWithoutActorInput[]
    upsert?: RoleChangeAuditUpsertWithWhereUniqueWithoutActorInput | RoleChangeAuditUpsertWithWhereUniqueWithoutActorInput[]
    createMany?: RoleChangeAuditCreateManyActorInputEnvelope
    set?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    disconnect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    delete?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    connect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    update?: RoleChangeAuditUpdateWithWhereUniqueWithoutActorInput | RoleChangeAuditUpdateWithWhereUniqueWithoutActorInput[]
    updateMany?: RoleChangeAuditUpdateManyWithWhereWithoutActorInput | RoleChangeAuditUpdateManyWithWhereWithoutActorInput[]
    deleteMany?: RoleChangeAuditScalarWhereInput | RoleChangeAuditScalarWhereInput[]
  }

  export type RoleChangeAuditUncheckedUpdateManyWithoutTargetNestedInput = {
    create?: XOR<RoleChangeAuditCreateWithoutTargetInput, RoleChangeAuditUncheckedCreateWithoutTargetInput> | RoleChangeAuditCreateWithoutTargetInput[] | RoleChangeAuditUncheckedCreateWithoutTargetInput[]
    connectOrCreate?: RoleChangeAuditCreateOrConnectWithoutTargetInput | RoleChangeAuditCreateOrConnectWithoutTargetInput[]
    upsert?: RoleChangeAuditUpsertWithWhereUniqueWithoutTargetInput | RoleChangeAuditUpsertWithWhereUniqueWithoutTargetInput[]
    createMany?: RoleChangeAuditCreateManyTargetInputEnvelope
    set?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    disconnect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    delete?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    connect?: RoleChangeAuditWhereUniqueInput | RoleChangeAuditWhereUniqueInput[]
    update?: RoleChangeAuditUpdateWithWhereUniqueWithoutTargetInput | RoleChangeAuditUpdateWithWhereUniqueWithoutTargetInput[]
    updateMany?: RoleChangeAuditUpdateManyWithWhereWithoutTargetInput | RoleChangeAuditUpdateManyWithWhereWithoutTargetInput[]
    deleteMany?: RoleChangeAuditScalarWhereInput | RoleChangeAuditScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutRoleChangesMadeInput = {
    create?: XOR<UserCreateWithoutRoleChangesMadeInput, UserUncheckedCreateWithoutRoleChangesMadeInput>
    connectOrCreate?: UserCreateOrConnectWithoutRoleChangesMadeInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutRoleChangesReceivedInput = {
    create?: XOR<UserCreateWithoutRoleChangesReceivedInput, UserUncheckedCreateWithoutRoleChangesReceivedInput>
    connectOrCreate?: UserCreateOrConnectWithoutRoleChangesReceivedInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutRoleChangesMadeNestedInput = {
    create?: XOR<UserCreateWithoutRoleChangesMadeInput, UserUncheckedCreateWithoutRoleChangesMadeInput>
    connectOrCreate?: UserCreateOrConnectWithoutRoleChangesMadeInput
    upsert?: UserUpsertWithoutRoleChangesMadeInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRoleChangesMadeInput, UserUpdateWithoutRoleChangesMadeInput>, UserUncheckedUpdateWithoutRoleChangesMadeInput>
  }

  export type UserUpdateOneRequiredWithoutRoleChangesReceivedNestedInput = {
    create?: XOR<UserCreateWithoutRoleChangesReceivedInput, UserUncheckedCreateWithoutRoleChangesReceivedInput>
    connectOrCreate?: UserCreateOrConnectWithoutRoleChangesReceivedInput
    upsert?: UserUpsertWithoutRoleChangesReceivedInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRoleChangesReceivedInput, UserUpdateWithoutRoleChangesReceivedInput>, UserUncheckedUpdateWithoutRoleChangesReceivedInput>
  }

  export type StudyPlanCreateNestedManyWithoutCareerInput = {
    create?: XOR<StudyPlanCreateWithoutCareerInput, StudyPlanUncheckedCreateWithoutCareerInput> | StudyPlanCreateWithoutCareerInput[] | StudyPlanUncheckedCreateWithoutCareerInput[]
    connectOrCreate?: StudyPlanCreateOrConnectWithoutCareerInput | StudyPlanCreateOrConnectWithoutCareerInput[]
    createMany?: StudyPlanCreateManyCareerInputEnvelope
    connect?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
  }

  export type StudyPlanUncheckedCreateNestedManyWithoutCareerInput = {
    create?: XOR<StudyPlanCreateWithoutCareerInput, StudyPlanUncheckedCreateWithoutCareerInput> | StudyPlanCreateWithoutCareerInput[] | StudyPlanUncheckedCreateWithoutCareerInput[]
    connectOrCreate?: StudyPlanCreateOrConnectWithoutCareerInput | StudyPlanCreateOrConnectWithoutCareerInput[]
    createMany?: StudyPlanCreateManyCareerInputEnvelope
    connect?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
  }

  export type StudyPlanUpdateManyWithoutCareerNestedInput = {
    create?: XOR<StudyPlanCreateWithoutCareerInput, StudyPlanUncheckedCreateWithoutCareerInput> | StudyPlanCreateWithoutCareerInput[] | StudyPlanUncheckedCreateWithoutCareerInput[]
    connectOrCreate?: StudyPlanCreateOrConnectWithoutCareerInput | StudyPlanCreateOrConnectWithoutCareerInput[]
    upsert?: StudyPlanUpsertWithWhereUniqueWithoutCareerInput | StudyPlanUpsertWithWhereUniqueWithoutCareerInput[]
    createMany?: StudyPlanCreateManyCareerInputEnvelope
    set?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
    disconnect?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
    delete?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
    connect?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
    update?: StudyPlanUpdateWithWhereUniqueWithoutCareerInput | StudyPlanUpdateWithWhereUniqueWithoutCareerInput[]
    updateMany?: StudyPlanUpdateManyWithWhereWithoutCareerInput | StudyPlanUpdateManyWithWhereWithoutCareerInput[]
    deleteMany?: StudyPlanScalarWhereInput | StudyPlanScalarWhereInput[]
  }

  export type StudyPlanUncheckedUpdateManyWithoutCareerNestedInput = {
    create?: XOR<StudyPlanCreateWithoutCareerInput, StudyPlanUncheckedCreateWithoutCareerInput> | StudyPlanCreateWithoutCareerInput[] | StudyPlanUncheckedCreateWithoutCareerInput[]
    connectOrCreate?: StudyPlanCreateOrConnectWithoutCareerInput | StudyPlanCreateOrConnectWithoutCareerInput[]
    upsert?: StudyPlanUpsertWithWhereUniqueWithoutCareerInput | StudyPlanUpsertWithWhereUniqueWithoutCareerInput[]
    createMany?: StudyPlanCreateManyCareerInputEnvelope
    set?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
    disconnect?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
    delete?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
    connect?: StudyPlanWhereUniqueInput | StudyPlanWhereUniqueInput[]
    update?: StudyPlanUpdateWithWhereUniqueWithoutCareerInput | StudyPlanUpdateWithWhereUniqueWithoutCareerInput[]
    updateMany?: StudyPlanUpdateManyWithWhereWithoutCareerInput | StudyPlanUpdateManyWithWhereWithoutCareerInput[]
    deleteMany?: StudyPlanScalarWhereInput | StudyPlanScalarWhereInput[]
  }

  export type CareerCreateNestedOneWithoutStudyPlansInput = {
    create?: XOR<CareerCreateWithoutStudyPlansInput, CareerUncheckedCreateWithoutStudyPlansInput>
    connectOrCreate?: CareerCreateOrConnectWithoutStudyPlansInput
    connect?: CareerWhereUniqueInput
  }

  export type StudyPlanSubjectCreateNestedManyWithoutStudyPlanInput = {
    create?: XOR<StudyPlanSubjectCreateWithoutStudyPlanInput, StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput> | StudyPlanSubjectCreateWithoutStudyPlanInput[] | StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput[]
    connectOrCreate?: StudyPlanSubjectCreateOrConnectWithoutStudyPlanInput | StudyPlanSubjectCreateOrConnectWithoutStudyPlanInput[]
    createMany?: StudyPlanSubjectCreateManyStudyPlanInputEnvelope
    connect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
  }

  export type StudyPlanSubjectUncheckedCreateNestedManyWithoutStudyPlanInput = {
    create?: XOR<StudyPlanSubjectCreateWithoutStudyPlanInput, StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput> | StudyPlanSubjectCreateWithoutStudyPlanInput[] | StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput[]
    connectOrCreate?: StudyPlanSubjectCreateOrConnectWithoutStudyPlanInput | StudyPlanSubjectCreateOrConnectWithoutStudyPlanInput[]
    createMany?: StudyPlanSubjectCreateManyStudyPlanInputEnvelope
    connect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
  }

  export type CareerUpdateOneRequiredWithoutStudyPlansNestedInput = {
    create?: XOR<CareerCreateWithoutStudyPlansInput, CareerUncheckedCreateWithoutStudyPlansInput>
    connectOrCreate?: CareerCreateOrConnectWithoutStudyPlansInput
    upsert?: CareerUpsertWithoutStudyPlansInput
    connect?: CareerWhereUniqueInput
    update?: XOR<XOR<CareerUpdateToOneWithWhereWithoutStudyPlansInput, CareerUpdateWithoutStudyPlansInput>, CareerUncheckedUpdateWithoutStudyPlansInput>
  }

  export type StudyPlanSubjectUpdateManyWithoutStudyPlanNestedInput = {
    create?: XOR<StudyPlanSubjectCreateWithoutStudyPlanInput, StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput> | StudyPlanSubjectCreateWithoutStudyPlanInput[] | StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput[]
    connectOrCreate?: StudyPlanSubjectCreateOrConnectWithoutStudyPlanInput | StudyPlanSubjectCreateOrConnectWithoutStudyPlanInput[]
    upsert?: StudyPlanSubjectUpsertWithWhereUniqueWithoutStudyPlanInput | StudyPlanSubjectUpsertWithWhereUniqueWithoutStudyPlanInput[]
    createMany?: StudyPlanSubjectCreateManyStudyPlanInputEnvelope
    set?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    disconnect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    delete?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    connect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    update?: StudyPlanSubjectUpdateWithWhereUniqueWithoutStudyPlanInput | StudyPlanSubjectUpdateWithWhereUniqueWithoutStudyPlanInput[]
    updateMany?: StudyPlanSubjectUpdateManyWithWhereWithoutStudyPlanInput | StudyPlanSubjectUpdateManyWithWhereWithoutStudyPlanInput[]
    deleteMany?: StudyPlanSubjectScalarWhereInput | StudyPlanSubjectScalarWhereInput[]
  }

  export type StudyPlanSubjectUncheckedUpdateManyWithoutStudyPlanNestedInput = {
    create?: XOR<StudyPlanSubjectCreateWithoutStudyPlanInput, StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput> | StudyPlanSubjectCreateWithoutStudyPlanInput[] | StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput[]
    connectOrCreate?: StudyPlanSubjectCreateOrConnectWithoutStudyPlanInput | StudyPlanSubjectCreateOrConnectWithoutStudyPlanInput[]
    upsert?: StudyPlanSubjectUpsertWithWhereUniqueWithoutStudyPlanInput | StudyPlanSubjectUpsertWithWhereUniqueWithoutStudyPlanInput[]
    createMany?: StudyPlanSubjectCreateManyStudyPlanInputEnvelope
    set?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    disconnect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    delete?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    connect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    update?: StudyPlanSubjectUpdateWithWhereUniqueWithoutStudyPlanInput | StudyPlanSubjectUpdateWithWhereUniqueWithoutStudyPlanInput[]
    updateMany?: StudyPlanSubjectUpdateManyWithWhereWithoutStudyPlanInput | StudyPlanSubjectUpdateManyWithWhereWithoutStudyPlanInput[]
    deleteMany?: StudyPlanSubjectScalarWhereInput | StudyPlanSubjectScalarWhereInput[]
  }

  export type StudyPlanSubjectCreateNestedManyWithoutSubjectInput = {
    create?: XOR<StudyPlanSubjectCreateWithoutSubjectInput, StudyPlanSubjectUncheckedCreateWithoutSubjectInput> | StudyPlanSubjectCreateWithoutSubjectInput[] | StudyPlanSubjectUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: StudyPlanSubjectCreateOrConnectWithoutSubjectInput | StudyPlanSubjectCreateOrConnectWithoutSubjectInput[]
    createMany?: StudyPlanSubjectCreateManySubjectInputEnvelope
    connect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
  }

  export type CourseCreateNestedManyWithoutSubjectInput = {
    create?: XOR<CourseCreateWithoutSubjectInput, CourseUncheckedCreateWithoutSubjectInput> | CourseCreateWithoutSubjectInput[] | CourseUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutSubjectInput | CourseCreateOrConnectWithoutSubjectInput[]
    createMany?: CourseCreateManySubjectInputEnvelope
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
  }

  export type StudyPlanSubjectUncheckedCreateNestedManyWithoutSubjectInput = {
    create?: XOR<StudyPlanSubjectCreateWithoutSubjectInput, StudyPlanSubjectUncheckedCreateWithoutSubjectInput> | StudyPlanSubjectCreateWithoutSubjectInput[] | StudyPlanSubjectUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: StudyPlanSubjectCreateOrConnectWithoutSubjectInput | StudyPlanSubjectCreateOrConnectWithoutSubjectInput[]
    createMany?: StudyPlanSubjectCreateManySubjectInputEnvelope
    connect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
  }

  export type CourseUncheckedCreateNestedManyWithoutSubjectInput = {
    create?: XOR<CourseCreateWithoutSubjectInput, CourseUncheckedCreateWithoutSubjectInput> | CourseCreateWithoutSubjectInput[] | CourseUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutSubjectInput | CourseCreateOrConnectWithoutSubjectInput[]
    createMany?: CourseCreateManySubjectInputEnvelope
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
  }

  export type StudyPlanSubjectUpdateManyWithoutSubjectNestedInput = {
    create?: XOR<StudyPlanSubjectCreateWithoutSubjectInput, StudyPlanSubjectUncheckedCreateWithoutSubjectInput> | StudyPlanSubjectCreateWithoutSubjectInput[] | StudyPlanSubjectUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: StudyPlanSubjectCreateOrConnectWithoutSubjectInput | StudyPlanSubjectCreateOrConnectWithoutSubjectInput[]
    upsert?: StudyPlanSubjectUpsertWithWhereUniqueWithoutSubjectInput | StudyPlanSubjectUpsertWithWhereUniqueWithoutSubjectInput[]
    createMany?: StudyPlanSubjectCreateManySubjectInputEnvelope
    set?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    disconnect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    delete?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    connect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    update?: StudyPlanSubjectUpdateWithWhereUniqueWithoutSubjectInput | StudyPlanSubjectUpdateWithWhereUniqueWithoutSubjectInput[]
    updateMany?: StudyPlanSubjectUpdateManyWithWhereWithoutSubjectInput | StudyPlanSubjectUpdateManyWithWhereWithoutSubjectInput[]
    deleteMany?: StudyPlanSubjectScalarWhereInput | StudyPlanSubjectScalarWhereInput[]
  }

  export type CourseUpdateManyWithoutSubjectNestedInput = {
    create?: XOR<CourseCreateWithoutSubjectInput, CourseUncheckedCreateWithoutSubjectInput> | CourseCreateWithoutSubjectInput[] | CourseUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutSubjectInput | CourseCreateOrConnectWithoutSubjectInput[]
    upsert?: CourseUpsertWithWhereUniqueWithoutSubjectInput | CourseUpsertWithWhereUniqueWithoutSubjectInput[]
    createMany?: CourseCreateManySubjectInputEnvelope
    set?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    disconnect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    delete?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    update?: CourseUpdateWithWhereUniqueWithoutSubjectInput | CourseUpdateWithWhereUniqueWithoutSubjectInput[]
    updateMany?: CourseUpdateManyWithWhereWithoutSubjectInput | CourseUpdateManyWithWhereWithoutSubjectInput[]
    deleteMany?: CourseScalarWhereInput | CourseScalarWhereInput[]
  }

  export type StudyPlanSubjectUncheckedUpdateManyWithoutSubjectNestedInput = {
    create?: XOR<StudyPlanSubjectCreateWithoutSubjectInput, StudyPlanSubjectUncheckedCreateWithoutSubjectInput> | StudyPlanSubjectCreateWithoutSubjectInput[] | StudyPlanSubjectUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: StudyPlanSubjectCreateOrConnectWithoutSubjectInput | StudyPlanSubjectCreateOrConnectWithoutSubjectInput[]
    upsert?: StudyPlanSubjectUpsertWithWhereUniqueWithoutSubjectInput | StudyPlanSubjectUpsertWithWhereUniqueWithoutSubjectInput[]
    createMany?: StudyPlanSubjectCreateManySubjectInputEnvelope
    set?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    disconnect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    delete?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    connect?: StudyPlanSubjectWhereUniqueInput | StudyPlanSubjectWhereUniqueInput[]
    update?: StudyPlanSubjectUpdateWithWhereUniqueWithoutSubjectInput | StudyPlanSubjectUpdateWithWhereUniqueWithoutSubjectInput[]
    updateMany?: StudyPlanSubjectUpdateManyWithWhereWithoutSubjectInput | StudyPlanSubjectUpdateManyWithWhereWithoutSubjectInput[]
    deleteMany?: StudyPlanSubjectScalarWhereInput | StudyPlanSubjectScalarWhereInput[]
  }

  export type CourseUncheckedUpdateManyWithoutSubjectNestedInput = {
    create?: XOR<CourseCreateWithoutSubjectInput, CourseUncheckedCreateWithoutSubjectInput> | CourseCreateWithoutSubjectInput[] | CourseUncheckedCreateWithoutSubjectInput[]
    connectOrCreate?: CourseCreateOrConnectWithoutSubjectInput | CourseCreateOrConnectWithoutSubjectInput[]
    upsert?: CourseUpsertWithWhereUniqueWithoutSubjectInput | CourseUpsertWithWhereUniqueWithoutSubjectInput[]
    createMany?: CourseCreateManySubjectInputEnvelope
    set?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    disconnect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    delete?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    connect?: CourseWhereUniqueInput | CourseWhereUniqueInput[]
    update?: CourseUpdateWithWhereUniqueWithoutSubjectInput | CourseUpdateWithWhereUniqueWithoutSubjectInput[]
    updateMany?: CourseUpdateManyWithWhereWithoutSubjectInput | CourseUpdateManyWithWhereWithoutSubjectInput[]
    deleteMany?: CourseScalarWhereInput | CourseScalarWhereInput[]
  }

  export type StudyPlanCreateNestedOneWithoutSubjectsInput = {
    create?: XOR<StudyPlanCreateWithoutSubjectsInput, StudyPlanUncheckedCreateWithoutSubjectsInput>
    connectOrCreate?: StudyPlanCreateOrConnectWithoutSubjectsInput
    connect?: StudyPlanWhereUniqueInput
  }

  export type SubjectCreateNestedOneWithoutStudyPlansInput = {
    create?: XOR<SubjectCreateWithoutStudyPlansInput, SubjectUncheckedCreateWithoutStudyPlansInput>
    connectOrCreate?: SubjectCreateOrConnectWithoutStudyPlansInput
    connect?: SubjectWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type StudyPlanUpdateOneRequiredWithoutSubjectsNestedInput = {
    create?: XOR<StudyPlanCreateWithoutSubjectsInput, StudyPlanUncheckedCreateWithoutSubjectsInput>
    connectOrCreate?: StudyPlanCreateOrConnectWithoutSubjectsInput
    upsert?: StudyPlanUpsertWithoutSubjectsInput
    connect?: StudyPlanWhereUniqueInput
    update?: XOR<XOR<StudyPlanUpdateToOneWithWhereWithoutSubjectsInput, StudyPlanUpdateWithoutSubjectsInput>, StudyPlanUncheckedUpdateWithoutSubjectsInput>
  }

  export type SubjectUpdateOneRequiredWithoutStudyPlansNestedInput = {
    create?: XOR<SubjectCreateWithoutStudyPlansInput, SubjectUncheckedCreateWithoutStudyPlansInput>
    connectOrCreate?: SubjectCreateOrConnectWithoutStudyPlansInput
    upsert?: SubjectUpsertWithoutStudyPlansInput
    connect?: SubjectWhereUniqueInput
    update?: XOR<XOR<SubjectUpdateToOneWithWhereWithoutStudyPlansInput, SubjectUpdateWithoutStudyPlansInput>, SubjectUncheckedUpdateWithoutStudyPlansInput>
  }

  export type UserCreateNestedOneWithoutCoursesInput = {
    create?: XOR<UserCreateWithoutCoursesInput, UserUncheckedCreateWithoutCoursesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCoursesInput
    connect?: UserWhereUniqueInput
  }

  export type SubjectCreateNestedOneWithoutCoursesInput = {
    create?: XOR<SubjectCreateWithoutCoursesInput, SubjectUncheckedCreateWithoutCoursesInput>
    connectOrCreate?: SubjectCreateOrConnectWithoutCoursesInput
    connect?: SubjectWhereUniqueInput
  }

  export type CourseSectionCreateNestedManyWithoutCourseInput = {
    create?: XOR<CourseSectionCreateWithoutCourseInput, CourseSectionUncheckedCreateWithoutCourseInput> | CourseSectionCreateWithoutCourseInput[] | CourseSectionUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: CourseSectionCreateOrConnectWithoutCourseInput | CourseSectionCreateOrConnectWithoutCourseInput[]
    createMany?: CourseSectionCreateManyCourseInputEnvelope
    connect?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
  }

  export type CourseEnrollmentCreateNestedManyWithoutCourseInput = {
    create?: XOR<CourseEnrollmentCreateWithoutCourseInput, CourseEnrollmentUncheckedCreateWithoutCourseInput> | CourseEnrollmentCreateWithoutCourseInput[] | CourseEnrollmentUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: CourseEnrollmentCreateOrConnectWithoutCourseInput | CourseEnrollmentCreateOrConnectWithoutCourseInput[]
    createMany?: CourseEnrollmentCreateManyCourseInputEnvelope
    connect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
  }

  export type CourseSectionUncheckedCreateNestedManyWithoutCourseInput = {
    create?: XOR<CourseSectionCreateWithoutCourseInput, CourseSectionUncheckedCreateWithoutCourseInput> | CourseSectionCreateWithoutCourseInput[] | CourseSectionUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: CourseSectionCreateOrConnectWithoutCourseInput | CourseSectionCreateOrConnectWithoutCourseInput[]
    createMany?: CourseSectionCreateManyCourseInputEnvelope
    connect?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
  }

  export type CourseEnrollmentUncheckedCreateNestedManyWithoutCourseInput = {
    create?: XOR<CourseEnrollmentCreateWithoutCourseInput, CourseEnrollmentUncheckedCreateWithoutCourseInput> | CourseEnrollmentCreateWithoutCourseInput[] | CourseEnrollmentUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: CourseEnrollmentCreateOrConnectWithoutCourseInput | CourseEnrollmentCreateOrConnectWithoutCourseInput[]
    createMany?: CourseEnrollmentCreateManyCourseInputEnvelope
    connect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
  }

  export type EnumCourseStatusFieldUpdateOperationsInput = {
    set?: $Enums.CourseStatus
  }

  export type UserUpdateOneRequiredWithoutCoursesNestedInput = {
    create?: XOR<UserCreateWithoutCoursesInput, UserUncheckedCreateWithoutCoursesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCoursesInput
    upsert?: UserUpsertWithoutCoursesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCoursesInput, UserUpdateWithoutCoursesInput>, UserUncheckedUpdateWithoutCoursesInput>
  }

  export type SubjectUpdateOneWithoutCoursesNestedInput = {
    create?: XOR<SubjectCreateWithoutCoursesInput, SubjectUncheckedCreateWithoutCoursesInput>
    connectOrCreate?: SubjectCreateOrConnectWithoutCoursesInput
    upsert?: SubjectUpsertWithoutCoursesInput
    disconnect?: SubjectWhereInput | boolean
    delete?: SubjectWhereInput | boolean
    connect?: SubjectWhereUniqueInput
    update?: XOR<XOR<SubjectUpdateToOneWithWhereWithoutCoursesInput, SubjectUpdateWithoutCoursesInput>, SubjectUncheckedUpdateWithoutCoursesInput>
  }

  export type CourseSectionUpdateManyWithoutCourseNestedInput = {
    create?: XOR<CourseSectionCreateWithoutCourseInput, CourseSectionUncheckedCreateWithoutCourseInput> | CourseSectionCreateWithoutCourseInput[] | CourseSectionUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: CourseSectionCreateOrConnectWithoutCourseInput | CourseSectionCreateOrConnectWithoutCourseInput[]
    upsert?: CourseSectionUpsertWithWhereUniqueWithoutCourseInput | CourseSectionUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: CourseSectionCreateManyCourseInputEnvelope
    set?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
    disconnect?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
    delete?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
    connect?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
    update?: CourseSectionUpdateWithWhereUniqueWithoutCourseInput | CourseSectionUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: CourseSectionUpdateManyWithWhereWithoutCourseInput | CourseSectionUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: CourseSectionScalarWhereInput | CourseSectionScalarWhereInput[]
  }

  export type CourseEnrollmentUpdateManyWithoutCourseNestedInput = {
    create?: XOR<CourseEnrollmentCreateWithoutCourseInput, CourseEnrollmentUncheckedCreateWithoutCourseInput> | CourseEnrollmentCreateWithoutCourseInput[] | CourseEnrollmentUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: CourseEnrollmentCreateOrConnectWithoutCourseInput | CourseEnrollmentCreateOrConnectWithoutCourseInput[]
    upsert?: CourseEnrollmentUpsertWithWhereUniqueWithoutCourseInput | CourseEnrollmentUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: CourseEnrollmentCreateManyCourseInputEnvelope
    set?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    disconnect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    delete?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    connect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    update?: CourseEnrollmentUpdateWithWhereUniqueWithoutCourseInput | CourseEnrollmentUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: CourseEnrollmentUpdateManyWithWhereWithoutCourseInput | CourseEnrollmentUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: CourseEnrollmentScalarWhereInput | CourseEnrollmentScalarWhereInput[]
  }

  export type CourseSectionUncheckedUpdateManyWithoutCourseNestedInput = {
    create?: XOR<CourseSectionCreateWithoutCourseInput, CourseSectionUncheckedCreateWithoutCourseInput> | CourseSectionCreateWithoutCourseInput[] | CourseSectionUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: CourseSectionCreateOrConnectWithoutCourseInput | CourseSectionCreateOrConnectWithoutCourseInput[]
    upsert?: CourseSectionUpsertWithWhereUniqueWithoutCourseInput | CourseSectionUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: CourseSectionCreateManyCourseInputEnvelope
    set?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
    disconnect?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
    delete?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
    connect?: CourseSectionWhereUniqueInput | CourseSectionWhereUniqueInput[]
    update?: CourseSectionUpdateWithWhereUniqueWithoutCourseInput | CourseSectionUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: CourseSectionUpdateManyWithWhereWithoutCourseInput | CourseSectionUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: CourseSectionScalarWhereInput | CourseSectionScalarWhereInput[]
  }

  export type CourseEnrollmentUncheckedUpdateManyWithoutCourseNestedInput = {
    create?: XOR<CourseEnrollmentCreateWithoutCourseInput, CourseEnrollmentUncheckedCreateWithoutCourseInput> | CourseEnrollmentCreateWithoutCourseInput[] | CourseEnrollmentUncheckedCreateWithoutCourseInput[]
    connectOrCreate?: CourseEnrollmentCreateOrConnectWithoutCourseInput | CourseEnrollmentCreateOrConnectWithoutCourseInput[]
    upsert?: CourseEnrollmentUpsertWithWhereUniqueWithoutCourseInput | CourseEnrollmentUpsertWithWhereUniqueWithoutCourseInput[]
    createMany?: CourseEnrollmentCreateManyCourseInputEnvelope
    set?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    disconnect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    delete?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    connect?: CourseEnrollmentWhereUniqueInput | CourseEnrollmentWhereUniqueInput[]
    update?: CourseEnrollmentUpdateWithWhereUniqueWithoutCourseInput | CourseEnrollmentUpdateWithWhereUniqueWithoutCourseInput[]
    updateMany?: CourseEnrollmentUpdateManyWithWhereWithoutCourseInput | CourseEnrollmentUpdateManyWithWhereWithoutCourseInput[]
    deleteMany?: CourseEnrollmentScalarWhereInput | CourseEnrollmentScalarWhereInput[]
  }

  export type CourseCreateNestedOneWithoutSectionsInput = {
    create?: XOR<CourseCreateWithoutSectionsInput, CourseUncheckedCreateWithoutSectionsInput>
    connectOrCreate?: CourseCreateOrConnectWithoutSectionsInput
    connect?: CourseWhereUniqueInput
  }

  export type CourseLessonCreateNestedManyWithoutSectionInput = {
    create?: XOR<CourseLessonCreateWithoutSectionInput, CourseLessonUncheckedCreateWithoutSectionInput> | CourseLessonCreateWithoutSectionInput[] | CourseLessonUncheckedCreateWithoutSectionInput[]
    connectOrCreate?: CourseLessonCreateOrConnectWithoutSectionInput | CourseLessonCreateOrConnectWithoutSectionInput[]
    createMany?: CourseLessonCreateManySectionInputEnvelope
    connect?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
  }

  export type CourseLessonUncheckedCreateNestedManyWithoutSectionInput = {
    create?: XOR<CourseLessonCreateWithoutSectionInput, CourseLessonUncheckedCreateWithoutSectionInput> | CourseLessonCreateWithoutSectionInput[] | CourseLessonUncheckedCreateWithoutSectionInput[]
    connectOrCreate?: CourseLessonCreateOrConnectWithoutSectionInput | CourseLessonCreateOrConnectWithoutSectionInput[]
    createMany?: CourseLessonCreateManySectionInputEnvelope
    connect?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
  }

  export type CourseUpdateOneRequiredWithoutSectionsNestedInput = {
    create?: XOR<CourseCreateWithoutSectionsInput, CourseUncheckedCreateWithoutSectionsInput>
    connectOrCreate?: CourseCreateOrConnectWithoutSectionsInput
    upsert?: CourseUpsertWithoutSectionsInput
    connect?: CourseWhereUniqueInput
    update?: XOR<XOR<CourseUpdateToOneWithWhereWithoutSectionsInput, CourseUpdateWithoutSectionsInput>, CourseUncheckedUpdateWithoutSectionsInput>
  }

  export type CourseLessonUpdateManyWithoutSectionNestedInput = {
    create?: XOR<CourseLessonCreateWithoutSectionInput, CourseLessonUncheckedCreateWithoutSectionInput> | CourseLessonCreateWithoutSectionInput[] | CourseLessonUncheckedCreateWithoutSectionInput[]
    connectOrCreate?: CourseLessonCreateOrConnectWithoutSectionInput | CourseLessonCreateOrConnectWithoutSectionInput[]
    upsert?: CourseLessonUpsertWithWhereUniqueWithoutSectionInput | CourseLessonUpsertWithWhereUniqueWithoutSectionInput[]
    createMany?: CourseLessonCreateManySectionInputEnvelope
    set?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
    disconnect?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
    delete?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
    connect?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
    update?: CourseLessonUpdateWithWhereUniqueWithoutSectionInput | CourseLessonUpdateWithWhereUniqueWithoutSectionInput[]
    updateMany?: CourseLessonUpdateManyWithWhereWithoutSectionInput | CourseLessonUpdateManyWithWhereWithoutSectionInput[]
    deleteMany?: CourseLessonScalarWhereInput | CourseLessonScalarWhereInput[]
  }

  export type CourseLessonUncheckedUpdateManyWithoutSectionNestedInput = {
    create?: XOR<CourseLessonCreateWithoutSectionInput, CourseLessonUncheckedCreateWithoutSectionInput> | CourseLessonCreateWithoutSectionInput[] | CourseLessonUncheckedCreateWithoutSectionInput[]
    connectOrCreate?: CourseLessonCreateOrConnectWithoutSectionInput | CourseLessonCreateOrConnectWithoutSectionInput[]
    upsert?: CourseLessonUpsertWithWhereUniqueWithoutSectionInput | CourseLessonUpsertWithWhereUniqueWithoutSectionInput[]
    createMany?: CourseLessonCreateManySectionInputEnvelope
    set?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
    disconnect?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
    delete?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
    connect?: CourseLessonWhereUniqueInput | CourseLessonWhereUniqueInput[]
    update?: CourseLessonUpdateWithWhereUniqueWithoutSectionInput | CourseLessonUpdateWithWhereUniqueWithoutSectionInput[]
    updateMany?: CourseLessonUpdateManyWithWhereWithoutSectionInput | CourseLessonUpdateManyWithWhereWithoutSectionInput[]
    deleteMany?: CourseLessonScalarWhereInput | CourseLessonScalarWhereInput[]
  }

  export type CourseSectionCreateNestedOneWithoutLessonsInput = {
    create?: XOR<CourseSectionCreateWithoutLessonsInput, CourseSectionUncheckedCreateWithoutLessonsInput>
    connectOrCreate?: CourseSectionCreateOrConnectWithoutLessonsInput
    connect?: CourseSectionWhereUniqueInput
  }

  export type CourseFileCreateNestedManyWithoutLessonInput = {
    create?: XOR<CourseFileCreateWithoutLessonInput, CourseFileUncheckedCreateWithoutLessonInput> | CourseFileCreateWithoutLessonInput[] | CourseFileUncheckedCreateWithoutLessonInput[]
    connectOrCreate?: CourseFileCreateOrConnectWithoutLessonInput | CourseFileCreateOrConnectWithoutLessonInput[]
    createMany?: CourseFileCreateManyLessonInputEnvelope
    connect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
  }

  export type CourseFileUncheckedCreateNestedManyWithoutLessonInput = {
    create?: XOR<CourseFileCreateWithoutLessonInput, CourseFileUncheckedCreateWithoutLessonInput> | CourseFileCreateWithoutLessonInput[] | CourseFileUncheckedCreateWithoutLessonInput[]
    connectOrCreate?: CourseFileCreateOrConnectWithoutLessonInput | CourseFileCreateOrConnectWithoutLessonInput[]
    createMany?: CourseFileCreateManyLessonInputEnvelope
    connect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
  }

  export type CourseSectionUpdateOneRequiredWithoutLessonsNestedInput = {
    create?: XOR<CourseSectionCreateWithoutLessonsInput, CourseSectionUncheckedCreateWithoutLessonsInput>
    connectOrCreate?: CourseSectionCreateOrConnectWithoutLessonsInput
    upsert?: CourseSectionUpsertWithoutLessonsInput
    connect?: CourseSectionWhereUniqueInput
    update?: XOR<XOR<CourseSectionUpdateToOneWithWhereWithoutLessonsInput, CourseSectionUpdateWithoutLessonsInput>, CourseSectionUncheckedUpdateWithoutLessonsInput>
  }

  export type CourseFileUpdateManyWithoutLessonNestedInput = {
    create?: XOR<CourseFileCreateWithoutLessonInput, CourseFileUncheckedCreateWithoutLessonInput> | CourseFileCreateWithoutLessonInput[] | CourseFileUncheckedCreateWithoutLessonInput[]
    connectOrCreate?: CourseFileCreateOrConnectWithoutLessonInput | CourseFileCreateOrConnectWithoutLessonInput[]
    upsert?: CourseFileUpsertWithWhereUniqueWithoutLessonInput | CourseFileUpsertWithWhereUniqueWithoutLessonInput[]
    createMany?: CourseFileCreateManyLessonInputEnvelope
    set?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    disconnect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    delete?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    connect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    update?: CourseFileUpdateWithWhereUniqueWithoutLessonInput | CourseFileUpdateWithWhereUniqueWithoutLessonInput[]
    updateMany?: CourseFileUpdateManyWithWhereWithoutLessonInput | CourseFileUpdateManyWithWhereWithoutLessonInput[]
    deleteMany?: CourseFileScalarWhereInput | CourseFileScalarWhereInput[]
  }

  export type CourseFileUncheckedUpdateManyWithoutLessonNestedInput = {
    create?: XOR<CourseFileCreateWithoutLessonInput, CourseFileUncheckedCreateWithoutLessonInput> | CourseFileCreateWithoutLessonInput[] | CourseFileUncheckedCreateWithoutLessonInput[]
    connectOrCreate?: CourseFileCreateOrConnectWithoutLessonInput | CourseFileCreateOrConnectWithoutLessonInput[]
    upsert?: CourseFileUpsertWithWhereUniqueWithoutLessonInput | CourseFileUpsertWithWhereUniqueWithoutLessonInput[]
    createMany?: CourseFileCreateManyLessonInputEnvelope
    set?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    disconnect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    delete?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    connect?: CourseFileWhereUniqueInput | CourseFileWhereUniqueInput[]
    update?: CourseFileUpdateWithWhereUniqueWithoutLessonInput | CourseFileUpdateWithWhereUniqueWithoutLessonInput[]
    updateMany?: CourseFileUpdateManyWithWhereWithoutLessonInput | CourseFileUpdateManyWithWhereWithoutLessonInput[]
    deleteMany?: CourseFileScalarWhereInput | CourseFileScalarWhereInput[]
  }

  export type CourseCreateNestedOneWithoutEnrollmentsInput = {
    create?: XOR<CourseCreateWithoutEnrollmentsInput, CourseUncheckedCreateWithoutEnrollmentsInput>
    connectOrCreate?: CourseCreateOrConnectWithoutEnrollmentsInput
    connect?: CourseWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutEnrollmentsInput = {
    create?: XOR<UserCreateWithoutEnrollmentsInput, UserUncheckedCreateWithoutEnrollmentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEnrollmentsInput
    connect?: UserWhereUniqueInput
  }

  export type CourseUpdateOneRequiredWithoutEnrollmentsNestedInput = {
    create?: XOR<CourseCreateWithoutEnrollmentsInput, CourseUncheckedCreateWithoutEnrollmentsInput>
    connectOrCreate?: CourseCreateOrConnectWithoutEnrollmentsInput
    upsert?: CourseUpsertWithoutEnrollmentsInput
    connect?: CourseWhereUniqueInput
    update?: XOR<XOR<CourseUpdateToOneWithWhereWithoutEnrollmentsInput, CourseUpdateWithoutEnrollmentsInput>, CourseUncheckedUpdateWithoutEnrollmentsInput>
  }

  export type UserUpdateOneRequiredWithoutEnrollmentsNestedInput = {
    create?: XOR<UserCreateWithoutEnrollmentsInput, UserUncheckedCreateWithoutEnrollmentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEnrollmentsInput
    upsert?: UserUpsertWithoutEnrollmentsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutEnrollmentsInput, UserUpdateWithoutEnrollmentsInput>, UserUncheckedUpdateWithoutEnrollmentsInput>
  }

  export type CourseLessonCreateNestedOneWithoutFilesInput = {
    create?: XOR<CourseLessonCreateWithoutFilesInput, CourseLessonUncheckedCreateWithoutFilesInput>
    connectOrCreate?: CourseLessonCreateOrConnectWithoutFilesInput
    connect?: CourseLessonWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutCourseFilesInput = {
    create?: XOR<UserCreateWithoutCourseFilesInput, UserUncheckedCreateWithoutCourseFilesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCourseFilesInput
    connect?: UserWhereUniqueInput
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type EnumCourseFileStateFieldUpdateOperationsInput = {
    set?: $Enums.CourseFileState
  }

  export type EnumCourseFileOriginFieldUpdateOperationsInput = {
    set?: $Enums.CourseFileOrigin
  }

  export type CourseLessonUpdateOneRequiredWithoutFilesNestedInput = {
    create?: XOR<CourseLessonCreateWithoutFilesInput, CourseLessonUncheckedCreateWithoutFilesInput>
    connectOrCreate?: CourseLessonCreateOrConnectWithoutFilesInput
    upsert?: CourseLessonUpsertWithoutFilesInput
    connect?: CourseLessonWhereUniqueInput
    update?: XOR<XOR<CourseLessonUpdateToOneWithWhereWithoutFilesInput, CourseLessonUpdateWithoutFilesInput>, CourseLessonUncheckedUpdateWithoutFilesInput>
  }

  export type UserUpdateOneRequiredWithoutCourseFilesNestedInput = {
    create?: XOR<UserCreateWithoutCourseFilesInput, UserUncheckedCreateWithoutCourseFilesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCourseFilesInput
    upsert?: UserUpsertWithoutCourseFilesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCourseFilesInput, UserUpdateWithoutCourseFilesInput>, UserUncheckedUpdateWithoutCourseFilesInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumCourseStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseStatus | EnumCourseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CourseStatus[] | ListEnumCourseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseStatus[] | ListEnumCourseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseStatusFilter<$PrismaModel> | $Enums.CourseStatus
  }

  export type NestedUuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumCourseStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseStatus | EnumCourseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CourseStatus[] | ListEnumCourseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseStatus[] | ListEnumCourseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseStatusWithAggregatesFilter<$PrismaModel> | $Enums.CourseStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCourseStatusFilter<$PrismaModel>
    _max?: NestedEnumCourseStatusFilter<$PrismaModel>
  }

  export type NestedUuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedEnumCourseFileStateFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseFileState | EnumCourseFileStateFieldRefInput<$PrismaModel>
    in?: $Enums.CourseFileState[] | ListEnumCourseFileStateFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseFileState[] | ListEnumCourseFileStateFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseFileStateFilter<$PrismaModel> | $Enums.CourseFileState
  }

  export type NestedEnumCourseFileOriginFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseFileOrigin | EnumCourseFileOriginFieldRefInput<$PrismaModel>
    in?: $Enums.CourseFileOrigin[] | ListEnumCourseFileOriginFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseFileOrigin[] | ListEnumCourseFileOriginFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseFileOriginFilter<$PrismaModel> | $Enums.CourseFileOrigin
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedEnumCourseFileStateWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseFileState | EnumCourseFileStateFieldRefInput<$PrismaModel>
    in?: $Enums.CourseFileState[] | ListEnumCourseFileStateFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseFileState[] | ListEnumCourseFileStateFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseFileStateWithAggregatesFilter<$PrismaModel> | $Enums.CourseFileState
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCourseFileStateFilter<$PrismaModel>
    _max?: NestedEnumCourseFileStateFilter<$PrismaModel>
  }

  export type NestedEnumCourseFileOriginWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CourseFileOrigin | EnumCourseFileOriginFieldRefInput<$PrismaModel>
    in?: $Enums.CourseFileOrigin[] | ListEnumCourseFileOriginFieldRefInput<$PrismaModel>
    notIn?: $Enums.CourseFileOrigin[] | ListEnumCourseFileOriginFieldRefInput<$PrismaModel>
    not?: NestedEnumCourseFileOriginWithAggregatesFilter<$PrismaModel> | $Enums.CourseFileOrigin
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCourseFileOriginFilter<$PrismaModel>
    _max?: NestedEnumCourseFileOriginFilter<$PrismaModel>
  }

  export type CourseCreateWithoutCreatorInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    subject?: SubjectCreateNestedOneWithoutCoursesInput
    sections?: CourseSectionCreateNestedManyWithoutCourseInput
    enrollments?: CourseEnrollmentCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateWithoutCreatorInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    subjectId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sections?: CourseSectionUncheckedCreateNestedManyWithoutCourseInput
    enrollments?: CourseEnrollmentUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseCreateOrConnectWithoutCreatorInput = {
    where: CourseWhereUniqueInput
    create: XOR<CourseCreateWithoutCreatorInput, CourseUncheckedCreateWithoutCreatorInput>
  }

  export type CourseCreateManyCreatorInputEnvelope = {
    data: CourseCreateManyCreatorInput | CourseCreateManyCreatorInput[]
    skipDuplicates?: boolean
  }

  export type CourseEnrollmentCreateWithoutUserInput = {
    id?: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    course: CourseCreateNestedOneWithoutEnrollmentsInput
  }

  export type CourseEnrollmentUncheckedCreateWithoutUserInput = {
    id?: string
    courseId: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseEnrollmentCreateOrConnectWithoutUserInput = {
    where: CourseEnrollmentWhereUniqueInput
    create: XOR<CourseEnrollmentCreateWithoutUserInput, CourseEnrollmentUncheckedCreateWithoutUserInput>
  }

  export type CourseEnrollmentCreateManyUserInputEnvelope = {
    data: CourseEnrollmentCreateManyUserInput | CourseEnrollmentCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type CourseFileCreateWithoutUploaderInput = {
    id?: string
    driveFileId?: string | null
    operationId?: string
    originalName: string
    mimeType: string
    size: bigint | number
    allowDownload?: boolean
    state?: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode?: string | null
    attempts?: number
    retryAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lesson: CourseLessonCreateNestedOneWithoutFilesInput
  }

  export type CourseFileUncheckedCreateWithoutUploaderInput = {
    id?: string
    lessonId: string
    driveFileId?: string | null
    operationId?: string
    originalName: string
    mimeType: string
    size: bigint | number
    allowDownload?: boolean
    state?: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode?: string | null
    attempts?: number
    retryAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseFileCreateOrConnectWithoutUploaderInput = {
    where: CourseFileWhereUniqueInput
    create: XOR<CourseFileCreateWithoutUploaderInput, CourseFileUncheckedCreateWithoutUploaderInput>
  }

  export type CourseFileCreateManyUploaderInputEnvelope = {
    data: CourseFileCreateManyUploaderInput | CourseFileCreateManyUploaderInput[]
    skipDuplicates?: boolean
  }

  export type RoleChangeAuditCreateWithoutActorInput = {
    id?: string
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt?: Date | string
    target: UserCreateNestedOneWithoutRoleChangesReceivedInput
  }

  export type RoleChangeAuditUncheckedCreateWithoutActorInput = {
    id?: string
    targetId: number
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt?: Date | string
  }

  export type RoleChangeAuditCreateOrConnectWithoutActorInput = {
    where: RoleChangeAuditWhereUniqueInput
    create: XOR<RoleChangeAuditCreateWithoutActorInput, RoleChangeAuditUncheckedCreateWithoutActorInput>
  }

  export type RoleChangeAuditCreateManyActorInputEnvelope = {
    data: RoleChangeAuditCreateManyActorInput | RoleChangeAuditCreateManyActorInput[]
    skipDuplicates?: boolean
  }

  export type RoleChangeAuditCreateWithoutTargetInput = {
    id?: string
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt?: Date | string
    actor: UserCreateNestedOneWithoutRoleChangesMadeInput
  }

  export type RoleChangeAuditUncheckedCreateWithoutTargetInput = {
    id?: string
    actorId: number
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt?: Date | string
  }

  export type RoleChangeAuditCreateOrConnectWithoutTargetInput = {
    where: RoleChangeAuditWhereUniqueInput
    create: XOR<RoleChangeAuditCreateWithoutTargetInput, RoleChangeAuditUncheckedCreateWithoutTargetInput>
  }

  export type RoleChangeAuditCreateManyTargetInputEnvelope = {
    data: RoleChangeAuditCreateManyTargetInput | RoleChangeAuditCreateManyTargetInput[]
    skipDuplicates?: boolean
  }

  export type CourseUpsertWithWhereUniqueWithoutCreatorInput = {
    where: CourseWhereUniqueInput
    update: XOR<CourseUpdateWithoutCreatorInput, CourseUncheckedUpdateWithoutCreatorInput>
    create: XOR<CourseCreateWithoutCreatorInput, CourseUncheckedCreateWithoutCreatorInput>
  }

  export type CourseUpdateWithWhereUniqueWithoutCreatorInput = {
    where: CourseWhereUniqueInput
    data: XOR<CourseUpdateWithoutCreatorInput, CourseUncheckedUpdateWithoutCreatorInput>
  }

  export type CourseUpdateManyWithWhereWithoutCreatorInput = {
    where: CourseScalarWhereInput
    data: XOR<CourseUpdateManyMutationInput, CourseUncheckedUpdateManyWithoutCreatorInput>
  }

  export type CourseScalarWhereInput = {
    AND?: CourseScalarWhereInput | CourseScalarWhereInput[]
    OR?: CourseScalarWhereInput[]
    NOT?: CourseScalarWhereInput | CourseScalarWhereInput[]
    id?: UuidFilter<"Course"> | string
    title?: StringFilter<"Course"> | string
    description?: StringFilter<"Course"> | string
    status?: EnumCourseStatusFilter<"Course"> | $Enums.CourseStatus
    creatorId?: IntFilter<"Course"> | number
    subjectId?: UuidNullableFilter<"Course"> | string | null
    createdAt?: DateTimeFilter<"Course"> | Date | string
    updatedAt?: DateTimeFilter<"Course"> | Date | string
  }

  export type CourseEnrollmentUpsertWithWhereUniqueWithoutUserInput = {
    where: CourseEnrollmentWhereUniqueInput
    update: XOR<CourseEnrollmentUpdateWithoutUserInput, CourseEnrollmentUncheckedUpdateWithoutUserInput>
    create: XOR<CourseEnrollmentCreateWithoutUserInput, CourseEnrollmentUncheckedCreateWithoutUserInput>
  }

  export type CourseEnrollmentUpdateWithWhereUniqueWithoutUserInput = {
    where: CourseEnrollmentWhereUniqueInput
    data: XOR<CourseEnrollmentUpdateWithoutUserInput, CourseEnrollmentUncheckedUpdateWithoutUserInput>
  }

  export type CourseEnrollmentUpdateManyWithWhereWithoutUserInput = {
    where: CourseEnrollmentScalarWhereInput
    data: XOR<CourseEnrollmentUpdateManyMutationInput, CourseEnrollmentUncheckedUpdateManyWithoutUserInput>
  }

  export type CourseEnrollmentScalarWhereInput = {
    AND?: CourseEnrollmentScalarWhereInput | CourseEnrollmentScalarWhereInput[]
    OR?: CourseEnrollmentScalarWhereInput[]
    NOT?: CourseEnrollmentScalarWhereInput | CourseEnrollmentScalarWhereInput[]
    id?: UuidFilter<"CourseEnrollment"> | string
    courseId?: UuidFilter<"CourseEnrollment"> | string
    userId?: IntFilter<"CourseEnrollment"> | number
    active?: BoolFilter<"CourseEnrollment"> | boolean
    createdAt?: DateTimeFilter<"CourseEnrollment"> | Date | string
    updatedAt?: DateTimeFilter<"CourseEnrollment"> | Date | string
  }

  export type CourseFileUpsertWithWhereUniqueWithoutUploaderInput = {
    where: CourseFileWhereUniqueInput
    update: XOR<CourseFileUpdateWithoutUploaderInput, CourseFileUncheckedUpdateWithoutUploaderInput>
    create: XOR<CourseFileCreateWithoutUploaderInput, CourseFileUncheckedCreateWithoutUploaderInput>
  }

  export type CourseFileUpdateWithWhereUniqueWithoutUploaderInput = {
    where: CourseFileWhereUniqueInput
    data: XOR<CourseFileUpdateWithoutUploaderInput, CourseFileUncheckedUpdateWithoutUploaderInput>
  }

  export type CourseFileUpdateManyWithWhereWithoutUploaderInput = {
    where: CourseFileScalarWhereInput
    data: XOR<CourseFileUpdateManyMutationInput, CourseFileUncheckedUpdateManyWithoutUploaderInput>
  }

  export type CourseFileScalarWhereInput = {
    AND?: CourseFileScalarWhereInput | CourseFileScalarWhereInput[]
    OR?: CourseFileScalarWhereInput[]
    NOT?: CourseFileScalarWhereInput | CourseFileScalarWhereInput[]
    id?: UuidFilter<"CourseFile"> | string
    lessonId?: UuidFilter<"CourseFile"> | string
    uploaderId?: IntFilter<"CourseFile"> | number
    driveFileId?: StringNullableFilter<"CourseFile"> | string | null
    operationId?: UuidFilter<"CourseFile"> | string
    originalName?: StringFilter<"CourseFile"> | string
    mimeType?: StringFilter<"CourseFile"> | string
    size?: BigIntFilter<"CourseFile"> | bigint | number
    allowDownload?: BoolFilter<"CourseFile"> | boolean
    state?: EnumCourseFileStateFilter<"CourseFile"> | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFilter<"CourseFile"> | $Enums.CourseFileOrigin
    lastErrorCode?: StringNullableFilter<"CourseFile"> | string | null
    attempts?: IntFilter<"CourseFile"> | number
    retryAt?: DateTimeFilter<"CourseFile"> | Date | string
    createdAt?: DateTimeFilter<"CourseFile"> | Date | string
    updatedAt?: DateTimeFilter<"CourseFile"> | Date | string
  }

  export type RoleChangeAuditUpsertWithWhereUniqueWithoutActorInput = {
    where: RoleChangeAuditWhereUniqueInput
    update: XOR<RoleChangeAuditUpdateWithoutActorInput, RoleChangeAuditUncheckedUpdateWithoutActorInput>
    create: XOR<RoleChangeAuditCreateWithoutActorInput, RoleChangeAuditUncheckedCreateWithoutActorInput>
  }

  export type RoleChangeAuditUpdateWithWhereUniqueWithoutActorInput = {
    where: RoleChangeAuditWhereUniqueInput
    data: XOR<RoleChangeAuditUpdateWithoutActorInput, RoleChangeAuditUncheckedUpdateWithoutActorInput>
  }

  export type RoleChangeAuditUpdateManyWithWhereWithoutActorInput = {
    where: RoleChangeAuditScalarWhereInput
    data: XOR<RoleChangeAuditUpdateManyMutationInput, RoleChangeAuditUncheckedUpdateManyWithoutActorInput>
  }

  export type RoleChangeAuditScalarWhereInput = {
    AND?: RoleChangeAuditScalarWhereInput | RoleChangeAuditScalarWhereInput[]
    OR?: RoleChangeAuditScalarWhereInput[]
    NOT?: RoleChangeAuditScalarWhereInput | RoleChangeAuditScalarWhereInput[]
    id?: UuidFilter<"RoleChangeAudit"> | string
    actorId?: IntFilter<"RoleChangeAudit"> | number
    targetId?: IntFilter<"RoleChangeAudit"> | number
    oldRole?: EnumRoleFilter<"RoleChangeAudit"> | $Enums.Role
    newRole?: EnumRoleFilter<"RoleChangeAudit"> | $Enums.Role
    reason?: StringFilter<"RoleChangeAudit"> | string
    createdAt?: DateTimeFilter<"RoleChangeAudit"> | Date | string
  }

  export type RoleChangeAuditUpsertWithWhereUniqueWithoutTargetInput = {
    where: RoleChangeAuditWhereUniqueInput
    update: XOR<RoleChangeAuditUpdateWithoutTargetInput, RoleChangeAuditUncheckedUpdateWithoutTargetInput>
    create: XOR<RoleChangeAuditCreateWithoutTargetInput, RoleChangeAuditUncheckedCreateWithoutTargetInput>
  }

  export type RoleChangeAuditUpdateWithWhereUniqueWithoutTargetInput = {
    where: RoleChangeAuditWhereUniqueInput
    data: XOR<RoleChangeAuditUpdateWithoutTargetInput, RoleChangeAuditUncheckedUpdateWithoutTargetInput>
  }

  export type RoleChangeAuditUpdateManyWithWhereWithoutTargetInput = {
    where: RoleChangeAuditScalarWhereInput
    data: XOR<RoleChangeAuditUpdateManyMutationInput, RoleChangeAuditUncheckedUpdateManyWithoutTargetInput>
  }

  export type UserCreateWithoutRoleChangesMadeInput = {
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseCreateNestedManyWithoutCreatorInput
    enrollments?: CourseEnrollmentCreateNestedManyWithoutUserInput
    courseFiles?: CourseFileCreateNestedManyWithoutUploaderInput
    roleChangesReceived?: RoleChangeAuditCreateNestedManyWithoutTargetInput
  }

  export type UserUncheckedCreateWithoutRoleChangesMadeInput = {
    id?: number
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseUncheckedCreateNestedManyWithoutCreatorInput
    enrollments?: CourseEnrollmentUncheckedCreateNestedManyWithoutUserInput
    courseFiles?: CourseFileUncheckedCreateNestedManyWithoutUploaderInput
    roleChangesReceived?: RoleChangeAuditUncheckedCreateNestedManyWithoutTargetInput
  }

  export type UserCreateOrConnectWithoutRoleChangesMadeInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRoleChangesMadeInput, UserUncheckedCreateWithoutRoleChangesMadeInput>
  }

  export type UserCreateWithoutRoleChangesReceivedInput = {
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseCreateNestedManyWithoutCreatorInput
    enrollments?: CourseEnrollmentCreateNestedManyWithoutUserInput
    courseFiles?: CourseFileCreateNestedManyWithoutUploaderInput
    roleChangesMade?: RoleChangeAuditCreateNestedManyWithoutActorInput
  }

  export type UserUncheckedCreateWithoutRoleChangesReceivedInput = {
    id?: number
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseUncheckedCreateNestedManyWithoutCreatorInput
    enrollments?: CourseEnrollmentUncheckedCreateNestedManyWithoutUserInput
    courseFiles?: CourseFileUncheckedCreateNestedManyWithoutUploaderInput
    roleChangesMade?: RoleChangeAuditUncheckedCreateNestedManyWithoutActorInput
  }

  export type UserCreateOrConnectWithoutRoleChangesReceivedInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRoleChangesReceivedInput, UserUncheckedCreateWithoutRoleChangesReceivedInput>
  }

  export type UserUpsertWithoutRoleChangesMadeInput = {
    update: XOR<UserUpdateWithoutRoleChangesMadeInput, UserUncheckedUpdateWithoutRoleChangesMadeInput>
    create: XOR<UserCreateWithoutRoleChangesMadeInput, UserUncheckedCreateWithoutRoleChangesMadeInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRoleChangesMadeInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRoleChangesMadeInput, UserUncheckedUpdateWithoutRoleChangesMadeInput>
  }

  export type UserUpdateWithoutRoleChangesMadeInput = {
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUpdateManyWithoutCreatorNestedInput
    enrollments?: CourseEnrollmentUpdateManyWithoutUserNestedInput
    courseFiles?: CourseFileUpdateManyWithoutUploaderNestedInput
    roleChangesReceived?: RoleChangeAuditUpdateManyWithoutTargetNestedInput
  }

  export type UserUncheckedUpdateWithoutRoleChangesMadeInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUncheckedUpdateManyWithoutCreatorNestedInput
    enrollments?: CourseEnrollmentUncheckedUpdateManyWithoutUserNestedInput
    courseFiles?: CourseFileUncheckedUpdateManyWithoutUploaderNestedInput
    roleChangesReceived?: RoleChangeAuditUncheckedUpdateManyWithoutTargetNestedInput
  }

  export type UserUpsertWithoutRoleChangesReceivedInput = {
    update: XOR<UserUpdateWithoutRoleChangesReceivedInput, UserUncheckedUpdateWithoutRoleChangesReceivedInput>
    create: XOR<UserCreateWithoutRoleChangesReceivedInput, UserUncheckedCreateWithoutRoleChangesReceivedInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRoleChangesReceivedInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRoleChangesReceivedInput, UserUncheckedUpdateWithoutRoleChangesReceivedInput>
  }

  export type UserUpdateWithoutRoleChangesReceivedInput = {
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUpdateManyWithoutCreatorNestedInput
    enrollments?: CourseEnrollmentUpdateManyWithoutUserNestedInput
    courseFiles?: CourseFileUpdateManyWithoutUploaderNestedInput
    roleChangesMade?: RoleChangeAuditUpdateManyWithoutActorNestedInput
  }

  export type UserUncheckedUpdateWithoutRoleChangesReceivedInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUncheckedUpdateManyWithoutCreatorNestedInput
    enrollments?: CourseEnrollmentUncheckedUpdateManyWithoutUserNestedInput
    courseFiles?: CourseFileUncheckedUpdateManyWithoutUploaderNestedInput
    roleChangesMade?: RoleChangeAuditUncheckedUpdateManyWithoutActorNestedInput
  }

  export type StudyPlanCreateWithoutCareerInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
    subjects?: StudyPlanSubjectCreateNestedManyWithoutStudyPlanInput
  }

  export type StudyPlanUncheckedCreateWithoutCareerInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
    subjects?: StudyPlanSubjectUncheckedCreateNestedManyWithoutStudyPlanInput
  }

  export type StudyPlanCreateOrConnectWithoutCareerInput = {
    where: StudyPlanWhereUniqueInput
    create: XOR<StudyPlanCreateWithoutCareerInput, StudyPlanUncheckedCreateWithoutCareerInput>
  }

  export type StudyPlanCreateManyCareerInputEnvelope = {
    data: StudyPlanCreateManyCareerInput | StudyPlanCreateManyCareerInput[]
    skipDuplicates?: boolean
  }

  export type StudyPlanUpsertWithWhereUniqueWithoutCareerInput = {
    where: StudyPlanWhereUniqueInput
    update: XOR<StudyPlanUpdateWithoutCareerInput, StudyPlanUncheckedUpdateWithoutCareerInput>
    create: XOR<StudyPlanCreateWithoutCareerInput, StudyPlanUncheckedCreateWithoutCareerInput>
  }

  export type StudyPlanUpdateWithWhereUniqueWithoutCareerInput = {
    where: StudyPlanWhereUniqueInput
    data: XOR<StudyPlanUpdateWithoutCareerInput, StudyPlanUncheckedUpdateWithoutCareerInput>
  }

  export type StudyPlanUpdateManyWithWhereWithoutCareerInput = {
    where: StudyPlanScalarWhereInput
    data: XOR<StudyPlanUpdateManyMutationInput, StudyPlanUncheckedUpdateManyWithoutCareerInput>
  }

  export type StudyPlanScalarWhereInput = {
    AND?: StudyPlanScalarWhereInput | StudyPlanScalarWhereInput[]
    OR?: StudyPlanScalarWhereInput[]
    NOT?: StudyPlanScalarWhereInput | StudyPlanScalarWhereInput[]
    id?: UuidFilter<"StudyPlan"> | string
    careerId?: UuidFilter<"StudyPlan"> | string
    name?: StringFilter<"StudyPlan"> | string
    code?: StringFilter<"StudyPlan"> | string
    createdAt?: DateTimeFilter<"StudyPlan"> | Date | string
    updatedAt?: DateTimeFilter<"StudyPlan"> | Date | string
  }

  export type CareerCreateWithoutStudyPlansInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CareerUncheckedCreateWithoutStudyPlansInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CareerCreateOrConnectWithoutStudyPlansInput = {
    where: CareerWhereUniqueInput
    create: XOR<CareerCreateWithoutStudyPlansInput, CareerUncheckedCreateWithoutStudyPlansInput>
  }

  export type StudyPlanSubjectCreateWithoutStudyPlanInput = {
    id?: string
    year: number
    semester: number
    credits?: number | null
    subject: SubjectCreateNestedOneWithoutStudyPlansInput
  }

  export type StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput = {
    id?: string
    subjectId: string
    year: number
    semester: number
    credits?: number | null
  }

  export type StudyPlanSubjectCreateOrConnectWithoutStudyPlanInput = {
    where: StudyPlanSubjectWhereUniqueInput
    create: XOR<StudyPlanSubjectCreateWithoutStudyPlanInput, StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput>
  }

  export type StudyPlanSubjectCreateManyStudyPlanInputEnvelope = {
    data: StudyPlanSubjectCreateManyStudyPlanInput | StudyPlanSubjectCreateManyStudyPlanInput[]
    skipDuplicates?: boolean
  }

  export type CareerUpsertWithoutStudyPlansInput = {
    update: XOR<CareerUpdateWithoutStudyPlansInput, CareerUncheckedUpdateWithoutStudyPlansInput>
    create: XOR<CareerCreateWithoutStudyPlansInput, CareerUncheckedCreateWithoutStudyPlansInput>
    where?: CareerWhereInput
  }

  export type CareerUpdateToOneWithWhereWithoutStudyPlansInput = {
    where?: CareerWhereInput
    data: XOR<CareerUpdateWithoutStudyPlansInput, CareerUncheckedUpdateWithoutStudyPlansInput>
  }

  export type CareerUpdateWithoutStudyPlansInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CareerUncheckedUpdateWithoutStudyPlansInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudyPlanSubjectUpsertWithWhereUniqueWithoutStudyPlanInput = {
    where: StudyPlanSubjectWhereUniqueInput
    update: XOR<StudyPlanSubjectUpdateWithoutStudyPlanInput, StudyPlanSubjectUncheckedUpdateWithoutStudyPlanInput>
    create: XOR<StudyPlanSubjectCreateWithoutStudyPlanInput, StudyPlanSubjectUncheckedCreateWithoutStudyPlanInput>
  }

  export type StudyPlanSubjectUpdateWithWhereUniqueWithoutStudyPlanInput = {
    where: StudyPlanSubjectWhereUniqueInput
    data: XOR<StudyPlanSubjectUpdateWithoutStudyPlanInput, StudyPlanSubjectUncheckedUpdateWithoutStudyPlanInput>
  }

  export type StudyPlanSubjectUpdateManyWithWhereWithoutStudyPlanInput = {
    where: StudyPlanSubjectScalarWhereInput
    data: XOR<StudyPlanSubjectUpdateManyMutationInput, StudyPlanSubjectUncheckedUpdateManyWithoutStudyPlanInput>
  }

  export type StudyPlanSubjectScalarWhereInput = {
    AND?: StudyPlanSubjectScalarWhereInput | StudyPlanSubjectScalarWhereInput[]
    OR?: StudyPlanSubjectScalarWhereInput[]
    NOT?: StudyPlanSubjectScalarWhereInput | StudyPlanSubjectScalarWhereInput[]
    id?: UuidFilter<"StudyPlanSubject"> | string
    studyPlanId?: UuidFilter<"StudyPlanSubject"> | string
    subjectId?: UuidFilter<"StudyPlanSubject"> | string
    year?: IntFilter<"StudyPlanSubject"> | number
    semester?: IntFilter<"StudyPlanSubject"> | number
    credits?: IntNullableFilter<"StudyPlanSubject"> | number | null
  }

  export type StudyPlanSubjectCreateWithoutSubjectInput = {
    id?: string
    year: number
    semester: number
    credits?: number | null
    studyPlan: StudyPlanCreateNestedOneWithoutSubjectsInput
  }

  export type StudyPlanSubjectUncheckedCreateWithoutSubjectInput = {
    id?: string
    studyPlanId: string
    year: number
    semester: number
    credits?: number | null
  }

  export type StudyPlanSubjectCreateOrConnectWithoutSubjectInput = {
    where: StudyPlanSubjectWhereUniqueInput
    create: XOR<StudyPlanSubjectCreateWithoutSubjectInput, StudyPlanSubjectUncheckedCreateWithoutSubjectInput>
  }

  export type StudyPlanSubjectCreateManySubjectInputEnvelope = {
    data: StudyPlanSubjectCreateManySubjectInput | StudyPlanSubjectCreateManySubjectInput[]
    skipDuplicates?: boolean
  }

  export type CourseCreateWithoutSubjectInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: UserCreateNestedOneWithoutCoursesInput
    sections?: CourseSectionCreateNestedManyWithoutCourseInput
    enrollments?: CourseEnrollmentCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateWithoutSubjectInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    creatorId: number
    createdAt?: Date | string
    updatedAt?: Date | string
    sections?: CourseSectionUncheckedCreateNestedManyWithoutCourseInput
    enrollments?: CourseEnrollmentUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseCreateOrConnectWithoutSubjectInput = {
    where: CourseWhereUniqueInput
    create: XOR<CourseCreateWithoutSubjectInput, CourseUncheckedCreateWithoutSubjectInput>
  }

  export type CourseCreateManySubjectInputEnvelope = {
    data: CourseCreateManySubjectInput | CourseCreateManySubjectInput[]
    skipDuplicates?: boolean
  }

  export type StudyPlanSubjectUpsertWithWhereUniqueWithoutSubjectInput = {
    where: StudyPlanSubjectWhereUniqueInput
    update: XOR<StudyPlanSubjectUpdateWithoutSubjectInput, StudyPlanSubjectUncheckedUpdateWithoutSubjectInput>
    create: XOR<StudyPlanSubjectCreateWithoutSubjectInput, StudyPlanSubjectUncheckedCreateWithoutSubjectInput>
  }

  export type StudyPlanSubjectUpdateWithWhereUniqueWithoutSubjectInput = {
    where: StudyPlanSubjectWhereUniqueInput
    data: XOR<StudyPlanSubjectUpdateWithoutSubjectInput, StudyPlanSubjectUncheckedUpdateWithoutSubjectInput>
  }

  export type StudyPlanSubjectUpdateManyWithWhereWithoutSubjectInput = {
    where: StudyPlanSubjectScalarWhereInput
    data: XOR<StudyPlanSubjectUpdateManyMutationInput, StudyPlanSubjectUncheckedUpdateManyWithoutSubjectInput>
  }

  export type CourseUpsertWithWhereUniqueWithoutSubjectInput = {
    where: CourseWhereUniqueInput
    update: XOR<CourseUpdateWithoutSubjectInput, CourseUncheckedUpdateWithoutSubjectInput>
    create: XOR<CourseCreateWithoutSubjectInput, CourseUncheckedCreateWithoutSubjectInput>
  }

  export type CourseUpdateWithWhereUniqueWithoutSubjectInput = {
    where: CourseWhereUniqueInput
    data: XOR<CourseUpdateWithoutSubjectInput, CourseUncheckedUpdateWithoutSubjectInput>
  }

  export type CourseUpdateManyWithWhereWithoutSubjectInput = {
    where: CourseScalarWhereInput
    data: XOR<CourseUpdateManyMutationInput, CourseUncheckedUpdateManyWithoutSubjectInput>
  }

  export type StudyPlanCreateWithoutSubjectsInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
    career: CareerCreateNestedOneWithoutStudyPlansInput
  }

  export type StudyPlanUncheckedCreateWithoutSubjectsInput = {
    id?: string
    careerId: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StudyPlanCreateOrConnectWithoutSubjectsInput = {
    where: StudyPlanWhereUniqueInput
    create: XOR<StudyPlanCreateWithoutSubjectsInput, StudyPlanUncheckedCreateWithoutSubjectsInput>
  }

  export type SubjectCreateWithoutStudyPlansInput = {
    id?: string
    name: string
    code?: string | null
    description?: string | null
    searchKey: string
    createdAt?: Date | string
    updatedAt?: Date | string
    courses?: CourseCreateNestedManyWithoutSubjectInput
  }

  export type SubjectUncheckedCreateWithoutStudyPlansInput = {
    id?: string
    name: string
    code?: string | null
    description?: string | null
    searchKey: string
    createdAt?: Date | string
    updatedAt?: Date | string
    courses?: CourseUncheckedCreateNestedManyWithoutSubjectInput
  }

  export type SubjectCreateOrConnectWithoutStudyPlansInput = {
    where: SubjectWhereUniqueInput
    create: XOR<SubjectCreateWithoutStudyPlansInput, SubjectUncheckedCreateWithoutStudyPlansInput>
  }

  export type StudyPlanUpsertWithoutSubjectsInput = {
    update: XOR<StudyPlanUpdateWithoutSubjectsInput, StudyPlanUncheckedUpdateWithoutSubjectsInput>
    create: XOR<StudyPlanCreateWithoutSubjectsInput, StudyPlanUncheckedCreateWithoutSubjectsInput>
    where?: StudyPlanWhereInput
  }

  export type StudyPlanUpdateToOneWithWhereWithoutSubjectsInput = {
    where?: StudyPlanWhereInput
    data: XOR<StudyPlanUpdateWithoutSubjectsInput, StudyPlanUncheckedUpdateWithoutSubjectsInput>
  }

  export type StudyPlanUpdateWithoutSubjectsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    career?: CareerUpdateOneRequiredWithoutStudyPlansNestedInput
  }

  export type StudyPlanUncheckedUpdateWithoutSubjectsInput = {
    id?: StringFieldUpdateOperationsInput | string
    careerId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubjectUpsertWithoutStudyPlansInput = {
    update: XOR<SubjectUpdateWithoutStudyPlansInput, SubjectUncheckedUpdateWithoutStudyPlansInput>
    create: XOR<SubjectCreateWithoutStudyPlansInput, SubjectUncheckedCreateWithoutStudyPlansInput>
    where?: SubjectWhereInput
  }

  export type SubjectUpdateToOneWithWhereWithoutStudyPlansInput = {
    where?: SubjectWhereInput
    data: XOR<SubjectUpdateWithoutStudyPlansInput, SubjectUncheckedUpdateWithoutStudyPlansInput>
  }

  export type SubjectUpdateWithoutStudyPlansInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    searchKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    courses?: CourseUpdateManyWithoutSubjectNestedInput
  }

  export type SubjectUncheckedUpdateWithoutStudyPlansInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    searchKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    courses?: CourseUncheckedUpdateManyWithoutSubjectNestedInput
  }

  export type UserCreateWithoutCoursesInput = {
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    enrollments?: CourseEnrollmentCreateNestedManyWithoutUserInput
    courseFiles?: CourseFileCreateNestedManyWithoutUploaderInput
    roleChangesMade?: RoleChangeAuditCreateNestedManyWithoutActorInput
    roleChangesReceived?: RoleChangeAuditCreateNestedManyWithoutTargetInput
  }

  export type UserUncheckedCreateWithoutCoursesInput = {
    id?: number
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    enrollments?: CourseEnrollmentUncheckedCreateNestedManyWithoutUserInput
    courseFiles?: CourseFileUncheckedCreateNestedManyWithoutUploaderInput
    roleChangesMade?: RoleChangeAuditUncheckedCreateNestedManyWithoutActorInput
    roleChangesReceived?: RoleChangeAuditUncheckedCreateNestedManyWithoutTargetInput
  }

  export type UserCreateOrConnectWithoutCoursesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCoursesInput, UserUncheckedCreateWithoutCoursesInput>
  }

  export type SubjectCreateWithoutCoursesInput = {
    id?: string
    name: string
    code?: string | null
    description?: string | null
    searchKey: string
    createdAt?: Date | string
    updatedAt?: Date | string
    studyPlans?: StudyPlanSubjectCreateNestedManyWithoutSubjectInput
  }

  export type SubjectUncheckedCreateWithoutCoursesInput = {
    id?: string
    name: string
    code?: string | null
    description?: string | null
    searchKey: string
    createdAt?: Date | string
    updatedAt?: Date | string
    studyPlans?: StudyPlanSubjectUncheckedCreateNestedManyWithoutSubjectInput
  }

  export type SubjectCreateOrConnectWithoutCoursesInput = {
    where: SubjectWhereUniqueInput
    create: XOR<SubjectCreateWithoutCoursesInput, SubjectUncheckedCreateWithoutCoursesInput>
  }

  export type CourseSectionCreateWithoutCourseInput = {
    id?: string
    title: string
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    lessons?: CourseLessonCreateNestedManyWithoutSectionInput
  }

  export type CourseSectionUncheckedCreateWithoutCourseInput = {
    id?: string
    title: string
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    lessons?: CourseLessonUncheckedCreateNestedManyWithoutSectionInput
  }

  export type CourseSectionCreateOrConnectWithoutCourseInput = {
    where: CourseSectionWhereUniqueInput
    create: XOR<CourseSectionCreateWithoutCourseInput, CourseSectionUncheckedCreateWithoutCourseInput>
  }

  export type CourseSectionCreateManyCourseInputEnvelope = {
    data: CourseSectionCreateManyCourseInput | CourseSectionCreateManyCourseInput[]
    skipDuplicates?: boolean
  }

  export type CourseEnrollmentCreateWithoutCourseInput = {
    id?: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutEnrollmentsInput
  }

  export type CourseEnrollmentUncheckedCreateWithoutCourseInput = {
    id?: string
    userId: number
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseEnrollmentCreateOrConnectWithoutCourseInput = {
    where: CourseEnrollmentWhereUniqueInput
    create: XOR<CourseEnrollmentCreateWithoutCourseInput, CourseEnrollmentUncheckedCreateWithoutCourseInput>
  }

  export type CourseEnrollmentCreateManyCourseInputEnvelope = {
    data: CourseEnrollmentCreateManyCourseInput | CourseEnrollmentCreateManyCourseInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutCoursesInput = {
    update: XOR<UserUpdateWithoutCoursesInput, UserUncheckedUpdateWithoutCoursesInput>
    create: XOR<UserCreateWithoutCoursesInput, UserUncheckedCreateWithoutCoursesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCoursesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCoursesInput, UserUncheckedUpdateWithoutCoursesInput>
  }

  export type UserUpdateWithoutCoursesInput = {
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    enrollments?: CourseEnrollmentUpdateManyWithoutUserNestedInput
    courseFiles?: CourseFileUpdateManyWithoutUploaderNestedInput
    roleChangesMade?: RoleChangeAuditUpdateManyWithoutActorNestedInput
    roleChangesReceived?: RoleChangeAuditUpdateManyWithoutTargetNestedInput
  }

  export type UserUncheckedUpdateWithoutCoursesInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    enrollments?: CourseEnrollmentUncheckedUpdateManyWithoutUserNestedInput
    courseFiles?: CourseFileUncheckedUpdateManyWithoutUploaderNestedInput
    roleChangesMade?: RoleChangeAuditUncheckedUpdateManyWithoutActorNestedInput
    roleChangesReceived?: RoleChangeAuditUncheckedUpdateManyWithoutTargetNestedInput
  }

  export type SubjectUpsertWithoutCoursesInput = {
    update: XOR<SubjectUpdateWithoutCoursesInput, SubjectUncheckedUpdateWithoutCoursesInput>
    create: XOR<SubjectCreateWithoutCoursesInput, SubjectUncheckedCreateWithoutCoursesInput>
    where?: SubjectWhereInput
  }

  export type SubjectUpdateToOneWithWhereWithoutCoursesInput = {
    where?: SubjectWhereInput
    data: XOR<SubjectUpdateWithoutCoursesInput, SubjectUncheckedUpdateWithoutCoursesInput>
  }

  export type SubjectUpdateWithoutCoursesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    searchKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    studyPlans?: StudyPlanSubjectUpdateManyWithoutSubjectNestedInput
  }

  export type SubjectUncheckedUpdateWithoutCoursesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    searchKey?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    studyPlans?: StudyPlanSubjectUncheckedUpdateManyWithoutSubjectNestedInput
  }

  export type CourseSectionUpsertWithWhereUniqueWithoutCourseInput = {
    where: CourseSectionWhereUniqueInput
    update: XOR<CourseSectionUpdateWithoutCourseInput, CourseSectionUncheckedUpdateWithoutCourseInput>
    create: XOR<CourseSectionCreateWithoutCourseInput, CourseSectionUncheckedCreateWithoutCourseInput>
  }

  export type CourseSectionUpdateWithWhereUniqueWithoutCourseInput = {
    where: CourseSectionWhereUniqueInput
    data: XOR<CourseSectionUpdateWithoutCourseInput, CourseSectionUncheckedUpdateWithoutCourseInput>
  }

  export type CourseSectionUpdateManyWithWhereWithoutCourseInput = {
    where: CourseSectionScalarWhereInput
    data: XOR<CourseSectionUpdateManyMutationInput, CourseSectionUncheckedUpdateManyWithoutCourseInput>
  }

  export type CourseSectionScalarWhereInput = {
    AND?: CourseSectionScalarWhereInput | CourseSectionScalarWhereInput[]
    OR?: CourseSectionScalarWhereInput[]
    NOT?: CourseSectionScalarWhereInput | CourseSectionScalarWhereInput[]
    id?: UuidFilter<"CourseSection"> | string
    courseId?: UuidFilter<"CourseSection"> | string
    title?: StringFilter<"CourseSection"> | string
    position?: IntFilter<"CourseSection"> | number
    createdAt?: DateTimeFilter<"CourseSection"> | Date | string
    updatedAt?: DateTimeFilter<"CourseSection"> | Date | string
  }

  export type CourseEnrollmentUpsertWithWhereUniqueWithoutCourseInput = {
    where: CourseEnrollmentWhereUniqueInput
    update: XOR<CourseEnrollmentUpdateWithoutCourseInput, CourseEnrollmentUncheckedUpdateWithoutCourseInput>
    create: XOR<CourseEnrollmentCreateWithoutCourseInput, CourseEnrollmentUncheckedCreateWithoutCourseInput>
  }

  export type CourseEnrollmentUpdateWithWhereUniqueWithoutCourseInput = {
    where: CourseEnrollmentWhereUniqueInput
    data: XOR<CourseEnrollmentUpdateWithoutCourseInput, CourseEnrollmentUncheckedUpdateWithoutCourseInput>
  }

  export type CourseEnrollmentUpdateManyWithWhereWithoutCourseInput = {
    where: CourseEnrollmentScalarWhereInput
    data: XOR<CourseEnrollmentUpdateManyMutationInput, CourseEnrollmentUncheckedUpdateManyWithoutCourseInput>
  }

  export type CourseCreateWithoutSectionsInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: UserCreateNestedOneWithoutCoursesInput
    subject?: SubjectCreateNestedOneWithoutCoursesInput
    enrollments?: CourseEnrollmentCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateWithoutSectionsInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    creatorId: number
    subjectId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    enrollments?: CourseEnrollmentUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseCreateOrConnectWithoutSectionsInput = {
    where: CourseWhereUniqueInput
    create: XOR<CourseCreateWithoutSectionsInput, CourseUncheckedCreateWithoutSectionsInput>
  }

  export type CourseLessonCreateWithoutSectionInput = {
    id?: string
    title: string
    body?: string | null
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    files?: CourseFileCreateNestedManyWithoutLessonInput
  }

  export type CourseLessonUncheckedCreateWithoutSectionInput = {
    id?: string
    title: string
    body?: string | null
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    files?: CourseFileUncheckedCreateNestedManyWithoutLessonInput
  }

  export type CourseLessonCreateOrConnectWithoutSectionInput = {
    where: CourseLessonWhereUniqueInput
    create: XOR<CourseLessonCreateWithoutSectionInput, CourseLessonUncheckedCreateWithoutSectionInput>
  }

  export type CourseLessonCreateManySectionInputEnvelope = {
    data: CourseLessonCreateManySectionInput | CourseLessonCreateManySectionInput[]
    skipDuplicates?: boolean
  }

  export type CourseUpsertWithoutSectionsInput = {
    update: XOR<CourseUpdateWithoutSectionsInput, CourseUncheckedUpdateWithoutSectionsInput>
    create: XOR<CourseCreateWithoutSectionsInput, CourseUncheckedCreateWithoutSectionsInput>
    where?: CourseWhereInput
  }

  export type CourseUpdateToOneWithWhereWithoutSectionsInput = {
    where?: CourseWhereInput
    data: XOR<CourseUpdateWithoutSectionsInput, CourseUncheckedUpdateWithoutSectionsInput>
  }

  export type CourseUpdateWithoutSectionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneRequiredWithoutCoursesNestedInput
    subject?: SubjectUpdateOneWithoutCoursesNestedInput
    enrollments?: CourseEnrollmentUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateWithoutSectionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    creatorId?: IntFieldUpdateOperationsInput | number
    subjectId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    enrollments?: CourseEnrollmentUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type CourseLessonUpsertWithWhereUniqueWithoutSectionInput = {
    where: CourseLessonWhereUniqueInput
    update: XOR<CourseLessonUpdateWithoutSectionInput, CourseLessonUncheckedUpdateWithoutSectionInput>
    create: XOR<CourseLessonCreateWithoutSectionInput, CourseLessonUncheckedCreateWithoutSectionInput>
  }

  export type CourseLessonUpdateWithWhereUniqueWithoutSectionInput = {
    where: CourseLessonWhereUniqueInput
    data: XOR<CourseLessonUpdateWithoutSectionInput, CourseLessonUncheckedUpdateWithoutSectionInput>
  }

  export type CourseLessonUpdateManyWithWhereWithoutSectionInput = {
    where: CourseLessonScalarWhereInput
    data: XOR<CourseLessonUpdateManyMutationInput, CourseLessonUncheckedUpdateManyWithoutSectionInput>
  }

  export type CourseLessonScalarWhereInput = {
    AND?: CourseLessonScalarWhereInput | CourseLessonScalarWhereInput[]
    OR?: CourseLessonScalarWhereInput[]
    NOT?: CourseLessonScalarWhereInput | CourseLessonScalarWhereInput[]
    id?: UuidFilter<"CourseLesson"> | string
    sectionId?: UuidFilter<"CourseLesson"> | string
    title?: StringFilter<"CourseLesson"> | string
    body?: StringNullableFilter<"CourseLesson"> | string | null
    position?: IntFilter<"CourseLesson"> | number
    createdAt?: DateTimeFilter<"CourseLesson"> | Date | string
    updatedAt?: DateTimeFilter<"CourseLesson"> | Date | string
  }

  export type CourseSectionCreateWithoutLessonsInput = {
    id?: string
    title: string
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    course: CourseCreateNestedOneWithoutSectionsInput
  }

  export type CourseSectionUncheckedCreateWithoutLessonsInput = {
    id?: string
    courseId: string
    title: string
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseSectionCreateOrConnectWithoutLessonsInput = {
    where: CourseSectionWhereUniqueInput
    create: XOR<CourseSectionCreateWithoutLessonsInput, CourseSectionUncheckedCreateWithoutLessonsInput>
  }

  export type CourseFileCreateWithoutLessonInput = {
    id?: string
    driveFileId?: string | null
    operationId?: string
    originalName: string
    mimeType: string
    size: bigint | number
    allowDownload?: boolean
    state?: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode?: string | null
    attempts?: number
    retryAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    uploader: UserCreateNestedOneWithoutCourseFilesInput
  }

  export type CourseFileUncheckedCreateWithoutLessonInput = {
    id?: string
    uploaderId: number
    driveFileId?: string | null
    operationId?: string
    originalName: string
    mimeType: string
    size: bigint | number
    allowDownload?: boolean
    state?: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode?: string | null
    attempts?: number
    retryAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseFileCreateOrConnectWithoutLessonInput = {
    where: CourseFileWhereUniqueInput
    create: XOR<CourseFileCreateWithoutLessonInput, CourseFileUncheckedCreateWithoutLessonInput>
  }

  export type CourseFileCreateManyLessonInputEnvelope = {
    data: CourseFileCreateManyLessonInput | CourseFileCreateManyLessonInput[]
    skipDuplicates?: boolean
  }

  export type CourseSectionUpsertWithoutLessonsInput = {
    update: XOR<CourseSectionUpdateWithoutLessonsInput, CourseSectionUncheckedUpdateWithoutLessonsInput>
    create: XOR<CourseSectionCreateWithoutLessonsInput, CourseSectionUncheckedCreateWithoutLessonsInput>
    where?: CourseSectionWhereInput
  }

  export type CourseSectionUpdateToOneWithWhereWithoutLessonsInput = {
    where?: CourseSectionWhereInput
    data: XOR<CourseSectionUpdateWithoutLessonsInput, CourseSectionUncheckedUpdateWithoutLessonsInput>
  }

  export type CourseSectionUpdateWithoutLessonsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    course?: CourseUpdateOneRequiredWithoutSectionsNestedInput
  }

  export type CourseSectionUncheckedUpdateWithoutLessonsInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseFileUpsertWithWhereUniqueWithoutLessonInput = {
    where: CourseFileWhereUniqueInput
    update: XOR<CourseFileUpdateWithoutLessonInput, CourseFileUncheckedUpdateWithoutLessonInput>
    create: XOR<CourseFileCreateWithoutLessonInput, CourseFileUncheckedCreateWithoutLessonInput>
  }

  export type CourseFileUpdateWithWhereUniqueWithoutLessonInput = {
    where: CourseFileWhereUniqueInput
    data: XOR<CourseFileUpdateWithoutLessonInput, CourseFileUncheckedUpdateWithoutLessonInput>
  }

  export type CourseFileUpdateManyWithWhereWithoutLessonInput = {
    where: CourseFileScalarWhereInput
    data: XOR<CourseFileUpdateManyMutationInput, CourseFileUncheckedUpdateManyWithoutLessonInput>
  }

  export type CourseCreateWithoutEnrollmentsInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: UserCreateNestedOneWithoutCoursesInput
    subject?: SubjectCreateNestedOneWithoutCoursesInput
    sections?: CourseSectionCreateNestedManyWithoutCourseInput
  }

  export type CourseUncheckedCreateWithoutEnrollmentsInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    creatorId: number
    subjectId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sections?: CourseSectionUncheckedCreateNestedManyWithoutCourseInput
  }

  export type CourseCreateOrConnectWithoutEnrollmentsInput = {
    where: CourseWhereUniqueInput
    create: XOR<CourseCreateWithoutEnrollmentsInput, CourseUncheckedCreateWithoutEnrollmentsInput>
  }

  export type UserCreateWithoutEnrollmentsInput = {
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseCreateNestedManyWithoutCreatorInput
    courseFiles?: CourseFileCreateNestedManyWithoutUploaderInput
    roleChangesMade?: RoleChangeAuditCreateNestedManyWithoutActorInput
    roleChangesReceived?: RoleChangeAuditCreateNestedManyWithoutTargetInput
  }

  export type UserUncheckedCreateWithoutEnrollmentsInput = {
    id?: number
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseUncheckedCreateNestedManyWithoutCreatorInput
    courseFiles?: CourseFileUncheckedCreateNestedManyWithoutUploaderInput
    roleChangesMade?: RoleChangeAuditUncheckedCreateNestedManyWithoutActorInput
    roleChangesReceived?: RoleChangeAuditUncheckedCreateNestedManyWithoutTargetInput
  }

  export type UserCreateOrConnectWithoutEnrollmentsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutEnrollmentsInput, UserUncheckedCreateWithoutEnrollmentsInput>
  }

  export type CourseUpsertWithoutEnrollmentsInput = {
    update: XOR<CourseUpdateWithoutEnrollmentsInput, CourseUncheckedUpdateWithoutEnrollmentsInput>
    create: XOR<CourseCreateWithoutEnrollmentsInput, CourseUncheckedCreateWithoutEnrollmentsInput>
    where?: CourseWhereInput
  }

  export type CourseUpdateToOneWithWhereWithoutEnrollmentsInput = {
    where?: CourseWhereInput
    data: XOR<CourseUpdateWithoutEnrollmentsInput, CourseUncheckedUpdateWithoutEnrollmentsInput>
  }

  export type CourseUpdateWithoutEnrollmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneRequiredWithoutCoursesNestedInput
    subject?: SubjectUpdateOneWithoutCoursesNestedInput
    sections?: CourseSectionUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateWithoutEnrollmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    creatorId?: IntFieldUpdateOperationsInput | number
    subjectId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sections?: CourseSectionUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type UserUpsertWithoutEnrollmentsInput = {
    update: XOR<UserUpdateWithoutEnrollmentsInput, UserUncheckedUpdateWithoutEnrollmentsInput>
    create: XOR<UserCreateWithoutEnrollmentsInput, UserUncheckedCreateWithoutEnrollmentsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutEnrollmentsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutEnrollmentsInput, UserUncheckedUpdateWithoutEnrollmentsInput>
  }

  export type UserUpdateWithoutEnrollmentsInput = {
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUpdateManyWithoutCreatorNestedInput
    courseFiles?: CourseFileUpdateManyWithoutUploaderNestedInput
    roleChangesMade?: RoleChangeAuditUpdateManyWithoutActorNestedInput
    roleChangesReceived?: RoleChangeAuditUpdateManyWithoutTargetNestedInput
  }

  export type UserUncheckedUpdateWithoutEnrollmentsInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUncheckedUpdateManyWithoutCreatorNestedInput
    courseFiles?: CourseFileUncheckedUpdateManyWithoutUploaderNestedInput
    roleChangesMade?: RoleChangeAuditUncheckedUpdateManyWithoutActorNestedInput
    roleChangesReceived?: RoleChangeAuditUncheckedUpdateManyWithoutTargetNestedInput
  }

  export type CourseLessonCreateWithoutFilesInput = {
    id?: string
    title: string
    body?: string | null
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
    section: CourseSectionCreateNestedOneWithoutLessonsInput
  }

  export type CourseLessonUncheckedCreateWithoutFilesInput = {
    id?: string
    sectionId: string
    title: string
    body?: string | null
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseLessonCreateOrConnectWithoutFilesInput = {
    where: CourseLessonWhereUniqueInput
    create: XOR<CourseLessonCreateWithoutFilesInput, CourseLessonUncheckedCreateWithoutFilesInput>
  }

  export type UserCreateWithoutCourseFilesInput = {
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseCreateNestedManyWithoutCreatorInput
    enrollments?: CourseEnrollmentCreateNestedManyWithoutUserInput
    roleChangesMade?: RoleChangeAuditCreateNestedManyWithoutActorInput
    roleChangesReceived?: RoleChangeAuditCreateNestedManyWithoutTargetInput
  }

  export type UserUncheckedCreateWithoutCourseFilesInput = {
    id?: number
    username: string
    email: string
    passwordHash: string
    role?: $Enums.Role
    name?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isBanned?: boolean
    bannedUntil?: Date | string | null
    mutedUntil?: Date | string | null
    courses?: CourseUncheckedCreateNestedManyWithoutCreatorInput
    enrollments?: CourseEnrollmentUncheckedCreateNestedManyWithoutUserInput
    roleChangesMade?: RoleChangeAuditUncheckedCreateNestedManyWithoutActorInput
    roleChangesReceived?: RoleChangeAuditUncheckedCreateNestedManyWithoutTargetInput
  }

  export type UserCreateOrConnectWithoutCourseFilesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCourseFilesInput, UserUncheckedCreateWithoutCourseFilesInput>
  }

  export type CourseLessonUpsertWithoutFilesInput = {
    update: XOR<CourseLessonUpdateWithoutFilesInput, CourseLessonUncheckedUpdateWithoutFilesInput>
    create: XOR<CourseLessonCreateWithoutFilesInput, CourseLessonUncheckedCreateWithoutFilesInput>
    where?: CourseLessonWhereInput
  }

  export type CourseLessonUpdateToOneWithWhereWithoutFilesInput = {
    where?: CourseLessonWhereInput
    data: XOR<CourseLessonUpdateWithoutFilesInput, CourseLessonUncheckedUpdateWithoutFilesInput>
  }

  export type CourseLessonUpdateWithoutFilesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    section?: CourseSectionUpdateOneRequiredWithoutLessonsNestedInput
  }

  export type CourseLessonUncheckedUpdateWithoutFilesInput = {
    id?: StringFieldUpdateOperationsInput | string
    sectionId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUpsertWithoutCourseFilesInput = {
    update: XOR<UserUpdateWithoutCourseFilesInput, UserUncheckedUpdateWithoutCourseFilesInput>
    create: XOR<UserCreateWithoutCourseFilesInput, UserUncheckedCreateWithoutCourseFilesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCourseFilesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCourseFilesInput, UserUncheckedUpdateWithoutCourseFilesInput>
  }

  export type UserUpdateWithoutCourseFilesInput = {
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUpdateManyWithoutCreatorNestedInput
    enrollments?: CourseEnrollmentUpdateManyWithoutUserNestedInput
    roleChangesMade?: RoleChangeAuditUpdateManyWithoutActorNestedInput
    roleChangesReceived?: RoleChangeAuditUpdateManyWithoutTargetNestedInput
  }

  export type UserUncheckedUpdateWithoutCourseFilesInput = {
    id?: IntFieldUpdateOperationsInput | number
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    name?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    bannedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    mutedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    courses?: CourseUncheckedUpdateManyWithoutCreatorNestedInput
    enrollments?: CourseEnrollmentUncheckedUpdateManyWithoutUserNestedInput
    roleChangesMade?: RoleChangeAuditUncheckedUpdateManyWithoutActorNestedInput
    roleChangesReceived?: RoleChangeAuditUncheckedUpdateManyWithoutTargetNestedInput
  }

  export type CourseCreateManyCreatorInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    subjectId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseEnrollmentCreateManyUserInput = {
    id?: string
    courseId: string
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseFileCreateManyUploaderInput = {
    id?: string
    lessonId: string
    driveFileId?: string | null
    operationId?: string
    originalName: string
    mimeType: string
    size: bigint | number
    allowDownload?: boolean
    state?: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode?: string | null
    attempts?: number
    retryAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RoleChangeAuditCreateManyActorInput = {
    id?: string
    targetId: number
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt?: Date | string
  }

  export type RoleChangeAuditCreateManyTargetInput = {
    id?: string
    actorId: number
    oldRole: $Enums.Role
    newRole: $Enums.Role
    reason: string
    createdAt?: Date | string
  }

  export type CourseUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subject?: SubjectUpdateOneWithoutCoursesNestedInput
    sections?: CourseSectionUpdateManyWithoutCourseNestedInput
    enrollments?: CourseEnrollmentUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    subjectId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sections?: CourseSectionUncheckedUpdateManyWithoutCourseNestedInput
    enrollments?: CourseEnrollmentUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateManyWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    subjectId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseEnrollmentUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    course?: CourseUpdateOneRequiredWithoutEnrollmentsNestedInput
  }

  export type CourseEnrollmentUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseEnrollmentUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    courseId?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseFileUpdateWithoutUploaderInput = {
    id?: StringFieldUpdateOperationsInput | string
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lesson?: CourseLessonUpdateOneRequiredWithoutFilesNestedInput
  }

  export type CourseFileUncheckedUpdateWithoutUploaderInput = {
    id?: StringFieldUpdateOperationsInput | string
    lessonId?: StringFieldUpdateOperationsInput | string
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseFileUncheckedUpdateManyWithoutUploaderInput = {
    id?: StringFieldUpdateOperationsInput | string
    lessonId?: StringFieldUpdateOperationsInput | string
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoleChangeAuditUpdateWithoutActorInput = {
    id?: StringFieldUpdateOperationsInput | string
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    target?: UserUpdateOneRequiredWithoutRoleChangesReceivedNestedInput
  }

  export type RoleChangeAuditUncheckedUpdateWithoutActorInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetId?: IntFieldUpdateOperationsInput | number
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoleChangeAuditUncheckedUpdateManyWithoutActorInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetId?: IntFieldUpdateOperationsInput | number
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoleChangeAuditUpdateWithoutTargetInput = {
    id?: StringFieldUpdateOperationsInput | string
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    actor?: UserUpdateOneRequiredWithoutRoleChangesMadeNestedInput
  }

  export type RoleChangeAuditUncheckedUpdateWithoutTargetInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: IntFieldUpdateOperationsInput | number
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RoleChangeAuditUncheckedUpdateManyWithoutTargetInput = {
    id?: StringFieldUpdateOperationsInput | string
    actorId?: IntFieldUpdateOperationsInput | number
    oldRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    newRole?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudyPlanCreateManyCareerInput = {
    id?: string
    name: string
    code: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StudyPlanUpdateWithoutCareerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subjects?: StudyPlanSubjectUpdateManyWithoutStudyPlanNestedInput
  }

  export type StudyPlanUncheckedUpdateWithoutCareerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subjects?: StudyPlanSubjectUncheckedUpdateManyWithoutStudyPlanNestedInput
  }

  export type StudyPlanUncheckedUpdateManyWithoutCareerInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StudyPlanSubjectCreateManyStudyPlanInput = {
    id?: string
    subjectId: string
    year: number
    semester: number
    credits?: number | null
  }

  export type StudyPlanSubjectUpdateWithoutStudyPlanInput = {
    id?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
    subject?: SubjectUpdateOneRequiredWithoutStudyPlansNestedInput
  }

  export type StudyPlanSubjectUncheckedUpdateWithoutStudyPlanInput = {
    id?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type StudyPlanSubjectUncheckedUpdateManyWithoutStudyPlanInput = {
    id?: StringFieldUpdateOperationsInput | string
    subjectId?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type StudyPlanSubjectCreateManySubjectInput = {
    id?: string
    studyPlanId: string
    year: number
    semester: number
    credits?: number | null
  }

  export type CourseCreateManySubjectInput = {
    id?: string
    title: string
    description: string
    status?: $Enums.CourseStatus
    creatorId: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type StudyPlanSubjectUpdateWithoutSubjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
    studyPlan?: StudyPlanUpdateOneRequiredWithoutSubjectsNestedInput
  }

  export type StudyPlanSubjectUncheckedUpdateWithoutSubjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    studyPlanId?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type StudyPlanSubjectUncheckedUpdateManyWithoutSubjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    studyPlanId?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    semester?: IntFieldUpdateOperationsInput | number
    credits?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type CourseUpdateWithoutSubjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneRequiredWithoutCoursesNestedInput
    sections?: CourseSectionUpdateManyWithoutCourseNestedInput
    enrollments?: CourseEnrollmentUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateWithoutSubjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    creatorId?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sections?: CourseSectionUncheckedUpdateManyWithoutCourseNestedInput
    enrollments?: CourseEnrollmentUncheckedUpdateManyWithoutCourseNestedInput
  }

  export type CourseUncheckedUpdateManyWithoutSubjectInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    status?: EnumCourseStatusFieldUpdateOperationsInput | $Enums.CourseStatus
    creatorId?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseSectionCreateManyCourseInput = {
    id?: string
    title: string
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseEnrollmentCreateManyCourseInput = {
    id?: string
    userId: number
    active?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseSectionUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lessons?: CourseLessonUpdateManyWithoutSectionNestedInput
  }

  export type CourseSectionUncheckedUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lessons?: CourseLessonUncheckedUpdateManyWithoutSectionNestedInput
  }

  export type CourseSectionUncheckedUpdateManyWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseEnrollmentUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutEnrollmentsNestedInput
  }

  export type CourseEnrollmentUncheckedUpdateWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseEnrollmentUncheckedUpdateManyWithoutCourseInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: IntFieldUpdateOperationsInput | number
    active?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseLessonCreateManySectionInput = {
    id?: string
    title: string
    body?: string | null
    position: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseLessonUpdateWithoutSectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    files?: CourseFileUpdateManyWithoutLessonNestedInput
  }

  export type CourseLessonUncheckedUpdateWithoutSectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    files?: CourseFileUncheckedUpdateManyWithoutLessonNestedInput
  }

  export type CourseLessonUncheckedUpdateManyWithoutSectionInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: NullableStringFieldUpdateOperationsInput | string | null
    position?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseFileCreateManyLessonInput = {
    id?: string
    uploaderId: number
    driveFileId?: string | null
    operationId?: string
    originalName: string
    mimeType: string
    size: bigint | number
    allowDownload?: boolean
    state?: $Enums.CourseFileState
    origin: $Enums.CourseFileOrigin
    lastErrorCode?: string | null
    attempts?: number
    retryAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CourseFileUpdateWithoutLessonInput = {
    id?: StringFieldUpdateOperationsInput | string
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    uploader?: UserUpdateOneRequiredWithoutCourseFilesNestedInput
  }

  export type CourseFileUncheckedUpdateWithoutLessonInput = {
    id?: StringFieldUpdateOperationsInput | string
    uploaderId?: IntFieldUpdateOperationsInput | number
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CourseFileUncheckedUpdateManyWithoutLessonInput = {
    id?: StringFieldUpdateOperationsInput | string
    uploaderId?: IntFieldUpdateOperationsInput | number
    driveFileId?: NullableStringFieldUpdateOperationsInput | string | null
    operationId?: StringFieldUpdateOperationsInput | string
    originalName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    allowDownload?: BoolFieldUpdateOperationsInput | boolean
    state?: EnumCourseFileStateFieldUpdateOperationsInput | $Enums.CourseFileState
    origin?: EnumCourseFileOriginFieldUpdateOperationsInput | $Enums.CourseFileOrigin
    lastErrorCode?: NullableStringFieldUpdateOperationsInput | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    retryAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}