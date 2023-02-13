import reply from "../Common/reply.js";
import { User } from "../Models/User.js";
import myEvents from "../RunnerEngine/Emitter.js";
import { Token } from "../Models/Token.js";
import Sequelize from "sequelize";

const { Op } = Sequelize;
import _ from "lodash";
import { Authority } from "../Models/Authority.js";
import Validator from "validatorjs";
import { Currency, CurrencyNetwork } from "../Models/Currency.js";
import { ReferralCommission } from "../Models/ReferralCommission.js";
import Helper from "../Common/Helper.js";


// Authority Type
const AUTH_TYPE = {
  m: "maintenance",
  d: "deposit",
  w: "withdraw",
};

function firstError(validation) {
  let first_key = Object.keys(validation.errors.errors)[0];
  return validation.errors.first(first_key);
}

const callMaintenance = async (status) => {
  if (status == "on") {
    await Token.destroy({ where: { user_id: { [Op.ne]: 1 } } }); // Deleting All User Token Except Admin
  }
  myEvents.emit("UNDER_MAINTENANCE", { status: status });
};

// portfolio deposit and withdraw enable
const callPortfolio = async (type, status) => {
  status = status == "on" ? 1 : 0;
  let column = {};
  column[type + "_enable"] = status;
  await Currency.update(column, {
    where: { id: { [Op.gt]: 0 } },
  });
};

const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default {
  async get(req, res) {
    req.user = await User.findByPk(req.user.id);
    const user_info = _.pick(req.user, "name","lname", "email", "mobile", "status");
    return res.json(reply.success("Auth User fetched Successfully", user_info));
  },

  async setAuthority(req, res) {
    var request = req.body;

    let validation = new Validator(request, {
      type: "required|in:maintenance,deposit,withdraw",
      status: "required|in:on,off",
    });

    if (validation.fails()) {
      return res.json(reply.failed(firstError(validation)));
    }

    let type = request["type"];

    // Finding specified Type is available or not
    const [authrty, created] = await Authority.findOrCreate({
      where: { type },
      defaults: {
        status: request["status"],
      },
    });

    // Update Authority Table.
    await Authority.update({ status: request["status"] }, { where: { type } });

    // If Type == maintenance
    if (type == AUTH_TYPE.m) {
      callMaintenance(request["status"]);
    }

    // If Type == deposit || withdraw
    if (type == AUTH_TYPE.d || type == AUTH_TYPE.w) {
      callPortfolio(type, request["status"]);
    }

    return res.json(
      reply.success(
        capitalize(type) + " " + request["status"] + " Successfully"
      )
    );
  },

  async getAuthority(req, res) {
    let data = await Authority.findAll();
    return res.json(reply.success("Data fetched Successfully", data));
  },

  async getReferIncome(req, res) {

    var pagination = Helper.getPaginate(req, 'created_at');


    if (req.query?.referral_code) {


      var condition = { where: { referral_code: req.query.referral_code }, attributes: { exclude: ['id', 'attached_id', 'commission_type', 'updated_at'] } };

      let total_count = await ReferralCommission.count(condition);
      condition = Object.assign(condition, pagination);
      var result = await ReferralCommission.findAll(condition);

      result = reply.paginate(
        pagination.page,
        result,
        pagination.limit,
        total_count
      );

      return res.send(reply.success("Fetched Successfully!!", result));
    }

    var condition = { where: { referral_by: req.user.referral_code } };

    let total_count = await User.count(condition);
    condition = Object.assign(condition, pagination);
    var result = await User.findAll(condition);

    result = reply.paginate(
      pagination.page,
      result,
      pagination.limit,
      total_count
    );


    return res.send(reply.success("Fetched Successfully!!", result));
  }
};
