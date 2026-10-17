import type { UserDto } from "../auth/userDto.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: UserDto;
    }
  }
}

export {};
