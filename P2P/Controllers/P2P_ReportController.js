import { P2P_Order } from "../Models/P2P_Order.js";
import status from "../Traits/Status.js";
import Sequelize from "sequelize";
import Pagination from "../Common/Pagination.js";
import _ from 'lodash';
const { Op } = Sequelize;
import { User } from "../../Models/User.js";


function firstError(validation) {
    let first_key = Object.keys(validation.errors.errors)[0];
    return validation.errors.first(first_key);
}



async function getP2p_Report(req, res) {

    try {
        let whereCondition = {};
        const includecondition = [];
        const request = req.query;

        if (request.order_type) {
            whereCondition.order_type = request.order_type
        }

        if (request.amount) {
            whereCondition.min_quantity = { [Op.eq]: [request.amount] };

        }

        if (request.Status) {
            whereCondition.status = { [Op.eq]: [request.Status] }

        }

        if (request.with_currency) {
            whereCondition.with_currency = { [Op.eq]: [request.with_currency] }

        }

        if (request.name) {
            includecondition.push({ model: User, where: { name: { [Op.eq]: request.name } } });

        }

        if (request.email) {
            includecondition.push({ model: User, where: { email: { [Op.eq]: request.email } } });

        }


        let orderList = await P2P_Order.findAll({ where: whereCondition, include: includecondition });


        let total_count = _.size(orderList);

        const pagination = Pagination.getPaginate(req);

        let result = Pagination.paginate(pagination.page, orderList, pagination.limit, total_count);

        return res.json(status.success('orders fetched successfully', result))



    } catch (error) {
        return console.log(error)
    }



}


export default {
    getP2p_Report,

}



