import { z } from 'zod';

const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const positiveInt = z.number().int().positive();
const nonnegativeInt = z.number().int().nonnegative();
const ids = z.array(id).min(1);

const packSchema = z.strictObject({
  schemaVersion: z.literal(1),
  contentVersion: id,
  ingredients: z.array(z.strictObject({
    id,
    states: ids,
    cost: nonnegativeInt,
  })).min(1),
  recipes: z.array(z.strictObject({
    id,
    requires: z.array(z.string().regex(/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*(\|[a-z][a-z0-9-]*)*$/)).min(1),
    price: positiveInt,
  })).min(1),
  restaurant: z.strictObject({
    id,
    shiftSeconds: positiveInt,
    startCash: nonnegativeInt,
    plates: positiveInt,
    tables: positiveInt,
    days: z.array(z.strictObject({
      day: positiveInt,
      target: positiveInt,
      recipes: ids,
    })).min(1),
  }),
  upgrades: z.array(z.strictObject({ id, cost: positiveInt })),
});

export function parseContentPack(input: unknown) {
  const pack = packSchema.parse(input);
  const ingredientStates = new Map<string, Set<string>>();
  const recipeIds = new Set<string>();
  const upgradeIds = new Set<string>();

  for (const ingredient of pack.ingredients) {
    if (ingredientStates.has(ingredient.id)) throw new Error(`Duplicate ingredient: ${ingredient.id}`);
    const states = new Set(ingredient.states);
    if (states.size !== ingredient.states.length) throw new Error(`Duplicate states for ${ingredient.id}`);
    ingredientStates.set(ingredient.id, states);
  }

  for (const recipe of pack.recipes) {
    if (recipeIds.has(recipe.id)) throw new Error(`Duplicate recipe: ${recipe.id}`);
    recipeIds.add(recipe.id);
    const ingredients = new Set<string>();
    for (const requirement of recipe.requires) {
      const separator = requirement.indexOf(':');
      const ingredient = requirement.slice(0, separator);
      const states = requirement.slice(separator + 1).split('|');
      if (ingredients.has(ingredient)) throw new Error(`Recipe ${recipe.id} repeats ingredient ${ingredient}`);
      ingredients.add(ingredient);
      const allowedStates = ingredientStates.get(ingredient);
      if (!allowedStates) throw new Error(`Recipe ${recipe.id} references unknown ingredient ${ingredient}`);
      for (const state of states) {
        if (!allowedStates.has(state)) throw new Error(`Recipe ${recipe.id} references unknown state ${requirement}`);
      }
    }
  }

  for (const [index, day] of pack.restaurant.days.entries()) {
    if (day.day !== index + 1) throw new Error(`Expected day ${index + 1}, received ${day.day}`);
    if (new Set(day.recipes).size !== day.recipes.length) throw new Error(`Day ${day.day} repeats a recipe`);
    for (const recipe of day.recipes) {
      if (!recipeIds.has(recipe)) throw new Error(`Day ${day.day} references unknown recipe ${recipe}`);
    }
  }

  for (const upgrade of pack.upgrades) {
    if (upgradeIds.has(upgrade.id)) throw new Error(`Duplicate upgrade: ${upgrade.id}`);
    upgradeIds.add(upgrade.id);
  }

  return pack;
}
