import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Resolver,
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
} from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME, FORGOT_PASSWORD_REFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  // change password
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { req, em, redis }: MyContext
  ): Promise<UserResponse> {
    //validate the new password is good
    if (newPassword.length <= 2) {
      return {
        errors: [
          { field: "newPassword", message: "password is too short" },
        ],
      };
    }
    // check token from redis to get the userId
    const userId = await redis.get(FORGOT_PASSWORD_REFIX + token);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }
    // look up user with userId
    const found = await em.findOne(User, { id: Number(userId) });
    if (!found) {
      return {
        errors: [
          {
            field: "token",
            message: "user not exist",
          },
        ],
      };
    }
    found.password = await argon2.hash(newPassword);
    // save to db, user.updatedAt will auto update
    await em.persistAndFlush(found);
    // log in user after changing password
    req.session.userId = found.id;
    return { user: found };
  }

  // forgot password with nodemailer
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ): Promise<boolean> {
    const found = await em.findOne(User, { email });
    if (!found) {
      // email not in db
      // avoid fishing emails through your db
      return true;
    }
    // create a token with uuid
    const token = v4();
    // store the token and userId in redis
    await redis.set(
      FORGOT_PASSWORD_REFIX + token,
      found.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days
    sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    return true;
  }

  // check the user logged in, auto log-in user stored in session
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }
    const found = await em.findOne(User, { id: req.session.userId });
    return found;
  }

  // register a new user
  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UsernamePasswordInput)
    options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    // simple validations on username, email and password
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    const hashedPassword = await argon2.hash(options.password);
    const newUser = em.create(User, {
      username: options.username,
      email: options.email,
      password: hashedPassword,
    });
    // check if username is unique
    try {
      await em.persistAndFlush(newUser);
    } catch (err) {
      if (
        err.code === "23505" ||
        err.detail.includes("already exists")
      ) {
        return {
          errors: [
            { field: "username", message: "username already taken" },
          ],
        };
      }
    }
    // auto logged in
    req.session.userId = newUser.id;
    return { user: newUser };
  }

  // login
  @Mutation(() => UserResponse)
  async login(
    // @Arg("options") options: UsernamePasswordInput,
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    // check username
    const found = await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!found) {
      return {
        errors: [
          { field: "usernameOrEmail", message: "user not found" },
        ],
      };
    }
    // check password
    const valid = await argon2.verify(found.password, password);
    if (!valid) {
      return {
        errors: [
          { field: "password", message: "password not correct" },
        ],
      };
    }
    // store current user id to session, all resolvers can be access
    req.session!.userId = found.id;
    return {
      user: found,
    };
  }

  // logout
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(`err :`, JSON.stringify(err, null, 2));
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
