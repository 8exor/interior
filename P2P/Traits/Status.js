export default {
    success: (message, data = null, extra = null) => {
        var result = {
            status_code: "1",
            status_text: "success",
            message: message,
        };

        if (data != null || data == []) {
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

}