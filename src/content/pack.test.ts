import { describe, expect, it } from 'vitest';
import example from '../../content/EXAMPLE_PACK.json';
import { parseContentPack } from './pack';

describe('Q19 example content contract', () => {
  it('loads seven days and the canonical recipe prices and ingredients', () => {
    const pack = parseContentPack(example);
    expect(pack.recipes.map(({ id, requires, price }) => [id, requires, price])).toEqual([
      ['classic', ['bun:ready', 'patty:perfect|overcooked'], 12],
      ['cheese', ['bun:ready', 'patty:perfect|overcooked', 'cheese:ready'], 15],
      ['garden', ['bun:ready', 'patty:perfect|overcooked', 'lettuce:prepped', 'tomato:prepped'], 17],
    ]);
    expect(pack.restaurant.days.map(({ target }) => target)).toEqual([6, 8, 10, 10, 10, 10, 10]);
    expect(pack.restaurant.days).toHaveLength(7);
  });

  it('rejects unknown schema versions and invalid ranges', () => {
    expect(() => parseContentPack({ ...example, schemaVersion: 2 })).toThrow('schemaVersion');
    expect(() => parseContentPack({
      ...example,
      restaurant: { ...example.restaurant, shiftSeconds: 0 },
    })).toThrow('shiftSeconds');
  });

  it('rejects duplicate IDs', () => {
    expect(() => parseContentPack({
      ...example,
      ingredients: example.ingredients.concat(example.ingredients),
    })).toThrow('Duplicate ingredient');
  });

  it.each([
    ['pickle:ready', 'unknown ingredient'],
    ['lettuce:raw|sliced', 'unknown state'],
    ['bun:ready', 'repeats ingredient'],
  ])('rejects invalid requirement %s', (requirement, message) => {
    const pack = structuredClone(example);
    pack.recipes[0]!.requires.push(requirement);
    expect(() => parseContentPack(pack)).toThrow(message);
  });

  it('rejects unresolved day recipe references', () => {
    const pack = structuredClone(example);
    pack.restaurant.days[0]!.recipes.push('missing-recipe');
    expect(() => parseContentPack(pack)).toThrow('unknown recipe missing-recipe');
  });
});
