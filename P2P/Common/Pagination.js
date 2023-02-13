export default {
    getPaginate: (req, order_by = null, order_in = 'desc') => {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const per_page = req.query.per_page ? parseInt(req.query.per_page) : 5;
        const offset = (page - 1) * per_page;

        var data = { offset: offset, limit: per_page, page: page }

        if (order_by != null) {
            data['order'] = [
                ['id', order_in]
            ];
        }

        return data;
    },

    paginate: (page, array_data, per_page, total_count) => {
        const reminder = total_count % per_page;
        const total_page = parseInt(total_count / per_page);
        const last_page = reminder != 0 ? total_page + 1 : total_page;
        const to_page = (array_data.length != 0) ? (page * per_page) : null;
        return {
            current_page: page,
            data: array_data,
            from: (array_data.length != 0) ? ((page - 1) * per_page) + 1 : null,
            to: (to_page > total_count) ? total_count : to_page,
            last_page: last_page,
            per_page: per_page,
            total: total_count
        };

    }
}
