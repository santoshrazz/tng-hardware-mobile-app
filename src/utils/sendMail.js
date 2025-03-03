import nodemailer from 'nodemailer'
import Mailgen from 'mailgen';
async function sendMail(userEmail, messageParams,) {
    try {
        let config = {
            service: "gmail",
            auth: {
                user: process.env.GMAIL_APP_NAME,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        }
        const transporter = nodemailer.createTransport(config);


        var mailGenerator = new Mailgen({
            theme: 'default',
            product: {
                // Appears in header & footer of e-mails
                name: 'Murga Shop',
                link: 'https://mailgen.js/'
                // Optional product logo
                // logo: 'https://mailgen.js/img/logo.png'
            }
        });

        var email = {
            body: {
                name: messageParams.name,
                intro: 'Welcome to Techify Shop We\'re very excited to have you on board.',
                action: {
                    instructions: messageParams?.message || 'To get started with Techify Shop, Please enter the OTP on the website:',
                    button: {
                        color: '#2cc777', // Optional action button color
                        text: messageParams.OTP,
                        link: 'https://localhost:3000/user/verify' // Fixed link
                    }
                },
                outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
            }
        };
        var emailBody = mailGenerator.generate(email);

        let message = {
            from: "santoshrajbgp11@gmail.com",
            to: userEmail,
            subject: "Verify your account",
            html: emailBody
        }
        const info = await transporter.sendMail(message);
        return info.messageId;
    } catch (error) {
        console.log(`Error in sending email`, error.message);
    }
}
export default sendMail