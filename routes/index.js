const express = require('express');
const nodemailer = require('nodemailer');
const request = require('request');
const fs = require('fs');

//Env variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;


const stripe = require('stripe')(stripeSecretKey);
const SessionId = require('../models/SessionId');


const router = express.Router();


router.get('/', (req, res) => {

    return res.redirect('/servicios');

});


router.get('/nosotros', (req, res) => {

    res.render('home', { us: 'active' });

});


router.get('/contactanos', (req, res) => {

    res.render('contact', { contact: 'active' });

});


router.get('/servicios', (req, res) => {

    let serviceJson = fs.readFileSync('./public/services.json');
    const servicesObj = JSON.parse(serviceJson);

    const basics = servicesObj.services.filter(el => el.basic == true);
    const nonBasics = servicesObj.services.filter(el => el.basic != true);


    res.render('services', { services: 'active' , basics: basics, nonBasics: nonBasics });

});


router.post('/email', (req, res) => {
    
    const captcha = req.body.captcha || req.body['g-recaptcha-response'];

    if (captcha == undefined || captcha == '' || captcha == null) {
        return res.json({"success": false, "msg": "Porfavor completar el captcha"});
    }


    // Secret key
    const captchaSecretKey = process.env.CAPTCHA_SECRET_KEY;

    // Verify URL
    const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${captchaSecretKey}&response=${captcha}&remoteip${req.connection.remoteAddress}`

    // Make request to verify URL
    request(verifyUrl, (err, response, body) => {

        body = JSON.parse(body);

        // If not successful
        if (body.success !== undefined && !body.success) {
            return res.json({"success": false, "msg": "Captcha fallado"});
        }

        // If successful

        try {
        
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'MagicHandsEmailer@gmail.com',
                    pass: 'MagicHands543534532'
                }
            });
        
            const mailOptions = {
                from: 'MagicHandsEmailer@gmail.com',
                to: 'sel_go86@yahoo.com',
                subject: `Mensaje de ${req.body.name}`,
                text: `Nombre: ${req.body.name}, \nNumero: ${req.body.number}, \n\nMensaje: ${req.body.message}`
            };
        
            transporter.sendMail(mailOptions, function(err, info){
                if (err) {
                    console.log(err)
                    return res.json({"success": false, "msg": "Perdon, hubo un error"});
                }
            });
    
            return res.json({"success": true, "msg": "Mensaje Enviado!"});
    
        } catch (error) {
            return res.json({"success": false, "msg": "Perdon, hubo un error"});
        }
    });
});



router.post('/purchase', async (req, res) => {

    if (req.body.purchase_info && req.body.purchase_info.id) {

        try {

            async function createSession() {

                let serviceJson = fs.readFileSync('./public/services.json');
                let servicesObj = JSON.parse(serviceJson).services;
            
    
                const serviceItem = servicesObj.find(item => item.id == req.body.purchase_info.id);


                if (!serviceItem) {
                    return res.status(500).end();
                }

                if (req.body.purchase_info.people && req.body.purchase_info.duration) {

                    if (req.body.purchase_info.duration <= 0 || req.body.purchase_info.duration > 2 || req.body.purchase_info.people > 6 || req.body.purchase_info.people <= 0) {
                        return res.status(500).end();
                    }

                    if (typeof(req.body.purchase_info.email) != "string" || typeof(req.body.purchase_info.name) != "string") {
                        return res.status(500).end();
                    }

                    let productName;
                    let productPrice;
    
                    productName = `${serviceItem.name} (${req.body.purchase_info.duration}hrs.)`
                    productPrice = serviceItem.price * req.body.purchase_info.duration;
    
                    const newPriceRounded = Math.round(productPrice * 100)
    
            
                    const product = {
        
                        price_data: {
                            currency: 'mxn',
                            product_data: {
                                name: productName
                            },
                            unit_amount: newPriceRounded,
                        },
                        quantity: req.body.purchase_info.people
                    };
    
            
                    async function getSession() {

                        try {

                            const session = await stripe.checkout.sessions.create({
                                payment_method_types: ['card'],
                                line_items: [
                                    product
                                ],
                                mode: 'payment',
                                success_url: 'http://127.0.0.1:3000/success?session_id={CHECKOUT_SESSION_ID}',
                                cancel_url: 'http://127.0.0.1:3000/cancel',
                                metadata: {
                                    // atHome: true,
                                    serviceId: serviceItem.id,
                                    quantity: req.body.purchase_info.people,
                                    duration: req.body.purchase_info.duration,
                                    customerEmail: req.body.purchase_info.email,
                                    customerName: req.body.purchase_info.name
                                }
                            });
            
                            res.json({session_id: session.id});            
                
                        } catch(err){
                            console.log(err);
                            res.status(500).end();
                        }
            
                    }
        
                    getSession();


                } else {
                    res.status(404).end();
                }
        
            }
        
            createSession();    


        } catch (err) {
            console.error(err);
            res.status(404).end();
        }

    } else {
        res.status(404).end();
    }

});



router.get('/success', (req, res) => {
    res.redirect('/');
});


router.get('/success', (req, res) => {

    if (req.query.session_id) {
        stripe.checkout.sessions.retrieve(req.query.session_id, async (err, session) => {
            
            if (err) {
                return res.render('error/404');
            }

            try {
                
                const session_id = await SessionId.findOne({ id: session.id }).lean();
                
                if (session_id) {
                    return res.render('error/404')
                } else {

                    try {
                        
                        let serviceJson = fs.readFileSync('./public/services.json');
                        let servicesObj = JSON.parse(serviceJson).services;

                        const item = servicesObj.find(el => el.id == session.metadata.serviceId)

                        if (!item) {
                            return res.render('error/500')
                        }
 
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'MagicHandsEmailer@gmail.com',
                                pass: 'MagicHands543534532'
                            }
                        });

                        //Confirmation code
                        const confirmationCode = Math.floor(100000 + Math.random() * 900000);
    
                        const mailOptions = {
                            from: 'MagicHandsEmailer@gmail.com',
                            to: 'sel_go86@yahoo.com',
                            subject: `Nueva Reservación de ${"dsds"}`,
                            text: `Nombre: ${session.metadata.customerName}, \nCorreo: ${session.metadata.customerEmail},
                            
                            \nServicio: ${item.name},
                            Duracion: ${session.metadata.duration},
                            Personas: ${session.metadata.quantity},
                            Precio: $${item.price * parseInt(session.metadata.duration) * parseInt(session.metadata.quantity)}
                            Codigo de confirmación: ${confirmationCode}`
                        };
    
                        transporter.sendMail(mailOptions, function(err, info){
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });

                        const customerMailOptions = {
                            from: 'MagicHandsEmailer@gmail.com',
                            to: session.metadata.customerEmail,
                            subject: `Reservación de Magic Hands`,
                            html:
                            `
                            <h3 font-weight: 400;">
                                Hola <b>${session.metadata.customerName}</b>, gracias por reservar con nosotros,
                                presente este codigo en caja o por el telefono que puede encontrar en
                                <a href="http://127.0.0.1:3000/contactanos">nuestra pagina</a>, para confirmar su compra.
                            </h3>

                            <h1 style="box-sizing: border-box; border: solid grey 1px; background-color: #6c6b6b30; padding: 20px; width: fit-content; border-radius: 2px;">${confirmationCode}</h1>

                            <h3 style="font-weight: 700;">Usted Ordeno:</h3>
                            <p>
                            Servicio: ${item.name}, <br>
                            Numero de horas: ${session.metadata.duration}hrs., <br>
                            Numero de personas: ${session.metadata.quantity},
                            </p>
                            
                            <p>Si usted no reservo con nosotros, ignore este mensaje.</p>
                            `
                        };
    
                        transporter.sendMail(customerMailOptions, function(err, info){
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });


                        res.render('checkout', { item: item, quantity: session.metadata.quantity, duration: session.metadata.duration });

                        await SessionId.create({ id: session.id });

                    } catch (err) {
                        console.error(err);
                        res.render('error/500');
                    }

                }

            } catch (err) {
                console.error(err);
                res.render('error/404')
            }
            
        });
    } else {
        res.render('error/404');
    }
    
});





module.exports = router;