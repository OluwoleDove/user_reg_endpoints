import express from 'express';
import User from '../models/userModel';
import Usercode from '../models/tokenModel';
import cors from 'cors';
import { isAuth, isAdmin, getToken } from '../util';
import bcrypt from 'bcryptjs';
import expressAsyncHandler from 'express-async-handler';
const nodemailer = require('nodemailer');
const router = express.Router();
router.use(cors());

let verify_code = "";

function gen_rand_str(length) {
    var result = '';
    var _chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var char_len = _chars.length;
    for ( var i = 0; i < length; i++ ) {
      result += _chars.charAt(Math.floor(Math.random() * char_len));
   }
   return result;
}

function split_usercode(user_code){
    let email_and_code = [];
    let in_array = user_code.split("-");
    let my_user_code = in_array[in_array.length - 1];
    in_array.pop();
    let user_email = in_array.join("");
    email_and_code.push(user_email);
    email_and_code.push(my_user_code);

    return email_and_code;
}

//Checked
router.post('/signin', expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ 
        email: req.body.email
    });
    if (user) {
        if (bcrypt.compareSync(req.body.password, user.password) && user.isVerified == true) {
            res.send({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                token: getToken(user),
            });
            return;
        }
        /*else if (bcrypt.compareSync(req.body.password, user.newpassword) && user.isVerified == true) {
            res.send({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                token: getToken(user),
            });
            return;
        }*/
    }else{
        res.status(401).send({ message: 'Invalid email or password' });
    }
    })
);

//checked
router.post('/checkusername', expressAsyncHandler(async (req, res) => {
    let checked = "";
    if (req.body.username.length < 3)
        checked = "3-16 characters please.";
    else if(isNaN(parseInt(req.body.username[0]))){
        const findUser = await User.findOne({ username: req.body.username });
  
        if(!findUser){
            checked = "Bravo! " + req.body.username + " is available.";
        }
        else{
            checked = req.body.username + " is taken.";
        }
    }
    else
        checked = "Username must begin with a letter"; 
  
    res.send({ message: checked });
}));

//Checked
router.post('/register', expressAsyncHandler(async (req, res) => {
    verify_code = gen_rand_str(23);
    console.log(verify_code);
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password),
        newpassword: "",
        country: req.body.country,
        ipAddress: req.body.ipAddress,
        isVerified: false,
        isBusiness: false, //False at the point of registration
        businessName: req.body.businessName,
        address: req.body.address,
        isAdmin: false
    });
    const prep_verify = new Usercode({
        user_id: user._id,
        token: bcrypt.hashSync(verify_code)
    });

    if(user.email == '' || user.password == '' || user.username == ''){
        res.status(401).send('All fields are required');
    }
    else{
        const newUser = await user.save();
        const save_prep_verify = await prep_verify.save();
        if (newUser && save_prep_verify) {
            //Mail the user
            const transporter = nodemailer.createTransport({
                host: 'mail.mybrand.com',
                port: 465,
                auth: {
                    user: 'info@mybrand.com',
                    pass: ''
                }
            });

            const mailOptions = {
                from: 'info@mybrand.com',
                to: newUser.email,
                subject: 'ACTIVATION MESSAGE FORM mybrand',
                text: 'Your sign up was successful, click this link https://www.mybrand.com/' +
                user.email + "-" + { verify_code } + "/activate" + ' to activate your account.'
            };

            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                }else{
                    //console.log('Email sent: ' + info.response);
                    res.status(200).json({ msg: "User " + newUser.username + " created successfully." });
                }
            });
            //////////////////////////////////////////////////////////////////////
            res.status(200).json({ msg: "User " + newUser.username + " created successfully." });
        } else {
            res.status(500).json({ msg: 'Error creating user.' });
        }
    }                        
}));
  

router.put('/:usercode/activate', expressAsyncHandler(async (req, res) => {
    let in_code_array = split_usercode(req.params.usercode);
    const user = await User.findOne({ 
        email: in_code_array[0]
    });
    const code_check = await Usercode.findOne({
        user_id: user._id
    })
    if(user && code_check){
        if(bcrypt.compareSync(in_code_array[1], code_check.token)){
            code_check.token = " " || code_check.token;
            user.isVerified = true || user.isVerified;
            const verify = await code_check.save();
            const activate = await user.save(); 
                      
            if (verify && activate) {
                res.send({
                    _id: user.id,
                    username: user.username,
                    email: user.email
                })
            }
        }
    }   
}));


router.post('/:email/getpasswordresetlink', expressAsyncHandler(async (req, res) => { //Get Password Reset Link
    const user = await User.findOne({ email: req.params.email });
    verify_code = gen_rand_str(23);
    console.log(verify_code);
    if(user){
        const time_check = await Usercode.findOne({ user_id: user._id });
        if(time_check){
            res.status(200).json({ msg: "Not so fast, try again in 30 minutes." });
        }
        else if(!time_check){
            const prep_verify = new Usercode({
                user_id: user._id,
                token: bcrypt.hashSync(verify_code)
            });
            const save_prep_verify = await prep_verify.save();
            if(save_prep_verify){
                const transporter = nodemailer.createTransport({
                    host: 'mail.mybrand.com',
                    port: 465,
                    auth: {
                        user: 'info@mybrand.com',
                        pass: ''
                    }
                });
        
                const mailOptions = {
                    from: 'info@mybrand.com',
                    to: user.email,
                    subject: 'mybrand - PASSWORD RESET LINK',
                    text: 'Hello, we received your request to reset your password. Click this link https://www.mybrand.com/' +
                            user.email + "-" + { verify_code } + '/passwordreset' + ' to reset your passsord. \n\n' +
                            '<strong>This link expires in 30 seconds.</strong> \n\nIf you did not initiate this process, ' + 
                            'please contact info@mybrand.com. Thanks!'
                };
        
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        console.log(error);
                    }else{
                        //console.log('Email sent: ' + info.response);
                        //res.status(200).json({ msg: "Password reset link sent." });
                    }
                });
            }
            res.status(200).json({ msg: "Password reset link sent." });
        }
    }
    else {
        res.status(404).send({ msg: "We don't have any record for this user." });
    }  
}));

router.put('/:usercode/passwordreset', expressAsyncHandler(async (req, res) => { //Reset Password
    let in_code_array = split_usercode(req.params.usercode);
    const user = await User.findOne({ 
        email: in_code_array[0]
    });
    const code_check = await Usercode.findOne({
        user_id: user._id
    })
    if(user && code_check){
        if(bcrypt.compareSync(in_code_array[1], code_check.token)){
            code_check.token = " " || code_check.token;
            const nullify = await code_check.save();
            if (nullify) {
                res.status(200).json({ msg: "Password reset request confirmed." });
            }
        }
    }   
    else {
        res.status(404).send({ msg: "We don't have any record for this user." });
    }  
}));

//Checked
router.put('/:id/resetpassword', expressAsyncHandler(async (req, res) => { //Password reset
    const user = await User.findOne({ _id: req.params.id });
    if(user){
        user.newpassword = bcrypt.hashSync(req.body.password) || user.newpassword;
        const passwordreset = await user.save();
        passwordreset ? res.status(200).json({ msg: "Password changed successfully." }) : "";
    }
    else {
        res.status(404).send({ msg: "We don't have any record for this user." });
    }  
}));


router.get("/admin", async (req, res) => {
    try {
        const user = new User({
            username: 'mybrand',
            email: 'info@mybrand.com',
            phone_number: '08169121716',
            password: '1234',
            newpassword: '',
            country: 'Nigeria',
            ipAddress: req.ip,
            isVerified: false,
            isBusiness: true,
            isAdmin: true,
            verify_code: '1bcd4r',
            isVerified: true
        });
    const newUser = await user.save();
    res.send(newUser);
    } catch (error) {
        res.send({ msg: error.message });
    }
});

router.get('/', isAuth, isAdmin, async (req, res) => {
    const user = await User.find({ });
    res.send(user);
});

export default router;