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
  clientId: "",
  clientSecret: "",
  callbackUrl: "http://localhost:4321/api/auth/callback"
};
function isOwner(username) {
  return username.toLowerCase() === SITE.github.owner.toLowerCase();
}

export { AUTH as A, SITE as S, isOwner as i };
