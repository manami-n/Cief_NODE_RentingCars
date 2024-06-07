//Importing modules
const express = require('express');
const mysql = require('mysql');
const path = require('path'); 
const {connMySQL, configMySQL} = require('./mysql.js');

const routerPubl = express.Router();


//================= ROUTER ================

// ----- nav definition -----
let nav = [];
let selectNav = `SELECT tipo FROM modelos GROUP BY tipo`; // for menu bar
connMySQL.query(selectNav, (err, resNav) => {
    if (err) throw err;
    nav = resNav;
})

// ----- 0 : index -----
routerPubl.get("/", (req, res) => {
    req.session.request = null;
    //console.log(req.session)
    res.render("public/index", {
        titulo: "Inicio",
        nav
    })
})

// ----- 4 : client login(?) page ---
routerPubl.get("/cliente", (req, res) => {
    res.render("public/cliente", {
        titulo: "Reservación",
        rq : req.session.request,
        nav
    })
})

// ----- 5 : registering as client page ------
routerPubl.get("/registrar", (req, res) => {
    res.render("public/registrar", {
        titulo: "Registro de cliente",
        msj: req.query.m,
        nav
    })
})


// ----- 1 : category catalog -----
routerPubl.get("/:tp", (req, res) => {
    const {tp} = req.params;
    const vehiculos = `SELECT * FROM modelos WHERE tipo = '${tp}'`; // for vehicles list
    connMySQL.query(vehiculos, (err, resVehiculos) => {
        if (err) throw err;
        // when there's no such type in DB
        if (resVehiculos.length === 0) {
            res.status(404).render("public/error", {
                titulo: "404", 
                nav
            });
        } else {
        res.render("public/tipo", {
            titulo: tp,
            vehiculos: resVehiculos,
            nav
        })
    }
    })
})

// ----- 2 : model information page -----
routerPubl.get("/:tp/:md", (req, res) => {
    const {tp, md} = req.params; // {tp = coche, md = 3} ..etc
    const vehiculo = `SELECT * FROM modelos WHERE id_modelo = '${md}'`; // for vehicles list
    connMySQL.query(vehiculo, (err, resVehiculo) => {
        if (err) throw err;
        // when there's no such type in DB
        if (resVehiculo.length === 0) {
            return res.status(404).render("public/error", {
                titulo: "404", 
                nav
            });
        } 

        res.render("public/modelo", {
            titulo: tp,
            vc: resVehiculo[0],
            msj: req.query.m, // flagment of coming back from the /reservar page
            nav,
            oops : "No hay disponibilidad en días elegionados.",
            fecha : "No puedes elegir la fecha de entrega antes de la fecha de recogida."
        })
    })
})


// ----- 3 : availability check page ------
routerPubl.post("/disponibl", (req, res) => {
    const request = req.body; // { id_modelo = 3, tipo = coche, input_recogida = 2024-05-30, input_entrega = 2024-05-31 } etc
    //console.log(req.body)
    if (request.input_recogida > request.input_entrega){
        const redirectUrl = `/${request.tipo}/${request.id_modelo}?m=fecha`;
            return res.redirect(redirectUrl);
    }
    const consulta = `SELECT md.unidades_totales - COUNT(al.id_modelo) AS libre
                        FROM alquileres al
                        INNER JOIN modelos md
                        ON al.id_modelo = md.id_modelo
                        WHERE al.fecha_recogida <= '${request.input_entrega}'
                        AND al.fecha_entrega >= '${request.input_recogida}'
                        AND al.id_modelo = ${request.id_modelo};`
    const total = `SELECT id_modelo, nombre_modelo, precioDia,
                        '${request.input_entrega}' AS fecha_entrega, '${request.input_recogida}' AS fecha_recogida,
                        DATEDIFF('${request.input_entrega}', '${request.input_recogida}') +1 AS periodo, 
                        precioDia * (DATEDIFF('${request.input_entrega}', '${request.input_recogida}')+1) AS precioTotal 
                        FROM modelos
                        WHERE id_modelo = ${request.id_modelo}`
    // first query for car availability of the period.    
    connMySQL.query(consulta, (err, resConsulta) => {
        if (err) throw err;
        // if there is at least 1 car available.
        if (resConsulta[0].libre>0){   
            // second query for the total price of the period, and to save in session.
            connMySQL.query(total, (err, resTotal) => {
                if (err) throw err;
                //console.log(resTotal[0])
                // saving the request information to session.
                req.session.request = resTotal[0]
                //console.log('After setting session:', req.session);
                // redirect to the /reservar page, sending the info.
                return res.render("public/disponibl", {
                    titulo: "Reservar",
                    rq: req.session.request,
                    nav
                })
            })
        // if there is no car available
        } else {
            // flagment of the unavailable message.
            const redirectUrl = `/${request.tipo}/${request.id_modelo}?m=oops`;
            return res.redirect(redirectUrl);
        }
    })
})

// ------ 4.5 : Verify DNI -----
routerPubl.post("/verificar", (req, res) => {
    const {dni} = req.body;
    const select = `SELECT * FROM clientes WHERE dni = ${dni}`
    //query to search for DNI in database
    connMySQL.query(select, (err, resDni, fields) => { // { id_cliente: 1 }
        if (err) throw err;  
        //if the client is not found
        if (resDni.length === 0) {
            const redirectUrl = `/registrar?m=oops`;
            res.redirect(redirectUrl);
            // msj: req.query.m // flagment of coming back from the /reservar page
        
        } else { // if the client is found
            console.log(resDni[0].id_cliente);
            res.render("public/revision", {
                titulo: "Confirmación",
                rq: req.session.request,
                cl: resDni[0],
                nav
            })
        }
    })
})

// ----- 6 : Final check with datas ------
routerPubl.post("/revisar", (req, res) => {
    const cliente = req.body; 
    const insertClientes = `INSERT INTO clientes (nombre, apellido, dni, tel, email, poblacio, password)
                            VALUES ('${cliente.nombre}', '${cliente.apellido}', ${cliente.dni}, ${cliente.tel}, '${cliente.email}', '${cliente.poblacio}', '${cliente.password}');`
    const checkDni = `SELECT * FROM clientes WHERE dni = ${cliente.dni}`
    connMySQL.query(checkDni, (err, resDni, fields) => { // { id_cliente: 1 }
        if (err) throw err;
        //if the client is new
        if (resDni.length === 0) {
            //console.log('client is new')
            connMySQL.query(insertClientes, (err, resCliente, fields) => {
                if (err) throw err;
                console.log("insertado nuevo cliente");
                res.render("public/revision", {
                    titulo: "Confirmación",
                    rq: req.session.request,
                    cl: cliente,
                    nav
                })
            })
        } else { //if the client exists
            //console.log('client exists', resDni)
            res.render("public/revision", {
                titulo: "Confirmación",
                rq: req.session.request,
                cl: resDni[0],
                nav
            })
        }
    })
})

// ----- 7 : Reservation completed ------
routerPubl.post("/confirmar", (req, res) => {
    const dni = req.body.dni;
    const select = `SELECT id_cliente FROM clientes WHERE dni = ${dni}`;

    connMySQL.query(select, (err, resultadoDni, fields) => {
        if (err) throw err;
        const id_cliente = resultadoDni[0].id_cliente;
        const al = req.session.request;
        
        const insertAlquileres = `INSERT INTO alquileres (id_cliente, id_modelo, fecha_recogida, fecha_entrega, facturacion)
                                    VALUES (${id_cliente}, ${al.id_modelo}, '${al.fecha_recogida}', '${al.fecha_entrega}', ${al.precioTotal});`
        connMySQL.query(insertAlquileres, (err, resAlquiler, fields) => {
            if (err) throw err;
            console.log("insertado nuevo alquiler");
            //destroy the session
            // Clear the session data
            req.session.request = null;
            
                res.render("public/gracias", {
                    titulo: "Confirmación",
                    nav
                })
            
        })
    })  
})

routerPubl.get('*', (req, res) => {
    res.status(404).render("public/error", {
        titulo: "404", 
        nav
    });;
});

//========================================

//Export
module.exports = routerPubl;