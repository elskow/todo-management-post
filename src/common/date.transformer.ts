import { Transform } from 'class-transformer';

export function TransformDate() {
  return Transform(({ value }) => {
    if (!value) return undefined;

    // Handle ISO strings
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return undefined;
      }
      return date;
    }

    // Handle Date objects
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return undefined;
      }
      return value;
    }

    return undefined;
  });
}
