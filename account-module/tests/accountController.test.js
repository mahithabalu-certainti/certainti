const request = require("supertest");
const initExpressServer = require("../src/servers/expressServer");
const constant = require("../src/utils/constant");
const configurations = require("../src/config/config");
const services = configurations.getInstance().getServices();
const accountServices = services.accountServices;

const { app } = initExpressServer();

jest.mock("../src/services/accountService", () => {
  return jest.fn().mockImplementation(() => {
    return {
      accountsById: jest.fn(),
    };
  });
});

describe("Account Controller", () => {
  describe("accounts", () => {
    it("should return accounts successfully", async () => {
      const mockAccounts = {
        statusCode: constant.SUCCESS,
        message: constant.SUCCESS_MESSAGE,
        data: {
          accounts: [
            {
              rid: 2,
              account_name: "Test Account",
            },
          ],
          total: 1,
        },
      };

      const fetchAccounts = await accountServices.accountsById;
      fetchAccounts.mockResolvedValueOnce(mockAccounts);

      const res = await request(app)
        .get("/api/accounts")
        .set("authorization", "Bearer token38938");

      expect(res.status).toBe(constant.SUCCESS);
      expect(res.body.statusCodeValue).toBe(constant.SUCCESS_MESSAGE);
      expect(res.body.data.accounts).toEqual(mockAccounts.data.accounts);
    });

    it("should return unauthorized on invalid or empty token", async () => {
      const res = await request(app).get("/api/accounts");
      console.log("Response val", res);
      expect(res.status).toBe(constant.UNAUTHORIZED);
      expect(res.body.data).toBeUndefined();
    });
  });
});
