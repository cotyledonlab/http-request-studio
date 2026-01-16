export interface SubstitutionResult {
  result: string;
  unresolved: string[];
}

export function substituteVariables(
  text: string,
  variables: Record<string, string>
): SubstitutionResult {
  const pattern = /\{\{(\w+)\}\}/g;
  const unresolved = new Set<string>();

  const result = text.replace(pattern, (match, varName) => {
    if (Object.prototype.hasOwnProperty.call(variables, varName)) {
      return variables[varName];
    }
    unresolved.add(varName);
    return match;
  });

  return { result, unresolved: Array.from(unresolved) };
}
