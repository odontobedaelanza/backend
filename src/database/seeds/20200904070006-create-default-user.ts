import { QueryInterface } from "sequelize";
import { hash } from "bcryptjs";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const passwordHash = await hash("6aG7pUt*L7Kh", 8);
      return Promise.all([
        queryInterface.bulkInsert(
          "Users",
          [
            {
              name: "Revoi",
              email: "contato@revoi.com.br",
              profile: "admin",
              passwordHash,
              companyId: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
              super: true
            }
          ],
          { transaction: t }
        )
      ]);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("Users", {});
  }
};
