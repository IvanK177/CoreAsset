import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";

@Resolver("User")
export class UsersResolver {
  constructor(private usersService: any) {}

  @Query()
  async users(
    @Args("skip", { nullable: true, type: () => Int }) skip?: number,
    @Args("take", { nullable: true, type: () => Int }) take?: number,
    @Args("search", { nullable: true }) search?: string,
    @Args("department", { nullable: true }) department?: string,
  ) {
    return this.usersService.findAll({ skip, take, search, department });
  }

  @Query()
  async user(@Args("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation()
  async createUser(
    @Args("employeeId") employeeId: string,
    @Args("fullName") fullName: string,
    @Args("email") email: string,
    @Args("department", { nullable: true }) department?: string,
    @Args("position", { nullable: true }) position?: string,
  ) {
    return this.usersService.create({
      employeeId,
      fullName,
      email,
      department,
      position,
    });
  }

  @Mutation()
  async updateUser(
    @Args("id") id: string,
    @Args("fullName", { nullable: true }) fullName?: string,
    @Args("email", { nullable: true }) email?: string,
    @Args("department", { nullable: true }) department?: string,
    @Args("position", { nullable: true }) position?: string,
  ) {
    const data: any = {};
    if (fullName) data.fullName = fullName;
    if (email) data.email = email;
    if (department) data.department = department;
    if (position) data.position = position;
    return this.usersService.update(id, data);
  }

  @Mutation()
  async deleteUser(@Args("id") id: string) {
    return this.usersService.delete(id);
  }
}