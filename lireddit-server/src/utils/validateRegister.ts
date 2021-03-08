import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (options.username.length <= 2) {
    return [{ field: "username", message: "username is too short" }];
  }
  if (options.username.includes("@")) {
    return [{ field: "username", message: "cannot include an @" }];
  }
  if (!options.email.includes("@")) {
    return [{ field: "email", message: "invalid email" }];
  }
  if (options.password.length <= 2) {
    return [{ field: "password", message: "password is too short" }];
  }

  return null;
};
