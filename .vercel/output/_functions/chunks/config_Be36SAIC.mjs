const SITE = {
  title: "Kortex",
  tagline: "Second brain",
  description: "Your personal knowledge hub — notes, links, ideas, tasks and files. All in one place, accessible anywhere.",
  github: {
    owner: "curious04",
    repo: "Kortex",
    branch: "main"
  }
};
const AUTH = {
  clientId: process.env.GITHUB_CLIENT_ID ?? "",
  clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  callbackUrl: process.env.AUTH_CALLBACK_URL ?? "http://localhost:4321/api/auth/callback"
};
function isOwner(username) {
  return username.toLowerCase() === SITE.github.owner.toLowerCase();
}

export { AUTH as A, SITE as S, isOwner as i };
