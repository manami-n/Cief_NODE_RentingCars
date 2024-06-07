//Importing modules
const express = require('express');
const mysql = require('mysql');
const path = require('path'); 
//const connMySQL = require('./app.js');
const {connMySQL, configMySQL} = require('./mysql.js');
const routerPriv = express.Router();

//================= ROUTER ================

// ----- 0 : index -----
routerPriv.get("/", (req, res) => {
    const select = `SELECT md.*, 
                    SUM(al.facturacion) AS total_facturacion,
                    COUNT(CASE 
                            WHEN al.fecha_recogida <= curdate() 
                            AND al.fecha_entrega >= curdate() 
                            THEN al.id_modelo 
                          END) AS alquilado
                    FROM modelos md
                    LEFT JOIN alquileres al
                    ON al.id_modelo = md.id_modelo 
                    GROUP BY md.id_modelo;`
    connMySQL.query(select, (err, resSelect, fields) => {
        if (err) throw err;   
        res.render("private/index", {
        titulo: "Información de Modelos",
        datos: resSelect
        }); 
    }) 
})

// (INSERT) loading form page -- id:0 for new model
routerPriv.get("/stock", (req, res) => {
    res.render("private/stock", {
           titulo: "Introducir el nuevo modelo",
           id: 0
       })
})
//  ↓
// ----- 1 : new vehicle registration -----
routerPriv.post("/insert", (req, res) => {
    const {nombre_modelo, unidades_totales, personas, puertas, cambio, maletas, tipo, precioDia} = req.body
    const insert = `INSERT INTO modelos (nombre_modelo, unidades_totales, personas, puertas, cambio, maletas, tipo, precioDia) VALUES ('${nombre_modelo}','${unidades_totales}', '${personas}', '${puertas}','${cambio}','${maletas}','${tipo}', '${precioDia}')`
    connMySQL.query(insert, (err, resultado, fields) => {
        if (err) throw err
        res.redirect("/")  // Redirect to index page
      })
})

// ----- 2 : update vehicle -----
routerPriv.get("/stock/:id_modelo", (req, res) => {
    const {id_modelo} = req.params;
    const select = `SELECT * FROM modelos WHERE id_modelo = ${id_modelo}`;
    connMySQL.query(select, (err, resultado, fields) => {
       if (err) throw err;
       console.log(resultado)
           res.render("private/stock", {
           titulo: "Editar la informacion del modelo",
           id: 1,
           datos: resultado[0]
       });
    })
})
//  ↓
// ----- 2 : update button -----
routerPriv.post("/update", (req, res) => {
    const {id_modelo, nombre_modelo, unidades_totales, personas, puertas, cambio, maletas, tipo, precioDia} = req.body
    const update = `UPDATE modelos SET nombre_modelo = '${nombre_modelo}', unidades_totales = '${unidades_totales}', personas = '${personas}', puertas = '${puertas}', cambio = '${cambio}', maletas = '${maletas}', tipo = '${tipo}', precioDia = '${precioDia}' WHERE id_modelo = '${id_modelo}'`
    connMySQL.query(update, (err, resultado, fields) => {
        if (err) throw err
        res.redirect("/")  // Redirect to index page
      })
})

// 404
routerPriv.use((req,res) => {
    res.status(404).send("404 Not Found");
})

//Export
module.exports = routerPriv;