import nodeMailer from 'nodemailer'
import dotenv from "dotenv";
dotenv.config();

export default {
    send: (to, message) => {

        let transporter = nodeMailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: false,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            }
        });

        let mailOptions = {
            from: process.env.MAIL_FROM_ADDRESS, // sender address
            to: to, // list of receivers
            subject: 'Test', // Subject line
            text: message, // plain text body
            html: '<b>'+message+'</b>' // html body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    }
}