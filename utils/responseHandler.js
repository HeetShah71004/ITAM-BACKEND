// utils/responseHandler.js
export const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const sendError = (res, message = "Error", statusCode = 500, error = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        error: error ? error.message : null,
    });
};
