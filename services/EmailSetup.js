const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: "./config.env" })

const mailgun = require('mailgun-js');
const db = require('../Utils/db');

const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
});

class EmailSetup {

    constructor() { }

    static sendEmail(mail) {
        return new Promise((resolve, reject) => {
            const data = {
                from: 'for <news@TECHSIMBA.com>',
                to: mail.to,
                subject: mail.subject,
                html: mail.message,
                bcc: 'seema@techsimba.in',
                // cc: 'seema@techsimba.in'    
            };

            mg.messages().send(data, (error, body) => {
                if (error) {
                    console.error('Mailgun error:', error);
                    return reject(error);
                }
                resolve(body);
            });
        });
    }

    static async emailTemplate(id) {
        return new Promise((resolve, reject) => {

            const query = `
                SELECT
                    email.*
                FROM email
                where email.id=?`;


            db.query(query, [id], (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results[0]);
            });
        });
    }


    static async RequestDemo(data, email_id) {

        const template = await this.emailTemplate(email_id);
        // return res.status(200).json({template});
        var msz = template.message.replace('{company_name}', data.CompanyName);
        msz = msz.replace('{member_name}', data.Name);
        msz = msz.replace('{company_contact}', data.Number);
        msz = msz.replace('{company_website}', data.Website);
        msz = msz.replace('{member_mail}', data.Email);

        const mailOptions = {
            to: 'ts.ankitpandey@gmail.com',
            subject: template.subject,
            message: msz,
            attachments: []
        };
        return this.sendEmail(mailOptions);


    }

    static async ContactUs(data, email_id) {

        const template = await this.emailTemplate(email_id);

        var msz = template.message.replace('{name}', data.name);
        msz = msz.replace('{Email}', data.email);
        msz = msz.replace('{contact}', data.contactnumber);
        msz = msz.replace('{write_something}', data.writesomething);

        const mailOptions = {
            to: 'ts.ankitpandey@gmail.com',
            subject: template.subject,
            message: msz,
            attachments: []
        };
        return this.sendEmail(mailOptions);


    }

    static async O2OcontactUs(data, email_id) {


        const template = await this.emailTemplate(email_id);

        var msz = template.message.replace('{company_name}', data.companyName);
        msz = msz.replace('{name}', data.name);
        msz = msz.replace('{contact}', data.contactNumber);
        msz = msz.replace('{write_something}', data.message);
        msz = msz.replace('{Email}', data.email);

        const mailOptions = {
            to: 'ts.chandra111@gmail.com',
            subject: template.subject,
            message: msz,
            attachments: []
        };
        return this.sendEmail(mailOptions);


    }

    static async O2OPricing(data, email_id) {

        // console.log(email_id,data);
        const template = await this.emailTemplate(email_id);

        var msz = template.message.replace('{company_name}', data.company_name);
        msz = msz.replace('{name}', data.contact_person,);
        msz = msz.replace('{contact}', data.contact_number);
        msz = msz.replace('{date}', data.event_date);
        msz = msz.replace('{deligates}', data.num_delegates,);
        msz = msz.replace('{Email}', data.contact_email,);


        const mailOptions = {
            to: 'ts.chandra111@gmail.com',
            subject: template.subject,
            message: msz,
            attachments: []
        };
        return this.sendEmail(mailOptions);


    }








}

module.exports = EmailSetup;
