import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";
import { hashPassword, comparePassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";

const sendConfirmationEmail = async (userEmail, token) => {
  try {
    // Create a SMTP transporter object
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "vipunsanjana34@gmail.com",
        pass: "i r c q y k p o g w s s f e m j",
      },
    });

    // Construct the confirmation link
    const confirmationLink = `http://localhost:3000/login?token=${token}`;

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"VI Solutions" <visolution531@gmail.com>',
      to: userEmail,
      subject: "Registration Confirmation",
      html: `<p>Thank you for registering with VI Solutions!</p><p>Please click <a href="${confirmationLink}">here</a> to confirm your email address.</p>`,
    });

    // Log message URL for development
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;

    // Check if all required fields are provided
    if (!name || !email || !password || !phone || !address || !answer) {
      return res.status(400).send({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create a token for email confirmation
    const token = JWT.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Save the user to the database
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      answer,
    });

    await newUser.save();

    // Send confirmation email
    await sendConfirmationEmail(email, token);

    res.status(201).send({ message: "User registered successfully. Please check your email for confirmation." });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

export const confirmEmailController = async (req, res) => {
  try {
    const { token } = req.query;

    // Verify token
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    // Update user's email confirmation status
    await userModel.updateOne({ email }, { $set: { confirmed: true } });

    res.redirect("http://localhost:3000/login?confirmed=true");
  } catch (error) {
    console.error("Error confirming email:", error);
    res.redirect("http://localhost:3000/login?confirmed=false");
  }
};


//POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation
    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    //check user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registerd",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid Password",
      });
    }
    //token
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).send({
      success: true,
      message: "login successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

//forgotPasswordController

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email) {
      res.status(400).send({ message: "Emai is required" });
    }
    if (!answer) {
      res.status(400).send({ message: "answer is required" });
    }
    if (!newPassword) {
      res.status(400).send({ message: "New Password is required" });
    }
    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

//test controller
export const testController = (req, res) => {
  try {
    res.send("Protected Routes");
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
};

//update prfole
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);
    //password
    if (password && password.length < 6) {
      return res.json({ error: "Passsword is required and 6 character long" });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Update profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updateing Order",
      error,
    });
  }
};

export const getAllUsersController = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await userModel.find();

    // Send the users as a response
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      users: users
    });
  } catch (error) {
    // Handle errors
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};










export const deleteUserController = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if the user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete the user
    await userModel.findByIdAndDelete(userId);

    // Send a success response
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
