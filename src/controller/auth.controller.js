const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken")
const bcrypt= require("bcryptjs")
const mongoose=require("mongoose")
const emailService=require("../services/email.service");
const tokenBlackListModel = require("../models/blackList.model");

/*
Register Controller
Post api/auth/register
 */
async function userRegisterController(req, res) {

    const { email, password, name } = req.body
    const isExists = await userModel.findOne({
        email: email
    })
    if (isExists) {
        return res.status(422).json({
            message: "User already exists ",
            status: "Failed"
        })
    }
    const user = await userModel.create({
        email, password, name
    })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "3d" });
    res.cookie("token", token)
    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

    await  emailService.sendRegistrationEmail(user.email,user.name);



}
/*
Login Controller
api/auth/login
 */
async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    const isUser = await userModel
      .findOne({ email })
      .select("+password");

    if (!isUser) {
      return res.status(401).json({
        message: "Invalid Credential",
        status: "Failed",
      });
    }

    const isMatch = await bcrypt.compare(password, isUser.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid Credential",
        status: "Failed",
      });
    }

    const token = jwt.sign(
      { userId: isUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "3d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });

    return res.status(200).json({
      user: {
        _id: isUser._id,
        email: isUser.email,
        name: isUser.name,
      },
      token,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
}


async function userLogoutController(req,res){
  const token= req.cookies.token || req.headers.authorization?.split(" ")[1];
  if(!token){
    return res.status(200).json({
      message:"user logged out sucessfully"
    })
  }

    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })

}
module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}