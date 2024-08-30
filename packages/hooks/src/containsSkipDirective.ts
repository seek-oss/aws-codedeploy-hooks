const skipDirective = /\[skip([^\]]+)\]/gi;

/**
 * Check if a message contains a skip directive for a given scope.
 * @param message - The message to check.
 * @param scope - The scope to check for.
 * @returns Whether the message contains a skip directive for the given scope.
 *
 * @example
 * containsSkipDirective('This is a message with a [skip ci] directive.', 'ci');
 * // true
 *
 * containsSkipDirective('This is a message with a [skip ci smoke] directive.', 'ci');
 * // true
 *
 * containsSkipDirective('This is a message with a [skip smoke] directive.', 'ci');
 * // false
 */
export const containsSkipDirective = (
  message: string | undefined | null,
  scope: string,
) =>
  Array.from(
    message
      // limit the message to 1000 characters to avoid regex performance issues
      ?.slice(0, 1000)
      .matchAll(skipDirective) ?? [],
  ).some((match) =>
    match[1]
      ?.split(' ')
      .map((part) => part.toLowerCase())
      .includes(scope),
  );
