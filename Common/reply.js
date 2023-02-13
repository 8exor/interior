export default {
    success: (message, data = null, extra = null) => {
        var result = {
            status_code: "1",
            status_text: "success",
            message: message,
        };

        if (data != null || data == []) {
            // console.log({data})
            result['data'] = data;
        }

        if (extra != null) {
            Object.assign(result, extra);
        }

        return result;
    },

    failed: (message) => {
        return {
            status_code: "0",
            status_text: "failed",
            message: message,
        }
    },

    unauth: () => {
        return {
            status_code: "0",
            status_text: "failed",
            message: 'Unauthenticated',
        }
    },

    notfound: () => {
        return {
            status_code: "0",
            status_text: "failed",
            message: 'Not Found',
        }
    },

    groupBy: (key, array) => {
        var result = {};
        array.forEach(element => {
            if (result[element[key]] !== undefined) {
                result[element[key]].push(element);
            }
            else {
                result[element[key]] = [element];
            }
        });
        return result;
    },

    limitGroupBy: (key, array, limit) => {
        var result = {};
        array.every(element => {
            if (Object.keys(result).length == limit) {
                return false;
            }
            if (result[element[key]] !== undefined) {
                result[element[key]].push(element);
            }
            else {
                result[element[key]] = [element];
            }
            return true;
        });
        return result;
    },

    paginate: (page, array_data, per_page, total_count) => {
        page = parseInt(page) ?? 1;
        per_page= parseInt(per_page)?? 1 

        // console.log({page,per_page,total_count})
        const reminder = total_count % per_page;
        const total_page = parseInt(total_count / per_page);
        const last_page = reminder != 0 ? total_page + 1 : total_page;
        const from = ((page- 1) * per_page   + 1 )
        const to = ((page * per_page) < total_count) ? (page * per_page) : total_count

        // console.log({from,to});
        
        return {
            current_page: page,
            data: array_data,
            from,
            to,
            last_page: last_page,
            per_page: per_page,
            total: total_count
        };
        // current_page ,data, from, last_page, per_page, to, total
    }

};

//   const url = req.protocol + '://' + req.headers.host + req.originalUrl;