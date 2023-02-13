import status from "../Traits/Status.js";
import Validator from 'validatorjs';
import { P2P_Chat} from "../Models/P2P_Chat.js";
import Sequelize from "sequelize";
import path from "path";
import { User } from "../../Models/User.js";
import { P2P_Trade } from '../Models/P2P_Trade.js'
import Pagination from "../Common/Pagination.js";
import { startOfDay, endOfDay } from "date-fns";
import _ from 'lodash';
import { DATE } from "sequelize";

const __dirname = path.resolve();
const { Op } = Sequelize;


function firstError(validation) {
    let first_key = Object.keys(validation.errors.errors)[0];
    return validation.errors.first(first_key);
}

export default {

    async get_chat(req, res) {
        try {
            const where_cond = {};
            const include_where = {};
            const request = req.query;
            let date = req.query.date;
            let today = new Date(date);

            if (request.match_id) {
                where_cond.match_id = {
                    [Op.eq]: [request.match_id]
                }

            }

            if (request.date) {
                where_cond.created_at = {
                    [Op.between]: [startOfDay(today), endOfDay(today)]
                }

            }

            if (request.message) {
                where_cond.message = {
                    [Op.substring]: [request.message]
                }

            }

            if (request.name) {
                include_where.name = {
                    [Op.substring]: [request.name]
                }
            }

            if (request.email) {
                include_where.email = {
                    [Op.substring]: [request.email]
                }
            }

            const pagination = Pagination.getPaginate(req);
            const page = pagination.page
            const limit = pagination.limit

            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            let list = await P2P_Chat.findAll({ where: where_cond, include: [{ model: User, attributes: ['name', 'email'], where: include_where }], order: [['id', 'DESC']] });

            let result1 = list.slice(startIndex, endIndex);
            let total_count = _.size(list);


            let result = Pagination.paginate(page, result1, limit, total_count);


            return res.json(status.success("messages feched", result))
        } catch (error) {
            console.log(error)
            return res.json(status.failed("there is some error in fetching P2P_Chathistory"))
        }
    },

    async list(req, res) {
        var chatData = {
            match_id: 2,
        }

        let validation = new Validator(chatData, {
            'match_id': 'required',
        });

        if (validation.fails()) {
            return res.json(status.failed(firstError(validation)));
        }

        await P2P_Chat.findAll({
            where: {
                match_id: req.query.match_id
            }
        }).then(async data => {
            return res.json(status.success('Message Fetch Successfully', data));
        }).catch(err => {
            res.status(500).send({
                message: "Error occurred while fetch the Chat."
            });
        });


    },
}