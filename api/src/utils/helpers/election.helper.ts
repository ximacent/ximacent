import { Repository, ObjectLiteral } from "typeorm";
import slugify from "slugify";

/**
 * Generates a unique alias for an entity
 * Example: "Tech Conference" in 2026 → "tec2617"
 */
export const generateUniqueAlias = async <T extends ObjectLiteral>(
  title: string,
  repo: Repository<T>,
  aliasColumn: keyof T = "alias" as keyof T
): Promise<string> => {
  const yearSuffix = new Date().getFullYear() % 100; // last 2 digits of year
  const prefix = title.slice(0, 3).toLowerCase();    // first 3 letters of title

  let alias: string;
  let exists: boolean;

  do {
    const randomNum = Math.floor(Math.random() * 90 + 10); // 10-99
    alias = `${prefix}${yearSuffix}${randomNum}`;
    exists = !!(await repo.findOneBy({ [aliasColumn]: alias } as any));
  } while (exists);

  return alias;
};

/**
 * Generates a unique slug for an entity
 * Example: "Tech Conference 2026" → "tech-conference-2026" or "tech-conference-2026-1"
 */
export const generateUniqueSlug = async <T extends ObjectLiteral>(
  title: string,
  repo: Repository<T>,
  slugColumn: keyof T = "slug" as keyof T
): Promise<string> => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let exists: boolean;
  let counter = 1;

  do {
    exists = !!(await repo.findOneBy({ [slugColumn]: slug } as any));
    if (exists) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  } while (exists);

  return slug;
};
