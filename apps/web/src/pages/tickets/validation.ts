// Mirrors the API limits so forms can show errors before sending a request.
export function validateTitle(title: string): string | undefined {
  const value = title.trim();
  if (value === '') return 'Title is required';
  if (value.length < 3) return 'Title must be at least 3 characters';
  if (value.length > 120) return 'Title must be at most 120 characters';
  return undefined;
}

export function validateDescription(description: string): string | undefined {
  const value = description.trim();
  if (value === '') return 'Description is required';
  if (value.length > 5000) return 'Description must be at most 5000 characters';
  return undefined;
}

// Tags are typed as a comma-separated string; the API lowercases and de-duplicates them.
export function parseTags(text: string): string[] {
  const tags = text
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag !== '');
  return [...new Set(tags)];
}

export function validateTags(text: string): string | undefined {
  const tags = parseTags(text);
  if (tags.length > 10) return 'Use at most 10 tags';
  if (tags.some((tag) => tag.length > 30)) return 'Each tag must be at most 30 characters';
  return undefined;
}

export function validateCommentBody(body: string): string | undefined {
  const value = body.trim();
  if (value === '') return 'Comment is required';
  if (value.length > 2000) return 'Comment must be at most 2000 characters';
  return undefined;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}
