const skipDirective = /\[skip([^\]]+)\]/gi;

/**
 * Check if a message contains a skip directive for a given scope.
 * @param message - The message to check.
 * @param scope - The scope to check for.
 * @returns Whether the message contains a skip directive for the given scope.
 *
 * @example
 * containsSkipDirective('This is a message with a [skip alarm] directive.', 'alarm');
 * // true
 *
 * containsSkipDirective('This is a message with a [skip alarm smoke] directive.', 'alarm');
 * // true
 *
 * containsSkipDirective('This is a message with a [skip smoke] directive.', 'alarm');
 * // false
 */
export const containsSkipDirective = (
  message: string | undefined | null,
  scope: string,
) =>
  Array.from(message?.matchAll(skipDirective) ?? []).some((match) =>
    match[1]
      ?.split(' ')
      .map((part) => part.toLowerCase())
      .includes(scope),
  );
