const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken")
async function authMiddlware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.ststus(401).json({
            message: "Unauthorized access, token is Missing",
            status: "Failed"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await userModel.findById(decoded.userId);
        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, token is Invalid",
            status: "Failed"
        })
    }
}
async function authSystemUserMiddleWare(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.ststus(401).json({
            message: "Unauthorized access, token is Missing",
            status: "Failed"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await userModel.findById(decoded.userId).select("+SystemUser");
        if (!user) {
            return res.ststus(403).json({
                message: "Forbidden access, not a system user",
                status: "Failed"
            })
        }
        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, token is Invalid",
            status: "Failed"
        })
    }
}



module.exports = {
    authMiddlware, authSystemUserMiddleWare
}