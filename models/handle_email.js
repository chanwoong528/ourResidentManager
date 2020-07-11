var nodemailer = require('nodemailer');
var smtpTransporter = require('nodemailer-smtp-transport');
var mongoose = require('mongoose');
var smtpTransport = nodemailer.createTransport(smtpTransporter({
    service: 'Naver',
    host:'smtp.naver.com',
    auth: {
        user: 'userid@naver.com',     //보내는 분의 메일계정
        pass: 'password'
    }
}));

module.exports =  {
    EmailVerification (email, key) {

        var mailOption = {
            from: '"name"<userid@naver.com>', // 보내는 분의 메일계정
            to: email,                // 받는 분의 메일계정 (여러 개 가능)
            subject: "Hello",
            text: "Hello world?",
            // text: "Hello world?",
            html: "<b>verification code: </b>" + key // key 추가
        }

        smtpTransport.sendMail(mailOption, (err, res) => { // 메일을 보내는 코드
            if(err){
                console.log(err)
                throw err
            }
            console.log("mail sent!")
        });
    }
}
