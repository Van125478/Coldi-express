export const paths = {
  home: "/",
  shipments: "/tim-chuyen-hang",
  publish: "/dang-don",
  about: "/ve-chung-toi",
  shipperSolution: "/giai-phap/chu-hang",
  carrierSolution: "/giai-phap/nha-xe",
  login: "/dang-nhap",
  register: "/dang-ky",
  platform: "/nen-tang",
  legacy: "/phien-ban-cu",
  motionLab: "/motion-lab",
  transitionLab: "/transition-lab",
} as const;

export type AuthAction = "publish" | "claim" | "account" | "general";

const authActions: readonly AuthAction[] = ["publish", "claim", "account", "general"];

export function parseAuthAction(value: string | null): AuthAction {
  if (value && authActions.includes(value as AuthAction)) {
    return value as AuthAction;
  }
  return "general";
}

export function authPath(action: AuthAction, next?: string) {
  const params = new URLSearchParams();
  if (action !== "general") {
    params.set("action", action);
  }
  if (next) {
    params.set("next", next);
  }
  const query = params.toString();
  return query ? `${paths.login}?${query}` : paths.login;
}
