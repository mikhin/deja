export function formatHomeRelativePath(directory: string, home: string): string {
  if (home === "" || !directory.startsWith(home)) return directory;

  const rest = directory.slice(home.length);

  return rest === "" || rest.startsWith("/") ? `~${rest}` : directory;
}
