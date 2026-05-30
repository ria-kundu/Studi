import sanitizeHtml from "sanitize-html";

export function sanitizeUserString(value: string): string {
  // Store plain text only. This helps prevent saved XSS if a frontend accidentally renders
  // profile fields unsafely. The frontend should still render user strings as text.
  return sanitizeHtml(value.trim(), {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard"
  });
}
