import reply from "../../Common/reply.js";
import NewsBoard from "../Models/NewsBoard.js";
import Validator from "validatorjs";
import helper from "../../Common/Helper.js"
import { Op } from 'sequelize';

function firstError(validator) {
    let first_key = Object.keys(validator.errors.errors)[0];
    return validator.errors.first(first_key);
}

const create = async (req, res) => {
    var request = req.body;
    let validator = new Validator(request, {
        'title': 'required|min:2',
        'miniDescription': 'required',
        'description': 'required',
        'social': 'required',
    });
    if (validator.fails()) { return res.send(reply.failed(firstError(validator))) }
    try {
        await NewsBoard.create(request);
        return res.send(reply.success("News Added Successfully!!"));
    } catch (error) {
        return res.send(reply.failed("Server is busy right now, Please try it later!!"));
    }
}

const get = async (req, res) => {
    try {
        let pagination = helper.getPaginate(req, "id");
        const total = await NewsBoard.count();
        const result = await NewsBoard.findAll(pagination)
        let result1 = reply.paginate(
            pagination.page,
            result,
            pagination.limit,
            total
        )
        return res.send(reply.success("News Fetched Successfully!!", result1));
    } catch (error) {
        return res.send(reply.failed("Unable to fetch right now!!"));
        // return res.status(400).json({ error: error })
    }
}
const getbyId = async (req, res) => {
    let q = req?.query?.post;
    try {
        const result = await NewsBoard.findOne({ where: { id: q } })
        const top = await NewsBoard.findAll({
            order: [['id', 'DESC']], limit: 5
        })

        return res.send(reply.success("News Fetched Successfully!!", { result, top }));
    } catch (error) {
        return res.send(reply.failed("Unable to fetch right now!!"));
    }
}


const getNews = async (req, res) => {

    let pagination = helper.getPaginate(req, "id");
    const total = await NewsBoard.count();
    const result = await NewsBoard.findAll(pagination)
    let data = result?.map((val) => {
        console.log(req.user.id,val.likedBy,val.likedBy.includes(req.user.id));
        if (val.likedBy.includes(req.user.id)) {
            val.isLiked = 1
        }else{
            val.isLiked = 0
        }
        return val

    })
    let result1 = reply.paginate(
        pagination.page,
        data,
        pagination.limit,
        total
    )
    return res.send(reply.success("News Fetched Successfully!!", result1));
    // } catch (error) {
    //     return res.status(400).json({ error: error })
    // }

}
const like = async (req, res) => {
    let q = req?.query?.post;
    let post = await NewsBoard.findOne({ where: { id: q }, raw: true })
    let likedByArr = (JSON.parse(post?.likedBy));
    let val = likedByArr?.find((val) => {
        if (val == req?.user?.id) {
            return val
        }
    })
    if (val) {
        return res.send(reply.success("Already Liked !!"));
    }
    let sum = parseFloat(post.total_likes) + 1
    let old = JSON.parse(post.likedBy);
    let data = []
    if (old) {
        data = [...old, req?.user?.id]
    }
    if (old == null) {
        data = [req?.user?.id]
    }
    let result = await NewsBoard.update(
        { total_likes: sum, isLiked: 1, likedBy: data },
        {
            where: {
                id: post.id,
            },
        });
    if (result) {
        let UpdateData = await NewsBoard.findOne({ where: { id: q } });
        return res.send(reply.success("News Liked Successfully!!", UpdateData));
    }
    if (!result) {
        return res.send(reply.failed("Getting Some Server Issue!!",));
    }

}

const disLike = async (req, res) => {
    let q = req?.query?.post;
    let post = await NewsBoard.findOne({ where: { id: q }, raw: true })

    if (req.user) {
        let likedByArr = (JSON.parse(post?.likedBy));
        let val = likedByArr?.find((val) => {
            if (val == req?.user?.id) {
                return val
            }
        })
        if (val != undefined) {
            let sum = parseFloat(post.total_likes) - 1
            let old = JSON.parse(post.likedBy);
            const index = old.indexOf(req?.user?.id);
            if (index > -1) {
                old.splice(index, 1);
            }
            let result = await NewsBoard.update(
                { total_likes: sum, isLiked: 0, likedBy: old },
                {
                    where: {
                        id: post.id,
                    },
                })

            if (result) {
                let UpdateData = await NewsBoard.findOne({ where: { id: q } });
                return res.send(reply.success("News disLiked Successfully!!", UpdateData));
            }
            if (!result) {
                return res.send(reply.failed("Getting Some Server Issue!!",));
            }
        }

        if (val == undefined) {
            return res.send(reply.success("you didn't like that post"));
        }
    }
}

export default {
    create,
    get, getNews, like
    , disLike, getbyId
}